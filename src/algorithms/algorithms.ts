export {
  AlgorithmDefinition,
  AlgorithmInputValue,
  AlgorithmParamValue,
  AlgorithmParams,
  AlgorithmParameters,
  AlgorithmResult,
  AlgorithmRunResult,
  AlgorithmRunContext,
  ExecutionMetadata,
  ExecutionTriggerContext,
  PrimitiveValue,
  createAlgorithm,
  AlgorithmRegistry,
} from './definitions/core';

import { AlgorithmDefinition, AlgorithmRegistry } from './definitions/core';
import { NUMBER_ALGORITHMS } from './definitions/number.algorithms';
import { NODE_ALGORITHMS } from './definitions/node.algorithms';
import { NODE_ATTRIBUTES_ALGORITHMS } from './definitions/node.attributes.algorithms';
import { FLOW_CONTROL_ALGORITHMS } from './definitions/flow-control.algorithms';
import { REGISTER_ALGORITHMS } from './definitions/register.algorithms';
import { BOOLEAN_ALGORITHMS } from './definitions/boolean.algorithms';
import { CONVERSION_ALGORITHMS } from './definitions/conversion.algorithms';
import { OBJECT_ALGORITHMS } from './definitions/object.algorithms';
import { LIST_ALGORITHMS } from './definitions/list.algorithms';

export {
  NUMBER_ALGORITHMS,
  NODE_ALGORITHMS,
  NODE_ATTRIBUTES_ALGORITHMS,
  FLOW_CONTROL_ALGORITHMS,
  REGISTER_ALGORITHMS,
  BOOLEAN_ALGORITHMS,
  CONVERSION_ALGORITHMS,
  OBJECT_ALGORITHMS,
  LIST_ALGORITHMS,
};

export const ALGORITHM_DEFINITIONS: AlgorithmDefinition[] = [
  ...NUMBER_ALGORITHMS,
  ...NODE_ALGORITHMS,
  ...NODE_ATTRIBUTES_ALGORITHMS,
  ...FLOW_CONTROL_ALGORITHMS,
  ...REGISTER_ALGORITHMS,
  ...BOOLEAN_ALGORITHMS,
  ...CONVERSION_ALGORITHMS,
  ...OBJECT_ALGORITHMS,
  ...LIST_ALGORITHMS,
];

export const ALGORITHM_REGISTRY = new AlgorithmRegistry(
  ALGORITHM_DEFINITIONS
);

export const ALGORITHMS = ALGORITHM_REGISTRY.toObject();
