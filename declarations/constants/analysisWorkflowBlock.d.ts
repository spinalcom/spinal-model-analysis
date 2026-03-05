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
export declare const WORKFLOW_BLOCK_NODE_TYPE = "workflowBlockNode";
/**
 * Relation used for:
 * - workflow node → root blocks (blocks with no dependencies)
 * - source block → dependent block (data flow edge)
 */
export declare const PARENT_TO_WORKFLOW_BLOCK_RELATION: string;
/**
 * Relation used for FOREACH blocks to their sub-workflow root blocks.
 */
export declare const FOREACH_TO_SUB_BLOCK_RELATION: string;
