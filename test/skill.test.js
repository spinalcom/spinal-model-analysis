'use strict';
/**
 * The "spinal-analysis-workflow" skill (.claude/skills) teaches an assistant to write analytics.
 * What it shows must be true: its block reference lists the module's blocks, and its example
 * analytics are valid AND do what they say when run on a building.
 */
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const H = require('./helpers');
const { Model } = require('spinal-core-connectorjs_type');
const { SpinalGraphService, SPINAL_RELATION_PTR_LST_TYPE: PTR_LST } = require('spinal-env-viewer-graph-service');

const SKILL = path.join(__dirname, '..', '.claude', 'skills', 'spinal-analysis-workflow');
const example = (name) => JSON.parse(fs.readFileSync(path.join(SKILL, 'reference', 'examples', `${name}.json`), 'utf8'));
const algo = (name) => H.mod.ALGORITHM_REGISTRY.get(name);
const attribute = (node, categoryName, label) => algo('GET_ATTRIBUTE').run(node, { categoryName, label });

const makeNode = (name, type, element) => SpinalGraphService.getRealNode(SpinalGraphService.createNode({ name, type }, element));
const makeEndpoint = (name, currentValue) => {
  const element = new Model();
  element.add_attr({ currentValue, unit: '°C' });
  return makeNode(name, 'BmsEndpoint', element);
};

// Building → 1 floor → 3 rooms; two rooms have a temperature endpoint (20 and 28), one has none.
const graph = new H.SpinalGraph('skill');
let building;
let floor;
const rooms = {};
const sensors = {};

before(async () => {
  building = makeNode('Bâtiment', 'geographicBuilding');
  floor = makeNode('Étage 1', 'geographicFloor');
  await building.addChild(floor, 'hasGeographicFloor', PTR_LST);
  for (const [name, temperature] of [['Bureau', 20], ['Serveurs', 28], ['Couloir', undefined]]) {
    rooms[name] = makeNode(name, 'geographicRoom');
    await floor.addChild(rooms[name], 'hasGeographicRoom', PTR_LST);
    if (temperature === undefined) continue;
    sensors[name] = makeEndpoint(`Température ${name}`, temperature);
    await rooms[name].addChild(sensors[name], 'hasBmsEndpoint', PTR_LST);
  }
});

/** Saves an example anchored on `anchor` and runs it once, as a trigger would. */
const run = async (name, anchor) => {
  const config = { ...example(name), anchorNodeId: anchor.getId().get() };
  assert.deepEqual(H.factory.validateConfig(config), [], `${name} is valid`);
  const analysis = await H.factory.createFromJSON(config, graph);
  return new H.AnalysisExecutionService(H.manager, H.makeRegistry({})).executeAnalysis(analysis);
};
const failuresOf = (result) => result.results.filter((workNode) => !workNode.success).map((workNode) => `${workNode.workNodeName}: ${workNode.error}`);

describe('skill: block reference', () => {
  it('lists every block of the module, and details each one in its category file', () => {
    const index = fs.readFileSync(path.join(SKILL, 'reference', 'blocks.md'), 'utf8');
    const catalog = H.mod.getAlgorithmCatalog('en');
    for (const category of catalog.categories) {
      const details = fs.readFileSync(path.join(SKILL, 'reference', 'blocks', `${category.id}.md`), 'utf8');
      for (const block of catalog.algorithms[category.id]) {
        assert.ok(index.includes(`- \`${block.name}(`), `${block.name} is in the index — run "npm run build" to regenerate`);
        assert.ok(details.includes(`## ${block.name}\n`), `${block.name} is detailed in blocks/${category.id}.md`);
        for (const parameter of block.parameters) {
          assert.ok(details.includes(`- \`${parameter.name}\` (`), `${block.name}.${parameter.name} is documented`);
        }
      }
    }
  });

  it('the guide only names blocks that exist', () => {
    const guide = fs.readFileSync(path.join(SKILL, 'SKILL.md'), 'utf8');
    const reserved = new Set(['FOREACH', 'FILTER', 'IF', 'INTERVAL_TIME', 'CRON', 'COV', 'BOUNDED', 'FULL', 'SEQUENTIAL', 'JSON', 'BOS', 'API']);
    const named = new Set(guide.match(/\b[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+\b|\b(?:FOREACH|FILTER|IF)\b/g) ?? []);
    const unknown = [...named].filter((name) => !reserved.has(name) && !H.mod.ALGORITHM_REGISTRY.has(name));
    assert.deepEqual(unknown, []);
  });
});

describe('skill: the validator script', () => {
  const validate = (file) => {
    try {
      return { code: 0, output: execFileSync(process.execPath, [path.join(SKILL, 'scripts', 'validate.cjs'), file], { encoding: 'utf8' }) };
    } catch (error) {
      return { code: error.status, output: String(error.stdout) };
    }
  };

  it('accepts the examples', () => {
    for (const file of fs.readdirSync(path.join(SKILL, 'reference', 'examples'))) {
      const { code, output } = validate(path.join(SKILL, 'reference', 'examples', file));
      assert.equal(code, 0, output);
      assert.match(output, /0 error\(s\)/);
    }
  });

  it('reports what the module refuses, and warns about what only fails at run time', () => {
    const broken = example('room-temperature-alert');
    broken.executionWorkflow.blocks[2].parameters = { treshold: 26 };
    broken.executionWorkflow.blocks[1].inputs = [];
    broken.triggers[0].inputRegister = 'I9';
    const file = path.join(fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'skill-')), 'broken.json');
    fs.writeFileSync(file, JSON.stringify(broken));
    const { code, output } = validate(file);
    assert.equal(code, 1);
    assert.match(output, /error {3}executionWorkflow\.Too hot: unknown parameter "treshold" for GREATER_THAN — did you mean "threshold"\?/);
    assert.match(output, /warning executionWorkflow\.Temperature: ENDPOINT_NODE_CURRENT_VALUE needs 1 input\(s\) \(endpoint\), 0 wired/);
    assert.match(output, /warning triggers\[0\]: COV watches register "I9", which no inputWorkflow block sets/);
  });
});

describe('skill: the example analytics do what they say', () => {
  it('room-temperature-alert: runs on the rooms that have a sensor and writes their state; the registers are set', async () => {
    const result = await run('room-temperature-alert', floor);
    assert.deepEqual(failuresOf(result), []);
    assert.deepEqual(result.results.map((workNode) => workNode.workNodeName).sort(), ['Bureau', 'Serveurs']);
    assert.equal(await attribute(rooms.Bureau, 'Confort', 'État'), 'OK');
    assert.equal(await attribute(rooms.Serveurs, 'Confort', 'État'), 'Trop chaud');
    const office = result.results.find((workNode) => workNode.workNodeName === 'Bureau');
    assert.ok(office.inputRegisters.I0 !== undefined && office.inputRegisters.I1 !== undefined, 'both registers are set');
  });

  it('floor-average-temperature: averages the rooms that have a sensor, on each floor', async () => {
    const result = await run('floor-average-temperature', building);
    assert.deepEqual(failuresOf(result), []);
    assert.equal(result.totalWorkNodes, 1);
    assert.equal(Number(await attribute(floor, 'Confort', 'Température moyenne')), 24);
    assert.equal(result.results[0].executionOutputs.Rounded, 24);
  });

  it('room-point-shared-value: one point per room sharing the sensor value — the same on a second run', async () => {
    const config = { ...example('room-point-shared-value'), anchorNodeId: floor.getId().get() };
    assert.deepEqual(H.factory.validateConfig(config), []);
    const analysis = await H.factory.createFromJSON(config, graph);
    const service = new H.AnalysisExecutionService(H.manager, H.makeRegistry({}));

    for (let pass = 1; pass <= 2; pass++) {
      assert.deepEqual(failuresOf(await service.executeAnalysis(analysis)), [], `run ${pass}`);
      for (const name of ['Bureau', 'Serveurs']) {
        const points = await rooms[name].getChildren('hasRoomPoint');
        assert.equal(points.length, 1, `run ${pass}: ${name} has one point`);
        assert.equal((await points[0].getElement()).currentValue, (await sensors[name].getElement()).currentValue);
        assert.equal(await attribute(points[0], 'Mesure', 'Unité'), '°C');
      }
    }
    assert.deepEqual(await rooms.Couloir.getChildren('hasRoomPoint'), [], 'a room without a sensor gets nothing');
  });
});
