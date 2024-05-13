import { IAlgorithm } from '../interfaces/IAlgorithm';
import { IRequiredParameter } from '../interfaces/IRequiredParameter';
import { SpinalDateValue } from 'spinal-model-timeseries';
interface IParameters {
    [key: string]: string | number | boolean;
}
type PrimitiveInput = number | string | boolean;
type IInput = PrimitiveInput | SpinalDateValue[];
declare class Algorithm implements IAlgorithm {
    name: string;
    inputTypes: string[];
    outputType: string;
    description: string;
    requiredParams: IRequiredParameter[] | 'boolean' | 'number' | 'string';
    run: (input: IInput, params?: IParameters) => string | number | boolean;
    constructor(name: string, description: string, inputTypes: string[], outputType: string, requiredParams: IRequiredParameter[] | 'boolean' | 'number' | 'string', run: (input: any | any[], params?: IParameters) => string | number | boolean);
}
export declare const PUTVALUE: Algorithm;
export declare const COPY: Algorithm;
export declare const DIVIDE: Algorithm;
export declare const DIVIDE_BY: Algorithm;
export declare const MULTIPLY_BY: Algorithm;
export declare const MULTIPLY: Algorithm;
export declare const THRESHOLD_ABOVE: Algorithm;
export declare const THRESHOLD_BELOW: Algorithm;
export declare const THRESHOLD_BETWEEN_IN: Algorithm;
export declare const THRESHOLD_BETWEEN_OUT: Algorithm;
export declare const THRESHOLD_ZSCORE: Algorithm;
export declare const AVERAGE: Algorithm;
export declare const TIMESERIES_AVERAGE: Algorithm;
export declare const TIMESERIES_TIME_WEIGHTED_AVERAGE: Algorithm;
export declare const TIMESERIES_BOOLEAN_RATE: Algorithm;
export declare const TIMESERIES_IS_EMPTY: Algorithm;
export declare const TIMESERIES_SUM: Algorithm;
export declare const AND: Algorithm;
export declare const OR: Algorithm;
export declare const NOT: Algorithm;
export declare const DIFFERENCE_THRESHOLD: Algorithm;
export declare const STANDARD_DEVIATION: Algorithm;
export declare const EQUAL_TO: Algorithm;
export declare const IS_EMPTY: Algorithm;
export declare const CONV_BOOLEAN_TO_NUMBER: Algorithm;
export declare const CONV_NUMBER_TO_BOOLEAN: Algorithm;
export declare const CURRENT_EPOCH_TIME: Algorithm;
export declare const SUBTRACT: Algorithm;
export declare const SUBTRACT_BY: Algorithm;
export declare const EXIT: Algorithm;
export declare const ALGORITHMS: {
    [key: string]: Algorithm;
};
export {};
