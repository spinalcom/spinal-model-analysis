import { VERSION } from './version';

import AnalyticNodeManagerService from './services/AnalyticNodeManagerService';
import WorkflowBlockManagerService from './services/WorkflowBlockManagerService';
import WorkflowExecutionService from './services/WorkflowExecutionService';
import AnalysisExecutionService from './services/AnalysisExecutionService';
import { ALGORITHM_REGISTRY } from './algorithms/algorithms';

const spinalAnalyticNodeManagerService = new AnalyticNodeManagerService();
const spinalWorkflowBlockManagerService = new WorkflowBlockManagerService();
const spinalWorkflowExecutionService = new WorkflowExecutionService(ALGORITHM_REGISTRY);
const spinalAnalysisExecutionService = new AnalysisExecutionService(
  spinalAnalyticNodeManagerService,
  ALGORITHM_REGISTRY
);

export {
  spinalAnalyticNodeManagerService,
  spinalWorkflowBlockManagerService,
  spinalWorkflowExecutionService,
  spinalAnalysisExecutionService,
  VERSION
};

// Service classes
export {
  AnalyticNodeManagerService,
  WorkflowBlockManagerService,
  WorkflowExecutionService,
  AnalysisExecutionService,
};

// Execution context & result types
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
  FLOW_CONTROL_ALGORITHMS,
  REGISTER_ALGORITHMS,
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
  PrimitiveValue,
  createAlgorithm,
  AlgorithmRegistry,
} from './algorithms/definitions/core';

export default spinalAnalysisExecutionService;
