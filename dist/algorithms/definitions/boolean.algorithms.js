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
exports.BOOLEAN_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'GREATER_THAN',
        description: 'Returns true if the numeric input is strictly greater than the threshold parameter.',
        inputTypes: ['number'],
        outputType: 'boolean',
        parameters: [
            { name: 'threshold', type: 'number', description: 'The threshold value', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'number')
                throw new Error('GREATER_THAN expects a number input');
            const threshold = params === null || params === void 0 ? void 0 : params.threshold;
            if (typeof threshold !== 'number')
                throw new Error('GREATER_THAN requires a numeric threshold parameter');
            return input > threshold;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LESS_THAN',
        description: 'Returns true if the numeric input is strictly less than the threshold parameter.',
        inputTypes: ['number'],
        outputType: 'boolean',
        parameters: [
            { name: 'threshold', type: 'number', description: 'The threshold value', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'number')
                throw new Error('LESS_THAN expects a number input');
            const threshold = params === null || params === void 0 ? void 0 : params.threshold;
            if (typeof threshold !== 'number')
                throw new Error('LESS_THAN requires a numeric threshold parameter');
            return input < threshold;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'BETWEEN',
        description: 'Returns true if the numeric input is within [min, max] (inclusive).',
        inputTypes: ['number'],
        outputType: 'boolean',
        parameters: [
            { name: 'min', type: 'number', description: 'Lower bound (inclusive)', required: true },
            { name: 'max', type: 'number', description: 'Upper bound (inclusive)', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'number')
                throw new Error('BETWEEN expects a number input');
            const min = params === null || params === void 0 ? void 0 : params.min;
            const max = params === null || params === void 0 ? void 0 : params.max;
            if (typeof min !== 'number' || typeof max !== 'number') {
                throw new Error('BETWEEN requires numeric min and max parameters');
            }
            return input >= min && input <= max;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'NOT_BETWEEN',
        description: 'Returns true if the numeric input is outside [min, max] (exclusive of the range).',
        inputTypes: ['number'],
        outputType: 'boolean',
        parameters: [
            { name: 'min', type: 'number', description: 'Lower bound', required: true },
            { name: 'max', type: 'number', description: 'Upper bound', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'number')
                throw new Error('NOT_BETWEEN expects a number input');
            const min = params === null || params === void 0 ? void 0 : params.min;
            const max = params === null || params === void 0 ? void 0 : params.max;
            if (typeof min !== 'number' || typeof max !== 'number') {
                throw new Error('NOT_BETWEEN requires numeric min and max parameters');
            }
            return input < min || input > max;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'DIFFERENCE_THRESHOLD',
        description: 'Takes two number inputs and returns true if the absolute difference exceeds the threshold.',
        inputTypes: ['number', 'number'],
        outputType: 'boolean',
        parameters: [
            { name: 'threshold', type: 'number', description: 'Maximum allowed absolute difference', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('DIFFERENCE_THRESHOLD expects 2 numeric inputs');
            }
            const a = input[0];
            const b = input[1];
            if (typeof a !== 'number' || typeof b !== 'number') {
                throw new Error('DIFFERENCE_THRESHOLD expects numeric inputs');
            }
            const threshold = params === null || params === void 0 ? void 0 : params.threshold;
            if (typeof threshold !== 'number') {
                throw new Error('DIFFERENCE_THRESHOLD requires a numeric threshold parameter');
            }
            return Math.abs(a - b) > threshold;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'AND',
        description: 'Logical AND: returns true only if all boolean inputs are true. Accepts a single boolean or boolean array.',
        inputTypes: ['boolean'],
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
        inputTypes: ['boolean'],
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
        inputTypes: ['boolean'],
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