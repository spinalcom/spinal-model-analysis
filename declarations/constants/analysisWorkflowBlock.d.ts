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
export declare const WORKFLOW_BLOCK_NODE_TYPE = "workflowBlockNode";
/**
 * Relation used for:
 * - workflow node → root blocks (blocks with no dependencies)
 * - source block → dependent block (data flow edge)
 */
export declare const PARENT_TO_WORKFLOW_BLOCK_RELATION: string;
/** Relation from a FOREACH / FILTER block to the root blocks of its iteration body. */
export declare const FOREACH_TO_SUB_BLOCK_RELATION: string;
/** Relation from an IF block to the root blocks of its "then" branch. */
export declare const IF_THEN_TO_SUB_BLOCK_RELATION: string;
/** Relation from an IF block to the root blocks of its "else" branch. */
export declare const IF_ELSE_TO_SUB_BLOCK_RELATION: string;
/**
 * Blocks that run a sub-workflow once per element of an array input, exposing the element
 * under the block's `itemRef`. They share one storage layout (FOREACH_TO_SUB_BLOCK_RELATION,
 * foreachOutputBlockId / foreachItemRef / foreachConcurrency) and differ only in what the
 * executor does with each iteration's result: FOREACH collects it, FILTER reads it as a
 * boolean predicate and keeps the element when true.
 */
export declare const ITERATION_BLOCK_NAMES: readonly ["FOREACH", "FILTER"];
export type IterationBlockName = (typeof ITERATION_BLOCK_NAMES)[number];
export declare function isIterationBlock(algorithmName: string): algorithmName is IterationBlockName;
/**
 * Where a container block keeps one sub-workflow: the relation its sub-blocks hang off, and
 * the info field holding the sub-workflow's output block id.
 */
export interface ISubWorkflowSlot {
    relation: string;
    outputField: 'foreachOutputBlockId' | 'ifThenOutputBlockId' | 'ifElseOutputBlockId';
}
/** The iteration body of a FOREACH / FILTER block. */
export declare const ITERATION_SUB_WORKFLOW_SLOT: ISubWorkflowSlot;
/** The "then" branch of an IF block. */
export declare const IF_THEN_SUB_WORKFLOW_SLOT: ISubWorkflowSlot;
/** The "else" branch of an IF block. */
export declare const IF_ELSE_SUB_WORKFLOW_SLOT: ISubWorkflowSlot;
