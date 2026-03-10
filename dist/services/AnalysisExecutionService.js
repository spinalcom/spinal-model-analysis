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
const analysisAnchor_1 = require("../constants/analysisAnchor");
const WorkflowBlockManagerService_1 = require("./WorkflowBlockManagerService");
const WorkflowExecutionService_1 = require("./WorkflowExecutionService");
const utils_1 = require("./utils");
/**
 * Orchestrates the full analysis execution pipeline:
 *
 * 1. **Anchor Resolution** — Retrieve the target node linked to the analysis anchor
 * 2. **Worknode Resolution** — Run the worknode resolver workflow DAG on the anchor target
 *    to produce a list of work nodes (defaults to [targetNode] if no resolver blocks)
 * 3. **Per Work Node Execution** — For each work node:
 *    a. Run the **Input Workflow** DAG → populates named input registers (I0, I1, ...)
 *    b. Run the **Execution Workflow** DAG → performs the actual work, using input registers
 */
class AnalysisExecutionService {
    constructor(nodeManager, registry) {
        this.nodeManager = nodeManager;
        this.blockManager = new WorkflowBlockManagerService_1.default();
        this.executor = new WorkflowExecutionService_1.default(registry);
    }
    // ─────────────────────────────────────────────────────
    //  FULL PIPELINE
    // ─────────────────────────────────────────────────────
    /**
     * Executes the complete analysis pipeline for a given analysis node.
     *
     * @param analysisNode - The analysis SpinalNode containing anchor, workflows, etc.
     * @returns A summary of execution results per work node
     */
    executeAnalysis(analysisNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const analysisName = analysisNode.getName().get();
            (0, utils_1.logMessage)(`[AnalysisExecution] Starting analysis: ${analysisName}`);
            // ── Step 1: Resolve the anchor target node ──
            const targetNode = yield this.resolveAnchorTarget(analysisNode);
            (0, utils_1.logMessage)(`[AnalysisExecution] Anchor target resolved: ${targetNode.getName().get()}`);
            // ── Step 2: Resolve work nodes via the worknode resolver workflow ──
            const workNodes = yield this.resolveWorkNodes(analysisNode, targetNode);
            (0, utils_1.logMessage)(`[AnalysisExecution] Resolved ${workNodes.length} work node(s)`);
            // ── Step 3: Execute on each work node ──
            const results = [];
            for (const workNode of workNodes) {
                const workNodeName = workNode.getName().get();
                (0, utils_1.logMessage)(`[AnalysisExecution] Processing work node: ${workNodeName}`);
                try {
                    const inputRegisters = yield this.executeInputWorkflow(analysisNode, workNode);
                    (0, utils_1.logMessage)(`[AnalysisExecution] Input workflow complete. Registers: [${[
                        ...inputRegisters.keys(),
                    ].join(', ')}]`);
                    const executionOutputs = yield this.executeExecutionWorkflow(analysisNode, workNode, inputRegisters);
                    results.push({
                        workNodeId: workNode.getId().get(),
                        workNodeName,
                        success: true,
                        inputRegisters: Object.fromEntries(inputRegisters),
                        executionOutputs,
                    });
                    (0, utils_1.logMessage)(`[AnalysisExecution] Execution workflow complete for: ${workNodeName}`);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error(`[AnalysisExecution] Error on work node "${workNodeName}": ${errorMessage}`);
                    results.push({
                        workNodeId: workNode.getId().get(),
                        workNodeName,
                        success: false,
                        error: errorMessage,
                    });
                }
            }
            (0, utils_1.logMessage)(`[AnalysisExecution] Analysis complete: ${analysisName} — ` +
                `${results.filter((r) => r.success).length}/${results.length} succeeded`);
            return {
                analysisName,
                totalWorkNodes: workNodes.length,
                results,
            };
        });
    }
    // ─────────────────────────────────────────────────────
    //  STEP 1: ANCHOR RESOLUTION
    // ─────────────────────────────────────────────────────
    /**
     * Retrieves the target node linked to the analysis anchor.
     * The anchor node has exactly one child (the target) via ANCHOR_NODE_TO_LINKED_NODE_RELATION.
     */
    resolveAnchorTarget(analysisNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const anchorNode = yield this.nodeManager.getAnalysisAnchorNodeNode(analysisNode);
            const targets = yield anchorNode.getChildren(analysisAnchor_1.ANCHOR_NODE_TO_LINKED_NODE_RELATION);
            if (targets.length === 0) {
                throw new Error(`Analysis "${analysisNode.getName().get()}" anchor has no linked target node`);
            }
            return targets[0];
        });
    }
    // ─────────────────────────────────────────────────────
    //  STEP 2: WORKNODE RESOLUTION
    // ─────────────────────────────────────────────────────
    /**
     * Runs the worknode resolver workflow to transform the anchor target
     * into a list of work nodes.
     *
     * If the resolver workflow has no blocks, defaults to [targetNode].
     */
    resolveWorkNodes(analysisNode, targetNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const resolverNode = yield this.nodeManager.getAnalysisWorknodeResolverNode(analysisNode);
            const dag = yield this.blockManager.loadWorkflowDAG(resolverNode);
            // No resolver blocks → work on the target node itself
            if (dag.blocks.length === 0) {
                return [targetNode];
            }
            const context = {
                workNode: targetNode,
                inputRegisters: new Map(),
                blockOutputs: new Map(),
            };
            yield this.executor.executeDAG(dag, context);
            // Get the output of the leaf block(s) — the final result
            const leafBlock = this.findLeafBlock(dag.blocks);
            const result = context.blockOutputs.get(leafBlock.id);
            if (Array.isArray(result)) {
                return result;
            }
            if (result && typeof result === 'object') {
                return [result];
            }
            // Fallback: just the target node
            return [targetNode];
        });
    }
    // ─────────────────────────────────────────────────────
    //  STEP 3a: INPUT WORKFLOW
    // ─────────────────────────────────────────────────────
    /**
     * Runs the input workflow DAG on a work node.
     * The input workflow populates named input registers (I0, I1, ...)
     * that become available in the execution workflow.
     *
     * @returns The populated input registers map
     */
    executeInputWorkflow(analysisNode, workNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputNode = yield this.nodeManager.getAnalysisInputNode(analysisNode);
            const dag = yield this.blockManager.loadWorkflowDAG(inputNode);
            if (dag.blocks.length === 0) {
                return new Map();
            }
            const context = {
                workNode,
                inputRegisters: new Map(),
                blockOutputs: new Map(),
            };
            yield this.executor.executeDAG(dag, context);
            return context.inputRegisters;
        });
    }
    // ─────────────────────────────────────────────────────
    //  STEP 3b: EXECUTION WORKFLOW
    // ─────────────────────────────────────────────────────
    /**
     * Runs the execution workflow DAG on a work node.
     * Has access to the input registers populated during the input workflow.
     *
     * @returns A record of block outputs keyed by block name (ref)
     */
    executeExecutionWorkflow(analysisNode, workNode, inputRegisters) {
        return __awaiter(this, void 0, void 0, function* () {
            const workflowNode = yield this.nodeManager.getAnalysisExecutionWorkflowNode(analysisNode);
            const dag = yield this.blockManager.loadWorkflowDAG(workflowNode);
            if (dag.blocks.length === 0) {
                return {};
            }
            const context = {
                workNode,
                inputRegisters,
                blockOutputs: new Map(),
            };
            yield this.executor.executeDAG(dag, context);
            // Convert ID-keyed blockOutputs to name-keyed results
            return this.mapBlockOutputsByName(dag.blocks, context.blockOutputs);
        });
    }
    // ─────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────
    /**
     * Finds the leaf block in a DAG — the block that no other block depends on.
     * If multiple leaves exist, returns the last one in the blocks array.
     */
    findLeafBlock(blocks) {
        // Collect all block IDs that are depended on (appear in other blocks' inputBlockIds)
        const dependedOnIds = new Set();
        for (const block of blocks) {
            for (const depId of block.inputBlockIds) {
                dependedOnIds.add(depId);
            }
        }
        // A leaf block is one that nothing depends on
        const leaves = blocks.filter((b) => !dependedOnIds.has(b.id));
        if (leaves.length === 0) {
            throw new Error('No leaf block found in workflow DAG — all blocks are depended on (possible cycle?)');
        }
        return leaves[leaves.length - 1];
    }
    /**
     * Converts ID-keyed blockOutputs into a name-keyed record.
     * Skips internal entries like __WORK_NODE__.
     */
    mapBlockOutputsByName(blocks, blockOutputs) {
        const idToName = new Map();
        for (const block of blocks) {
            idToName.set(block.id, block.name);
        }
        const result = {};
        for (const [id, value] of blockOutputs.entries()) {
            const name = idToName.get(id);
            if (name) {
                result[name] = value;
            }
            // Skip __WORK_NODE__ and other internal entries
        }
        return result;
    }
}
exports.default = AnalysisExecutionService;
//# sourceMappingURL=AnalysisExecutionService.js.map