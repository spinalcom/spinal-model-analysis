"use strict";
/**
 * Constants for workflow block nodes stored in the SpinalGraph.
 *
 * A workflow (input, execution, worknode resolver) contains blocks as a DAG:
 * - Root blocks (no dependencies) are children of the workflow node
 * - Dependent blocks are children of their dependency blocks
 * - Both use PARENT_TO_WORKFLOW_BLOCK_RELATION
 *
 * For FOREACH blocks, sub-workflow blocks use FOREACH_TO_SUB_BLOCK_RELATION.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FOREACH_TO_SUB_BLOCK_RELATION = exports.PARENT_TO_WORKFLOW_BLOCK_RELATION = exports.WORKFLOW_BLOCK_NODE_TYPE = void 0;
exports.WORKFLOW_BLOCK_NODE_TYPE = 'workflowBlockNode';
/**
 * Relation used for:
 * - workflow node → root blocks (blocks with no dependencies)
 * - source block → dependent block (data flow edge)
 */
exports.PARENT_TO_WORKFLOW_BLOCK_RELATION = 'has' + exports.WORKFLOW_BLOCK_NODE_TYPE;
/**
 * Relation used for FOREACH blocks to their sub-workflow root blocks.
 */
exports.FOREACH_TO_SUB_BLOCK_RELATION = 'foreachHas' + exports.WORKFLOW_BLOCK_NODE_TYPE;
//# sourceMappingURL=analysisWorkflowBlock.js.map