import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { IWorkflowDAG } from '../interfaces/IWorkflowBlock';
/**
 * Service for creating, managing, and loading workflow blocks stored as SpinalNodes.
 *
 * Graph structure:
 * - Each block is a SpinalNode of type 'workflowBlockNode'
 * - Root blocks (no dependencies) are children of the workflow node
 * - Dependent blocks are children of their dependency blocks
 * - Block config is stored in the node's info: algorithmName, parameters (JSON),
 *   inputBlockIds (JSON ordered array), registerAs (optional)
 * - FOREACH blocks have sub-workflow blocks as children via a dedicated relation
 */
export default class WorkflowBlockManagerService {
    /**
     * Creates a new block SpinalNode and adds it as a child of the given parent node.
     * The parent can be a workflow node (for root blocks) or another block (for dependent blocks).
     *
     * @param parentNode - The parent node (workflow node or dependency block)
     * @param contextNode - The analysis context node
     * @param algorithmName - Algorithm to execute (from the AlgorithmRegistry)
     * @param parameters - Static parameters for the algorithm
     * @param options - Optional: block name, registerAs, foreachOutputBlockId
     * @returns The created block SpinalNode
     */
    createBlock(parentNode: SpinalNode<any>, contextNode: SpinalNode<any>, algorithmName: string, parameters?: Record<string, unknown>, options?: {
        name?: string;
        registerAs?: string;
        foreachOutputBlockId?: string;
    }): Promise<SpinalNode<any>>;
    /**
     * Creates a block SpinalNode without attaching it to any parent.
     * Use this when the block will be wired as a dependent later via addDependency(),
     * to avoid the double-parenting problem (block shouldn't be a child of both
     * the workflow node AND its source block).
     *
     * Root blocks (no dependencies) should use createBlock() instead.
     *
     * @returns The created block SpinalNode (not yet in the graph hierarchy)
     */
    createOrphanBlock(algorithmName: string, parameters?: Record<string, unknown>, options?: {
        name?: string;
        registerAs?: string;
        foreachOutputBlockId?: string;
    }): SpinalNode<any>;
    /**
     * Creates a sub-block for a FOREACH block using the dedicated FOREACH relation.
     * Sub-blocks form a mini-DAG inside the FOREACH block.
     */
    createForeachSubBlock(foreachBlock: SpinalNode<any>, contextNode: SpinalNode<any>, algorithmName: string, parameters?: Record<string, unknown>, options?: {
        name?: string;
        registerAs?: string;
    }): Promise<SpinalNode<any>>;
    /**
     * Adds a data-flow dependency: sourceBlock feeds into dependentBlock.
     * In graph terms, dependentBlock becomes a child of sourceBlock.
     *
     * Also updates the dependentBlock's inputBlockIds to include the sourceBlock
     * at the given slot index (appends if no slot specified).
     *
     * @param sourceBlock - The block producing the output
     * @param dependentBlock - The block consuming the output
     * @param contextNode - The analysis context node
     * @param slotIndex - Optional input slot position (0-based). Appends if omitted.
     */
    addDependency(sourceBlock: SpinalNode<any>, dependentBlock: SpinalNode<any>, contextNode: SpinalNode<any>, slotIndex?: number): Promise<void>;
    /**
     * Adds a data-flow dependency between FOREACH sub-blocks.
     * Same as addDependency but within the context of a FOREACH sub-workflow.
     */
    addSubBlockDependency(sourceSubBlock: SpinalNode<any>, dependentSubBlock: SpinalNode<any>, contextNode: SpinalNode<any>, slotIndex?: number): Promise<void>;
    /**
     * Updates a block's configuration.
     */
    updateBlock(blockNode: SpinalNode<any>, updates: {
        algorithmName?: string;
        parameters?: Record<string, unknown>;
        registerAs?: string;
        name?: string;
        foreachOutputBlockId?: string;
    }): void;
    /**
     * Loads the full workflow DAG from the graph, starting from a workflow node.
     * Recursively traverses block relationships to build the in-memory DAG.
     *
     * @param workflowNode - The workflow SpinalNode (input, execution, or worknode resolver)
     * @returns The in-memory DAG representation
     */
    loadWorkflowDAG(workflowNode: SpinalNode<any>): Promise<IWorkflowDAG>;
    /**
     * Recursively collects all blocks reachable from a parent node.
     * Handles deduplication (a block with multiple parents is only processed once).
     */
    private collectBlocks;
    /**
     * Loads the sub-workflow DAG for a FOREACH block.
     */
    private loadForeachSubWorkflow;
    /**
     * Converts a block SpinalNode to its in-memory IWorkflowBlock representation.
     */
    private blockNodeToMemory;
    /**
     * Reads the ordered inputBlockIds from a block node's info.
     */
    private getInputBlockIds;
    /**
     * Gets all block nodes that are direct children of a workflow node.
     */
    getWorkflowBlocks(workflowNode: SpinalNode<any>): Promise<SpinalNode<any>[]>;
    /**
     * Gets the sub-blocks of a FOREACH block.
     */
    getForeachSubBlocks(foreachBlock: SpinalNode<any>): Promise<SpinalNode<any>[]>;
}
