'use strict';
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

// A production config whose innermost block (SET_ATTRIBUTE, two FOREACH levels deep) reads a
// top-level block declared after the FOREACH. It used to be rejected by the builder.
const fixture = require('./fixtures/telecommande-light.json');

// Stand-ins: graph reads return deterministic building data; the writer records its calls.
let calls = [];
const overrides = {
  GET_NODE_CHILDREN: H.fakeAlgorithm('GET_NODE_CHILDREN', async (input, params) => {
    if (params.regex === 'hasBimObject') {
      calls.push('Room BimObjects');
      return ['Luminaires-1', 'Other-1', 'Luminaires-2'];
    }
    if (params.regex === 'items') return [1, 2, 3];
    calls.push(`BimObject Endpoints(${input})`);
    return [`${input}/LightCmd-a`, `${input}/Temp`, `${input}/LightCmd-b`];
  }),
  FILTER_NODE: H.fakeAlgorithm('FILTER_NODE', async (input, params) => {
    const re = new RegExp(params.regexFilter);
    return (Array.isArray(input) ? input : [input]).filter((x) => re.test(String(x).split('/').pop()));
  }),
  SET_ATTRIBUTE: H.fakeAlgorithm('SET_ATTRIBUTE', async (input) => {
    calls.push(`SET_ATTRIBUTE input=${JSON.stringify(input)}`);
    return input;
  }),
  // The real MULTIPLY_PARAM, instrumented to record when it ran.
  MULTIPLY_PARAM: (() => {
    const real = H.mod.ALGORITHM_REGISTRY.get('MULTIPLY_PARAM');
    return H.core.createAlgorithm({
      ...real,
      run: async (input, params, context) => {
        const result = await real.run(input, params, context);
        calls.push(`MULTIPLY_PARAM -> ${result}`);
        return result;
      },
    });
  })(),
};
const executor = H.makeExecutor(H.makeRegistry(overrides));
const run = (dag, registers) => H.runDag(executor, dag, { registers });

const graph = new H.SpinalGraph('nested-refs');
const anchor = H.createAnchor();
const config = () => ({ ...H.clone(fixture), anchorNodeId: anchor.id });

// The same config with a cycle the validator cannot see (a sub-block reading its own container):
// only the builder rejects it, so it exercises the rollback paths.
const SELF_REFERENCE = /referenced from inside its own sub-workflow/;
const brokenConfig = () => {
  const cfg = config();
  cfg.analysisName = 'Broken';
  cfg.executionWorkflow.blocks
    .find((b) => b.ref === 'Foreach Luminaire')
    .subWorkflow.blocks.find((b) => b.ref === 'BimObject Endpoints').inputs = ['Foreach Luminaire'];
  return cfg;
};

describe('a sub-block may read a block from any enclosing scope', () => {
  let analysis;
  let top;
  let outer;
  let inner;
  const topBlock = (name) => H.blockByName(top, name);

  before(async () => {
    const cfg = config();
    assert.deepEqual(H.factory.validateConfig(cfg), []);
    ({ node: analysis, dag: top } = await H.createAndLoad(cfg, graph));
    outer = topBlock('Foreach Luminaire');
    inner = outer.subWorkflow.blocks.find((b) => b.name === 'Foreach LightCmd');
  });

  it('builds each scope as its own DAG — no sub-block leaks into an outer workflow', () => {
    assert.deepEqual(H.blockNames(top), [
      'Foreach Luminaire', 'Light command multiplied by 100', 'Luminaires BimObjects', 'Room BimObjects', '_COMMAND_LIGHT Value',
    ].sort());
    assert.deepEqual(outer.subWorkflow.blocks.map((b) => b.name).sort(), ['BimObject Endpoints', 'Foreach LightCmd', 'LightCmd endpoints']);
    assert.deepEqual(inner.subWorkflow.blocks.map((b) => b.name), ['Update controlValue attribute']);
  });

  it('orders the OUTER container after the top-level block its grandchild reads, keeping slot 0', () => {
    assert.equal(outer.inputBlockIds[0], topBlock('Luminaires BimObjects').id, 'slot 0 is still the iteration collection');
    assert.ok(outer.inputBlockIds.includes(topBlock('Light command multiplied by 100').id));
    assert.deepEqual(
      inner.inputBlockIds,
      [outer.subWorkflow.blocks.find((b) => b.name === 'LightCmd endpoints').id],
      'the inner container carries no cross-scope dependency'
    );
  });

  it('round-trips: the fetched config keeps the two-levels-up ref and re-creates cleanly', async () => {
    const details = await H.manager.getAnalyticDetails(analysis);
    const dOuter = details.executionWorkflow.blocks.find((b) => b.ref === 'Foreach Luminaire');
    const dInner = dOuter.subWorkflow.blocks.find((b) => b.ref === 'Foreach LightCmd');
    const dSet = dInner.subWorkflow.blocks.find((b) => b.ref === 'Update controlValue attribute');
    assert.deepEqual(dOuter.inputs, ['Luminaires BimObjects'], 'the synthetic ordering dependency is not emitted');
    assert.deepEqual(dInner.inputs, ['LightCmd endpoints']);
    assert.deepEqual(dSet.inputs, ['Light command multiplied by 100']);

    const resaved = { ...H.clone(details), analysisName: 'Telecommande Light (re-saved)', anchorNodeId: anchor.id };
    delete resaved.analysisId;
    await H.factory.createFromJSON(resaved, graph);
  });

  it('runs: the top-level block executes before the outer container, and the innermost block sees its value', async () => {
    calls = [];
    await run(top, [['_COMMAND_LIGHT Value', 0.5]]);
    const multiplyAt = calls.indexOf('MULTIPLY_PARAM -> 50');
    const firstIterationAt = calls.findIndex((c) => c.startsWith('BimObject Endpoints'));
    assert.ok(multiplyAt >= 0 && multiplyAt < firstIterationAt, `expected MULTIPLY_PARAM before any iteration, got ${JSON.stringify(calls)}`);
    const sets = calls.filter((c) => c.startsWith('SET_ATTRIBUTE'));
    assert.equal(sets.length, 4, '2 luminaires × 2 LightCmd endpoints');
    assert.ok(sets.every((c) => c === 'SET_ATTRIBUTE input=50'));
  });

  it('(fixture caveat) the real SET_ATTRIBUTE rejects a value-only input — it needs [node, value]', async () => {
    const real = H.mod.ALGORITHM_REGISTRY.get('SET_ATTRIBUTE');
    await assert.rejects(() => real.run(50, { categoryName: 'default', label: 'controlValue' }), /expects 2 inputs/);
  });
});

describe('regressions', () => {
  it('single level: a FOREACH sub-block reads a parent declared after the FOREACH', async () => {
    const cfg = { contextName: 'Ctx regressions', analysisName: 'single-level parent ref', executionWorkflow: { blocks: [
      { ref: 'Loop', algorithmName: 'FOREACH', inputs: ['Items'], itemRef: 'it', subWorkflow: { outputRef: 'Scaled', blocks: [
        { ref: 'Scaled', algorithmName: 'MULTIPLY_PARAM', inputs: ['Factor'], parameters: { value: 1 } },
      ] } },
      { ref: 'Items', algorithmName: 'GET_NODE_CHILDREN', inputs: ['$node'], parameters: { regex: 'items' } },
      { ref: 'Factor', algorithmName: 'CONSTANT_NUMBER', parameters: { value: 7 } },
    ] } };
    const { dag } = await H.createAndLoad(cfg, graph);
    const ctx = await run(dag);
    assert.deepEqual(H.outputOf(dag, ctx, 'Loop'), [7, 7, 7]);
  });

  it('IF inside FOREACH: validates, leaks nothing, and the FOREACH is ordered after both outer refs', async () => {
    const cfg = { contextName: 'Ctx regressions', analysisName: 'IF in FOREACH', executionWorkflow: { blocks: [
      { ref: 'Loop', algorithmName: 'FOREACH', inputs: ['Items'], itemRef: 'it', subWorkflow: { outputRef: 'Gate', blocks: [
        { ref: 'Gate', algorithmName: 'IF', inputs: ['Flag'], thenWorkflow: { outputRef: 'Use', blocks: [
          { ref: 'Use', algorithmName: 'MULTIPLY_PARAM', inputs: ['Factor'], parameters: { value: 2 } },
        ] } },
      ] } },
      { ref: 'Items', algorithmName: 'GET_NODE_CHILDREN', inputs: ['$node'], parameters: { regex: 'items' } },
      { ref: 'Flag', algorithmName: 'CONSTANT_NUMBER', parameters: { value: 1 } },
      { ref: 'Factor', algorithmName: 'CONSTANT_NUMBER', parameters: { value: 7 } },
    ] } };
    assert.deepEqual(H.factory.validateConfig(cfg), []);
    const { dag } = await H.createAndLoad(cfg, graph);
    const loop = H.blockByName(dag, 'Loop');
    assert.deepEqual(H.blockNames(dag), ['Factor', 'Flag', 'Items', 'Loop']);
    assert.ok(['Flag', 'Factor'].every((name) => loop.inputBlockIds.includes(H.blockByName(dag, name).id)));
  });
});

describe('a failed create rolls back', () => {
  it('the broken config is a builder-only error — validateConfig cannot see it', () => {
    assert.deepEqual(H.factory.validateConfig(brokenConfig()), []);
  });

  it('into a NEW context: removes the partial analysis and the context it created', async () => {
    const fresh = new H.SpinalGraph('fresh');
    await assert.rejects(() => H.factory.createFromJSON(brokenConfig(), fresh), SELF_REFERENCE);
    assert.equal(await H.manager.getContext(brokenConfig().contextName, fresh), undefined);
  });

  it('into an EXISTING context: leaves the context and its analyses untouched', async () => {
    const contextNode = await H.manager.createContext(config().contextName, graph); // get-or-create
    const before = (await H.manager.getAnalysisNodesByContextNode(contextNode)).length;
    await assert.rejects(() => H.factory.createFromJSON(brokenConfig(), graph), SELF_REFERENCE);
    assert.equal((await H.manager.getAnalysisNodesByContextNode(contextNode)).length, before);
  });

  it('with an anchor node that is not loaded: leaves nothing behind', async () => {
    const fresh = new H.SpinalGraph('fresh-anchor');
    const cfg = { ...config(), analysisName: 'Bad anchor', anchorNodeId: 'SpinalNode-does-not-exist' };
    await assert.rejects(() => H.factory.createFromJSON(cfg, fresh), /not found in graph/);
    assert.equal(await H.manager.getContext(cfg.contextName, fresh), undefined);
  });
});

describe('a failed update restores the previous definition', () => {
  it('leaves the analysis identical to before, and still runnable', async () => {
    const { node } = await H.createAndLoad({ ...config(), analysisName: 'Restorable' }, graph);
    const strip = (details) => { const copy = H.clone(details); delete copy.analysisId; return copy; };
    const before = strip(await H.manager.getAnalyticDetails(node));

    await assert.rejects(() => H.factory.updateFromJSON(node, { ...brokenConfig(), analysisName: 'Renamed' }), SELF_REFERENCE);

    assert.deepEqual(strip(await H.manager.getAnalyticDetails(node)), before);
    const restored = await H.blockManager.loadWorkflowDAG(await H.manager.getAnalysisExecutionWorkflowNode(node));
    calls = [];
    await run(restored, [['_COMMAND_LIGHT Value', 0.5]]);
    assert.equal(calls.filter((c) => c === 'SET_ATTRIBUTE input=50').length, 4);
  });
});
