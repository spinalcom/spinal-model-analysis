/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * JSON-serializable descriptor for creating a complete analysis from a single object.
 * This is the input format accepted by AnalysisFactoryService.createFromJSON().
 *
 * Example:
 * ```json
 * {
 *   "contextName": "MyContext",
 *   "analysisName": "Temperature Monitor",
 *   "description": "Monitors temperature on all child sensors",
 *   "anchorNodeId": "abc-123-def",
 *   "worknodeResolver": {
 *     "blocks": [
 *       { "ref": "kids",  "algorithmName": "GET_NODE_CHILDREN", "inputs": ["$node"], "parameters": { "regex": "hasSensor" } }
 *     ]
 *   },
 *   "inputWorkflow": {
 *     "blocks": [
 *       { "ref": "temp",  "algorithmName": "GET_NODE_CHILDREN", "inputs": ["$node"], "parameters": { "regex": "hasEndpoint" } },
 *       { "ref": "setI0", "algorithmName": "SET_INPUT_REGISTER", "inputs": ["temp"], "registerAs": "I0" }
 *     ]
 *   },
 *   "executionWorkflow": {
 *     "blocks": [
 *       { "ref": "i0",   "algorithmName": "FETCH_INPUT_REGISTER", "parameters": { "registerName": "I0" } },
 *       { "ref": "sum",  "algorithmName": "SUM_NUMBERS", "inputs": ["i0"] }
 *     ]
 *   }
 * }
 * ```
 */
export interface IAnalysisConfigJSON {
    /** Name of the analysis context (created if it doesn't exist) */
    contextName: string;

    /** Name for the analysis node */
    analysisName: string;

    /** Optional description */
    description?: string;

    /**
     * The SpinalNode server_id or ID of the node to link as the anchor target.
     * This is the starting node that the worknode resolver will operate on.
     */
    anchorNodeId?: string;

    /** Worknode resolver workflow (optional — if omitted, defaults to working on anchor itself) */
    worknodeResolver?: IWorkflowConfigJSON;

    /** Input workflow (optional — if omitted, no input registers are set) */
    inputWorkflow?: IWorkflowConfigJSON;

    /** Execution workflow (optional — if omitted, nothing is executed) */
    executionWorkflow?: IWorkflowConfigJSON;
}

/**
 * JSON descriptor for a single workflow DAG (used for worknodeResolver, inputWorkflow, executionWorkflow).
 */
export interface IWorkflowConfigJSON {
    blocks: IBlockConfigJSON[];
}

/**
 * JSON descriptor for a single block within a workflow.
 *
 * Uses string `ref` references instead of SpinalNode IDs for inputs,
 * since IDs don't exist yet at definition time.
 */
export interface IBlockConfigJSON {
    /**
     * Local reference name for this block within the workflow definition.
     * Used by other blocks in their `inputs` array to reference this block's output.
     * Not stored in the graph — only used during the creation process.
     */
    ref: string;

    /** Algorithm name from the AlgorithmRegistry */
    algorithmName: string;

    /** Static parameters for the algorithm */
    parameters?: Record<string, unknown>;

    /**
     * Ordered list of refs this block depends on.
     * Position in the array = input slot index.
     * e.g., ["blockA", "blockB"] means inputs[0] = blockA output, inputs[1] = blockB output
     *
     * Special refs:
     * - '$node': references the implicit work node (anchor target / current work node)
     * - '$item': (inside FOREACH subWorkflow only) references the current iteration element
     */
    inputs?: string[];

    /**
     * Register the output as a named variable (for input workflow).
     * e.g., "I0", "I1"
     */
    registerAs?: string;

    /** Optional display name (defaults to algorithmName) */
    name?: string;

    /**
     * For FOREACH blocks: defines the sub-workflow to execute per element.
     */
    subWorkflow?: {
        blocks: IBlockConfigJSON[];
        /** The ref of the block whose output is the sub-workflow result */
        outputRef: string;
    };
}
