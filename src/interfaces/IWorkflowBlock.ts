/**
 * In-memory representation of a workflow block for the DAG execution engine.
 * Each block wraps an algorithm and defines its ordered dependencies (inputs from other blocks).
 *
 * Stored in the graph as a SpinalNode:
 * - The block's dependency blocks are its parents (via PARENT_TO_WORKFLOW_BLOCK_RELATION)
 * - The topmost (root) blocks have the workflow node as parent
 */
export interface IWorkflowBlock {
    /** The SpinalNode ID of this block */
    id: string;

    /**
     * Human-readable name for this block.
     * Set from the `ref` in the JSON config during creation.
     * Used for logging and debugging.
     */
    name: string;

    /** The algorithm name from the AlgorithmRegistry */
    algorithmName: string;

    /** Static parameters passed to the algorithm */
    parameters: Record<string, unknown>;

    /**
     * Ordered array of block IDs whose outputs feed into this block's inputs.
     * Position in the array = input slot index.
     * e.g., ['blockA_id', 'blockB_id'] means inputs[0] = A's output, inputs[1] = B's output.
     */
    inputBlockIds: string[];

    /**
     * Optional: register the output of this block as a named variable.
     * Used in the input workflow to define variables like 'I0', 'I1'
     * that can be read later in the execution workflow via FETCH_INPUT_REGISTER.
     */
    registerAs?: string;

    /**
     * For FOREACH / MAP blocks only.
     * Defines the sub-workflow DAG to execute for each element of the input array.
     */
    subWorkflow?: ISubWorkflow;
}

/**
 * A sub-workflow embedded inside a FOREACH block.
 * Must contain exactly one block with algorithmName === 'ELEMENT'
 * which acts as the source / injection point for the current array element.
 */
export interface ISubWorkflow {
    /** All blocks in the sub-workflow */
    blocks: IWorkflowBlock[];

    /** The ID of the block whose output represents the sub-workflow's result */
    outputBlockId: string;
}

/**
 * Represents the complete in-memory DAG for a workflow
 * (worknode resolver, input workflow, or execution workflow).
 */
export interface IWorkflowDAG {
    blocks: IWorkflowBlock[];
}
