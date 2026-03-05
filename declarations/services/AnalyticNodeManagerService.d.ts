import { SpinalNode } from 'spinal-env-viewer-graph-service';
export default class AnalyticNodeManagerService {
    constructor();
    /**
     * Retrieves and returns all contexts
     * handled by this service (type analysisContext)
     * @return {*}  {SpinalNode<any>[]}
     * @memberof AnalyticService
     */
    getContexts(): SpinalNode<any>[];
    /**
     * This method use the context name to find and return the info of that context. If the context does not exist, it returns undefined.
     * If multiple contexts have the same name, it returns the first one.
     * @param {string} contextName
     * @return {*}  {(SpinalNode<any> | undefined)}
     * @memberof AnalyticService
     */
    getContext(contextName: string): SpinalNode<any> | undefined;
    /**
     * This method creates a new context and returns the info of the newly created context.
     * If the context already exists (same name), it just returns the info of that context instead of creating a new one.
     * @param {string} contextName
     * @return {*}  {Promise<SpinalNode<any>>}
     * @memberof AnalyticService
     */
    createContext(contextName: string): Promise<SpinalNode<any>>;
    getContextOfAnalytic(analyticNode: SpinalNode<any>): SpinalNode<any>;
    /**
     * Adds a new analysis node, also adds the mandatory children nodes of the analysis node, and links the analysis node to the specified context.
     * @async
     * @param {IAnalytic} analysisNodeInfo - The information for the new analytic to add.
     * @param {string} contextId - The ID of the context in which to add the analytic.
     * @returns {Promise<SpinalNode<any>>} A Promise that resolves to the newly created analytic info.
     * @memberof AnalyticService
     */
    addAnalysisNode(analysisNodeName: string, analysisNodeDescription: string, contextNode: SpinalNode<any>): Promise<SpinalNode<any>>;
    getAnalysisNodesByContextName(contextName: string): Promise<SpinalNode<any>[]>;
    getAnalysisNode(contextName: string, analyticName: string): Promise<SpinalNode<any> | undefined>;
    linkNodeToAnchorNode(anchorNode: SpinalNode<any>, nodeToLink: SpinalNode<any>, contextNode: SpinalNode<any>): Promise<void>;
    private removeChild;
    safeDeleteNode(node: SpinalNode<any>, shouldDeleteChildren?: boolean): Promise<void>;
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
