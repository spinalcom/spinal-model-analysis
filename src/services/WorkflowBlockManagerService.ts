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
 * - FOREACH blocks have sub-workflow blocks as children via a dedicated relation
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
        }
    ): SpinalNode<any> {
        const blockInfo: any = {
            name: options?.name ?? algorithmName,
            type: WORKFLOW_BLOCK_NODE_TYPE,
            algorithmName,
            parameters: JSON.stringify(parameters),
            inputBlockIds: JSON.stringify([]),
        };

        if (options?.registerAs) {
            blockInfo.registerAs = options.registerAs;
        }
        if (options?.foreachOutputBlockId) {
            blockInfo.foreachOutputBlockId = options.foreachOutputBlockId;
        }

        const blockNodeId = SpinalGraphService.createNode(blockInfo);
        const blockNode = SpinalGraphService.getRealNode(blockNodeId);
        if (!blockNode) throw new Error('Failed to create block node');

        return blockNode;
    }

    /**
     * Creates a sub-block for a FOREACH block using the dedicated FOREACH relation.
     * Sub-blocks form a mini-DAG inside the FOREACH block.
     */
    public async createForeachSubBlock(
        foreachBlock: SpinalNode<any>,
        contextNode: SpinalNode<any>,
        algorithmName: string,
        parameters: Record<string, unknown> = {},
        options?: {
            name?: string;
            registerAs?: string;
        }
    ): Promise<SpinalNode<any>> {
        const blockInfo: any = {
            name: options?.name ?? algorithmName,
            type: WORKFLOW_BLOCK_NODE_TYPE,
            algorithmName,
            parameters: JSON.stringify(parameters),
            inputBlockIds: JSON.stringify([]),
        };

        if (options?.registerAs) {
            blockInfo.registerAs = options.registerAs;
        }

        const blockNodeId = SpinalGraphService.createNode(blockInfo);
        const blockNode = SpinalGraphService.getRealNode(blockNodeId);
        if (!blockNode) throw new Error('Failed to create FOREACH sub-block node');

        await foreachBlock.addChildInContext(
            blockNode,
            FOREACH_TO_SUB_BLOCK_RELATION,
            SPINAL_RELATION_PTR_LST_TYPE,
            contextNode
        );

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
        // Add graph edge: sourceBlock → dependentBlock
        await sourceBlock.addChildInContext(
            dependentBlock,
            PARENT_TO_WORKFLOW_BLOCK_RELATION,
            SPINAL_RELATION_PTR_LST_TYPE,
            contextNode
        );

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

            // If FOREACH, load its sub-workflow
            if (block.algorithmName === 'FOREACH') {
                block.subWorkflow = await this.loadForeachSubWorkflow(childNode);
            }

            // Recurse to find downstream dependent blocks
            await this.collectBlocks(childNode, visited);
        }
    }

    /**
     * Loads the sub-workflow DAG for a FOREACH block.
     */
    private async loadForeachSubWorkflow(
        foreachNode: SpinalNode<any>
    ): Promise<{ blocks: IWorkflowBlock[]; outputBlockId: string }> {
        const subVisited = new Map<string, IWorkflowBlock>();

        // Get direct sub-blocks of the FOREACH node
        const subRoots = await foreachNode.getChildren(
            FOREACH_TO_SUB_BLOCK_RELATION
        );

        for (const subRoot of subRoots) {
            const subId = subRoot.getId().get();
            if (subVisited.has(subId)) continue;

            const block = this.blockNodeToMemory(subRoot);
            subVisited.set(subId, block);

            // Recurse into sub-block dependents (they use the normal block relation)
            await this.collectBlocks(subRoot, subVisited);
        }

        // Get the designated output block ID
        const outputBlockId = foreachNode.info.foreachOutputBlockId
            ? foreachNode.info.foreachOutputBlockId.get()
            : '';

        if (!outputBlockId) {
            throw new Error(
                `FOREACH block "${foreachNode.getName().get()}" is missing foreachOutputBlockId`
            );
        }

        return {
            blocks: [...subVisited.values()],
            outputBlockId,
        };
    }

    /**
     * Converts a block SpinalNode to its in-memory IWorkflowBlock representation.
     */
    private blockNodeToMemory(blockNode: SpinalNode<any>): IWorkflowBlock {
        const id = blockNode.getId().get();
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

        const registerAs = blockNode.info.registerAs
            ? blockNode.info.registerAs.get()
            : undefined;

        const block: IWorkflowBlock = {
            id,
            algorithmName,
            parameters,
            inputBlockIds,
        };

        if (registerAs) {
            block.registerAs = registerAs;
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
