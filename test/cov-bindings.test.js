'use strict';
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { SpinalGraphService, SPINAL_RELATION_PTR_LST_TYPE: PTR_LST } = require('spinal-env-viewer-graph-service');
const { attributeService } = require('spinal-env-viewer-plugin-documentation-service');

const triggers = H.mod.spinalAnalysisTriggerService;
const makeNode = (name, type) => SpinalGraphService.getRealNode(SpinalGraphService.createNode({ name, type }, undefined));
const names = (nodes) => nodes.map((n) => n.getName().get()).sort();

// Tickets under a container; each ticket's step lives in a "step" attribute the COV trigger binds on.
const graph = new H.SpinalGraph('cov');
let container;
const addTicket = async (name, step) => {
  const ticket = makeNode(name, 'SpinalSystemServiceTicket');
  await container.addChild(ticket, 'hasTicket', PTR_LST);
  if (step !== undefined) await attributeService.createOrUpdateAttrsAndCategories(ticket, 'default', { step });
  return ticket;
};
const ticketAnalysis = (analysisName, resolverBlocks) => ({
  contextName: 'Ctx cov',
  analysisName,
  anchorNodeId: container.getId().get(),
  triggers: [{ type: 'COV', id: 'step', inputRegister: 'STEP' }],
  worknodeResolver: { blocks: resolverBlocks },
  inputWorkflow: { blocks: [
    { ref: 'Step attribute', algorithmName: 'GET_ATTRIBUTE_MODEL', inputs: ['$node'], parameters: { categoryName: 'default', label: 'step' } },
    { ref: 'STEP', algorithmName: 'SET_INPUT_REGISTER', inputs: ['Step attribute'], registerAs: 'STEP' },
  ] },
});

let analysis;
before(async () => {
  container = makeNode('Tickets', 'ticketContainer');
  await addTicket('T1', 'Ouvert');
  await addTicket('T2', 'En cours');
  analysis = await H.factory.createFromJSON(ticketAnalysis('Notify on step change', [
    { ref: 'Tickets', algorithmName: 'GET_NODE_CHILDREN', inputs: ['$node'], parameters: { regex: 'hasTicket' } },
  ]), graph);
});

describe('COV bindings follow the work nodes', () => {
  it('resolveCOVWorkNodes returns the current work nodes — including tickets created since', async () => {
    assert.deepEqual(names(await triggers.resolveCOVWorkNodes(analysis)), ['T1', 'T2']);
    await addTicket('T3', 'Ouvert');
    assert.deepEqual(names(await triggers.resolveCOVWorkNodes(analysis)), ['T1', 'T2', 'T3']);
  });

  it('resolveCOVBindings binds every work node on its step attribute, and reports the ones it cannot', async () => {
    await addTicket('T4 (no step yet)');
    const { bindings, skipped } = await triggers.resolveCOVBindings(analysis);
    assert.deepEqual(names(bindings.map((b) => b.workNode)), ['T1', 'T2', 'T3']);
    for (const binding of bindings) {
      assert.equal(binding.inputRegister, 'STEP');
      assert.equal(binding.triggerId, 'step');
      assert.equal(typeof binding.model.bind, 'function', 'a bindable model');
    }
    assert.deepEqual(skipped.map((s) => s.workNode.getName().get()), ['T4 (no step yet)']);
    assert.match(skipped[0].reason, /input register "STEP" was not produced/);
  });

  it('given work nodes, only those run the input workflow — how an organ binds just the new tickets', async () => {
    const fresh = await addTicket('T5', 'Ouvert');
    const { bindings, skipped } = await triggers.resolveCOVBindings(analysis, [fresh]);
    assert.deepEqual(bindings.map((b) => b.workNode.getName().get()), ['T5']);
    assert.deepEqual(skipped, []);
  });

  it('the legacy one-shot API still returns the same bindings', async () => {
    const bindings = await triggers.resolveInputRegistersForBinding(analysis);
    assert.deepEqual(names(bindings.map((b) => b.workNode)), ['T1', 'T2', 'T3', 'T5']);
  });

  it('a failing resolver fails — it no longer falls back to binding the anchor node', async () => {
    const broken = await H.factory.createFromJSON(ticketAnalysis('Broken resolver', [
      { ref: 'Tickets', algorithmName: 'GET_NODE_CHILD', inputs: ['$node'], parameters: { regexFilter: '^Nothing$' } },
    ]), graph);
    await assert.rejects(() => triggers.resolveCOVWorkNodes(broken), /no child found/);
  });
});
