"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYSIS_NODE_TO_OUTPUT_NODE_RELATION = exports.OUTPUT_NODE_TYPE = exports.OUTPUT_NODE_NAME = void 0;
const analysisNode_1 = require("./analysisNode");
exports.OUTPUT_NODE_NAME = 'Output';
exports.OUTPUT_NODE_TYPE = 'analysisOutputNode';
exports.ANALYSIS_NODE_TO_OUTPUT_NODE_RELATION = analysisNode_1.ANALYSIS_NODE_TYPE + 'Has' + exports.OUTPUT_NODE_TYPE;
//# sourceMappingURL=analysisOutput.js.map