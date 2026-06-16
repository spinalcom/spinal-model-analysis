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
exports.OBJECT_ALGORITHMS = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const core_1 = require("./core");
exports.OBJECT_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'CREATE_OBJECT',
        description: 'Creates a new object from a JSON string parameter, or an empty object if none provided.',
        inputs: [],
        outputType: 'string',
        parameters: [
            { name: 'json', type: 'string', description: 'Optional JSON string to initialize the object', required: false },
        ],
        run: (_input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const json = params === null || params === void 0 ? void 0 : params.json;
            if (typeof json === 'string' && json.length > 0) {
                // Validate JSON
                JSON.parse(json);
                return json;
            }
            return '{}';
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_PROPERTY',
        description: 'Gets a property value from a JSON object string by key. Supports nested access with dot notation (e.g. "a.b.c").',
        inputs: [
            { name: 'object', types: ['string'], description: 'The JSON object (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'string',
        parameters: [
            { name: 'key', type: 'string', description: 'The property key (supports dot notation for nested access)', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON string input');
            const key = params === null || params === void 0 ? void 0 : params.key;
            if (typeof key !== 'string' || key.length === 0) {
                throw new Error('Invalid or missing key parameter');
            }
            const obj = JSON.parse(input);
            const parts = key.split('.');
            let current = obj;
            for (const part of parts) {
                if (current === null || current === undefined || typeof current !== 'object') {
                    return undefined;
                }
                current = current[part];
            }
            if (current === undefined)
                return undefined;
            return typeof current === 'object' ? JSON.stringify(current) : String(current);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SET_PROPERTY',
        description: 'Sets a property on a JSON object string. Takes input as the JSON string. Supports nested keys with dot notation.',
        inputs: [
            { name: 'object', types: ['string'], description: 'The JSON object (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'string',
        parameters: [
            { name: 'key', type: 'string', description: 'The property key (supports dot notation for nested access)', required: true },
            { name: 'value', type: 'string', description: 'The value to set (will be parsed as JSON if possible)', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON string input');
            const key = params === null || params === void 0 ? void 0 : params.key;
            const rawValue = params === null || params === void 0 ? void 0 : params.value;
            if (typeof key !== 'string' || key.length === 0) {
                throw new Error('Invalid or missing key parameter');
            }
            if (rawValue === undefined) {
                throw new Error('Invalid or missing value parameter');
            }
            const obj = JSON.parse(input);
            let parsedValue;
            try {
                parsedValue = JSON.parse(String(rawValue));
            }
            catch (_a) {
                parsedValue = rawValue;
            }
            const parts = key.split('.');
            let current = obj;
            for (let i = 0; i < parts.length - 1; i++) {
                if (current[parts[i]] === undefined || typeof current[parts[i]] !== 'object') {
                    current[parts[i]] = {};
                }
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = parsedValue;
            return JSON.stringify(obj);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SET_PROPERTY_DYNAMIC',
        description: 'Sets a property on a JSON object string using a dynamic value input. Takes 2 inputs: [jsonString, value].',
        inputs: [
            { name: 'object', types: ['string'], description: 'The JSON object (as a JSON string).', required: true },
            { name: 'value', types: ['any'], description: 'The value to set on the property.', required: true },
        ],
        outputType: 'string',
        parameters: [
            { name: 'key', type: 'string', description: 'The property key (supports dot notation)', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('SET_PROPERTY_DYNAMIC expects 2 inputs: [jsonString, value]');
            }
            const jsonStr = input[0];
            const value = input[1];
            if (typeof jsonStr !== 'string')
                throw new Error('First input must be a JSON string');
            const key = params === null || params === void 0 ? void 0 : params.key;
            if (typeof key !== 'string' || key.length === 0) {
                throw new Error('Invalid or missing key parameter');
            }
            const obj = JSON.parse(jsonStr);
            const parts = key.split('.');
            let current = obj;
            for (let i = 0; i < parts.length - 1; i++) {
                if (current[parts[i]] === undefined || typeof current[parts[i]] !== 'object') {
                    current[parts[i]] = {};
                }
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;
            return JSON.stringify(obj);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'DELETE_PROPERTY',
        description: 'Deletes a property from a JSON object string by key. Supports dot notation.',
        inputs: [
            { name: 'object', types: ['string'], description: 'The JSON object (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'string',
        parameters: [
            { name: 'key', type: 'string', description: 'The property key to delete (supports dot notation)', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON string input');
            const key = params === null || params === void 0 ? void 0 : params.key;
            if (typeof key !== 'string' || key.length === 0) {
                throw new Error('Invalid or missing key parameter');
            }
            const obj = JSON.parse(input);
            const parts = key.split('.');
            let current = obj;
            for (let i = 0; i < parts.length - 1; i++) {
                if (current[parts[i]] === undefined || typeof current[parts[i]] !== 'object') {
                    return JSON.stringify(obj); // Path doesn't exist, return unchanged
                }
                current = current[parts[i]];
            }
            delete current[parts[parts.length - 1]];
            return JSON.stringify(obj);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'MERGE_OBJECTS',
        description: 'Merges two JSON object strings into one (shallow merge, second overrides first). Takes 2 inputs: [obj1, obj2].',
        inputs: [
            { name: 'object1', types: ['string'], description: 'The first JSON object (as a JSON string).', required: true },
            { name: 'object2', types: ['string'], description: 'The second JSON object (as a JSON string); its keys override the first.', required: true },
        ],
        outputType: 'string',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('MERGE_OBJECTS expects 2 inputs: [jsonString1, jsonString2]');
            }
            const [str1, str2] = input;
            if (typeof str1 !== 'string' || typeof str2 !== 'string') {
                throw new Error('Both inputs must be JSON strings');
            }
            const obj1 = JSON.parse(str1);
            const obj2 = JSON.parse(str2);
            return JSON.stringify(Object.assign(Object.assign({}, obj1), obj2));
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'HAS_PROPERTY',
        description: 'Checks if a property exists in a JSON object string. Returns true/false.',
        inputs: [
            { name: 'object', types: ['string'], description: 'The JSON object (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'key', type: 'string', description: 'The property key to check (supports dot notation)', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON string input');
            const key = params === null || params === void 0 ? void 0 : params.key;
            if (typeof key !== 'string' || key.length === 0) {
                throw new Error('Invalid or missing key parameter');
            }
            const obj = JSON.parse(input);
            const parts = key.split('.');
            let current = obj;
            for (const part of parts) {
                if (current === null || current === undefined || typeof current !== 'object') {
                    return false;
                }
                if (!(part in current))
                    return false;
                current = current[part];
            }
            return true;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_KEYS',
        description: 'Returns the keys of a JSON object as a JSON array string.',
        inputs: [
            { name: 'object', types: ['string'], description: 'The JSON object (as a JSON string) to operate on.', required: true },
        ],
        outputType: 'string',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('Expected a JSON string input');
            const obj = JSON.parse(input);
            if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
                throw new Error('Input is not a JSON object');
            }
            return JSON.stringify(Object.keys(obj));
        }),
    }),
];
//# sourceMappingURL=object.algorithms.js.map