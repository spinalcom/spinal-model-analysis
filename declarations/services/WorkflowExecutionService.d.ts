import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { IWorkflowDAG } from '../interfaces/IWorkflowBlock';
import { AlgorithmRegistry } from '../algorithms/definitions/core';
/**
 * Reserved block ID that is always pre-seeded in blockOutputs with the context work node.
 * Blocks that need the work node can reference this in their inputBlockIds.
 * In JSON configs, use the special ref '$node' which maps to this ID.
 */
export declare const WORK_NODE_RESERVED_ID = "__WORK_NODE__";
/**
 * Reserved block ID for the implicit ELEMENT block inside FOREACH sub-workflows.
 * The executor auto-injects this block with the current iteration element.
 * In JSON configs, sub-workflow blocks use the special ref '$item' to reference it.
 */
export declare const FOREACH_ELEMENT_RESERVED_ID = "__FOREACH_ELEMENT__";
/**
 * Runtime context for workflow DAG execution.
 * Carries the current work node, named input registers, and cached block outputs.
 */
export interface WorkflowExecutionContext {
    /** The current work node being processed */
    workNode: SpinalNode<any>;
    /**
     * Named input variables registered during the input workflow (e.g., I0, I1).
     * Readable during the execution workflow via FETCH_INPUT_REGISTER blocks.
     */
    inputRegisters: Map<string, unknown>;
    /** Cached outputs of executed blocks, keyed by block ID */
    blockOutputs: Map<string, unknown>;
}
/**
 * DAG execution engine for workflow blocks.
 *
 * Before execution, the work node is pre-seeded in blockOutputs under
 * WORK_NODE_RESERVED_ID ('__WORK_NODE__'). Blocks that need the work node
 * reference this ID in their inputBlockIds (via '$node' in JSON configs).
 *
 * Executes blocks in topological order, resolving dependencies by reading
 * upstream block outputs. Handles special block types:
 * - FETCH_INPUT_REGISTER: reads a named variable from inputRegisters
 * - SET_INPUT_REGISTER: passes through and registers (via block.registerAs)
 * - ELEMENT: element source for FOREACH sub-workflows (value injected by executor)
 * - FOREACH: iterates over an array, executing a sub-workflow per element
 */
export default class WorkflowExecutionService {
    private readonly registry;
    constructor(registry: AlgorithmRegistry);
    /**
     * Executes a workflow DAG within the given context.
     * Blocks are executed in topological order (dependencies first).
     *
     * The work node is automatically pre-seeded in blockOutputs under
     * WORK_NODE_RESERVED_ID, so any block can reference it as an input
     * without needing an explicit CURRENT_NODE block.
     *
     * @param dag - The in-memory workflow DAG
     * @param context - The execution context (workNode, registers, outputs)
     */
    executeDAG(dag: IWorkflowDAG, context: WorkflowExecutionContext): Promise<void>;
    /**
     * Executes a DAG and returns the output of a specific block.
     * Useful for workflows that produce a single result (e.g., worknode resolver).
     */
    executeDAGAndGetOutput(dag: IWorkflowDAG, context: WorkflowExecutionContext, outputBlockId: string): Promise<unknown>;
    private executeBlock;
    /**
     * Handles FETCH_INPUT_REGISTER: reads a named variable from inputRegisters.
     */
    private executeFetchInputRegister;
    /**
     * Handles FOREACH: iterates over an array input, executing the sub-workflow
     * for each element. Collects results into an output array.
     *
     * The current iteration element is automatically injected under
     * FOREACH_ELEMENT_RESERVED_ID. Sub-workflow blocks reference it via '$item'.
     * An explicit ELEMENT block is no longer required.
     */
    private executeForeach;
    /**
     * Executes a normal (non-special) block by calling its algorithm from the registry.
     */
    private executeNormalBlock;
    /**
     * Resolves the ordered inputs for a block from previously computed block outputs.
     */
    private resolveInputs;
    /**
     * Topological sort of DAG blocks based on inputBlockIds dependencies.
     * Ensures that every block is executed after all of its dependencies.
     *
     * Uses iterative DFS with cycle detection.
     */
    private topologicalSort;
}
