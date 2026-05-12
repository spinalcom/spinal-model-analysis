"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const analysisNode_1 = require("../constants/analysisNode");
const analysisContext_1 = require("../constants/analysisContext");
const analysisAnchor_1 = require("../constants/analysisAnchor");
const analysisExecutionWorkflow_1 = require("../constants/analysisExecutionWorkflow");
const analysisInput_1 = require("../constants/analysisInput");
const analysisOutput_1 = require("../constants/analysisOutput");
const analysisTrigger_1 = require("../constants/analysisTrigger");
const analysisWorknodeResolver_1 = require("../constants/analysisWorknodeResolver");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const version_1 = require("../version");
const WorkflowBlockManagerService_1 = require("./WorkflowBlockManagerService");
const WorkflowExecutionService_1 = require("./WorkflowExecutionService");
class AnalyticNodeManagerService {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }
    // #region CONTEXT
    /**
     * Retrieves and returns all contexts
     * handled by this service (type analysisContext)
     * @return {*}  {SpinalNode<any>[]}
     * @memberof AnalyticService
     */
    getContexts() {
        const contexts = spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType(analysisContext_1.ANALYSIS_CONTEXT_NODE_TYPE);
        return contexts;
    }
    /**
     * This method use the context name to find and return the info of that context. If the context does not exist, it returns undefined.
     * If multiple contexts have the same name, it returns the first one.
     * @param {string} contextName
     * @return {*}  {(SpinalNode<any> | undefined)}
     * @memberof AnalyticService
     */
    getContext(contextName) {
        const contexts = this.getContexts();
        if (!contexts)
            return undefined;
        return contexts.find((context) => context.getName().get() === contextName);
    }
    /**
     * This method creates a new context and returns the info of the newly created context.
     * If the context already exists (same name), it just returns the info of that context instead of creating a new one.
     * @param {string} contextName
     * @return {*}  {Promise<SpinalNode<any>>}
     * @memberof AnalyticService
     */
    createContext(contextName) {
        return __awaiter(this, void 0, void 0, function* () {
            const alreadyExists = this.getContext(contextName);
            if (alreadyExists) {
                console.error(`Context ${contextName} already exists`);
                return alreadyExists;
            }
            return spinal_env_viewer_graph_service_1.SpinalGraphService.addContext(contextName, analysisContext_1.ANALYSIS_CONTEXT_NODE_TYPE, undefined).then((context) => {
                const contextId = context.getId().get();
                spinal_env_viewer_plugin_documentation_service_1.attributeService.createOrUpdateAttrsAndCategories(context, "metadata", {
                    version: version_1.VERSION
                });
                return context;
            });
        });
    }
    getContextOfAnalytic(analyticNode) {
        if (analyticNode.getType().get() !== analysisNode_1.ANALYSIS_NODE_TYPE) {
            throw new Error('Node is not an analysis node');
        }
        const contexts = this.getContexts();
        const contextId = analyticNode.getContextIds()[0];
        const context = contexts.find(c => c.getId().get() === contextId);
        if (!context) {
            throw new Error('Context not found for analytic node ( should not happen since analysisNode should always be in a context)');
        }
        return context;
    }
    // #endregion CONTEXT
    // #region ANALYSIS
    /**
     * Adds a new analysis node, also adds the mandatory children nodes of the analysis node, and links the analysis node to the specified context.
     * @async
     * @param {IAnalytic} analysisNodeInfo - The information for the new analytic to add.
     * @param {string} contextId - The ID of the context in which to add the analytic.
     * @returns {Promise<SpinalNode<any>>} A Promise that resolves to the newly created analytic info.
     * @memberof AnalyticService
     */
    addAnalysisNode(analysisNodeName, analysisNodeDescription, contextNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const analysisNodeInfo = {
                name: analysisNodeName,
                description: analysisNodeDescription,
                type: analysisNode_1.ANALYSIS_NODE_TYPE,
            };
            const analysisNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(analysisNodeInfo);
            const analysisNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(analysisNodeId);
            if (!analysisNode)
                throw new Error('Failed to create analytic node');
            yield contextNode.addChildInContext(analysisNode, analysisNode_1.ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE, contextNode);
            // Add mandatory nodes
            yield this.addWorkflowNodeToAnalysisNode(analysisNode, contextNode);
            yield this.addInputNodeToAnalysisNode(analysisNode, contextNode);
            yield this.addOutputNodeToAnalysisNode(analysisNode, contextNode);
            yield this.addTriggerNodeToAnalysisNode(analysisNode, contextNode);
            yield this.addWorknodeResolverNodeToAnalysisNode(analysisNode, contextNode);
            yield this.addAnchorNodeToAnalysisNode(analysisNode, contextNode);
            return analysisNode;
        });
    }
    getAnalysisNodesByContextName(contextName) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = this.getContext(contextName);
            if (!context)
                throw new Error(`Context with name ${contextName} not found`);
            const analysisNodes = yield context.getChildren(analysisNode_1.ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION);
            return analysisNodes;
        });
    }
    getAnalysisNode(contextName, analyticName) {
        return __awaiter(this, void 0, void 0, function* () {
            const analysisNodes = yield this.getAnalysisNodesByContextName(contextName);
            const analysisNode = analysisNodes.find((node) => node.getName().get() === analyticName);
            if (!analysisNode)
                return undefined;
            return analysisNode;
        });
    }
    // #endregion ANALYSIS
    // #region ANALYSIS DETAILS
    /**
     * Extracts a complete JSON descriptor from an existing analysis node.
     * The returned object conforms to IAnalysisConfigJSON and can be fed
     * back into AnalysisFactoryService.createFromJSON() to recreate the analysis.
     *
     * @param analysisNode - The SpinalNode of type analysisNode
     * @returns A round-trippable IAnalysisConfigJSON
     */
    getAnalyticDetails(analysisNode) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const blockManager = new WorkflowBlockManagerService_1.default();
            const context = this.getContextOfAnalytic(analysisNode);
            // ── Anchor ──
            const anchorNode = yield this.getAnalysisAnchorNodeNode(analysisNode);
            const anchorTargets = yield anchorNode.getChildren(analysisAnchor_1.ANCHOR_NODE_TO_LINKED_NODE_RELATION);
            const anchorNodeId = anchorTargets.length > 0
                ? anchorTargets[0].getId().get()
                : undefined;
            // ── Workflows ──
            const resolverNode = yield this.getAnalysisWorknodeResolverNode(analysisNode);
            const inputNode = yield this.getAnalysisInputNode(analysisNode);
            const executionNode = yield this.getAnalysisExecutionWorkflowNode(analysisNode);
            const resolverDAG = yield blockManager.loadWorkflowDAG(resolverNode);
            const inputDAG = yield blockManager.loadWorkflowDAG(inputNode);
            const executionDAG = yield blockManager.loadWorkflowDAG(executionNode);
            // ── Build result ──
            const result = {
                contextName: context.getName().get(),
                analysisName: analysisNode.getName().get(),
                description: (_b = (_a = analysisNode.info.description) === null || _a === void 0 ? void 0 : _a.get()) !== null && _b !== void 0 ? _b : '',
            };
            if (anchorNodeId)
                result.anchorNodeId = anchorNodeId;
            if (resolverDAG.blocks.length > 0)
                result.worknodeResolver = this.dagToWorkflowConfig(resolverDAG.blocks);
            if (inputDAG.blocks.length > 0)
                result.inputWorkflow = this.dagToWorkflowConfig(inputDAG.blocks);
            if (executionDAG.blocks.length > 0)
                result.executionWorkflow = this.dagToWorkflowConfig(executionDAG.blocks);
            return result;
        });
    }
    // #endregion ANALYSIS DETAILS
    // #region DAG → JSON CONVERSION
    /**
     * Converts an array of in-memory workflow blocks back to a JSON workflow config.
     */
    dagToWorkflowConfig(blocks) {
        const idToRef = this.buildIdToRefMap(blocks);
        return {
            blocks: blocks.map((b) => this.blockToConfig(b, idToRef)),
        };
    }
    /**
     * Converts a sub-workflow (FOREACH / IF branch) back to its JSON config shape.
     * @param parentIdToRef - id→ref map of the parent workflow, used to resolve parent refs in IF branches
     */
    subWorkflowToConfig(sub, parentIdToRef) {
        var _a;
        const subIdToRef = this.buildIdToRefMap(sub.blocks);
        // Merge parent refs so IF sub-block inputs referencing parent blocks resolve correctly
        const mergedIdToRef = new Map([...parentIdToRef, ...subIdToRef]);
        return {
            blocks: sub.blocks.map((b) => this.blockToConfig(b, mergedIdToRef, parentIdToRef)),
            outputRef: (_a = subIdToRef.get(sub.outputBlockId)) !== null && _a !== void 0 ? _a : sub.outputBlockId,
        };
    }
    /**
     * Converts a single IWorkflowBlock to an IBlockConfigJSON.
     */
    blockToConfig(block, idToRef, parentIdToRef) {
        var _a;
        const config = {
            ref: (_a = idToRef.get(block.id)) !== null && _a !== void 0 ? _a : block.name,
            algorithmName: block.algorithmName,
        };
        if (Object.keys(block.parameters).length > 0) {
            config.parameters = block.parameters;
        }
        if (block.inputBlockIds.length > 0) {
            config.inputs = block.inputBlockIds.map((id) => {
                var _a, _b;
                if (id === WorkflowExecutionService_1.WORK_NODE_RESERVED_ID)
                    return '$node';
                if (id === WorkflowExecutionService_1.FOREACH_ELEMENT_RESERVED_ID)
                    return '$item';
                return (_b = (_a = idToRef.get(id)) !== null && _a !== void 0 ? _a : parentIdToRef === null || parentIdToRef === void 0 ? void 0 : parentIdToRef.get(id)) !== null && _b !== void 0 ? _b : id;
            });
        }
        if (block.registerAs) {
            config.registerAs = block.registerAs;
        }
        if (block.subWorkflow) {
            config.subWorkflow = this.subWorkflowToConfig(block.subWorkflow, idToRef);
        }
        if (block.thenWorkflow) {
            config.thenWorkflow = this.subWorkflowToConfig(block.thenWorkflow, idToRef);
        }
        if (block.elseWorkflow) {
            config.elseWorkflow = this.subWorkflowToConfig(block.elseWorkflow, idToRef);
        }
        return config;
    }
    /**
     * Builds a map of block ID → ref name from an array of blocks.
     * Uses block.name as the ref (which was set from the original ref during creation).
     * Disambiguates duplicate names by appending a suffix.
     */
    buildIdToRefMap(blocks) {
        const idToRef = new Map();
        const usedRefs = new Set();
        for (const block of blocks) {
            let ref = block.name;
            if (usedRefs.has(ref)) {
                let suffix = 2;
                while (usedRefs.has(`${block.name}_${suffix}`))
                    suffix++;
                ref = `${block.name}_${suffix}`;
            }
            usedRefs.add(ref);
            idToRef.set(block.id, ref);
        }
        return idToRef;
    }
    // #endregion DAG → JSON CONVERSION
    // #region ANCHOR
    linkNodeToAnchorNode(anchorNode, nodeToLink, contextNode) {
        return __awaiter(this, void 0, void 0, function* () {
            yield anchorNode.addChildInContext(nodeToLink, analysisAnchor_1.ANALYSIS_NODE_TO_ANCHOR_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE, contextNode);
        });
    }
    removeLinkToAnchorNode(anchorNode, anchoredNode) {
        return __awaiter(this, void 0, void 0, function* () {
            anchorNode.removeChild(anchoredNode, analysisAnchor_1.ANCHOR_NODE_TO_LINKED_NODE_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
        });
    }
    // #endregion ANCHOR
    // #region NODE GLOBAL
    removeChild(parentNode, childNode, relation) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield parentNode.removeChild(childNode, relation, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            }
            catch (e) {
                try {
                    yield parentNode.removeChild(childNode, relation, spinal_env_viewer_graph_service_1.SPINAL_RELATION_LST_PTR_TYPE);
                }
                catch (e) {
                    console.log(e);
                }
            }
        });
    }
    safeDeleteNode(node, shouldDeleteChildren = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const relations = node.getRelationNames();
            for (const relation of relations) {
                const children = yield node.getChildren(relation);
                for (const child of children) {
                    yield this.removeChild(node, child, relation);
                    if (shouldDeleteChildren)
                        yield child.removeFromGraph();
                }
            }
            yield node.removeFromGraph();
        });
    }
    deleteAnalysisNode(analysisNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const anchorNode = yield this.getAnalysisAnchorNodeNode(analysisNode);
            const relations = anchorNode.getRelationNames();
            if (relations.includes(analysisAnchor_1.ANCHOR_NODE_TO_LINKED_NODE_RELATION)) {
                yield anchorNode.removeRelation(analysisAnchor_1.ANCHOR_NODE_TO_LINKED_NODE_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            }
            yield analysisNode.removeFromGraph();
        });
    }
    // #endregion NODE GLOBAL
    // #region ADD ANALYSIS SUBNODES
    addWorkflowNodeToAnalysisNode(analysisNode, contextNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const workflowNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode({
                name: analysisExecutionWorkflow_1.EXECUTION_WORKFLOW_NODE_NAME,
                type: analysisExecutionWorkflow_1.EXECUTION_WORKFLOW_NODE_TYPE
            });
            const workflowNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(workflowNodeId);
            if (!workflowNode)
                throw new Error('Failed to create workflow node');
            yield analysisNode.addChildInContext(workflowNode, analysisExecutionWorkflow_1.ANALYSIS_NODE_TO_EXECUTION_WORKFLOW_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE, contextNode);
            return workflowNode;
        });
    }
    addInputNodeToAnalysisNode(analysisNode, contextNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode({
                name: analysisInput_1.INPUT_NODE_NAME,
                type: analysisInput_1.INPUT_NODE_TYPE
            });
            const inputNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(inputNodeId);
            if (!inputNode)
                throw new Error('Failed to create inputs node');
            yield analysisNode.addChildInContext(inputNode, analysisInput_1.ANALYSIS_NODE_TO_INPUT_NODE_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE, contextNode);
            return inputNode;
        });
    }
    addOutputNodeToAnalysisNode(analysisNode, contextNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const outputNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode({
                name: analysisOutput_1.OUTPUT_NODE_NAME,
                type: analysisOutput_1.OUTPUT_NODE_TYPE
            });
            const outputNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(outputNodeId);
            if (!outputNode)
                throw new Error('Failed to create output node');
            yield analysisNode.addChildInContext(outputNode, analysisOutput_1.ANALYSIS_NODE_TO_OUTPUT_NODE_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE, contextNode);
            return outputNode;
        });
    }
    addTriggerNodeToAnalysisNode(analysisNode, contextNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const triggerNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode({
                name: analysisTrigger_1.TRIGGER_NODE_NAME,
                type: analysisTrigger_1.TRIGGER_NODE_TYPE
            });
            const triggerNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(triggerNodeId);
            if (!triggerNode)
                throw new Error('Failed to create trigger node');
            yield analysisNode.addChildInContext(triggerNode, analysisTrigger_1.ANALYSIS_NODE_TO_TRIGGER_NODE_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE, contextNode);
            return triggerNode;
        });
    }
    addWorknodeResolverNodeToAnalysisNode(analysisNode, contextNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const worknodeResolverNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode({
                name: analysisWorknodeResolver_1.WORKNODE_RESOLVER_NODE_NAME,
                type: analysisWorknodeResolver_1.WORKNODE_RESOLVER_NODE_TYPE
            });
            const worknodeResolverNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(worknodeResolverNodeId);
            if (!worknodeResolverNode)
                throw new Error('Failed to create worknode resolver node');
            yield analysisNode.addChildInContext(worknodeResolverNode, analysisWorknodeResolver_1.ANALYSIS_NODE_TO_WORKNODE_RESOLVER_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE, contextNode);
            return worknodeResolverNode;
        });
    }
    addAnchorNodeToAnalysisNode(analysisNode, contextNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const anchorNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode({
                name: analysisAnchor_1.ANCHOR_NODE_NAME,
                type: analysisAnchor_1.ANCHOR_NODE_TYPE
            });
            const anchorNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(anchorNodeId);
            if (!anchorNode)
                throw new Error('Failed to create anchor node');
            yield analysisNode.addChildInContext(anchorNode, analysisAnchor_1.ANALYSIS_NODE_TO_ANCHOR_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE, contextNode);
            return anchorNode;
        });
    }
    // #endregion ADD ANALYSIS SUBNODES
    // #region GET ANALYSIS SUBNODES
    getAnalysisExecutionWorkflowNode(analysisNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const workflowNode = yield analysisNode.getChild(((child) => child.getName().get() === analysisExecutionWorkflow_1.EXECUTION_WORKFLOW_NODE_NAME), analysisExecutionWorkflow_1.ANALYSIS_NODE_TO_EXECUTION_WORKFLOW_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            if (!workflowNode)
                throw new Error('Workflow node not found for analysis node ' + analysisNode.getName().get());
            return workflowNode;
        });
    }
    getAnalysisInputNode(analysisNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputNode = yield analysisNode.getChild(((child) => child.getName().get() === analysisInput_1.INPUT_NODE_NAME), analysisInput_1.ANALYSIS_NODE_TO_INPUT_NODE_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            if (!inputNode)
                throw new Error('Input node not found for analysis node ' + analysisNode.getName().get());
            return inputNode;
        });
    }
    getAnalysisOutputNode(analysisNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const outputNode = yield analysisNode.getChild(((child) => child.getName().get() === analysisOutput_1.OUTPUT_NODE_NAME), analysisOutput_1.ANALYSIS_NODE_TO_OUTPUT_NODE_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            if (!outputNode)
                throw new Error('Output node not found for analysis node ' + analysisNode.getName().get());
            return outputNode;
        });
    }
    getAnalysisTriggerNode(analysisNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const triggerNode = yield analysisNode.getChild(((child) => child.getName().get() === analysisTrigger_1.TRIGGER_NODE_NAME), analysisTrigger_1.ANALYSIS_NODE_TO_TRIGGER_NODE_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            if (!triggerNode)
                throw new Error('Trigger node not found for analysis node ' + analysisNode.getName().get());
            return triggerNode;
        });
    }
    getAnalysisWorknodeResolverNode(analysisNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const worknodeResolverNode = yield analysisNode.getChild(((child) => child.getName().get() === analysisWorknodeResolver_1.WORKNODE_RESOLVER_NODE_NAME), analysisWorknodeResolver_1.ANALYSIS_NODE_TO_WORKNODE_RESOLVER_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            if (!worknodeResolverNode)
                throw new Error('Worknode resolver node not found for analysis node ' + analysisNode.getName().get());
            return worknodeResolverNode;
        });
    }
    getAnalysisAnchorNodeNode(analysisNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const anchorNode = yield analysisNode.getChild(((child) => child.getName().get() === analysisAnchor_1.ANCHOR_NODE_NAME), analysisAnchor_1.ANALYSIS_NODE_TO_ANCHOR_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            if (!anchorNode)
                throw new Error('Anchor node not found for analysis node ' + analysisNode.getName().get());
            return anchorNode;
        });
    }
    // #endregion GET ANALYSIS SUBNODES
    // #region PRIVATE
    // #endregion PRIVATE
    reverseChildrenOrder(node, relationName) {
        return __awaiter(this, void 0, void 0, function* () {
            const myRelation = node.children.PtrLst[relationName].children;
            const ids = myRelation.info.ids;
            [ids[0], ids[1]] = [ids[1], ids[0]];
            const myPtr = yield myRelation.ptr.load();
            [myPtr[0], myPtr[1]] = [myPtr[1], myPtr[0]];
            ids._signal_change();
            myPtr._signal_change();
        });
    }
}
exports.default = AnalyticNodeManagerService;
//# sourceMappingURL=AnalyticNodeManagerService.js.map