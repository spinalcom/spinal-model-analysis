import { SpinalNode, SpinalGraph } from 'spinal-env-viewer-graph-service';
import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import WorkflowBlockManagerService from './WorkflowBlockManagerService';
import { IAnalysisConfigJSON } from '../interfaces/IAnalysisConfigJSON';
/**
 * Factory service for creating complete analysis configurations from a JSON descriptor.
 *
 * Takes an IAnalysisConfigJSON object and creates:
 * - The analysis context (if it doesn't exist)
 * - The analysis node with all mandatory sub-nodes
 * - Links the anchor to a target node
 * - Creates all workflow blocks (worknode resolver, input, execution) with proper DAG wiring
 *
 * Usage:
 * ```typescript
 * const factory = new AnalysisFactoryService(nodeManager, blockManager);
 * const analysisNode = await factory.createFromJSON(config);
 * ```
 */
export default class AnalysisFactoryService {
    private readonly nodeManager;
    private readonly blockManager;
    constructor(nodeManager: AnalyticNodeManagerService, blockManager: WorkflowBlockManagerService);
    /**
     * Validates a JSON config without touching the database.
     * Returns an array of error messages. Empty array = valid config.
     *
     * Call this before createFromJSON to avoid partial writes on invalid configs.
     */
    validateConfig(config: IAnalysisConfigJSON): string[];
    /**
     * Validates the optional concurrency config. Mode must be one of the known
     * strategies; for BOUNDED, an explicit limit (if given) must be a positive integer.
     */
    private validateConcurrency;
    /**
     * Creates a complete analysis from a JSON configuration.
     * Validates the config first — throws if invalid to prevent partial writes.
     *
     * @param config - The JSON analysis descriptor
     * @returns The created analysis SpinalNode
     */
    createFromJSON(config: IAnalysisConfigJSON, graph: SpinalGraph<any>): Promise<SpinalNode<any>>;
    /**
     * Updates an existing analysis in place from a full JSON config (a PUT-style
     * full replace). The analysis node keeps its id/server_id; everything below it
     * is rebuilt from the config:
     *
     * - **name / description / concurrency / status** — set directly on the node.
     * - **anchor / workflows / triggers** — the entire sub-node structure is wiped
     *   and recreated from the config (the workflow DAGs are far simpler to rebuild
     *   than to diff-and-patch).
     *
     * Because this is a full replace, optional fields that are omitted revert to
     * their defaults (concurrency → BOUNDED/10, status → Inactive, no triggers).
     * Callers that want to preserve those should read the current config (via
     * getAnalyticDetails) and send it back with their changes applied.
     *
     * @param analysisNode - The existing analysis node to update
     * @param config - The new full configuration
     * @returns The same analysis node, updated
     */
    updateFromJSON(analysisNode: SpinalNode<any>, config: IAnalysisConfigJSON): Promise<SpinalNode<any>>;
    /**
     * Links the anchor target, builds the three workflow DAGs, and stores the
     * trigger configs from a config object onto an analysis node whose mandatory
     * sub-nodes already exist. Shared by createFromJSON and updateFromJSON.
     */
    private populateAnalysis;
    /**
     * Links the analysis anchor node to the target node in the database.
     */
    private linkAnchorTarget;
    /**
     * Builds a complete workflow DAG from the JSON block definitions.
     *
     * Strategy:
     * 1. Determine which blocks are roots (no inputs, or only '$node') vs dependents
     * 2. Create root blocks as children of the workflow node
     * 3. Create dependent blocks as orphans
     * 4. Wire dependencies — dependent blocks become children of their source blocks
     *
     * The special ref '$node' maps to WORK_NODE_RESERVED_ID and does NOT require
     * a SpinalNode — it's automatically available at execution time.
     *
     * @param workflowNode - The parent workflow SpinalNode (resolver, input, or execution)
     * @param contextNode - The analysis context
     * @param workflowConfig - The JSON workflow descriptor with block definitions
     */
    private buildWorkflow;
    /**
     * Resolves the order-only dependencies (`after`) of each block to block IDs and
     * stores them. Order-only deps gate execution but pass no data, so — unlike inputs —
     * they add no graph edge and no input slot; they only widen the topological sort.
     */
    private wireAfter;
    /**
     * Resolves a single `after` ref to a block ID (or virtual ID for $node / itemRefs).
     * Virtual / parent IDs are always available before the block runs, so when they
     * fall outside the current DAG the topological sort simply skips them (a no-op).
     */
    private resolveOrderRef;
    /**
     * Builds the sub-workflow for a FOREACH block.
     *
     * The FOREACH's `itemRef` is the name by which the iteration element is referenced.
     * Sub-blocks can reference it by name in their inputs.
     * `parentRefToNode` provides access to blocks defined in the parent workflow scope.
     */
    private buildForeachSubWorkflow;
    /**
     * Builds a sub-workflow for an IF block (then or else branch).
     *
     * IF sub-workflows can reference:
     * - Any FOREACH itemRef (resolved to virtual ID — inherited at runtime)
     * - '$node': the implicit work node
     * - Any ref from the parent workflow (resolved as a virtual input)
     * - Other sub-workflow block refs
     */
    private buildIfSubWorkflow;
    /**
     * Checks if a source ref matches any known FOREACH itemRef.
     * Returns the virtual ID if it matches, otherwise undefined.
     */
    private resolveItemRef;
    /**
     * Validates a workflow config (top-level: worknodeResolver, inputWorkflow, executionWorkflow).
     */
    private validateWorkflow;
    /**
     * Validates a single block definition.
     */
    private validateBlock;
    /**
     * Validates a sub-workflow (FOREACH subWorkflow, IF thenWorkflow/elseWorkflow).
     * Sub-blocks can reference: local refs, parent refs, and known item refs.
     */
    private validateSubWorkflow;
    /**
     * Validates trigger configurations.
     */
    private validateTriggers;
    /**
     * Stores trigger configurations as an attribute on the analysis trigger node.
     */
    private storeTriggerConfig;
}
