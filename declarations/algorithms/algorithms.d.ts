import { IAlgorithm } from '../interfaces/IAlgorithm';
import { IRequiredParameter } from '../interfaces/IRequiredParameter';
declare class Algorithm implements IAlgorithm {
    name: string;
    inputTypes: string[];
    outputType: string;
    description: string;
    requiredParams: IRequiredParameter[] | 'boolean' | 'number' | 'string';
    run: (input: any | any[], params?: any) => any;
    constructor(name: string, description: string, inputTypes: string[], outputType: string, requiredParams: IRequiredParameter[] | 'boolean' | 'number' | 'string', run: (input: any | any[], params?: any) => any);
}
export declare const PUTVALUE: Algorithm;
export declare const COPY: Algorithm;
export declare const DIVIDE: Algorithm;
export declare const DIVIDE_BY: Algorithm;
export declare const THRESHOLD_ABOVE: Algorithm;
export declare const THRESHOLD_BELOW: Algorithm;
export declare const THRESHOLD_BETWEEN_IN: Algorithm;
export declare const THRESHOLD_BETWEEN_OUT: Algorithm;
export declare const AVERAGE: Algorithm;
export declare const AND: Algorithm;
export declare const OR: Algorithm;
export declare const NOT: Algorithm;
export declare const DIFFERENCE_THRESHOLD: Algorithm;
export declare const INTEGRAL_BOOLEAN: Algorithm;
export declare const STANDARD_DEVIATION: Algorithm;
export declare const EQUAL_TO: Algorithm;
export declare const IS_EMPTY: Algorithm;
export {};
