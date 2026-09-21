'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { isIterationBlock } = require('../dist/constants/analysisWorkflowBlock');

const DATA = {
  items: [1, 5, 8, 2, 9],
  items7: [1, 5, 7, 9],
  groups: [[1, 9], [3, 7, 12]],
  endpoints: [{ name: 'E1', value: 3 }, { name: 'E2', value: 15 }, { name: 'E3', value: 8 }],
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const overrides = {
  GET_NODE_CHILDREN: H.fakeAlgorithm('GET_NODE_CHILDREN', async (_input, params) => H.clone(DATA[params.regex])),
  VALUE_OF: H.fakeAlgorithm('VALUE_OF', async (input) => input.value),
  IS_ABOVE: H.fakeAlgorithm('IS_ABOVE', async ([value, threshold]) => value > threshold),
  // Finishes sooner for LARGER values, so completion order is the reverse of input order.
  IS_ABOVE_SLOW: H.fakeAlgorithm('IS_ABOVE_SLOW', async ([value, threshold]) => {
    await sleep(Math.max(1, 15 - value) * 8);
    return value > threshold;
  }),
  FAILS_ON_7: H.fakeAlgorithm('FAILS_ON_7', async (input) => {
    if (input === 7) throw new Error('sensor 7 offline');
    return input > 4;
  }),
  ALWAYS_FAILS: H.fakeAlgorithm('ALWAYS_FAILS', async () => { throw new Error('boom'); }),
};
const registry = H.makeRegistry(overrides);
const executor = H.makeExecutor(registry);
const run = (dag, errorPolicy) => H.runDag(executor, dag, { errorPolicy });

const graph = new H.SpinalGraph('filter');
const anchor = H.createAnchor('Room');
const analysis = (analysisName, blocks, extra = {}) =>
  ({ contextName: 'Ctx filter', analysisName, anchorNodeId: anchor.id, executionWorkflow: { blocks }, ...extra });
const source = (ref, regex) => ({ ref, algorithmName: 'GET_NODE_CHILDREN', inputs: ['$node'], parameters: { regex } });
const build = async (cfg) => {
  assert.deepEqual(H.factory.validateConfig(cfg), []);
  return H.createAndLoad(cfg, graph);
};

describe('FILTER block', () => {
  it('is in the catalog and shares the iteration-block storage with FOREACH', () => {
    assert.equal(H.mod.ALGORITHM_REGISTRY.get('FILTER').name, 'FILTER');
    assert.deepEqual(['FOREACH', 'FILTER', 'IF'].map(isIterationBlock), [true, true, false]);
  });

  it('keeps the INPUT elements whose predicate is true, in input order', async () => {
    const { dag } = await build(analysis('basic', [
      source('Nums', 'items'),
      { ref: 'Big', algorithmName: 'FILTER', inputs: ['Nums'], itemRef: 'n', subWorkflow: { outputRef: 'Test', blocks: [
        { ref: 'Test', algorithmName: 'GREATER_THAN', inputs: ['n'], parameters: { threshold: 4 } },
      ] } },
    ]));
    const ctx = await run(dag);
    assert.deepEqual(H.outputOf(dag, ctx, 'Big'), [5, 8, 9]);
  });

  it('predicate may read an outer block declared AFTER the FILTER (ordered, no leak, slot 0 kept)', async () => {
    const { dag } = await build(analysis('outer ref', [
      source('EPs', 'endpoints'),
      { ref: 'Hot', algorithmName: 'FILTER', inputs: ['EPs'], itemRef: 'ep', subWorkflow: { outputRef: 'Above', blocks: [
        { ref: 'Val', algorithmName: 'VALUE_OF', inputs: ['ep'] },
        { ref: 'Above', algorithmName: 'IS_ABOVE', inputs: ['Val', 'Threshold'] },
      ] } },
      { ref: 'Threshold', algorithmName: 'CONSTANT_NUMBER', parameters: { value: 5 } },
    ]));
    const hot = H.blockByName(dag, 'Hot');
    assert.deepEqual(H.blockNames(dag), ['EPs', 'Hot', 'Threshold']);
    assert.equal(hot.inputBlockIds[0], H.blockByName(dag, 'EPs').id);
    assert.ok(hot.inputBlockIds.includes(H.blockByName(dag, 'Threshold').id));
    const ctx = await run(dag);
    assert.deepEqual(H.outputOf(dag, ctx, 'Hot').map((e) => e.name), ['E2', 'E3']);
  });

  const nestedConfig = (name) => analysis(name, [
    source('Groups', 'groups'),
    { ref: 'Loop', algorithmName: 'FOREACH', inputs: ['Groups'], itemRef: 'g', subWorkflow: { outputRef: 'Keep', blocks: [
      { ref: 'Keep', algorithmName: 'FILTER', inputs: ['g'], itemRef: 'x', subWorkflow: { outputRef: 'Above', blocks: [
        { ref: 'Above', algorithmName: 'IS_ABOVE', inputs: ['x', 'Threshold'] },
      ] } },
    ] } },
    { ref: 'Threshold', algorithmName: 'CONSTANT_NUMBER', parameters: { value: 5 } },
  ]);

  it('nests inside a FOREACH and reads a grandparent ref', async () => {
    const { dag } = await build(nestedConfig('nested'));
    const ctx = await run(dag);
    assert.deepEqual(H.outputOf(dag, ctx, 'Loop'), [[9], [7, 12]]);
  });

  it('round-trips through getAnalyticDetails and re-creates identically', async () => {
    const { node } = await build(nestedConfig('nested round trip'));
    const details = await H.manager.getAnalyticDetails(node);
    const dLoop = details.executionWorkflow.blocks.find((b) => b.ref === 'Loop');
    const dKeep = dLoop.subWorkflow.blocks.find((b) => b.ref === 'Keep');
    assert.deepEqual(dLoop.inputs, ['Groups'], 'synthetic ordering dep is not emitted');
    assert.deepEqual(
      { algorithmName: dKeep.algorithmName, itemRef: dKeep.itemRef, inputs: dKeep.inputs, outputRef: dKeep.subWorkflow.outputRef },
      { algorithmName: 'FILTER', itemRef: 'x', inputs: ['g'], outputRef: 'Above' }
    );
    assert.deepEqual(dKeep.subWorkflow.blocks[0].inputs, ['x', 'Threshold']);

    const resaved = { ...H.clone(details), analysisName: 'nested (re-saved)', anchorNodeId: anchor.id };
    delete resaved.analysisId;
    const { dag } = await build(resaved);
    const ctx = await run(dag);
    assert.deepEqual(H.outputOf(dag, ctx, 'Loop'), [[9], [7, 12]]);
  });

  it('honors its concurrency config, keeps input order, and round-trips the config', async () => {
    const { node, dag } = await build(analysis('concurrency', [
      source('Nums', 'items'),
      { ref: 'Big', algorithmName: 'FILTER', inputs: ['Nums'], itemRef: 'n', concurrency: { mode: 'FULL' }, subWorkflow: { outputRef: 'T', blocks: [
        { ref: 'T', algorithmName: 'IS_ABOVE_SLOW', inputs: ['n', 'Four'] },
      ] } },
      { ref: 'Four', algorithmName: 'CONSTANT_NUMBER', parameters: { value: 4 } },
    ]));
    const started = Date.now();
    const ctx = await run(dag);
    const elapsed = Date.now() - started;
    assert.deepEqual(H.outputOf(dag, ctx, 'Big'), [5, 8, 9], 'input order despite reverse completion order');
    assert.ok(elapsed < 300, `FULL mode should overlap the iterations (sequential ≈ 400ms), took ${elapsed}ms`);
    const details = await H.manager.getAnalyticDetails(node);
    assert.deepEqual(details.executionWorkflow.blocks.find((b) => b.ref === 'Big').concurrency, { mode: 'FULL' });
  });

  it('rejects a non-boolean predicate with a clear error', async () => {
    const { dag } = await build(analysis('non-boolean', [
      source('Nums', 'items'),
      { ref: 'Bad', algorithmName: 'FILTER', inputs: ['Nums'], itemRef: 'n', subWorkflow: { outputRef: 'Dbl', blocks: [
        { ref: 'Dbl', algorithmName: 'MULTIPLY_PARAM', inputs: ['n'], parameters: { value: 2 } },
      ] } },
    ]));
    await assert.rejects(() => run(dag), /FILTER block "Bad" expects its sub-workflow output to be a boolean predicate, got number 2 for element 0/);
  });

  it('under errorPolicy=continue, a failing predicate drops its element and is recorded; under stop it aborts', async () => {
    const { dag } = await build(analysis('continue', [
      source('Nums7', 'items7'),
      { ref: 'Keep', algorithmName: 'FILTER', inputs: ['Nums7'], itemRef: 'n', subWorkflow: { outputRef: 'P', blocks: [
        { ref: 'P', algorithmName: 'FAILS_ON_7', inputs: ['n'] },
      ] } },
    ]));
    const ctx = await run(dag, 'continue');
    assert.deepEqual(H.outputOf(dag, ctx, 'Keep'), [5, 9]);
    assert.deepEqual(ctx.failures.map((f) => [f.algorithmName, f.reason]), [['FAILS_ON_7', 'error']]);
    await assert.rejects(() => run(dag, 'stop'), /sensor 7 offline/);
  });

  it('is validated like FOREACH', () => {
    const predicate = (inputs) => ({ ref: 'T', algorithmName: 'GREATER_THAN', inputs, parameters: { threshold: 1 } });
    const noItemRef = analysis('no itemRef', [source('Nums', 'items'),
      { ref: 'F', algorithmName: 'FILTER', inputs: ['Nums'], subWorkflow: { outputRef: 'T', blocks: [predicate(['n'])] } }]);
    assert.ok(H.factory.validateConfig(noItemRef).some((e) => /FILTER block must have "itemRef"/.test(e)));
    const badRef = analysis('bad ref', [source('Nums', 'items'),
      { ref: 'F', algorithmName: 'FILTER', inputs: ['Nums'], itemRef: 'n', subWorkflow: { outputRef: 'T', blocks: [predicate(['Nope'])] } }]);
    assert.ok(H.factory.validateConfig(badRef).some((e) => /input "Nope" does not resolve/.test(e)));
  });
});

describe('errorPolicy on single-work-node (COV-style) runs', () => {
  const failing = [
    { ref: 'Boom', algorithmName: 'ALWAYS_FAILS' },
    { ref: 'Ok', algorithmName: 'CONSTANT_NUMBER', parameters: { value: 1 } },
  ];
  const service = new H.AnalysisExecutionService(H.manager, registry);

  it("stop: the run fails hard (it used to silently run as 'continue')", async () => {
    const node = await H.factory.createFromJSON(analysis('policy stop', failing, { errorPolicy: 'stop' }), graph);
    const [result] = (await service.executeAnalysisForWorkNode(node, anchor.node)).results;
    assert.equal(result.success, false);
    assert.match(result.error, /Boom/);
  });

  it('continue: the run succeeds with the failure isolated in blockFailures', async () => {
    const node = await H.factory.createFromJSON(analysis('policy continue', failing, { errorPolicy: 'continue' }), graph);
    const [result] = (await service.executeAnalysisForWorkNode(node, anchor.node)).results;
    assert.equal(result.success, true);
    assert.equal(result.blockFailures.length, 1);
    assert.equal(result.executionOutputs.Ok, 1);
  });
});

describe('FILTER by a graph relation — "rooms that belong to the group Bureaux"', () => {
  const { SPINAL_RELATION_PTR_LST_TYPE } = require('spinal-env-viewer-graph-service');
  // Real catalog, real graph reads: no stand-ins at all.
  const realExecutor = H.makeExecutor(H.makeRegistry({}));

  it('GET_NODE_PARENT(ifNotFound: null) → EXISTS keeps exactly the rooms under Bureaux', async () => {
    const building = H.createAnchor('Building').node;
    const bureaux = H.createAnchor('Bureaux').node;
    const cuisine = H.createAnchor('Cuisine').node;
    const rooms = ['R1', 'R2', 'R3'].map((name) => H.createAnchor(name).node);
    for (const room of rooms) await building.addChild(room, 'hasGeographicRoom', SPINAL_RELATION_PTR_LST_TYPE);
    await bureaux.addChild(rooms[0], 'groupHasgeographicRoom', SPINAL_RELATION_PTR_LST_TYPE);
    await bureaux.addChild(rooms[2], 'groupHasgeographicRoom', SPINAL_RELATION_PTR_LST_TYPE);
    await cuisine.addChild(rooms[1], 'groupHasgeographicRoom', SPINAL_RELATION_PTR_LST_TYPE);

    const { dag } = await build(analysis('rooms of Bureaux', [
      { ref: 'Rooms', algorithmName: 'GET_NODE_CHILDREN', inputs: ['$node'], parameters: { regex: 'hasGeographicRoom' } },
      { ref: 'Bureaux rooms', algorithmName: 'FILTER', inputs: ['Rooms'], itemRef: 'room', subWorkflow: { outputRef: 'Is in Bureaux', blocks: [
        { ref: 'Bureaux group', algorithmName: 'GET_NODE_PARENT', inputs: ['room'],
          parameters: { regex: 'groupHasgeographicRoom', filterProperty: 'name', regexFilter: '^Bureaux$', ifNotFound: 'null' } },
        { ref: 'Is in Bureaux', algorithmName: 'EXISTS', inputs: ['Bureaux group'] },
      ] } },
    ]));
    const ctx = await H.runDag(realExecutor, dag, { workNode: building });
    assert.deepEqual(H.outputOf(dag, ctx, 'Bureaux rooms').map((n) => n.getName().get()), ['R1', 'R3']);
    assert.deepEqual(ctx.failures, [], 'no per-room failure noise');
  });
});
