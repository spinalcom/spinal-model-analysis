"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANCHOR_NODE_TO_LINKED_NODE_RELATION = exports.ANALYSIS_NODE_TO_ANCHOR_RELATION = exports.ANCHOR_NODE_TYPE = exports.ANCHOR_NODE_NAME = void 0;
const analysisNode_1 = require("./analysisNode");
exports.ANCHOR_NODE_NAME = 'Anchor';
exports.ANCHOR_NODE_TYPE = 'analysisAnchorNode';
exports.ANALYSIS_NODE_TO_ANCHOR_RELATION = analysisNode_1.ANALYSIS_NODE_TYPE + 'HasAnchor';
exports.ANCHOR_NODE_TO_LINKED_NODE_RELATION = exports.ANCHOR_NODE_TYPE + 'HasAnchor';
//# sourceMappingURL=analysisAnchor.js.map