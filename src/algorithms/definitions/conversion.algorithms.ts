import {
    AlgorithmDefinition,
    AlgorithmRunResult,
    createAlgorithm,
} from './core';

export const CONVERSION_ALGORITHMS: AlgorithmDefinition[] = [
    createAlgorithm({
        name: 'PARSE_NUMBER',
        description:
            'Parses a number from a string input. Throws if the string cannot be parsed into a valid number.',
        inputs: [
            { name: 'value', types: ['string'], description: 'The string to parse into a number.', required: true },
        ],
        outputType: 'number',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('PARSE_NUMBER expects a string input');
            const parsed = Number(input);
            if (isNaN(parsed)) {
                throw new Error(`PARSE_NUMBER: cannot parse "${input}" as a number`);
            }
            return parsed;
        },
    }),

    createAlgorithm({
        name: 'BOOLEAN_TO_NUMBER',
        description: 'Converts a boolean to a number: true → 1, false → 0.',
        inputs: [
            { name: 'value', types: ['boolean'], description: 'The boolean to convert.', required: true },
        ],
        outputType: 'number',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (typeof input !== 'boolean') throw new Error('BOOLEAN_TO_NUMBER expects a boolean input');
            return input ? 1 : 0;
        },
    }),

    createAlgorithm({
        name: 'NUMBER_TO_BOOLEAN',
        description: 'Converts a number to a boolean: 0 → false, anything else → true.',
        inputs: [
            { name: 'value', types: ['number'], description: 'The number to convert.', required: true },
        ],
        outputType: 'boolean',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (typeof input !== 'number') throw new Error('NUMBER_TO_BOOLEAN expects a number input');
            return input !== 0;
        },
    }),
];
