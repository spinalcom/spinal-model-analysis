/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AlgorithmDefinition,
    AlgorithmRunResult,
    createAlgorithm,
} from './core';

export const OBJECT_ALGORITHMS: AlgorithmDefinition[] = [
    createAlgorithm({
        name: 'CREATE_OBJECT',
        description: 'Creates a new object from a JSON string parameter, or an empty object if none provided.',
        inputTypes: [],
        outputType: 'string',
        parameters: [
            { name: 'json', type: 'string', description: 'Optional JSON string to initialize the object', required: false },
        ],
        run: async (_input, params): AlgorithmRunResult => {
            const json = params?.json;
            if (typeof json === 'string' && json.length > 0) {
                // Validate JSON
                JSON.parse(json);
                return json;
            }
            return '{}';
        },
    }),

    createAlgorithm({
        name: 'GET_PROPERTY',
        description: 'Gets a property value from a JSON object string by key. Supports nested access with dot notation (e.g. "a.b.c").',
        inputTypes: ['string'],
        outputType: 'string',
        parameters: [
            { name: 'key', type: 'string', description: 'The property key (supports dot notation for nested access)', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON string input');

            const key = params?.key;
            if (typeof key !== 'string' || key.length === 0) {
                throw new Error('Invalid or missing key parameter');
            }

            const obj = JSON.parse(input);
            const parts = key.split('.');
            let current: any = obj;
            for (const part of parts) {
                if (current === null || current === undefined || typeof current !== 'object') {
                    return undefined;
                }
                current = current[part];
            }

            if (current === undefined) return undefined;
            return typeof current === 'object' ? JSON.stringify(current) : String(current);
        },
    }),

    createAlgorithm({
        name: 'SET_PROPERTY',
        description: 'Sets a property on a JSON object string. Takes input as the JSON string. Supports nested keys with dot notation.',
        inputTypes: ['string'],
        outputType: 'string',
        parameters: [
            { name: 'key', type: 'string', description: 'The property key (supports dot notation for nested access)', required: true },
            { name: 'value', type: 'string', description: 'The value to set (will be parsed as JSON if possible)', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON string input');

            const key = params?.key;
            const rawValue = params?.value;
            if (typeof key !== 'string' || key.length === 0) {
                throw new Error('Invalid or missing key parameter');
            }
            if (rawValue === undefined) {
                throw new Error('Invalid or missing value parameter');
            }

            const obj = JSON.parse(input);
            let parsedValue: any;
            try {
                parsedValue = JSON.parse(String(rawValue));
            } catch {
                parsedValue = rawValue;
            }

            const parts = key.split('.');
            let current: any = obj;
            for (let i = 0; i < parts.length - 1; i++) {
                if (current[parts[i]] === undefined || typeof current[parts[i]] !== 'object') {
                    current[parts[i]] = {};
                }
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = parsedValue;

            return JSON.stringify(obj);
        },
    }),

    createAlgorithm({
        name: 'SET_PROPERTY_DYNAMIC',
        description: 'Sets a property on a JSON object string using a dynamic value input. Takes 2 inputs: [jsonString, value].',
        inputTypes: ['string', 'any'],
        outputType: 'string',
        parameters: [
            { name: 'key', type: 'string', description: 'The property key (supports dot notation)', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('SET_PROPERTY_DYNAMIC expects 2 inputs: [jsonString, value]');
            }
            const jsonStr = input[0];
            const value = input[1];
            if (typeof jsonStr !== 'string') throw new Error('First input must be a JSON string');

            const key = params?.key;
            if (typeof key !== 'string' || key.length === 0) {
                throw new Error('Invalid or missing key parameter');
            }

            const obj = JSON.parse(jsonStr);
            const parts = key.split('.');
            let current: any = obj;
            for (let i = 0; i < parts.length - 1; i++) {
                if (current[parts[i]] === undefined || typeof current[parts[i]] !== 'object') {
                    current[parts[i]] = {};
                }
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;

            return JSON.stringify(obj);
        },
    }),

    createAlgorithm({
        name: 'DELETE_PROPERTY',
        description: 'Deletes a property from a JSON object string by key. Supports dot notation.',
        inputTypes: ['string'],
        outputType: 'string',
        parameters: [
            { name: 'key', type: 'string', description: 'The property key to delete (supports dot notation)', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON string input');

            const key = params?.key;
            if (typeof key !== 'string' || key.length === 0) {
                throw new Error('Invalid or missing key parameter');
            }

            const obj = JSON.parse(input);
            const parts = key.split('.');
            let current: any = obj;
            for (let i = 0; i < parts.length - 1; i++) {
                if (current[parts[i]] === undefined || typeof current[parts[i]] !== 'object') {
                    return JSON.stringify(obj); // Path doesn't exist, return unchanged
                }
                current = current[parts[i]];
            }
            delete current[parts[parts.length - 1]];

            return JSON.stringify(obj);
        },
    }),

    createAlgorithm({
        name: 'MERGE_OBJECTS',
        description: 'Merges two JSON object strings into one (shallow merge, second overrides first). Takes 2 inputs: [obj1, obj2].',
        inputTypes: ['string', 'string'],
        outputType: 'string',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('MERGE_OBJECTS expects 2 inputs: [jsonString1, jsonString2]');
            }
            const [str1, str2] = input;
            if (typeof str1 !== 'string' || typeof str2 !== 'string') {
                throw new Error('Both inputs must be JSON strings');
            }

            const obj1 = JSON.parse(str1);
            const obj2 = JSON.parse(str2);
            return JSON.stringify({ ...obj1, ...obj2 });
        },
    }),

    createAlgorithm({
        name: 'HAS_PROPERTY',
        description: 'Checks if a property exists in a JSON object string. Returns true/false.',
        inputTypes: ['string'],
        outputType: 'boolean',
        parameters: [
            { name: 'key', type: 'string', description: 'The property key to check (supports dot notation)', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON string input');

            const key = params?.key;
            if (typeof key !== 'string' || key.length === 0) {
                throw new Error('Invalid or missing key parameter');
            }

            const obj = JSON.parse(input);
            const parts = key.split('.');
            let current: any = obj;
            for (const part of parts) {
                if (current === null || current === undefined || typeof current !== 'object') {
                    return false;
                }
                if (!(part in current)) return false;
                current = current[part];
            }
            return true;
        },
    }),

    createAlgorithm({
        name: 'GET_KEYS',
        description: 'Returns the keys of a JSON object as a JSON array string.',
        inputTypes: ['string'],
        outputType: 'string',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (typeof input !== 'string') throw new Error('Expected a JSON string input');
            const obj = JSON.parse(input);
            if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
                throw new Error('Input is not a JSON object');
            }
            return JSON.stringify(Object.keys(obj));
        },
    }),
];
