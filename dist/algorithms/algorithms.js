"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTEGRAL_BOOLEAN = exports.DIFFERENCE_THRESHOLD = exports.NOT = exports.OR = exports.AND = exports.AVERAGE = exports.THRESHOLD_BETWEEN_OUT = exports.THRESHOLD_BETWEEN_IN = exports.THRESHOLD_BELOW = exports.THRESHOLD_ABOVE = exports.PUTVALUE = void 0;
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
    console.log(' input : ', dataInput);
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
/*

export function WEIGHTED_AVERAGE(values: number[], weights: number[]) {
    if (values.length !== weights.length) {
        throw new Error("values and weights must have the same length");
    }
    const sum = values.reduce((acc, current, index) => acc + current * weights[index], 0);
    const weightSum = weights.reduce((acc, current) => acc + current, 0);
    return sum / weightSum;
};


export function MEDIAN (values: number[]): number {
    const mid = Math.floor(values.length / 2),
      nums = [...values].sort((a, b) => a - b);
    return values.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

export function ANALYTIC_AND(values: boolean[]){
    return !values.includes(false);
};

export function ANALYTIC_OR(values : boolean[]){
    return values.includes(true);
};

export function ANALYTIC_XOR(values: boolean[]) {
    return values.reduce((acc, current) => acc !== current, false);
};

export function ANALYTIC_XAND(values: boolean[]) {
    return !values.reduce((acc, current) => acc !== current, true);
};*/
//# sourceMappingURL=algorithms.js.map