import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { ISubWorkflowSlot } from '../constants/analysisWorkflowBlock';
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
 * - Container blocks (FOREACH / FILTER, IF) hold their sub-workflow blocks as children via
 *   dedicated relations — one per sub-workflow slot (see constants/analysisWorkflowBlock)
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
        foreachItemRef?: string;
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
        foreachItemRef?: string;
    }): SpinalNode<any>;
    /**
     * Creates a sub-block inside a container block's sub-workflow slot (FOREACH / FILTER
     * iteration body, IF then / else branch). Sub-blocks form a mini-DAG under the container,
     * hanging off it through the slot's dedicated relation.
     */
    createSubBlock(containerBlock: SpinalNode<any>, contextNode: SpinalNode<any>, slot: ISubWorkflowSlot, algorithmName: string, parameters?: Record<string, unknown>, options?: {
        name?: string;
        registerAs?: string;
    }): Promise<SpinalNode<any>>;
    /** Creates a sub-block in a FOREACH / FILTER block's iteration body. */
    createForeachSubBlock(foreachBlock: SpinalNode<any>, contextNode: SpinalNode<any>, algorithmName: string, parameters?: Record<string, unknown>, options?: {
        name?: string;
        registerAs?: string;
    }): Promise<SpinalNode<any>>;
    /** Creates a sub-block in an IF block's then or else branch. */
    createIfSubBlock(ifBlock: SpinalNode<any>, contextNode: SpinalNode<any>, algorithmName: string, parameters: Record<string, unknown> | undefined, branch: 'then' | 'else', options?: {
        name?: string;
        registerAs?: string;
    }): Promise<SpinalNode<any>>;
    /** Builds a block SpinalNode from its config (attached to nothing yet). */
    private instantiateBlock;
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
     * Adds only the graph edge sourceBlock → dependentBlock, leaving inputBlockIds untouched.
     * Both blocks must belong to the same workflow scope: loadWorkflowDAG pulls every edge
     * target into the DAG it is loading, so an edge across scopes would leak a nested block
     * into an outer DAG.
     */
    addEdge(sourceBlock: SpinalNode<any>, dependentBlock: SpinalNode<any>, contextNode: SpinalNode<any>): Promise<void>;
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
        foreachItemRef?: string;
        /** JSON-stringified IConcurrencyConfig for a FOREACH block (dispatch strategy). */
        foreachConcurrency?: string;
        ifThenOutputBlockId?: string;
        ifElseOutputBlockId?: string;
        [key: string]: unknown;
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
     * Loads a container block's sub-workflows onto its in-memory block: the iteration body
     * of a FOREACH / FILTER, or the then / else branches of an IF. A no-op for other blocks.
     */
    private attachSubWorkflows;
    /**
     * Loads one sub-workflow slot of a container block: its root sub-blocks (via the slot's
     * relation), everything reachable from them, and the designated output block. Returns
     * undefined when the slot holds no sub-blocks (an IF branch that was not defined).
     */
    private loadSubWorkflow;
    /**
     * Converts a block SpinalNode to its in-memory IWorkflowBlock representation.
     */
    private blockNodeToMemory;
    /**
     * Reads the ordered inputBlockIds from a block node's info.
     */
    private getInputBlockIds;
    /**
     * Reads the order-only block IDs from a block node's info.
     * Returns [] for blocks created before this field existed.
     */
    private getOrderBlockIds;
    /**
     * Sets the order-only block IDs on a block node (order-only dependencies that
     * gate execution but pass no data). Adds the info attribute if missing, so it
     * also works on blocks created before this field existed.
     */
    setOrderBlockIds(blockNode: SpinalNode<any>, ids: string[]): void;
    /**
     * Gets all block nodes that are direct children of a workflow node.
     */
    getWorkflowBlocks(workflowNode: SpinalNode<any>): Promise<SpinalNode<any>[]>;
    /**
     * Gets the sub-blocks of a FOREACH block.
     */
    getForeachSubBlocks(foreachBlock: SpinalNode<any>): Promise<SpinalNode<any>[]>;
}
