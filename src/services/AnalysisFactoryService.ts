/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    SpinalGraphService,
    SpinalNode,
    SPINAL_RELATION_PTR_LST_TYPE,
    SpinalGraph,
} from 'spinal-env-viewer-graph-service';

import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import WorkflowBlockManagerService from './WorkflowBlockManagerService';
import {
    IAnalysisConfigJSON,
    IWorkflowConfigJSON,
    IBlockConfigJSON,
} from '../interfaces/IAnalysisConfigJSON';
import { ANCHOR_NODE_TO_LINKED_NODE_RELATION } from '../constants/analysisAnchor';
import { WORK_NODE_RESERVED_ID, FOREACH_ELEMENT_RESERVED_ID } from './WorkflowExecutionService';
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
        config: IAnalysisConfigJSON,
        graph: SpinalGraph<any>
    ): Promise<SpinalNode<any>> {
        logMessage(`[AnalysisFactory] Creating analysis: ${config.analysisName}`);

        // ── 1. Create or get context ──
        const contextNode = await this.nodeManager.createContext(
            config.contextName,
            graph
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
    private async buildWorkflow(
        workflowNode: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        workflowConfig: IWorkflowConfigJSON
    ): Promise<void> {
        // Map of ref → created SpinalNode
        const refToNode = new Map<string, SpinalNode<any>>();

        // Determine which blocks are "root" (no real block inputs)
        // A block is root if it has no inputs, or all its inputs are '$node'
        const isRootBlock = (blockDef: IBlockConfigJSON): boolean => {
            if (!blockDef.inputs || blockDef.inputs.length === 0) return true;
            return blockDef.inputs.every((ref) => ref === '$node');
        };

        // ── Phase 1: Create block nodes ──
        // Root blocks → children of workflow node
        // Dependent blocks → orphans (will be parented in Phase 2)
        for (const blockDef of workflowConfig.blocks) {
            let blockNode: SpinalNode<any>;

            if (isRootBlock(blockDef)) {
                blockNode = await this.blockManager.createBlock(
                    workflowNode,
                    contextNode,
                    blockDef.algorithmName,
                    blockDef.parameters ?? {},
                    {
                        name: blockDef.name ?? blockDef.ref,
                        registerAs: blockDef.registerAs,
                    }
                );
            } else {
                blockNode = this.blockManager.createOrphanBlock(
                    blockDef.algorithmName,
                    blockDef.parameters ?? {},
                    {
                        name: blockDef.name ?? blockDef.ref,
                        registerAs: blockDef.registerAs,
                    }
                );
            }

            refToNode.set(blockDef.ref, blockNode);

            // If this is a FOREACH block with a sub-workflow, build it
            if (blockDef.algorithmName === 'FOREACH' && blockDef.subWorkflow) {
                await this.buildForeachSubWorkflow(
                    blockNode,
                    contextNode,
                    blockDef.subWorkflow
                );
            }

            // If this is an IF block with branch workflows, build them
            if (blockDef.algorithmName === 'IF') {
                if (blockDef.thenWorkflow) {
                    await this.buildIfSubWorkflow(
                        blockNode,
                        contextNode,
                        blockDef.thenWorkflow,
                        'then',
                        refToNode
                    );
                }
                if (blockDef.elseWorkflow) {
                    await this.buildIfSubWorkflow(
                        blockNode,
                        contextNode,
                        blockDef.elseWorkflow,
                        'else',
                        refToNode
                    );
                }
            }
        }

        // ── Phase 2: Wire dependencies ──
        for (const blockDef of workflowConfig.blocks) {
            if (!blockDef.inputs || blockDef.inputs.length === 0) continue;

            const dependentNode = refToNode.get(blockDef.ref);
            if (!dependentNode) continue;

            // Resolve '$node' refs to WORK_NODE_RESERVED_ID in inputBlockIds
            // but skip graph edges for '$node' (it's virtual)
            const resolvedInputBlockIds: string[] = [];

            for (let slot = 0; slot < blockDef.inputs.length; slot++) {
                const sourceRef = blockDef.inputs[slot];

                if (sourceRef === '$node') {
                    // Virtual reference — just record the reserved ID, no graph edge
                    resolvedInputBlockIds.push(WORK_NODE_RESERVED_ID);
                    continue;
                }

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

            // If there were '$node' refs, merge them into the inputBlockIds
            if (resolvedInputBlockIds.some((id) => id === WORK_NODE_RESERVED_ID)) {
                const currentIds = JSON.parse(
                    dependentNode.info.inputBlockIds?.get() ?? '[]'
                ) as string[];

                // Build final ordered list: for each slot, use the '$node' ID or the already-wired ID
                const finalIds: string[] = [];
                let wireIdx = 0;
                for (let slot = 0; slot < blockDef.inputs!.length; slot++) {
                    if (blockDef.inputs![slot] === '$node') {
                        finalIds.push(WORK_NODE_RESERVED_ID);
                    } else {
                        finalIds.push(currentIds[wireIdx] ?? '');
                        wireIdx++;
                    }
                }

                dependentNode.info.inputBlockIds.set(JSON.stringify(finalIds));
            }
        }
    }

    /**
     * Builds the sub-workflow for a FOREACH block.
     * The special ref '$item' maps to FOREACH_ELEMENT_RESERVED_ID and is auto-injected
     * at runtime — no explicit ELEMENT block is needed.
     */
    private async buildForeachSubWorkflow(
        foreachNode: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        subWorkflowConfig: { blocks: IBlockConfigJSON[]; outputRef: string }
    ): Promise<void> {
        const refToNode = new Map<string, SpinalNode<any>>();

        // Phase 1: Create sub-blocks (skip implicit ELEMENT blocks)
        for (const blockDef of subWorkflowConfig.blocks) {
            const subBlockNode = await this.blockManager.createForeachSubBlock(
                foreachNode,
                contextNode,
                blockDef.algorithmName,
                blockDef.parameters ?? {},
                {
                    name: blockDef.name ?? blockDef.ref,
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

            const resolvedInputBlockIds: string[] = [];

            for (let slot = 0; slot < blockDef.inputs.length; slot++) {
                const sourceRef = blockDef.inputs[slot];

                if (sourceRef === '$item') {
                    // Virtual reference to the implicit FOREACH element
                    resolvedInputBlockIds.push(FOREACH_ELEMENT_RESERVED_ID);
                    continue;
                }

                const sourceNode = refToNode.get(sourceRef);
                if (!sourceNode) {
                    throw new Error(
                        `[AnalysisFactory] FOREACH sub-block "${blockDef.ref}" references input "${sourceRef}" ` +
                        'which does not exist in the sub-workflow. Use "$item" to reference the current iteration element.'
                    );
                }

                await this.blockManager.addSubBlockDependency(
                    sourceNode,
                    dependentNode,
                    contextNode,
                    slot
                );
            }

            // If there were '$item' refs, merge them into the inputBlockIds
            if (resolvedInputBlockIds.some((id) => id === FOREACH_ELEMENT_RESERVED_ID)) {
                const currentIds = JSON.parse(
                    dependentNode.info.inputBlockIds?.get() ?? '[]'
                ) as string[];

                const finalIds: string[] = [];
                let wireIdx = 0;
                for (let slot = 0; slot < blockDef.inputs!.length; slot++) {
                    if (blockDef.inputs![slot] === '$item') {
                        finalIds.push(FOREACH_ELEMENT_RESERVED_ID);
                    } else {
                        finalIds.push(currentIds[wireIdx] ?? '');
                        wireIdx++;
                    }
                }

                dependentNode.info.inputBlockIds.set(JSON.stringify(finalIds));
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

    /**
     * Builds a sub-workflow for an IF block (then or else branch).
     *
     * IF sub-workflows can reference:
     * - '$item': the optional payload from inputs[1]
     * - '$node': the implicit work node
     * - Any ref from the parent workflow (resolved as a virtual input)
     * - Other sub-workflow block refs
     */
    private async buildIfSubWorkflow(
        ifNode: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        subWorkflowConfig: { blocks: IBlockConfigJSON[]; outputRef: string },
        branch: 'then' | 'else',
        parentRefToNode?: Map<string, SpinalNode<any>>
    ): Promise<void> {
        const refToNode = new Map<string, SpinalNode<any>>();

        // Track parent refs used by sub-blocks so we can add them as
        // dependencies of the IF block itself (ensures correct topological order)
        const usedParentRefs = new Set<string>();

        // Phase 1: Create sub-blocks
        for (const blockDef of subWorkflowConfig.blocks) {
            const subBlockNode = await this.blockManager.createIfSubBlock(
                ifNode,
                contextNode,
                blockDef.algorithmName,
                blockDef.parameters ?? {},
                branch,
                {
                    name: blockDef.name ?? blockDef.ref,
                    registerAs: blockDef.registerAs,
                }
            );
            refToNode.set(blockDef.ref, subBlockNode);
        }

        // Phase 2: Wire dependencies and build inputBlockIds
        for (const blockDef of subWorkflowConfig.blocks) {
            if (!blockDef.inputs || blockDef.inputs.length === 0) continue;

            const dependentNode = refToNode.get(blockDef.ref);
            if (!dependentNode) continue;

            const finalIds: string[] = [];

            for (const sourceRef of blockDef.inputs) {
                if (sourceRef === '$item') {
                    finalIds.push(FOREACH_ELEMENT_RESERVED_ID);
                    continue;
                }

                // Check local sub-workflow refs first
                const localNode = refToNode.get(sourceRef);
                if (localNode) {
                    // Create graph edge (no slot — we override inputBlockIds below)
                    await this.blockManager.addSubBlockDependency(
                        localNode,
                        dependentNode,
                        contextNode
                    );
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

                throw new Error(
                    `[AnalysisFactory] IF ${branch} sub-block "${blockDef.ref}" references input "${sourceRef}" ` +
                    'which does not exist in the sub-workflow or parent workflow.'
                );
            }

            // Set the correctly ordered inputBlockIds (overrides addSubBlockDependency side effects)
            dependentNode.info.inputBlockIds.set(JSON.stringify(finalIds));
        }

        // Set the output block ID on the IF node
        const outputRef = subWorkflowConfig.outputRef;
        const outputNode = refToNode.get(outputRef);
        if (!outputNode) {
            throw new Error(
                `[AnalysisFactory] IF ${branch} outputRef "${outputRef}" does not match any sub-block ref`
            );
        }

        const fieldName = branch === 'then' ? 'ifThenOutputBlockId' : 'ifElseOutputBlockId';
        this.blockManager.updateBlock(ifNode, {
            [fieldName]: outputNode.getId().get(),
        });

        // Ensure parent refs used by sub-blocks are also dependencies of the IF block.
        // This guarantees the topological sort places those parent blocks before IF.
        if (parentRefToNode && usedParentRefs.size > 0) {
            const ifInputBlockIds = JSON.parse(
                ifNode.info.inputBlockIds?.get() ?? '[]'
            ) as string[];

            for (const parentRef of usedParentRefs) {
                const parentNode = parentRefToNode.get(parentRef);
                if (!parentNode) continue;

                const parentId = parentNode.getId().get();
                if (!ifInputBlockIds.includes(parentId)) {
                    ifInputBlockIds.push(parentId);

                    // Add graph edge so loadWorkflowDAG can traverse it
                    await this.blockManager.addDependency(
                        parentNode,
                        ifNode,
                        contextNode
                    );
                }
            }

            ifNode.info.inputBlockIds.set(JSON.stringify(ifInputBlockIds));
        }
    }
}
