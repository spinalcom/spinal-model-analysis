"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYSIS_NODE_TO_EXECUTION_WORKFLOW_RELATION = exports.EXECUTION_WORKFLOW_NODE_TYPE = exports.EXECUTION_WORKFLOW_NODE_NAME = void 0;
const analysisNode_1 = require("./analysisNode");
exports.EXECUTION_WORKFLOW_NODE_NAME = 'ExecutionWorkflow';
exports.EXECUTION_WORKFLOW_NODE_TYPE = 'analysisExecutionWorkflowNode';
exports.ANALYSIS_NODE_TO_EXECUTION_WORKFLOW_RELATION = analysisNode_1.ANALYSIS_NODE_TYPE + 'Has' + exports.EXECUTION_WORKFLOW_NODE_TYPE;
//# sourceMappingURL=analysisExecutionWorkflow.js.map