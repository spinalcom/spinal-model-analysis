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
const spinal_model_timeseries_1 = require("spinal-model-timeseries");
const core_1 = require("./core");
const SingletonTimeSeries_1 = require("../../services/SingletonTimeSeries");
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
exports.TIMESERIES_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'GET_ENDPOINT_TIMESERIES',
        description: 'Fetches the timeseries of a BmsEndpoint node as an array of { date, value } points ' +
            '(date in epoch ms, value numeric), ordered by date. ' +
            'The time window can be given as an absolute range (start/end) or relative to the ' +
            'execution reference time (windowMs/lastHours/lastDays back from end). ' +
            'If the endpoint has no timeseries, an empty array is returned.',
        inputTypes: ['SpinalNode'],
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
        ],
        run: (input, params, context) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            if (!isSpinalNode(input))
                throw new Error('Expected SpinalNode input');
            // Resolve the timeseries directly from the node via its relation. This avoids
            // depending on the node being registered in SpinalGraphService, and yields an
            // empty result when the endpoint simply has no timeseries.
            const tsChildren = yield input.getChildren([spinal_model_timeseries_1.SpinalTimeSeries.relationName]);
            if (tsChildren.length === 0)
                return [];
            const timeseries = yield ((_a = tsChildren[0].element) === null || _a === void 0 ? void 0 : _a.load());
            if (!timeseries)
                return [];
            // ── Resolve the time window ──
            const referenceTime = (_c = (_b = context === null || context === void 0 ? void 0 : context.execution) === null || _b === void 0 ? void 0 : _b.referenceTime) !== null && _c !== void 0 ? _c : Date.now();
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
            const service = SingletonTimeSeries_1.SingletonServiceTimeseries.getInstance();
            return yield service.getFromIntervalTime(timeseries, start, end, includeValueAtBegin);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_FIRST',
        description: 'Returns the value of the first (earliest) point of a timeseries ({ date, value }[]). ' +
            'Throws if the series is empty, unless defaultOnEmpty is provided.',
        inputTypes: ['SpinalDateValue[]'],
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
        inputTypes: ['SpinalDateValue[]'],
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
        inputTypes: ['SpinalDateValue[]'],
        outputType: 'number',
        parameters: [DEFAULT_ON_EMPTY_PARAM],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const series = asSeries(input, 'TIMESERIES_DELTA');
            if (series.length === 0)
                return resolveEmpty(params, 'TIMESERIES_DELTA');
            return series[series.length - 1].value - series[0].value;
        }),
    }),
];
//# sourceMappingURL=timeseries.algorithms.js.map