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
    createFromJSON(config) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (0, utils_1.logMessage)(`[AnalysisFactory] Creating analysis: ${config.analysisName}`);
            // ── 1. Create or get context ──
            const contextNode = yield this.nodeManager.createContext(config.contextName);
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
     * 1. Create all blocks as SpinalNodes (attached to the workflow node as root)
     * 2. Wire dependencies based on the `inputs` ref arrays
     *
     * @param workflowNode - The parent workflow SpinalNode (resolver, input, or execution)
     * @param contextNode - The analysis context
     * @param workflowConfig - The JSON workflow descriptor with block definitions
     */
    buildWorkflow(workflowNode, contextNode, workflowConfig) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Map of ref → created SpinalNode
            const refToNode = new Map();
            // ── Phase 1: Create all block nodes (all as root children initially) ──
            for (const blockDef of workflowConfig.blocks) {
                const blockNode = yield this.blockManager.createBlock(workflowNode, contextNode, blockDef.algorithmName, (_a = blockDef.parameters) !== null && _a !== void 0 ? _a : {}, {
                    name: blockDef.name,
                    registerAs: blockDef.registerAs,
                });
                refToNode.set(blockDef.ref, blockNode);
                // If this is a FOREACH block with a sub-workflow, build it
                if (blockDef.algorithmName === 'FOREACH' && blockDef.subWorkflow) {
                    yield this.buildForeachSubWorkflow(blockNode, contextNode, blockDef.subWorkflow);
                }
            }
            // ── Phase 2: Wire dependencies ──
            for (const blockDef of workflowConfig.blocks) {
                if (!blockDef.inputs || blockDef.inputs.length === 0)
                    continue;
                const dependentNode = refToNode.get(blockDef.ref);
                if (!dependentNode)
                    continue;
                for (let slot = 0; slot < blockDef.inputs.length; slot++) {
                    const sourceRef = blockDef.inputs[slot];
                    const sourceNode = refToNode.get(sourceRef);
                    if (!sourceNode) {
                        throw new Error(`[AnalysisFactory] Block "${blockDef.ref}" references input "${sourceRef}" ` +
                            'which does not exist. Check your workflow block refs.');
                    }
                    yield this.blockManager.addDependency(sourceNode, dependentNode, contextNode, slot);
                }
            }
        });
    }
    /**
     * Builds the sub-workflow for a FOREACH block.
     */
    buildForeachSubWorkflow(foreachNode, contextNode, subWorkflowConfig) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const refToNode = new Map();
            // Phase 1: Create sub-blocks
            for (const blockDef of subWorkflowConfig.blocks) {
                const subBlockNode = yield this.blockManager.createForeachSubBlock(foreachNode, contextNode, blockDef.algorithmName, (_a = blockDef.parameters) !== null && _a !== void 0 ? _a : {}, {
                    name: blockDef.name,
                    registerAs: blockDef.registerAs,
                });
                refToNode.set(blockDef.ref, subBlockNode);
            }
            // Phase 2: Wire dependencies between sub-blocks
            for (const blockDef of subWorkflowConfig.blocks) {
                if (!blockDef.inputs || blockDef.inputs.length === 0)
                    continue;
                const dependentNode = refToNode.get(blockDef.ref);
                if (!dependentNode)
                    continue;
                for (let slot = 0; slot < blockDef.inputs.length; slot++) {
                    const sourceRef = blockDef.inputs[slot];
                    const sourceNode = refToNode.get(sourceRef);
                    if (!sourceNode) {
                        throw new Error(`[AnalysisFactory] FOREACH sub-block "${blockDef.ref}" references input "${sourceRef}" ` +
                            'which does not exist in the sub-workflow.');
                    }
                    yield this.blockManager.addSubBlockDependency(sourceNode, dependentNode, contextNode, slot);
                }
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
}
exports.default = AnalysisFactoryService;
//# sourceMappingURL=AnalysisFactoryService.js.map