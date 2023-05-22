"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVERAGE = exports.THRESHOLD_BETWEEN_OUT = exports.THRESHOLD_BETWEEN_IN = exports.THRESHOLD_BELOW = exports.THRESHOLD_ABOVE = exports.PUTVALUE = void 0;
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
const algorithms = [];
exports.PUTVALUE = new Algorithm('PUTVALUE', 'This algorithm returns the value set by the user (p1) regardless of the input', ['number'], 'number', [{ name: 'p1', type: 'number', description: 'the value to inject' }], (input, params) => {
    return params['p1'];
});
exports.THRESHOLD_ABOVE = new Algorithm('THRESHOLD_ABOVE', 'This algorithm returns true if the input is above the threshold set by the user', ['number'], 'boolean', [{ name: 'p1', type: 'number', description: 'the threshold value' }], (input, params) => {
    const treshold = params['p1'];
    return input > treshold;
});
exports.THRESHOLD_BELOW = new Algorithm('THRESHOLD_BELOW', 'This algorithm returns true if the input is below the threshold set by the user', ['number'], 'boolean', [{ name: 'p1', type: 'number', description: 'the threshold value' }], (input, params) => {
    const treshold = params['p1'];
    return input < treshold;
});
exports.THRESHOLD_BETWEEN_IN = new Algorithm('THRESHOLD_BETWEEN_IN', 'This algorithm returns true if the input is between the two thresholds set by the user', ['number'], 'boolean', [
    { name: 'p1', type: 'number', description: 'the first threshold value' },
    { name: 'p2', type: 'number', description: 'the second threshold value' },
], (input, params) => {
    const p1 = params['p1'];
    const p2 = params['p2'];
    const min = Math.min(p1, p2);
    const max = Math.max(p1, p2);
    return input >= min && input <= max;
});
exports.THRESHOLD_BETWEEN_OUT = new Algorithm('THRESHOLD_BETWEEN_OUT', 'This algorithm returns true if the input is outside the two thresholds set by the user', ['number'], 'boolean', [
    { name: 'p1', type: 'number', description: 'the first threshold value' },
    { name: 'p2', type: 'number', description: 'the second threshold value' },
], (input, params) => {
    const p1 = params['p1'];
    const p2 = params['p2'];
    const min = Math.min(p1, p2);
    const max = Math.max(p1, p2);
    return input <= min || input >= max;
});
exports.AVERAGE = new Algorithm('AVERAGE', 'This algorithm returns the average of the inputs', ['number'], 'number', [], (input, params) => {
    return input.reduce((acc, current) => acc + current, 0) / input.length;
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