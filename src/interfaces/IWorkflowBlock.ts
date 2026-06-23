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
     * Order-only dependencies: block IDs that must execute before this block but
     * whose outputs are NOT passed to it. Used to sequence side-effecting blocks
     * (declared via `after` in the JSON config). These widen the topological sort
     * but are ignored by input resolution. Always present (defaults to []).
     */
    orderBlockIds: string[];

    /**
     * Optional: register the output of this block as a named variable.
     * Used in the input workflow to define variables like 'I0', 'I1'
     * that can be read later in the execution workflow via FETCH_INPUT_REGISTER.
     */
    registerAs?: string;

    /**
     * For FOREACH / MAP blocks only.
     * The name by which the current iteration element is referenced in the sub-workflow.
     * At runtime, the element is injected under a virtual ID derived from this name.
     */
    foreachItemRef?: string;

    /**
     * For FOREACH / MAP blocks only.
     * Defines the sub-workflow DAG to execute for each element of the input array.
     */
    subWorkflow?: ISubWorkflow;

    /**
     * For IF blocks only.
     * Sub-workflow executed when the boolean predicate (inputs[0]) is true.
     */
    thenWorkflow?: ISubWorkflow;

    /**
     * For IF blocks only.
     * Sub-workflow executed when the boolean predicate (inputs[0]) is false.
     * If omitted and predicate is false, IF block output is undefined.
     */
    elseWorkflow?: ISubWorkflow;
}

/**
 * A sub-workflow embedded inside a FOREACH or IF block.
 *
 * For FOREACH: at runtime, the current iteration element is injected under
 * a virtual ID derived from the FOREACH's foreachItemRef. Sub-workflow blocks
 * reference it by the itemRef name in their inputs.
 *
 * For nested FOREACH, parent item refs are propagated to inner sub-contexts,
 * so inner blocks can reference any ancestor's iteration element.
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
