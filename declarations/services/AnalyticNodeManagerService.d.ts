import { SpinalNode, SpinalGraph, SpinalContext } from 'spinal-env-viewer-graph-service';
import { IAnalysisConfigJSON } from '../interfaces/IAnalysisConfigJSON';
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
    addAnalysisNode(analysisNodeName: string, analysisNodeDescription: string, contextNode: SpinalNode<any>): Promise<SpinalNode<any>>;
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
     * - inputs[0]: always the boolean predicate
     * - inputs[1]: only real if a sub-workflow block uses $item
     * - inputs[2+]: always synthetic
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
