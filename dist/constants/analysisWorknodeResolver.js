"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYSIS_NODE_TO_WORKNODE_RESOLVER_RELATION = exports.WORKNODE_RESOLVER_NODE_TYPE = exports.WORKNODE_RESOLVER_NODE_NAME = void 0;
const analysisNode_1 = require("./analysisNode");
exports.WORKNODE_RESOLVER_NODE_NAME = 'WorknodeResolver';
exports.WORKNODE_RESOLVER_NODE_TYPE = 'analysisWorknodeResolverNode';
exports.ANALYSIS_NODE_TO_WORKNODE_RESOLVER_RELATION = analysisNode_1.ANALYSIS_NODE_TYPE + 'Has' + exports.WORKNODE_RESOLVER_NODE_TYPE;
//# sourceMappingURL=analysisWorknodeResolver.js.map