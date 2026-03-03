import { ANALYSIS_NODE_TYPE } from "./analysisNode";

export const EXECUTION_WORKFLOW_NODE_NAME = 'ExecutionWorkflow';
export const EXECUTION_WORKFLOW_NODE_TYPE = 'analysisExecutionWorkflowNode';
export const ANALYSIS_NODE_TO_EXECUTION_WORKFLOW_RELATION = ANALYSIS_NODE_TYPE + 'Has' + EXECUTION_WORKFLOW_NODE_TYPE;
