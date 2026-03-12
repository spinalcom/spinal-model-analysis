/* eslint-disable @typescript-eslint/no-explicit-any */
import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { IWorkflowBlock, IWorkflowDAG } from '../interfaces/IWorkflowBlock';
import {
    AlgorithmRegistry,
    AlgorithmRunContext,
    AlgorithmParams,
} from '../algorithms/definitions/core';

/**
 * Reserved block ID that is always pre-seeded in blockOutputs with the context work node.
 * Blocks that need the work node can reference this in their inputBlockIds.
 * In JSON configs, use the special ref '$node' which maps to this ID.
 */
export const WORK_NODE_RESERVED_ID = '__WORK_NODE__';

/**
 * Reserved block ID for the implicit ELEMENT block inside FOREACH sub-workflows.
 * The executor auto-injects this block with the current iteration element.
 * In JSON configs, sub-workflow blocks use the special ref '$item' to reference it.
 */
export const FOREACH_ELEMENT_RESERVED_ID = '__FOREACH_ELEMENT__';

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
    private readonly registry: AlgorithmRegistry;

    constructor(registry: AlgorithmRegistry) {
        this.registry = registry;
    }

    // ─────────────────────────────────────────────────────
    //  PUBLIC API
    // ─────────────────────────────────────────────────────

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
    public async executeDAG(
        dag: IWorkflowDAG,
        context: WorkflowExecutionContext
    ): Promise<void> {
        // Pre-seed the work node so blocks can reference it directly
        context.blockOutputs.set(WORK_NODE_RESERVED_ID, context.workNode);

        const sorted = this.topologicalSort(dag.blocks);

        for (const block of sorted) {
            await this.executeBlock(block, context);
        }
    }

    /**
     * Executes a DAG and returns the output of a specific block.
     * Useful for workflows that produce a single result (e.g., worknode resolver).
     */
    public async executeDAGAndGetOutput(
        dag: IWorkflowDAG,
        context: WorkflowExecutionContext,
        outputBlockId: string
    ): Promise<unknown> {
        await this.executeDAG(dag, context);
        return context.blockOutputs.get(outputBlockId);
    }

    // ─────────────────────────────────────────────────────
    //  BLOCK EXECUTION
    // ─────────────────────────────────────────────────────

    private async executeBlock(
        block: IWorkflowBlock,
        context: WorkflowExecutionContext
    ): Promise<void> {
        // Gather ordered inputs from upstream blocks
        const inputs = this.resolveInputs(block, context);

        // ── FETCH_INPUT_REGISTER (reads from inputRegisters) ──
        if (block.algorithmName === 'FETCH_INPUT_REGISTER') {
            this.executeFetchInputRegister(block, context);
            return;
        }

        // ── ELEMENT (legacy explicit block — value already injected by FOREACH executor) ──
        if (block.algorithmName === 'ELEMENT') {
            if (!context.blockOutputs.has(block.id)) {
                throw new Error(
                    `ELEMENT block "${block.name}" has no injected value — ` +
                    'it must be inside a FOREACH sub-workflow'
                );
            }
            return; // value already set
        }

        // ── FOREACH (higher-order iteration) ──
        if (block.algorithmName === 'FOREACH' && block.subWorkflow) {
            await this.executeForeach(block, inputs, context);
            return;
        }

        // ── Normal algorithm execution ──
        await this.executeNormalBlock(block, inputs, context);
    }

    /**
     * Handles FETCH_INPUT_REGISTER: reads a named variable from inputRegisters.
     */
    private executeFetchInputRegister(
        block: IWorkflowBlock,
        context: WorkflowExecutionContext
    ): void {
        const registerName = block.parameters['registerName'] as string;
        if (!registerName) {
            throw new Error(
                `FETCH_INPUT_REGISTER block "${block.name}" is missing the registerName parameter`
            );
        }

        if (!context.inputRegisters.has(registerName)) {
            throw new Error(
                `Input register "${registerName}" not found (block: "${block.name}"). Available registers: ` +
                `[${[...context.inputRegisters.keys()].join(', ')}]`
            );
        }

        context.blockOutputs.set(
            block.id,
            context.inputRegisters.get(registerName)
        );
    }

    /**
     * Handles FOREACH: iterates over an array input, executing the sub-workflow
     * for each element. Collects results into an output array.
     *
     * The current iteration element is automatically injected under
     * FOREACH_ELEMENT_RESERVED_ID. Sub-workflow blocks reference it via '$item'.
     * An explicit ELEMENT block is no longer required.
     */
    private async executeForeach(
        block: IWorkflowBlock,
        inputs: unknown[],
        context: WorkflowExecutionContext
    ): Promise<void> {
        if (!block.subWorkflow) {
            throw new Error(`FOREACH block "${block.name}" has no subWorkflow defined`);
        }

        const inputArray = inputs[0];
        if (!Array.isArray(inputArray)) {
            throw new Error(
                `FOREACH block "${block.name}" expects an array as its first input, ` +
                `got ${typeof inputArray}`
            );
        }

        const results: unknown[] = [];

        for (const element of inputArray) {
            // Create an isolated sub-context for this iteration
            const subContext: WorkflowExecutionContext = {
                workNode: context.workNode,
                inputRegisters: new Map(context.inputRegisters), // inherit registers (read-only copy)
                blockOutputs: new Map(),
            };

            // Auto-inject the current element under the reserved ID
            subContext.blockOutputs.set(FOREACH_ELEMENT_RESERVED_ID, element);

            // Execute sub-workflow DAG
            await this.executeDAG(
                { blocks: block.subWorkflow.blocks },
                subContext
            );

            // Collect the designated output
            const result = subContext.blockOutputs.get(
                block.subWorkflow.outputBlockId
            );
            results.push(result);
        }

        context.blockOutputs.set(block.id, results);
    }

    /**
     * Executes a normal (non-special) block by calling its algorithm from the registry.
     */
    private async executeNormalBlock(
        block: IWorkflowBlock,
        inputs: unknown[],
        context: WorkflowExecutionContext
    ): Promise<void> {
        const algorithm = this.registry.get(block.algorithmName);

        // Build the algorithm input:
        // - No inputs → empty array
        // - Single input → pass directly (algorithms expect single value or array)
        // - Multiple inputs → pass as array (algorithms like IF expect [payload, predicate])
        let algInput: any;
        if (inputs.length === 0) {
            algInput = [];
        } else if (inputs.length === 1) {
            algInput = inputs[0];
        } else {
            algInput = inputs;
        }

        // Build algorithm run context
        const algContext: AlgorithmRunContext = {
            selfNode: context.workNode,
        };

        const output = await algorithm.run(
            algInput,
            block.parameters as AlgorithmParams,
            algContext
        );

        context.blockOutputs.set(block.id, output);

        // If the block registers its output as a named variable
        if (block.registerAs) {
            context.inputRegisters.set(block.registerAs, output);
        }
    }

    // ─────────────────────────────────────────────────────
    //  INPUT RESOLUTION
    // ─────────────────────────────────────────────────────

    /**
     * Resolves the ordered inputs for a block from previously computed block outputs.
     */
    private resolveInputs(
        block: IWorkflowBlock,
        context: WorkflowExecutionContext
    ): unknown[] {
        return block.inputBlockIds.map((depId) => {
            if (!context.blockOutputs.has(depId)) {
                throw new Error(
                    `Block "${block.name}" (${block.algorithmName}) depends on block "${depId}" ` +
                    'which has not been executed yet. Check for missing dependencies or cycles.'
                );
            }
            return context.blockOutputs.get(depId);
        });
    }

    // ─────────────────────────────────────────────────────
    //  TOPOLOGICAL SORT
    // ─────────────────────────────────────────────────────

    /**
     * Topological sort of DAG blocks based on inputBlockIds dependencies.
     * Ensures that every block is executed after all of its dependencies.
     *
     * Uses iterative DFS with cycle detection.
     */
    private topologicalSort(blocks: IWorkflowBlock[]): IWorkflowBlock[] {
        const blockMap = new Map(blocks.map((b) => [b.id, b]));
        const visited = new Set<string>();
        const inProgress = new Set<string>(); // for cycle detection
        const sorted: IWorkflowBlock[] = [];

        const visit = (block: IWorkflowBlock): void => {
            if (visited.has(block.id)) return;

            if (inProgress.has(block.id)) {
                throw new Error(
                    `Cycle detected in workflow DAG at block "${block.name}" (${block.algorithmName})`
                );
            }

            inProgress.add(block.id);

            // Visit all dependencies first
            for (const depId of block.inputBlockIds) {
                const dep = blockMap.get(depId);
                if (dep) {
                    visit(dep);
                }
                // If dep is not in blockMap, it may be from an outer scope (e.g., parent workflow)
                // which is valid for sub-workflows
            }

            inProgress.delete(block.id);
            visited.add(block.id);
            sorted.push(block);
        };

        for (const block of blocks) {
            visit(block);
        }

        return sorted;
    }
}
