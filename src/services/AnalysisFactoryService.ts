/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    SpinalGraphService,
    SpinalNode,
    SPINAL_RELATION_PTR_LST_TYPE,
} from 'spinal-env-viewer-graph-service';

import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import WorkflowBlockManagerService from './WorkflowBlockManagerService';
import {
    IAnalysisConfigJSON,
    IWorkflowConfigJSON,
    IBlockConfigJSON,
} from '../interfaces/IAnalysisConfigJSON';
import { ANCHOR_NODE_TO_LINKED_NODE_RELATION } from '../constants/analysisAnchor';
import { logMessage } from './utils';

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
export default class AnalysisFactoryService {
    private readonly nodeManager: AnalyticNodeManagerService;
    private readonly blockManager: WorkflowBlockManagerService;

    constructor(
        nodeManager: AnalyticNodeManagerService,
        blockManager: WorkflowBlockManagerService
    ) {
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
    public async createFromJSON(
        config: IAnalysisConfigJSON
    ): Promise<SpinalNode<any>> {
        logMessage(`[AnalysisFactory] Creating analysis: ${config.analysisName}`);

        // ── 1. Create or get context ──
        const contextNode = await this.nodeManager.createContext(
            config.contextName
        );
        logMessage(`[AnalysisFactory] Context: ${config.contextName}`);

        // ── 2. Create analysis node (creates all mandatory sub-nodes) ──
        const analysisNode = await this.nodeManager.addAnalysisNode(
            config.analysisName,
            config.description ?? '',
            contextNode
        );
        logMessage(`[AnalysisFactory] Analysis node created: ${config.analysisName}`);

        // ── 3. Link anchor to target node ──
        if (config.anchorNodeId) {
            await this.linkAnchorTarget(analysisNode, config.anchorNodeId, contextNode);
            logMessage(`[AnalysisFactory] Anchor linked to node: ${config.anchorNodeId}`);
        }

        // ── 4. Build workflow DAGs ──
        if (config.worknodeResolver && config.worknodeResolver.blocks.length > 0) {
            const resolverNode =
                await this.nodeManager.getAnalysisWorknodeResolverNode(analysisNode);
            await this.buildWorkflow(resolverNode, contextNode, config.worknodeResolver);
            logMessage(`[AnalysisFactory] Worknode resolver workflow created (${config.worknodeResolver.blocks.length} blocks)`);
        }

        if (config.inputWorkflow && config.inputWorkflow.blocks.length > 0) {
            const inputNode =
                await this.nodeManager.getAnalysisInputNode(analysisNode);
            await this.buildWorkflow(inputNode, contextNode, config.inputWorkflow);
            logMessage(`[AnalysisFactory] Input workflow created (${config.inputWorkflow.blocks.length} blocks)`);
        }

        if (config.executionWorkflow && config.executionWorkflow.blocks.length > 0) {
            const executionNode =
                await this.nodeManager.getAnalysisExecutionWorkflowNode(analysisNode);
            await this.buildWorkflow(executionNode, contextNode, config.executionWorkflow);
            logMessage(`[AnalysisFactory] Execution workflow created (${config.executionWorkflow.blocks.length} blocks)`);
        }

        logMessage(`[AnalysisFactory] Analysis "${config.analysisName}" fully created`);
        return analysisNode;
    }

    // ─────────────────────────────────────────────────────
    //  ANCHOR LINKING
    // ─────────────────────────────────────────────────────

    /**
     * Links the analysis anchor node to the target node in the database.
     */
    private async linkAnchorTarget(
        analysisNode: SpinalNode<any>,
        targetNodeId: string,
        contextNode: SpinalNode<any>
    ): Promise<void> {
        const anchorNode =
            await this.nodeManager.getAnalysisAnchorNodeNode(analysisNode);

        // Try to find the target node by ID
        let targetNode = SpinalGraphService.getRealNode(targetNodeId);

        if (!targetNode) {
            throw new Error(
                `[AnalysisFactory] Target node "${targetNodeId}" not found in graph. ` +
                'Make sure the node is loaded in SpinalGraphService before creating the analysis.'
            );
        }

        await anchorNode.addChildInContext(
            targetNode,
            ANCHOR_NODE_TO_LINKED_NODE_RELATION,
            SPINAL_RELATION_PTR_LST_TYPE,
            contextNode
        );
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
    private async buildWorkflow(
        workflowNode: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        workflowConfig: IWorkflowConfigJSON
    ): Promise<void> {
        // Map of ref → created SpinalNode
        const refToNode = new Map<string, SpinalNode<any>>();

        // ── Phase 1: Create all block nodes (all as root children initially) ──
        for (const blockDef of workflowConfig.blocks) {
            const blockNode = await this.blockManager.createBlock(
                workflowNode,
                contextNode,
                blockDef.algorithmName,
                blockDef.parameters ?? {},
                {
                    name: blockDef.name,
                    registerAs: blockDef.registerAs,
                }
            );

            refToNode.set(blockDef.ref, blockNode);

            // If this is a FOREACH block with a sub-workflow, build it
            if (blockDef.algorithmName === 'FOREACH' && blockDef.subWorkflow) {
                await this.buildForeachSubWorkflow(
                    blockNode,
                    contextNode,
                    blockDef.subWorkflow
                );
            }
        }

        // ── Phase 2: Wire dependencies ──
        for (const blockDef of workflowConfig.blocks) {
            if (!blockDef.inputs || blockDef.inputs.length === 0) continue;

            const dependentNode = refToNode.get(blockDef.ref);
            if (!dependentNode) continue;

            for (let slot = 0; slot < blockDef.inputs.length; slot++) {
                const sourceRef = blockDef.inputs[slot];
                const sourceNode = refToNode.get(sourceRef);
                if (!sourceNode) {
                    throw new Error(
                        `[AnalysisFactory] Block "${blockDef.ref}" references input "${sourceRef}" ` +
                        'which does not exist. Check your workflow block refs.'
                    );
                }

                await this.blockManager.addDependency(
                    sourceNode,
                    dependentNode,
                    contextNode,
                    slot
                );
            }
        }
    }

    /**
     * Builds the sub-workflow for a FOREACH block.
     */
    private async buildForeachSubWorkflow(
        foreachNode: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        subWorkflowConfig: { blocks: IBlockConfigJSON[]; outputRef: string }
    ): Promise<void> {
        const refToNode = new Map<string, SpinalNode<any>>();

        // Phase 1: Create sub-blocks
        for (const blockDef of subWorkflowConfig.blocks) {
            const subBlockNode = await this.blockManager.createForeachSubBlock(
                foreachNode,
                contextNode,
                blockDef.algorithmName,
                blockDef.parameters ?? {},
                {
                    name: blockDef.name,
                    registerAs: blockDef.registerAs,
                }
            );
            refToNode.set(blockDef.ref, subBlockNode);
        }

        // Phase 2: Wire dependencies between sub-blocks
        for (const blockDef of subWorkflowConfig.blocks) {
            if (!blockDef.inputs || blockDef.inputs.length === 0) continue;

            const dependentNode = refToNode.get(blockDef.ref);
            if (!dependentNode) continue;

            for (let slot = 0; slot < blockDef.inputs.length; slot++) {
                const sourceRef = blockDef.inputs[slot];
                const sourceNode = refToNode.get(sourceRef);
                if (!sourceNode) {
                    throw new Error(
                        `[AnalysisFactory] FOREACH sub-block "${blockDef.ref}" references input "${sourceRef}" ` +
                        'which does not exist in the sub-workflow.'
                    );
                }

                await this.blockManager.addSubBlockDependency(
                    sourceNode,
                    dependentNode,
                    contextNode,
                    slot
                );
            }
        }

        // Set the output block ID on the FOREACH node
        const outputRef = subWorkflowConfig.outputRef;
        const outputNode = refToNode.get(outputRef);
        if (!outputNode) {
            throw new Error(
                `[AnalysisFactory] FOREACH outputRef "${outputRef}" does not match any sub-block ref`
            );
        }

        this.blockManager.updateBlock(foreachNode, {
            foreachOutputBlockId: outputNode.getId().get(),
        });
    }
}
