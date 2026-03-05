"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYSIS_NODE_TO_INPUT_NODE_RELATION = exports.INPUT_NODE_TYPE = exports.INPUT_NODE_NAME = void 0;
const analysisNode_1 = require("./analysisNode");
exports.INPUT_NODE_NAME = 'Input';
exports.INPUT_NODE_TYPE = 'analysisInputWorkflowNode';
exports.ANALYSIS_NODE_TO_INPUT_NODE_RELATION = analysisNode_1.ANALYSIS_NODE_TYPE + 'Has' + exports.INPUT_NODE_TYPE;
//# sourceMappingURL=analysisInput.js.map