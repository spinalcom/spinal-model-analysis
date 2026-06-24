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
    executeAnalysis(analysisNode, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const analysisName = analysisNode.getName().get();
            const execution = {
                referenceTime: (_a = metadata === null || metadata === void 0 ? void 0 : metadata.referenceTime) !== null && _a !== void 0 ? _a : Date.now(),
                trigger: metadata === null || metadata === void 0 ? void 0 : metadata.trigger,
            };
            (0, utils_1.logMessage)(`[AnalysisExecution] Starting analysis: ${analysisName}`);
            // ── Step 1: Resolve the anchor target node ──
            const targetNode = yield this.resolveAnchorTarget(analysisNode);
            (0, utils_1.logMessage)(`[AnalysisExecution] Anchor target resolved: ${targetNode.getName().get()}`);
            // ── Step 2: Resolve work nodes via the worknode resolver workflow ──
            const workNodes = yield this.resolveWorkNodes(analysisNode, targetNode, execution);
            (0, utils_1.logMessage)(`[AnalysisExecution] Resolved ${workNodes.length} work node(s)`);
            // ── Step 3: Execute on each work node (per the analysis concurrency config) ──
            const concurrency = yield this.nodeManager.getConcurrencyConfig(analysisNode);
            (0, utils_1.logMessage)(`[AnalysisExecution] Dispatching ${workNodes.length} work node(s) — ` +
                `concurrency: ${concurrency.mode}` +
                `${concurrency.mode === 'BOUNDED' ? ` (limit ${concurrency.limit})` : ''}`);
            const results = yield this.runWithConcurrency(workNodes, concurrency, (workNode) => this.executeOnWorkNode(analysisNode, workNode, execution));
            (0, utils_1.logMessage)(`[AnalysisExecution] Analysis complete: ${analysisName} — ` +
                `${results.filter((r) => r.success).length}/${results.length} succeeded`);
            return {
                analysisName,
                referenceTime: execution.referenceTime,
                trigger: execution.trigger,
                totalWorkNodes: workNodes.length,
                results,
            };
        });
    }
    /**
     * Dispatches a task over a list of items according to the resolved concurrency
     * strategy, preserving input order in the returned results array.
     *
     * - `SEQUENTIAL` — one at a time (awaits each before starting the next).
     * - `FULL`       — all at once (`limit` effectively = item count).
     * - `BOUNDED`    — a worker pool of at most `limit` in flight at any time.
     *
     * The task is expected to never reject (work-node execution catches its own
     * errors and reports them as results), so one bad item won't abort the batch.
     */
    runWithConcurrency(items, concurrency, task) {
        return __awaiter(this, void 0, void 0, function* () {
            if (items.length === 0)
                return [];
            if (concurrency.mode === 'SEQUENTIAL') {
                const out = [];
                for (let i = 0; i < items.length; i++) {
                    out.push(yield task(items[i], i));
                }
                return out;
            }
            // FULL = no cap (limit = item count); BOUNDED = clamp to [1, item count].
            const effectiveLimit = concurrency.mode === 'FULL'
                ? items.length
                : Math.max(1, Math.min(concurrency.limit, items.length));
            const results = new Array(items.length);
            let cursor = 0;
            const worker = () => __awaiter(this, void 0, void 0, function* () {
                for (;;) {
                    const index = cursor++;
                    if (index >= items.length)
                        return;
                    results[index] = yield task(items[index], index);
                }
            });
            yield Promise.all(Array.from({ length: effectiveLimit }, () => worker()));
            return results;
        });
    }
    /**
     * Executes the analysis pipeline for a single, already-resolved work node.
     *
     * Unlike {@link executeAnalysis}, this skips anchor resolution and the
     * worknode resolver entirely — the caller supplies the exact work node to
     * run on. This is what a COV trigger uses: when a bound model changes, only
     * the work node that owns that model should run, not every work node.
     *
     * @param analysisNode - The analysis SpinalNode
     * @param workNode - The specific work node to run the input + execution workflows on
     * @param metadata - Optional execution metadata (referenceTime, trigger info)
     */
    executeAnalysisForWorkNode(analysisNode, workNode, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const analysisName = analysisNode.getName().get();
            const execution = {
                referenceTime: (_a = metadata === null || metadata === void 0 ? void 0 : metadata.referenceTime) !== null && _a !== void 0 ? _a : Date.now(),
                trigger: metadata === null || metadata === void 0 ? void 0 : metadata.trigger,
            };
            (0, utils_1.logMessage)(`[AnalysisExecution] Starting single-work-node analysis: ${analysisName} ` +
                `on "${workNode.getName().get()}"`);
            const result = yield this.executeOnWorkNode(analysisNode, workNode, execution);
            return {
                analysisName,
                referenceTime: execution.referenceTime,
                trigger: execution.trigger,
                totalWorkNodes: 1,
                results: [result],
            };
        });
    }
    /**
     * Runs the input + execution workflows for one work node and reports the
     * outcome. Failures are caught and reported as an unsuccessful result rather
     * than thrown, so one bad work node never aborts the others.
     */
    executeOnWorkNode(analysisNode, workNode, execution) {
        return __awaiter(this, void 0, void 0, function* () {
            const workNodeName = workNode.getName().get();
            (0, utils_1.logMessage)(`[AnalysisExecution] Processing work node: ${workNodeName}`);
            try {
                const inputRegisters = yield this.executeInputWorkflow(analysisNode, workNode, execution);
                (0, utils_1.logMessage)(`[AnalysisExecution] Input workflow complete. Registers: [${[
                    ...inputRegisters.keys(),
                ].join(', ')}]`);
                const executionOutputs = yield this.executeExecutionWorkflow(analysisNode, workNode, inputRegisters, execution);
                (0, utils_1.logMessage)(`[AnalysisExecution] Execution workflow complete for: ${workNodeName}`);
                return {
                    workNodeId: workNode.getId().get(),
                    workNodeName,
                    success: true,
                    inputRegisters: Object.fromEntries(inputRegisters),
                    executionOutputs,
                };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`[AnalysisExecution] Error on work node "${workNodeName}": ${errorMessage}`);
                return {
                    workNodeId: workNode.getId().get(),
                    workNodeName,
                    success: false,
                    error: errorMessage,
                };
            }
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
    resolveWorkNodes(analysisNode, targetNode, execution) {
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
                execution,
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
    executeInputWorkflow(analysisNode, workNode, execution) {
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
                execution,
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
    executeExecutionWorkflow(analysisNode, workNode, inputRegisters, execution) {
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
                execution,
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