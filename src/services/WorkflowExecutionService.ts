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
 * Prefix for virtual block IDs representing FOREACH iteration elements.
 * Each FOREACH's element is stored as `__ITEM_<itemRef>__` in blockOutputs.
 */
export const FOREACH_ITEM_PREFIX = '__ITEM_';
export const FOREACH_ITEM_SUFFIX = '__';

/**
 * Generates the virtual block ID for a FOREACH item ref.
 * Used in both the factory (to store in inputBlockIds) and the executor (to inject the element).
 */
export function foreachItemVirtualId(itemRef: string): string {
    return `${FOREACH_ITEM_PREFIX}${itemRef}${FOREACH_ITEM_SUFFIX}`;
}

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
 * - FOREACH: iterates over an array, executing a sub-workflow per element.
 *   The element is injected under a virtual ID derived from the block's foreachItemRef.
 *   Nested FOREACH blocks propagate parent item refs to inner sub-contexts.
 * - IF: conditional branching, executes thenWorkflow or elseWorkflow based on predicate
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

        // ── FOREACH (higher-order iteration) ──
        if (block.algorithmName === 'FOREACH' && block.subWorkflow) {
            await this.executeForeach(block, inputs, context);
            return;
        }

        // ── IF (conditional branching) ──
        if (block.algorithmName === 'IF' && (block.thenWorkflow || block.elseWorkflow)) {
            await this.executeIf(block, inputs, context);
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
     * The current iteration element is injected under the virtual ID derived from
     * the block's foreachItemRef. Parent FOREACH item refs are propagated into
     * the sub-context so nested sub-workflows can access any ancestor's element.
     */
    private async executeForeach(
        block: IWorkflowBlock,
        inputs: unknown[],
        context: WorkflowExecutionContext
    ): Promise<void> {
        if (!block.subWorkflow) {
            throw new Error(`FOREACH block "${block.name}" has no subWorkflow defined`);
        }
        if (!block.foreachItemRef) {
            throw new Error(`FOREACH block "${block.name}" is missing foreachItemRef`);
        }

        const inputArray = inputs[0];
        if (!Array.isArray(inputArray)) {
            throw new Error(
                `FOREACH block "${block.name}" expects an array as its first input, ` +
                `got ${typeof inputArray}`
            );
        }

        const itemVirtualId = foreachItemVirtualId(block.foreachItemRef);
        const results: unknown[] = [];

        for (const element of inputArray) {
            // Create an isolated sub-context for this iteration
            const subContext: WorkflowExecutionContext = {
                workNode: context.workNode,
                inputRegisters: new Map(context.inputRegisters),
                blockOutputs: new Map(),
            };

            // Propagate parent FOREACH item refs into the sub-context
            for (const [key, value] of context.blockOutputs) {
                if (key.startsWith(FOREACH_ITEM_PREFIX)) {
                    subContext.blockOutputs.set(key, value);
                }
            }

            // Inject the current element under its named virtual ID
            subContext.blockOutputs.set(itemVirtualId, element);

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
     * Handles IF: conditional branching with sub-workflows.
     *
     * inputs[0] = boolean predicate
     *
     * If predicate is true → executes thenWorkflow
     * If predicate is false → executes elseWorkflow (if defined, else output = undefined)
     *
     * IF sub-workflows inherit all parent block outputs (including FOREACH item refs),
     * so branches can reference any block computed before the IF block and any
     * ancestor FOREACH element.
     */
    private async executeIf(
        block: IWorkflowBlock,
        inputs: unknown[],
        context: WorkflowExecutionContext
    ): Promise<void> {
        const predicate = inputs[0];
        if (typeof predicate !== 'boolean') {
            throw new Error(
                `IF block "${block.name}" expects a boolean as its first input, ` +
                `got ${typeof predicate}`
            );
        }

        // Pick the branch to execute
        const branch = predicate ? block.thenWorkflow : block.elseWorkflow;

        if (!branch) {
            // No branch for this condition — output is undefined
            context.blockOutputs.set(block.id, undefined);
            return;
        }

        // Create sub-context inheriting parent block outputs
        // (IF branches run once and often need surrounding context)
        const subContext: WorkflowExecutionContext = {
            workNode: context.workNode,
            inputRegisters: new Map(context.inputRegisters),
            blockOutputs: new Map(context.blockOutputs),
        };

        // Execute the branch sub-workflow
        await this.executeDAG(
            { blocks: branch.blocks },
            subContext
        );

        // Collect the branch output
        const result = subContext.blockOutputs.get(branch.outputBlockId);
        context.blockOutputs.set(block.id, result);
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
