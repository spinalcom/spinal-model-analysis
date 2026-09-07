"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIMESERIES_ALGORITHMS = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_model_timeseries_1 = require("spinal-model-timeseries");
const core_1 = require("./core");
const SingletonTimeSeries_1 = require("../../services/SingletonTimeSeries");
const utils_1 = require("../../services/utils");
const isSpinalNode = (value) => {
    return (Boolean(value) &&
        typeof value === 'object' &&
        typeof value.getId === 'function');
};
const isSpinalDateValueArray = (value) => {
    return (Array.isArray(value) &&
        value.every((item) => Boolean(item) &&
            typeof item === 'object' &&
            typeof item.value === 'number'));
};
/**
 * Validates that the input is a timeseries array (possibly empty).
 * Throws a clear, block-named error if the input is not a { date, value }[].
 */
const asSeries = (input, blockName) => {
    if (!isSpinalDateValueArray(input)) {
        throw new Error(`${blockName}: expected a timeseries ({ date, value }[]) input`);
    }
    return input;
};
/**
 * Decides what a reducer returns for an empty series:
 * - if a "defaultOnEmpty" param is provided, returns it (e.g. 0 so a dysfunctional
 *   endpoint with no data contributes nothing to a downstream sum);
 * - otherwise throws a clear, block-named error so the cause is obvious in the logs.
 */
const resolveEmpty = (params, blockName) => {
    const fallback = params === null || params === void 0 ? void 0 : params.defaultOnEmpty;
    if (fallback === undefined) {
        throw new Error(`${blockName}: timeseries is empty — no data in the requested window`);
    }
    const n = Number(fallback);
    if (isNaN(n)) {
        throw new Error(`${blockName}: invalid "defaultOnEmpty" parameter: expected a number, got ${JSON.stringify(fallback)}`);
    }
    return n;
};
/** Shared optional param letting reducers default to a value instead of throwing on empty. */
const DEFAULT_ON_EMPTY_PARAM = {
    name: 'defaultOnEmpty',
    type: 'number',
    description: 'Value to return when the series is empty (e.g. a dysfunctional endpoint with no data, ' +
        'so it contributes this value to a downstream sum). If omitted, the block throws on an empty series.',
    required: false,
};
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
/**
 * Parses a parameter into an epoch-ms timestamp.
 * Accepts a number (epoch ms), a numeric string, or a parseable date string (ISO, etc.).
 */
const parseTime = (value, label) => {
    if (typeof value === 'number' && !isNaN(value))
        return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
            const asNumber = Number(trimmed);
            if (!isNaN(asNumber))
                return asNumber;
            const asDate = Date.parse(trimmed);
            if (!isNaN(asDate))
                return asDate;
        }
    }
    throw new Error(`Invalid "${label}" parameter: expected epoch ms or a parseable date string, got ${JSON.stringify(value)}`);
};
/**
 * Resolves a relative window length (in ms) from the windowMs / lastHours / lastDays
 * parameters. Returns undefined when none are provided.
 */
const resolveWindowMs = (params) => {
    const fromUnit = (raw, unitMs, label) => {
        const n = Number(raw);
        if (isNaN(n) || n < 0) {
            throw new Error(`Invalid "${label}" parameter: expected a non-negative number, got ${JSON.stringify(raw)}`);
        }
        return n * unitMs;
    };
    if ((params === null || params === void 0 ? void 0 : params.windowMs) !== undefined)
        return fromUnit(params.windowMs, 1, 'windowMs');
    if ((params === null || params === void 0 ? void 0 : params.lastHours) !== undefined)
        return fromUnit(params.lastHours, HOUR_MS, 'lastHours');
    if ((params === null || params === void 0 ? void 0 : params.lastDays) !== undefined)
        return fromUnit(params.lastDays, DAY_MS, 'lastDays');
    return undefined;
};
/**
 * Parses a GENERATE_TIMESTAMPS "interval" into milliseconds. Accepts a bare number (minutes),
 * or a string with an optional unit: "15m"/"15min", "1h"/"1hr", "30s", "500ms", "1d".
 */
const parseInterval = (value) => {
    if (typeof value === 'number' && isFinite(value) && value > 0)
        return value * 60 * 1000; // bare number = minutes
    if (typeof value === 'string') {
        const m = value.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|min|h|hr|d)?$/);
        if (m) {
            const n = parseFloat(m[1]);
            const unitMs = { ms: 1, s: 1000, m: 60000, min: 60000, h: HOUR_MS, hr: HOUR_MS, d: DAY_MS };
            const mult = unitMs[m[2] || 'm'];
            if (n > 0 && mult !== undefined)
                return n * mult;
        }
    }
    throw new Error(`GENERATE_TIMESTAMPS: invalid "interval" — expected minutes as a number, or "15m"/"1h"/"30s"/"1d", got ${JSON.stringify(value)}`);
};
/**
 * Extracts a time-of-day (ms since midnight, [0, DAY_MS)) from a value:
 * - "HH:mm" / "HH:mm:ss" strings,
 * - numbers as Excel time fractions (the fractional part of a serial → time of day),
 * - Date instances (their UTC time-of-day, matching how ExcelJS surfaces date cells),
 * - any other parseable date string (its UTC time-of-day).
 */
const timeOfDayMs = (value, label) => {
    if (value instanceof Date && !isNaN(value.getTime())) {
        return ((value.getUTCHours() * 60 + value.getUTCMinutes()) * 60 + value.getUTCSeconds()) * 1000 + value.getUTCMilliseconds();
    }
    if (typeof value === 'number' && isFinite(value)) {
        const frac = value - Math.floor(value); // fractional part of an Excel serial = time of day
        return Math.round(frac * DAY_MS);
    }
    if (typeof value === 'string') {
        const s = value.trim();
        const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (m) {
            const h = Number(m[1]), min = Number(m[2]), sec = m[3] ? Number(m[3]) : 0;
            if (h < 24 && min < 60 && sec < 60)
                return ((h * 60 + min) * 60 + sec) * 1000;
        }
        const parsed = Date.parse(s);
        if (!isNaN(parsed)) {
            const d = new Date(parsed);
            return ((d.getUTCHours() * 60 + d.getUTCMinutes()) * 60 + d.getUTCSeconds()) * 1000 + d.getUTCMilliseconds();
        }
    }
    throw new Error(`GENERATE_TIMESTAMPS: invalid time-of-day (${label}) — expected "HH:mm", "HH:mm:ss", an Excel time fraction, or a Date, got ${JSON.stringify(value)}`);
};
/**
 * Epoch-ms of 00:00 on the run day, shifted by dayOffset days, in the local or UTC zone.
 */
const startOfDayMs = (referenceTime, dayOffset, timezone) => {
    const d = new Date(referenceTime);
    if (timezone === 'utc') {
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + dayOffset, 0, 0, 0, 0);
    }
    d.setDate(d.getDate() + dayOffset);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
};
exports.TIMESERIES_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'GENERATE_TIMESTAMPS',
        description: 'Builds an array of epoch-ms timestamps for the analytic\'s run day — pair it with a static ' +
            'value column via COLUMNS_TO_TIMESERIES to inject a daily timeseries whose dates always follow ' +
            '"today" with no Excel date formula. The day comes from the execution\'s referenceTime ' +
            '(deterministic for backfill/simulation), shifted by "dayOffset". Two modes: GRID (default) ' +
            'generates "count" timestamps from "start" spaced by "interval"; STAMP takes an input array of ' +
            'time-of-day values ("HH:mm", Excel time fractions, or Date cells) and stamps each onto the run ' +
            'day. In GRID mode "count" defaults to the length of the (optional) input array — so wiring the ' +
            'value column makes the axis match it automatically.',
        inputs: [
            {
                name: 'reference',
                types: ['any[]'],
                description: 'Optional. GRID mode: any array whose length sets "count" (e.g. the value column, so the ' +
                    'axis auto-matches it). STAMP mode: the time-of-day values to stamp onto the run day.',
                required: false,
            },
        ],
        outputType: 'any',
        parameters: [
            { name: 'mode', type: 'string', description: 'GRID (generate from start+interval) or STAMP (stamp the input time-of-day values onto the run day). Default GRID.', required: false },
            { name: 'interval', type: 'string', description: 'GRID spacing: minutes as a number, or "15m"/"1h"/"30s"/"1d". Required in GRID mode.', required: false },
            { name: 'start', type: 'string', description: 'GRID first timestamp\'s time-of-day ("HH:mm" or "HH:mm:ss"). Default "00:00".', required: false },
            { name: 'count', type: 'number', description: 'GRID number of timestamps. Defaults to the length of the wired input array.', required: false },
            { name: 'dayOffset', type: 'number', description: 'Days to shift from the run day (referenceTime): 0 = today, -1 = yesterday. Default 0.', required: false },
            { name: 'timezone', type: 'string', description: '"local" (server-local midnight, default) or "utc" (UTC midnight) for the start of the day.', required: false },
        ],
        run: (input, params, context) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const referenceTime = (_b = (_a = context === null || context === void 0 ? void 0 : context.execution) === null || _a === void 0 ? void 0 : _a.referenceTime) !== null && _b !== void 0 ? _b : Date.now();
            const dayOffset = (params === null || params === void 0 ? void 0 : params.dayOffset) !== undefined ? Number(params.dayOffset) : 0;
            if (!Number.isFinite(dayOffset))
                throw new Error('GENERATE_TIMESTAMPS: "dayOffset" must be a number');
            const timezone = String((_c = params === null || params === void 0 ? void 0 : params.timezone) !== null && _c !== void 0 ? _c : 'local').trim().toLowerCase() === 'utc' ? 'utc' : 'local';
            const dayStart = startOfDayMs(referenceTime, Math.trunc(dayOffset), timezone);
            const inputArray = Array.isArray(input)
                ? input
                : input === undefined || input === null
                    ? []
                    : [input];
            const mode = String((_d = params === null || params === void 0 ? void 0 : params.mode) !== null && _d !== void 0 ? _d : 'grid').trim().toLowerCase();
            if (mode === 'stamp') {
                if (inputArray.length === 0) {
                    throw new Error('GENERATE_TIMESTAMPS (STAMP mode): requires an input array of time-of-day values');
                }
                return inputArray.map((v, i) => dayStart + timeOfDayMs(v, `input[${i}]`));
            }
            // GRID mode
            if ((params === null || params === void 0 ? void 0 : params.interval) === undefined || (params === null || params === void 0 ? void 0 : params.interval) === null || `${params.interval}` === '') {
                throw new Error('GENERATE_TIMESTAMPS (GRID mode): requires an "interval" parameter (e.g. "15m")');
            }
            const intervalMs = parseInterval(params.interval);
            const base = dayStart + timeOfDayMs((_e = params === null || params === void 0 ? void 0 : params.start) !== null && _e !== void 0 ? _e : '00:00', 'start');
            const rawCount = (params === null || params === void 0 ? void 0 : params.count) !== undefined && (params === null || params === void 0 ? void 0 : params.count) !== null && `${params.count}` !== ''
                ? Number(params.count)
                : inputArray.length;
            if (!Number.isFinite(rawCount) || rawCount <= 0 || Math.trunc(rawCount) !== rawCount) {
                throw new Error(`GENERATE_TIMESTAMPS (GRID mode): "count" must be a positive integer (or wire an input array to derive it), got ${JSON.stringify((_f = params === null || params === void 0 ? void 0 : params.count) !== null && _f !== void 0 ? _f : inputArray.length)}`);
            }
            const out = new Array(rawCount);
            for (let i = 0; i < rawCount; i++)
                out[i] = base + i * intervalMs;
            return out;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_ENDPOINT_TIMESERIES',
        description: 'Fetches the timeseries of a BmsEndpoint node as an array of { date, value } points ' +
            '(date in epoch ms, value numeric), ordered by date. ' +
            'The time window can be given as an absolute range (start/end) or relative to the ' +
            'execution reference time (windowMs/lastHours/lastDays back from end). ' +
            'Use includeValueAtBegin / extendToEnd to seed the value at the window edges so a ' +
            'downstream span calc (e.g. TIMESERIES_TIME_WEIGHTED_AVERAGE) covers the whole window. ' +
            'If the endpoint has no timeseries, an empty array is returned.',
        inputs: [
            { name: 'endpoint', types: ['SpinalNode'], description: 'The BmsEndpoint node whose timeseries to fetch.', required: true },
        ],
        outputType: 'SpinalDateValue[]',
        parameters: [
            {
                name: 'start',
                type: 'number',
                description: 'Absolute window start, epoch ms or a parseable date string. ' +
                    'Takes precedence over the relative window params. Defaults to the start of the data (0).',
                required: false,
            },
            {
                name: 'end',
                type: 'number',
                description: 'Absolute window end, epoch ms or a parseable date string. ' +
                    'Defaults to the execution reference time (or now if unavailable).',
                required: false,
            },
            {
                name: 'windowMs',
                type: 'number',
                description: 'Relative window length in milliseconds, counted back from "end". Ignored if "start" is set.',
                required: false,
            },
            {
                name: 'lastHours',
                type: 'number',
                description: 'Relative window length in hours, counted back from "end". Ignored if "start" or "windowMs" is set.',
                required: false,
            },
            {
                name: 'lastDays',
                type: 'number',
                description: 'Relative window length in days, counted back from "end". Ignored if "start", "windowMs" or "lastHours" is set.',
                required: false,
            },
            {
                name: 'includeValueAtBegin',
                type: 'boolean',
                description: 'If true, include the last recorded value before "start" so the series has a value at the window opening. Default false.',
                required: false,
            },
            {
                name: 'extendToEnd',
                type: 'boolean',
                description: 'If true, append a point at "end" holding the last recorded value, so the last reading is ' +
                    'carried to the window close. Symmetric to includeValueAtBegin (which seeds the window ' +
                    'opening); together they make the series span the full window, so a downstream ' +
                    'TIMESERIES_TIME_WEIGHTED_AVERAGE is window-correct. Default false.',
                required: false,
            },
        ],
        run: (input, params, context) => __awaiter(void 0, void 0, void 0, function* () {
            var _g, _h, _j;
            if (!isSpinalNode(input))
                throw new Error('Expected SpinalNode input');
            // Resolve the timeseries directly from the node via its relation. This avoids
            // depending on the node being registered in SpinalGraphService, and yields an
            // empty result when the endpoint simply has no timeseries.
            const tsChildren = yield input.getChildren([spinal_model_timeseries_1.SpinalTimeSeries.relationName]);
            if (tsChildren.length === 0)
                return [];
            const timeseries = yield ((_g = tsChildren[0].element) === null || _g === void 0 ? void 0 : _g.load());
            if (!timeseries)
                return [];
            // ── Resolve the time window ──
            const referenceTime = (_j = (_h = context === null || context === void 0 ? void 0 : context.execution) === null || _h === void 0 ? void 0 : _h.referenceTime) !== null && _j !== void 0 ? _j : Date.now();
            const end = (params === null || params === void 0 ? void 0 : params.end) !== undefined ? parseTime(params.end, 'end') : referenceTime;
            let start;
            if ((params === null || params === void 0 ? void 0 : params.start) !== undefined) {
                start = parseTime(params.start, 'start');
            }
            else {
                const windowMs = resolveWindowMs(params);
                start = windowMs !== undefined ? end - windowMs : 0;
            }
            const includeValueAtBegin = (params === null || params === void 0 ? void 0 : params.includeValueAtBegin) === true || (params === null || params === void 0 ? void 0 : params.includeValueAtBegin) === 'true';
            const extendToEnd = (params === null || params === void 0 ? void 0 : params.extendToEnd) === true || (params === null || params === void 0 ? void 0 : params.extendToEnd) === 'true';
            const service = SingletonTimeSeries_1.SingletonServiceTimeseries.getInstance();
            const result = yield service.getFromIntervalTime(timeseries, start, end, includeValueAtBegin);
            // Optionally carry the last recorded value to the window end, so a downstream
            // time-weighted average (or any span calc) covers the full [start, end] window.
            // Mirrors includeValueAtBegin, which seeds the value at the window opening.
            if (extendToEnd && result.length > 0) {
                const last = result[result.length - 1];
                if (last.date < end) {
                    return [...result, { date: end, value: last.value }];
                }
            }
            return result;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_FIRST',
        description: 'Returns the value of the first (earliest) point of a timeseries ({ date, value }[]). ' +
            'Throws if the series is empty, unless defaultOnEmpty is provided.',
        inputs: [
            { name: 'series', types: ['SpinalDateValue[]'], description: 'The timeseries ({ date, value }[]) to reduce.', required: true },
        ],
        outputType: 'number',
        parameters: [DEFAULT_ON_EMPTY_PARAM],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const series = asSeries(input, 'TIMESERIES_FIRST');
            if (series.length === 0)
                return resolveEmpty(params, 'TIMESERIES_FIRST');
            return series[0].value;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_LAST',
        description: 'Returns the value of the last (latest) point of a timeseries ({ date, value }[]). ' +
            'Throws if the series is empty, unless defaultOnEmpty is provided.',
        inputs: [
            { name: 'series', types: ['SpinalDateValue[]'], description: 'The timeseries ({ date, value }[]) to reduce.', required: true },
        ],
        outputType: 'number',
        parameters: [DEFAULT_ON_EMPTY_PARAM],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const series = asSeries(input, 'TIMESERIES_LAST');
            if (series.length === 0)
                return resolveEmpty(params, 'TIMESERIES_LAST');
            return series[series.length - 1].value;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_DELTA',
        description: 'Returns the difference between the last and first values of a timeseries ' +
            '(last − first). For a cumulative meter fetched over a window, this is the ' +
            'consumption over that window. Pair with GET_ENDPOINT_TIMESERIES\'s ' +
            'includeValueAtBegin=true so the baseline at the window start is used as "first". ' +
            'A single point yields 0. Throws if the series is empty, unless defaultOnEmpty is provided ' +
            '(e.g. 0 for a dysfunctional endpoint that should contribute nothing to a sum).',
        inputs: [
            { name: 'series', types: ['SpinalDateValue[]'], description: 'The timeseries ({ date, value }[]) to reduce.', required: true },
        ],
        outputType: 'number',
        parameters: [DEFAULT_ON_EMPTY_PARAM],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const series = asSeries(input, 'TIMESERIES_DELTA');
            if (series.length === 0)
                return resolveEmpty(params, 'TIMESERIES_DELTA');
            return series[series.length - 1].value - series[0].value;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_DESPIKE',
        description: 'Removes transient spikes/dropouts from a timeseries ({ date, value }[]) — e.g. a cumulative ' +
            'energy counter that momentarily reads 0 (…958, 0, 959…) and injects huge false deltas into ' +
            'consumption. A point is treated as a spike only when it deviates sharply from the local trend ' +
            'AND the series recovers right after (the next reading returns to the neighbours\' level) — so ' +
            'isolated dropouts are removed while genuine meter resets/rollovers (…958, 0, 1, 2…) are kept. ' +
            'The detection scale is the "maxDelta" parameter (the largest plausible change between two ' +
            'samples); if omitted it is "factor" × the median absolute step of the series (robust to the ' +
            'spikes themselves). Targets isolated single-sample spikes. Output is sorted by date; a series ' +
            'shorter than 3 points is returned unchanged.',
        inputs: [
            { name: 'series', types: ['SpinalDateValue[]'], description: 'The timeseries ({ date, value }[]) to clean.', required: true },
        ],
        outputType: 'SpinalDateValue[]',
        parameters: [
            { name: 'action', type: 'string', description: 'What to do with a detected spike: "drop" (default — remove the point, so the delta bridges its good neighbours) or "interpolate" (replace its value with the neighbours\' trend, keeping the timestamp and point count).', required: false },
            { name: 'maxDelta', type: 'number', description: 'Largest plausible change between two consecutive samples. A point deviating from the local trend by more than this (while the series recovers around it) is a spike. If omitted, an automatic threshold is used.', required: false },
            { name: 'factor', type: 'number', description: 'Multiplier for the automatic threshold (factor × median absolute step) when "maxDelta" is not given. Default 6.', required: false },
            { name: 'cleanEdges', type: 'boolean', description: 'Whether to also clean the first and last points (default true). At an edge there is no "recovery" reading to confirm a spike, so the preceding/following trend is extrapolated instead. Set false to leave the latest (and earliest) point untouched — useful when the last sample is the current, not-yet-confirmed value and you would rather wait for the next reading to decide.', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            var _k;
            const raw = asSeries(input, 'TIMESERIES_DESPIKE');
            if (raw.length < 3)
                return [...raw];
            const series = [...raw].sort((a, b) => a.date - b.date);
            const n = series.length;
            const v = series.map((p) => p.value);
            // Detection scale: explicit maxDelta, else factor × median(|Δ|). The median is robust to the
            // very spikes we're removing, so a couple of huge steps don't inflate it.
            let threshold;
            if ((params === null || params === void 0 ? void 0 : params.maxDelta) !== undefined && Number.isFinite(Number(params.maxDelta))) {
                threshold = Math.abs(Number(params.maxDelta));
            }
            else {
                const factor = (params === null || params === void 0 ? void 0 : params.factor) !== undefined && Number.isFinite(Number(params.factor)) ? Number(params.factor) : 6;
                const steps = [];
                for (let i = 1; i < n; i++)
                    steps.push(Math.abs(v[i] - v[i - 1]));
                steps.sort((a, b) => a - b);
                const mid = Math.floor(steps.length / 2);
                const median = steps.length % 2 ? steps[mid] : (steps[mid - 1] + steps[mid]) / 2;
                threshold = factor * median;
            }
            const action = String((_k = params === null || params === void 0 ? void 0 : params.action) !== null && _k !== void 0 ? _k : 'drop').trim().toLowerCase() === 'interpolate' ? 'interpolate' : 'drop';
            const cleanEdges = (0, utils_1.resolveBooleanFlag)(params === null || params === void 0 ? void 0 : params.cleanEdges, true);
            // Expected value from the local trend, and how consistent the series is across the point
            // (the "recovery" test). Interior points interpolate their neighbours; endpoints linearly
            // extrapolate from the two inner points.
            const analyze = (i) => {
                if (i > 0 && i < n - 1) {
                    return { expected: (v[i - 1] + v[i + 1]) / 2, consistency: Math.abs(v[i + 1] - v[i - 1]) };
                }
                if (i === 0) {
                    return { expected: 2 * v[1] - v[2], consistency: Math.abs(v[2] - v[1]) };
                }
                return { expected: 2 * v[n - 2] - v[n - 3], consistency: Math.abs(v[n - 2] - v[n - 3]) };
            };
            const out = [];
            for (let i = 0; i < n; i++) {
                const isEdge = i === 0 || i === n - 1;
                if (isEdge && !cleanEdges) {
                    out.push(series[i]);
                    continue;
                }
                const a = analyze(i);
                const isSpike = Math.abs(v[i] - a.expected) > threshold && a.consistency <= threshold;
                if (!isSpike) {
                    out.push(series[i]);
                }
                else if (action === 'interpolate') {
                    out.push({ date: series[i].date, value: a.expected });
                }
                // action 'drop' → the spike is skipped entirely
            }
            return out;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_TIME_WEIGHTED_AVERAGE',
        description: 'Computes the time-weighted average of a timeseries ({ date, value }[]) with a zero-order ' +
            'hold: each value is weighted by the time until the next point (a flat-line/step model, the ' +
            'right model for sensor readings), averaged over the span [first point, last point]. ' +
            'To make it window-correct, shape the series at fetch time with GET_ENDPOINT_TIMESERIES ' +
            'includeValueAtBegin=true (a value at the window open) and extendToEnd=true (the last value ' +
            'carried to the window close) — then the span IS the window. A single point — or a series ' +
            'spanning no time — yields the plain mean of the values. Throws if the series is empty, unless ' +
            'defaultOnEmpty is provided.',
        inputs: [
            { name: 'series', types: ['SpinalDateValue[]'], description: 'The timeseries ({ date, value }[]) to average.', required: true }
        ],
        outputType: 'number',
        parameters: [DEFAULT_ON_EMPTY_PARAM],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const raw = asSeries(input, 'TIMESERIES_TIME_WEIGHTED_AVERAGE');
            if (raw.length === 0)
                return resolveEmpty(params, 'TIMESERIES_TIME_WEIGHTED_AVERAGE');
            // Integrate over a copy sorted by date — the fetch returns sorted points, but a
            // hand-built series might not be, and the weighting depends on chronological order.
            const series = [...raw].sort((a, b) => a.date - b.date);
            const n = series.length;
            const window = series[n - 1].date - series[0].date;
            // No time span (single point or all-equal dates) → no durations to weight by, so
            // fall back to the arithmetic mean (which equals the value for one point).
            if (window <= 0) {
                return series.reduce((acc, p) => acc + p.value, 0) / n;
            }
            // Each value is held from its own date until the next point's date; the last point
            // closes the span and contributes no duration.
            let integral = 0;
            for (let i = 0; i < n - 1; i++) {
                integral += series[i].value * (series[i + 1].date - series[i].date);
            }
            return integral / window;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_MIN',
        description: 'Returns the minimum value of a timeseries ({ date, value }[]). ' +
            'Throws if the series is empty, unless defaultOnEmpty is provided.',
        inputs: [
            { name: 'series', types: ['SpinalDateValue[]'], description: 'The timeseries ({ date, value }[]) to reduce.', required: true },
        ],
        outputType: 'number',
        parameters: [DEFAULT_ON_EMPTY_PARAM],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const series = asSeries(input, 'TIMESERIES_MIN');
            if (series.length === 0)
                return resolveEmpty(params, 'TIMESERIES_MIN');
            return Math.min(...series.map((p) => p.value));
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_MAX',
        description: 'Returns the maximum value of a timeseries ({ date, value }[]). ' +
            'Throws if the series is empty, unless defaultOnEmpty is provided.',
        inputs: [
            { name: 'series', types: ['SpinalDateValue[]'], description: 'The timeseries ({ date, value }[]) to reduce.', required: true },
        ],
        outputType: 'number',
        parameters: [DEFAULT_ON_EMPTY_PARAM],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const series = asSeries(input, 'TIMESERIES_MAX');
            if (series.length === 0)
                return resolveEmpty(params, 'TIMESERIES_MAX');
            return Math.max(...series.map((p) => p.value));
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_AVERAGE',
        description: 'Returns the plain arithmetic mean of a timeseries\' values ({ date, value }[]) — every point ' +
            'counts equally, regardless of spacing. For an average that accounts for the time between ' +
            'samples (the right choice for irregular sensor data), use TIMESERIES_TIME_WEIGHTED_AVERAGE. ' +
            'Throws if the series is empty, unless defaultOnEmpty is provided.',
        inputs: [
            { name: 'series', types: ['SpinalDateValue[]'], description: 'The timeseries ({ date, value }[]) to average.', required: true },
        ],
        outputType: 'number',
        parameters: [DEFAULT_ON_EMPTY_PARAM],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const series = asSeries(input, 'TIMESERIES_AVERAGE');
            if (series.length === 0)
                return resolveEmpty(params, 'TIMESERIES_AVERAGE');
            return series.reduce((acc, p) => acc + p.value, 0) / series.length;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_SUM',
        description: 'Returns the sum of a timeseries\' values ({ date, value }[]). ' +
            'Throws if the series is empty, unless defaultOnEmpty is provided (e.g. 0).',
        inputs: [
            { name: 'series', types: ['SpinalDateValue[]'], description: 'The timeseries ({ date, value }[]) to sum.', required: true },
        ],
        outputType: 'number',
        parameters: [DEFAULT_ON_EMPTY_PARAM],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const series = asSeries(input, 'TIMESERIES_SUM');
            if (series.length === 0)
                return resolveEmpty(params, 'TIMESERIES_SUM');
            return series.reduce((acc, p) => acc + p.value, 0);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_COUNT',
        description: 'Returns the number of points in a timeseries ({ date, value }[]). ' +
            'Returns 0 for an empty series — a count is always well-defined, so this never throws.',
        inputs: [
            { name: 'series', types: ['SpinalDateValue[]'], description: 'The timeseries ({ date, value }[]) to count.', required: true },
        ],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            return asSeries(input, 'TIMESERIES_COUNT').length;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'PUSH_ENDPOINT_VALUE',
        description: 'Records a value on an endpoint: updates the node element\'s currentValue (like ' +
            'SET_ENDPOINT_VALUE) AND appends a point to the endpoint\'s timeseries (creating ' +
            'the timeseries if it does not exist yet). Takes 2 inputs: [endpointNode, value]. ' +
            'The timeseries point is dated at the execution reference time by default, or at ' +
            'the optional "date" parameter. Returns the value that was recorded.',
        inputs: [
            { name: 'endpoint', types: ['SpinalNode'], description: 'The endpoint node to record the value on.', required: true },
            { name: 'value', types: ['any'], description: 'The value to set as currentValue and append to the timeseries.', required: true },
        ],
        outputType: 'any',
        parameters: [
            {
                name: 'date',
                type: 'number',
                description: 'Timestamp for the timeseries point, epoch ms or a parseable date string. ' +
                    'Defaults to the execution reference time (or now if unavailable).',
                required: false,
            },
            {
                name: 'updateDirectModificationDate',
                type: 'boolean',
                description: 'If true, also stamps node.info.directModificationDate with the current time after ' +
                    'recording the value, so the BOS can detect the direct modification (default: false).',
                required: false,
            },
        ],
        run: (input, params, context) => __awaiter(void 0, void 0, void 0, function* () {
            var _l, _m, _o;
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('PUSH_ENDPOINT_VALUE expects 2 inputs: [endpointNode, value]');
            }
            const node = input[0];
            const rawValue = input[1];
            if (!isSpinalNode(node)) {
                throw new Error('PUSH_ENDPOINT_VALUE: first input must be a SpinalNode');
            }
            // Coerce the value to a number (or boolean) — the timeseries only stores numerics.
            let value;
            if (typeof rawValue === 'boolean') {
                value = rawValue;
            }
            else {
                const n = Number(rawValue);
                if (isNaN(n)) {
                    throw new Error(`PUSH_ENDPOINT_VALUE: value must be numeric or boolean, got ${JSON.stringify(rawValue)}`);
                }
                value = n;
            }
            // ── 1. Update the node's current value (same as SET_ENDPOINT_VALUE) ──
            const nodeElement = yield ((_l = node.element) === null || _l === void 0 ? void 0 : _l.load());
            if (!nodeElement)
                throw new Error('PUSH_ENDPOINT_VALUE: node has no element to load');
            const currentValue = nodeElement.currentValue;
            if (currentValue === undefined) {
                throw new Error('PUSH_ENDPOINT_VALUE: node element has no currentValue');
            }
            currentValue.set(value);
            if ((0, utils_1.resolveBooleanFlag)(params === null || params === void 0 ? void 0 : params.updateDirectModificationDate, false)) {
                (0, utils_1.touchDirectModificationDate)(node);
            }
            // ── 2. Append to the timeseries (creating it if missing) ──
            // The timeseries service resolves the endpoint by id through SpinalGraphService,
            // so register the node first (idempotent) — our work nodes come from raw traversal
            // and may not be in the registry, which would otherwise make the push silently fail.
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
            const nodeId = node.getId().get();
            const date = (params === null || params === void 0 ? void 0 : params.date) !== undefined
                ? parseTime(params.date, 'date')
                : (_o = (_m = context === null || context === void 0 ? void 0 : context.execution) === null || _m === void 0 ? void 0 : _m.referenceTime) !== null && _o !== void 0 ? _o : Date.now();
            const service = SingletonTimeSeries_1.SingletonServiceTimeseries.getInstance();
            const ok = yield service.insertFromEndpoint(nodeId, value, date);
            if (!ok) {
                throw new Error(`PUSH_ENDPOINT_VALUE: failed to append to the timeseries of "${node.getName().get()}"`);
            }
            return value;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'INSERT_TIMESERIES',
        description: 'Bulk-inserts a timeseries ({ date, value }[]) into an endpoint\'s timeseries, each point ' +
            'at its own timestamp (creating the timeseries if missing) — e.g. to backfill history ' +
            'imported from Excel via COLUMNS_TO_TIMESERIES. Takes 2 inputs: [endpointNode, series]. ' +
            'By default it does NOT touch the node\'s currentValue (backfilling old data shouldn\'t ' +
            'change "current"); set "updateCurrentValue" to also set it to the latest point. Returns ' +
            'the number of points inserted.',
        inputs: [
            { name: 'endpoint', types: ['SpinalNode'], description: 'The endpoint node to insert the timeseries into.', required: true },
            { name: 'series', types: ['SpinalDateValue[]'], description: 'The timeseries ({ date, value }[]) to insert (e.g. from COLUMNS_TO_TIMESERIES).', required: true },
        ],
        outputType: 'number',
        parameters: [
            {
                name: 'updateCurrentValue',
                type: 'boolean',
                description: 'If true, set the endpoint node\'s currentValue to the value of the latest (max-date) ' +
                    'point after inserting. Default false.',
                required: false,
            },
            {
                name: 'updateDirectModificationDate',
                type: 'boolean',
                description: 'If true, also stamps node.info.directModificationDate with the current time after ' +
                    'inserting, so the BOS can detect the direct modification (default: false).',
                required: false,
            },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            var _p, _q;
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('INSERT_TIMESERIES expects 2 inputs: [endpointNode, series]');
            }
            const node = input[0];
            if (!isSpinalNode(node)) {
                throw new Error('INSERT_TIMESERIES: first input must be a SpinalNode');
            }
            const series = asSeries(input[1], 'INSERT_TIMESERIES');
            if (series.length === 0)
                return 0;
            // The timeseries service resolves the endpoint by id through SpinalGraphService, so
            // register the node first (idempotent) — work nodes from raw traversal may not be in
            // the registry, which would otherwise make the insert silently fail.
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
            const nodeId = node.getId().get();
            const service = SingletonTimeSeries_1.SingletonServiceTimeseries.getInstance();
            let inserted = 0;
            for (const point of series) {
                const ok = yield service.insertFromEndpoint(nodeId, point.value, point.date);
                if (ok)
                    inserted++;
            }
            // Optionally reflect the latest point on the node's currentValue. Off by default:
            // backfilling historical data shouldn't move "current".
            if ((0, utils_1.resolveBooleanFlag)(params === null || params === void 0 ? void 0 : params.updateCurrentValue, false)) {
                const latest = series.reduce((a, b) => (b.date > a.date ? b : a), series[0]);
                const nodeElement = yield ((_p = node.element) === null || _p === void 0 ? void 0 : _p.load());
                if ((_q = nodeElement === null || nodeElement === void 0 ? void 0 : nodeElement.currentValue) === null || _q === void 0 ? void 0 : _q.set) {
                    nodeElement.currentValue.set(latest.value);
                }
            }
            if ((0, utils_1.resolveBooleanFlag)(params === null || params === void 0 ? void 0 : params.updateDirectModificationDate, false)) {
                (0, utils_1.touchDirectModificationDate)(node);
            }
            return inserted;
        }),
    }),
];
//# sourceMappingURL=timeseries.algorithms.js.map