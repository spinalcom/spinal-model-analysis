"use strict";
/*export function AVERAGE(values: number[]) {
    values.reduce((acc, current) => acc + current, 0) / values.length;
};

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
Object.defineProperty(exports, "__esModule", { value: true });
exports.THRESHOLD_BETWEEN_OUT = exports.THRESHOLD_BETWEEN_IN = exports.THRESHOLD_BELOW = exports.THRESHOLD_ABOVE = exports.PUTVALUE = void 0;
function PUTVALUE(input, params) {
    return params['p1'];
}
exports.PUTVALUE = PUTVALUE;
;
function THRESHOLD_ABOVE(input, params) {
    const treshold = params['p1'];
    return (input > treshold);
}
exports.THRESHOLD_ABOVE = THRESHOLD_ABOVE;
;
function THRESHOLD_BELOW(input, params) {
    const treshold = params['p1'];
    return (input < treshold);
}
exports.THRESHOLD_BELOW = THRESHOLD_BELOW;
;
function THRESHOLD_BETWEEN_IN(input, params) {
    const p1 = params['p1'];
    const p2 = params['p2'];
    const min = Math.min(p1, p2);
    const max = Math.max(p1, p2);
    return (input >= min && input <= max);
}
exports.THRESHOLD_BETWEEN_IN = THRESHOLD_BETWEEN_IN;
;
function THRESHOLD_BETWEEN_OUT(input, params) {
    const p1 = params['p1'];
    const p2 = params['p2'];
    const min = Math.min(p1, p2);
    const max = Math.max(p1, p2);
    return (input <= min || input >= max);
}
exports.THRESHOLD_BETWEEN_OUT = THRESHOLD_BETWEEN_OUT;
;
//# sourceMappingURL=algorithms.js.map