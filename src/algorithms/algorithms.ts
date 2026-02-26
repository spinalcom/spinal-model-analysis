export {
  AlgorithmDefinition,
  AlgorithmInputValue,
  AlgorithmParamValue,
  AlgorithmParams,
  AlgorithmParameters,
  AlgorithmResult,
  AlgorithmRunResult,
  AlgorithmRunContext,
  PrimitiveValue,
  createAlgorithm,
  AlgorithmRegistry,
} from './definitions/core';

import { AlgorithmDefinition, AlgorithmRegistry } from './definitions/core';
import { NUMBER_ALGORITHMS } from './definitions/number.algorithms';
import { NODE_ALGORITHMS } from './definitions/node.algorithms';
import { FLOW_CONTROL_ALGORITHMS } from './definitions/flow-control.algorithms';
import { LEGACY_PARITY_ALGORITHMS } from './definitions/legacy-parity.algorithms';

export {
  NUMBER_ALGORITHMS,
  NODE_ALGORITHMS,
  FLOW_CONTROL_ALGORITHMS,
  LEGACY_PARITY_ALGORITHMS,
};

export const ALGORITHM_DEFINITIONS: AlgorithmDefinition[] = [
  ...NUMBER_ALGORITHMS,
  ...NODE_ALGORITHMS,
  ...FLOW_CONTROL_ALGORITHMS,
  ...LEGACY_PARITY_ALGORITHMS,
];

export const ALGORITHM_REGISTRY = new AlgorithmRegistry(
  ALGORITHM_DEFINITIONS
);

export const ALGORITHMS = ALGORITHM_REGISTRY.toObject();
