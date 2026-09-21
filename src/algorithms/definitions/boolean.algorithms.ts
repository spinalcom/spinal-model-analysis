import {
    AlgorithmDefinition,
    AlgorithmRunResult,
    createAlgorithm,
    toNumber,
} from './core';
import { resolveBooleanFlag } from '../../services/utils';

/** Numeric input types: a number or a numeric string (e.g. a GET_ATTRIBUTE value). */
const NUMERIC_TYPES = ['number', 'string'];

/** EXISTS semantics: null / undefined, [] and blank strings are "no value"; anything else is one. */
function hasValue(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
}

/** A value as it compares: a node by its id, a spinal Model by its primitive, anything else as is. */
function comparable(value: unknown): unknown {
    if (value && typeof value === 'object') {
        const model = value as { getId?: () => { get: () => unknown }; get?: () => unknown };
        if (typeof model.getId === 'function') return model.getId().get();
        if (typeof model.get === 'function') return model.get();
    }
    return value;
}

function asNumber(value: unknown): number | null {
    if (typeof value === 'number') return Number.isNaN(value) ? null : value;
    if (typeof value === 'string' && value.trim() !== '') {
        const n = Number(value);
        return Number.isNaN(n) ? null : n;
    }
    return null;
}

/**
 * Equality behind EQUALS / EQUALS_PARAM: null / undefined equal only each other; two numbers
 * (or numeric strings) compare numerically; everything else compares as text, optionally
 * ignoring letter case.
 */
function valuesEqual(a: unknown, b: unknown, ignoreCase: boolean): boolean {
    const left = comparable(a);
    const right = comparable(b);
    const leftEmpty = left === null || left === undefined;
    const rightEmpty = right === null || right === undefined;
    if (leftEmpty || rightEmpty) return leftEmpty && rightEmpty;
    const leftNumber = asNumber(left);
    const rightNumber = asNumber(right);
    if (leftNumber !== null && rightNumber !== null) return leftNumber === rightNumber;
    const asText = (v: unknown) => (typeof v === 'object' ? JSON.stringify(v) : String(v));
    return ignoreCase ? asText(left).toLowerCase() === asText(right).toLowerCase() : asText(left) === asText(right);
}

export const BOOLEAN_ALGORITHMS: AlgorithmDefinition[] = [
    createAlgorithm({
        name: 'GREATER_THAN',
        description:
            'Returns true if the numeric input is strictly greater than the threshold parameter.',
        inputs: [
            { name: 'value', types: NUMERIC_TYPES, description: 'The value compared against the threshold.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'threshold', type: 'number', description: 'The threshold value', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            const value = toNumber(input, 'GREATER_THAN input');
            const threshold = toNumber(params?.threshold, 'GREATER_THAN threshold');
            return value > threshold;
        },
    }),

    createAlgorithm({
        name: 'LESS_THAN',
        description:
            'Returns true if the numeric input is strictly less than the threshold parameter.',
        inputs: [
            { name: 'value', types: NUMERIC_TYPES, description: 'The value compared against the threshold.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'threshold', type: 'number', description: 'The threshold value', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            const value = toNumber(input, 'LESS_THAN input');
            const threshold = toNumber(params?.threshold, 'LESS_THAN threshold');
            return value < threshold;
        },
    }),

    createAlgorithm({
        name: 'BETWEEN',
        description:
            'Returns true if the numeric input is within [min, max] (inclusive).',
        inputs: [
            { name: 'value', types: NUMERIC_TYPES, description: 'The value tested against the [min, max] range.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'min', type: 'number', description: 'Lower bound (inclusive)', required: true },
            { name: 'max', type: 'number', description: 'Upper bound (inclusive)', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            const value = toNumber(input, 'BETWEEN input');
            const min = toNumber(params?.min, 'BETWEEN min');
            const max = toNumber(params?.max, 'BETWEEN max');
            return value >= min && value <= max;
        },
    }),

    createAlgorithm({
        name: 'NOT_BETWEEN',
        description:
            'Returns true if the numeric input is outside [min, max] (exclusive of the range).',
        inputs: [
            { name: 'value', types: NUMERIC_TYPES, description: 'The value tested against the [min, max] range.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'min', type: 'number', description: 'Lower bound', required: true },
            { name: 'max', type: 'number', description: 'Upper bound', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            const value = toNumber(input, 'NOT_BETWEEN input');
            const min = toNumber(params?.min, 'NOT_BETWEEN min');
            const max = toNumber(params?.max, 'NOT_BETWEEN max');
            return value < min || value > max;
        },
    }),

    createAlgorithm({
        name: 'DIFFERENCE_THRESHOLD',
        description:
            'Takes two number inputs and returns true if the absolute difference exceeds the threshold.',
        inputs: [
            { name: 'a', types: NUMERIC_TYPES, description: 'First value.', required: true },
            { name: 'b', types: NUMERIC_TYPES, description: 'Second value.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'threshold', type: 'number', description: 'Maximum allowed absolute difference', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('DIFFERENCE_THRESHOLD expects 2 numeric inputs');
            }
            const a = toNumber(input[0], 'DIFFERENCE_THRESHOLD input a');
            const b = toNumber(input[1], 'DIFFERENCE_THRESHOLD input b');
            const threshold = toNumber(params?.threshold, 'DIFFERENCE_THRESHOLD threshold');
            return Math.abs(a - b) > threshold;
        },
    }),

    createAlgorithm({
        name: 'AND',
        description:
            'Logical AND: returns true only if all boolean inputs are true. Accepts a single boolean or boolean array.',
        inputs: [
            { name: 'values', types: ['boolean'], description: 'One or more booleans; true only if all are true.', required: true, variadic: true },
        ],
        outputType: 'boolean',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (typeof input === 'boolean') return input;
            if (Array.isArray(input)) {
                if (input.length === 0) throw new Error('AND expects at least one boolean input');
                const arr = input as unknown[];
                if (!arr.every((v) => typeof v === 'boolean')) {
                    throw new Error('AND expects all inputs to be booleans');
                }
                return arr.every((v) => v === true);
            }
            throw new Error('AND expects boolean or boolean[] input');
        },
    }),

    createAlgorithm({
        name: 'OR',
        description:
            'Logical OR: returns true if any boolean input is true. Accepts a single boolean or boolean array.',
        inputs: [
            { name: 'values', types: ['boolean'], description: 'One or more booleans; true if any is true.', required: true, variadic: true },
        ],
        outputType: 'boolean',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (typeof input === 'boolean') return input;
            if (Array.isArray(input)) {
                if (input.length === 0) throw new Error('OR expects at least one boolean input');
                const arr = input as unknown[];
                if (!arr.every((v) => typeof v === 'boolean')) {
                    throw new Error('OR expects all inputs to be booleans');
                }
                return arr.some((v) => v === true);
            }
            throw new Error('OR expects boolean or boolean[] input');
        },
    }),

    createAlgorithm({
        name: 'NOT',
        description: 'Logical NOT: inverts a boolean input.',
        inputs: [
            { name: 'value', types: ['boolean'], description: 'The boolean to invert.', required: true },
        ],
        outputType: 'boolean',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (typeof input !== 'boolean') throw new Error('NOT expects a boolean input');
            return !input;
        },
    }),

    createAlgorithm({
        name: 'EXISTS',
        description:
            'Returns true when the input holds a value: false for null / undefined, an empty array or a ' +
            'blank string, true for anything else (including 0 and false). The predicate for "was ' +
            'something found?" — pair it with a lookup set to return null instead of failing ' +
            '(GET_NODE_PARENT / GET_NODE_CHILD / FIND_NODE with ifNotFound "null"), e.g. inside a FILTER ' +
            'to keep the rooms that have a parent group named "Bureaux".',
        inputs: [
            { name: 'value', types: ['any'], description: 'The value to test.', required: true },
        ],
        outputType: 'boolean',
        parameters: [],
        run: async (input): AlgorithmRunResult => hasValue(input),
    }),

    createAlgorithm({
        name: 'EQUALS',
        description:
            'Returns true if its two inputs are equal. Numbers and numeric strings compare numerically ' +
            '(5 equals "5"), nodes compare by id, everything else as text — set "ignoreCase" to ignore ' +
            'letter case; null / undefined only equal each other. To compare against a fixed value, use ' +
            'EQUALS_PARAM.',
        inputs: [
            { name: 'a', types: ['any'], description: 'First value.', required: true },
            { name: 'b', types: ['any'], description: 'Second value.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'ignoreCase', type: 'boolean', description: 'Compare text case-insensitively (default false).', required: false },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (!Array.isArray(input) || input.length < 2) throw new Error('EQUALS expects 2 inputs: [a, b]');
            return valuesEqual(input[0], input[1], resolveBooleanFlag(params?.ignoreCase, false));
        },
    }),

    createAlgorithm({
        name: 'EQUALS_PARAM',
        description:
            'Returns true if the input equals the "expected" parameter, with the EQUALS rules (numeric ' +
            'when both are numbers, nodes by id, else text; "ignoreCase" optional). The usual predicate ' +
            'after GET_NODE_INFO — e.g. type equals "geographicRoom".',
        inputs: [
            { name: 'value', types: ['any'], description: 'The value to compare.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'expected', type: 'string', description: 'The value to compare against.', required: true },
            { name: 'ignoreCase', type: 'boolean', description: 'Compare text case-insensitively (default false).', required: false },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (params?.expected === undefined) throw new Error('EQUALS_PARAM requires an "expected" parameter');
            return valuesEqual(input, params.expected, resolveBooleanFlag(params?.ignoreCase, false));
        },
    }),

    createAlgorithm({
        name: 'MATCHES_REGEX',
        description:
            'Returns true if the input text matches the "pattern" regular expression ("flags" optional, ' +
            'e.g. "i" for case-insensitive). Numbers and booleans are tested as text; null / undefined ' +
            'never match. For a node, read the field to test first with GET_NODE_INFO.',
        inputs: [
            { name: 'text', types: ['string', 'number', 'boolean'], description: 'The text to test.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'pattern', type: 'string', description: 'The regular expression, e.g. "^Bureau".', required: true },
            { name: 'flags', type: 'string', description: 'Optional regex flags, e.g. "i".', required: false },
        ],
        run: async (input, params): AlgorithmRunResult => {
            const pattern = params?.pattern;
            if (typeof pattern !== 'string' || pattern.length === 0) {
                throw new Error('MATCHES_REGEX requires a non-empty "pattern" parameter');
            }
            let regex: RegExp;
            try {
                regex = new RegExp(pattern, typeof params?.flags === 'string' ? params.flags : undefined);
            } catch (error) {
                throw new Error(`MATCHES_REGEX: invalid pattern /${pattern}/: ${error instanceof Error ? error.message : String(error)}`);
            }
            if (input === null || input === undefined) return false;
            if (typeof input === 'object') {
                const model = input as { getId?: unknown; get?: () => unknown };
                if (typeof model.getId === 'function') {
                    throw new Error('MATCHES_REGEX expects text, got a node — read the field to test with GET_NODE_INFO first');
                }
                if (typeof model.get === 'function') return regex.test(String(model.get()));
                throw new Error(`MATCHES_REGEX expects text, got ${Array.isArray(input) ? 'an array' : 'an object'}`);
            }
            return regex.test(String(input));
        },
    }),
];
