'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

const { mod } = H;
const names = (list) => list.map((algorithm) => algorithm.name);

describe('block catalog', () => {
  const catalog = mod.getAlgorithmCatalog();

  it('lists every algorithm once, under a known category, in the declared category order', () => {
    const listed = Object.values(catalog.algorithms).flatMap(names);
    assert.deepEqual([...listed].sort(), names(mod.ALGORITHM_DEFINITIONS).sort());
    assert.equal(catalog.count, mod.ALGORITHM_DEFINITIONS.length);

    const order = mod.ALGORITHM_CATEGORIES.map((category) => category.id);
    const ids = catalog.categories.map((category) => category.id);
    assert.deepEqual(ids, order.filter((id) => ids.includes(id)), 'display order, no "OTHER"');
    assert.deepEqual(Object.keys(catalog.algorithms), ids, 'the map is keyed in the same order');
    for (const category of catalog.categories) assert.equal(category.count, catalog.algorithms[category.id].length);
  });

  it('groups by what a block works on: a family default, overridden per block', () => {
    assert.deepEqual(names(catalog.algorithms.ENDPOINT).sort(), [
      'ENDPOINT_NODE_CURRENT_VALUE', 'ENDPOINT_NODE_CURRENT_VALUE_MODEL', 'PUSH_ENDPOINT_VALUE',
      'SET_ENDPOINT_VALUE', 'SET_ENDPOINT_VALUE_PARAM',
    ]);
    assert.ok(names(catalog.algorithms.NODE).includes('CURRENT_NODE'));
    assert.deepEqual(names(catalog.algorithms.COMMUNICATION).sort(), ['CURL_REQUEST', 'SEND_MAIL']);
    assert.equal(mod.getAlgorithmCategory({ name: 'X', category: 'NOPE' }), 'OTHER');
  });

  it('is localized: French category and block labels, English for an unknown locale', () => {
    const french = mod.getAlgorithmCatalog('fr');
    const label = (cat, id) => cat.categories.find((category) => category.id === id).label;
    assert.equal(label(french, 'TIMESERIES'), 'Séries temporelles');
    assert.equal(label(mod.getAlgorithmCatalog('de'), 'TIMESERIES'), 'Timeseries');
    assert.equal(french.algorithms.COMMUNICATION.find((a) => a.name === 'SEND_MAIL').label, 'Envoyer un mail');
    const { FR_CATEGORIES } = require('../dist/i18n/fr');
    for (const { id } of mod.ALGORITHM_CATEGORIES) {
      assert.ok(FR_CATEGORIES[id]?.label && FR_CATEGORIES[id]?.description, `French label and description of ${id}`);
    }
  });

  it('serves each block with its category and search keywords — and no tags', () => {
    const mail = catalog.algorithms.COMMUNICATION.find((a) => a.name === 'SEND_MAIL');
    assert.equal(mail.category, 'COMMUNICATION');
    assert.ok(mail.keywords.includes('email') && mail.keywords.includes('courriel'));
    assert.equal('tags' in mail, false);
    // A keyword entry for a block that doesn't exist is a typo or a leftover.
    const known = new Set(names(mod.ALGORITHM_DEFINITIONS));
    assert.deepEqual(Object.keys(mod.ALGORITHM_KEYWORDS).filter((name) => !known.has(name)), []);
  });
});

describe('parameter metadata', () => {
  const parameters = mod.ALGORITHM_DEFINITIONS.flatMap((algorithm) =>
    algorithm.parameters.map((parameter) => ({ ...parameter, where: `${algorithm.name}.${parameter.name}` })));

  it('a default is one of the choices and has the declared type', () => {
    const typeOf = { number: 'number', boolean: 'boolean', string: 'string' };
    for (const parameter of parameters) {
      if (parameter.default === undefined) continue;
      assert.equal(typeof parameter.default, typeOf[parameter.type], `${parameter.where}: default type`);
      if (parameter.options) assert.ok(parameter.options.includes(parameter.default), `${parameter.where}: default not in options`);
    }
  });

  it('choices match the type, and only text can be multi-line', () => {
    for (const parameter of parameters) {
      for (const option of parameter.options ?? []) {
        assert.equal(typeof option, parameter.type === 'number' ? 'number' : 'string', `${parameter.where}: option ${option}`);
      }
      if (parameter.multiline) assert.equal(parameter.type, 'string', parameter.where);
    }
    assert.ok(parameters.filter((parameter) => parameter.options).length >= 14, 'the fixed-choice parameters are declared');
  });

  it('reaches the served catalog', () => {
    const served = mod.getAlgorithmCatalog('fr').algorithms.TICKET.find((a) => a.name === 'CREATE_TICKET');
    const ifExists = served.parameters.find((parameter) => parameter.name === 'ifExists');
    assert.deepEqual([ifExists.options, ifExists.default], [['allow', 'reuse', 'error'], 'allow']);
  });
});

describe('saving an analytic checks its blocks against the catalog', () => {
  const anchor = H.createAnchor('Room');
  const config = (blocks) => ({ contextName: 'Ctx catalog', analysisName: 'A', anchorNodeId: anchor.id, executionWorkflow: { blocks } });
  const errorsOf = (blocks) => H.factory.validateConfig(config(blocks));
  const block = (algorithmName, parameters, extra = {}) => ({ ref: 'B', algorithmName, inputs: ['$node'], parameters, ...extra });

  it('refuses an unknown block or parameter name, and suggests the one that was meant', () => {
    assert.deepEqual(errorsOf([block('GET_NODE_CHILDRENN')]), [
      'executionWorkflow.B: unknown algorithm "GET_NODE_CHILDRENN" — did you mean "GET_NODE_CHILDREN"?',
    ]);
    assert.deepEqual(errorsOf([block('GET_ATTRIBUTE', { categoryname: 'c', label: 'l' })]), [
      'executionWorkflow.B: unknown parameter "categoryname" for GET_ATTRIBUTE — did you mean "categoryName"? (its parameters: categoryName, label)',
      'executionWorkflow.B: missing required parameter "categoryName" of GET_ATTRIBUTE',
    ]);
    assert.match(errorsOf([block('FIRST_NODE', { anything: 1 })])[0], /unknown parameter "anything" for FIRST_NODE \(it takes no parameter\)/);
  });

  it('refuses a missing required parameter, a value outside the choices, and text for a number or boolean', () => {
    const create = { type: 't', relationName: 'r' };
    assert.deepEqual(errorsOf([block('CREATE_NODE', { ...create, ifExists: 'reuze' })]), [
      'executionWorkflow.B: parameter "ifExists" must be one of "reuse", "error", "allow", got "reuze"',
    ]);
    assert.deepEqual(errorsOf([block('CREATE_NODE', { relationName: ' ' })]), [
      'executionWorkflow.B: missing required parameter "type" of CREATE_NODE',
      'executionWorkflow.B: missing required parameter "relationName" of CREATE_NODE',
    ]);
    assert.deepEqual(errorsOf([block('GREATER_THAN', { threshold: '12O' })]), [
      'executionWorkflow.B: parameter "threshold" must be a number, got "12O"',
    ]);
    assert.deepEqual(errorsOf([block('EQUALS_PARAM', { expected: 'x', ignoreCase: 'ture' })]), [
      'executionWorkflow.B: parameter "ignoreCase" must be true or false, got "ture"',
    ]);
    assert.deepEqual(errorsOf([block('CREATE_TICKET', { contextName: 'c', processName: 'p', name: 'n', priority: 5 })]), [
      'executionWorkflow.B: parameter "priority" must be one of 0, 1, 2, got 5',
    ]);
  });

  it('accepts what the blocks accept: numbers and booleans as text, choices in any case, empty optional fields', () => {
    assert.deepEqual(errorsOf([
      block('GREATER_THAN', { threshold: '12.5' }),
      block('EQUALS_PARAM', { expected: 'x', ignoreCase: 'TRUE' }, { ref: 'C' }),
      block('GENERATE_TIMESTAMPS', { mode: 'GRID', interval: '15m', count: '', timezone: null }, { ref: 'D', inputs: [] }),
      block('GET_ENDPOINT_TIMESERIES', { start: '2026-01-01', lastHours: 24 }, { ref: 'E' }),
      block('CREATE_TICKET', { contextName: 'c', processName: 'p', priority: '2' }, { ref: 'F' }),
    ]), []);
  });

  it('accepts every example config shipped with the module', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const root = path.join(__dirname, '..', 'examples');
    const jsonFiles = fs.readdirSync(root, { recursive: true }).filter((file) => String(file).endsWith('.json'));
    const configs = jsonFiles
      .map((file) => [String(file), JSON.parse(fs.readFileSync(path.join(root, String(file)), 'utf8'))])
      .filter(([, json]) => json && typeof json === 'object' && json.analysisName);
    assert.ok(configs.length >= 2, 'the example analytics are found');
    for (const [file, example] of configs) assert.deepEqual(H.factory.validateConfig(example), [], file);
  });

  it('checks blocks inside containers too, and nothing is created from a refused config', async () => {
    const nested = [{ ref: 'Loop', algorithmName: 'FOREACH', inputs: ['$node'], itemRef: 'item', subWorkflow: { outputRef: 'Inner', blocks: [
      { ref: 'Inner', algorithmName: 'MULTIPLY_PARAM', inputs: ['item'], parameters: { valeur: 2 } },
    ] } }];
    assert.deepEqual(errorsOf(nested), [
      'executionWorkflow.Loop.subWorkflow.Inner: unknown parameter "valeur" for MULTIPLY_PARAM — did you mean "value"? (its parameters: value)',
      'executionWorkflow.Loop.subWorkflow.Inner: missing required parameter "value" of MULTIPLY_PARAM',
    ]);
    const graph = new H.SpinalGraph('catalog');
    await assert.rejects(() => H.factory.createFromJSON(config(nested), graph), /unknown parameter "valeur"/);
    assert.deepEqual(await H.manager.getContexts(graph), []);
  });
});
