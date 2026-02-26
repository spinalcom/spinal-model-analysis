import { SpinalDateValue } from 'spinal-model-timeseries';
import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { IAlgorithmParameter } from '../../interfaces/IAlgorithmParameter';
export type PrimitiveValue = string | number | boolean;
export type AlgorithmInputValue = PrimitiveValue | SpinalDateValue[] | SpinalNode<any> | PrimitiveValue[] | SpinalDateValue[][] | SpinalNode<any>[];
export type AlgorithmParamValue = PrimitiveValue;
export type AlgorithmParams = Record<string, AlgorithmParamValue>;
export type AlgorithmParameters = IAlgorithmParameter[];
export type AlgorithmResult = PrimitiveValue | SpinalNode<any> | SpinalNode<any>[] | undefined;
export type AlgorithmRunResult = Promise<AlgorithmResult>;
export interface AlgorithmRunContext {
    selfNode?: SpinalNode<any>;
    getChildren?: () => Promise<SpinalNode<any>[]>;
    setNextNodes?: (nodes: SpinalNode<any>[]) => void;
}
export interface AlgorithmDefinition {
    readonly name: string;
    readonly description: string;
    readonly inputTypes: readonly string[];
    readonly outputType: string;
    readonly parameters: AlgorithmParameters;
    run: (input: AlgorithmInputValue | AlgorithmInputValue[], params?: AlgorithmParams, context?: AlgorithmRunContext) => AlgorithmRunResult;
}
export declare const createAlgorithm: (definition: AlgorithmDefinition) => AlgorithmDefinition;
export declare class AlgorithmRegistry {
    private readonly registry;
    constructor(initialAlgorithms?: AlgorithmDefinition[]);
    register(algorithm: AlgorithmDefinition): this;
    get(name: string): AlgorithmDefinition;
    has(name: string): boolean;
    execute(name: string, input: AlgorithmInputValue | AlgorithmInputValue[], params?: AlgorithmParams, context?: AlgorithmRunContext): AlgorithmRunResult;
    list(): AlgorithmDefinition[];
    toObject(): Record<string, AlgorithmDefinition>;
}
