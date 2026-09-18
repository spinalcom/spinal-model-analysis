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

export const WORKFLOW_BLOCK_NODE_TYPE = 'workflowBlockNode';

/**
 * Relation used for:
 * - workflow node → root blocks (blocks with no dependencies)
 * - source block → dependent block (data flow edge)
 */
export const PARENT_TO_WORKFLOW_BLOCK_RELATION = 'has' + WORKFLOW_BLOCK_NODE_TYPE;

/** Relation from a FOREACH / FILTER block to the root blocks of its iteration body. */
export const FOREACH_TO_SUB_BLOCK_RELATION = 'foreachHas' + WORKFLOW_BLOCK_NODE_TYPE;

/** Relation from an IF block to the root blocks of its "then" branch. */
export const IF_THEN_TO_SUB_BLOCK_RELATION = 'ifThenHas' + WORKFLOW_BLOCK_NODE_TYPE;

/** Relation from an IF block to the root blocks of its "else" branch. */
export const IF_ELSE_TO_SUB_BLOCK_RELATION = 'ifElseHas' + WORKFLOW_BLOCK_NODE_TYPE;

/**
 * Blocks that run a sub-workflow once per element of an array input, exposing the element
 * under the block's `itemRef`. They share one storage layout (FOREACH_TO_SUB_BLOCK_RELATION,
 * foreachOutputBlockId / foreachItemRef / foreachConcurrency) and differ only in what the
 * executor does with each iteration's result: FOREACH collects it, FILTER reads it as a
 * boolean predicate and keeps the element when true.
 */
export const ITERATION_BLOCK_NAMES = ['FOREACH', 'FILTER'] as const;
export type IterationBlockName = (typeof ITERATION_BLOCK_NAMES)[number];

export function isIterationBlock(algorithmName: string): algorithmName is IterationBlockName {
    return (ITERATION_BLOCK_NAMES as readonly string[]).includes(algorithmName);
}

/**
 * Where a container block keeps one sub-workflow: the relation its sub-blocks hang off, and
 * the info field holding the sub-workflow's output block id.
 */
export interface ISubWorkflowSlot {
    relation: string;
    outputField: 'foreachOutputBlockId' | 'ifThenOutputBlockId' | 'ifElseOutputBlockId';
}

/** The iteration body of a FOREACH / FILTER block. */
export const ITERATION_SUB_WORKFLOW_SLOT: ISubWorkflowSlot = {
    relation: FOREACH_TO_SUB_BLOCK_RELATION,
    outputField: 'foreachOutputBlockId',
};

/** The "then" branch of an IF block. */
export const IF_THEN_SUB_WORKFLOW_SLOT: ISubWorkflowSlot = {
    relation: IF_THEN_TO_SUB_BLOCK_RELATION,
    outputField: 'ifThenOutputBlockId',
};

/** The "else" branch of an IF block. */
export const IF_ELSE_SUB_WORKFLOW_SLOT: ISubWorkflowSlot = {
    relation: IF_ELSE_TO_SUB_BLOCK_RELATION,
    outputField: 'ifElseOutputBlockId',
};
