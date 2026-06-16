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
exports.NUMBER_ALGORITHMS = void 0;
const core_1 = require("./core");
const isNumberArray = (value) => {
    return Array.isArray(value) && value.every((item) => typeof item === 'number');
};
exports.NUMBER_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'COPY_FIRST_NUMBER',
        description: 'Returns the number input, or first value of a number array.',
        inputs: [
            { name: 'numbers', types: ['number'], description: 'One or more numbers; the first one is returned.', required: true, variadic: true },
        ],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input === 'number')
                return input;
            if (isNumberArray(input)) {
                if (input.length === 0)
                    throw new Error('No numeric input provided');
                return input[0];
            }
            throw new Error('Expected number or number[] input');
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SUM_NUMBERS',
        description: 'Sums all numbers from a number array input.',
        inputs: [
            { name: 'numbers', types: ['number'], description: 'One or more numbers to sum.', required: true, variadic: true },
        ],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isNumberArray(input))
                throw new Error('Expected number[] input');
            if (input.length === 0)
                throw new Error('No numeric input provided');
            return input.reduce((acc, current) => acc + current, 0);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SUBTRACT',
        description: 'Subtracts numbers in order from a number array input: input[0] − input[1] − … ' +
            'Requires at least two numbers (e.g. two block inputs [a, b] → a − b).',
        inputs: [
            { name: 'numbers', types: ['number'], description: 'Two or more numbers; subsequent values are subtracted from the first.', required: true, variadic: true },
        ],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isNumberArray(input))
                throw new Error('Expected number[] input');
            if (input.length < 2)
                throw new Error('SUBTRACT requires at least two numbers');
            return input.reduce((acc, current) => acc - current);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'RANDOM_NUMBER',
        description: 'Generates a random number between min and max (inclusive). No input required.',
        inputs: [],
        outputType: 'number',
        parameters: [
            { name: 'min', type: 'number', description: 'Lower bound (inclusive)', required: true },
            { name: 'max', type: 'number', description: 'Upper bound (inclusive)', required: true },
        ],
        run: (_input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const min = params === null || params === void 0 ? void 0 : params.min;
            const max = params === null || params === void 0 ? void 0 : params.max;
            if (typeof min !== 'number' || typeof max !== 'number') {
                throw new Error('RANDOM_NUMBER requires numeric min and max parameters');
            }
            return min + Math.random() * (max - min);
        }),
    }),
];
//# sourceMappingURL=number.algorithms.js.map