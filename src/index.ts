import { VERSION } from './version';

import AnalyticNodeManagerService from './services/AnalyticNodeManagerService';
import WorkflowBlockManagerService from './services/WorkflowBlockManagerService';
import WorkflowExecutionService from './services/WorkflowExecutionService';
import AnalysisExecutionService from './services/AnalysisExecutionService';
import AnalysisFactoryService from './services/AnalysisFactoryService';
import AnalysisTriggerService from './services/AnalysisTriggerService';
import { ALGORITHM_REGISTRY } from './algorithms/algorithms';

const spinalAnalyticNodeManagerService = new AnalyticNodeManagerService();
const spinalWorkflowBlockManagerService = new WorkflowBlockManagerService();
const spinalWorkflowExecutionService = new WorkflowExecutionService(ALGORITHM_REGISTRY);
const spinalAnalysisExecutionService = new AnalysisExecutionService(
  spinalAnalyticNodeManagerService,
  ALGORITHM_REGISTRY
);
const spinalAnalysisFactoryService = new AnalysisFactoryService(
  spinalAnalyticNodeManagerService,
  spinalWorkflowBlockManagerService
);
const spinalAnalysisTriggerService = new AnalysisTriggerService(
  spinalAnalyticNodeManagerService,
  ALGORITHM_REGISTRY
);

export {
  spinalAnalyticNodeManagerService,
  spinalWorkflowBlockManagerService,
  spinalWorkflowExecutionService,
  spinalAnalysisExecutionService,
  spinalAnalysisFactoryService,
  spinalAnalysisTriggerService,
  VERSION
};

// Service classes
export {
  AnalyticNodeManagerService,
  WorkflowBlockManagerService,
  WorkflowExecutionService,
  AnalysisExecutionService,
  AnalysisFactoryService,
  AnalysisTriggerService,
};

// Execution context & result types
export {
  WORK_NODE_RESERVED_ID,
  FOREACH_ITEM_PREFIX,
  FOREACH_ITEM_SUFFIX,
  foreachItemVirtualId,
} from './services/WorkflowExecutionService';
export type {
  WorkflowExecutionContext,
} from './services/WorkflowExecutionService';
export type {
  AnalysisExecutionResult,
  WorkNodeExecutionResult,
} from './services/AnalysisExecutionService';

// Interfaces
export type {
  IWorkflowBlock,
  ISubWorkflow,
  IWorkflowDAG,
} from './interfaces/IWorkflowBlock';
export type { IAlgorithm } from './interfaces/IAlgorithm';
export type { IAlgorithmParameter } from './interfaces/IAlgorithmParameter';
export type { IAlgorithmInput } from './interfaces/IAlgorithmInput';
export type {
  IAnalysisConfigJSON,
  IWorkflowConfigJSON,
  IBlockConfigJSON,
  ITriggerConfigJSON,
  IConcurrencyConfig,
  ConcurrencyMode,
  AnalysisStatus,
} from './interfaces/IAnalysisConfigJSON';

// Trigger types
export type {
  IResolvedTrigger,
  ICOVBindingResult,
} from './services/AnalysisTriggerService';
export { TRIGGER_TYPE } from './constants/analysisTrigger';

// Constants
export * from './constants/analysisContext';
export * from './constants/analysisNode';
export * from './constants/analysisAnchor';
export * from './constants/analysisExecutionWorkflow';
export * from './constants/analysisInput';
export * from './constants/analysisOutput';
export * from './constants/analysisTrigger';
export * from './constants/analysisWorknodeResolver';
export * from './constants/analysisAlgorithm';
export * from './constants/analysisWorkflowBlock';

// Algorithms
export {
  ALGORITHM_DEFINITIONS,
  ALGORITHM_REGISTRY,
  ALGORITHMS,
  NUMBER_ALGORITHMS,
  NODE_ALGORITHMS,
  NODE_ATTRIBUTES_ALGORITHMS,
  FLOW_CONTROL_ALGORITHMS,
  REGISTER_ALGORITHMS,
  LIST_ALGORITHMS,
  BOOLEAN_ALGORITHMS,
  CONVERSION_ALGORITHMS,
  OBJECT_ALGORITHMS,
  STRING_ALGORITHMS,
  TIMESERIES_ALGORITHMS,
  HTTP_ALGORITHMS,
} from './algorithms/algorithms';

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
} from './algorithms/definitions/core';

export default spinalAnalysisExecutionService;
