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
/** Numeric types accepted by the number algorithms: a number or a numeric string. */
const NUMERIC_TYPES = ['number', 'string'];
exports.NUMBER_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'COPY_FIRST_NUMBER',
        description: 'Returns the number input, or first value of a number array. Numeric strings are accepted.',
        inputs: [
            { name: 'numbers', types: NUMERIC_TYPES, description: 'One or more numbers (or numeric strings); the first one is returned.', required: true, variadic: true },
        ],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const arr = Array.isArray(input) ? input : [input];
            if (arr.length === 0)
                throw new Error('COPY_FIRST_NUMBER: no numeric input provided');
            return (0, core_1.toNumber)(arr[0], 'COPY_FIRST_NUMBER input');
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SUM_NUMBERS',
        description: 'Sums all numbers from a number array input. Numeric strings are accepted.',
        inputs: [
            { name: 'numbers', types: NUMERIC_TYPES, description: 'One or more numbers (or numeric strings) to sum.', required: true, variadic: true },
        ],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const arr = Array.isArray(input) ? input : [input];
            if (arr.length === 0)
                throw new Error('SUM_NUMBERS: no numeric input provided');
            return arr.reduce((acc, current) => acc + (0, core_1.toNumber)(current, 'SUM_NUMBERS input'), 0);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SUBTRACT',
        description: 'Subtracts numbers in order from a number array input: input[0] − input[1] − … ' +
            'Requires at least two numbers (e.g. two block inputs [a, b] → a − b). Numeric strings are accepted.',
        inputs: [
            { name: 'numbers', types: NUMERIC_TYPES, description: 'Two or more numbers (or numeric strings); subsequent values are subtracted from the first.', required: true, variadic: true },
        ],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('SUBTRACT requires at least two numbers');
            }
            const nums = input.map((v) => (0, core_1.toNumber)(v, 'SUBTRACT input'));
            return nums.reduce((acc, current) => acc - current);
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
    (0, core_1.createAlgorithm)({
        name: 'CONSTANT_NUMBER',
        description: 'Produces a constant number from the "value" parameter. Takes no input — useful as a ' +
            'numeric source to feed math or comparison blocks.',
        inputs: [],
        outputType: 'number',
        parameters: [
            { name: 'value', type: 'number', description: 'The constant number to produce.', required: true },
        ],
        run: (_input, params) => __awaiter(void 0, void 0, void 0, function* () {
            return (0, core_1.toNumber)(params === null || params === void 0 ? void 0 : params.value, 'CONSTANT_NUMBER value');
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'ADD_PARAM',
        description: 'Adds the "value" parameter to the input number (input + value).',
        inputs: [
            { name: 'number', types: NUMERIC_TYPES, description: 'The input number (or numeric string).', required: true },
        ],
        outputType: 'number',
        parameters: [
            { name: 'value', type: 'number', description: 'The number to add to the input.', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            return (0, core_1.toNumber)(input, 'ADD_PARAM input') + (0, core_1.toNumber)(params === null || params === void 0 ? void 0 : params.value, 'ADD_PARAM value');
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SUBTRACT_PARAM',
        description: 'Subtracts the "value" parameter from the input number (input − value).',
        inputs: [
            { name: 'number', types: NUMERIC_TYPES, description: 'The input number (or numeric string).', required: true },
        ],
        outputType: 'number',
        parameters: [
            { name: 'value', type: 'number', description: 'The number to subtract from the input.', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            return (0, core_1.toNumber)(input, 'SUBTRACT_PARAM input') - (0, core_1.toNumber)(params === null || params === void 0 ? void 0 : params.value, 'SUBTRACT_PARAM value');
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'MULTIPLY_PARAM',
        description: 'Multiplies the input number by the "value" parameter (input × value).',
        inputs: [
            { name: 'number', types: NUMERIC_TYPES, description: 'The input number (or numeric string).', required: true },
        ],
        outputType: 'number',
        parameters: [
            { name: 'value', type: 'number', description: 'The number to multiply the input by.', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            return (0, core_1.toNumber)(input, 'MULTIPLY_PARAM input') * (0, core_1.toNumber)(params === null || params === void 0 ? void 0 : params.value, 'MULTIPLY_PARAM value');
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'DIVIDE_PARAM',
        description: 'Divides the input number by the "value" parameter (input ÷ value). Throws if value is 0.',
        inputs: [
            { name: 'number', types: NUMERIC_TYPES, description: 'The input number (or numeric string).', required: true },
        ],
        outputType: 'number',
        parameters: [
            { name: 'value', type: 'number', description: 'The number to divide the input by (must not be 0).', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const divisor = (0, core_1.toNumber)(params === null || params === void 0 ? void 0 : params.value, 'DIVIDE_PARAM value');
            if (divisor === 0)
                throw new Error('DIVIDE_PARAM: cannot divide by zero');
            return (0, core_1.toNumber)(input, 'DIVIDE_PARAM input') / divisor;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'POLYNOMIAL',
        description: 'Evaluates a polynomial at the input value x. Coefficients are given via the ' +
            '"coefficients" parameter as a JSON array in ascending power order: ' +
            '[c0, c1, c2, ...] → c0 + c1·x + c2·x² + … Numeric strings are accepted for x.',
        inputs: [
            { name: 'x', types: NUMERIC_TYPES, description: 'The value of x to evaluate the polynomial at.', required: true },
        ],
        outputType: 'number',
        parameters: [
            { name: 'coefficients', type: 'string', description: 'JSON array of coefficients in ascending power order: [c0, c1, c2, ...] for c0 + c1·x + c2·x² + …', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const x = (0, core_1.toNumber)(input, 'POLYNOMIAL x');
            const raw = params === null || params === void 0 ? void 0 : params.coefficients;
            if (typeof raw !== 'string' || raw.trim() === '') {
                throw new Error('POLYNOMIAL requires a "coefficients" JSON array parameter');
            }
            let parsed;
            try {
                parsed = JSON.parse(raw);
            }
            catch (_a) {
                throw new Error(`POLYNOMIAL: "coefficients" is not valid JSON: ${raw}`);
            }
            if (!Array.isArray(parsed) || parsed.length === 0) {
                throw new Error('POLYNOMIAL: "coefficients" must be a non-empty JSON array');
            }
            const coeffs = parsed.map((c, i) => (0, core_1.toNumber)(c, `POLYNOMIAL coefficient[${i}]`));
            // Horner's method, coefficients in ascending power order.
            let result = 0;
            for (let i = coeffs.length - 1; i >= 0; i--) {
                result = result * x + coeffs[i];
            }
            return result;
        }),
    }),
];
//# sourceMappingURL=number.algorithms.js.map