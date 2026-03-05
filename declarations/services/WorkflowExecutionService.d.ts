import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { IWorkflowDAG } from '../interfaces/IWorkflowBlock';
import { AlgorithmRegistry } from '../algorithms/definitions/core';
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
 * Executes blocks in topological order, resolving dependencies by reading
 * upstream block outputs. Handles special block types:
 * - CURRENT_NODE: injects the context work node (handled by algorithm itself)
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
