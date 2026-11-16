'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { Model, Lst } = require('spinal-core-connectorjs_type');
const { SpinalGraphService, SPINAL_RELATION_PTR_LST_TYPE: PTR_LST } = require('spinal-env-viewer-graph-service');
const { attributeService } = require('spinal-env-viewer-plugin-documentation-service');

const algo = (name) => H.mod.ALGORITHM_REGISTRY.get(name);
const share = (source, target, params, context) => algo('SHARE_VALUE').run([source, target], params, context);

const makeNode = (name, type = 'geographicRoom') =>
  SpinalGraphService.getRealNode(SpinalGraphService.createNode({ name, type }, undefined));
/** A node shaped like a BMS endpoint: its element holds the current value. */
const makeEndpoint = (name, currentValue, extra = {}) => {
  const element = new Model();
  element.add_attr({ currentValue, unit: '°C', ...extra });
  return SpinalGraphService.getRealNode(SpinalGraphService.createNode({ name, type: 'BmsEndpoint' }, element));
};
const currentValueModel = async (node) => (await node.getElement()).currentValue;
const readEndpoint = (node) => algo('ENDPOINT_NODE_CURRENT_VALUE').run(node);
const attributeModel = (node, categoryName, label) => attributeService.findOneAttributeInCategory(node, categoryName, label);
const readAttribute = (node, categoryName, label) => algo('GET_ATTRIBUTE').run(node, { categoryName, label });
const setAttribute = (node, categoryName, label, value) => algo('SET_ATTRIBUTE').run([node, value], { categoryName, label });

describe('SHARE_VALUE — an endpoint value held by two nodes', () => {
  it('the target holds the very same value: a write on either node shows on both', async () => {
    const sensor = makeEndpoint('Sonde', 21.5);
    const mirror = makeEndpoint('Miroir', 0);
    const returned = await share(sensor, mirror, { sourceProperty: 'element.currentValue' });

    assert.equal(returned, mirror, 'returns the target, for chaining');
    assert.equal(await currentValueModel(mirror), await currentValueModel(sensor), 'one model, not a copy');
    assert.equal(await readEndpoint(mirror), 21.5, "the target shows the source's value; its own (0) is gone");

    await algo('SET_ENDPOINT_VALUE').run([mirror, 30]);
    assert.equal(await readEndpoint(sensor), 30, 'written through the target');
    await algo('SET_ENDPOINT_VALUE').run([sensor, 18]);
    assert.equal(await readEndpoint(mirror), 18, 'written through the source');
    assert.equal(await algo('ENDPOINT_NODE_CURRENT_VALUE_MODEL').run(mirror), await currentValueModel(sensor),
      'a COV trigger bound on the target watches the shared value');
    assert.equal((await mirror.getElement()).unit.get(), '°C', 'the rest of the element is untouched');
  });

  it('gives a node that has no element one, and running again — even in parallel — changes nothing', async () => {
    const sensor = makeEndpoint('Sonde 2', 7);
    const fresh = makeNode('Sans élément');
    assert.equal(fresh.element, undefined);

    await share(sensor, fresh, { sourceProperty: 'element.currentValue' });
    const element = await fresh.getElement();
    assert.equal(element.currentValue, await currentValueModel(sensor));

    await Promise.all(Array.from({ length: 5 }, () => share(sensor, fresh, { sourceProperty: 'element.currentValue' })));
    assert.equal(await fresh.getElement(), element, 'same element');
    assert.deepEqual(element._attribute_names, ['currentValue']);
    assert.equal((await currentValueModel(sensor))._parents.length, 2, 'held by the two elements, once each');
  });

  it('follows the source when it is pointed at another one', async () => {
    const first = makeEndpoint('Sonde A', 1);
    const second = makeEndpoint('Sonde B', 2);
    const mirror = makeNode('Suit la sonde');
    await share(first, mirror, { sourceProperty: 'element.currentValue' });
    await share(second, mirror, { sourceProperty: 'element.currentValue' });
    assert.equal(await currentValueModel(mirror), await currentValueModel(second));
    await algo('SET_ENDPOINT_VALUE').run([mirror, 99]);
    assert.deepEqual([await readEndpoint(first), await readEndpoint(second)], [1, 99], 'the first source is left alone');
  });
});

describe('SHARE_VALUE — attributes and info', () => {
  it('shares a text attribute, creating the attribute and its category on the target', async () => {
    const equipment = makeNode('CTA 1', 'BIMObject');
    const twin = makeNode('CTA 1 (jumeau)');
    await setAttribute(equipment, 'Technique', 'Code', 'A-001');

    await share(equipment, twin, { sourceProperty: 'attr.Technique.Code' });
    assert.equal((await attributeModel(twin, 'Technique', 'Code')).value, (await attributeModel(equipment, 'Technique', 'Code')).value);
    assert.equal(await readAttribute(twin, 'Technique', 'Code'), 'A-001');

    // The attribute blocks write in place, so the share survives them — in both directions.
    await setAttribute(twin, 'Technique', 'Code', 'B-002');
    assert.equal(await readAttribute(equipment, 'Technique', 'Code'), 'B-002');
    await setAttribute(equipment, 'Technique', 'Code', 'C-003');
    assert.equal(await readAttribute(twin, 'Technique', 'Code'), 'C-003');
    assert.equal((await attributeService.getAttributesByCategory(twin, 'Technique')).length, 1, 'no duplicate attribute');
  });

  it('replaces the value of an attribute the target already has, and leaves its other attributes alone', async () => {
    const source = makeNode('Source attr');
    const target = makeNode('Cible attr');
    await setAttribute(source, 'Général', 'Zone', 'Nord');
    await setAttribute(target, 'Général', 'Zone', 'Sud');
    await setAttribute(target, 'Général', 'Étage', '2');

    await share(source, target, { sourceProperty: 'attr.Général.Zone' });
    assert.equal(await readAttribute(target, 'Général', 'Zone'), 'Nord');
    assert.equal(await readAttribute(target, 'Général', 'Étage'), '2');
    assert.equal(await readAttribute(source, 'Général', 'Zone'), 'Nord', 'the source keeps its value');
  });

  it('shares to another place with "targetProperty" — a label may hold dots', async () => {
    const room = makeNode('Salle 101');
    const sensor = makeEndpoint('Sonde 101', 20, { name: 'TEMP_101' });

    // The room's name, shown live as an attribute of the sensor.
    await share(room, sensor, { sourceProperty: 'info.name', targetProperty: 'attr.Localisation.Pièce (rév. 2)' });
    assert.equal(await readAttribute(sensor, 'Localisation', 'Pièce (rév. 2)'), 'Salle 101');
    await algo('SET_NODE_INFO').run([room, 'Salle 101 bis'], { property: 'name' });
    assert.equal(await readAttribute(sensor, 'Localisation', 'Pièce (rév. 2)'), 'Salle 101 bis');

    // The sensor's value, as an info property of the room; an element text, as the room's attribute.
    await share(sensor, room, { sourceProperty: 'element.currentValue', targetProperty: 'info.temperature' });
    await algo('SET_ENDPOINT_VALUE').run([sensor, 23]);
    assert.equal(await algo('GET_NODE_INFO').run(room, { property: 'temperature' }), 23);
    await share(sensor, room, { sourceProperty: 'element.name', targetProperty: 'attr.Capteur.Nom' });
    assert.equal(await readAttribute(room, 'Capteur', 'Nom'), 'TEMP_101');
  });

  it('shares between two places of the same node', async () => {
    const node = makeEndpoint('Auto', 5, { code: 'X1' });
    await share(node, node, { sourceProperty: 'element.code', targetProperty: 'attr.Technique.Code' });
    await setAttribute(node, 'Technique', 'Code', 'X2');
    assert.equal((await node.getElement()).code.get(), 'X2');
  });
});

describe('SHARE_VALUE — what it refuses', () => {
  const sensor = makeEndpoint('Sonde refus', 12, { history: [1, 2], config: { min: 0 } });
  const target = makeNode('Cible refus');

  it('a number or boolean into an attribute: the attribute would drop the share at its next write', async () => {
    await assert.rejects(
      () => share(sensor, target, { sourceProperty: 'element.currentValue', targetProperty: 'attr.Mesures.Température' }),
      /element\.currentValue of "Sonde refus" is a number, and an attribute can only share a text value — share it into "element\.<key>" or "info\.<key>"/
    );
    assert.deepEqual(await attributeService.getCategory(target), [], 'nothing was created on the target');
  });

  it('a value the source does not have, saying what it does have', async () => {
    await assert.rejects(() => share(sensor, target, { sourceProperty: 'element.currentvalue' }),
      /"Sonde refus" has no element\.currentvalue — its element holds: currentValue, unit/);
    await assert.rejects(() => share(target, sensor, { sourceProperty: 'element.currentValue' }),
      /"Cible refus" has no element\.currentValue — it has no element/);
    await setAttribute(sensor, 'Technique', 'Code', 'c');
    await assert.rejects(() => share(sensor, target, { sourceProperty: 'attr.Technique.Kode' }),
      /has no attr\.Technique\.Kode — category "Technique" holds: Code/);
    await assert.rejects(() => share(sensor, target, { sourceProperty: 'attr.Autre.Code' }),
      /has no attr\.Autre\.Code — it has no attribute in category "Autre"/);
    assert.equal(target.element, undefined, 'a refused share leaves the target as it was');
  });

  it('anything but a single value: an object, a list', async () => {
    assert.ok((await sensor.getElement()).history instanceof Lst);
    for (const sourceProperty of ['element.history', 'element.config']) {
      await assert.rejects(() => share(sensor, target, { sourceProperty }), /is not a single value \(text, number or boolean\)/);
    }
  });

  it('a malformed or reserved property, on either side', async () => {
    for (const sourceProperty of [undefined, '', 'currentValue', 'element', 'element.', 'element.a.b', 'attr.Technique', 'attr..Code', 'node.name']) {
      await assert.rejects(() => share(sensor, target, { sourceProperty }), /"sourceProperty" must be "element\.<key>"/, String(sourceProperty));
    }
    await assert.rejects(() => share(sensor, target, { sourceProperty: 'element.currentValue', targetProperty: 'info' }), /"targetProperty" must be/);
    for (const reserved of ['info.id', 'element._parents', 'info.model_id']) {
      await assert.rejects(() => share(sensor, target, { sourceProperty: reserved }), /is reserved and cannot be shared/);
      await assert.rejects(() => share(sensor, target, { sourceProperty: 'element.currentValue', targetProperty: reserved }), /is reserved and cannot be shared/);
    }
    // A new key named like a method of the model would replace that method.
    await assert.rejects(() => share(sensor, target, { sourceProperty: 'element.currentValue', targetProperty: 'info.get' }),
      /"get" is a reserved name and cannot be created in the info of "Cible refus"/);
    assert.equal(typeof target.info.get, 'function');
  });

  it('a value shared with itself, and inputs that are not two nodes', async () => {
    await assert.rejects(() => share(sensor, sensor, { sourceProperty: 'element.currentValue' }), /cannot be shared with itself/);
    await assert.rejects(() => algo('SHARE_VALUE').run(sensor, { sourceProperty: 'element.currentValue' }), /expects 2 inputs: \[source, target\]/);
    // A lone list of two nodes wired as the source looks like [source, target]; the wired-input count tells.
    await assert.rejects(() => share(sensor, target, { sourceProperty: 'element.currentValue' }, { inputCount: 1 }), /expects 2 inputs/);
    await assert.rejects(() => share(sensor, [target], { sourceProperty: 'element.currentValue' }), /wrap it in a FOREACH/);
  });
});

describe('end to end: an analytic that gives each room a node sharing the value of its sensor', () => {
  it('creates the node and shares the value once, however often it runs; the value then follows without a run', async () => {
    const building = makeNode('Bâtiment', 'geographicBuilding');
    const sensors = {};
    for (const name of ['Salle A', 'Salle B']) {
      const room = makeNode(name);
      await building.addChild(room, 'hasGeographicRoom', PTR_LST);
      sensors[name] = makeEndpoint(`Température ${name}`, 20);
      await room.addChild(sensors[name], 'hasBmsEndpoint', PTR_LST);
    }
    const config = {
      contextName: 'Ctx share-value',
      analysisName: 'Room temperature points',
      anchorNodeId: building.getId().get(),
      executionWorkflow: { blocks: [
        { ref: 'Rooms', algorithmName: 'GET_NODE_CHILDREN', inputs: ['$node'], parameters: { regex: 'hasGeographicRoom' } },
        { ref: 'Each room', algorithmName: 'FOREACH', inputs: ['Rooms'], itemRef: 'room', subWorkflow: { outputRef: 'Shared', blocks: [
          { ref: 'Sensor', algorithmName: 'GET_NODE_CHILD', inputs: ['room'], parameters: { regex: 'hasBmsEndpoint', regexFilter: '^Température' } },
          { ref: 'Point', algorithmName: 'CREATE_NODE', inputs: ['room'], parameters: { name: 'Température ambiante', type: 'roomPoint', relationName: 'hasRoomPoint' } },
          { ref: 'Shared', algorithmName: 'SHARE_VALUE', inputs: ['Sensor', 'Point'], parameters: { sourceProperty: 'element.currentValue' } },
          { ref: 'Unit', algorithmName: 'SHARE_VALUE', inputs: ['Sensor', 'Shared'], parameters: { sourceProperty: 'element.unit', targetProperty: 'attr.Mesure.Unité' } },
        ] } },
      ] },
    };
    assert.deepEqual(H.factory.validateConfig(config), []);
    const { dag } = await H.createAndLoad(config, new H.SpinalGraph('share-value'));
    const executor = H.makeExecutor(H.makeRegistry({}));

    const pointOf = async (roomName) => {
      const room = (await building.getChildren('hasGeographicRoom')).find((node) => node.getName().get() === roomName);
      const points = await room.getChildren('hasRoomPoint');
      assert.equal(points.length, 1, `${roomName}: exactly one point`);
      return points[0];
    };
    for (let run = 1; run <= 3; run++) {
      const ctx = await H.runDag(executor, dag, { workNode: building });
      assert.deepEqual(ctx.failures, [], `run ${run}: no failures`);
      for (const roomName of Object.keys(sensors)) {
        const point = await pointOf(roomName);
        assert.equal(await currentValueModel(point), await currentValueModel(sensors[roomName]), `run ${run}: ${roomName} shares its sensor's value`);
        assert.equal(await readAttribute(point, 'Mesure', 'Unité'), '°C');
      }
    }

    // No run in between: the connector writes the sensor, the room's point shows it.
    await algo('SET_ENDPOINT_VALUE').run([sensors['Salle A'], 26.5]);
    assert.equal(await readEndpoint(await pointOf('Salle A')), 26.5);
    assert.equal(await readEndpoint(await pointOf('Salle B')), 20, 'each room has its own');
  });

  it('a config that misnames the property parameter is refused at save, with the name that was meant', () => {
    const errors = H.factory.validateConfig({
      contextName: 'Ctx share-value', analysisName: 'Typo', anchorNodeId: H.createAnchor('Room').id,
      executionWorkflow: { blocks: [
        { ref: 'S', algorithmName: 'SHARE_VALUE', inputs: ['$node', '$node'], parameters: { sourceproperty: 'element.currentValue' } },
      ] },
    });
    assert.match(errors[0], /unknown parameter "sourceproperty" for SHARE_VALUE — did you mean "sourceProperty"\?/);
    assert.match(errors[1], /missing required parameter "sourceProperty" of SHARE_VALUE/);
  });
});
