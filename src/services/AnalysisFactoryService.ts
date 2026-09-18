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
import {
    ISubWorkflowSlot,
    ITERATION_SUB_WORKFLOW_SLOT,
    IF_THEN_SUB_WORKFLOW_SLOT,
    IF_ELSE_SUB_WORKFLOW_SLOT,
    isIterationBlock,
} from '../constants/analysisWorkflowBlock';
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
        if (config.errorPolicy !== undefined && config.errorPolicy !== 'stop' && config.errorPolicy !== 'continue') {
            errors.push('errorPolicy: must be either "stop" or "continue"');
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
        const contextExisted =
            (await this.nodeManager.getContext(config.contextName, graph)) !== undefined;
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
            config.status,
            config.errorPolicy
        );
        logMessage(`[AnalysisFactory] Analysis node created: ${config.analysisName}`);

        // ── 3. Link anchor, build workflows, store triggers ──
        // validateConfig can't catch everything the build rejects (e.g. an anchor node that
        // isn't loaded), so undo the partial analysis instead of leaving it in the graph.
        try {
            await this.populateAnalysis(analysisNode, contextNode, config);
        } catch (error) {
            await this.rollbackCreate(analysisNode, contextExisted ? undefined : contextNode);
            throw error;
        }

        logMessage(`[AnalysisFactory] Analysis "${config.analysisName}" fully created`);
        return analysisNode;
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
    public async updateFromJSON(
        analysisNode: SpinalNode<any>,
        config: IAnalysisConfigJSON
    ): Promise<SpinalNode<any>> {
        const errors = this.validateConfig(config);
        if (errors.length > 0) {
            throw new Error(
                `[AnalysisFactory] Invalid config for "${config.analysisName ?? '(unnamed)'}": \n` +
                errors.map((e) => `  - ${e}`).join('\n')
            );
        }

        const contextNode = await this.nodeManager.getContextOfAnalytic(analysisNode);
        logMessage(`[AnalysisFactory] Updating analysis: ${analysisNode.getName().get()}`);

        // The rebuild wipes the sub-structure before recreating it, so a failing build would
        // leave a working analysis half-deleted. Snapshot it first so it can be put back.
        let previous: IAnalysisConfigJSON | undefined;
        try {
            previous = await this.snapshotAnalysis(analysisNode);
        } catch (snapshotError) {
            // A broken stored definition must still be fixable by a PUT — go ahead, just
            // without the ability to restore it.
            console.error(
                `[AnalysisFactory] Could not snapshot "${analysisNode.getName().get()}" before updating; ` +
                'a failed update will not be rolled back.',
                snapshotError
            );
        }

        try {
            // ── 1. Update scalar properties on the analysis node itself ──
            await this.applyScalarConfig(analysisNode, config);

            // ── 2. Wipe the whole sub-structure (keeping the analysis node) ──
            await this.nodeManager.resetAnalysisSubNodes(analysisNode);

            // ── 3. Recreate mandatory sub-nodes, then anchor / workflows / triggers ──
            await this.nodeManager.addMandatorySubNodes(analysisNode, contextNode);
            await this.populateAnalysis(analysisNode, contextNode, config);
        } catch (error) {
            if (previous) await this.restoreSnapshot(analysisNode, contextNode, previous);
            throw error;
        }

        // ── 4. Bump the revision so the organ re-assesses this analysis ──
        this.nodeManager.setLastUpdate(analysisNode);

        logMessage(`[AnalysisFactory] Analysis "${config.analysisName}" fully updated`);
        return analysisNode;
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
    public async patchAnalysis(
        analysisNode: SpinalNode<any>,
        patch: Partial<Pick<IAnalysisConfigJSON, 'analysisName' | 'description' | 'concurrency' | 'status' | 'errorPolicy'>>
    ): Promise<SpinalNode<any>> {
        // ── Validate only the provided fields ──
        const errors: string[] = [];
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
        if (patch.errorPolicy !== undefined && patch.errorPolicy !== 'stop' && patch.errorPolicy !== 'continue') {
            errors.push('errorPolicy: must be either "stop" or "continue"');
        }
        if (errors.length > 0) {
            throw new Error(
                `[AnalysisFactory] Invalid patch for "${analysisNode.getName().get()}": \n` +
                errors.map((e) => `  - ${e}`).join('\n')
            );
        }

        // ── Apply only the provided fields ──
        if (patch.analysisName !== undefined) {
            analysisNode.info.name.set(patch.analysisName);
        }
        if (patch.description !== undefined) {
            if (analysisNode.info.description) {
                analysisNode.info.description.set(patch.description);
            } else {
                analysisNode.info.add_attr('description', patch.description);
            }
        }
        if (patch.concurrency !== undefined) {
            await this.nodeManager.setConcurrencyConfig(analysisNode, patch.concurrency);
        }
        if (patch.status !== undefined) {
            await this.nodeManager.setStatus(analysisNode, patch.status);
        }

        logMessage(`[AnalysisFactory] Analysis "${analysisNode.getName().get()}" patched`);
        return analysisNode;
    }

    /** Sets name / description / concurrency / status / errorPolicy on the analysis node. */
    private async applyScalarConfig(
        analysisNode: SpinalNode<any>,
        config: IAnalysisConfigJSON
    ): Promise<void> {
        analysisNode.info.name.set(config.analysisName);
        if (analysisNode.info.description) {
            analysisNode.info.description.set(config.description ?? '');
        } else {
            analysisNode.info.add_attr('description', config.description ?? '');
        }
        await this.nodeManager.setConcurrencyConfig(analysisNode, config.concurrency);
        await this.nodeManager.setStatus(analysisNode, config.status);
        await this.nodeManager.setErrorPolicy(analysisNode, config.errorPolicy);
    }

    /**
     * Best-effort undo of a create whose build failed: removes the partial analysis (its
     * anchor target is detached first, so the linked building node survives), plus the
     * context when this create made it and it is left empty. Cleanup failures are logged,
     * not thrown — the build error is the one the caller needs to see.
     */
    private async rollbackCreate(
        analysisNode: SpinalNode<any>,
        createdContext?: SpinalNode<any>
    ): Promise<void> {
        try {
            await this.nodeManager.deleteAnalysisNode(analysisNode);
        } catch (cleanupError) {
            console.error('[AnalysisFactory] Rollback: could not remove the partially created analysis', cleanupError);
            return;
        }
        if (!createdContext) return;
        try {
            const remaining = await this.nodeManager.getAnalysisNodesByContextNode(createdContext as any);
            if (remaining.length === 0) await createdContext.removeFromGraph();
        } catch (cleanupError) {
            console.error('[AnalysisFactory] Rollback: could not remove the empty context', cleanupError);
        }
    }

    /**
     * Captures an analysis as a config populateAnalysis can rebuild. getAnalyticDetails
     * exposes the anchor by server_id, but linkAnchorTarget resolves node ids through
     * SpinalGraphService — so the anchor is re-read here as a registered node id.
     */
    private async snapshotAnalysis(analysisNode: SpinalNode<any>): Promise<IAnalysisConfigJSON> {
        const snapshot = await this.nodeManager.getAnalyticDetails(analysisNode);
        const anchorNode = await this.nodeManager.getAnalysisAnchorNodeNode(analysisNode);
        const targets = await anchorNode.getChildren(ANCHOR_NODE_TO_LINKED_NODE_RELATION);
        if (targets.length > 0) {
            SpinalGraphService._addNode(targets[0]);
            snapshot.anchorNodeId = targets[0].getId().get();
        } else {
            delete snapshot.anchorNodeId;
        }
        return snapshot;
    }

    /**
     * Rebuilds an analysis from a snapshot after a failed update. Best-effort: a failure here
     * is logged loudly (the analysis may be incomplete) but never masks the update error.
     */
    private async restoreSnapshot(
        analysisNode: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        snapshot: IAnalysisConfigJSON
    ): Promise<void> {
        try {
            await this.applyScalarConfig(analysisNode, snapshot);
            await this.nodeManager.resetAnalysisSubNodes(analysisNode);
            await this.nodeManager.addMandatorySubNodes(analysisNode, contextNode);
            await this.populateAnalysis(analysisNode, contextNode, snapshot);
            logMessage(`[AnalysisFactory] Update failed — restored the previous definition of "${snapshot.analysisName}"`);
        } catch (restoreError) {
            console.error(
                `[AnalysisFactory] Update failed AND restoring the previous definition of "${snapshot.analysisName}" ` +
                'failed — the analysis may be incomplete.',
                restoreError
            );
        }
    }

    /**
     * Links the anchor target, builds the three workflow DAGs, and stores the
     * trigger configs from a config object onto an analysis node whose mandatory
     * sub-nodes already exist. Shared by createFromJSON and updateFromJSON.
     */
    private async populateAnalysis(
        analysisNode: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        config: IAnalysisConfigJSON
    ): Promise<void> {
        // ── Link anchor to target node ──
        if (config.anchorNodeId) {
            await this.linkAnchorTarget(analysisNode, config.anchorNodeId, contextNode);
            logMessage(`[AnalysisFactory] Anchor linked to node: ${config.anchorNodeId}`);
        }

        // ── Build workflow DAGs ──
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

        // ── Store trigger configurations ──
        if (config.triggers && config.triggers.length > 0) {
            await this.storeTriggerConfig(analysisNode, config.triggers);
            logMessage(`[AnalysisFactory] Trigger config stored (${config.triggers.length} trigger(s))`);
        }
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
        const targetNode = SpinalGraphService.getRealNode(targetNodeId);

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
        }

        // ── Phase 1b: Build FOREACH / IF sub-workflows ──
        // Deferred until every top-level node exists, so a sub-block may reference a parent
        // block declared later in the array — the workflow is a DAG, declaration order must
        // not matter (building inline in Phase 1 only saw blocks defined before the FOREACH/IF).
        // Each build returns the outer refs its subtree reads; at this level they must all be
        // top-level blocks, and each becomes an ordering dep of its container (applied after
        // Phase 2, so the container's real inputs keep their slots).
        const containerDeps = new Map<string, Set<string>>();
        const unresolvedRefs = new Set<string>();
        await this.buildNestedContainers(
            workflowConfig.blocks,
            refToNode,
            refToNode,
            contextNode,
            new Set(),
            containerDeps,
            unresolvedRefs
        );

        // Unreachable in practice (sub-blocks only report refs they resolved in an enclosing
        // scope, and here that scope is this workflow) — kept as a guard against drift.
        if (unresolvedRefs.size > 0) {
            throw new Error(
                `[AnalysisFactory] Sub-workflow blocks reference ${[...unresolvedRefs].map((r) => `"${r}"`).join(', ')} ` +
                'which do not exist in any enclosing workflow. Check your workflow block refs.'
            );
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

        // ── Phase 2b: Order FOREACH / IF containers after the blocks their sub-workflows read ──
        await this.applyContainerDeps(containerDeps, refToNode, contextNode);

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
        scope: string,
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
        scope: string,
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
     * Builds the nested sub-workflows of the container blocks (FOREACH / FILTER / IF) among
     * `blocks`, and routes the outer refs each subtree reads: a ref owned by this scope becomes
     * an ordering dependency of its container (into `containerDeps`), anything further out
     * goes to `passUp` for the enclosing scope. Called once per scope, after every block of the
     * scope exists (so a sub-block may reference a sibling declared later).
     *
     * @param scopeRefToNode - what nested sub-workflows can resolve: every enclosing scope plus
     *                         this one (this scope shadowing outer names)
     */
    private async buildNestedContainers(
        blocks: IBlockConfigJSON[],
        refToNode: Map<string, SpinalNode<any>>,
        scopeRefToNode: Map<string, SpinalNode<any>>,
        contextNode: SpinalNode<any>,
        knownItemRefs: Set<string>,
        containerDeps: Map<string, Set<string>>,
        passUp: Set<string>
    ): Promise<void> {
        for (const blockDef of blocks) {
            const blockNode = refToNode.get(blockDef.ref);
            if (!blockNode) continue;

            if (isIterationBlock(blockDef.algorithmName) && blockDef.subWorkflow) {
                if (!blockDef.itemRef) {
                    throw new Error(
                        `[AnalysisFactory] ${blockDef.algorithmName} block "${blockDef.ref}" is missing itemRef. ` +
                        `Each ${blockDef.algorithmName} must declare a named ref for its iteration element.`
                    );
                }
                // Store itemRef + (optional) iteration concurrency on the node
                this.blockManager.updateBlock(blockNode, {
                    foreachItemRef: blockDef.itemRef,
                    foreachConcurrency: blockDef.concurrency
                        ? JSON.stringify(blockDef.concurrency)
                        : undefined,
                });
                const nestedRefs = await this.buildSubWorkflow(
                    blockNode,
                    contextNode,
                    blockDef.subWorkflow,
                    ITERATION_SUB_WORKFLOW_SLOT,
                    blockDef.algorithmName,
                    scopeRefToNode,
                    new Set([...knownItemRefs, blockDef.itemRef])
                );
                this.routeExternalRefs(blockDef, nestedRefs, refToNode, containerDeps, passUp);
            }

            if (blockDef.algorithmName === 'IF') {
                const branches: Array<[ISubWorkflowSlot, string, IBlockConfigJSON['thenWorkflow']]> = [
                    [IF_THEN_SUB_WORKFLOW_SLOT, 'IF then', blockDef.thenWorkflow],
                    [IF_ELSE_SUB_WORKFLOW_SLOT, 'IF else', blockDef.elseWorkflow],
                ];
                for (const [slot, label, branchConfig] of branches) {
                    if (!branchConfig) continue;
                    const nestedRefs = await this.buildSubWorkflow(
                        blockNode,
                        contextNode,
                        branchConfig,
                        slot,
                        label,
                        scopeRefToNode,
                        knownItemRefs
                    );
                    this.routeExternalRefs(blockDef, nestedRefs, refToNode, containerDeps, passUp);
                }
            }
        }
    }

    /**
     * Builds one sub-workflow of a container block — the iteration body of a FOREACH / FILTER
     * or a branch of an IF — into the given slot.
     *
     * Sub-blocks can reference: '$node', any known itemRef (the element of this or any
     * enclosing FOREACH / FILTER, resolved to a virtual id), sibling sub-blocks, and any block
     * of an enclosing scope (`ancestorRefToNode`, nearest scope winning on a name clash) —
     * sub-workflows inherit the whole enclosing context at runtime.
     *
     * @param label - how the container reads in error messages ("FOREACH", "IF then", …)
     * @returns the refs this subtree reads from enclosing scopes. The caller wires each one as
     *          an ordering dependency in the scope that owns it (see routeExternalRefs).
     */
    private async buildSubWorkflow(
        containerNode: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        subWorkflowConfig: { blocks: IBlockConfigJSON[]; outputRef: string },
        slot: ISubWorkflowSlot,
        label: string,
        ancestorRefToNode: Map<string, SpinalNode<any>>,
        knownItemRefs: Set<string>
    ): Promise<Set<string>> {
        const refToNode = new Map<string, SpinalNode<any>>();
        const externalRefs = new Set<string>();
        const containerDeps = new Map<string, Set<string>>();

        // Phase 1: Create sub-blocks
        for (const blockDef of subWorkflowConfig.blocks) {
            const subBlockNode = await this.blockManager.createSubBlock(
                containerNode,
                contextNode,
                slot,
                blockDef.algorithmName,
                blockDef.parameters ?? {},
                {
                    name: blockDef.name ?? blockDef.ref,
                    registerAs: blockDef.registerAs,
                }
            );
            refToNode.set(blockDef.ref, subBlockNode);
        }

        // Phase 1b: Build nested containers (after all siblings exist, so a nested sub-block
        // may reference a sibling declared later in this sub-workflow).
        const scopeRefToNode = new Map([...ancestorRefToNode, ...refToNode]);
        await this.buildNestedContainers(
            subWorkflowConfig.blocks,
            refToNode,
            scopeRefToNode,
            contextNode,
            knownItemRefs,
            containerDeps,
            externalRefs
        );

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

                // The element of this or any enclosing FOREACH / FILTER
                const virtualId = this.resolveItemRef(sourceRef, undefined, knownItemRefs);
                if (virtualId) {
                    finalIds.push(virtualId);
                    continue;
                }

                // Sibling sub-block
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

                // Enclosing-scope ref: no edge here (it would cross scopes). The value comes from
                // the inherited context; the owning scope wires the ordering dependency.
                const ancestorNode = ancestorRefToNode.get(sourceRef);
                if (ancestorNode) {
                    finalIds.push(ancestorNode.getId().get());
                    externalRefs.add(sourceRef);
                    continue;
                }

                const itemHint = knownItemRefs.size > 0
                    ? ` Use ${[...knownItemRefs].map((r) => `"${r}"`).join(' / ')} to reference an iteration element.`
                    : '';
                throw new Error(
                    `[AnalysisFactory] ${label} sub-block "${blockDef.ref}" references input "${sourceRef}" ` +
                    `which does not exist in the sub-workflow or any enclosing workflow.${itemHint}`
                );
            }

            // Set the correctly ordered inputBlockIds (overrides addSubBlockDependency side effects)
            dependentNode.info.inputBlockIds.set(JSON.stringify(finalIds));
        }

        // Phase 2b: order nested containers after the sibling blocks their subtrees read.
        await this.applyContainerDeps(containerDeps, refToNode, contextNode);

        // Order-only dependencies (`after`); outer ones also constrain the enclosing order.
        this.wireAfter(subWorkflowConfig.blocks, label, refToNode, ancestorRefToNode, knownItemRefs);
        this.collectExternalAfterRefs(subWorkflowConfig.blocks, refToNode, ancestorRefToNode, knownItemRefs, externalRefs);

        // Record the sub-workflow's output block on the container
        const outputRef = subWorkflowConfig.outputRef;
        const outputNode = refToNode.get(outputRef);
        if (!outputNode) {
            throw new Error(
                `[AnalysisFactory] ${label} outputRef "${outputRef}" does not match any sub-block ref`
            );
        }
        this.blockManager.updateBlock(containerNode, {
            [slot.outputField]: outputNode.getId().get(),
        });

        return externalRefs;
    }

    /**
     * Routes the refs a container's subtree reads from outside its own sub-workflow.
     *
     * A ref that is a block of THIS scope becomes an ordering dependency of the container
     * (recorded in `containerDeps`, applied by applyContainerDeps), so this scope runs that
     * block first and its output is in the context every iteration / branch inherits. Any
     * other ref belongs to a scope further out and goes to `passUp`. Dependencies are only
     * drawn between blocks of the same scope: loadWorkflowDAG pulls every edge target into
     * the DAG being loaded, so an edge from an outer block to a nested one would leak it.
     */
    private routeExternalRefs(
        containerDef: IBlockConfigJSON,
        externalRefs: Set<string>,
        refToNode: Map<string, SpinalNode<any>>,
        containerDeps: Map<string, Set<string>>,
        passUp: Set<string>
    ): void {
        for (const ref of externalRefs) {
            if (!refToNode.has(ref)) {
                passUp.add(ref);
                continue;
            }
            if (ref === containerDef.ref) {
                throw new Error(
                    `[AnalysisFactory] "${containerDef.ref}" is referenced from inside its own sub-workflow, which is a cycle.`
                );
            }
            // Already a real input of the container → already wired and ordered.
            if (containerDef.inputs?.includes(ref)) continue;

            let deps = containerDeps.get(containerDef.ref);
            if (!deps) {
                deps = new Set();
                containerDeps.set(containerDef.ref, deps);
            }
            deps.add(ref);
        }
    }

    /**
     * Appends each container's recorded ordering deps to its inputBlockIds and draws the
     * matching same-scope edge. Runs after the scope's Phase 2, which (re)sets the container's
     * real inputs — appending here keeps slot 0 as the FOREACH collection / IF predicate, the
     * only slot those executors read, and keeps the deps from being overwritten.
     */
    private async applyContainerDeps(
        containerDeps: Map<string, Set<string>>,
        refToNode: Map<string, SpinalNode<any>>,
        contextNode: SpinalNode<any>
    ): Promise<void> {
        for (const [containerRef, depRefs] of containerDeps) {
            const containerNode = refToNode.get(containerRef);
            if (!containerNode) continue;

            const ids = JSON.parse(containerNode.info.inputBlockIds?.get() ?? '[]') as string[];
            for (const depRef of depRefs) {
                const depNode = refToNode.get(depRef);
                if (!depNode) continue;

                const depId = depNode.getId().get();
                if (ids.includes(depId)) continue;
                ids.push(depId);
                await this.blockManager.addEdge(depNode, containerNode, contextNode);
            }
            containerNode.info.inputBlockIds.set(JSON.stringify(ids));
        }
    }

    /**
     * Adds to `externalRefs` the `after` refs of these blocks that point to an enclosing
     * scope (not local, not an itemRef, not '$node') — they constrain the enclosing order too.
     */
    private collectExternalAfterRefs(
        blocks: IBlockConfigJSON[],
        refToNode: Map<string, SpinalNode<any>>,
        ancestorRefToNode: Map<string, SpinalNode<any>> | undefined,
        knownItemRefs: Set<string>,
        externalRefs: Set<string>
    ): void {
        if (!ancestorRefToNode) return;
        for (const blockDef of blocks) {
            for (const ref of blockDef.after ?? []) {
                if (ref === '$node' || knownItemRefs.has(ref) || refToNode.has(ref)) continue;
                if (ancestorRefToNode.has(ref)) externalRefs.add(ref);
            }
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

            if (isIterationBlock(block.algorithmName) && block.itemRef) {
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

        // FOREACH / FILTER validation
        if (isIterationBlock(block.algorithmName)) {
            if (!block.itemRef) {
                errors.push(`${path}: ${block.algorithmName} block must have "itemRef"`);
            }
            if (!block.subWorkflow) {
                errors.push(`${path}: ${block.algorithmName} block must have "subWorkflow"`);
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

            if (isIterationBlock(block.algorithmName) && block.itemRef) {
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
