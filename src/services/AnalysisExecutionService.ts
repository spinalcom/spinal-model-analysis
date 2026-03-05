/* eslint-disable @typescript-eslint/no-explicit-any */
import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { AlgorithmRegistry } from '../algorithms/definitions/core';
import { IWorkflowBlock } from '../interfaces/IWorkflowBlock';
import { ANCHOR_NODE_TO_LINKED_NODE_RELATION } from '../constants/analysisAnchor';
import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import WorkflowBlockManagerService from './WorkflowBlockManagerService';
import WorkflowExecutionService, {
    WorkflowExecutionContext,
} from './WorkflowExecutionService';
import { logMessage } from './utils';

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
export default class AnalysisExecutionService {
    private readonly nodeManager: AnalyticNodeManagerService;
    private readonly blockManager: WorkflowBlockManagerService;
    private readonly executor: WorkflowExecutionService;

    constructor(
        nodeManager: AnalyticNodeManagerService,
        registry: AlgorithmRegistry
    ) {
        this.nodeManager = nodeManager;
        this.blockManager = new WorkflowBlockManagerService();
        this.executor = new WorkflowExecutionService(registry);
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
    public async executeAnalysis(
        analysisNode: SpinalNode<any>
    ): Promise<AnalysisExecutionResult> {
        const analysisName = analysisNode.getName().get();
        logMessage(`[AnalysisExecution] Starting analysis: ${analysisName}`);

        // ── Step 1: Resolve the anchor target node ──
        const targetNode = await this.resolveAnchorTarget(analysisNode);
        logMessage(
            `[AnalysisExecution] Anchor target resolved: ${targetNode.getName().get()}`
        );

        // ── Step 2: Resolve work nodes via the worknode resolver workflow ──
        const workNodes = await this.resolveWorkNodes(analysisNode, targetNode);
        logMessage(
            `[AnalysisExecution] Resolved ${workNodes.length} work node(s)`
        );

        // ── Step 3: Execute on each work node ──
        const results: WorkNodeExecutionResult[] = [];

        for (const workNode of workNodes) {
            const workNodeName = workNode.getName().get();
            logMessage(
                `[AnalysisExecution] Processing work node: ${workNodeName}`
            );

            try {
                const inputRegisters = await this.executeInputWorkflow(
                    analysisNode,
                    workNode
                );

                logMessage(
                    `[AnalysisExecution] Input workflow complete. Registers: [${[
                        ...inputRegisters.keys(),
                    ].join(', ')}]`
                );

                const executionOutputs = await this.executeExecutionWorkflow(
                    analysisNode,
                    workNode,
                    inputRegisters
                );

                results.push({
                    workNodeId: workNode.getId().get(),
                    workNodeName,
                    success: true,
                    inputRegisters: Object.fromEntries(inputRegisters),
                    executionOutputs,
                });

                logMessage(
                    `[AnalysisExecution] Execution workflow complete for: ${workNodeName}`
                );
            } catch (error: any) {
                const errorMessage =
                    error instanceof Error ? error.message : String(error);
                console.error(
                    `[AnalysisExecution] Error on work node "${workNodeName}": ${errorMessage}`
                );

                results.push({
                    workNodeId: workNode.getId().get(),
                    workNodeName,
                    success: false,
                    error: errorMessage,
                });
            }
        }

        logMessage(
            `[AnalysisExecution] Analysis complete: ${analysisName} — ` +
            `${results.filter((r) => r.success).length}/${results.length} succeeded`
        );

        return {
            analysisName,
            totalWorkNodes: workNodes.length,
            results,
        };
    }

    // ─────────────────────────────────────────────────────
    //  STEP 1: ANCHOR RESOLUTION
    // ─────────────────────────────────────────────────────

    /**
     * Retrieves the target node linked to the analysis anchor.
     * The anchor node has exactly one child (the target) via ANCHOR_NODE_TO_LINKED_NODE_RELATION.
     */
    private async resolveAnchorTarget(
        analysisNode: SpinalNode<any>
    ): Promise<SpinalNode<any>> {
        const anchorNode =
            await this.nodeManager.getAnalysisAnchorNodeNode(analysisNode);

        const targets = await anchorNode.getChildren(
            ANCHOR_NODE_TO_LINKED_NODE_RELATION
        );

        if (targets.length === 0) {
            throw new Error(
                `Analysis "${analysisNode.getName().get()}" anchor has no linked target node`
            );
        }

        return targets[0];
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
    private async resolveWorkNodes(
        analysisNode: SpinalNode<any>,
        targetNode: SpinalNode<any>
    ): Promise<SpinalNode<any>[]> {
        const resolverNode =
            await this.nodeManager.getAnalysisWorknodeResolverNode(analysisNode);

        const dag = await this.blockManager.loadWorkflowDAG(resolverNode);

        // No resolver blocks → work on the target node itself
        if (dag.blocks.length === 0) {
            return [targetNode];
        }

        const context: WorkflowExecutionContext = {
            workNode: targetNode,
            inputRegisters: new Map(),
            blockOutputs: new Map(),
        };

        await this.executor.executeDAG(dag, context);

        // Get the output of the leaf block(s) — the final result
        const leafBlock = this.findLeafBlock(dag.blocks);
        const result = context.blockOutputs.get(leafBlock.id);

        if (Array.isArray(result)) {
            return result as SpinalNode<any>[];
        }
        if (result && typeof result === 'object') {
            return [result as SpinalNode<any>];
        }

        // Fallback: just the target node
        return [targetNode];
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
    private async executeInputWorkflow(
        analysisNode: SpinalNode<any>,
        workNode: SpinalNode<any>
    ): Promise<Map<string, unknown>> {
        const inputNode =
            await this.nodeManager.getAnalysisInputNode(analysisNode);

        const dag = await this.blockManager.loadWorkflowDAG(inputNode);

        if (dag.blocks.length === 0) {
            return new Map();
        }

        const context: WorkflowExecutionContext = {
            workNode,
            inputRegisters: new Map(),
            blockOutputs: new Map(),
        };

        await this.executor.executeDAG(dag, context);

        return context.inputRegisters;
    }

    // ─────────────────────────────────────────────────────
    //  STEP 3b: EXECUTION WORKFLOW
    // ─────────────────────────────────────────────────────

    /**
     * Runs the execution workflow DAG on a work node.
     * Has access to the input registers populated during the input workflow.
     *
     * @returns A map of all block outputs (keyed by block ID)
     */
    private async executeExecutionWorkflow(
        analysisNode: SpinalNode<any>,
        workNode: SpinalNode<any>,
        inputRegisters: Map<string, unknown>
    ): Promise<Map<string, unknown>> {
        const workflowNode =
            await this.nodeManager.getAnalysisExecutionWorkflowNode(analysisNode);

        const dag = await this.blockManager.loadWorkflowDAG(workflowNode);

        if (dag.blocks.length === 0) {
            return new Map();
        }

        const context: WorkflowExecutionContext = {
            workNode,
            inputRegisters,
            blockOutputs: new Map(),
        };

        await this.executor.executeDAG(dag, context);

        return context.blockOutputs;
    }

    // ─────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────

    /**
     * Finds the leaf block in a DAG — the block that no other block depends on.
     * If multiple leaves exist, returns the last one in the blocks array.
     */
    private findLeafBlock(blocks: IWorkflowBlock[]): IWorkflowBlock {
        // Collect all block IDs that are depended on (appear in other blocks' inputBlockIds)
        const dependedOnIds = new Set<string>();
        for (const block of blocks) {
            for (const depId of block.inputBlockIds) {
                dependedOnIds.add(depId);
            }
        }

        // A leaf block is one that nothing depends on
        const leaves = blocks.filter((b) => !dependedOnIds.has(b.id));

        if (leaves.length === 0) {
            throw new Error(
                'No leaf block found in workflow DAG — all blocks are depended on (possible cycle?)'
            );
        }

        return leaves[leaves.length - 1];
    }
}

// ─────────────────────────────────────────────────────
//  RESULT TYPES
// ─────────────────────────────────────────────────────

export interface AnalysisExecutionResult {
    analysisName: string;
    totalWorkNodes: number;
    results: WorkNodeExecutionResult[];
}

export interface WorkNodeExecutionResult {
    workNodeId: string;
    workNodeName: string;
    success: boolean;
    inputRegisters?: Record<string, unknown>;
    executionOutputs?: Map<string, unknown>;
    error?: string;
}
