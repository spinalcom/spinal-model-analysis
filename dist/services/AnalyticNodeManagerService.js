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
    getContexts(graph) {
        return __awaiter(this, void 0, void 0, function* () {
            const contexts = yield graph.getChildren();
            const analysisContexts = contexts.filter((context) => context.getType().get() === analysisContext_1.ANALYSIS_CONTEXT_NODE_TYPE);
            return analysisContexts;
        });
    }
    /**
     * This method use the context name to find and return the info of that context. If the context does not exist, it returns undefined.
     * If multiple contexts have the same name, it returns the first one.
     * @param {string} contextName
     * @return {*}  {(SpinalNode<any> | undefined)}
     * @memberof AnalyticService
     */
    getContext(contextName, graph) {
        return __awaiter(this, void 0, void 0, function* () {
            const contexts = yield this.getContexts(graph);
            if (!contexts)
                return undefined;
            return contexts.find((context) => context.getName().get() === contextName);
        });
    }
    /**
     * This method creates a new context and returns the info of the newly created context.
     * If the context already exists (same name), it just returns the info of that context instead of creating a new one.
     * @param {string} contextName
     * @return {*}  {Promise<SpinalNode<any>>}
     * @memberof AnalyticService
     */
    createContext(contextName, graph) {
        return __awaiter(this, void 0, void 0, function* () {
            const alreadyExists = yield this.getContext(contextName, graph);
            if (alreadyExists) {
                console.error(`Context ${contextName} already exists`);
                return alreadyExists;
            }
            const contextNode = new spinal_env_viewer_graph_service_1.SpinalContext(contextName, analysisContext_1.ANALYSIS_CONTEXT_NODE_TYPE);
            return graph.addContext(contextNode).then((context) => {
                spinal_env_viewer_plugin_documentation_service_1.attributeService.createOrUpdateAttrsAndCategories(context, "metadata", {
                    version: version_1.VERSION
                });
                return context;
            });
        });
    }
    getContextOfAnalytic(analyticNode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (analyticNode.getType().get() !== analysisNode_1.ANALYSIS_NODE_TYPE) {
                throw new Error('Node is not an analysis node');
            }
            const parents = yield analyticNode.getParents(analysisNode_1.ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION);
            if (parents.length === 0) {
                throw new Error('Node is either not an Analysis node or is not linked to any analysis context ( should not happen since analysis nodes are always linked to a context)');
            }
            return parents[0];
        });
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
    addAnalysisNode(analysisNodeName, analysisNodeDescription, contextNode, concurrency, status) {
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
            // Store the concurrency config and lifecycle status as visible/editable
            // documentation attributes.
            yield this.setConcurrencyConfig(analysisNode, concurrency !== null && concurrency !== void 0 ? concurrency : analysisNode_1.DEFAULT_CONCURRENCY);
            yield this.setStatus(analysisNode, status !== null && status !== void 0 ? status : analysisNode_1.DEFAULT_ANALYSIS_STATUS);
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
    /**
     * Normalizes a (possibly partial / undefined) concurrency config into a complete,
     * validated one, applying defaults. Used both when storing on a node and when
     * reading back, so callers always get a concrete `{ mode, limit }`.
     */
    normalizeConcurrency(concurrency) {
        const mode = (concurrency === null || concurrency === void 0 ? void 0 : concurrency.mode) === 'FULL' || (concurrency === null || concurrency === void 0 ? void 0 : concurrency.mode) === 'SEQUENTIAL' || (concurrency === null || concurrency === void 0 ? void 0 : concurrency.mode) === 'BOUNDED'
            ? concurrency.mode
            : analysisNode_1.DEFAULT_CONCURRENCY.mode;
        let limit = analysisNode_1.DEFAULT_CONCURRENCY_LIMIT;
        if (mode === 'BOUNDED' && typeof (concurrency === null || concurrency === void 0 ? void 0 : concurrency.limit) === 'number' && Number.isFinite(concurrency.limit)) {
            limit = Math.max(1, Math.floor(concurrency.limit));
        }
        return { mode, limit };
    }
    /**
     * Reads the work-node concurrency config from the analysis node's documentation
     * attributes (category {@link CONCURRENCY_CATEGORY}). Falls back to
     * {@link DEFAULT_CONCURRENCY} for any missing/malformed field (e.g. analyses
     * created before this feature existed, or a hand-edited invalid value).
     */
    getConcurrencyConfig(analysisNode) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const attrs = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(analysisNode, analysisNode_1.CONCURRENCY_CATEGORY);
            if (!attrs || attrs.length === 0)
                return Object.assign({}, analysisNode_1.DEFAULT_CONCURRENCY);
            const modeAttr = attrs.find((a) => { var _a; return ((_a = a.label) === null || _a === void 0 ? void 0 : _a.get()) === analysisNode_1.CONCURRENCY_ATTR_MODE; });
            const limitAttr = attrs.find((a) => { var _a; return ((_a = a.label) === null || _a === void 0 ? void 0 : _a.get()) === analysisNode_1.CONCURRENCY_ATTR_LIMIT; });
            const rawMode = (_a = modeAttr === null || modeAttr === void 0 ? void 0 : modeAttr.value) === null || _a === void 0 ? void 0 : _a.get();
            const rawLimit = (_b = limitAttr === null || limitAttr === void 0 ? void 0 : limitAttr.value) === null || _b === void 0 ? void 0 : _b.get();
            return this.normalizeConcurrency({
                mode: rawMode,
                limit: typeof rawLimit === 'number' ? rawLimit : Number(rawLimit),
            });
        });
    }
    /**
     * Writes the work-node concurrency config as documentation attributes on the
     * analysis node (creating the category/attributes on first write). Normalizes the
     * input first so stored values are always valid.
     */
    setConcurrencyConfig(analysisNode, concurrency) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalized = this.normalizeConcurrency(concurrency);
            yield spinal_env_viewer_plugin_documentation_service_1.attributeService.createOrUpdateAttrsAndCategories(analysisNode, analysisNode_1.CONCURRENCY_CATEGORY, {
                [analysisNode_1.CONCURRENCY_ATTR_MODE]: normalized.mode,
                [analysisNode_1.CONCURRENCY_ATTR_LIMIT]: String(normalized.limit),
            });
        });
    }
    /**
     * Coerces an arbitrary value into a valid {@link AnalysisStatus}. Anything that
     * isn't exactly "Active" falls back to {@link DEFAULT_ANALYSIS_STATUS} (Inactive),
     * so a missing/typo'd/hand-edited value never accidentally activates an analysis.
     */
    normalizeStatus(status) {
        return typeof status === 'string' && status.trim().toLowerCase() === 'active'
            ? 'Active'
            : analysisNode_1.DEFAULT_ANALYSIS_STATUS;
    }
    /**
     * Reads the lifecycle status from the analysis node's documentation attributes.
     * Falls back to {@link DEFAULT_ANALYSIS_STATUS} (Inactive) when missing or invalid
     * — including analyses created before this feature existed, which are therefore
     * treated as parked until explicitly activated.
     */
    getStatus(analysisNode) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const attrs = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(analysisNode, analysisNode_1.STATUS_CATEGORY);
            const statusAttr = attrs === null || attrs === void 0 ? void 0 : attrs.find((a) => { var _a; return ((_a = a.label) === null || _a === void 0 ? void 0 : _a.get()) === analysisNode_1.STATUS_ATTR; });
            return this.normalizeStatus((_a = statusAttr === null || statusAttr === void 0 ? void 0 : statusAttr.value) === null || _a === void 0 ? void 0 : _a.get());
        });
    }
    /**
     * Convenience predicate: true when the analysis is Active (the organ should run it).
     */
    isAnalysisActive(analysisNode) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getStatus(analysisNode)) === 'Active';
        });
    }
    /**
     * Writes the lifecycle status as a documentation attribute on the analysis node
     * (creating the category/attribute on first write). Normalizes first so the stored
     * value is always a valid status.
     */
    setStatus(analysisNode, status) {
        return __awaiter(this, void 0, void 0, function* () {
            yield spinal_env_viewer_plugin_documentation_service_1.attributeService.createOrUpdateAttrsAndCategories(analysisNode, analysisNode_1.STATUS_CATEGORY, { [analysisNode_1.STATUS_ATTR]: this.normalizeStatus(status) });
        });
    }
    getAnalysisNodesByContextName(contextName, graph) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = yield this.getContext(contextName, graph);
            if (!context)
                throw new Error(`Context with name ${contextName} not found`);
            const analysisNodes = yield context.getChildren(analysisNode_1.ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION);
            return analysisNodes;
        });
    }
    getAnalysisNodesByContextNode(contextNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const analysisNodes = yield contextNode.getChildren(analysisNode_1.ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION);
            return analysisNodes;
        });
    }
    getAnalysisNodeByContextNode(contextNode, analysisNodeName) {
        return __awaiter(this, void 0, void 0, function* () {
            const analysisNodes = yield this.getAnalysisNodesByContextNode(contextNode);
            const analysisNode = analysisNodes.find((node) => node.getName().get() === analysisNodeName);
            if (!analysisNode)
                return undefined;
            return analysisNode;
        });
    }
    getAnalysisNode(contextName, analyticName, graph) {
        return __awaiter(this, void 0, void 0, function* () {
            const analysisNodes = yield this.getAnalysisNodesByContextName(contextName, graph);
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
            const context = yield this.getContextOfAnalytic(analysisNode);
            // ── Anchor ──
            const anchorNode = yield this.getAnalysisAnchorNodeNode(analysisNode);
            const anchorTargets = yield anchorNode.getChildren(analysisAnchor_1.ANCHOR_NODE_TO_LINKED_NODE_RELATION);
            const anchorNodeId = anchorTargets.length > 0
                ? anchorTargets[0]._server_id
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
                analysisId: analysisNode._server_id,
                description: (_b = (_a = analysisNode.info.description) === null || _a === void 0 ? void 0 : _a.get()) !== null && _b !== void 0 ? _b : '',
            };
            if (anchorNodeId)
                result.anchorNodeId = String(anchorNodeId);
            if (resolverDAG.blocks.length > 0)
                result.worknodeResolver = this.dagToWorkflowConfig(resolverDAG.blocks);
            if (inputDAG.blocks.length > 0)
                result.inputWorkflow = this.dagToWorkflowConfig(inputDAG.blocks);
            if (executionDAG.blocks.length > 0)
                result.executionWorkflow = this.dagToWorkflowConfig(executionDAG.blocks);
            // ── Triggers ──
            const triggers = yield this.getTriggerConfigs(analysisNode);
            if (triggers.length > 0)
                result.triggers = triggers;
            // ── Concurrency ── (always emitted so the active strategy is explicit)
            result.concurrency = yield this.getConcurrencyConfig(analysisNode);
            // ── Status ── (always emitted so the lifecycle state is explicit)
            result.status = yield this.getStatus(analysisNode);
            return result;
        });
    }
    /**
     * Reads the trigger configurations stored on the analysis trigger node.
     * Returns a clean, round-trippable array of ITriggerConfigJSON (undefined
     * fields stripped). Returns [] when no triggers are configured.
     */
    getTriggerConfigs(analysisNode) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const triggerNode = yield this.getAnalysisTriggerNode(analysisNode);
            const attrs = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(triggerNode, analysisTrigger_1.TRIGGER_CATEGORY);
            const configAttr = attrs.find((a) => { var _a; return ((_a = a.label) === null || _a === void 0 ? void 0 : _a.get()) === analysisTrigger_1.TRIGGER_ATTR_CONFIGS; });
            if (!configAttr)
                return [];
            const raw = (_a = configAttr.value) === null || _a === void 0 ? void 0 : _a.get();
            if (typeof raw !== 'string')
                return [];
            let parsed;
            try {
                parsed = JSON.parse(raw);
            }
            catch (_b) {
                return [];
            }
            if (!Array.isArray(parsed))
                return [];
            // Strip undefined/null fields so the emitted JSON stays clean.
            return parsed.map((t) => {
                const clean = { type: t.type };
                if (t.id != null)
                    clean.id = t.id;
                if (t.intervalTimeMs != null)
                    clean.intervalTimeMs = t.intervalTimeMs;
                if (t.cronExpression != null)
                    clean.cronExpression = t.cronExpression;
                if (t.inputRegister != null)
                    clean.inputRegister = t.inputRegister;
                if (t.threshold != null)
                    clean.threshold = t.threshold;
                return clean;
            });
        });
    }
    // #endregion ANALYSIS DETAILS
    // #region DAG → JSON CONVERSION
    /**
     * Converts an array of in-memory workflow blocks back to a JSON workflow config.
     * Blocks are topologically sorted so dependencies appear before dependents.
     */
    dagToWorkflowConfig(blocks) {
        const sorted = this.topologicalSort(blocks);
        const idToRef = this.buildIdToRefMap(sorted);
        return {
            blocks: sorted.map((b) => this.blockToConfig(b, idToRef)),
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
     * For IF blocks, strips synthetic inputBlockIds that were only added for topological ordering.
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
        // For IF blocks, only include "real" inputs (predicate only).
        // Extra inputBlockIds are synthetic deps added for topological ordering by buildIfSubWorkflow.
        if (block.algorithmName === 'IF') {
            const realCount = this.getIfRealInputCount(block);
            const realIds = block.inputBlockIds.slice(0, realCount);
            if (realIds.length > 0) {
                config.inputs = realIds.map((id) => this.idToInputRef(id, idToRef, parentIdToRef));
            }
        }
        else if (block.inputBlockIds.length > 0) {
            config.inputs = block.inputBlockIds.map((id) => this.idToInputRef(id, idToRef, parentIdToRef));
        }
        // Order-only dependencies (`after`) — emit refs, same id→ref mapping as inputs.
        if (block.orderBlockIds && block.orderBlockIds.length > 0) {
            config.after = block.orderBlockIds.map((id) => this.idToInputRef(id, idToRef, parentIdToRef));
        }
        if (block.registerAs) {
            config.registerAs = block.registerAs;
        }
        // FOREACH: add itemRef
        if (block.foreachItemRef) {
            config.itemRef = block.foreachItemRef;
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
     * Converts an inputBlockId back to its ref string for JSON output.
     */
    idToInputRef(id, idToRef, parentIdToRef) {
        var _a, _b;
        if (id === WorkflowExecutionService_1.WORK_NODE_RESERVED_ID)
            return '$node';
        // Check for FOREACH item virtual IDs (__ITEM_<name>__)
        if (id.startsWith(WorkflowExecutionService_1.FOREACH_ITEM_PREFIX) && id.endsWith(WorkflowExecutionService_1.FOREACH_ITEM_SUFFIX)) {
            return id.slice(WorkflowExecutionService_1.FOREACH_ITEM_PREFIX.length, -WorkflowExecutionService_1.FOREACH_ITEM_SUFFIX.length);
        }
        return (_b = (_a = idToRef.get(id)) !== null && _a !== void 0 ? _a : parentIdToRef === null || parentIdToRef === void 0 ? void 0 : parentIdToRef.get(id)) !== null && _b !== void 0 ? _b : id;
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
    /**
     * Topologically sorts blocks so that dependencies come before dependents.
     * Uses DFS post-order (Kahn-like via recursion).
     */
    topologicalSort(blocks) {
        const blockMap = new Map(blocks.map((b) => [b.id, b]));
        const visited = new Set();
        const result = [];
        const visit = (block) => {
            var _a;
            if (visited.has(block.id))
                return;
            visited.add(block.id);
            // Predecessors = data inputs + order-only deps, so dependents serialize after both.
            for (const depId of [...block.inputBlockIds, ...((_a = block.orderBlockIds) !== null && _a !== void 0 ? _a : [])]) {
                const dep = blockMap.get(depId);
                if (dep)
                    visit(dep);
            }
            result.push(block);
        };
        for (const block of blocks) {
            visit(block);
        }
        return result;
    }
    /**
     * Determines how many "real" inputs an IF block has (excluding synthetic
     * parent-ref dependencies appended by buildIfSubWorkflow for topological ordering).
     *
     * IF only has 1 real input: the boolean predicate (inputs[0]).
     * Everything else is synthetic for topological ordering.
     */
    getIfRealInputCount(block) {
        return Math.min(1, block.inputBlockIds.length);
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
    deleteAnalysisContext(contextNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const analysisNodes = yield contextNode.getChildren(analysisNode_1.ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION);
            for (const analysisNode of analysisNodes) {
                yield this.deleteAnalysisNode(analysisNode);
            }
            yield contextNode.removeFromGraph();
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