'use strict';
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { SpinalContext, SpinalGraphService, SPINAL_RELATION_PTR_LST_TYPE: PTR_LST } = require('spinal-env-viewer-graph-service');

const algo = (name) => H.mod.ALGORITHM_REGISTRY.get(name);
const makeNode = (name, type) => SpinalGraphService.getRealNode(SpinalGraphService.createNode({ name, type }, undefined));
const names = (nodes) => nodes.map((n) => n.getName().get()).sort();

const TICKET = 'SpinalSystemServiceTicketTypeTicket';
const STEP = 'SpinalSystemServiceTicketTypeStep';
const HAS_PROCESS = 'SpinalSystemServiceTicketHasProcess';
const HAS_STEP = 'SpinalSystemServiceTicketHasStep';
const HAS_TICKET = 'SpinalSystemServiceTicketHasTicket';

// A ticket context as the BOS builds it: Context → Processes → Steps → Tickets, all linked in context.
const graph = new H.SpinalGraph('find-in-context');
let ticketContext;
let otherContext;
let climProcess;
let stepsByName; // "<process>/<step>" → step node
before(async () => {
  ticketContext = new SpinalContext('Tickets', 'SpinalSystemServiceTicket');
  otherContext = new SpinalContext('Autre', 'geographicContext');
  await graph.addContext(ticketContext);
  await graph.addContext(otherContext);
  await SpinalGraphService.setGraph(graph);

  stepsByName = {};
  const layout = {
    Clim: { 'En attente': ['C1', 'C2'], 'En cours': ['C3'], Terminées: ['C4'] },
    Elec: { 'En attente': ['E1'], Terminées: ['E2', 'E3'] },
  };
  for (const [processName, steps] of Object.entries(layout)) {
    const processNode = makeNode(processName, 'SpinalServiceTicketProcess');
    await ticketContext.addChildInContext(processNode, HAS_PROCESS, PTR_LST, ticketContext);
    if (processName === 'Clim') climProcess = processNode;
    for (const [stepName, tickets] of Object.entries(steps)) {
      const step = makeNode(stepName, STEP);
      await processNode.addChildInContext(step, HAS_STEP, PTR_LST, ticketContext);
      stepsByName[`${processName}/${stepName}`] = step;
      for (const ticketName of tickets) {
        await step.addChildInContext(makeNode(ticketName, TICKET), HAS_TICKET, PTR_LST, ticketContext);
      }
    }
  }
  // Linked to a step, but NOT in the context: findInContext must not see it.
  await stepsByName['Clim/En attente'].addChild(makeNode('Hors contexte', TICKET), HAS_TICKET, PTR_LST);
});

describe('FIND_IN_CONTEXT', () => {
  const find = (start, params) => algo('FIND_IN_CONTEXT').run(start, params);

  it('finds every node of a type under the context, at any depth — only through the context\'s relations', async () => {
    assert.deepEqual(names(await find(ticketContext, { type: TICKET })), ['C1', 'C2', 'C3', 'C4', 'E1', 'E2', 'E3']);
  });

  it('type + regexFilter: e.g. every step except "Terminées"', async () => {
    const steps = await find(ticketContext, { type: STEP, regexFilter: '^(?!Terminées$)' });
    assert.deepEqual(names(steps), ['En attente', 'En attente', 'En cours']);
  });

  it('from a node of the context (contextName), or a list of start nodes merged without duplicates', async () => {
    assert.deepEqual(names(await find(climProcess, { type: TICKET, contextName: 'Tickets' })), ['C1', 'C2', 'C3', 'C4']);
    const both = await find([climProcess, stepsByName['Clim/En cours'], climProcess], { type: TICKET, contextName: 'Tickets' });
    assert.deepEqual(names(both), ['C1', 'C2', 'C3', 'C4'], 'C3 found from both starts, returned once');
    assert.deepEqual(await find(climProcess, { type: 'SpinalServiceTicketProcess', contextName: 'Tickets' }), [], 'the start is never returned');
  });

  it('refuses ambiguous or impossible searches with a clear error', async () => {
    await assert.rejects(() => find(climProcess, { type: TICKET }), /"Clim" is not a context — set "contextName"/);
    await assert.rejects(() => find(climProcess, { type: TICKET, contextName: 'Autre' }), /"Clim" does not belong to context "Autre"/);
    await assert.rejects(() => find(ticketContext, { type: TICKET, contextName: 'Nope' }), /no context named "Nope"/);
    await assert.rejects(() => find(ticketContext, {}), /needs a "type" and\/or a "regexFilter"/);
    await assert.rejects(() => find(ticketContext, { regexFilter: '(' }), /invalid "regexFilter"/);
  });
});

describe('GET_NODE_CHILDREN / GET_NODE_PARENTS take a list of nodes', () => {
  it('children of several steps, merged without duplicates; a single node still works', async () => {
    const steps = [stepsByName['Clim/En attente'], stepsByName['Clim/En cours'], stepsByName['Clim/En attente']];
    assert.deepEqual(names(await algo('GET_NODE_CHILDREN').run(steps, { regex: HAS_TICKET })), ['C1', 'C2', 'C3', 'Hors contexte']);
    assert.deepEqual(names(await algo('GET_NODE_CHILDREN').run(stepsByName['Elec/Terminées'], { regex: HAS_TICKET })), ['E2', 'E3']);
    await assert.rejects(() => algo('GET_NODE_CHILDREN').run('nope', {}), /expects a SpinalNode or a list of SpinalNodes/);
  });

  it('parents of several tickets, merged without duplicates', async () => {
    const tickets = await algo('GET_NODE_CHILDREN').run(stepsByName['Elec/Terminées'], { regex: HAS_TICKET });
    assert.deepEqual(names(await algo('GET_NODE_PARENTS').run(tickets, { regex: HAS_TICKET })), ['Terminées']);
  });
});

describe('work node resolver: every ticket that is not in "Terminées"', () => {
  const OPEN = ['C1', 'C2', 'C3', 'E1'];
  const analysisOf = (analysisName, resolverBlocks) => ({
    contextName: 'Ctx find', analysisName, anchorNodeId: ticketContext.getId().get(),
    worknodeResolver: { blocks: resolverBlocks },
  });
  const workNodesOf = async (node) => {
    const viaTriggers = names(await H.mod.spinalAnalysisTriggerService.resolveCOVWorkNodes(node));
    const run = await new H.AnalysisExecutionService(H.manager, H.makeRegistry({})).executeAnalysis(node);
    return { viaTriggers, viaExecution: run.results.map((r) => r.workNodeName).sort() };
  };

  it('without a container: steps except "Terminées" → their tickets (works in the current builder)', async () => {
    const node = await H.factory.createFromJSON(analysisOf('Open tickets (chain)', [
      { ref: 'Open steps', algorithmName: 'FIND_IN_CONTEXT', inputs: ['$node'], parameters: { type: STEP, regexFilter: '^(?!Terminées$)' } },
      { ref: 'Open tickets', algorithmName: 'GET_NODE_CHILDREN', inputs: ['Open steps'], parameters: { regex: HAS_TICKET } },
    ]), graph);
    const { viaTriggers, viaExecution } = await workNodesOf(node);
    assert.deepEqual(viaTriggers, [...OPEN, 'Hors contexte'].sort(), 'GET_NODE_CHILDREN follows every relation, in a context or not');
    assert.deepEqual(viaExecution, viaTriggers);
  });

  it('with a FILTER in the resolver: built, run by both resolver runners, and round-tripped', async () => {
    const config = analysisOf('Open tickets (filter)', [
      { ref: 'Tickets', algorithmName: 'FIND_IN_CONTEXT', inputs: ['$node'], parameters: { type: TICKET } },
      { ref: 'Open tickets', algorithmName: 'FILTER', inputs: ['Tickets'], itemRef: 'ticket', subWorkflow: { outputRef: 'Not done', blocks: [
        { ref: 'Done step', algorithmName: 'GET_NODE_PARENT', inputs: ['ticket'],
          parameters: { regex: HAS_TICKET, regexFilter: '^Terminées$', ifNotFound: 'null' } },
        { ref: 'Is done', algorithmName: 'EXISTS', inputs: ['Done step'] },
        { ref: 'Not done', algorithmName: 'NOT', inputs: ['Is done'] },
      ] } },
    ]);
    assert.deepEqual(H.factory.validateConfig(config), []);
    const node = await H.factory.createFromJSON(config, graph);
    assert.deepEqual(await workNodesOf(node), { viaTriggers: OPEN, viaExecution: OPEN });

    const details = await H.manager.getAnalyticDetails(node);
    const filter = details.worknodeResolver.blocks.find((b) => b.ref === 'Open tickets');
    assert.equal(filter.algorithmName, 'FILTER');
    assert.equal(filter.subWorkflow.outputRef, 'Not done');
    const resaved = { ...H.clone(details), analysisName: 'Open tickets (re-saved)', anchorNodeId: ticketContext.getId().get() };
    delete resaved.analysisId;
    const again = await H.factory.createFromJSON(resaved, graph);
    assert.deepEqual(await workNodesOf(again), { viaTriggers: OPEN, viaExecution: OPEN });
  });
});
