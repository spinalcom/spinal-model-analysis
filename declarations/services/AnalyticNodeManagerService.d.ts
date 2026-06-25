import { SpinalNode, SpinalGraph, SpinalContext } from 'spinal-env-viewer-graph-service';
import { IAnalysisConfigJSON, IConcurrencyConfig, AnalysisStatus } from '../interfaces/IAnalysisConfigJSON';
export default class AnalyticNodeManagerService {
    constructor();
    /**
     * Retrieves and returns all contexts
     * handled by this service (type analysisContext)
     * @return {*}  {SpinalNode<any>[]}
     * @memberof AnalyticService
     */
    getContexts(graph: SpinalGraph<any>): Promise<SpinalNode<any>[]>;
    /**
     * This method use the context name to find and return the info of that context. If the context does not exist, it returns undefined.
     * If multiple contexts have the same name, it returns the first one.
     * @param {string} contextName
     * @return {*}  {(SpinalNode<any> | undefined)}
     * @memberof AnalyticService
     */
    getContext(contextName: string, graph: SpinalGraph<any>): Promise<SpinalNode<any> | undefined>;
    /**
     * This method creates a new context and returns the info of the newly created context.
     * If the context already exists (same name), it just returns the info of that context instead of creating a new one.
     * @param {string} contextName
     * @return {*}  {Promise<SpinalNode<any>>}
     * @memberof AnalyticService
     */
    createContext(contextName: string, graph: SpinalGraph<any>): Promise<SpinalNode<any>>;
    getContextOfAnalytic(analyticNode: SpinalNode<any>): Promise<SpinalNode<any>>;
    /**
     * Adds a new analysis node, also adds the mandatory children nodes of the analysis node, and links the analysis node to the specified context.
     * @async
     * @param {IAnalytic} analysisNodeInfo - The information for the new analytic to add.
     * @param {string} contextId - The ID of the context in which to add the analytic.
     * @returns {Promise<SpinalNode<any>>} A Promise that resolves to the newly created analytic info.
     * @memberof AnalyticService
     */
    addAnalysisNode(analysisNodeName: string, analysisNodeDescription: string, contextNode: SpinalNode<any>, concurrency?: IConcurrencyConfig, status?: AnalysisStatus): Promise<SpinalNode<any>>;
    /**
     * Creates the mandatory sub-node structure under an analysis node (execution /
     * input / output workflows, trigger, worknode resolver, anchor). Used both when
     * first creating an analysis and when rebuilding it during an update.
     */
    addMandatorySubNodes(analysisNode: SpinalNode<any>, contextNode: SpinalNode<any>): Promise<void>;
    /**
     * Wipes everything under an analysis node — all mandatory sub-nodes (workflows,
     * trigger, anchor) and their contents — while keeping the analysis node itself.
     * This is `deleteAnalysisNode` minus the deletion of the analysis node, and is
     * used by the update flow to rebuild the structure from a fresh config.
     *
     * Externally-anchored target nodes are detached (not removed): like delete, only
     * the anchor *relation* is dropped so the building/digital-twin nodes survive.
     */
    resetAnalysisSubNodes(analysisNode: SpinalNode<any>): Promise<void>;
    /**
     * Normalizes a (possibly partial / undefined) concurrency config into a complete,
     * validated one, applying defaults. Used both when storing on a node and when
     * reading back, so callers always get a concrete `{ mode, limit }`.
     */
    normalizeConcurrency(concurrency?: IConcurrencyConfig): Required<IConcurrencyConfig>;
    /**
     * Reads the work-node concurrency config from the analysis node's documentation
     * attributes (category {@link CONCURRENCY_CATEGORY}). Falls back to
     * {@link DEFAULT_CONCURRENCY} for any missing/malformed field (e.g. analyses
     * created before this feature existed, or a hand-edited invalid value).
     */
    getConcurrencyConfig(analysisNode: SpinalNode<any>): Promise<Required<IConcurrencyConfig>>;
    /**
     * Writes the work-node concurrency config as documentation attributes on the
     * analysis node (creating the category/attributes on first write). Normalizes the
     * input first so stored values are always valid.
     */
    setConcurrencyConfig(analysisNode: SpinalNode<any>, concurrency?: IConcurrencyConfig): Promise<void>;
    /**
     * Coerces an arbitrary value into a valid {@link AnalysisStatus}. Anything that
     * isn't exactly "Active" falls back to {@link DEFAULT_ANALYSIS_STATUS} (Inactive),
     * so a missing/typo'd/hand-edited value never accidentally activates an analysis.
     */
    normalizeStatus(status?: unknown): AnalysisStatus;
    /**
     * Reads the lifecycle status from the analysis node's documentation attributes.
     * Falls back to {@link DEFAULT_ANALYSIS_STATUS} (Inactive) when missing or invalid
     * — including analyses created before this feature existed, which are therefore
     * treated as parked until explicitly activated.
     */
    getStatus(analysisNode: SpinalNode<any>): Promise<AnalysisStatus>;
    /**
     * Convenience predicate: true when the analysis is Active (the organ should run it).
     */
    isAnalysisActive(analysisNode: SpinalNode<any>): Promise<boolean>;
    /**
     * Writes the lifecycle status as a documentation attribute on the analysis node
     * (creating the category/attribute on first write). Normalizes first so the stored
     * value is always a valid status.
     */
    setStatus(analysisNode: SpinalNode<any>, status?: AnalysisStatus): Promise<void>;
    /**
     * Reads the last-update revision (ms timestamp) from the analysis node's info.
     * Returns 0 when never stamped (e.g. analyses created before this feature). The
     * organ uses this to detect when an analysis was updated and must be re-assessed.
     */
    getLastUpdate(analysisNode: SpinalNode<any>): number;
    /**
     * Stamps the analysis node with a new last-update revision (defaults to now).
     * Stored in node.info (internal bookkeeping, not a panel attribute). Bumped on
     * every successful update so the organ can tell the structure changed.
     */
    setLastUpdate(analysisNode: SpinalNode<any>, ts?: number): void;
    getAnalysisNodesByContextName(contextName: string, graph: SpinalGraph<any>): Promise<SpinalNode<any>[]>;
    getAnalysisNodesByContextNode(contextNode: SpinalContext<any>): Promise<SpinalNode<any>[]>;
    getAnalysisNodeByContextNode(contextNode: SpinalContext<any>, analysisNodeName: string): Promise<SpinalNode<any> | undefined>;
    getAnalysisNode(contextName: string, analyticName: string, graph: SpinalGraph<any>): Promise<SpinalNode<any> | undefined>;
    /**
     * Extracts a complete JSON descriptor from an existing analysis node.
     * The returned object conforms to IAnalysisConfigJSON and can be fed
     * back into AnalysisFactoryService.createFromJSON() to recreate the analysis.
     *
     * @param analysisNode - The SpinalNode of type analysisNode
     * @returns A round-trippable IAnalysisConfigJSON
     */
    getAnalyticDetails(analysisNode: SpinalNode<any>): Promise<IAnalysisConfigJSON>;
    /**
     * Reads the trigger configurations stored on the analysis trigger node.
     * Returns a clean, round-trippable array of ITriggerConfigJSON (undefined
     * fields stripped). Returns [] when no triggers are configured.
     */
    private getTriggerConfigs;
    /**
     * Converts an array of in-memory workflow blocks back to a JSON workflow config.
     * Blocks are topologically sorted so dependencies appear before dependents.
     */
    private dagToWorkflowConfig;
    /**
     * Converts a sub-workflow (FOREACH / IF branch) back to its JSON config shape.
     * @param parentIdToRef - id→ref map of the parent workflow, used to resolve parent refs in IF branches
     */
    private subWorkflowToConfig;
    /**
     * Converts a single IWorkflowBlock to an IBlockConfigJSON.
     * For IF blocks, strips synthetic inputBlockIds that were only added for topological ordering.
     */
    private blockToConfig;
    /**
     * Converts an inputBlockId back to its ref string for JSON output.
     */
    private idToInputRef;
    /**
     * Builds a map of block ID → ref name from an array of blocks.
     * Uses block.name as the ref (which was set from the original ref during creation).
     * Disambiguates duplicate names by appending a suffix.
     */
    private buildIdToRefMap;
    /**
     * Topologically sorts blocks so that dependencies come before dependents.
     * Uses DFS post-order (Kahn-like via recursion).
     */
    private topologicalSort;
    /**
     * Determines how many "real" inputs an IF block has (excluding synthetic
     * parent-ref dependencies appended by buildIfSubWorkflow for topological ordering).
     *
     * IF only has 1 real input: the boolean predicate (inputs[0]).
     * Everything else is synthetic for topological ordering.
     */
    private getIfRealInputCount;
    linkNodeToAnchorNode(anchorNode: SpinalNode<any>, nodeToLink: SpinalNode<any>, contextNode: SpinalNode<any>): Promise<void>;
    removeLinkToAnchorNode(anchorNode: SpinalNode<any>, anchoredNode: SpinalNode<any>): Promise<void>;
    private removeChild;
    safeDeleteNode(node: SpinalNode<any>, shouldDeleteChildren?: boolean): Promise<void>;
    deleteAnalysisContext(contextNode: SpinalNode<any>): Promise<void>;
    deleteAnalysisNode(analysisNode: SpinalNode<any>): Promise<void>;
    addWorkflowNodeToAnalysisNode(analysisNode: SpinalNode<any>, contextNode: SpinalNode<any>): Promise<SpinalNode<any>>;
    private addInputNodeToAnalysisNode;
    private addOutputNodeToAnalysisNode;
    private addTriggerNodeToAnalysisNode;
    private addWorknodeResolverNodeToAnalysisNode;
    addAnchorNodeToAnalysisNode(analysisNode: SpinalNode<any>, contextNode: SpinalNode<any>): Promise<SpinalNode<any>>;
    getAnalysisExecutionWorkflowNode(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>>;
    getAnalysisInputNode(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>>;
    getAnalysisOutputNode(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>>;
    getAnalysisTriggerNode(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>>;
    getAnalysisWorknodeResolverNode(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>>;
    getAnalysisAnchorNodeNode(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>>;
    reverseChildrenOrder(node: SpinalNode<any>, relationName: string): Promise<void>;
}
