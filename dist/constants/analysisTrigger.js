"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYSIS_NODE_TO_TRIGGER_NODE_RELATION = exports.TRIGGER_NODE_TYPE = exports.TRIGGER_NODE_NAME = void 0;
const analysisNode_1 = require("./analysisNode");
exports.TRIGGER_NODE_NAME = 'Trigger';
exports.TRIGGER_NODE_TYPE = 'analysisTriggerNode';
exports.ANALYSIS_NODE_TO_TRIGGER_NODE_RELATION = analysisNode_1.ANALYSIS_NODE_TYPE + 'Has' + exports.TRIGGER_NODE_TYPE;
//# sourceMappingURL=analysisTrigger.js.map