/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AlgorithmDefinition,
    AlgorithmRunResult,
    createAlgorithm,
} from './core';

export const LIST_ALGORITHMS: AlgorithmDefinition[] = [
    createAlgorithm({
        name: 'CREATE_LIST',
        description: 'Creates a new JSON array from an optional JSON string parameter, or an empty array if none provided.',
        inputTypes: [],
        outputType: 'string',
        parameters: [
            { name: 'json', type: 'string', description: 'Optional JSON array string to initialize the list', required: false },
        ],
        run: async (_input, params): AlgorithmRunResult => {
            const json = params?.json;
            if (typeof json === 'string' && json.length > 0) {
                const parsed = JSON.parse(json);
                if (!Array.isArray(parsed)) throw new Error('Provided JSON is not an array');
                return json;
            }
            return '[]';
        },
    }),

    createAlgorithm({
        name: 'LIST_PUSH',
        description: 'Appends a value to the end of a JSON array. Takes 2 inputs: [arrayJson, value].',
        inputTypes: ['string', 'any'],
        outputType: 'string',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('LIST_PUSH expects 2 inputs: [arrayJson, value]');
            }
            const [arrStr, value] = input;
            if (typeof arrStr !== 'string') throw new Error('First input must be a JSON array string');
            const arr = JSON.parse(arrStr);
            if (!Array.isArray(arr)) throw new Error('First input is not a JSON array');
            arr.push(value);
            return JSON.stringify(arr);
        },
    }),

    createAlgorithm({
        name: 'LIST_PUSH_PARAM',
        description: 'Appends a static parameter value to the end of a JSON array.',
        inputTypes: ['string'],
        outputType: 'string',
        parameters: [
            { name: 'value', type: 'string', description: 'The value to push (will be parsed as JSON if possible)', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr)) throw new Error('Input is not a JSON array');

            const rawValue = params?.value;
            if (rawValue === undefined) throw new Error('Missing value parameter');

            let parsedValue: any;
            try {
                parsedValue = JSON.parse(String(rawValue));
            } catch {
                parsedValue = rawValue;
            }

            arr.push(parsedValue);
            return JSON.stringify(arr);
        },
    }),

    createAlgorithm({
        name: 'LIST_POP',
        description: 'Removes and returns the last element of a JSON array. Returns the modified array.',
        inputTypes: ['string'],
        outputType: 'string',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr)) throw new Error('Input is not a JSON array');
            if (arr.length === 0) throw new Error('Cannot pop from an empty array');
            arr.pop();
            return JSON.stringify(arr);
        },
    }),

    createAlgorithm({
        name: 'LIST_SHIFT',
        description: 'Removes and returns the first element of a JSON array. Returns the modified array.',
        inputTypes: ['string'],
        outputType: 'string',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr)) throw new Error('Input is not a JSON array');
            if (arr.length === 0) throw new Error('Cannot shift from an empty array');
            arr.shift();
            return JSON.stringify(arr);
        },
    }),

    createAlgorithm({
        name: 'LIST_UNSHIFT',
        description: 'Prepends a value to the beginning of a JSON array. Takes 2 inputs: [arrayJson, value].',
        inputTypes: ['string', 'any'],
        outputType: 'string',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('LIST_UNSHIFT expects 2 inputs: [arrayJson, value]');
            }
            const [arrStr, value] = input;
            if (typeof arrStr !== 'string') throw new Error('First input must be a JSON array string');
            const arr = JSON.parse(arrStr);
            if (!Array.isArray(arr)) throw new Error('First input is not a JSON array');
            arr.unshift(value);
            return JSON.stringify(arr);
        },
    }),

    createAlgorithm({
        name: 'LIST_CONCAT',
        description: 'Concatenates two JSON arrays. Takes 2 inputs: [array1, array2].',
        inputTypes: ['string', 'string'],
        outputType: 'string',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('LIST_CONCAT expects 2 inputs: [arrayJson1, arrayJson2]');
            }
            const [str1, str2] = input;
            if (typeof str1 !== 'string' || typeof str2 !== 'string') {
                throw new Error('Both inputs must be JSON array strings');
            }
            const arr1 = JSON.parse(str1);
            const arr2 = JSON.parse(str2);
            if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
                throw new Error('Both inputs must be JSON arrays');
            }
            return JSON.stringify([...arr1, ...arr2]);
        },
    }),

    createAlgorithm({
        name: 'LIST_GET',
        description: 'Gets an element at a specific index from a JSON array.',
        inputTypes: ['string'],
        outputType: 'string',
        parameters: [
            { name: 'index', type: 'number', description: 'The index of the element to get (supports negative indexing)', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr)) throw new Error('Input is not a JSON array');

            const rawIndex = params?.index;
            if (rawIndex === undefined) throw new Error('Missing index parameter');
            const index = Number(rawIndex);
            if (isNaN(index)) throw new Error('Index must be a number');

            const resolvedIndex = index < 0 ? arr.length + index : index;
            if (resolvedIndex < 0 || resolvedIndex >= arr.length) {
                throw new Error(`Index ${index} out of bounds for array of length ${arr.length}`);
            }

            const value = arr[resolvedIndex];
            return typeof value === 'object' ? JSON.stringify(value) : String(value);
        },
    }),

    createAlgorithm({
        name: 'LIST_LENGTH',
        description: 'Returns the length of a JSON array.',
        inputTypes: ['string'],
        outputType: 'number',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr)) throw new Error('Input is not a JSON array');
            return arr.length;
        },
    }),

    createAlgorithm({
        name: 'LIST_INCLUDES',
        description: 'Checks if a JSON array contains a specific value.',
        inputTypes: ['string'],
        outputType: 'boolean',
        parameters: [
            { name: 'value', type: 'string', description: 'The value to search for (will be parsed as JSON if possible)', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr)) throw new Error('Input is not a JSON array');

            const rawValue = params?.value;
            if (rawValue === undefined) throw new Error('Missing value parameter');

            let parsedValue: any;
            try {
                parsedValue = JSON.parse(String(rawValue));
            } catch {
                parsedValue = rawValue;
            }

            return arr.includes(parsedValue);
        },
    }),

    createAlgorithm({
        name: 'LIST_INDEX_OF',
        description: 'Returns the first index of a value in a JSON array, or -1 if not found.',
        inputTypes: ['string'],
        outputType: 'number',
        parameters: [
            { name: 'value', type: 'string', description: 'The value to search for (will be parsed as JSON if possible)', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr)) throw new Error('Input is not a JSON array');

            const rawValue = params?.value;
            if (rawValue === undefined) throw new Error('Missing value parameter');

            let parsedValue: any;
            try {
                parsedValue = JSON.parse(String(rawValue));
            } catch {
                parsedValue = rawValue;
            }

            return arr.indexOf(parsedValue);
        },
    }),

    createAlgorithm({
        name: 'LIST_SLICE',
        description: 'Returns a slice of a JSON array.',
        inputTypes: ['string'],
        outputType: 'string',
        parameters: [
            { name: 'start', type: 'number', description: 'Start index (inclusive, supports negative)', required: false },
            { name: 'end', type: 'number', description: 'End index (exclusive, supports negative)', required: false },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr)) throw new Error('Input is not a JSON array');

            const start = params?.start !== undefined ? Number(params.start) : undefined;
            const end = params?.end !== undefined ? Number(params.end) : undefined;

            return JSON.stringify(arr.slice(start, end));
        },
    }),

    createAlgorithm({
        name: 'LIST_REVERSE',
        description: 'Reverses a JSON array.',
        inputTypes: ['string'],
        outputType: 'string',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr)) throw new Error('Input is not a JSON array');
            return JSON.stringify(arr.reverse());
        },
    }),

    createAlgorithm({
        name: 'LIST_FLATTEN',
        description: 'Flattens a nested JSON array by one level.',
        inputTypes: ['string'],
        outputType: 'string',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr)) throw new Error('Input is not a JSON array');
            return JSON.stringify(arr.flat());
        },
    }),

    createAlgorithm({
        name: 'LIST_UNIQUE',
        description: 'Removes duplicate primitive values from a JSON array.',
        inputTypes: ['string'],
        outputType: 'string',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr)) throw new Error('Input is not a JSON array');
            return JSON.stringify([...new Set(arr)]);
        },
    }),
];
