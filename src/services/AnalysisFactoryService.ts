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
    ITriggerConfigJSON,
    IConcurrencyConfig,
    ConcurrencyMode,
} from '../interfaces/IAnalysisConfigJSON';
import { ANCHOR_NODE_TO_LINKED_NODE_RELATION } from '../constants/analysisAnchor';
import { WORK_NODE_RESERVED_ID, foreachItemVirtualId } from './WorkflowExecutionService';
import { logMessage } from './utils';
import {
    attributeService,
} from 'spinal-env-viewer-plugin-documentation-service';

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
     * Validates a JSON config without touching the database.
     * Returns an array of error messages. Empty array = valid config.
     *
     * Call this before createFromJSON to avoid partial writes on invalid configs.
     */
    public validateConfig(config: IAnalysisConfigJSON): string[] {
        const errors: string[] = [];

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
    private validateConcurrency(concurrency: IConcurrencyConfig): string[] {
        const errors: string[] = [];
        const validModes: ConcurrencyMode[] = ['BOUNDED', 'FULL', 'SEQUENTIAL'];

        if (!concurrency || typeof concurrency !== 'object') {
            errors.push('concurrency: must be an object with a "mode" field');
            return errors;
        }
        if (!validModes.includes(concurrency.mode)) {
            errors.push(`concurrency.mode: must be one of ${validModes.join(', ')}`);
        }
        if (concurrency.limit !== undefined) {
            if (
                typeof concurrency.limit !== 'number' ||
                !Number.isFinite(concurrency.limit) ||
                concurrency.limit < 1 ||
                !Number.isInteger(concurrency.limit)
            ) {
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
    public async createFromJSON(
        config: IAnalysisConfigJSON,
        graph: SpinalGraph<any>
    ): Promise<SpinalNode<any>> {
        // Validate before touching the database
        const errors = this.validateConfig(config);
        if (errors.length > 0) {
            throw new Error(
                `[AnalysisFactory] Invalid config for "${config.analysisName ?? '(unnamed)'}": \n` +
                errors.map((e) => `  - ${e}`).join('\n')
            );
        }

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
            contextNode,
            config.concurrency,
            config.status
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

        // ── 5. Store trigger configurations ──
        if (config.triggers && config.triggers.length > 0) {
            await this.storeTriggerConfig(analysisNode, config.triggers);
            logMessage(`[AnalysisFactory] Trigger config stored (${config.triggers.length} trigger(s))`);
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
                if (!blockDef.itemRef) {
                    throw new Error(
                        `[AnalysisFactory] FOREACH block "${blockDef.ref}" is missing itemRef. ` +
                        'Each FOREACH must declare a named ref for its iteration element.'
                    );
                }
                // Store itemRef on the node
                this.blockManager.updateBlock(blockNode, {
                    foreachItemRef: blockDef.itemRef,
                });
                await this.buildForeachSubWorkflow(
                    blockNode,
                    contextNode,
                    blockDef.subWorkflow,
                    blockDef.itemRef,
                    refToNode,
                    new Set([blockDef.itemRef])
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
                        refToNode,
                        new Set()
                    );
                }
                if (blockDef.elseWorkflow) {
                    await this.buildIfSubWorkflow(
                        blockNode,
                        contextNode,
                        blockDef.elseWorkflow,
                        'else',
                        refToNode,
                        new Set()
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

                // Build final ordered list: for each slot, use the '$node' ID or the
                // already-wired ID. addDependency() inserts each real input at its real
                // slot index (padding earlier slots with ''), so currentIds is already
                // slot-aligned — read it by the actual slot, not a compacted counter.
                const finalIds: string[] = [];
                for (let slot = 0; slot < blockDef.inputs!.length; slot++) {
                    if (blockDef.inputs![slot] === '$node') {
                        finalIds.push(WORK_NODE_RESERVED_ID);
                    } else {
                        finalIds.push(currentIds[slot] ?? '');
                    }
                }

                dependentNode.info.inputBlockIds.set(JSON.stringify(finalIds));
            }
        }

        // ── Phase 3: Wire order-only dependencies (`after`) ──
        this.wireAfter(workflowConfig.blocks, 'workflow', refToNode);
    }

    /**
     * Resolves the order-only dependencies (`after`) of each block to block IDs and
     * stores them. Order-only deps gate execution but pass no data, so — unlike inputs —
     * they add no graph edge and no input slot; they only widen the topological sort.
     */
    private wireAfter(
        blocks: IBlockConfigJSON[],
        scope: 'workflow' | 'FOREACH' | 'IF',
        refToNode: Map<string, SpinalNode<any>>,
        parentRefToNode?: Map<string, SpinalNode<any>>,
        knownItemRefs?: Set<string>
    ): void {
        for (const blockDef of blocks) {
            if (!blockDef.after || blockDef.after.length === 0) continue;
            const dependentNode = refToNode.get(blockDef.ref);
            if (!dependentNode) continue;

            const orderIds = blockDef.after.map((ref) =>
                this.resolveOrderRef(ref, blockDef.ref, scope, refToNode, parentRefToNode, knownItemRefs)
            );
            this.blockManager.setOrderBlockIds(dependentNode, orderIds);
        }
    }

    /**
     * Resolves a single `after` ref to a block ID (or virtual ID for $node / itemRefs).
     * Virtual / parent IDs are always available before the block runs, so when they
     * fall outside the current DAG the topological sort simply skips them (a no-op).
     */
    private resolveOrderRef(
        ref: string,
        ownRef: string,
        scope: 'workflow' | 'FOREACH' | 'IF',
        refToNode: Map<string, SpinalNode<any>>,
        parentRefToNode?: Map<string, SpinalNode<any>>,
        knownItemRefs?: Set<string>
    ): string {
        if (ref === '$node') return WORK_NODE_RESERVED_ID;

        const itemVirtual = this.resolveItemRef(ref, undefined, knownItemRefs);
        if (itemVirtual) return itemVirtual;

        const local = refToNode.get(ref);
        if (local) return local.getId().get();

        if (parentRefToNode) {
            const parent = parentRefToNode.get(ref);
            if (parent) return parent.getId().get();
        }

        throw new Error(
            `[AnalysisFactory] ${scope} block "${ownRef}" has an "after" ref "${ref}" that does not ` +
            'resolve to a known block, itemRef, or "$node".'
        );
    }

    /**
     * Builds the sub-workflow for a FOREACH block.
     *
     * The FOREACH's `itemRef` is the name by which the iteration element is referenced.
     * Sub-blocks can reference it by name in their inputs.
     * `parentRefToNode` provides access to blocks defined in the parent workflow scope.
     */
    private async buildForeachSubWorkflow(
        foreachNode: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        subWorkflowConfig: { blocks: IBlockConfigJSON[]; outputRef: string },
        itemRef: string,
        parentRefToNode?: Map<string, SpinalNode<any>>,
        knownItemRefs: Set<string> = new Set()
    ): Promise<void> {
        const refToNode = new Map<string, SpinalNode<any>>();
        const itemVirtualId = foreachItemVirtualId(itemRef);

        // Phase 1: Create sub-blocks
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

            // Recursively build nested FOREACH sub-workflows
            if (blockDef.algorithmName === 'FOREACH' && blockDef.subWorkflow) {
                if (!blockDef.itemRef) {
                    throw new Error(
                        `[AnalysisFactory] FOREACH block "${blockDef.ref}" is missing itemRef.`
                    );
                }
                this.blockManager.updateBlock(subBlockNode, {
                    foreachItemRef: blockDef.itemRef,
                });
                const childItemRefs = new Set([...knownItemRefs, blockDef.itemRef]);
                await this.buildForeachSubWorkflow(
                    subBlockNode,
                    contextNode,
                    blockDef.subWorkflow,
                    blockDef.itemRef,
                    refToNode,
                    childItemRefs
                );
            }

            // Recursively build nested IF sub-workflows
            if (blockDef.algorithmName === 'IF') {
                if (blockDef.thenWorkflow) {
                    await this.buildIfSubWorkflow(
                        subBlockNode,
                        contextNode,
                        blockDef.thenWorkflow,
                        'then',
                        refToNode,
                        knownItemRefs
                    );
                }
                if (blockDef.elseWorkflow) {
                    await this.buildIfSubWorkflow(
                        subBlockNode,
                        contextNode,
                        blockDef.elseWorkflow,
                        'else',
                        refToNode,
                        knownItemRefs
                    );
                }
            }
        }

        // Phase 2: Wire dependencies and build inputBlockIds
        for (const blockDef of subWorkflowConfig.blocks) {
            if (!blockDef.inputs || blockDef.inputs.length === 0) continue;

            const dependentNode = refToNode.get(blockDef.ref);
            if (!dependentNode) continue;

            const finalIds: string[] = [];

            for (const sourceRef of blockDef.inputs) {
                // '$node' is the implicit work node — pre-seeded at runtime under
                // WORK_NODE_RESERVED_ID, so it needs no graph edge.
                if (sourceRef === '$node') {
                    finalIds.push(WORK_NODE_RESERVED_ID);
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
                    await this.blockManager.addSubBlockDependency(
                        localNode,
                        dependentNode,
                        contextNode
                    );
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

                throw new Error(
                    `[AnalysisFactory] FOREACH sub-block "${blockDef.ref}" references input "${sourceRef}" ` +
                    `which does not exist in the sub-workflow or parent workflow. ` +
                    `Use "${itemRef}" to reference the current iteration element.`
                );
            }

            dependentNode.info.inputBlockIds.set(JSON.stringify(finalIds));
        }

        // Wire order-only dependencies (`after`) for the sub-blocks.
        this.wireAfter(subWorkflowConfig.blocks, 'FOREACH', refToNode, parentRefToNode, knownItemRefs);

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
     * - Any FOREACH itemRef (resolved to virtual ID — inherited at runtime)
     * - '$node': the implicit work node
     * - Any ref from the parent workflow (resolved as a virtual input)
     * - Other sub-workflow block refs
     */
    private async buildIfSubWorkflow(
        ifNode: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        subWorkflowConfig: { blocks: IBlockConfigJSON[]; outputRef: string },
        branch: 'then' | 'else',
        parentRefToNode?: Map<string, SpinalNode<any>>,
        knownItemRefs: Set<string> = new Set()
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

            // Recursively build nested FOREACH sub-workflows
            if (blockDef.algorithmName === 'FOREACH' && blockDef.subWorkflow) {
                if (!blockDef.itemRef) {
                    throw new Error(
                        `[AnalysisFactory] FOREACH block "${blockDef.ref}" is missing itemRef.`
                    );
                }
                this.blockManager.updateBlock(subBlockNode, {
                    foreachItemRef: blockDef.itemRef,
                });
                const childItemRefs = new Set([...knownItemRefs, blockDef.itemRef]);
                await this.buildForeachSubWorkflow(
                    subBlockNode,
                    contextNode,
                    blockDef.subWorkflow,
                    blockDef.itemRef,
                    refToNode,
                    childItemRefs
                );
            }

            // Recursively build nested IF sub-workflows
            if (blockDef.algorithmName === 'IF') {
                // Merge parent refs with local refs so nested IF can resolve both
                const mergedRefToNode = parentRefToNode
                    ? new Map([...parentRefToNode, ...refToNode])
                    : refToNode;
                if (blockDef.thenWorkflow) {
                    await this.buildIfSubWorkflow(
                        subBlockNode,
                        contextNode,
                        blockDef.thenWorkflow,
                        'then',
                        mergedRefToNode,
                        knownItemRefs
                    );
                }
                if (blockDef.elseWorkflow) {
                    await this.buildIfSubWorkflow(
                        subBlockNode,
                        contextNode,
                        blockDef.elseWorkflow,
                        'else',
                        mergedRefToNode,
                        knownItemRefs
                    );
                }
            }
        }

        // Phase 2: Wire dependencies and build inputBlockIds
        for (const blockDef of subWorkflowConfig.blocks) {
            if (!blockDef.inputs || blockDef.inputs.length === 0) continue;

            const dependentNode = refToNode.get(blockDef.ref);
            if (!dependentNode) continue;

            const finalIds: string[] = [];

            for (const sourceRef of blockDef.inputs) {
                // '$node' is the implicit work node — pre-seeded at runtime under
                // WORK_NODE_RESERVED_ID, so it needs no graph edge.
                if (sourceRef === '$node') {
                    finalIds.push(WORK_NODE_RESERVED_ID);
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

        // Wire order-only dependencies (`after`) for the branch sub-blocks.
        this.wireAfter(subWorkflowConfig.blocks, 'IF', refToNode, parentRefToNode, knownItemRefs);

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

    // ─────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────

    /**
     * Checks if a source ref matches any known FOREACH itemRef.
     * Returns the virtual ID if it matches, otherwise undefined.
     */
    private resolveItemRef(
        sourceRef: string,
        currentItemRef?: string,
        knownItemRefs?: Set<string>
    ): string | undefined {
        // Direct match with the current FOREACH's itemRef
        if (currentItemRef && sourceRef === currentItemRef) {
            return foreachItemVirtualId(sourceRef);
        }

        // Match with any ancestor FOREACH's itemRef
        if (knownItemRefs && knownItemRefs.has(sourceRef)) {
            return foreachItemVirtualId(sourceRef);
        }

        return undefined;
    }

    // ─────────────────────────────────────────────────────
    //  VALIDATION
    // ─────────────────────────────────────────────────────

    /**
     * Validates a workflow config (top-level: worknodeResolver, inputWorkflow, executionWorkflow).
     */
    private validateWorkflow(
        workflow: IWorkflowConfigJSON,
        path: string,
        parentItemRefs: Set<string>
    ): string[] {
        const errors: string[] = [];

        if (!workflow.blocks || !Array.isArray(workflow.blocks)) {
            errors.push(`${path}: "blocks" must be an array`);
            return errors;
        }

        const refs = new Set<string>();
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
            if (!block.ref) continue;
            errors.push(
                ...this.validateBlock(block, refs, knownItemRefs, `${path}.${block.ref}`)
            );
        }

        return errors;
    }

    /**
     * Validates a single block definition.
     */
    private validateBlock(
        block: IBlockConfigJSON,
        availableRefs: Set<string>,
        knownItemRefs: Set<string>,
        path: string
    ): string[] {
        const errors: string[] = [];

        if (!block.algorithmName || typeof block.algorithmName !== 'string') {
            errors.push(`${path}: missing or invalid "algorithmName"`);
        }

        // Validate inputs
        if (block.inputs) {
            for (const inputRef of block.inputs) {
                if (inputRef === '$node') continue;
                if (knownItemRefs.has(inputRef)) continue;
                if (availableRefs.has(inputRef)) continue;
                errors.push(
                    `${path}: input "${inputRef}" does not resolve to a known block ref, itemRef, or "$node"`
                );
            }

            // Self-reference check
            if (block.inputs.includes(block.ref)) {
                errors.push(`${path}: block references itself`);
            }
        }

        // Validate order-only deps (`after`) — same ref rules as inputs
        if (block.after) {
            for (const afterRef of block.after) {
                if (afterRef === '$node') continue;
                if (knownItemRefs.has(afterRef)) continue;
                if (availableRefs.has(afterRef)) continue;
                errors.push(
                    `${path}: after "${afterRef}" does not resolve to a known block ref, itemRef, or "$node"`
                );
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
            } else {
                if (block.itemRef && availableRefs.has(block.itemRef)) {
                    errors.push(`${path}: itemRef "${block.itemRef}" conflicts with an existing block ref`);
                }
                errors.push(
                    ...this.validateSubWorkflow(
                        block.subWorkflow,
                        availableRefs,
                        knownItemRefs,
                        `${path}.subWorkflow`
                    )
                );
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
                errors.push(
                    ...this.validateSubWorkflow(
                        block.thenWorkflow,
                        availableRefs,
                        knownItemRefs,
                        `${path}.thenWorkflow`
                    )
                );
            }
            if (block.elseWorkflow) {
                errors.push(
                    ...this.validateSubWorkflow(
                        block.elseWorkflow,
                        availableRefs,
                        knownItemRefs,
                        `${path}.elseWorkflow`
                    )
                );
            }
        }

        return errors;
    }

    /**
     * Validates a sub-workflow (FOREACH subWorkflow, IF thenWorkflow/elseWorkflow).
     * Sub-blocks can reference: local refs, parent refs, and known item refs.
     */
    private validateSubWorkflow(
        subWorkflow: { blocks: IBlockConfigJSON[]; outputRef: string },
        parentRefs: Set<string>,
        parentItemRefs: Set<string>,
        path: string
    ): string[] {
        const errors: string[] = [];

        if (!subWorkflow.blocks || !Array.isArray(subWorkflow.blocks)) {
            errors.push(`${path}: "blocks" must be an array`);
            return errors;
        }

        if (!subWorkflow.outputRef) {
            errors.push(`${path}: missing "outputRef"`);
        }

        const localRefs = new Set<string>();
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
            if (!block.ref) continue;
            errors.push(
                ...this.validateBlock(block, allRefs, knownItemRefs, `${path}.${block.ref}`)
            );
        }

        return errors;
    }

    /**
     * Validates trigger configurations.
     */
    private validateTriggers(triggers: ITriggerConfigJSON[]): string[] {
        const errors: string[] = [];

        for (let i = 0; i < triggers.length; i++) {
            const trigger = triggers[i];
            const path = `triggers[${i}]`;

            if (!trigger.type) {
                errors.push(`${path}: missing "type"`);
                continue;
            }

            if (trigger.type === 'INTERVAL_TIME') {
                const interval =
                    typeof trigger.intervalTimeMs === 'number'
                        ? trigger.intervalTimeMs
                        : typeof (trigger as any).value === 'number'
                            ? (trigger as any).value
                            : undefined;
                if (typeof interval !== 'number' || interval <= 0) {
                    errors.push(`${path}: INTERVAL_TIME requires "intervalTimeMs" > 0`);
                }
            }

            if (trigger.type === 'CRON') {
                const cron =
                    typeof trigger.cronExpression === 'string'
                        ? trigger.cronExpression
                        : typeof (trigger as any).value === 'string'
                            ? (trigger as any).value
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
    private async storeTriggerConfig(
        analysisNode: SpinalNode<any>,
        triggers: ITriggerConfigJSON[]
    ): Promise<void> {
        const triggerNode = await this.nodeManager.getAnalysisTriggerNode(analysisNode);
        await attributeService.createOrUpdateAttrsAndCategories(
            triggerNode,
            'triggerConfig',
            { triggers: JSON.stringify(triggers) }
        );
    }
}
