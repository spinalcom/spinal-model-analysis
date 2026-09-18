/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    SpinalGraphService,
    SpinalNode,
    SPINAL_RELATION_PTR_LST_TYPE,
} from 'spinal-env-viewer-graph-service';

import {
    WORKFLOW_BLOCK_NODE_TYPE,
    PARENT_TO_WORKFLOW_BLOCK_RELATION,
    FOREACH_TO_SUB_BLOCK_RELATION,
    ISubWorkflowSlot,
    ITERATION_SUB_WORKFLOW_SLOT,
    IF_THEN_SUB_WORKFLOW_SLOT,
    IF_ELSE_SUB_WORKFLOW_SLOT,
    isIterationBlock,
} from '../constants/analysisWorkflowBlock';

import { IWorkflowBlock, IWorkflowDAG } from '../interfaces/IWorkflowBlock';

/**
 * Service for creating, managing, and loading workflow blocks stored as SpinalNodes.
 *
 * Graph structure:
 * - Each block is a SpinalNode of type 'workflowBlockNode'
 * - Root blocks (no dependencies) are children of the workflow node
 * - Dependent blocks are children of their dependency blocks
 * - Block config is stored in the node's info: algorithmName, parameters (JSON),
 *   inputBlockIds (JSON ordered array), registerAs (optional)
 * - Container blocks (FOREACH / FILTER, IF) hold their sub-workflow blocks as children via
 *   dedicated relations — one per sub-workflow slot (see constants/analysisWorkflowBlock)
 */
export default class WorkflowBlockManagerService {
    // ─────────────────────────────────────────────────────
    //  CREATE BLOCKS
    // ─────────────────────────────────────────────────────

    /**
     * Creates a new block SpinalNode and adds it as a child of the given parent node.
     * The parent can be a workflow node (for root blocks) or another block (for dependent blocks).
     *
     * @param parentNode - The parent node (workflow node or dependency block)
     * @param contextNode - The analysis context node
     * @param algorithmName - Algorithm to execute (from the AlgorithmRegistry)
     * @param parameters - Static parameters for the algorithm
     * @param options - Optional: block name, registerAs, foreachOutputBlockId
     * @returns The created block SpinalNode
     */
    public async createBlock(
        parentNode: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        algorithmName: string,
        parameters: Record<string, unknown> = {},
        options?: {
            name?: string;
            registerAs?: string;
            foreachOutputBlockId?: string;
            foreachItemRef?: string;
        }
    ): Promise<SpinalNode<any>> {
        const blockNode = this.createOrphanBlock(algorithmName, parameters, options);

        await parentNode.addChildInContext(
            blockNode,
            PARENT_TO_WORKFLOW_BLOCK_RELATION,
            SPINAL_RELATION_PTR_LST_TYPE,
            contextNode
        );

        return blockNode;
    }

    /**
     * Creates a block SpinalNode without attaching it to any parent.
     * Use this when the block will be wired as a dependent later via addDependency(),
     * to avoid the double-parenting problem (block shouldn't be a child of both
     * the workflow node AND its source block).
     *
     * Root blocks (no dependencies) should use createBlock() instead.
     *
     * @returns The created block SpinalNode (not yet in the graph hierarchy)
     */
    public createOrphanBlock(
        algorithmName: string,
        parameters: Record<string, unknown> = {},
        options?: {
            name?: string;
            registerAs?: string;
            foreachOutputBlockId?: string;
            foreachItemRef?: string;
        }
    ): SpinalNode<any> {
        return this.instantiateBlock(algorithmName, parameters, options, 'block');
    }

    /**
     * Creates a sub-block inside a container block's sub-workflow slot (FOREACH / FILTER
     * iteration body, IF then / else branch). Sub-blocks form a mini-DAG under the container,
     * hanging off it through the slot's dedicated relation.
     */
    public async createSubBlock(
        containerBlock: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        slot: ISubWorkflowSlot,
        algorithmName: string,
        parameters: Record<string, unknown> = {},
        options?: {
            name?: string;
            registerAs?: string;
        }
    ): Promise<SpinalNode<any>> {
        const blockNode = this.instantiateBlock(algorithmName, parameters, options, 'sub-block');

        await containerBlock.addChildInContext(
            blockNode,
            slot.relation,
            SPINAL_RELATION_PTR_LST_TYPE,
            contextNode
        );

        return blockNode;
    }

    /** Creates a sub-block in a FOREACH / FILTER block's iteration body. */
    public createForeachSubBlock(
        foreachBlock: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        algorithmName: string,
        parameters: Record<string, unknown> = {},
        options?: { name?: string; registerAs?: string }
    ): Promise<SpinalNode<any>> {
        return this.createSubBlock(foreachBlock, contextNode, ITERATION_SUB_WORKFLOW_SLOT, algorithmName, parameters, options);
    }

    /** Creates a sub-block in an IF block's then or else branch. */
    public createIfSubBlock(
        ifBlock: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        algorithmName: string,
        parameters: Record<string, unknown> = {},
        branch: 'then' | 'else',
        options?: { name?: string; registerAs?: string }
    ): Promise<SpinalNode<any>> {
        const slot = branch === 'then' ? IF_THEN_SUB_WORKFLOW_SLOT : IF_ELSE_SUB_WORKFLOW_SLOT;
        return this.createSubBlock(ifBlock, contextNode, slot, algorithmName, parameters, options);
    }

    /** Builds a block SpinalNode from its config (attached to nothing yet). */
    private instantiateBlock(
        algorithmName: string,
        parameters: Record<string, unknown>,
        options: {
            name?: string;
            registerAs?: string;
            foreachOutputBlockId?: string;
            foreachItemRef?: string;
        } | undefined,
        kind: string
    ): SpinalNode<any> {
        const blockInfo: any = {
            name: options?.name ?? algorithmName,
            type: WORKFLOW_BLOCK_NODE_TYPE,
            algorithmName,
            parameters: JSON.stringify(parameters),
            inputBlockIds: JSON.stringify([]),
            orderBlockIds: JSON.stringify([]),
        };
        if (options?.registerAs) blockInfo.registerAs = options.registerAs;
        if (options?.foreachOutputBlockId) blockInfo.foreachOutputBlockId = options.foreachOutputBlockId;
        if (options?.foreachItemRef) blockInfo.foreachItemRef = options.foreachItemRef;

        const blockNodeId = SpinalGraphService.createNode(blockInfo);
        const blockNode = SpinalGraphService.getRealNode(blockNodeId);
        if (!blockNode) throw new Error(`Failed to create ${kind} node`);
        return blockNode;
    }

    // ─────────────────────────────────────────────────────
    //  DEPENDENCY EDGES
    // ─────────────────────────────────────────────────────

    /**
     * Adds a data-flow dependency: sourceBlock feeds into dependentBlock.
     * In graph terms, dependentBlock becomes a child of sourceBlock.
     *
     * Also updates the dependentBlock's inputBlockIds to include the sourceBlock
     * at the given slot index (appends if no slot specified).
     *
     * @param sourceBlock - The block producing the output
     * @param dependentBlock - The block consuming the output
     * @param contextNode - The analysis context node
     * @param slotIndex - Optional input slot position (0-based). Appends if omitted.
     */
    public async addDependency(
        sourceBlock: SpinalNode<any>,
        dependentBlock: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        slotIndex?: number
    ): Promise<void> {
        await this.addEdge(sourceBlock, dependentBlock, contextNode);

        // Update inputBlockIds on the dependent block
        const currentIds = this.getInputBlockIds(dependentBlock);
        const sourceId = sourceBlock.getId().get();

        if (slotIndex !== undefined && slotIndex >= 0) {
            // Pad with empty strings if needed, then insert at slot
            while (currentIds.length < slotIndex) {
                currentIds.push('');
            }
            currentIds.splice(slotIndex, 0, sourceId);
        } else {
            currentIds.push(sourceId);
        }

        dependentBlock.info.inputBlockIds.set(JSON.stringify(currentIds));
    }

    /**
     * Adds only the graph edge sourceBlock → dependentBlock, leaving inputBlockIds untouched.
     * Both blocks must belong to the same workflow scope: loadWorkflowDAG pulls every edge
     * target into the DAG it is loading, so an edge across scopes would leak a nested block
     * into an outer DAG.
     */
    public async addEdge(
        sourceBlock: SpinalNode<any>,
        dependentBlock: SpinalNode<any>,
        contextNode: SpinalNode<any>
    ): Promise<void> {
        await sourceBlock.addChildInContext(
            dependentBlock,
            PARENT_TO_WORKFLOW_BLOCK_RELATION,
            SPINAL_RELATION_PTR_LST_TYPE,
            contextNode
        );
    }

    /**
     * Adds a data-flow dependency between FOREACH sub-blocks.
     * Same as addDependency but within the context of a FOREACH sub-workflow.
     */
    public async addSubBlockDependency(
        sourceSubBlock: SpinalNode<any>,
        dependentSubBlock: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        slotIndex?: number
    ): Promise<void> {
        // Uses the same relation for edges between sub-blocks
        await this.addDependency(sourceSubBlock, dependentSubBlock, contextNode, slotIndex);
    }

    // ─────────────────────────────────────────────────────
    //  UPDATE BLOCKS
    // ─────────────────────────────────────────────────────

    /**
     * Updates a block's configuration.
     */
    public updateBlock(
        blockNode: SpinalNode<any>,
        updates: {
            algorithmName?: string;
            parameters?: Record<string, unknown>;
            registerAs?: string;
            name?: string;
            foreachOutputBlockId?: string;
            foreachItemRef?: string;
            /** JSON-stringified IConcurrencyConfig for a FOREACH block (dispatch strategy). */
            foreachConcurrency?: string;
            ifThenOutputBlockId?: string;
            ifElseOutputBlockId?: string;
            [key: string]: unknown;
        }
    ): void {
        if (updates.algorithmName !== undefined) {
            blockNode.info.algorithmName.set(updates.algorithmName);
        }
        if (updates.name !== undefined) {
            blockNode.info.name.set(updates.name);
        }
        if (updates.parameters !== undefined) {
            blockNode.info.parameters.set(JSON.stringify(updates.parameters));
        }
        if (updates.registerAs !== undefined) {
            if (!blockNode.info.registerAs) {
                blockNode.info.add_attr('registerAs', updates.registerAs);
            } else {
                blockNode.info.registerAs.set(updates.registerAs);
            }
        }
        if (updates.foreachOutputBlockId !== undefined) {
            if (!blockNode.info.foreachOutputBlockId) {
                blockNode.info.add_attr('foreachOutputBlockId', updates.foreachOutputBlockId);
            } else {
                blockNode.info.foreachOutputBlockId.set(updates.foreachOutputBlockId);
            }
        }
        if (updates.foreachItemRef !== undefined) {
            if (!blockNode.info.foreachItemRef) {
                blockNode.info.add_attr('foreachItemRef', updates.foreachItemRef);
            } else {
                blockNode.info.foreachItemRef.set(updates.foreachItemRef);
            }
        }
        if (updates.foreachConcurrency !== undefined) {
            if (!blockNode.info.foreachConcurrency) {
                blockNode.info.add_attr('foreachConcurrency', updates.foreachConcurrency);
            } else {
                blockNode.info.foreachConcurrency.set(updates.foreachConcurrency);
            }
        }
        if (updates.ifThenOutputBlockId !== undefined) {
            if (!blockNode.info.ifThenOutputBlockId) {
                blockNode.info.add_attr('ifThenOutputBlockId', updates.ifThenOutputBlockId);
            } else {
                blockNode.info.ifThenOutputBlockId.set(updates.ifThenOutputBlockId);
            }
        }
        if (updates.ifElseOutputBlockId !== undefined) {
            if (!blockNode.info.ifElseOutputBlockId) {
                blockNode.info.add_attr('ifElseOutputBlockId', updates.ifElseOutputBlockId);
            } else {
                blockNode.info.ifElseOutputBlockId.set(updates.ifElseOutputBlockId);
            }
        }
    }

    // ─────────────────────────────────────────────────────
    //  LOAD DAG FROM GRAPH
    // ─────────────────────────────────────────────────────

    /**
     * Loads the full workflow DAG from the graph, starting from a workflow node.
     * Recursively traverses block relationships to build the in-memory DAG.
     *
     * @param workflowNode - The workflow SpinalNode (input, execution, or worknode resolver)
     * @returns The in-memory DAG representation
     */
    public async loadWorkflowDAG(
        workflowNode: SpinalNode<any>
    ): Promise<IWorkflowDAG> {
        const visited = new Map<string, IWorkflowBlock>();
        await this.collectBlocks(workflowNode, visited);
        return { blocks: [...visited.values()] };
    }

    /**
     * Recursively collects all blocks reachable from a parent node.
     * Handles deduplication (a block with multiple parents is only processed once).
     */
    private async collectBlocks(
        parentNode: SpinalNode<any>,
        visited: Map<string, IWorkflowBlock>
    ): Promise<void> {
        const children = await parentNode.getChildren(
            PARENT_TO_WORKFLOW_BLOCK_RELATION
        );

        for (const childNode of children) {
            const childId = childNode.getId().get();
            if (visited.has(childId)) continue;

            const block = this.blockNodeToMemory(childNode);
            visited.set(childId, block);
            await this.attachSubWorkflows(block, childNode);

            // Recurse to find downstream dependent blocks
            await this.collectBlocks(childNode, visited);
        }
    }

    /**
     * Loads a container block's sub-workflows onto its in-memory block: the iteration body
     * of a FOREACH / FILTER, or the then / else branches of an IF. A no-op for other blocks.
     */
    private async attachSubWorkflows(
        block: IWorkflowBlock,
        blockNode: SpinalNode<any>
    ): Promise<void> {
        if (isIterationBlock(block.algorithmName)) {
            const sub = await this.loadSubWorkflow(blockNode, ITERATION_SUB_WORKFLOW_SLOT);
            if (!sub) {
                throw new Error(
                    `${block.algorithmName} block "${block.name}" has no sub-workflow blocks`
                );
            }
            block.subWorkflow = sub;
        }
        if (block.algorithmName === 'IF') {
            block.thenWorkflow = await this.loadSubWorkflow(blockNode, IF_THEN_SUB_WORKFLOW_SLOT);
            block.elseWorkflow = await this.loadSubWorkflow(blockNode, IF_ELSE_SUB_WORKFLOW_SLOT);
        }
    }

    /**
     * Loads one sub-workflow slot of a container block: its root sub-blocks (via the slot's
     * relation), everything reachable from them, and the designated output block. Returns
     * undefined when the slot holds no sub-blocks (an IF branch that was not defined).
     */
    private async loadSubWorkflow(
        containerNode: SpinalNode<any>,
        slot: ISubWorkflowSlot
    ): Promise<{ blocks: IWorkflowBlock[]; outputBlockId: string } | undefined> {
        const subRoots = await containerNode.getChildren(slot.relation);
        if (subRoots.length === 0) return undefined;

        const subVisited = new Map<string, IWorkflowBlock>();
        for (const subRoot of subRoots) {
            const subId = subRoot.getId().get();
            if (subVisited.has(subId)) continue;

            const block = this.blockNodeToMemory(subRoot);
            subVisited.set(subId, block);
            await this.attachSubWorkflows(block, subRoot);

            // Sub-block dependents use the normal block relation
            await this.collectBlocks(subRoot, subVisited);
        }

        const outputBlockId: string = containerNode.info[slot.outputField]
            ? containerNode.info[slot.outputField].get()
            : '';
        if (!outputBlockId) {
            throw new Error(
                `${containerNode.info.algorithmName?.get() ?? 'Container'} block ` +
                `"${containerNode.getName().get()}" is missing ${slot.outputField}`
            );
        }

        return { blocks: [...subVisited.values()], outputBlockId };
    }

    /**
     * Converts a block SpinalNode to its in-memory IWorkflowBlock representation.
     */
    private blockNodeToMemory(blockNode: SpinalNode<any>): IWorkflowBlock {
        const id = blockNode.getId().get();
        const name: string = blockNode.getName().get() ?? id;
        const algorithmName: string =
            blockNode.info.algorithmName?.get() ?? '';

        let parameters: Record<string, unknown> = {};
        try {
            const paramStr = blockNode.info.parameters?.get();
            if (paramStr) parameters = JSON.parse(paramStr);
        } catch {
            /* invalid JSON — use empty params */
        }

        const inputBlockIds = this.getInputBlockIds(blockNode);
        const orderBlockIds = this.getOrderBlockIds(blockNode);

        const registerAs = blockNode.info.registerAs
            ? blockNode.info.registerAs.get()
            : undefined;

        const block: IWorkflowBlock = {
            id,
            name,
            algorithmName,
            parameters,
            inputBlockIds,
            orderBlockIds,
        };

        if (registerAs) {
            block.registerAs = registerAs;
        }

        if (blockNode.info.foreachItemRef) {
            block.foreachItemRef = blockNode.info.foreachItemRef.get();
        }

        if (blockNode.info.foreachConcurrency) {
            try {
                block.foreachConcurrency = JSON.parse(blockNode.info.foreachConcurrency.get());
            } catch {
                /* invalid JSON — leave undefined (executor falls back to SEQUENTIAL) */
            }
        }

        return block;
    }

    // ─────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────

    /**
     * Reads the ordered inputBlockIds from a block node's info.
     */
    private getInputBlockIds(blockNode: SpinalNode<any>): string[] {
        try {
            const raw = blockNode.info.inputBlockIds?.get();
            if (!raw) return [];
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    /**
     * Reads the order-only block IDs from a block node's info.
     * Returns [] for blocks created before this field existed.
     */
    private getOrderBlockIds(blockNode: SpinalNode<any>): string[] {
        try {
            const raw = blockNode.info.orderBlockIds?.get();
            if (!raw) return [];
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    /**
     * Sets the order-only block IDs on a block node (order-only dependencies that
     * gate execution but pass no data). Adds the info attribute if missing, so it
     * also works on blocks created before this field existed.
     */
    public setOrderBlockIds(blockNode: SpinalNode<any>, ids: string[]): void {
        if (!blockNode.info.orderBlockIds) {
            blockNode.info.add_attr('orderBlockIds', JSON.stringify(ids));
        } else {
            blockNode.info.orderBlockIds.set(JSON.stringify(ids));
        }
    }

    /**
     * Gets all block nodes that are direct children of a workflow node.
     */
    public async getWorkflowBlocks(
        workflowNode: SpinalNode<any>
    ): Promise<SpinalNode<any>[]> {
        return workflowNode.getChildren(PARENT_TO_WORKFLOW_BLOCK_RELATION);
    }

    /**
     * Gets the sub-blocks of a FOREACH block.
     */
    public async getForeachSubBlocks(
        foreachBlock: SpinalNode<any>
    ): Promise<SpinalNode<any>[]> {
        return foreachBlock.getChildren(FOREACH_TO_SUB_BLOCK_RELATION);
    }
}
