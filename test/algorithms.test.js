'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

const algo = (name) => H.mod.ALGORITHM_REGISTRY.get(name);
const series = (values) => values.map((value, i) => ({ date: i * 900_000, value })); // 15-min spacing
const valuesOf = (points) => points.map((p) => p.value);
const iso = (ms) => new Date(ms).toISOString();

describe('COMPACT_NUMBERS', () => {
  it('drops null / undefined / non-numeric entries and coerces numeric strings', async () => {
    assert.deepEqual(await algo('COMPACT_NUMBERS').run([0, 2, 4, 1, 0, 3, 3, 0, null]), [0, 2, 4, 1, 0, 3, 3, 0]);
    assert.deepEqual(await algo('COMPACT_NUMBERS').run([null, undefined, '5', 'x', 7, NaN, '  3.5 ']), [5, 7, 3.5]);
  });

  it('feeds the strict aggregators (FOREACH with gaps → COMPACT → SUM)', async () => {
    const cleaned = await algo('COMPACT_NUMBERS').run([0, 2, 4, 1, 0, 3, 3, 0, null]);
    assert.equal(await algo('SUM_NUMBERS').run(cleaned), 13);
    const nothingNumeric = await algo('COMPACT_NUMBERS').run([null, null]);
    await assert.rejects(() => algo('SUM_NUMBERS').run(nothingNumeric), /no numeric input/);
  });
});

describe('GENERATE_TIMESTAMPS', () => {
  // Mid-day reference time proves the day is floored to midnight.
  const context = { execution: { referenceTime: Date.UTC(2026, 7, 26, 14, 37, 0) } };
  const generate = (input, params) => algo('GENERATE_TIMESTAMPS').run(input, { timezone: 'utc', ...params }, context);

  it('GRID: count × interval from the start of the run day', async () => {
    assert.deepEqual((await generate([], { interval: '15m', count: 4 })).map(iso), [
      '2026-08-26T00:00:00.000Z', '2026-08-26T00:15:00.000Z', '2026-08-26T00:30:00.000Z', '2026-08-26T00:45:00.000Z',
    ]);
  });

  it('GRID: count defaults to the wired input length, and spans across days', async () => {
    const out = await generate([18, 19, 21, 22, 20], { interval: '6h' });
    assert.equal(out.length, 5);
    assert.equal(iso(out[4]), '2026-08-27T00:00:00.000Z');
    const week = await generate([], { interval: '15m', count: 672 });
    assert.equal(iso(week[671]), '2026-09-01T23:45:00.000Z');
  });

  it('STAMP: puts time-of-day values onto the run day', async () => {
    assert.deepEqual((await generate(['00:00', '06:30', '12:00', '18:15'], { mode: 'stamp' })).map(iso), [
      '2026-08-26T00:00:00.000Z', '2026-08-26T06:30:00.000Z', '2026-08-26T12:00:00.000Z', '2026-08-26T18:15:00.000Z',
    ]);
  });

  it('dayOffset shifts the run day', async () => {
    assert.equal(iso((await generate([], { interval: '1h', count: 1, dayOffset: -1 }))[0]), '2026-08-25T00:00:00.000Z');
  });

  it('pairs with COLUMNS_TO_TIMESERIES into an injectable series', async () => {
    const values = [18, 19, 21];
    const axis = await generate(values, { interval: '6h' });
    const built = await algo('COLUMNS_TO_TIMESERIES').run([axis, values], {});
    assert.deepEqual(built.map((p) => [iso(p.date), p.value]), [
      ['2026-08-26T00:00:00.000Z', 18], ['2026-08-26T06:00:00.000Z', 19], ['2026-08-26T12:00:00.000Z', 21],
    ]);
  });
});

describe('TIMESERIES_DESPIKE', () => {
  const despike = (values, params = {}) => algo('TIMESERIES_DESPIKE').run(series(values), params);

  it('removes isolated dropouts of a cumulative counter (automatic threshold)', async () => {
    const meter = [950, 951, 953, 958, 0, 959, 962, 964, 965, 0, 967, 970, 972, 975, 978];
    assert.deepEqual(valuesOf(await despike(meter)), [950, 951, 953, 958, 959, 962, 964, 965, 967, 970, 972, 975, 978]);
  });

  it('preserves a genuine meter reset (the series stays low afterwards)', async () => {
    const reset = [950, 955, 960, 0, 1, 3, 6, 9, 12, 15];
    assert.deepEqual(valuesOf(await despike(reset)), reset);
  });

  it('interpolate mode replaces the spike with the neighbours\' trend, keeping the point count', async () => {
    assert.deepEqual(valuesOf(await despike([950, 951, 953, 958, 0, 959, 962, 964, 965], { action: 'interpolate', maxDelta: 100 })),
      [950, 951, 953, 958, 958.5, 959, 962, 964, 965]);
  });

  it('handles edges: a trailing dropout, an upward spike, and cleanEdges=false', async () => {
    assert.deepEqual(valuesOf(await despike([950, 951, 953, 958, 959, 0], { maxDelta: 100 })), [950, 951, 953, 958, 959]);
    assert.deepEqual(valuesOf(await despike([950, 951, 953, 9999, 958, 959, 962], { maxDelta: 100 })), [950, 951, 953, 958, 959, 962]);
    assert.deepEqual(valuesOf(await despike([953, 958, 959, 0], { maxDelta: 100, cleanEdges: false })), [953, 958, 959, 0]);
  });

  it('self-corrects a boundary guess once the next reading arrives', async () => {
    assert.deepEqual(valuesOf(await despike([950, 955, 960, 0], { maxDelta: 100 })), [950, 955, 960], 'run 1: last-point 0 looks like a spike');
    assert.deepEqual(valuesOf(await despike([950, 955, 960, 0, 1, 2], { maxDelta: 100 })), [950, 955, 960, 0, 1, 2], 'run 2: it was a reset, kept');
  });
});

describe('predicate toolkit', () => {
  const { SPINAL_RELATION_PTR_LST_TYPE } = require('spinal-env-viewer-graph-service');
  const node = (name, type = 'geographicRoom') => H.createAnchor(name).node;

  it('EXISTS: null / undefined / [] / blank are "no value"; 0 and false are values', async () => {
    const exists = (v) => algo('EXISTS').run(v);
    assert.deepEqual(await Promise.all([null, undefined, [], '', '   '].map(exists)), [false, false, false, false, false]);
    assert.deepEqual(await Promise.all([0, false, 'x', [1], node('R')].map(exists)), [true, true, true, true, true]);
  });

  it('EQUALS / EQUALS_PARAM: numeric when both numeric, nodes by id, else text', async () => {
    const eq = (a, b, params = {}) => algo('EQUALS').run([a, b], params);
    assert.equal(await eq(5, '5'), true);
    assert.equal(await eq('Bureaux', 'bureaux'), false);
    assert.equal(await eq('Bureaux', 'bureaux', { ignoreCase: true }), true);
    assert.equal(await eq(null, undefined), true);
    assert.equal(await eq(null, ''), false);
    const room = node('R1');
    assert.equal(await eq(room, room), true);
    assert.equal(await eq(room, node('R1')), false, 'same name, different node');
    assert.equal(await algo('EQUALS_PARAM').run('geographicRoom', { expected: 'geographicRoom' }), true);
    assert.equal(await algo('EQUALS_PARAM').run(true, { expected: 'true' }), true);
    await assert.rejects(() => algo('EQUALS_PARAM').run('x', {}), /requires an "expected" parameter/);
  });

  it('MATCHES_REGEX: flags, non-text handling, invalid pattern', async () => {
    const m = (text, pattern, flags) => algo('MATCHES_REGEX').run(text, { pattern, flags });
    assert.equal(await m('Bureaux Nord', '^Bureau'), true);
    assert.equal(await m('bureaux', '^Bureau'), false);
    assert.equal(await m('bureaux', '^Bureau', 'i'), true);
    assert.equal(await m(42, '^4'), true);
    assert.equal(await m(null, '.*'), false, 'nothing never matches');
    await assert.rejects(() => m(node('R'), 'R'), /read the field to test with GET_NODE_INFO first/);
    await assert.rejects(() => m('x', '('), /invalid pattern/);
  });

  it('GET_NODE_INFO: name by default, any info key, null when absent', async () => {
    const room = node('Bureau 12', 'geographicRoom');
    assert.equal(await algo('GET_NODE_INFO').run(room, {}), 'Bureau 12');
    assert.equal(await algo('GET_NODE_INFO').run(room, { property: 'type' }), 'geographicRoom');
    assert.equal(await algo('GET_NODE_INFO').run(room, { property: 'id' }), room.getId().get());
    assert.equal(await algo('GET_NODE_INFO').run(room, { property: 'noSuchKey' }), null);
    await assert.rejects(() => algo('GET_NODE_INFO').run('not a node', {}), /expects a SpinalNode/);
  });

  it('COUNT: arrays, JSON arrays, nothing, single values', async () => {
    const count = (v) => algo('COUNT').run(v);
    assert.deepEqual(await Promise.all([[node('A'), node('B')], '[1,2,3]', null, undefined, 'plain', 7].map(count)), [2, 3, 0, 0, 1, 1]);
  });

  it('GET_NODE_PARENT / GET_NODE_CHILD: ifNotFound "null" instead of failing', async () => {
    const group = node('Bureaux', 'geographicRoomGroup');
    const room = node('Bureau 12');
    await group.addChild(room, 'groupHasgeographicRoom', SPINAL_RELATION_PTR_LST_TYPE);
    const lookup = (regexFilter, extra = {}) =>
      algo('GET_NODE_PARENT').run(room, { regex: 'groupHasgeographicRoom', regexFilter, ...extra });
    assert.equal((await lookup('^Bureaux$')).getId().get(), group.getId().get());
    await assert.rejects(() => lookup('^Cuisine$'), /no parent found/, 'default behaviour is unchanged');
    assert.equal(await lookup('^Cuisine$', { ifNotFound: 'null' }), null);
    await assert.rejects(() => lookup('^Cuisine$', { ifNotFound: 'maybe' }), /"ifNotFound" must be "error" or "null"/);
    assert.equal(await algo('GET_NODE_CHILD').run(group, { regexFilter: '^Nope$', ifNotFound: 'null' }), null);
  });
});
