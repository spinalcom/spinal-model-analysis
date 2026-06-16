import {
    AlgorithmDefinition,
    AlgorithmRunResult,
    createAlgorithm,
} from './core';

export const BOOLEAN_ALGORITHMS: AlgorithmDefinition[] = [
    createAlgorithm({
        name: 'GREATER_THAN',
        description:
            'Returns true if the numeric input is strictly greater than the threshold parameter.',
        inputs: [
            { name: 'value', types: ['number'], description: 'The value compared against the threshold.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'threshold', type: 'number', description: 'The threshold value', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (typeof input !== 'number') throw new Error('GREATER_THAN expects a number input');
            const threshold = params?.threshold as number;
            if (typeof threshold !== 'number') throw new Error('GREATER_THAN requires a numeric threshold parameter');
            return input > threshold;
        },
    }),

    createAlgorithm({
        name: 'LESS_THAN',
        description:
            'Returns true if the numeric input is strictly less than the threshold parameter.',
        inputs: [
            { name: 'value', types: ['number'], description: 'The value compared against the threshold.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'threshold', type: 'number', description: 'The threshold value', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (typeof input !== 'number') throw new Error('LESS_THAN expects a number input');
            const threshold = params?.threshold as number;
            if (typeof threshold !== 'number') throw new Error('LESS_THAN requires a numeric threshold parameter');
            return input < threshold;
        },
    }),

    createAlgorithm({
        name: 'BETWEEN',
        description:
            'Returns true if the numeric input is within [min, max] (inclusive).',
        inputs: [
            { name: 'value', types: ['number'], description: 'The value tested against the [min, max] range.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'min', type: 'number', description: 'Lower bound (inclusive)', required: true },
            { name: 'max', type: 'number', description: 'Upper bound (inclusive)', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (typeof input !== 'number') throw new Error('BETWEEN expects a number input');
            const min = params?.min as number;
            const max = params?.max as number;
            if (typeof min !== 'number' || typeof max !== 'number') {
                throw new Error('BETWEEN requires numeric min and max parameters');
            }
            return input >= min && input <= max;
        },
    }),

    createAlgorithm({
        name: 'NOT_BETWEEN',
        description:
            'Returns true if the numeric input is outside [min, max] (exclusive of the range).',
        inputs: [
            { name: 'value', types: ['number'], description: 'The value tested against the [min, max] range.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'min', type: 'number', description: 'Lower bound', required: true },
            { name: 'max', type: 'number', description: 'Upper bound', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (typeof input !== 'number') throw new Error('NOT_BETWEEN expects a number input');
            const min = params?.min as number;
            const max = params?.max as number;
            if (typeof min !== 'number' || typeof max !== 'number') {
                throw new Error('NOT_BETWEEN requires numeric min and max parameters');
            }
            return input < min || input > max;
        },
    }),

    createAlgorithm({
        name: 'DIFFERENCE_THRESHOLD',
        description:
            'Takes two number inputs and returns true if the absolute difference exceeds the threshold.',
        inputs: [
            { name: 'a', types: ['number'], description: 'First value.', required: true },
            { name: 'b', types: ['number'], description: 'Second value.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'threshold', type: 'number', description: 'Maximum allowed absolute difference', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('DIFFERENCE_THRESHOLD expects 2 numeric inputs');
            }
            const a = input[0];
            const b = input[1];
            if (typeof a !== 'number' || typeof b !== 'number') {
                throw new Error('DIFFERENCE_THRESHOLD expects numeric inputs');
            }
            const threshold = params?.threshold as number;
            if (typeof threshold !== 'number') {
                throw new Error('DIFFERENCE_THRESHOLD requires a numeric threshold parameter');
            }
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
];
