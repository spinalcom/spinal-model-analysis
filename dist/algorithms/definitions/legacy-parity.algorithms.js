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
exports.LEGACY_PARITY_ALGORITHMS = void 0;
const core_1 = require("./core");
const isSpinalDateValue = (value) => {
    if (!value || typeof value !== 'object')
        return false;
    const point = value;
    return typeof point.date === 'number' && typeof point.value === 'number';
};
const normalizeTimeseriesInput = (input) => {
    if (!Array.isArray(input))
        throw new Error('Expected Timeseries input');
    if (input.length === 0)
        return [];
    if (isSpinalDateValue(input[0])) {
        if (!input.every(isSpinalDateValue)) {
            throw new Error('Invalid Timeseries input');
        }
        return input;
    }
    if (Array.isArray(input[0])) {
        const matrix = input;
        const flattened = [];
        for (const row of matrix) {
            if (!Array.isArray(row))
                throw new Error('Invalid Timeseries input');
            if (!row.every(isSpinalDateValue)) {
                throw new Error('Invalid Timeseries input');
            }
            flattened.push(...row);
        }
        return flattened;
    }
    throw new Error('Expected Timeseries input');
};
const normalizeNumberArrayInput = (input) => {
    if (typeof input === 'number')
        return [input];
    if (!Array.isArray(input))
        throw new Error('Expected number input');
    if (!input.every((item) => typeof item === 'number')) {
        throw new Error('Expected number input');
    }
    return input;
};
const normalizeBooleanArrayInput = (input) => {
    if (typeof input === 'boolean')
        return [input];
    if (!Array.isArray(input))
        throw new Error('Expected boolean input');
    if (!input.every((item) => typeof item === 'boolean')) {
        throw new Error('Expected boolean input');
    }
    return input;
};
const normalizePrimitiveArrayInput = (input) => {
    if (typeof input === 'string' ||
        typeof input === 'number' ||
        typeof input === 'boolean') {
        return [input];
    }
    if (!Array.isArray(input))
        throw new Error('Expected primitive input');
    if (!input.every((item) => typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean')) {
        throw new Error('Expected primitive input');
    }
    return input;
};
const isSpinalNode = (value) => {
    return (Boolean(value) &&
        typeof value === 'object' &&
        typeof value.getId === 'function');
};
const normalizeNodeArrayInput = (input) => {
    if (isSpinalNode(input))
        return [input];
    if (!Array.isArray(input))
        throw new Error('Expected SpinalNode input');
    if (!input.every((item) => isSpinalNode(item))) {
        throw new Error('Expected SpinalNode input');
    }
    return input;
};
const getRequiredNumberParam = (params, key) => {
    if (!params)
        throw new Error('No parameters provided');
    const value = params[key];
    if (typeof value !== 'number') {
        throw new Error(`Invalid ${key} parameter type. Expected number, got ${typeof value}`);
    }
    return value;
};
const getRequiredStringParam = (params, key) => {
    if (!params)
        throw new Error('No parameters provided');
    const value = params[key];
    if (typeof value !== 'string') {
        throw new Error(`Invalid ${key} parameter type. Expected string, got ${typeof value}`);
    }
    return value;
};
exports.LEGACY_PARITY_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'PUTVALUE',
        description: 'This algorithm returns the value set by the user (p1) regardless of input.',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [{ name: 'p1', type: 'number', description: 'the value to inject', required: true }],
        run: (_input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!params || params.p1 === undefined)
                throw new Error('No value provided');
            return params.p1;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'COPY',
        description: 'This algorithm returns the value of first input',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const values = normalizeNumberArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return values[0];
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'DIVIDE',
        description: 'This algorithm returns the result of the division of the first input by the second input',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const values = normalizeNumberArrayInput(input);
            if (values.length < 2)
                throw new Error('Not enough inputs');
            if (values[1] === 0)
                throw new Error('Division by zero');
            return values[0] / values[1];
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'DIVIDE_BY',
        description: 'This algorithm returns the result of the division of the first input by the value set by the user (p1)',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [{ name: 'p1', type: 'number', description: 'the value to divide by', required: true }],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const divisor = getRequiredNumberParam(params, 'p1');
            if (divisor === 0)
                throw new Error('Division by zero');
            const values = normalizeNumberArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return values[0] / divisor;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'MULTIPLY_BY',
        description: 'This algorithm returns the result of the multiplication of the first input by the value set by the user (p1)',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [{ name: 'p1', type: 'number', description: 'the value to multiply by', required: true }],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const factor = getRequiredNumberParam(params, 'p1');
            const values = normalizeNumberArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return values[0] * factor;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'MULTIPLY',
        description: 'This algorithm returns the result of the multiplication of the first input by the second input',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const values = normalizeNumberArrayInput(input);
            if (values.length < 2)
                throw new Error('Not enough inputs');
            return values[0] * values[1];
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'THRESHOLD_ABOVE',
        description: 'This algorithm returns true if the input is above the threshold set by the user',
        inputTypes: ['number'],
        outputType: 'boolean',
        parameters: [{ name: 'p1', type: 'number', description: 'the threshold value', required: true }],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const threshold = getRequiredNumberParam(params, 'p1');
            const values = normalizeNumberArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return values.some((value) => value > threshold);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'THRESHOLD_BELOW',
        description: 'This algorithm returns true if the input is below the threshold set by the user',
        inputTypes: ['number'],
        outputType: 'boolean',
        parameters: [{ name: 'p1', type: 'number', description: 'the threshold value', required: true }],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const threshold = getRequiredNumberParam(params, 'p1');
            const values = normalizeNumberArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return values.some((value) => value < threshold);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'THRESHOLD_BETWEEN_IN',
        description: 'This algorithm returns true if the input is between the two thresholds set by the user',
        inputTypes: ['number'],
        outputType: 'boolean',
        parameters: [
            { name: 'p1', type: 'number', description: 'the first threshold value', required: true },
            { name: 'p2', type: 'number', description: 'the second threshold value', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const p1 = getRequiredNumberParam(params, 'p1');
            const p2 = getRequiredNumberParam(params, 'p2');
            const min = Math.min(p1, p2);
            const max = Math.max(p1, p2);
            const values = normalizeNumberArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return values.some((value) => value >= min && value <= max);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'THRESHOLD_BETWEEN_OUT',
        description: 'This algorithm returns true if the input is outside the two thresholds set by the user',
        inputTypes: ['number'],
        outputType: 'boolean',
        parameters: [
            { name: 'p1', type: 'number', description: 'the first threshold value', required: true },
            { name: 'p2', type: 'number', description: 'the second threshold value', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const p1 = getRequiredNumberParam(params, 'p1');
            const p2 = getRequiredNumberParam(params, 'p2');
            const min = Math.min(p1, p2);
            const max = Math.max(p1, p2);
            const values = normalizeNumberArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return values.some((value) => value <= min || value >= max);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'AVERAGE',
        description: 'This algorithm returns the average of the inputs',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const values = normalizeNumberArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return values.reduce((acc, current) => acc + current, 0) / values.length;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_THRESHOLD_ZSCORE',
        description: 'This algorithm detects anomalies in a timeseries using Z-score on the latest value.',
        inputTypes: ['Timeseries'],
        outputType: 'boolean',
        parameters: [{ name: 'p1', type: 'number', description: 'the threshold value', required: true }],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const threshold = getRequiredNumberParam(params, 'p1');
            const dataInput = normalizeTimeseriesInput(input);
            if (dataInput.length === 0)
                throw new Error('Timeseries is empty');
            const mean = dataInput.reduce((acc, current) => acc + current.value, 0) / dataInput.length;
            const variance = dataInput.reduce((acc, current) => acc + Math.pow(current.value - mean, 2), 0) /
                dataInput.length;
            const stdDev = Math.sqrt(variance);
            const zScore = (dataInput[dataInput.length - 1].value - mean) / stdDev;
            return zScore > threshold;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_AVERAGE',
        description: 'This algorithm returns the average of the timeseries',
        inputTypes: ['Timeseries'],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const dataInput = normalizeTimeseriesInput(input);
            if (dataInput.length === 0)
                throw new Error('Timeseries is empty');
            return dataInput.reduce((acc, current) => acc + current.value, 0) / dataInput.length;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_TIME_WEIGHTED_AVERAGE',
        description: 'This algorithm calculates the time-weighted average value of a timeseries.',
        inputTypes: ['Timeseries'],
        outputType: 'number',
        parameters: [
            {
                name: 'p1',
                type: 'string',
                description: "'normal' (default) or 'linear' interpolation",
                required: false,
            },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const linearInterpolation = (params === null || params === void 0 ? void 0 : params.p1) === 'linear';
            const dataInput = normalizeTimeseriesInput(input);
            if (dataInput.length < 2) {
                throw new Error('Insufficient data. At least two timeseries data points are required.');
            }
            dataInput.sort((a, b) => a.date - b.date);
            let sum = 0;
            for (let i = 0; i < dataInput.length - 1; i++) {
                const timeInterval = dataInput[i + 1].date - dataInput[i].date;
                if (linearInterpolation) {
                    const avgValue = (dataInput[i].value + dataInput[i + 1].value) / 2;
                    sum += avgValue * timeInterval;
                }
                else {
                    sum += dataInput[i].value * timeInterval;
                }
            }
            const totalTimeInterval = dataInput[dataInput.length - 1].date - dataInput[0].date;
            if (totalTimeInterval <= 0) {
                throw new Error('Invalid date range. Ensure data spans a positive time interval.');
            }
            return sum / totalTimeInterval;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_BOOLEAN_RATE',
        description: 'This algorithm calculates a rate on boolean timeseries (0 | 1).',
        inputTypes: ['Timeseries'],
        outputType: 'number',
        parameters: [
            {
                name: 'p1',
                type: 'string',
                description: 'Ratio or Percentage',
                required: true,
            },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const mode = getRequiredStringParam(params, 'p1');
            const percentageResult = mode === 'Percentage';
            const dataInput = normalizeTimeseriesInput(input);
            if (dataInput.length === 0)
                throw new Error('Timeseries is empty');
            dataInput.sort((a, b) => a.date - b.date);
            let sum = 0;
            for (let i = 0; i < dataInput.length - 1; i++) {
                const deltaTime = dataInput[i + 1].date - dataInput[i].date;
                sum += dataInput[i].value * deltaTime;
            }
            const ratio = sum / (dataInput[dataInput.length - 1].date - dataInput[0].date);
            return percentageResult ? ratio * 100 : ratio;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_IS_EMPTY',
        description: 'This algorithm returns true if the input is an empty timeseries',
        inputTypes: ['Timeseries'],
        outputType: 'boolean',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const dataInput = normalizeTimeseriesInput(input);
            return dataInput.length === 0;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_SUM',
        description: 'This algorithm returns the sum of the timeseries',
        inputTypes: ['Timeseries'],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const dataInput = normalizeTimeseriesInput(input);
            if (dataInput.length === 0)
                throw new Error('Timeseries is empty');
            return dataInput.reduce((acc, current) => acc + current.value, 0);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'TIMESERIES_EDGE_SUBSTRACT',
        description: 'This algorithm returns the difference between the last and first value of the timeseries',
        inputTypes: ['Timeseries'],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const dataInput = normalizeTimeseriesInput(input);
            if (dataInput.length < 2)
                throw new Error('Timeseries should contain at least two values');
            return dataInput[dataInput.length - 1].value - dataInput[0].value;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'AND',
        description: 'This algorithm returns true if all the inputs are true',
        inputTypes: ['boolean'],
        outputType: 'boolean',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const values = normalizeBooleanArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return !values.includes(false);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'OR',
        description: 'This algorithm returns true if at least one of the inputs is true',
        inputTypes: ['boolean'],
        outputType: 'boolean',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const values = normalizeBooleanArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return values.includes(true);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'NOT',
        description: 'This algorithm returns true if all the inputs are false',
        inputTypes: ['boolean'],
        outputType: 'boolean',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const values = normalizeBooleanArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return !values.includes(true);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'DIFFERENCE_THRESHOLD',
        description: 'This algorithm returns true if the difference between the first and any other input is above the threshold set by the user',
        inputTypes: ['number'],
        outputType: 'boolean',
        parameters: [{ name: 'p1', type: 'number', description: 'the threshold value', required: true }],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const threshold = getRequiredNumberParam(params, 'p1');
            const values = normalizeNumberArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            const first = values[0];
            return values.some((value) => Math.abs(value - first) > threshold);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'STANDARD_DEVIATION',
        description: 'This algorithm returns the standard deviation of the inputs',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const values = normalizeNumberArrayInput(input);
            const n = values.length;
            const mean = values.reduce((a, b) => a + b, 0) / n;
            return Math.sqrt(values.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / n);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'EQUAL_TO',
        description: 'This algorithm returns true if all inputs are equal to the parameter',
        inputTypes: ['number', 'string', 'boolean'],
        outputType: 'boolean',
        parameters: [{ name: 'p1', type: 'number', description: 'the value to compare to', required: true }],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!params)
                throw new Error('No parameters provided');
            const values = normalizePrimitiveArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return values.every((value) => value === params.p1);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'IS_EMPTY',
        description: 'This algorithm returns true if the input is an empty list',
        inputTypes: ['number', 'string', 'boolean'],
        outputType: 'boolean',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            return Array.isArray(input) && input.length === 0;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'CONV_BOOLEAN_TO_NUMBER',
        description: 'This algorithm converts a boolean to a number. True becomes 1, false becomes 0',
        inputTypes: ['boolean'],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const values = normalizeBooleanArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return values[0] ? 1 : 0;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'CONV_NUMBER_TO_BOOLEAN',
        description: 'This algorithm converts a number to a boolean (0 is false, everything else is true)',
        inputTypes: ['number'],
        outputType: 'boolean',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const values = normalizeNumberArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return values[0] !== 0;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'CURRENT_EPOCH_TIME',
        description: 'This algorithm returns the current epoch time',
        inputTypes: [],
        outputType: 'number',
        parameters: [],
        run: () => __awaiter(void 0, void 0, void 0, function* () {
            return Date.now();
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SUBTRACT',
        description: 'This algorithm returns the result of the subtraction of the first input by the second input',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const values = normalizeNumberArrayInput(input);
            if (values.length < 2)
                throw new Error('Not enough inputs');
            return values[0] - values[1];
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SUM',
        description: 'This algorithm returns the result of the sum of the inputs',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const values = normalizeNumberArrayInput(input);
            return values.reduce((acc, current) => acc + current, 0);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SUBTRACT_BY',
        description: 'This algorithm returns the result of the subtraction of the first input by the value set by the user (p1)',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [{ name: 'p1', type: 'number', description: 'the value to subtract by', required: true }],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const by = getRequiredNumberParam(params, 'p1');
            const values = normalizeNumberArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return values[0] - by;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'RANDOM_NUMBER',
        description: 'This algorithm returns a random number between the two values set by the user',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [
            { name: 'p1', type: 'number', description: 'the minimum value', required: true },
            { name: 'p2', type: 'number', description: 'the maximum value', required: true },
        ],
        run: (_input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const min = getRequiredNumberParam(params, 'p1');
            const max = getRequiredNumberParam(params, 'p2');
            return Math.random() * (max - min) + min;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'RANDOM_INTEGER',
        description: 'This algorithm returns a random integer between the two values set by the user',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [
            { name: 'p1', type: 'number', description: 'the minimum value', required: true },
            { name: 'p2', type: 'number', description: 'the maximum value', required: true },
        ],
        run: (_input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const min = getRequiredNumberParam(params, 'p1');
            const max = getRequiredNumberParam(params, 'p2');
            return Math.floor(Math.random() * (max - min + 1) + min);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'RANDOM_BOOLEAN_NUMBER',
        description: 'This algorithm returns a random boolean value 0 | 1',
        inputTypes: [],
        outputType: 'number',
        parameters: [],
        run: () => __awaiter(void 0, void 0, void 0, function* () {
            return Math.round(Math.random());
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'RANDOM_BOOLEAN',
        description: 'This algorithm returns a random boolean value true | false',
        inputTypes: [],
        outputType: 'boolean',
        parameters: [],
        run: () => __awaiter(void 0, void 0, void 0, function* () {
            return Math.random() < 0.5;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'NODE_ARRAY',
        description: 'This algorithm returns all SpinalNodes found in the inputs',
        inputTypes: ['SpinalNode'],
        outputType: 'SpinalNode[]',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const nodes = normalizeNodeArrayInput(input);
            if (nodes.length === 0)
                throw new Error('No SpinalNode input provided');
            return nodes;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'UNIQUE_NODE_ARRAY',
        description: 'This algorithm returns all unique SpinalNodes found in the inputs (uniqueness based on node id)',
        inputTypes: ['SpinalNode'],
        outputType: 'SpinalNode[]',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const nodes = normalizeNodeArrayInput(input);
            if (nodes.length === 0)
                throw new Error('No SpinalNode input provided');
            const uniqueNodes = new Map();
            const nodesWithoutId = [];
            for (const node of nodes) {
                const nodeId = node.getId().get();
                if (typeof nodeId !== 'string') {
                    nodesWithoutId.push(node);
                    continue;
                }
                if (!uniqueNodes.has(nodeId))
                    uniqueNodes.set(nodeId, node);
            }
            return [...uniqueNodes.values(), ...nodesWithoutId];
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'EXIT',
        description: 'This algorithm is used to stop the execution of the workflow if the first input is true',
        inputTypes: ['boolean'],
        outputType: 'void',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const values = normalizeBooleanArrayInput(input);
            if (values.length === 0)
                throw new Error('No input provided');
            return values[0];
        }),
    }),
];
//# sourceMappingURL=legacy-parity.algorithms.js.map