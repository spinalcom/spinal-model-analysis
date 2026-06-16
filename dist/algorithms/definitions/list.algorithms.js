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
exports.LIST_ALGORITHMS = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const core_1 = require("./core");
exports.LIST_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'CREATE_LIST',
        description: 'Creates a new JSON array from an optional JSON string parameter, or an empty array if none provided.',
        inputs: [],
        outputType: 'string',
        parameters: [
            { name: 'json', type: 'string', description: 'Optional JSON array string to initialize the list', required: false },
        ],
        run: (_input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const json = params === null || params === void 0 ? void 0 : params.json;
            if (typeof json === 'string' && json.length > 0) {
                const parsed = JSON.parse(json);
                if (!Array.isArray(parsed))
                    throw new Error('Provided JSON is not an array');
                return json;
            }
            return '[]';
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LIST_PUSH',
        description: 'Appends a value to the end of a JSON array. Takes 2 inputs: [arrayJson, value].',
        inputs: [
            { name: 'list', types: ['string'], description: 'The JSON array (as a JSON string).', required: true },
            { name: 'value', types: ['any'], description: 'The value to add.', required: true },
        ],
        outputType: 'string',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('LIST_PUSH expects 2 inputs: [arrayJson, value]');
            }
            const [arrStr, value] = input;
            if (typeof arrStr !== 'string')
                throw new Error('First input must be a JSON array string');
            const arr = JSON.parse(arrStr);
            if (!Array.isArray(arr))
                throw new Error('First input is not a JSON array');
            arr.push(value);
            return JSON.stringify(arr);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LIST_PUSH_PARAM',
        description: 'Appends a static parameter value to the end of a JSON array.',
        inputs: [
            { name: 'list', types: ['string'], description: 'The JSON array (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'string',
        parameters: [
            { name: 'value', type: 'string', description: 'The value to push (will be parsed as JSON if possible)', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr))
                throw new Error('Input is not a JSON array');
            const rawValue = params === null || params === void 0 ? void 0 : params.value;
            if (rawValue === undefined)
                throw new Error('Missing value parameter');
            let parsedValue;
            try {
                parsedValue = JSON.parse(String(rawValue));
            }
            catch (_a) {
                parsedValue = rawValue;
            }
            arr.push(parsedValue);
            return JSON.stringify(arr);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LIST_POP',
        description: 'Removes and returns the last element of a JSON array. Returns the modified array.',
        inputs: [
            { name: 'list', types: ['string'], description: 'The JSON array (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'string',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr))
                throw new Error('Input is not a JSON array');
            if (arr.length === 0)
                throw new Error('Cannot pop from an empty array');
            arr.pop();
            return JSON.stringify(arr);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LIST_SHIFT',
        description: 'Removes and returns the first element of a JSON array. Returns the modified array.',
        inputs: [
            { name: 'list', types: ['string'], description: 'The JSON array (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'string',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr))
                throw new Error('Input is not a JSON array');
            if (arr.length === 0)
                throw new Error('Cannot shift from an empty array');
            arr.shift();
            return JSON.stringify(arr);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LIST_UNSHIFT',
        description: 'Prepends a value to the beginning of a JSON array. Takes 2 inputs: [arrayJson, value].',
        inputs: [
            { name: 'list', types: ['string'], description: 'The JSON array (as a JSON string).', required: true },
            { name: 'value', types: ['any'], description: 'The value to add.', required: true },
        ],
        outputType: 'string',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('LIST_UNSHIFT expects 2 inputs: [arrayJson, value]');
            }
            const [arrStr, value] = input;
            if (typeof arrStr !== 'string')
                throw new Error('First input must be a JSON array string');
            const arr = JSON.parse(arrStr);
            if (!Array.isArray(arr))
                throw new Error('First input is not a JSON array');
            arr.unshift(value);
            return JSON.stringify(arr);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LIST_CONCAT',
        description: 'Concatenates two JSON arrays. Takes 2 inputs: [array1, array2].',
        inputs: [
            { name: 'list1', types: ['string'], description: 'The first JSON array (as a JSON string).', required: true },
            { name: 'list2', types: ['string'], description: 'The second JSON array (as a JSON string).', required: true },
        ],
        outputType: 'string',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
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
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LIST_GET',
        description: 'Gets an element at a specific index from a JSON array.',
        inputs: [
            { name: 'list', types: ['string'], description: 'The JSON array (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'string',
        parameters: [
            { name: 'index', type: 'number', description: 'The index of the element to get (supports negative indexing)', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr))
                throw new Error('Input is not a JSON array');
            const rawIndex = params === null || params === void 0 ? void 0 : params.index;
            if (rawIndex === undefined)
                throw new Error('Missing index parameter');
            const index = Number(rawIndex);
            if (isNaN(index))
                throw new Error('Index must be a number');
            const resolvedIndex = index < 0 ? arr.length + index : index;
            if (resolvedIndex < 0 || resolvedIndex >= arr.length) {
                throw new Error(`Index ${index} out of bounds for array of length ${arr.length}`);
            }
            const value = arr[resolvedIndex];
            return typeof value === 'object' ? JSON.stringify(value) : String(value);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LIST_LENGTH',
        description: 'Returns the length of a JSON array.',
        inputs: [
            { name: 'list', types: ['string'], description: 'The JSON array (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr))
                throw new Error('Input is not a JSON array');
            return arr.length;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LIST_INCLUDES',
        description: 'Checks if a JSON array contains a specific value.',
        inputs: [
            { name: 'list', types: ['string'], description: 'The JSON array (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'value', type: 'string', description: 'The value to search for (will be parsed as JSON if possible)', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr))
                throw new Error('Input is not a JSON array');
            const rawValue = params === null || params === void 0 ? void 0 : params.value;
            if (rawValue === undefined)
                throw new Error('Missing value parameter');
            let parsedValue;
            try {
                parsedValue = JSON.parse(String(rawValue));
            }
            catch (_b) {
                parsedValue = rawValue;
            }
            return arr.includes(parsedValue);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LIST_INDEX_OF',
        description: 'Returns the first index of a value in a JSON array, or -1 if not found.',
        inputs: [
            { name: 'list', types: ['string'], description: 'The JSON array (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'number',
        parameters: [
            { name: 'value', type: 'string', description: 'The value to search for (will be parsed as JSON if possible)', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr))
                throw new Error('Input is not a JSON array');
            const rawValue = params === null || params === void 0 ? void 0 : params.value;
            if (rawValue === undefined)
                throw new Error('Missing value parameter');
            let parsedValue;
            try {
                parsedValue = JSON.parse(String(rawValue));
            }
            catch (_c) {
                parsedValue = rawValue;
            }
            return arr.indexOf(parsedValue);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LIST_SLICE',
        description: 'Returns a slice of a JSON array.',
        inputs: [
            { name: 'list', types: ['string'], description: 'The JSON array (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'string',
        parameters: [
            { name: 'start', type: 'number', description: 'Start index (inclusive, supports negative)', required: false },
            { name: 'end', type: 'number', description: 'End index (exclusive, supports negative)', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr))
                throw new Error('Input is not a JSON array');
            const start = (params === null || params === void 0 ? void 0 : params.start) !== undefined ? Number(params.start) : undefined;
            const end = (params === null || params === void 0 ? void 0 : params.end) !== undefined ? Number(params.end) : undefined;
            return JSON.stringify(arr.slice(start, end));
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LIST_REVERSE',
        description: 'Reverses a JSON array.',
        inputs: [
            { name: 'list', types: ['string'], description: 'The JSON array (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'string',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr))
                throw new Error('Input is not a JSON array');
            return JSON.stringify(arr.reverse());
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LIST_FLATTEN',
        description: 'Flattens a nested JSON array by one level.',
        inputs: [
            { name: 'list', types: ['string'], description: 'The JSON array (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'string',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr))
                throw new Error('Input is not a JSON array');
            return JSON.stringify(arr.flat());
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LIST_UNIQUE',
        description: 'Removes duplicate primitive values from a JSON array.',
        inputs: [
            { name: 'list', types: ['string'], description: 'The JSON array (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'string',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON array string input');
            const arr = JSON.parse(input);
            if (!Array.isArray(arr))
                throw new Error('Input is not a JSON array');
            return JSON.stringify([...new Set(arr)]);
        }),
    }),
];
//# sourceMappingURL=list.algorithms.js.map