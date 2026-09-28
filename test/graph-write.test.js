'use strict';
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const {
  SpinalContext,
  SpinalGraphService,
  SPINAL_RELATION_PTR_LST_TYPE: PTR_LST,
} = require('spinal-env-viewer-graph-service');

const algo = (name) => H.mod.ALGORITHM_REGISTRY.get(name);
const makeNode = (name, type = 'geographicRoom') =>
  SpinalGraphService.getRealNode(SpinalGraphService.createNode({ name, type }, undefined));
const names = (nodes) => nodes.map((n) => n.getName().get()).sort();
const createNode = (input, params, context) => algo('CREATE_NODE').run(input, params, context);
const linkNodes = (parent, child, params, context) => algo('LINK_NODES').run([parent, child], params, context);
/** Whether the BOS tree of `context` shows `child` under `parent` — the check the tree itself makes. */
const visibleIn = async (parent, context, child) =>
  (await parent.getChildrenInContext(context)).some((n) => n.getId().get() === child.getId().get());

// A small building graph shaped like the BOS: a spatial context (building → rooms) and a group
// context (category → groups), registered in the graph service the way the organ loads them.
const graph = new H.SpinalGraph('graph-write');
let spatial;
let groups;
let building;
let rooms;
let category;

before(async () => {
  spatial = new SpinalContext('Spatial', 'geographicContext');
  groups = new SpinalContext('Groupes', 'groupContext');
  await graph.addContext(spatial);
  await graph.addContext(groups);
  await SpinalGraphService.setGraph(graph);

  building = makeNode('Building', 'geographicBuilding');
  await spatial.addChildInContext(building, 'hasGeographicBuilding', PTR_LST, spatial);
  rooms = ['Bureau 1', 'Salle 2', 'Bureau 3'].map((name) => makeNode(name));
  for (const room of rooms) await building.addChildInContext(room, 'hasGeographicRoom', PTR_LST, spatial);
  category = makeNode('Types de pièces', 'groupingCategory');
  await groups.addChildInContext(category, 'hasCategory', PTR_LST, groups);
});

describe('CREATE_NODE', () => {
  const groupParams = { name: 'Bureaux', type: 'geographicRoomGroup', relationName: 'hasGroup' };

  it('creates the node under its parent — linked, so it is saved; a plain link unless a context is named', async () => {
    const group = await createNode(category, groupParams);
    assert.equal(group.getName().get(), 'Bureaux');
    assert.equal(group.getType().get(), 'geographicRoomGroup');
    assert.deepEqual(names(await category.getChildren('hasGroup')), ['Bureaux']);
    assert.deepEqual(group.getContextIds(), [], 'no context unless one is named');
    assert.equal(await visibleIn(category, groups, group), false);
  });

  it('reuses the existing node on re-run (default), even when runs overlap', async () => {
    const first = await createNode(category, groupParams);
    const again = await createNode(category, groupParams);
    assert.equal(again.getId().get(), first.getId().get());

    const parallelParams = { ...groupParams, name: 'Parallel' };
    const results = await Promise.all(Array.from({ length: 6 }, () => createNode(category, parallelParams)));
    assert.equal(new Set(results.map((n) => n.getId().get())).size, 1, 'all runs got the same node');
    assert.equal((await category.getChildren('hasGroup')).filter((n) => n.getName().get() === 'Parallel').length, 1);
  });

  it('ifExists: "error" fails when it exists, "allow" creates another one', async () => {
    await assert.rejects(() => createNode(category, { ...groupParams, ifExists: 'error' }), /already has a "geographicRoomGroup" named "Bureaux"/);
    const duplicate = await createNode(category, { ...groupParams, name: 'Dup', ifExists: 'allow' });
    const another = await createNode(category, { ...groupParams, name: 'Dup', ifExists: 'allow' });
    assert.notEqual(duplicate.getId().get(), another.getId().get());
    await assert.rejects(() => createNode(category, { ...groupParams, ifExists: 'maybe' }), /"ifExists" must be/);
  });

  it('takes a dynamic name from its second input, falling back to the parameter', async () => {
    const dynamic = await createNode([category, 'Rapport R1'], { ...groupParams, name: 'ignored' });
    assert.equal(dynamic.getName().get(), 'Rapport R1');
    const fallback = await createNode([category, '  '], { ...groupParams, name: 'Fallback' });
    assert.equal(fallback.getName().get(), 'Fallback');
    await assert.rejects(() => createNode(category, { type: 'x', relationName: 'hasGroup' }), /needs a name/);
  });

  it('refuses a list of parents and missing type / relation', async () => {
    await assert.rejects(() => createNode([rooms[0], rooms[1]], groupParams), /expects ONE parent node, got a list/);
    await assert.rejects(() => createNode(category, { name: 'x', relationName: 'hasGroup' }), /non-empty "type"/);
    await assert.rejects(() => createNode(category, { name: 'x', type: 'x' }), /non-empty "relationName"/);
  });

  it("context is a choice: named → shown in that context's tree; empty → plain link, whatever the parent's contexts", async () => {
    const both = makeNode('In both');
    await building.addChildInContext(both, 'hasGeographicRoom', PTR_LST, spatial);
    await category.addChildInContext(both, 'hasMember', PTR_LST, groups);
    const params = { type: 'custom', relationName: 'hasCustom' };

    const plain = await createNode(both, { ...params, name: 'Plain' });
    assert.deepEqual(plain.getContextIds(), [], 'a parent in several contexts is no reason to fail');
    const inSpatial = await createNode(both, { ...params, name: 'In Spatial', contextName: 'Spatial' });
    assert.equal(await visibleIn(both, spatial, inSpatial), true);
    assert.equal(await visibleIn(both, groups, inSpatial), false, 'only in the named context');
    assert.equal(await visibleIn(both, spatial, plain), false, 'a plain child stays out of the tree, even in a relation the tree walks');
    assert.deepEqual(names(await both.getChildren('hasCustom')), ['In Spatial', 'Plain'], 'both are linked, hence saved');

    await assert.rejects(() => createNode(building, { ...params, name: 'x', contextName: 'Groupes' }), /does not belong to context "Groupes", so the link would not be visible/);
    await assert.rejects(() => createNode(building, { ...params, name: 'x', contextName: 'Nope' }), /no context named "Nope"/);

    const underContext = await createNode(groups, { name: 'Autre catégorie', type: 'groupingCategory', relationName: 'hasCategory', contextName: 'Groupes' });
    assert.equal(await visibleIn(groups, groups, underContext), true, 'the parent may be the context itself');
  });

  it('naming a context on a later run also applies to the node created before', async () => {
    const params = { name: 'Later', type: 'custom', relationName: 'hasLater' };
    const first = await createNode(category, params);
    assert.equal(await visibleIn(category, groups, first), false);
    const again = await createNode(category, { ...params, contextName: 'Groupes' });
    assert.equal(again.getId().get(), first.getId().get(), 'reused, not duplicated');
    assert.equal(await visibleIn(category, groups, first), true);
  });

  it('relationType: follows the existing relation, refuses a contradicting or unknown one', async () => {
    await assert.rejects(() => createNode(category, { ...groupParams, name: 'T', relationType: 'LstPtr' }), /already exists on "Types de pièces" as PtrLst/);
    await assert.rejects(() => createNode(category, { ...groupParams, name: 'T', relationType: 'bogus' }), /must be one of PtrLst, LstPtr, Ref/);
    await createNode(category, { ...groupParams, name: 'T', relationType: 'ptrlst' }); // case-insensitive
    await createNode(category, { name: 'L', type: 'custom', relationName: 'hasLst', relationType: 'LstPtr' });
    assert.equal(category.hasRelation('hasLst', 'LstPtr'), true);
  });
});

describe('LINK_NODES', () => {
  let group;
  const params = { relationName: 'groupHasgeographicRoom', contextName: 'Groupes' };
  before(async () => {
    group = await createNode(category, { name: 'Bureaux linked', type: 'geographicRoomGroup', relationName: 'hasGroup', contextName: 'Groupes' });
  });

  it('links one node, or every node of a list, in the named context; returns the child input', async () => {
    const offices = [rooms[0], rooms[2]];
    const returned = await linkNodes(group, offices, params);
    assert.equal(returned, offices);
    assert.deepEqual(names(await group.getChildrenInContext(groups)), ['Bureau 1', 'Bureau 3'], 'shown in the Groupes tree');
    assert.ok(rooms[0].getContextIds().includes(spatial.getId().get()), 'and still in Spatial');
  });

  it('is idempotent — re-running, even in parallel, never fails or duplicates', async () => {
    await linkNodes(group, [rooms[0], rooms[2]], params);
    await Promise.all(Array.from({ length: 6 }, () => linkNodes(group, rooms[1], params)));
    assert.deepEqual(names(await group.getChildren('groupHasgeographicRoom')), ['Bureau 1', 'Bureau 3', 'Salle 2']);
  });

  it('a plain link made earlier gets the context when a later run names it', async () => {
    const other = await createNode(category, { name: 'Other group', type: 'geographicRoomGroup', relationName: 'hasGroup', contextName: 'Groupes' });
    await linkNodes(other, rooms[1], { relationName: 'groupHasgeographicRoom' });
    // "Salle 2" is already in Groupes through the first group — yet not visible here: the relation
    // of THIS link carries no context. Both the child and the relation need it.
    assert.equal(await visibleIn(other, groups, rooms[1]), false);
    await linkNodes(other, rooms[1], params);
    assert.equal(await visibleIn(other, groups, rooms[1]), true);
    assert.equal((await other.getChildren('groupHasgeographicRoom')).length, 1, 'still linked once');
  });

  it('refuses self-links and direct cycles', async () => {
    await assert.rejects(() => linkNodes(rooms[1], rooms[1], params), /cannot link "Salle 2" to itself/);
    await assert.rejects(() => linkNodes(rooms[0], group, params), /"Bureaux linked" is already the parent of "Bureau 1" .* would create a cycle/);
  });

  it('rejects a lone node list wired as the parent (it looks like [parent, child])', async () => {
    await assert.rejects(
      () => algo('LINK_NODES').run([rooms[0], rooms[1]], params, { inputCount: 1 }),
      /wire both the parent and the child/
    );
    assert.equal((await rooms[0].getChildren('groupHasgeographicRoom')).length, 0, 'nothing was linked');
  });

  it('rejects a non-node child', async () => {
    await assert.rejects(() => linkNodes(group, 'Bureau 1', params), /a SpinalNode or a list of SpinalNodes as the child/);
  });
});

describe('end to end: an analytic that groups its office rooms', () => {
  it('creates the group once and links the rooms once, however often it runs', async () => {
    const config = {
      contextName: 'Ctx graph-write',
      analysisName: 'Group office rooms',
      executionWorkflow: { blocks: [
        { ref: 'Groups ctx', algorithmName: 'GET_CONTEXT', parameters: { name: 'Groupes' } },
        { ref: 'Category', algorithmName: 'GET_NODE_CHILD', inputs: ['Groups ctx'], parameters: { regexFilter: '^Types de pièces$' } },
        { ref: 'Group', algorithmName: 'CREATE_NODE', inputs: ['Category'],
          parameters: { name: 'Bureaux (auto)', type: 'geographicRoomGroup', relationName: 'hasGroup', contextName: 'Groupes' } },
        { ref: 'Rooms', algorithmName: 'GET_NODE_CHILDREN', inputs: ['$node'], parameters: { regex: 'hasGeographicRoom' } },
        { ref: 'Office rooms', algorithmName: 'FILTER', inputs: ['Rooms'], itemRef: 'room', subWorkflow: { outputRef: 'Is office', blocks: [
          { ref: 'Room name', algorithmName: 'GET_NODE_INFO', inputs: ['room'] },
          { ref: 'Is office', algorithmName: 'MATCHES_REGEX', inputs: ['Room name'], parameters: { pattern: '^Bureau' } },
        ] } },
        { ref: 'Link', algorithmName: 'LINK_NODES', inputs: ['Group', 'Office rooms'],
          parameters: { relationName: 'groupHasgeographicRoom', contextName: 'Groupes' } },
      ] },
    };
    assert.deepEqual(H.factory.validateConfig(config), []);
    const { dag } = await H.createAndLoad(config, graph);
    const executor = H.makeExecutor(H.makeRegistry({}));

    for (let run = 1; run <= 3; run++) {
      const ctx = await H.runDag(executor, dag, { workNode: building });
      assert.deepEqual(ctx.failures, [], `run ${run}: no failures`);
      const created = (await category.getChildren('hasGroup')).filter((n) => n.getName().get() === 'Bureaux (auto)');
      assert.equal(created.length, 1, `run ${run}: exactly one group`);
      assert.equal(await visibleIn(category, groups, created[0]), true, `run ${run}: the group shows in the Groupes tree`);
      assert.deepEqual(names(await created[0].getChildrenInContext(groups)), ['Bureau 1', 'Bureau 3'], `run ${run}: offices linked once, shown in the tree`);
    }
  });
});
