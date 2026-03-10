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
 * - FOREACH blocks have sub-workflow blocks as children via a dedicated relation
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
        var _a;
        const blockInfo = {
            name: (_a = options === null || options === void 0 ? void 0 : options.name) !== null && _a !== void 0 ? _a : algorithmName,
            type: analysisWorkflowBlock_1.WORKFLOW_BLOCK_NODE_TYPE,
            algorithmName,
            parameters: JSON.stringify(parameters),
            inputBlockIds: JSON.stringify([]),
        };
        if (options === null || options === void 0 ? void 0 : options.registerAs) {
            blockInfo.registerAs = options.registerAs;
        }
        if (options === null || options === void 0 ? void 0 : options.foreachOutputBlockId) {
            blockInfo.foreachOutputBlockId = options.foreachOutputBlockId;
        }
        const blockNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(blockInfo);
        const blockNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(blockNodeId);
        if (!blockNode)
            throw new Error('Failed to create block node');
        return blockNode;
    }
    /**
     * Creates a sub-block for a FOREACH block using the dedicated FOREACH relation.
     * Sub-blocks form a mini-DAG inside the FOREACH block.
     */
    createForeachSubBlock(foreachBlock, contextNode, algorithmName, parameters = {}, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const blockInfo = {
                name: (_a = options === null || options === void 0 ? void 0 : options.name) !== null && _a !== void 0 ? _a : algorithmName,
                type: analysisWorkflowBlock_1.WORKFLOW_BLOCK_NODE_TYPE,
                algorithmName,
                parameters: JSON.stringify(parameters),
                inputBlockIds: JSON.stringify([]),
            };
            if (options === null || options === void 0 ? void 0 : options.registerAs) {
                blockInfo.registerAs = options.registerAs;
            }
            const blockNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(blockInfo);
            const blockNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(blockNodeId);
            if (!blockNode)
                throw new Error('Failed to create FOREACH sub-block node');
            yield foreachBlock.addChildInContext(blockNode, analysisWorkflowBlock_1.FOREACH_TO_SUB_BLOCK_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE, contextNode);
            return blockNode;
        });
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
            // Add graph edge: sourceBlock → dependentBlock
            yield sourceBlock.addChildInContext(dependentBlock, analysisWorkflowBlock_1.PARENT_TO_WORKFLOW_BLOCK_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE, contextNode);
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
                // If FOREACH, load its sub-workflow
                if (block.algorithmName === 'FOREACH') {
                    block.subWorkflow = yield this.loadForeachSubWorkflow(childNode);
                }
                // Recurse to find downstream dependent blocks
                yield this.collectBlocks(childNode, visited);
            }
        });
    }
    /**
     * Loads the sub-workflow DAG for a FOREACH block.
     */
    loadForeachSubWorkflow(foreachNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const subVisited = new Map();
            // Get direct sub-blocks of the FOREACH node
            const subRoots = yield foreachNode.getChildren(analysisWorkflowBlock_1.FOREACH_TO_SUB_BLOCK_RELATION);
            for (const subRoot of subRoots) {
                const subId = subRoot.getId().get();
                if (subVisited.has(subId))
                    continue;
                const block = this.blockNodeToMemory(subRoot);
                subVisited.set(subId, block);
                // Recurse into sub-block dependents (they use the normal block relation)
                yield this.collectBlocks(subRoot, subVisited);
            }
            // Get the designated output block ID
            const outputBlockId = foreachNode.info.foreachOutputBlockId
                ? foreachNode.info.foreachOutputBlockId.get()
                : '';
            if (!outputBlockId) {
                throw new Error(`FOREACH block "${foreachNode.getName().get()}" is missing foreachOutputBlockId`);
            }
            return {
                blocks: [...subVisited.values()],
                outputBlockId,
            };
        });
    }
    /**
     * Converts a block SpinalNode to its in-memory IWorkflowBlock representation.
     */
    blockNodeToMemory(blockNode) {
        var _a, _b, _c;
        const id = blockNode.getId().get();
        const algorithmName = (_b = (_a = blockNode.info.algorithmName) === null || _a === void 0 ? void 0 : _a.get()) !== null && _b !== void 0 ? _b : '';
        let parameters = {};
        try {
            const paramStr = (_c = blockNode.info.parameters) === null || _c === void 0 ? void 0 : _c.get();
            if (paramStr)
                parameters = JSON.parse(paramStr);
        }
        catch (_d) {
            /* invalid JSON — use empty params */
        }
        const inputBlockIds = this.getInputBlockIds(blockNode);
        const registerAs = blockNode.info.registerAs
            ? blockNode.info.registerAs.get()
            : undefined;
        const block = {
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