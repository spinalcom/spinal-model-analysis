import { SpinalDateValue } from 'spinal-model-timeseries';
import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { SpinalAttribute } from 'spinal-models-documentation';
import { IAlgorithmParameter } from '../../interfaces/IAlgorithmParameter';
import { IAlgorithmInput } from '../../interfaces/IAlgorithmInput';
export type PrimitiveValue = string | number | boolean;
export type AlgorithmInputValue = PrimitiveValue | SpinalDateValue[] | SpinalNode<any> | PrimitiveValue[] | SpinalDateValue[][] | SpinalNode<any>[];
export type AlgorithmParamValue = PrimitiveValue;
export type AlgorithmParams = Record<string, AlgorithmParamValue>;
export type AlgorithmParameters = IAlgorithmParameter[];
export type AlgorithmResult = PrimitiveValue | SpinalNode<any> | SpinalNode<any>[] | SpinalAttribute | SpinalAttribute[] | SpinalDateValue[] | undefined;
export type AlgorithmRunResult = Promise<AlgorithmResult>;
export interface ExecutionTriggerContext {
    /** Optional user-defined trigger identifier (e.g., "Trigger1") */
    id?: string;
    /** Trigger type (INTERVAL_TIME, CRON, COV, etc.) */
    type?: string;
    /** For COV triggers: register name that was bound (e.g., I0) */
    inputRegister?: string;
    /** For COV triggers: optional deadband/threshold */
    threshold?: number;
}
export interface ExecutionMetadata {
    /** Reference time for this execution (ms epoch) */
    referenceTime: number;
    /** Optional trigger metadata describing what initiated the execution */
    trigger?: ExecutionTriggerContext;
}
export interface AlgorithmRunContext {
    selfNode?: SpinalNode<any>;
    execution?: ExecutionMetadata;
}
export type AlgorithmInputs = IAlgorithmInput[];
export interface AlgorithmDefinition {
    readonly name: string;
    readonly description: string;
    readonly inputs: readonly IAlgorithmInput[];
    readonly outputType: string;
    readonly parameters: AlgorithmParameters;
    run: (input: AlgorithmInputValue | AlgorithmInputValue[], params?: AlgorithmParams, context?: AlgorithmRunContext) => AlgorithmRunResult;
}
/**
 * Coerces a value into a number for numeric algorithms.
 * Accepts a real number or a numeric string (spinal attribute values come through
 * as strings, e.g. GET_ATTRIBUTE). Throws a clear error for genuinely non-numeric
 * values instead of silently producing NaN.
 */
export declare const toNumber: (value: unknown, label?: string) => number;
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
