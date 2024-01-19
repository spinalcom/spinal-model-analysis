"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBTRACT_BY = exports.SUBTRACT = exports.CURRENT_EPOCH_TIME = exports.CONV_NUMBER_TO_BOOLEAN = exports.CONV_BOOLEAN_TO_NUMBER = exports.IS_EMPTY = exports.EQUAL_TO = exports.STANDARD_DEVIATION = exports.INTEGRAL_BOOLEAN = exports.DIFFERENCE_THRESHOLD = exports.NOT = exports.OR = exports.AND = exports.AVERAGE = exports.THRESHOLD_BETWEEN_OUT = exports.THRESHOLD_BETWEEN_IN = exports.THRESHOLD_BELOW = exports.THRESHOLD_ABOVE = exports.DIVIDE_BY = exports.DIVIDE = exports.COPY = exports.PUTVALUE = void 0;
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
exports.PUTVALUE = new Algorithm('PUTVALUE', 'This algorithm returns the value set by the user (p1) regardless of the input', ['number'], 'number', [{ name: 'p1', type: 'number', description: 'the value to inject' }], (input, params) => {
    return params['p1'];
});
exports.COPY = new Algorithm('COPY', 'This algorithm returns the value of first input', ['number'], 'number', [], (input, params) => {
    return input[0];
});
exports.DIVIDE = new Algorithm('DIVIDE', 'This algorithm returns the result of the division of the first input by the second input', ['number'], 'number', [], (input, params) => {
    return input[0] / input[1];
});
exports.DIVIDE_BY = new Algorithm('DIVIDE_BY', 'This algorithm returns the result of the division of the first input by the value set by the user (p1)', ['number'], 'number', [{ name: 'p1', type: 'number', description: 'the value to divide by' }], (input, params) => {
    return input[0] / params['p1'];
});
exports.THRESHOLD_ABOVE = new Algorithm('THRESHOLD_ABOVE', 'This algorithm returns true if the input is above the threshold set by the user', ['number'], 'boolean', [{ name: 'p1', type: 'number', description: 'the threshold value' }], (input, params) => {
    const treshold = params['p1'];
    for (const n of input) {
        if (n > treshold)
            return true;
    }
    return false;
});
exports.THRESHOLD_BELOW = new Algorithm('THRESHOLD_BELOW', 'This algorithm returns true if the input is below the threshold set by the user', ['number'], 'boolean', [{ name: 'p1', type: 'number', description: 'the threshold value' }], (input, params) => {
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
exports.AVERAGE = new Algorithm('AVERAGE', 'This algorithm returns the average of the inputs', ['number'], 'number', [], (input, params) => {
    const flattenedArray = input.reduce((acc, curr) => acc.concat(...curr), []);
    return (flattenedArray.reduce((acc, current) => acc + current, 0) / input.length);
});
exports.AND = new Algorithm('AND', 'This algorithm returns true if all the inputs are true', ['boolean'], 'boolean', [], (input, params) => {
    return !input.includes(false);
});
exports.OR = new Algorithm('OR', 'This algorithm returns true if at least one of the inputs is true', ['boolean'], 'boolean', [], (input, params) => {
    return input.includes(true);
});
exports.NOT = new Algorithm('NOT', 'This algorithm returns true if all the inputs are false', ['boolean'], 'boolean', [], (input, params) => {
    return !input.includes(true);
});
exports.DIFFERENCE_THRESHOLD = new Algorithm('DIFFERENCE_THRESHOLD', 'This algorithm returns true if the difference between the first and any other input is above the threshold set by the user', ['number'], 'boolean', [{ name: 'p1', type: 'number', description: 'the threshold value' }], (input, params) => {
    const treshold = params['p1'];
    const first = input[0];
    for (const n of input) {
        if (Math.abs(n - first) > treshold)
            return true;
    }
    return false;
});
exports.INTEGRAL_BOOLEAN = new Algorithm('INTEGRAL_BOOLEAN', 'This algorithm calculates the integral of timeseries.', ['object'], 'number', [
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
    const percentageResult = params['p2'] === 'Percentage';
    const dataInput = input.reduce((acc, curr) => acc.concat(...curr), []);
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
exports.STANDARD_DEVIATION = new Algorithm('STANDARD_DEVIATION', 'This algorithm returns the standard deviation of the inputs', ['number'], 'number', [], (input, params) => {
    const n = input.length;
    const mean = input.reduce((a, b) => a + b) / n;
    return Math.sqrt(input.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
});
exports.EQUAL_TO = new Algorithm('EQUAL_TO', 'This algorithm returns true if the first input is equal to the parameter', ['number', 'string'], 'boolean', [{ name: 'p1', type: 'number', description: 'the value to compare to' }], (input, params) => {
    return input[0] === params['p1'];
});
exports.IS_EMPTY = new Algorithm('IS_EMPTY', 'This algorithm returns true if the input is an empty list', ['number', 'string'], 'boolean', [], (input, params) => {
    const flattenedArray = input.reduce((acc, curr) => acc.concat(...curr), []);
    return flattenedArray.length === 0;
});
exports.CONV_BOOLEAN_TO_NUMBER = new Algorithm('CONV_BOOLEAN_TO_NUMBER', 'This algorithm converts a boolean to a number', ['boolean'], 'number', [], (input, params) => {
    return input[0] ? 1 : 0;
});
exports.CONV_NUMBER_TO_BOOLEAN = new Algorithm('CONV_NUMBER_TO_BOOLEAN', 'This algorithm converts a number to a boolean (0 is false, everything else is true)', ['number'], 'boolean', [], (input, params) => {
    const flattenedArray = input.reduce((acc, curr) => acc.concat(...curr), []);
    return flattenedArray[0] !== 0;
});
exports.CURRENT_EPOCH_TIME = new Algorithm('CURRENT_EPOCH_TIME', 'This algorithm returns the current epoch time', [], 'number', [], (input, params) => {
    return Date.now();
});
exports.SUBTRACT = new Algorithm('SUBTRACT', 'This algorithm returns the result of the subtraction of the first input by the second input', ['number'], 'number', [], (input, params) => {
    return input[0] - input[1];
});
exports.SUBTRACT_BY = new Algorithm('SUBTRACT_BY', 'This algorithm returns the result of the subtraction of the first input by the value set by the user (p1)', ['number'], 'number', [{ name: 'p1', type: 'number', description: 'the value to subtract by' }], (input, params) => {
    return input[0] - params['p1'];
});
//# sourceMappingURL=algorithms.js.map