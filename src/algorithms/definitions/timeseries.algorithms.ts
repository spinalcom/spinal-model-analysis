/* eslint-disable @typescript-eslint/no-explicit-any */
import { SpinalNode, SpinalGraphService } from 'spinal-env-viewer-graph-service';
import { SpinalTimeSeries } from 'spinal-model-timeseries';
import type { SpinalDateValue } from 'spinal-model-timeseries';
import {
  AlgorithmDefinition,
  AlgorithmRunResult,
  AlgorithmParams,
  createAlgorithm,
} from './core';
import { SingletonServiceTimeseries } from '../../services/SingletonTimeSeries';

const isSpinalNode = (value: unknown): value is SpinalNode<any> => {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as SpinalNode<any>).getId === 'function'
  );
};

const isSpinalDateValueArray = (value: unknown): value is SpinalDateValue[] => {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as SpinalDateValue).value === 'number'
    )
  );
};

/**
 * Validates that the input is a timeseries array (possibly empty).
 * Throws a clear, block-named error if the input is not a { date, value }[].
 */
const asSeries = (input: unknown, blockName: string): SpinalDateValue[] => {
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
const resolveEmpty = (params: AlgorithmParams | undefined, blockName: string): number => {
  const fallback = params?.defaultOnEmpty;
  if (fallback === undefined) {
    throw new Error(`${blockName}: timeseries is empty — no data in the requested window`);
  }
  const n = Number(fallback);
  if (isNaN(n)) {
    throw new Error(
      `${blockName}: invalid "defaultOnEmpty" parameter: expected a number, got ${JSON.stringify(fallback)}`
    );
  }
  return n;
};

/** Shared optional param letting reducers default to a value instead of throwing on empty. */
const DEFAULT_ON_EMPTY_PARAM = {
  name: 'defaultOnEmpty',
  type: 'number',
  description:
    'Value to return when the series is empty (e.g. a dysfunctional endpoint with no data, ' +
    'so it contributes this value to a downstream sum). If omitted, the block throws on an empty series.',
  required: false,
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Parses a parameter into an epoch-ms timestamp.
 * Accepts a number (epoch ms), a numeric string, or a parseable date string (ISO, etc.).
 */
const parseTime = (value: unknown, label: string): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      const asNumber = Number(trimmed);
      if (!isNaN(asNumber)) return asNumber;
      const asDate = Date.parse(trimmed);
      if (!isNaN(asDate)) return asDate;
    }
  }
  throw new Error(
    `Invalid "${label}" parameter: expected epoch ms or a parseable date string, got ${JSON.stringify(value)}`
  );
};

/**
 * Resolves a relative window length (in ms) from the windowMs / lastHours / lastDays
 * parameters. Returns undefined when none are provided.
 */
const resolveWindowMs = (params?: AlgorithmParams): number | undefined => {
  const fromUnit = (raw: unknown, unitMs: number, label: string): number => {
    const n = Number(raw);
    if (isNaN(n) || n < 0) {
      throw new Error(`Invalid "${label}" parameter: expected a non-negative number, got ${JSON.stringify(raw)}`);
    }
    return n * unitMs;
  };

  if (params?.windowMs !== undefined) return fromUnit(params.windowMs, 1, 'windowMs');
  if (params?.lastHours !== undefined) return fromUnit(params.lastHours, HOUR_MS, 'lastHours');
  if (params?.lastDays !== undefined) return fromUnit(params.lastDays, DAY_MS, 'lastDays');
  return undefined;
};

export const TIMESERIES_ALGORITHMS: AlgorithmDefinition[] = [
  createAlgorithm({
    name: 'GET_ENDPOINT_TIMESERIES',
    description:
      'Fetches the timeseries of a BmsEndpoint node as an array of { date, value } points ' +
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
        description:
          'Absolute window start, epoch ms or a parseable date string. ' +
          'Takes precedence over the relative window params. Defaults to the start of the data (0).',
        required: false,
      },
      {
        name: 'end',
        type: 'number',
        description:
          'Absolute window end, epoch ms or a parseable date string. ' +
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
    run: async (input, params, context): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');

      // Resolve the timeseries directly from the node via its relation. This avoids
      // depending on the node being registered in SpinalGraphService, and yields an
      // empty result when the endpoint simply has no timeseries.
      const tsChildren = await input.getChildren([SpinalTimeSeries.relationName]);
      if (tsChildren.length === 0) return [];

      const timeseries = await tsChildren[0].element?.load();
      if (!timeseries) return [];

      // ── Resolve the time window ──
      const referenceTime = context?.execution?.referenceTime ?? Date.now();
      const end = params?.end !== undefined ? parseTime(params.end, 'end') : referenceTime;

      let start: number;
      if (params?.start !== undefined) {
        start = parseTime(params.start, 'start');
      } else {
        const windowMs = resolveWindowMs(params);
        start = windowMs !== undefined ? end - windowMs : 0;
      }

      const includeValueAtBegin =
        params?.includeValueAtBegin === true || params?.includeValueAtBegin === 'true';

      const service = SingletonServiceTimeseries.getInstance();
      return await service.getFromIntervalTime(timeseries, start, end, includeValueAtBegin);
    },
  }),

  createAlgorithm({
    name: 'TIMESERIES_FIRST',
    description:
      'Returns the value of the first (earliest) point of a timeseries ({ date, value }[]). ' +
      'Throws if the series is empty, unless defaultOnEmpty is provided.',
    inputTypes: ['SpinalDateValue[]'],
    outputType: 'number',
    parameters: [DEFAULT_ON_EMPTY_PARAM],
    run: async (input, params): AlgorithmRunResult => {
      const series = asSeries(input, 'TIMESERIES_FIRST');
      if (series.length === 0) return resolveEmpty(params, 'TIMESERIES_FIRST');
      return series[0].value;
    },
  }),

  createAlgorithm({
    name: 'TIMESERIES_LAST',
    description:
      'Returns the value of the last (latest) point of a timeseries ({ date, value }[]). ' +
      'Throws if the series is empty, unless defaultOnEmpty is provided.',
    inputTypes: ['SpinalDateValue[]'],
    outputType: 'number',
    parameters: [DEFAULT_ON_EMPTY_PARAM],
    run: async (input, params): AlgorithmRunResult => {
      const series = asSeries(input, 'TIMESERIES_LAST');
      if (series.length === 0) return resolveEmpty(params, 'TIMESERIES_LAST');
      return series[series.length - 1].value;
    },
  }),

  createAlgorithm({
    name: 'TIMESERIES_DELTA',
    description:
      'Returns the difference between the last and first values of a timeseries ' +
      '(last − first). For a cumulative meter fetched over a window, this is the ' +
      'consumption over that window. Pair with GET_ENDPOINT_TIMESERIES\'s ' +
      'includeValueAtBegin=true so the baseline at the window start is used as "first". ' +
      'A single point yields 0. Throws if the series is empty, unless defaultOnEmpty is provided ' +
      '(e.g. 0 for a dysfunctional endpoint that should contribute nothing to a sum).',
    inputTypes: ['SpinalDateValue[]'],
    outputType: 'number',
    parameters: [DEFAULT_ON_EMPTY_PARAM],
    run: async (input, params): AlgorithmRunResult => {
      const series = asSeries(input, 'TIMESERIES_DELTA');
      if (series.length === 0) return resolveEmpty(params, 'TIMESERIES_DELTA');
      return series[series.length - 1].value - series[0].value;
    },
  }),

  createAlgorithm({
    name: 'PUSH_ENDPOINT_VALUE',
    description:
      'Records a value on an endpoint: updates the node element\'s currentValue (like ' +
      'SET_ENDPOINT_VALUE) AND appends a point to the endpoint\'s timeseries (creating ' +
      'the timeseries if it does not exist yet). Takes 2 inputs: [endpointNode, value]. ' +
      'The timeseries point is dated at the execution reference time by default, or at ' +
      'the optional "date" parameter. Returns the value that was recorded.',
    inputTypes: ['SpinalNode', 'any'],
    outputType: 'any',
    parameters: [
      {
        name: 'date',
        type: 'number',
        description:
          'Timestamp for the timeseries point, epoch ms or a parseable date string. ' +
          'Defaults to the execution reference time (or now if unavailable).',
        required: false,
      },
    ],
    run: async (input, params, context): AlgorithmRunResult => {
      if (!Array.isArray(input) || input.length < 2) {
        throw new Error('PUSH_ENDPOINT_VALUE expects 2 inputs: [endpointNode, value]');
      }
      const node = input[0];
      const rawValue = input[1];
      if (!isSpinalNode(node)) {
        throw new Error('PUSH_ENDPOINT_VALUE: first input must be a SpinalNode');
      }

      // Coerce the value to a number (or boolean) — the timeseries only stores numerics.
      let value: number | boolean;
      if (typeof rawValue === 'boolean') {
        value = rawValue;
      } else {
        const n = Number(rawValue);
        if (isNaN(n)) {
          throw new Error(
            `PUSH_ENDPOINT_VALUE: value must be numeric or boolean, got ${JSON.stringify(rawValue)}`
          );
        }
        value = n;
      }

      // ── 1. Update the node's current value (same as SET_ENDPOINT_VALUE) ──
      const nodeElement = await (node as SpinalNode<any>).element?.load();
      if (!nodeElement) throw new Error('PUSH_ENDPOINT_VALUE: node has no element to load');
      const currentValue = nodeElement.currentValue;
      if (currentValue === undefined) {
        throw new Error('PUSH_ENDPOINT_VALUE: node element has no currentValue');
      }
      currentValue.set(value);

      // ── 2. Append to the timeseries (creating it if missing) ──
      // The timeseries service resolves the endpoint by id through SpinalGraphService,
      // so register the node first (idempotent) — our work nodes come from raw traversal
      // and may not be in the registry, which would otherwise make the push silently fail.
      SpinalGraphService._addNode(node as SpinalNode<any>);
      const nodeId = (node as SpinalNode<any>).getId().get();
      const date =
        params?.date !== undefined
          ? parseTime(params.date, 'date')
          : context?.execution?.referenceTime ?? Date.now();

      const service = SingletonServiceTimeseries.getInstance();
      const ok = await service.insertFromEndpoint(nodeId, value, date);
      if (!ok) {
        throw new Error(
          `PUSH_ENDPOINT_VALUE: failed to append to the timeseries of "${(node as SpinalNode<any>).getName().get()}"`
        );
      }

      return value as any;
    },
  }),
];
