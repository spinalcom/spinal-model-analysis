import { IAlgorithm } from '../interfaces/IAlgorithm';
import { IRequiredParameter } from '../interfaces/IRequiredParameter';
declare class Algorithm implements IAlgorithm {
    name: string;
    inputTypes: string[];
    outputType: string;
    description: string;
    requiredParams: IRequiredParameter[];
    run: (input: any | any[], params?: any) => any;
    constructor(name: string, description: string, inputTypes: string[], outputType: string, requiredParams: any, run: (input: any | any[], params?: any) => any);
}
export declare const PUTVALUE: Algorithm;
export declare const THRESHOLD_ABOVE: Algorithm;
export declare const THRESHOLD_BELOW: Algorithm;
export declare const THRESHOLD_BETWEEN_IN: Algorithm;
export declare const THRESHOLD_BETWEEN_OUT: Algorithm;
export declare const AVERAGE: Algorithm;
export declare const AND: Algorithm;
export declare const OR: Algorithm;
export {};
