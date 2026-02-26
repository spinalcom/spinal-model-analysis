/* eslint-disable @typescript-eslint/no-explicit-any */
import { SpinalDateValue } from 'spinal-model-timeseries';
import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { IAlgorithmParameter } from '../../interfaces/IAlgorithmParameter';

export type PrimitiveValue = string | number | boolean;
export type AlgorithmInputValue =
  | PrimitiveValue
  | SpinalDateValue[]
  | SpinalNode<any>
  | PrimitiveValue[]
  | SpinalDateValue[][]
  | SpinalNode<any>[];

export type AlgorithmParamValue = PrimitiveValue;
export type AlgorithmParams = Record<string, AlgorithmParamValue>;
export type AlgorithmParameters = IAlgorithmParameter[];
export type AlgorithmResult =
  | PrimitiveValue
  | SpinalNode<any>
  | SpinalNode<any>[]
  | undefined;
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
  run: (
    input: AlgorithmInputValue | AlgorithmInputValue[],
    params?: AlgorithmParams,
    context?: AlgorithmRunContext
  ) => AlgorithmRunResult;
}

export const createAlgorithm = (
  definition: AlgorithmDefinition
): AlgorithmDefinition => {
  return Object.freeze({
    ...definition,
    inputTypes: [...definition.inputTypes],
    parameters: [...definition.parameters],
  });
};

export class AlgorithmRegistry {
  private readonly registry = new Map<string, AlgorithmDefinition>();

  constructor(initialAlgorithms: AlgorithmDefinition[] = []) {
    for (const algorithm of initialAlgorithms) {
      this.register(algorithm);
    }
  }

  register(algorithm: AlgorithmDefinition): this {
    this.registry.set(algorithm.name, createAlgorithm(algorithm));
    return this;
  }

  get(name: string): AlgorithmDefinition {
    const algorithm = this.registry.get(name);
    if (!algorithm) throw new Error(`Algorithm "${name}" not found`);
    return algorithm;
  }

  has(name: string): boolean {
    return this.registry.has(name);
  }

  async execute(
    name: string,
    input: AlgorithmInputValue | AlgorithmInputValue[],
    params?: AlgorithmParams,
    context?: AlgorithmRunContext
  ): AlgorithmRunResult {
    const algorithm = this.get(name);
    return await algorithm.run(input, params, context);
  }

  list(): AlgorithmDefinition[] {
    return [...this.registry.values()];
  }

  toObject(): Record<string, AlgorithmDefinition> {
    const result: Record<string, AlgorithmDefinition> = {};
    for (const [name, algorithm] of this.registry.entries()) {
      result[name] = algorithm;
    }
    return result;
  }
}
