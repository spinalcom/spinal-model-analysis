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
exports.BOOLEAN_ALGORITHMS = void 0;
const core_1 = require("./core");
/** Numeric input types: a number or a numeric string (e.g. a GET_ATTRIBUTE value). */
const NUMERIC_TYPES = ['number', 'string'];
exports.BOOLEAN_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'GREATER_THAN',
        description: 'Returns true if the numeric input is strictly greater than the threshold parameter.',
        inputs: [
            { name: 'value', types: NUMERIC_TYPES, description: 'The value compared against the threshold.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'threshold', type: 'number', description: 'The threshold value', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const value = (0, core_1.toNumber)(input, 'GREATER_THAN input');
            const threshold = (0, core_1.toNumber)(params === null || params === void 0 ? void 0 : params.threshold, 'GREATER_THAN threshold');
            return value > threshold;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LESS_THAN',
        description: 'Returns true if the numeric input is strictly less than the threshold parameter.',
        inputs: [
            { name: 'value', types: NUMERIC_TYPES, description: 'The value compared against the threshold.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'threshold', type: 'number', description: 'The threshold value', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const value = (0, core_1.toNumber)(input, 'LESS_THAN input');
            const threshold = (0, core_1.toNumber)(params === null || params === void 0 ? void 0 : params.threshold, 'LESS_THAN threshold');
            return value < threshold;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'BETWEEN',
        description: 'Returns true if the numeric input is within [min, max] (inclusive).',
        inputs: [
            { name: 'value', types: NUMERIC_TYPES, description: 'The value tested against the [min, max] range.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'min', type: 'number', description: 'Lower bound (inclusive)', required: true },
            { name: 'max', type: 'number', description: 'Upper bound (inclusive)', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const value = (0, core_1.toNumber)(input, 'BETWEEN input');
            const min = (0, core_1.toNumber)(params === null || params === void 0 ? void 0 : params.min, 'BETWEEN min');
            const max = (0, core_1.toNumber)(params === null || params === void 0 ? void 0 : params.max, 'BETWEEN max');
            return value >= min && value <= max;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'NOT_BETWEEN',
        description: 'Returns true if the numeric input is outside [min, max] (exclusive of the range).',
        inputs: [
            { name: 'value', types: NUMERIC_TYPES, description: 'The value tested against the [min, max] range.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'min', type: 'number', description: 'Lower bound', required: true },
            { name: 'max', type: 'number', description: 'Upper bound', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const value = (0, core_1.toNumber)(input, 'NOT_BETWEEN input');
            const min = (0, core_1.toNumber)(params === null || params === void 0 ? void 0 : params.min, 'NOT_BETWEEN min');
            const max = (0, core_1.toNumber)(params === null || params === void 0 ? void 0 : params.max, 'NOT_BETWEEN max');
            return value < min || value > max;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'DIFFERENCE_THRESHOLD',
        description: 'Takes two number inputs and returns true if the absolute difference exceeds the threshold.',
        inputs: [
            { name: 'a', types: NUMERIC_TYPES, description: 'First value.', required: true },
            { name: 'b', types: NUMERIC_TYPES, description: 'Second value.', required: true },
        ],
        outputType: 'boolean',
        parameters: [
            { name: 'threshold', type: 'number', description: 'Maximum allowed absolute difference', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('DIFFERENCE_THRESHOLD expects 2 numeric inputs');
            }
            const a = (0, core_1.toNumber)(input[0], 'DIFFERENCE_THRESHOLD input a');
            const b = (0, core_1.toNumber)(input[1], 'DIFFERENCE_THRESHOLD input b');
            const threshold = (0, core_1.toNumber)(params === null || params === void 0 ? void 0 : params.threshold, 'DIFFERENCE_THRESHOLD threshold');
            return Math.abs(a - b) > threshold;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'AND',
        description: 'Logical AND: returns true only if all boolean inputs are true. Accepts a single boolean or boolean array.',
        inputs: [
            { name: 'values', types: ['boolean'], description: 'One or more booleans; true only if all are true.', required: true, variadic: true },
        ],
        outputType: 'boolean',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input === 'boolean')
                return input;
            if (Array.isArray(input)) {
                if (input.length === 0)
                    throw new Error('AND expects at least one boolean input');
                const arr = input;
                if (!arr.every((v) => typeof v === 'boolean')) {
                    throw new Error('AND expects all inputs to be booleans');
                }
                return arr.every((v) => v === true);
            }
            throw new Error('AND expects boolean or boolean[] input');
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'OR',
        description: 'Logical OR: returns true if any boolean input is true. Accepts a single boolean or boolean array.',
        inputs: [
            { name: 'values', types: ['boolean'], description: 'One or more booleans; true if any is true.', required: true, variadic: true },
        ],
        outputType: 'boolean',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input === 'boolean')
                return input;
            if (Array.isArray(input)) {
                if (input.length === 0)
                    throw new Error('OR expects at least one boolean input');
                const arr = input;
                if (!arr.every((v) => typeof v === 'boolean')) {
                    throw new Error('OR expects all inputs to be booleans');
                }
                return arr.some((v) => v === true);
            }
            throw new Error('OR expects boolean or boolean[] input');
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'NOT',
        description: 'Logical NOT: inverts a boolean input.',
        inputs: [
            { name: 'value', types: ['boolean'], description: 'The boolean to invert.', required: true },
        ],
        outputType: 'boolean',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'boolean')
                throw new Error('NOT expects a boolean input');
            return !input;
        }),
    }),
];
//# sourceMappingURL=boolean.algorithms.js.map