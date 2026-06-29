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
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
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
     * Validates a JSON config without touching the database.
     * Returns an array of error messages. Empty array = valid config.
     *
     * Call this before createFromJSON to avoid partial writes on invalid configs.
     */
    validateConfig(config) {
        const errors = [];
        if (!config.contextName || typeof config.contextName !== 'string') {
            errors.push('Missing or invalid "contextName"');
        }
        if (!config.analysisName || typeof config.analysisName !== 'string') {
            errors.push('Missing or invalid "analysisName"');
        }
        if (config.worknodeResolver) {
            errors.push(...this.validateWorkflow(config.worknodeResolver, 'worknodeResolver', new Set()));
        }
        if (config.inputWorkflow) {
            errors.push(...this.validateWorkflow(config.inputWorkflow, 'inputWorkflow', new Set()));
        }
        if (config.executionWorkflow) {
            errors.push(...this.validateWorkflow(config.executionWorkflow, 'executionWorkflow', new Set()));
        }
        if (config.triggers) {
            errors.push(...this.validateTriggers(config.triggers));
        }
        if (config.concurrency !== undefined) {
            errors.push(...this.validateConcurrency(config.concurrency));
        }
        if (config.status !== undefined && config.status !== 'Active' && config.status !== 'Inactive') {
            errors.push('status: must be either "Active" or "Inactive"');
        }
        return errors;
    }
    /**
     * Validates the optional concurrency config. Mode must be one of the known
     * strategies; for BOUNDED, an explicit limit (if given) must be a positive integer.
     */
    validateConcurrency(concurrency) {
        const errors = [];
        const validModes = ['BOUNDED', 'FULL', 'SEQUENTIAL'];
        if (!concurrency || typeof concurrency !== 'object') {
            errors.push('concurrency: must be an object with a "mode" field');
            return errors;
        }
        if (!validModes.includes(concurrency.mode)) {
            errors.push(`concurrency.mode: must be one of ${validModes.join(', ')}`);
        }
        if (concurrency.limit !== undefined) {
            if (typeof concurrency.limit !== 'number' ||
                !Number.isFinite(concurrency.limit) ||
                concurrency.limit < 1 ||
                !Number.isInteger(concurrency.limit)) {
                errors.push('concurrency.limit: must be a positive integer');
            }
        }
        return errors;
    }
    /**
     * Creates a complete analysis from a JSON configuration.
     * Validates the config first — throws if invalid to prevent partial writes.
     *
     * @param config - The JSON analysis descriptor
     * @returns The created analysis SpinalNode
     */
    createFromJSON(config, graph) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // Validate before touching the database
            const errors = this.validateConfig(config);
            if (errors.length > 0) {
                throw new Error(`[AnalysisFactory] Invalid config for "${(_a = config.analysisName) !== null && _a !== void 0 ? _a : '(unnamed)'}": \n` +
                    errors.map((e) => `  - ${e}`).join('\n'));
            }
            (0, utils_1.logMessage)(`[AnalysisFactory] Creating analysis: ${config.analysisName}`);
            // ── 1. Create or get context ──
            const contextNode = yield this.nodeManager.createContext(config.contextName, graph);
            (0, utils_1.logMessage)(`[AnalysisFactory] Context: ${config.contextName}`);
            // ── 2. Create analysis node (creates all mandatory sub-nodes) ──
            const analysisNode = yield this.nodeManager.addAnalysisNode(config.analysisName, (_b = config.description) !== null && _b !== void 0 ? _b : '', contextNode, config.concurrency, config.status);
            (0, utils_1.logMessage)(`[AnalysisFactory] Analysis node created: ${config.analysisName}`);
            // ── 3. Link anchor, build workflows, store triggers ──
            yield this.populateAnalysis(analysisNode, contextNode, config);
            (0, utils_1.logMessage)(`[AnalysisFactory] Analysis "${config.analysisName}" fully created`);
            return analysisNode;
        });
    }
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
    updateFromJSON(analysisNode, config) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const errors = this.validateConfig(config);
            if (errors.length > 0) {
                throw new Error(`[AnalysisFactory] Invalid config for "${(_a = config.analysisName) !== null && _a !== void 0 ? _a : '(unnamed)'}": \n` +
                    errors.map((e) => `  - ${e}`).join('\n'));
            }
            const contextNode = yield this.nodeManager.getContextOfAnalytic(analysisNode);
            (0, utils_1.logMessage)(`[AnalysisFactory] Updating analysis: ${analysisNode.getName().get()}`);
            // ── 1. Update scalar properties on the analysis node itself ──
            analysisNode.info.name.set(config.analysisName);
            if (analysisNode.info.description) {
                analysisNode.info.description.set((_b = config.description) !== null && _b !== void 0 ? _b : '');
            }
            else {
                analysisNode.info.add_attr('description', (_c = config.description) !== null && _c !== void 0 ? _c : '');
            }
            yield this.nodeManager.setConcurrencyConfig(analysisNode, config.concurrency);
            yield this.nodeManager.setStatus(analysisNode, config.status);
            // ── 2. Wipe the whole sub-structure (keeping the analysis node) ──
            yield this.nodeManager.resetAnalysisSubNodes(analysisNode);
            // ── 3. Recreate mandatory sub-nodes, then anchor / workflows / triggers ──
            yield this.nodeManager.addMandatorySubNodes(analysisNode, contextNode);
            yield this.populateAnalysis(analysisNode, contextNode, config);
            // ── 4. Bump the revision so the organ re-assesses this analysis ──
            this.nodeManager.setLastUpdate(analysisNode);
            (0, utils_1.logMessage)(`[AnalysisFactory] Analysis "${config.analysisName}" fully updated`);
            return analysisNode;
        });
    }
    /**
     * Partially updates an analysis's scalar metadata — name, description, concurrency
     * and/or status — without touching its workflows, anchor or triggers. Only the
     * fields present in `patch` are applied (a PATCH, unlike updateFromJSON's full replace).
     *
     * Deliberately does NOT bump the revision (setLastUpdate): none of these fields require
     * the organ to rebuild triggers/bindings — status is handled by the organ's active-gate,
     * and concurrency is read fresh on each execution. Bumping would force a needless re-setup.
     *
     * @param analysisNode - The existing analysis node to patch
     * @param patch - The subset of metadata fields to change
     * @returns The same analysis node, updated
     */
    patchAnalysis(analysisNode, patch) {
        return __awaiter(this, void 0, void 0, function* () {
            // ── Validate only the provided fields ──
            const errors = [];
            if (patch.analysisName !== undefined && (typeof patch.analysisName !== 'string' || patch.analysisName.trim() === '')) {
                errors.push('analysisName: must be a non-empty string');
            }
            if (patch.description !== undefined && typeof patch.description !== 'string') {
                errors.push('description: must be a string');
            }
            if (patch.concurrency !== undefined) {
                errors.push(...this.validateConcurrency(patch.concurrency));
            }
            if (patch.status !== undefined && patch.status !== 'Active' && patch.status !== 'Inactive') {
                errors.push('status: must be either "Active" or "Inactive"');
            }
            if (errors.length > 0) {
                throw new Error(`[AnalysisFactory] Invalid patch for "${analysisNode.getName().get()}": \n` +
                    errors.map((e) => `  - ${e}`).join('\n'));
            }
            // ── Apply only the provided fields ──
            if (patch.analysisName !== undefined) {
                analysisNode.info.name.set(patch.analysisName);
            }
            if (patch.description !== undefined) {
                if (analysisNode.info.description) {
                    analysisNode.info.description.set(patch.description);
                }
                else {
                    analysisNode.info.add_attr('description', patch.description);
                }
            }
            if (patch.concurrency !== undefined) {
                yield this.nodeManager.setConcurrencyConfig(analysisNode, patch.concurrency);
            }
            if (patch.status !== undefined) {
                yield this.nodeManager.setStatus(analysisNode, patch.status);
            }
            (0, utils_1.logMessage)(`[AnalysisFactory] Analysis "${analysisNode.getName().get()}" patched`);
            return analysisNode;
        });
    }
    /**
     * Links the anchor target, builds the three workflow DAGs, and stores the
     * trigger configs from a config object onto an analysis node whose mandatory
     * sub-nodes already exist. Shared by createFromJSON and updateFromJSON.
     */
    populateAnalysis(analysisNode, contextNode, config) {
        return __awaiter(this, void 0, void 0, function* () {
            // ── Link anchor to target node ──
            if (config.anchorNodeId) {
                yield this.linkAnchorTarget(analysisNode, config.anchorNodeId, contextNode);
                (0, utils_1.logMessage)(`[AnalysisFactory] Anchor linked to node: ${config.anchorNodeId}`);
            }
            // ── Build workflow DAGs ──
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
            // ── Store trigger configurations ──
            if (config.triggers && config.triggers.length > 0) {
                yield this.storeTriggerConfig(analysisNode, config.triggers);
                (0, utils_1.logMessage)(`[AnalysisFactory] Trigger config stored (${config.triggers.length} trigger(s))`);
            }
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
                    // Build final ordered list: for each slot, use the '$node' ID or the
                    // already-wired ID. addDependency() inserts each real input at its real
                    // slot index (padding earlier slots with ''), so currentIds is already
                    // slot-aligned — read it by the actual slot, not a compacted counter.
                    const finalIds = [];
                    for (let slot = 0; slot < blockDef.inputs.length; slot++) {
                        if (blockDef.inputs[slot] === '$node') {
                            finalIds.push(WorkflowExecutionService_1.WORK_NODE_RESERVED_ID);
                        }
                        else {
                            finalIds.push((_g = currentIds[slot]) !== null && _g !== void 0 ? _g : '');
                        }
                    }
                    dependentNode.info.inputBlockIds.set(JSON.stringify(finalIds));
                }
            }
            // ── Phase 3: Wire order-only dependencies (`after`) ──
            this.wireAfter(workflowConfig.blocks, 'workflow', refToNode);
        });
    }
    /**
     * Resolves the order-only dependencies (`after`) of each block to block IDs and
     * stores them. Order-only deps gate execution but pass no data, so — unlike inputs —
     * they add no graph edge and no input slot; they only widen the topological sort.
     */
    wireAfter(blocks, scope, refToNode, parentRefToNode, knownItemRefs) {
        for (const blockDef of blocks) {
            if (!blockDef.after || blockDef.after.length === 0)
                continue;
            const dependentNode = refToNode.get(blockDef.ref);
            if (!dependentNode)
                continue;
            const orderIds = blockDef.after.map((ref) => this.resolveOrderRef(ref, blockDef.ref, scope, refToNode, parentRefToNode, knownItemRefs));
            this.blockManager.setOrderBlockIds(dependentNode, orderIds);
        }
    }
    /**
     * Resolves a single `after` ref to a block ID (or virtual ID for $node / itemRefs).
     * Virtual / parent IDs are always available before the block runs, so when they
     * fall outside the current DAG the topological sort simply skips them (a no-op).
     */
    resolveOrderRef(ref, ownRef, scope, refToNode, parentRefToNode, knownItemRefs) {
        if (ref === '$node')
            return WorkflowExecutionService_1.WORK_NODE_RESERVED_ID;
        const itemVirtual = this.resolveItemRef(ref, undefined, knownItemRefs);
        if (itemVirtual)
            return itemVirtual;
        const local = refToNode.get(ref);
        if (local)
            return local.getId().get();
        if (parentRefToNode) {
            const parent = parentRefToNode.get(ref);
            if (parent)
                return parent.getId().get();
        }
        throw new Error(`[AnalysisFactory] ${scope} block "${ownRef}" has an "after" ref "${ref}" that does not ` +
            'resolve to a known block, itemRef, or "$node".');
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
                    // '$node' is the implicit work node — pre-seeded at runtime under
                    // WORK_NODE_RESERVED_ID, so it needs no graph edge.
                    if (sourceRef === '$node') {
                        finalIds.push(WorkflowExecutionService_1.WORK_NODE_RESERVED_ID);
                        continue;
                    }
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
            // Wire order-only dependencies (`after`) for the sub-blocks.
            this.wireAfter(subWorkflowConfig.blocks, 'FOREACH', refToNode, parentRefToNode, knownItemRefs);
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
                    // '$node' is the implicit work node — pre-seeded at runtime under
                    // WORK_NODE_RESERVED_ID, so it needs no graph edge.
                    if (sourceRef === '$node') {
                        finalIds.push(WorkflowExecutionService_1.WORK_NODE_RESERVED_ID);
                        continue;
                    }
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
            // Wire order-only dependencies (`after`) for the branch sub-blocks.
            this.wireAfter(subWorkflowConfig.blocks, 'IF', refToNode, parentRefToNode, knownItemRefs);
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
    // ─────────────────────────────────────────────────────
    //  VALIDATION
    // ─────────────────────────────────────────────────────
    /**
     * Validates a workflow config (top-level: worknodeResolver, inputWorkflow, executionWorkflow).
     */
    validateWorkflow(workflow, path, parentItemRefs) {
        const errors = [];
        if (!workflow.blocks || !Array.isArray(workflow.blocks)) {
            errors.push(`${path}: "blocks" must be an array`);
            return errors;
        }
        const refs = new Set();
        const knownItemRefs = new Set(parentItemRefs);
        // Collect all refs first (for forward-reference resolution)
        for (const block of workflow.blocks) {
            if (!block.ref) {
                errors.push(`${path}: block is missing "ref"`);
                continue;
            }
            if (refs.has(block.ref)) {
                errors.push(`${path}: duplicate block ref "${block.ref}"`);
            }
            refs.add(block.ref);
            if (block.algorithmName === 'FOREACH' && block.itemRef) {
                knownItemRefs.add(block.itemRef);
            }
        }
        // Validate each block
        for (const block of workflow.blocks) {
            if (!block.ref)
                continue;
            errors.push(...this.validateBlock(block, refs, knownItemRefs, `${path}.${block.ref}`));
        }
        return errors;
    }
    /**
     * Validates a single block definition.
     */
    validateBlock(block, availableRefs, knownItemRefs, path) {
        const errors = [];
        if (!block.algorithmName || typeof block.algorithmName !== 'string') {
            errors.push(`${path}: missing or invalid "algorithmName"`);
        }
        // Validate inputs
        if (block.inputs) {
            for (const inputRef of block.inputs) {
                if (inputRef === '$node')
                    continue;
                if (knownItemRefs.has(inputRef))
                    continue;
                if (availableRefs.has(inputRef))
                    continue;
                errors.push(`${path}: input "${inputRef}" does not resolve to a known block ref, itemRef, or "$node"`);
            }
            // Self-reference check
            if (block.inputs.includes(block.ref)) {
                errors.push(`${path}: block references itself`);
            }
        }
        // Validate order-only deps (`after`) — same ref rules as inputs
        if (block.after) {
            for (const afterRef of block.after) {
                if (afterRef === '$node')
                    continue;
                if (knownItemRefs.has(afterRef))
                    continue;
                if (availableRefs.has(afterRef))
                    continue;
                errors.push(`${path}: after "${afterRef}" does not resolve to a known block ref, itemRef, or "$node"`);
            }
            if (block.after.includes(block.ref)) {
                errors.push(`${path}: block lists itself in "after"`);
            }
        }
        // FOREACH validation
        if (block.algorithmName === 'FOREACH') {
            if (!block.itemRef) {
                errors.push(`${path}: FOREACH block must have "itemRef"`);
            }
            if (!block.subWorkflow) {
                errors.push(`${path}: FOREACH block must have "subWorkflow"`);
            }
            else {
                if (block.itemRef && availableRefs.has(block.itemRef)) {
                    errors.push(`${path}: itemRef "${block.itemRef}" conflicts with an existing block ref`);
                }
                errors.push(...this.validateSubWorkflow(block.subWorkflow, availableRefs, knownItemRefs, `${path}.subWorkflow`));
            }
        }
        // IF validation
        if (block.algorithmName === 'IF') {
            if (!block.inputs || block.inputs.length < 1) {
                errors.push(`${path}: IF block must have at least 1 input (the predicate)`);
            }
            if (!block.thenWorkflow && !block.elseWorkflow) {
                errors.push(`${path}: IF block must have at least "thenWorkflow" or "elseWorkflow"`);
            }
            if (block.thenWorkflow) {
                errors.push(...this.validateSubWorkflow(block.thenWorkflow, availableRefs, knownItemRefs, `${path}.thenWorkflow`));
            }
            if (block.elseWorkflow) {
                errors.push(...this.validateSubWorkflow(block.elseWorkflow, availableRefs, knownItemRefs, `${path}.elseWorkflow`));
            }
        }
        return errors;
    }
    /**
     * Validates a sub-workflow (FOREACH subWorkflow, IF thenWorkflow/elseWorkflow).
     * Sub-blocks can reference: local refs, parent refs, and known item refs.
     */
    validateSubWorkflow(subWorkflow, parentRefs, parentItemRefs, path) {
        const errors = [];
        if (!subWorkflow.blocks || !Array.isArray(subWorkflow.blocks)) {
            errors.push(`${path}: "blocks" must be an array`);
            return errors;
        }
        if (!subWorkflow.outputRef) {
            errors.push(`${path}: missing "outputRef"`);
        }
        const localRefs = new Set();
        const knownItemRefs = new Set(parentItemRefs);
        // Collect local refs and nested itemRefs
        for (const block of subWorkflow.blocks) {
            if (!block.ref) {
                errors.push(`${path}: block is missing "ref"`);
                continue;
            }
            if (localRefs.has(block.ref)) {
                errors.push(`${path}: duplicate block ref "${block.ref}"`);
            }
            localRefs.add(block.ref);
            if (block.algorithmName === 'FOREACH' && block.itemRef) {
                knownItemRefs.add(block.itemRef);
            }
        }
        // Validate outputRef
        if (subWorkflow.outputRef && !localRefs.has(subWorkflow.outputRef)) {
            errors.push(`${path}: outputRef "${subWorkflow.outputRef}" does not match any block ref`);
        }
        // All resolvable refs: local + parent blocks + item refs
        const allRefs = new Set([...localRefs, ...parentRefs]);
        // Validate each block
        for (const block of subWorkflow.blocks) {
            if (!block.ref)
                continue;
            errors.push(...this.validateBlock(block, allRefs, knownItemRefs, `${path}.${block.ref}`));
        }
        return errors;
    }
    /**
     * Validates trigger configurations.
     */
    validateTriggers(triggers) {
        const errors = [];
        for (let i = 0; i < triggers.length; i++) {
            const trigger = triggers[i];
            const path = `triggers[${i}]`;
            if (!trigger.type) {
                errors.push(`${path}: missing "type"`);
                continue;
            }
            if (trigger.type === 'INTERVAL_TIME') {
                const interval = typeof trigger.intervalTimeMs === 'number'
                    ? trigger.intervalTimeMs
                    : typeof trigger.value === 'number'
                        ? trigger.value
                        : undefined;
                if (typeof interval !== 'number' || interval <= 0) {
                    errors.push(`${path}: INTERVAL_TIME requires "intervalTimeMs" > 0`);
                }
            }
            if (trigger.type === 'CRON') {
                const cron = typeof trigger.cronExpression === 'string'
                    ? trigger.cronExpression
                    : typeof trigger.value === 'string'
                        ? trigger.value
                        : undefined;
                if (typeof cron !== 'string' || cron.trim().length === 0) {
                    errors.push(`${path}: CRON requires non-empty "cronExpression"`);
                }
            }
            if (trigger.type === 'COV') {
                if (typeof trigger.inputRegister !== 'string' || trigger.inputRegister.trim().length === 0) {
                    errors.push(`${path}: COV requires non-empty "inputRegister"`);
                }
                if (trigger.threshold !== undefined && typeof trigger.threshold !== 'number') {
                    errors.push(`${path}: COV "threshold" must be a number when provided`);
                }
            }
        }
        return errors;
    }
    // ─────────────────────────────────────────────────────
    //  TRIGGER CONFIGURATION
    // ─────────────────────────────────────────────────────
    /**
     * Stores trigger configurations as an attribute on the analysis trigger node.
     */
    storeTriggerConfig(analysisNode, triggers) {
        return __awaiter(this, void 0, void 0, function* () {
            const triggerNode = yield this.nodeManager.getAnalysisTriggerNode(analysisNode);
            yield spinal_env_viewer_plugin_documentation_service_1.attributeService.createOrUpdateAttrsAndCategories(triggerNode, 'triggerConfig', { triggers: JSON.stringify(triggers) });
        });
    }
}
exports.default = AnalysisFactoryService;
//# sourceMappingURL=AnalysisFactoryService.js.map