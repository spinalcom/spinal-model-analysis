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
/* eslint-disable @typescript-eslint/no-explicit-any */
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const analysisWorkflowBlock_1 = require("../constants/analysisWorkflowBlock");
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
class WorkflowBlockManagerService {
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
    createBlock(parentNode, contextNode, algorithmName, parameters = {}, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const blockNode = this.createOrphanBlock(algorithmName, parameters, options);
            yield parentNode.addChildInContext(blockNode, analysisWorkflowBlock_1.PARENT_TO_WORKFLOW_BLOCK_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE, contextNode);
            return blockNode;
        });
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
    createOrphanBlock(algorithmName, parameters = {}, options) {
        return this.instantiateBlock(algorithmName, parameters, options, 'block');
    }
    /**
     * Creates a sub-block inside a container block's sub-workflow slot (FOREACH / FILTER
     * iteration body, IF then / else branch). Sub-blocks form a mini-DAG under the container,
     * hanging off it through the slot's dedicated relation.
     */
    createSubBlock(containerBlock, contextNode, slot, algorithmName, parameters = {}, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const blockNode = this.instantiateBlock(algorithmName, parameters, options, 'sub-block');
            yield containerBlock.addChildInContext(blockNode, slot.relation, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE, contextNode);
            return blockNode;
        });
    }
    /** Creates a sub-block in a FOREACH / FILTER block's iteration body. */
    createForeachSubBlock(foreachBlock, contextNode, algorithmName, parameters = {}, options) {
        return this.createSubBlock(foreachBlock, contextNode, analysisWorkflowBlock_1.ITERATION_SUB_WORKFLOW_SLOT, algorithmName, parameters, options);
    }
    /** Creates a sub-block in an IF block's then or else branch. */
    createIfSubBlock(ifBlock, contextNode, algorithmName, parameters = {}, branch, options) {
        const slot = branch === 'then' ? analysisWorkflowBlock_1.IF_THEN_SUB_WORKFLOW_SLOT : analysisWorkflowBlock_1.IF_ELSE_SUB_WORKFLOW_SLOT;
        return this.createSubBlock(ifBlock, contextNode, slot, algorithmName, parameters, options);
    }
    /** Builds a block SpinalNode from its config (attached to nothing yet). */
    instantiateBlock(algorithmName, parameters, options, kind) {
        var _a;
        const blockInfo = {
            name: (_a = options === null || options === void 0 ? void 0 : options.name) !== null && _a !== void 0 ? _a : algorithmName,
            type: analysisWorkflowBlock_1.WORKFLOW_BLOCK_NODE_TYPE,
            algorithmName,
            parameters: JSON.stringify(parameters),
            inputBlockIds: JSON.stringify([]),
            orderBlockIds: JSON.stringify([]),
        };
        if (options === null || options === void 0 ? void 0 : options.registerAs)
            blockInfo.registerAs = options.registerAs;
        if (options === null || options === void 0 ? void 0 : options.foreachOutputBlockId)
            blockInfo.foreachOutputBlockId = options.foreachOutputBlockId;
        if (options === null || options === void 0 ? void 0 : options.foreachItemRef)
            blockInfo.foreachItemRef = options.foreachItemRef;
        const blockNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(blockInfo);
        const blockNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(blockNodeId);
        if (!blockNode)
            throw new Error(`Failed to create ${kind} node`);
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
    addDependency(sourceBlock, dependentBlock, contextNode, slotIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.addEdge(sourceBlock, dependentBlock, contextNode);
            // Update inputBlockIds on the dependent block
            const currentIds = this.getInputBlockIds(dependentBlock);
            const sourceId = sourceBlock.getId().get();
            if (slotIndex !== undefined && slotIndex >= 0) {
                // Pad with empty strings if needed, then insert at slot
                while (currentIds.length < slotIndex) {
                    currentIds.push('');
                }
                currentIds.splice(slotIndex, 0, sourceId);
            }
            else {
                currentIds.push(sourceId);
            }
            dependentBlock.info.inputBlockIds.set(JSON.stringify(currentIds));
        });
    }
    /**
     * Adds only the graph edge sourceBlock → dependentBlock, leaving inputBlockIds untouched.
     * Both blocks must belong to the same workflow scope: loadWorkflowDAG pulls every edge
     * target into the DAG it is loading, so an edge across scopes would leak a nested block
     * into an outer DAG.
     */
    addEdge(sourceBlock, dependentBlock, contextNode) {
        return __awaiter(this, void 0, void 0, function* () {
            yield sourceBlock.addChildInContext(dependentBlock, analysisWorkflowBlock_1.PARENT_TO_WORKFLOW_BLOCK_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE, contextNode);
        });
    }
    /**
     * Adds a data-flow dependency between FOREACH sub-blocks.
     * Same as addDependency but within the context of a FOREACH sub-workflow.
     */
    addSubBlockDependency(sourceSubBlock, dependentSubBlock, contextNode, slotIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            // Uses the same relation for edges between sub-blocks
            yield this.addDependency(sourceSubBlock, dependentSubBlock, contextNode, slotIndex);
        });
    }
    // ─────────────────────────────────────────────────────
    //  UPDATE BLOCKS
    // ─────────────────────────────────────────────────────
    /**
     * Updates a block's configuration.
     */
    updateBlock(blockNode, updates) {
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
            }
            else {
                blockNode.info.registerAs.set(updates.registerAs);
            }
        }
        if (updates.foreachOutputBlockId !== undefined) {
            if (!blockNode.info.foreachOutputBlockId) {
                blockNode.info.add_attr('foreachOutputBlockId', updates.foreachOutputBlockId);
            }
            else {
                blockNode.info.foreachOutputBlockId.set(updates.foreachOutputBlockId);
            }
        }
        if (updates.foreachItemRef !== undefined) {
            if (!blockNode.info.foreachItemRef) {
                blockNode.info.add_attr('foreachItemRef', updates.foreachItemRef);
            }
            else {
                blockNode.info.foreachItemRef.set(updates.foreachItemRef);
            }
        }
        if (updates.foreachConcurrency !== undefined) {
            if (!blockNode.info.foreachConcurrency) {
                blockNode.info.add_attr('foreachConcurrency', updates.foreachConcurrency);
            }
            else {
                blockNode.info.foreachConcurrency.set(updates.foreachConcurrency);
            }
        }
        if (updates.ifThenOutputBlockId !== undefined) {
            if (!blockNode.info.ifThenOutputBlockId) {
                blockNode.info.add_attr('ifThenOutputBlockId', updates.ifThenOutputBlockId);
            }
            else {
                blockNode.info.ifThenOutputBlockId.set(updates.ifThenOutputBlockId);
            }
        }
        if (updates.ifElseOutputBlockId !== undefined) {
            if (!blockNode.info.ifElseOutputBlockId) {
                blockNode.info.add_attr('ifElseOutputBlockId', updates.ifElseOutputBlockId);
            }
            else {
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
    loadWorkflowDAG(workflowNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const visited = new Map();
            yield this.collectBlocks(workflowNode, visited);
            return { blocks: [...visited.values()] };
        });
    }
    /**
     * Recursively collects all blocks reachable from a parent node.
     * Handles deduplication (a block with multiple parents is only processed once).
     */
    collectBlocks(parentNode, visited) {
        return __awaiter(this, void 0, void 0, function* () {
            const children = yield parentNode.getChildren(analysisWorkflowBlock_1.PARENT_TO_WORKFLOW_BLOCK_RELATION);
            for (const childNode of children) {
                const childId = childNode.getId().get();
                if (visited.has(childId))
                    continue;
                const block = this.blockNodeToMemory(childNode);
                visited.set(childId, block);
                yield this.attachSubWorkflows(block, childNode);
                // Recurse to find downstream dependent blocks
                yield this.collectBlocks(childNode, visited);
            }
        });
    }
    /**
     * Loads a container block's sub-workflows onto its in-memory block: the iteration body
     * of a FOREACH / FILTER, or the then / else branches of an IF. A no-op for other blocks.
     */
    attachSubWorkflows(block, blockNode) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, analysisWorkflowBlock_1.isIterationBlock)(block.algorithmName)) {
                const sub = yield this.loadSubWorkflow(blockNode, analysisWorkflowBlock_1.ITERATION_SUB_WORKFLOW_SLOT);
                if (!sub) {
                    throw new Error(`${block.algorithmName} block "${block.name}" has no sub-workflow blocks`);
                }
                block.subWorkflow = sub;
            }
            if (block.algorithmName === 'IF') {
                block.thenWorkflow = yield this.loadSubWorkflow(blockNode, analysisWorkflowBlock_1.IF_THEN_SUB_WORKFLOW_SLOT);
                block.elseWorkflow = yield this.loadSubWorkflow(blockNode, analysisWorkflowBlock_1.IF_ELSE_SUB_WORKFLOW_SLOT);
            }
        });
    }
    /**
     * Loads one sub-workflow slot of a container block: its root sub-blocks (via the slot's
     * relation), everything reachable from them, and the designated output block. Returns
     * undefined when the slot holds no sub-blocks (an IF branch that was not defined).
     */
    loadSubWorkflow(containerNode, slot) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const subRoots = yield containerNode.getChildren(slot.relation);
            if (subRoots.length === 0)
                return undefined;
            const subVisited = new Map();
            for (const subRoot of subRoots) {
                const subId = subRoot.getId().get();
                if (subVisited.has(subId))
                    continue;
                const block = this.blockNodeToMemory(subRoot);
                subVisited.set(subId, block);
                yield this.attachSubWorkflows(block, subRoot);
                // Sub-block dependents use the normal block relation
                yield this.collectBlocks(subRoot, subVisited);
            }
            const outputBlockId = containerNode.info[slot.outputField]
                ? containerNode.info[slot.outputField].get()
                : '';
            if (!outputBlockId) {
                throw new Error(`${(_b = (_a = containerNode.info.algorithmName) === null || _a === void 0 ? void 0 : _a.get()) !== null && _b !== void 0 ? _b : 'Container'} block ` +
                    `"${containerNode.getName().get()}" is missing ${slot.outputField}`);
            }
            return { blocks: [...subVisited.values()], outputBlockId };
        });
    }
    /**
     * Converts a block SpinalNode to its in-memory IWorkflowBlock representation.
     */
    blockNodeToMemory(blockNode) {
        var _a, _b, _c, _d;
        const id = blockNode.getId().get();
        const name = (_a = blockNode.getName().get()) !== null && _a !== void 0 ? _a : id;
        const algorithmName = (_c = (_b = blockNode.info.algorithmName) === null || _b === void 0 ? void 0 : _b.get()) !== null && _c !== void 0 ? _c : '';
        let parameters = {};
        try {
            const paramStr = (_d = blockNode.info.parameters) === null || _d === void 0 ? void 0 : _d.get();
            if (paramStr)
                parameters = JSON.parse(paramStr);
        }
        catch (_e) {
            /* invalid JSON — use empty params */
        }
        const inputBlockIds = this.getInputBlockIds(blockNode);
        const orderBlockIds = this.getOrderBlockIds(blockNode);
        const registerAs = blockNode.info.registerAs
            ? blockNode.info.registerAs.get()
            : undefined;
        const block = {
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
            }
            catch (_f) {
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
    getInputBlockIds(blockNode) {
        var _a;
        try {
            const raw = (_a = blockNode.info.inputBlockIds) === null || _a === void 0 ? void 0 : _a.get();
            if (!raw)
                return [];
            return JSON.parse(raw);
        }
        catch (_b) {
            return [];
        }
    }
    /**
     * Reads the order-only block IDs from a block node's info.
     * Returns [] for blocks created before this field existed.
     */
    getOrderBlockIds(blockNode) {
        var _a;
        try {
            const raw = (_a = blockNode.info.orderBlockIds) === null || _a === void 0 ? void 0 : _a.get();
            if (!raw)
                return [];
            return JSON.parse(raw);
        }
        catch (_b) {
            return [];
        }
    }
    /**
     * Sets the order-only block IDs on a block node (order-only dependencies that
     * gate execution but pass no data). Adds the info attribute if missing, so it
     * also works on blocks created before this field existed.
     */
    setOrderBlockIds(blockNode, ids) {
        if (!blockNode.info.orderBlockIds) {
            blockNode.info.add_attr('orderBlockIds', JSON.stringify(ids));
        }
        else {
            blockNode.info.orderBlockIds.set(JSON.stringify(ids));
        }
    }
    /**
     * Gets all block nodes that are direct children of a workflow node.
     */
    getWorkflowBlocks(workflowNode) {
        return __awaiter(this, void 0, void 0, function* () {
            return workflowNode.getChildren(analysisWorkflowBlock_1.PARENT_TO_WORKFLOW_BLOCK_RELATION);
        });
    }
    /**
     * Gets the sub-blocks of a FOREACH block.
     */
    getForeachSubBlocks(foreachBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            return foreachBlock.getChildren(analysisWorkflowBlock_1.FOREACH_TO_SUB_BLOCK_RELATION);
        });
    }
}
exports.default = WorkflowBlockManagerService;
//# sourceMappingURL=WorkflowBlockManagerService.js.map