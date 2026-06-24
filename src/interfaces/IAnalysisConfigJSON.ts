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

    /** Server id of the analysis node */
    analysisId?: number;

    /** Optional description */
    description?: string;

    /**
     * The SpinalNode server_id or ID of the node to link as the anchor target.
     * This is the starting node that the worknode resolver will operate on.
     * If the static ID is provided, make sure SpinalGraphService added it
     */
    anchorNodeId?: string;

    /** Worknode resolver workflow (optional — if omitted, defaults to working on anchor itself) */
    worknodeResolver?: IWorkflowConfigJSON;

    /** Input workflow (optional — if omitted, no input registers are set) */
    inputWorkflow?: IWorkflowConfigJSON;

    /** Execution workflow (optional — if omitted, nothing is executed) */
    executionWorkflow?: IWorkflowConfigJSON;

    /** Trigger configurations (optional — defines how the analysis is started) */
    triggers?: ITriggerConfigJSON[];

    /**
     * How the resolved work nodes are dispatched per execution (optional).
     * Defaults to BOUNDED parallel with a limit of 10 when omitted.
     */
    concurrency?: IConcurrencyConfig;

    /**
     * Lifecycle status of the analysis (optional). Controls whether the analysis
     * organ starts its triggers / does COV binding for this analysis.
     * - `Active`   — the organ runs it (starts triggers, binds COVs).
     * - `Inactive` — the organ leaves it parked (stored but not running).
     * Defaults to `Inactive` when omitted, so analytics can be seeded into the
     * database without running until explicitly activated.
     */
    status?: AnalysisStatus;
}

/**
 * Lifecycle status of an analysis, gating whether the analysis organ runs it.
 *
 * - `Active`   — the organ starts its triggers and performs COV binding.
 * - `Inactive` — the organ ignores it; it sits in the database without running.
 */
export type AnalysisStatus = 'Active' | 'Inactive';

/**
 * Strategy for executing an analysis across its resolved work nodes.
 *
 * - `BOUNDED`    — run work nodes in parallel, but never more than `limit` at once.
 * - `FULL`       — run every work node in parallel at once (no cap). Fastest for
 *                  small sets; can spike external APIs / DB / memory on large sets.
 * - `SEQUENTIAL` — run one work node at a time (previous behavior). Predictable and
 *                  gentle on resources, but slow when blocks wait (DELAY, CURL, timeseries).
 */
export type ConcurrencyMode = 'BOUNDED' | 'FULL' | 'SEQUENTIAL';

/**
 * JSON descriptor for the work-node concurrency strategy of an analysis.
 */
export interface IConcurrencyConfig {
    /** Dispatch strategy. Defaults to `BOUNDED`. */
    mode: ConcurrencyMode;

    /**
     * For `BOUNDED` mode only: maximum number of work nodes executing in parallel.
     * Ignored for `FULL` and `SEQUENTIAL`. Must be a positive integer. Defaults to 10.
     */
    limit?: number;
}

/**
 * JSON descriptor for a single trigger configuration.
 */
export interface ITriggerConfigJSON {
    /** Optional user-defined trigger identifier (e.g., "Trigger1") */
    id?: string;

    /** The type of trigger */
    type: 'INTERVAL_TIME' | 'CRON' | 'COV';

    /**
     * For INTERVAL_TIME triggers only: interval in milliseconds.
     */
    intervalTimeMs?: number;

    /**
     * For CRON triggers only: cron expression string.
     */
    cronExpression?: string;

    /**
     * For COV triggers only: name of the input register to bind on (e.g., I0).
     */
    inputRegister?: string;

    /**
     * For COV triggers only: optional deadband/threshold.
     * Trigger fires when absolute change is strictly greater than this value.
     */
    threshold?: number;
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
     * - Any FOREACH itemRef name: references the iteration element of that FOREACH
     */
    inputs?: string[];

    /**
     * Order-only dependencies: refs of blocks that must run BEFORE this block,
     * without their output being passed in. Use this to sequence side-effecting
     * blocks that don't have a data dependency (e.g. run a READ after a DELAY that
     * doesn't feed it). Data dependencies in `inputs` already imply ordering — only
     * list a ref here when there is no data flow. Accepts the same refs as `inputs`.
     */
    after?: string[];

    /**
     * For FOREACH blocks only.
     * The name by which the current iteration element is referenced inside the sub-workflow.
     * Sub-blocks use this name in their `inputs` array to access the element.
     * In nested FOREACH, each level defines its own itemRef, and inner sub-workflows
     * can reference any ancestor FOREACH's itemRef.
     *
     * e.g., itemRef: "equipment" → sub-blocks use "equipment" in their inputs
     */
    itemRef?: string;

    /**
     * Register the output as a named variable (for input workflow).
     * e.g., "I0", "I1"
     */
    registerAs?: string;

    /** Optional display name (defaults to algorithmName) */
    name?: string;

    /**
     * For FOREACH blocks: defines the sub-workflow to execute per element.
     * Sub-blocks can reference the iteration element using the `itemRef` name.
     */
    subWorkflow?: {
        blocks: IBlockConfigJSON[];
        /** The ref of the block whose output is the sub-workflow result */
        outputRef: string;
    };

    /**
     * For IF blocks: sub-workflow executed when predicate (inputs[0]) is true.
     * IF branches inherit the parent context, including all FOREACH itemRefs.
     */
    thenWorkflow?: {
        blocks: IBlockConfigJSON[];
        /** The ref of the block whose output becomes the IF block's output */
        outputRef: string;
    };

    /**
     * For IF blocks: sub-workflow executed when predicate (inputs[0]) is false.
     * If omitted and predicate is false, the IF block output is undefined.
     */
    elseWorkflow?: {
        blocks: IBlockConfigJSON[];
        /** The ref of the block whose output becomes the IF block's output */
        outputRef: string;
    };
}
