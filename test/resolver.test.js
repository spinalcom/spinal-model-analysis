'use strict';
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { SpinalContext, SpinalGraphService, SPINAL_RELATION_PTR_LST_TYPE: PTR_LST } = require('spinal-env-viewer-graph-service');

const makeNode = (name, type) => SpinalGraphService.getRealNode(SpinalGraphService.createNode({ name, type }, undefined));
const names = (nodes) => nodes.map((n) => n.getName().get()).sort();

const STEP = 'SpinalSystemServiceTicketTypeStep';
const HAS_STEP = 'SpinalSystemServiceTicketHasStep';
const HAS_TICKET = 'SpinalSystemServiceTicketHasTicket';

// Context → Process → Steps → Tickets; "Shared" is linked under two steps.
const graph = new H.SpinalGraph('resolver');
let ticketContext;
before(async () => {
  ticketContext = new SpinalContext('Tickets resolver', 'SpinalSystemServiceTicket');
  await graph.addContext(ticketContext);
  await SpinalGraphService.setGraph(graph);
  const processNode = makeNode('Clim', 'SpinalServiceTicketProcess');
  await ticketContext.addChildInContext(processNode, 'SpinalSystemServiceTicketHasProcess', PTR_LST, ticketContext);
  const shared = makeNode('Shared', 'SpinalSystemServiceTicketTypeTicket');
  for (const [stepName, tickets] of Object.entries({ 'En attente': ['T1', 'T2'], 'En cours': ['T3'] })) {
    const step = makeNode(stepName, STEP);
    await processNode.addChildInContext(step, HAS_STEP, PTR_LST, ticketContext);
    for (const t of tickets) await step.addChildInContext(makeNode(t, 'SpinalSystemServiceTicketTypeTicket'), HAS_TICKET, PTR_LST, ticketContext);
    await step.addChildInContext(shared, HAS_TICKET, PTR_LST, ticketContext);
  }
});

/** The work nodes of a resolver, from both runners: COV binding and execution. */
async function workNodesOf(analysisName, blocks) {
  const node = await H.factory.createFromJSON({
    contextName: 'Ctx resolver', analysisName, anchorNodeId: ticketContext.getId().get(), worknodeResolver: { blocks },
  }, graph);
  const viaBinding = await H.mod.spinalAnalysisTriggerService.resolveCOVWorkNodes(node);
  const run = await new H.AnalysisExecutionService(H.manager, H.makeRegistry({})).executeAnalysis(node);
  return { viaBinding: names(viaBinding), viaExecution: run.results.map((r) => r.workNodeName).sort() };
}
const steps = { ref: 'Steps', algorithmName: 'FIND_IN_CONTEXT', inputs: ['$node'], parameters: { type: STEP } };

describe('work node resolver output', () => {
  it('a FOREACH output (one list per element) is flattened, and a node listed twice runs once', async () => {
    const result = await workNodesOf('FOREACH resolver', [steps,
      { ref: 'Per step', algorithmName: 'FOREACH', inputs: ['Steps'], itemRef: 'step', subWorkflow: { outputRef: 'Tickets', blocks: [
        { ref: 'Tickets', algorithmName: 'GET_NODE_CHILDREN', inputs: ['step'], parameters: { regex: HAS_TICKET } },
      ] } },
    ]);
    assert.deepEqual(result, { viaBinding: ['Shared', 'T1', 'T2', 'T3'], viaExecution: ['Shared', 'T1', 'T2', 'T3'] });
  });

  it('nothing means no work node — not the anchor (IF without "else", lookup with ifNotFound null)', async () => {
    const noElse = await workNodesOf('IF without else', [
      { ref: 'Type', algorithmName: 'GET_NODE_INFO', inputs: ['$node'], parameters: { property: 'type' } },
      { ref: 'Is building', algorithmName: 'EQUALS_PARAM', inputs: ['Type'], parameters: { expected: 'geographicBuilding' } },
      { ref: 'Pick', algorithmName: 'IF', inputs: ['Is building'], thenWorkflow: { outputRef: 'Rooms', blocks: [
        { ref: 'Rooms', algorithmName: 'GET_NODE_CHILDREN', inputs: ['$node'] },
      ] } },
    ]);
    assert.deepEqual(noElse, { viaBinding: [], viaExecution: [] });
    const notFound = await workNodesOf('ifNotFound null', [
      { ref: 'Missing', algorithmName: 'GET_NODE_CHILD', inputs: ['$node'], parameters: { regexFilter: '^Nope$', ifNotFound: 'null' } },
    ]);
    assert.deepEqual(notFound, { viaBinding: [], viaExecution: [] });
  });

  it('a resolver that outputs something other than nodes fails clearly, in both runners', async () => {
    const node = await H.factory.createFromJSON({
      contextName: 'Ctx resolver', analysisName: 'Outputs a name', anchorNodeId: ticketContext.getId().get(),
      worknodeResolver: { blocks: [{ ref: 'Name', algorithmName: 'GET_NODE_INFO', inputs: ['$node'] }] },
    }, graph);
    const expected = /must output nodes \(a node or a list of nodes\), got string "Tickets resolver"/;
    await assert.rejects(() => H.mod.spinalAnalysisTriggerService.resolveCOVWorkNodes(node), expected);
    await assert.rejects(() => new H.AnalysisExecutionService(H.manager, H.makeRegistry({})).executeAnalysis(node), expected);
  });

  it('no resolver blocks still means "work on the anchor node"', async () => {
    assert.deepEqual(await workNodesOf('No resolver', []), { viaBinding: ['Tickets resolver'], viaExecution: ['Tickets resolver'] });
  });
});

describe('RANDOM_NUMBER', () => {
  it('accepts numeric strings for min / max, like the other numeric blocks', async () => {
    const random = H.mod.ALGORITHM_REGISTRY.get('RANDOM_NUMBER');
    for (let i = 0; i < 20; i++) {
      const value = await random.run([], { min: '18', max: '24' });
      assert.ok(value >= 18 && value < 24, `${value} in [18, 24)`);
    }
    assert.equal(await random.run([], { min: '3', max: '3', integer: 'true' }), 3);
    await assert.rejects(() => random.run([], { min: 'abc', max: '2' }), /Expected a number .* for RANDOM_NUMBER min/);
  });
});
