"use strict";
/**
 * Constants for workflow block nodes stored in the SpinalGraph.
 *
 * A workflow (input, execution, worknode resolver) contains blocks as a DAG:
 * - Root blocks (no dependencies) are children of the workflow node
 * - Dependent blocks are children of their dependency blocks
 * - Both use PARENT_TO_WORKFLOW_BLOCK_RELATION
 *
 * Container blocks (FOREACH, FILTER, IF) hold sub-workflows: their sub-blocks hang off the
 * container through a dedicated relation (one per "slot"), and the container remembers the
 * sub-workflow's output block in an info field — see the sub-workflow slots below.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IF_ELSE_SUB_WORKFLOW_SLOT = exports.IF_THEN_SUB_WORKFLOW_SLOT = exports.ITERATION_SUB_WORKFLOW_SLOT = exports.isIterationBlock = exports.ITERATION_BLOCK_NAMES = exports.IF_ELSE_TO_SUB_BLOCK_RELATION = exports.IF_THEN_TO_SUB_BLOCK_RELATION = exports.FOREACH_TO_SUB_BLOCK_RELATION = exports.PARENT_TO_WORKFLOW_BLOCK_RELATION = exports.WORKFLOW_BLOCK_NODE_TYPE = void 0;
exports.WORKFLOW_BLOCK_NODE_TYPE = 'workflowBlockNode';
/**
 * Relation used for:
 * - workflow node → root blocks (blocks with no dependencies)
 * - source block → dependent block (data flow edge)
 */
exports.PARENT_TO_WORKFLOW_BLOCK_RELATION = 'has' + exports.WORKFLOW_BLOCK_NODE_TYPE;
/** Relation from a FOREACH / FILTER block to the root blocks of its iteration body. */
exports.FOREACH_TO_SUB_BLOCK_RELATION = 'foreachHas' + exports.WORKFLOW_BLOCK_NODE_TYPE;
/** Relation from an IF block to the root blocks of its "then" branch. */
exports.IF_THEN_TO_SUB_BLOCK_RELATION = 'ifThenHas' + exports.WORKFLOW_BLOCK_NODE_TYPE;
/** Relation from an IF block to the root blocks of its "else" branch. */
exports.IF_ELSE_TO_SUB_BLOCK_RELATION = 'ifElseHas' + exports.WORKFLOW_BLOCK_NODE_TYPE;
/**
 * Blocks that run a sub-workflow once per element of an array input, exposing the element
 * under the block's `itemRef`. They share one storage layout (FOREACH_TO_SUB_BLOCK_RELATION,
 * foreachOutputBlockId / foreachItemRef / foreachConcurrency) and differ only in what the
 * executor does with each iteration's result: FOREACH collects it, FILTER reads it as a
 * boolean predicate and keeps the element when true.
 */
exports.ITERATION_BLOCK_NAMES = ['FOREACH', 'FILTER'];
function isIterationBlock(algorithmName) {
    return exports.ITERATION_BLOCK_NAMES.includes(algorithmName);
}
exports.isIterationBlock = isIterationBlock;
/** The iteration body of a FOREACH / FILTER block. */
exports.ITERATION_SUB_WORKFLOW_SLOT = {
    relation: exports.FOREACH_TO_SUB_BLOCK_RELATION,
    outputField: 'foreachOutputBlockId',
};
/** The "then" branch of an IF block. */
exports.IF_THEN_SUB_WORKFLOW_SLOT = {
    relation: exports.IF_THEN_TO_SUB_BLOCK_RELATION,
    outputField: 'ifThenOutputBlockId',
};
/** The "else" branch of an IF block. */
exports.IF_ELSE_SUB_WORKFLOW_SLOT = {
    relation: exports.IF_ELSE_TO_SUB_BLOCK_RELATION,
    outputField: 'ifElseOutputBlockId',
};
//# sourceMappingURL=analysisWorkflowBlock.js.map