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



export function THRESHOLD_ABOVE(value: number, thresholds:[number]){
    return (value > thresholds[0]);
};

export function THRESHOLD_BELOW(value: number, thresholds:[number]){
    return (value < thresholds[0]);
};

export function THRESHOLD_BETWEEN_IN(value: number, thresholds:[number,number]){
    const min = Math.min(thresholds[0], thresholds[1]);
    const max = Math.max(thresholds[0], thresholds[1]);
    return (value >= min && value <= max);

};

export function THRESHOLD_BETWEEN_OUT(value: number, thresholds:[number,number]){
    const min = Math.min(thresholds[0], thresholds[1]);
    const max = Math.max(thresholds[0], thresholds[1]);
    return (value <= min && value >= max);
};