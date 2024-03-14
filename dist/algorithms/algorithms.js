"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALGORITHMS = exports.EXIT = exports.SUBTRACT_BY = exports.SUBTRACT = exports.CURRENT_EPOCH_TIME = exports.CONV_NUMBER_TO_BOOLEAN = exports.CONV_BOOLEAN_TO_NUMBER = exports.IS_EMPTY = exports.EQUAL_TO = exports.STANDARD_DEVIATION = exports.INTEGRAL_BOOLEAN = exports.DIFFERENCE_THRESHOLD = exports.NOT = exports.OR = exports.AND = exports.TIMESERIES_AVERAGE = exports.AVERAGE = exports.THRESHOLD_ZSCORE = exports.THRESHOLD_BETWEEN_OUT = exports.THRESHOLD_BETWEEN_IN = exports.THRESHOLD_BELOW = exports.THRESHOLD_ABOVE = exports.DIVIDE_BY = exports.DIVIDE = exports.COPY = exports.PUTVALUE = void 0;
class Algorithm {
    constructor(name, description, inputTypes, outputType, requiredParams, run) {
        this.name = name;
        this.inputTypes = inputTypes;
        this.outputType = outputType;
        this.description = description;
        this.requiredParams = requiredParams;
        this.run = run;
    }
}
exports.PUTVALUE = new Algorithm('PUTVALUE', 'This algorithm returns the value set by the user (p1) regardless of input.', ['number'], 'number', [{ name: 'p1', type: 'number', description: 'the value to inject' }], (input, params) => {
    if (!params)
        throw new Error('No parameters provided');
    if (params['p1'] === undefined)
        throw new Error('No value provided');
    return params['p1'];
});
exports.COPY = new Algorithm('COPY', 'This algorithm returns the value of first input', ['number'], 'number', [], (input) => {
    return input[0];
});
exports.DIVIDE = new Algorithm('DIVIDE', 'This algorithm returns the result of the division of the first input by the second input', ['number'], 'number', [], (input) => {
    if (input.length < 2)
        throw new Error('Not enough inputs');
    if (input[1] === 0)
        throw new Error('Division by zero');
    return input[0] / input[1];
});
exports.DIVIDE_BY = new Algorithm('DIVIDE_BY', 'This algorithm returns the result of the division of the first input by the value set by the user (p1)', ['number'], 'number', [{ name: 'p1', type: 'number', description: 'the value to divide by' }], (input, params) => {
    if (!params)
        throw new Error('No parameters provided');
    if (params['p1'] === 0)
        throw new Error('Division by zero');
    if (typeof params['p1'] !== 'number')
        throw new Error(`Invalid parameter type. Expected number, got ${typeof params['p1']}`);
    return input[0] / params['p1'];
});
exports.THRESHOLD_ABOVE = new Algorithm('THRESHOLD_ABOVE', 'This algorithm returns true if the input is above the threshold set by the user', ['number'], 'boolean', [{ name: 'p1', type: 'number', description: 'the threshold value' }], (input, params) => {
    if (!params)
        throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
        throw new Error(`Invalid parameter type. Expected number, got ${typeof params['p1']}`);
    const treshold = params['p1'];
    for (const n of input) {
        if (n > treshold)
            return true;
    }
    return false;
});
exports.THRESHOLD_BELOW = new Algorithm('THRESHOLD_BELOW', 'This algorithm returns true if the input is below the threshold set by the user', ['number'], 'boolean', [{ name: 'p1', type: 'number', description: 'the threshold value' }], (input, params) => {
    if (!params)
        throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
        throw new Error(`Invalid parameter type. Expected number, got ${typeof params['p1']}`);
    const treshold = params['p1'];
    for (const n of input) {
        if (n < treshold)
            return true;
    }
    return false;
});
exports.THRESHOLD_BETWEEN_IN = new Algorithm('THRESHOLD_BETWEEN_IN', 'This algorithm returns true if the input is between the two thresholds set by the user', ['number'], 'boolean', [
    { name: 'p1', type: 'number', description: 'the first threshold value' },
    { name: 'p2', type: 'number', description: 'the second threshold value' },
], (input, params) => {
    if (!params)
        throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
        throw new Error(`Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`);
    if (typeof params['p2'] !== 'number')
        throw new Error(`Invalid p2 parameter type. Expected number, got ${typeof params['p2']}`);
    const p1 = params['p1'];
    const p2 = params['p2'];
    const min = Math.min(p1, p2);
    const max = Math.max(p1, p2);
    for (const n of input) {
        if (n >= min && n <= max)
            return true;
    }
    return false;
});
exports.THRESHOLD_BETWEEN_OUT = new Algorithm('THRESHOLD_BETWEEN_OUT', 'This algorithm returns true if the input is outside the two thresholds set by the user', ['number'], 'boolean', [
    { name: 'p1', type: 'number', description: 'the first threshold value' },
    { name: 'p2', type: 'number', description: 'the second threshold value' },
], (input, params) => {
    if (!params)
        throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
        throw new Error(`Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`);
    if (typeof params['p2'] !== 'number')
        throw new Error(`Invalid p2 parameter type. Expected number, got ${typeof params['p2']}`);
    const p1 = params['p1'];
    const p2 = params['p2'];
    const min = Math.min(p1, p2);
    const max = Math.max(p1, p2);
    for (const n of input) {
        if (n <= min || n >= max)
            return true;
    }
    return false;
});
exports.THRESHOLD_ZSCORE = new Algorithm('THRESHOLD_ZSCORE', `This algorithm is used to detect anomalies in a timeseries. 
   The Z-score is a measure of how many standard deviations an element is from the mean.
   It's calculated as Z = (X - mean) / stdDev 
   where X is the value, mean is the average of the timeserie and stdDev is the standard deviation of the timeserie.
   The threshold is a number set by the user. If the Z-score of the last value of the timeserie is above the threshold,
   the algorithm returns true, otherwise it returns false.`, ['Timeseries'], 'boolean', [{ name: 'p1', type: 'number', description: 'the threshold value' }], (input, params) => {
    if (!params)
        throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
        throw new Error(`Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`);
    const dataInput = input.reduce((acc, curr) => acc.concat(...curr), []);
    if (dataInput.length === 0)
        throw new Error('Timeseries is empty');
    const threshold = params['p1'];
    const mean = dataInput.reduce((acc, current) => acc + current.value, 0) / dataInput.length;
    const variance = dataInput.reduce((acc, current) => acc + Math.pow(current.value - mean, 2), 0) / dataInput.length;
    const stdDev = Math.sqrt(variance);
    const zScore = (dataInput[dataInput.length - 1].value - mean) / stdDev;
    return zScore > threshold;
});
exports.AVERAGE = new Algorithm('AVERAGE', 'This algorithm returns the average of the inputs', ['number'], 'number', [], (input) => {
    return input.reduce((acc, current) => acc + current, 0) / input.length;
});
exports.TIMESERIES_AVERAGE = new Algorithm('TIMESERIES_AVERAGE', 'This algorithm returns the average of the timeseries', ['Timeseries'], 'number', [], (input) => {
    const dataInput = input.reduce((acc, curr) => acc.concat(...curr), []);
    if (dataInput.length === 0)
        throw new Error('Timeseries is empty');
    return dataInput.reduce((acc, current) => acc + current.value, 0) / dataInput.length;
});
exports.AND = new Algorithm('AND', 'This algorithm returns true if all the inputs are true', ['boolean'], 'boolean', [], (input) => {
    return !input.includes(false);
});
exports.OR = new Algorithm('OR', 'This algorithm returns true if at least one of the inputs is true', ['boolean'], 'boolean', [], (input) => {
    return input.includes(true);
});
exports.NOT = new Algorithm('NOT', 'This algorithm returns true if all the inputs are false', ['boolean'], 'boolean', [], (input) => {
    return !input.includes(true);
});
exports.DIFFERENCE_THRESHOLD = new Algorithm('DIFFERENCE_THRESHOLD', 'This algorithm returns true if the difference between the first and any other input is above the threshold set by the user', ['number'], 'boolean', [{ name: 'p1', type: 'number', description: 'the threshold value' }], (input, params) => {
    if (!params)
        throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
        throw new Error(`Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`);
    const treshold = params['p1'];
    const first = input[0];
    for (const n of input) {
        if (Math.abs(n - first) > treshold)
            return true;
    }
    return false;
});
exports.INTEGRAL_BOOLEAN = new Algorithm('INTEGRAL_BOOLEAN', 'This algorithm calculates the integral of timeseries.', ['Timeseries'], 'number', [
    {
        name: 'p1',
        type: 'number',
        description: 'intervalTime, please copy paste the timeseries interval time',
    },
    {
        name: 'p2',
        type: 'string',
        description: 'Ratio || Percentage   (write one of the two, Ratio will be used by default)',
    },
], (input, params) => {
    if (!params)
        throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
        throw new Error(`Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`);
    if (typeof params['p2'] !== 'string')
        throw new Error(`Invalid p2 parameter type. Expected string, got ${typeof params['p2']}`);
    const percentageResult = params['p2'] === 'Percentage';
    const dataInput = input.reduce((acc, curr) => acc.concat(...curr), []);
    if (dataInput.length === 0)
        throw new Error('Timeseries is empty');
    const invertBool = (bool) => (bool ? 0 : 1);
    dataInput.unshift({
        date: dataInput[dataInput.length - 1].date - params['p1'],
        value: invertBool(dataInput[0].value),
    });
    // Ensure input is sorted by time
    dataInput.sort((a, b) => a.date - b.date);
    let integral = 0;
    for (let i = 1; i < dataInput.length; i++) {
        // Calculate the difference in time
        const deltaTime = dataInput[i].date - dataInput[i - 1].date;
        // Calculate the average value between two points
        const avgValue = (dataInput[i].value + dataInput[i - 1].value) / 2;
        // Add the area of the trapezoid to the total integral
        integral += avgValue * deltaTime;
    }
    if (!percentageResult)
        return (integral / (dataInput[dataInput.length - 1].date - dataInput[0].date));
    else
        return ((integral /
            (dataInput[dataInput.length - 1].date - dataInput[0].date)) *
            100);
});
exports.STANDARD_DEVIATION = new Algorithm('STANDARD_DEVIATION', 'This algorithm returns the standard deviation of the inputs', ['number'], 'number', [], (input) => {
    const n = input.length;
    const mean = input.reduce((a, b) => a + b) / n;
    return Math.sqrt(input.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
});
exports.EQUAL_TO = new Algorithm('EQUAL_TO', 'This algorithm returns true if all inputs are equal to the parameter', ['number', 'string', 'boolean'], 'boolean', [{ name: 'p1', type: 'number', description: 'the value to compare to' }], (input, params) => {
    if (!params)
        throw new Error('No parameters provided');
    for (const i of input) {
        if (i !== params['p1'])
            return false;
    }
    return true;
});
exports.IS_EMPTY = new Algorithm('IS_EMPTY', 'This algorithm returns true if the input is an empty list', ['number', 'string', 'boolean'], 'boolean', [], (input) => {
    return input.length === 0;
});
exports.CONV_BOOLEAN_TO_NUMBER = new Algorithm('CONV_BOOLEAN_TO_NUMBER', 'This algorithm converts a boolean to a number. True becomes 1, false becomes 0', ['boolean'], 'number', [], (input) => {
    return input[0] ? 1 : 0;
});
exports.CONV_NUMBER_TO_BOOLEAN = new Algorithm('CONV_NUMBER_TO_BOOLEAN', 'This algorithm converts a number to a boolean (0 is false, everything else is true)', ['number'], 'boolean', [], (input) => {
    return input[0] !== 0;
});
exports.CURRENT_EPOCH_TIME = new Algorithm('CURRENT_EPOCH_TIME', 'This algorithm returns the current epoch time', [], 'number', [], 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
(input) => {
    return Date.now();
});
exports.SUBTRACT = new Algorithm('SUBTRACT', 'This algorithm returns the result of the subtraction of the first input by the second input', ['number'], 'number', [], (input) => {
    return input[0] - input[1];
});
exports.SUBTRACT_BY = new Algorithm('SUBTRACT_BY', 'This algorithm returns the result of the subtraction of the first input by the value set by the user (p1)', ['number'], 'number', [{ name: 'p1', type: 'number', description: 'the value to subtract by' }], (input, params) => {
    if (!params)
        throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
        throw new Error(`Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`);
    return input[0] - params['p1'];
});
exports.EXIT = new Algorithm('EXIT', 'This algorithm is used to stop the execution of the workflow if the first input is true', ['boolean'], 'void', [], (input) => {
    return input[0];
});
exports.ALGORITHMS = {
    PUTVALUE: exports.PUTVALUE,
    COPY: exports.COPY,
    DIVIDE: exports.DIVIDE,
    DIVIDE_BY: exports.DIVIDE_BY,
    THRESHOLD_ABOVE: exports.THRESHOLD_ABOVE,
    THRESHOLD_BELOW: exports.THRESHOLD_BELOW,
    THRESHOLD_BETWEEN_IN: exports.THRESHOLD_BETWEEN_IN,
    THRESHOLD_BETWEEN_OUT: exports.THRESHOLD_BETWEEN_OUT,
    THRESHOLD_ZSCORE: exports.THRESHOLD_ZSCORE,
    AVERAGE: exports.AVERAGE,
    TIMESERIES_AVERAGE: exports.TIMESERIES_AVERAGE,
    AND: exports.AND,
    OR: exports.OR,
    NOT: exports.NOT,
    DIFFERENCE_THRESHOLD: exports.DIFFERENCE_THRESHOLD,
    INTEGRAL_BOOLEAN: exports.INTEGRAL_BOOLEAN,
    STANDARD_DEVIATION: exports.STANDARD_DEVIATION,
    EQUAL_TO: exports.EQUAL_TO,
    IS_EMPTY: exports.IS_EMPTY,
    CONV_BOOLEAN_TO_NUMBER: exports.CONV_BOOLEAN_TO_NUMBER,
    CONV_NUMBER_TO_BOOLEAN: exports.CONV_NUMBER_TO_BOOLEAN,
    CURRENT_EPOCH_TIME: exports.CURRENT_EPOCH_TIME,
    SUBTRACT: exports.SUBTRACT,
    SUBTRACT_BY: exports.SUBTRACT_BY,
    EXIT: exports.EXIT
};
//# sourceMappingURL=algorithms.js.map