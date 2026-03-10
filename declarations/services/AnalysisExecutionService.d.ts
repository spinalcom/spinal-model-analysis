import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { AlgorithmRegistry } from '../algorithms/definitions/core';
import AnalyticNodeManagerService from './AnalyticNodeManagerService';
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
    private readonly nodeManager;
    private readonly blockManager;
    private readonly executor;
    constructor(nodeManager: AnalyticNodeManagerService, registry: AlgorithmRegistry);
    /**
     * Executes the complete analysis pipeline for a given analysis node.
     *
     * @param analysisNode - The analysis SpinalNode containing anchor, workflows, etc.
     * @returns A summary of execution results per work node
     */
    executeAnalysis(analysisNode: SpinalNode<any>): Promise<AnalysisExecutionResult>;
    /**
     * Retrieves the target node linked to the analysis anchor.
     * The anchor node has exactly one child (the target) via ANCHOR_NODE_TO_LINKED_NODE_RELATION.
     */
    private resolveAnchorTarget;
    /**
     * Runs the worknode resolver workflow to transform the anchor target
     * into a list of work nodes.
     *
     * If the resolver workflow has no blocks, defaults to [targetNode].
     */
    private resolveWorkNodes;
    /**
     * Runs the input workflow DAG on a work node.
     * The input workflow populates named input registers (I0, I1, ...)
     * that become available in the execution workflow.
     *
     * @returns The populated input registers map
     */
    private executeInputWorkflow;
    /**
     * Runs the execution workflow DAG on a work node.
     * Has access to the input registers populated during the input workflow.
     *
     * @returns A record of block outputs keyed by block name (ref)
     */
    private executeExecutionWorkflow;
    /**
     * Finds the leaf block in a DAG — the block that no other block depends on.
     * If multiple leaves exist, returns the last one in the blocks array.
     */
    private findLeafBlock;
    /**
     * Converts ID-keyed blockOutputs into a name-keyed record.
     * Skips internal entries like __WORK_NODE__.
     */
    private mapBlockOutputsByName;
}
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
    executionOutputs?: Record<string, unknown>;
    error?: string;
}
