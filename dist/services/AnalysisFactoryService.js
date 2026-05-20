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
const analysisAnchor_1 = require("../constants/analysisAnchor");
const WorkflowExecutionService_1 = require("./WorkflowExecutionService");
const utils_1 = require("./utils");
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
class AnalysisFactoryService {
    constructor(nodeManager, blockManager) {
        this.nodeManager = nodeManager;
        this.blockManager = blockManager;
    }
    // ─────────────────────────────────────────────────────
    //  MAIN ENTRY POINT
    // ─────────────────────────────────────────────────────
    /**
     * Creates a complete analysis from a JSON configuration.
     *
     * @param config - The JSON analysis descriptor
     * @returns The created analysis SpinalNode
     */
    createFromJSON(config, graph) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (0, utils_1.logMessage)(`[AnalysisFactory] Creating analysis: ${config.analysisName}`);
            // ── 1. Create or get context ──
            const contextNode = yield this.nodeManager.createContext(config.contextName, graph);
            (0, utils_1.logMessage)(`[AnalysisFactory] Context: ${config.contextName}`);
            // ── 2. Create analysis node (creates all mandatory sub-nodes) ──
            const analysisNode = yield this.nodeManager.addAnalysisNode(config.analysisName, (_a = config.description) !== null && _a !== void 0 ? _a : '', contextNode);
            (0, utils_1.logMessage)(`[AnalysisFactory] Analysis node created: ${config.analysisName}`);
            // ── 3. Link anchor to target node ──
            if (config.anchorNodeId) {
                yield this.linkAnchorTarget(analysisNode, config.anchorNodeId, contextNode);
                (0, utils_1.logMessage)(`[AnalysisFactory] Anchor linked to node: ${config.anchorNodeId}`);
            }
            // ── 4. Build workflow DAGs ──
            if (config.worknodeResolver && config.worknodeResolver.blocks.length > 0) {
                const resolverNode = yield this.nodeManager.getAnalysisWorknodeResolverNode(analysisNode);
                yield this.buildWorkflow(resolverNode, contextNode, config.worknodeResolver);
                (0, utils_1.logMessage)(`[AnalysisFactory] Worknode resolver workflow created (${config.worknodeResolver.blocks.length} blocks)`);
            }
            if (config.inputWorkflow && config.inputWorkflow.blocks.length > 0) {
                const inputNode = yield this.nodeManager.getAnalysisInputNode(analysisNode);
                yield this.buildWorkflow(inputNode, contextNode, config.inputWorkflow);
                (0, utils_1.logMessage)(`[AnalysisFactory] Input workflow created (${config.inputWorkflow.blocks.length} blocks)`);
            }
            if (config.executionWorkflow && config.executionWorkflow.blocks.length > 0) {
                const executionNode = yield this.nodeManager.getAnalysisExecutionWorkflowNode(analysisNode);
                yield this.buildWorkflow(executionNode, contextNode, config.executionWorkflow);
                (0, utils_1.logMessage)(`[AnalysisFactory] Execution workflow created (${config.executionWorkflow.blocks.length} blocks)`);
            }
            (0, utils_1.logMessage)(`[AnalysisFactory] Analysis "${config.analysisName}" fully created`);
            return analysisNode;
        });
    }
    // ─────────────────────────────────────────────────────
    //  ANCHOR LINKING
    // ─────────────────────────────────────────────────────
    /**
     * Links the analysis anchor node to the target node in the database.
     */
    linkAnchorTarget(analysisNode, targetNodeId, contextNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const anchorNode = yield this.nodeManager.getAnalysisAnchorNodeNode(analysisNode);
            // Try to find the target node by ID
            let targetNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(targetNodeId);
            if (!targetNode) {
                throw new Error(`[AnalysisFactory] Target node "${targetNodeId}" not found in graph. ` +
                    'Make sure the node is loaded in SpinalGraphService before creating the analysis.');
            }
            yield anchorNode.addChildInContext(targetNode, analysisAnchor_1.ANCHOR_NODE_TO_LINKED_NODE_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE, contextNode);
        });
    }
    // ─────────────────────────────────────────────────────
    //  WORKFLOW BUILDING
    // ─────────────────────────────────────────────────────
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
    buildWorkflow(workflowNode, contextNode, workflowConfig) {
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, void 0, function* () {
            // Map of ref → created SpinalNode
            const refToNode = new Map();
            // Determine which blocks are "root" (no real block inputs)
            // A block is root if it has no inputs, or all its inputs are '$node'
            const isRootBlock = (blockDef) => {
                if (!blockDef.inputs || blockDef.inputs.length === 0)
                    return true;
                return blockDef.inputs.every((ref) => ref === '$node');
            };
            // ── Phase 1: Create block nodes ──
            // Root blocks → children of workflow node
            // Dependent blocks → orphans (will be parented in Phase 2)
            for (const blockDef of workflowConfig.blocks) {
                let blockNode;
                if (isRootBlock(blockDef)) {
                    blockNode = yield this.blockManager.createBlock(workflowNode, contextNode, blockDef.algorithmName, (_a = blockDef.parameters) !== null && _a !== void 0 ? _a : {}, {
                        name: (_b = blockDef.name) !== null && _b !== void 0 ? _b : blockDef.ref,
                        registerAs: blockDef.registerAs,
                    });
                }
                else {
                    blockNode = this.blockManager.createOrphanBlock(blockDef.algorithmName, (_c = blockDef.parameters) !== null && _c !== void 0 ? _c : {}, {
                        name: (_d = blockDef.name) !== null && _d !== void 0 ? _d : blockDef.ref,
                        registerAs: blockDef.registerAs,
                    });
                }
                refToNode.set(blockDef.ref, blockNode);
                // If this is a FOREACH block with a sub-workflow, build it
                if (blockDef.algorithmName === 'FOREACH' && blockDef.subWorkflow) {
                    if (!blockDef.itemRef) {
                        throw new Error(`[AnalysisFactory] FOREACH block "${blockDef.ref}" is missing itemRef. ` +
                            'Each FOREACH must declare a named ref for its iteration element.');
                    }
                    // Store itemRef on the node
                    this.blockManager.updateBlock(blockNode, {
                        foreachItemRef: blockDef.itemRef,
                    });
                    yield this.buildForeachSubWorkflow(blockNode, contextNode, blockDef.subWorkflow, blockDef.itemRef, refToNode, new Set([blockDef.itemRef]));
                }
                // If this is an IF block with branch workflows, build them
                if (blockDef.algorithmName === 'IF') {
                    if (blockDef.thenWorkflow) {
                        yield this.buildIfSubWorkflow(blockNode, contextNode, blockDef.thenWorkflow, 'then', refToNode, new Set());
                    }
                    if (blockDef.elseWorkflow) {
                        yield this.buildIfSubWorkflow(blockNode, contextNode, blockDef.elseWorkflow, 'else', refToNode, new Set());
                    }
                }
            }
            // ── Phase 2: Wire dependencies ──
            for (const blockDef of workflowConfig.blocks) {
                if (!blockDef.inputs || blockDef.inputs.length === 0)
                    continue;
                const dependentNode = refToNode.get(blockDef.ref);
                if (!dependentNode)
                    continue;
                // Resolve '$node' refs to WORK_NODE_RESERVED_ID in inputBlockIds
                // but skip graph edges for '$node' (it's virtual)
                const resolvedInputBlockIds = [];
                for (let slot = 0; slot < blockDef.inputs.length; slot++) {
                    const sourceRef = blockDef.inputs[slot];
                    if (sourceRef === '$node') {
                        // Virtual reference — just record the reserved ID, no graph edge
                        resolvedInputBlockIds.push(WorkflowExecutionService_1.WORK_NODE_RESERVED_ID);
                        continue;
                    }
                    const sourceNode = refToNode.get(sourceRef);
                    if (!sourceNode) {
                        throw new Error(`[AnalysisFactory] Block "${blockDef.ref}" references input "${sourceRef}" ` +
                            'which does not exist. Check your workflow block refs.');
                    }
                    yield this.blockManager.addDependency(sourceNode, dependentNode, contextNode, slot);
                }
                // If there were '$node' refs, merge them into the inputBlockIds
                if (resolvedInputBlockIds.some((id) => id === WorkflowExecutionService_1.WORK_NODE_RESERVED_ID)) {
                    const currentIds = JSON.parse((_f = (_e = dependentNode.info.inputBlockIds) === null || _e === void 0 ? void 0 : _e.get()) !== null && _f !== void 0 ? _f : '[]');
                    // Build final ordered list: for each slot, use the '$node' ID or the already-wired ID
                    const finalIds = [];
                    let wireIdx = 0;
                    for (let slot = 0; slot < blockDef.inputs.length; slot++) {
                        if (blockDef.inputs[slot] === '$node') {
                            finalIds.push(WorkflowExecutionService_1.WORK_NODE_RESERVED_ID);
                        }
                        else {
                            finalIds.push((_g = currentIds[wireIdx]) !== null && _g !== void 0 ? _g : '');
                            wireIdx++;
                        }
                    }
                    dependentNode.info.inputBlockIds.set(JSON.stringify(finalIds));
                }
            }
        });
    }
    /**
     * Builds the sub-workflow for a FOREACH block.
     *
     * The FOREACH's `itemRef` is the name by which the iteration element is referenced.
     * Sub-blocks can reference it by name in their inputs.
     * `parentRefToNode` provides access to blocks defined in the parent workflow scope.
     */
    buildForeachSubWorkflow(foreachNode, contextNode, subWorkflowConfig, itemRef, parentRefToNode, knownItemRefs = new Set()) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const refToNode = new Map();
            const itemVirtualId = (0, WorkflowExecutionService_1.foreachItemVirtualId)(itemRef);
            // Phase 1: Create sub-blocks
            for (const blockDef of subWorkflowConfig.blocks) {
                const subBlockNode = yield this.blockManager.createForeachSubBlock(foreachNode, contextNode, blockDef.algorithmName, (_a = blockDef.parameters) !== null && _a !== void 0 ? _a : {}, {
                    name: (_b = blockDef.name) !== null && _b !== void 0 ? _b : blockDef.ref,
                    registerAs: blockDef.registerAs,
                });
                refToNode.set(blockDef.ref, subBlockNode);
                // Recursively build nested FOREACH sub-workflows
                if (blockDef.algorithmName === 'FOREACH' && blockDef.subWorkflow) {
                    if (!blockDef.itemRef) {
                        throw new Error(`[AnalysisFactory] FOREACH block "${blockDef.ref}" is missing itemRef.`);
                    }
                    this.blockManager.updateBlock(subBlockNode, {
                        foreachItemRef: blockDef.itemRef,
                    });
                    const childItemRefs = new Set([...knownItemRefs, blockDef.itemRef]);
                    yield this.buildForeachSubWorkflow(subBlockNode, contextNode, blockDef.subWorkflow, blockDef.itemRef, refToNode, childItemRefs);
                }
                // Recursively build nested IF sub-workflows
                if (blockDef.algorithmName === 'IF') {
                    if (blockDef.thenWorkflow) {
                        yield this.buildIfSubWorkflow(subBlockNode, contextNode, blockDef.thenWorkflow, 'then', refToNode, knownItemRefs);
                    }
                    if (blockDef.elseWorkflow) {
                        yield this.buildIfSubWorkflow(subBlockNode, contextNode, blockDef.elseWorkflow, 'else', refToNode, knownItemRefs);
                    }
                }
            }
            // Phase 2: Wire dependencies and build inputBlockIds
            for (const blockDef of subWorkflowConfig.blocks) {
                if (!blockDef.inputs || blockDef.inputs.length === 0)
                    continue;
                const dependentNode = refToNode.get(blockDef.ref);
                if (!dependentNode)
                    continue;
                const finalIds = [];
                for (const sourceRef of blockDef.inputs) {
                    // Check if it's the FOREACH item ref (current level or any ancestor)
                    const virtualId = this.resolveItemRef(sourceRef, itemRef, knownItemRefs);
                    if (virtualId) {
                        finalIds.push(virtualId);
                        continue;
                    }
                    // Check local sub-workflow refs
                    const localNode = refToNode.get(sourceRef);
                    if (localNode) {
                        yield this.blockManager.addSubBlockDependency(localNode, dependentNode, contextNode);
                        finalIds.push(localNode.getId().get());
                        continue;
                    }
                    // Check parent workflow refs
                    if (parentRefToNode) {
                        const parentNode = parentRefToNode.get(sourceRef);
                        if (parentNode) {
                            finalIds.push(parentNode.getId().get());
                            continue;
                        }
                    }
                    throw new Error(`[AnalysisFactory] FOREACH sub-block "${blockDef.ref}" references input "${sourceRef}" ` +
                        `which does not exist in the sub-workflow or parent workflow. ` +
                        `Use "${itemRef}" to reference the current iteration element.`);
                }
                dependentNode.info.inputBlockIds.set(JSON.stringify(finalIds));
            }
            // Set the output block ID on the FOREACH node
            const outputRef = subWorkflowConfig.outputRef;
            const outputNode = refToNode.get(outputRef);
            if (!outputNode) {
                throw new Error(`[AnalysisFactory] FOREACH outputRef "${outputRef}" does not match any sub-block ref`);
            }
            this.blockManager.updateBlock(foreachNode, {
                foreachOutputBlockId: outputNode.getId().get(),
            });
        });
    }
    /**
     * Builds a sub-workflow for an IF block (then or else branch).
     *
     * IF sub-workflows can reference:
     * - Any FOREACH itemRef (resolved to virtual ID — inherited at runtime)
     * - '$node': the implicit work node
     * - Any ref from the parent workflow (resolved as a virtual input)
     * - Other sub-workflow block refs
     */
    buildIfSubWorkflow(ifNode, contextNode, subWorkflowConfig, branch, parentRefToNode, knownItemRefs = new Set()) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const refToNode = new Map();
            // Track parent refs used by sub-blocks so we can add them as
            // dependencies of the IF block itself (ensures correct topological order)
            const usedParentRefs = new Set();
            // Phase 1: Create sub-blocks
            for (const blockDef of subWorkflowConfig.blocks) {
                const subBlockNode = yield this.blockManager.createIfSubBlock(ifNode, contextNode, blockDef.algorithmName, (_a = blockDef.parameters) !== null && _a !== void 0 ? _a : {}, branch, {
                    name: (_b = blockDef.name) !== null && _b !== void 0 ? _b : blockDef.ref,
                    registerAs: blockDef.registerAs,
                });
                refToNode.set(blockDef.ref, subBlockNode);
                // Recursively build nested FOREACH sub-workflows
                if (blockDef.algorithmName === 'FOREACH' && blockDef.subWorkflow) {
                    if (!blockDef.itemRef) {
                        throw new Error(`[AnalysisFactory] FOREACH block "${blockDef.ref}" is missing itemRef.`);
                    }
                    this.blockManager.updateBlock(subBlockNode, {
                        foreachItemRef: blockDef.itemRef,
                    });
                    const childItemRefs = new Set([...knownItemRefs, blockDef.itemRef]);
                    yield this.buildForeachSubWorkflow(subBlockNode, contextNode, blockDef.subWorkflow, blockDef.itemRef, refToNode, childItemRefs);
                }
                // Recursively build nested IF sub-workflows
                if (blockDef.algorithmName === 'IF') {
                    // Merge parent refs with local refs so nested IF can resolve both
                    const mergedRefToNode = parentRefToNode
                        ? new Map([...parentRefToNode, ...refToNode])
                        : refToNode;
                    if (blockDef.thenWorkflow) {
                        yield this.buildIfSubWorkflow(subBlockNode, contextNode, blockDef.thenWorkflow, 'then', mergedRefToNode, knownItemRefs);
                    }
                    if (blockDef.elseWorkflow) {
                        yield this.buildIfSubWorkflow(subBlockNode, contextNode, blockDef.elseWorkflow, 'else', mergedRefToNode, knownItemRefs);
                    }
                }
            }
            // Phase 2: Wire dependencies and build inputBlockIds
            for (const blockDef of subWorkflowConfig.blocks) {
                if (!blockDef.inputs || blockDef.inputs.length === 0)
                    continue;
                const dependentNode = refToNode.get(blockDef.ref);
                if (!dependentNode)
                    continue;
                const finalIds = [];
                for (const sourceRef of blockDef.inputs) {
                    // Check if it's a FOREACH item ref (any ancestor level)
                    const virtualId = this.resolveItemRef(sourceRef, undefined, knownItemRefs);
                    if (virtualId) {
                        finalIds.push(virtualId);
                        continue;
                    }
                    // Check local sub-workflow refs first
                    const localNode = refToNode.get(sourceRef);
                    if (localNode) {
                        yield this.blockManager.addSubBlockDependency(localNode, dependentNode, contextNode);
                        finalIds.push(localNode.getId().get());
                        continue;
                    }
                    // Check parent workflow refs (IF branches inherit parent context)
                    if (parentRefToNode) {
                        const parentNode = parentRefToNode.get(sourceRef);
                        if (parentNode) {
                            finalIds.push(parentNode.getId().get());
                            usedParentRefs.add(sourceRef);
                            continue;
                        }
                    }
                    throw new Error(`[AnalysisFactory] IF ${branch} sub-block "${blockDef.ref}" references input "${sourceRef}" ` +
                        'which does not exist in the sub-workflow or parent workflow.');
                }
                // Set the correctly ordered inputBlockIds (overrides addSubBlockDependency side effects)
                dependentNode.info.inputBlockIds.set(JSON.stringify(finalIds));
            }
            // Set the output block ID on the IF node
            const outputRef = subWorkflowConfig.outputRef;
            const outputNode = refToNode.get(outputRef);
            if (!outputNode) {
                throw new Error(`[AnalysisFactory] IF ${branch} outputRef "${outputRef}" does not match any sub-block ref`);
            }
            const fieldName = branch === 'then' ? 'ifThenOutputBlockId' : 'ifElseOutputBlockId';
            this.blockManager.updateBlock(ifNode, {
                [fieldName]: outputNode.getId().get(),
            });
            // Ensure parent refs used by sub-blocks are also dependencies of the IF block.
            // This guarantees the topological sort places those parent blocks before IF.
            if (parentRefToNode && usedParentRefs.size > 0) {
                const ifInputBlockIds = JSON.parse((_d = (_c = ifNode.info.inputBlockIds) === null || _c === void 0 ? void 0 : _c.get()) !== null && _d !== void 0 ? _d : '[]');
                for (const parentRef of usedParentRefs) {
                    const parentNode = parentRefToNode.get(parentRef);
                    if (!parentNode)
                        continue;
                    const parentId = parentNode.getId().get();
                    if (!ifInputBlockIds.includes(parentId)) {
                        ifInputBlockIds.push(parentId);
                        // Add graph edge so loadWorkflowDAG can traverse it
                        yield this.blockManager.addDependency(parentNode, ifNode, contextNode);
                    }
                }
                ifNode.info.inputBlockIds.set(JSON.stringify(ifInputBlockIds));
            }
        });
    }
    // ─────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────
    /**
     * Checks if a source ref matches any known FOREACH itemRef.
     * Returns the virtual ID if it matches, otherwise undefined.
     */
    resolveItemRef(sourceRef, currentItemRef, knownItemRefs) {
        // Direct match with the current FOREACH's itemRef
        if (currentItemRef && sourceRef === currentItemRef) {
            return (0, WorkflowExecutionService_1.foreachItemVirtualId)(sourceRef);
        }
        // Match with any ancestor FOREACH's itemRef
        if (knownItemRefs && knownItemRefs.has(sourceRef)) {
            return (0, WorkflowExecutionService_1.foreachItemVirtualId)(sourceRef);
        }
        return undefined;
    }
}
exports.default = AnalysisFactoryService;
//# sourceMappingURL=AnalysisFactoryService.js.map