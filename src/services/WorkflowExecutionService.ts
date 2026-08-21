/* eslint-disable @typescript-eslint/no-explicit-any */
import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { IWorkflowBlock, IWorkflowDAG } from '../interfaces/IWorkflowBlock';
import {
    AlgorithmRegistry,
    AlgorithmRunContext,
    AlgorithmParams,
    ExecutionMetadata,
} from '../algorithms/definitions/core';
import { runWithConcurrency, normalizeForeachConcurrency } from './concurrency';

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
 * Produces a short, bounded description of a runtime value for error messages —
 * enough to diagnose type mismatches (e.g. a register holding a model instead of
 * a node) without dumping large objects.
 */
export function describeValue(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return `array(length=${value.length})`;
    const t = typeof value;
    if (t !== 'object') return `${t} ${JSON.stringify(value)}`;
    const ctor = (value as { constructor?: { name?: string } }).constructor?.name;
    return ctor ? `object<${ctor}>` : 'object';
}

/** Marks an Error as already carrying block context, so it isn't wrapped again as it bubbles up. */
const BLOCK_TAGGED = Symbol('blockTagged');

/**
 * Runtime context for workflow DAG execution.
 * Carries the current work node, named input registers, and cached block outputs.
 */
/**
 * A block that did not produce a value during a `continue`-policy execution — either it
 * threw (`reason: 'error'`) or it was skipped because a dependency failed (`reason: 'skipped'`).
 * Collected so the caller can report per-output failures instead of aborting the whole run.
 */
export interface BlockFailure {
    blockId: string;
    blockName: string;
    algorithmName: string;
    reason: 'error' | 'skipped';
    /** The error message (for `reason: 'error'`). */
    error?: string;
    /** The failed/skipped block id this one depended on (for `reason: 'skipped'`). */
    blockedBy?: string;
}

export interface WorkflowExecutionContext {
    /** The current work node being processed */
    workNode: SpinalNode<any>;

    /**
     * Sink for block failures under the `continue` error policy (shared by reference across
     * a work node's input/execution workflows and their FOREACH/IF sub-contexts). Absent for
     * `stop`-policy runs, which abort on the first error instead of collecting.
     */
    failures?: BlockFailure[];

    /**
     * Named input variables registered during the input workflow (e.g., I0, I1).
     * Readable during the execution workflow via FETCH_INPUT_REGISTER blocks.
     */
    inputRegisters: Map<string, unknown>;

    /** Cached outputs of executed blocks, keyed by block ID */
    blockOutputs: Map<string, unknown>;

    /** Metadata for this analysis execution (reference time, trigger context, etc.) */
    execution: ExecutionMetadata;
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
        // 'stop' → fail-fast (abort on first error). 'continue' (default) → fault-isolated:
        // a failed block and its downstream cone are skipped, independent branches keep going.
        const stopOnError = context.execution?.errorPolicy === 'stop';

        // Block ids that failed or were skipped in THIS dag — used to skip their dependents.
        const failedIds = new Set<string>();

        for (const block of sorted) {
            if (!stopOnError) {
                // Skip a block whose input/order dependency (within this dag) already failed:
                // its output is missing, so running it would just error on a missing input.
                const blockedBy = [...block.inputBlockIds, ...block.orderBlockIds]
                    .find((depId) => failedIds.has(depId));
                if (blockedBy !== undefined) {
                    failedIds.add(block.id);
                    this.recordFailure(context, block, { reason: 'skipped', blockedBy });
                    continue;
                }
            }

            try {
                await this.executeBlock(block, context);
            } catch (error: any) {
                if (stopOnError) throw error; // fail-fast (opt-in)
                failedIds.add(block.id);
                const message = error instanceof Error ? error.message : String(error);
                this.recordFailure(context, block, { reason: 'error', error: message });
                console.error(`[Execution] ${message} — isolated; independent branches continue.`);
            }
        }
    }

    /** Records a block failure/skip into the shared context sink (continue policy only). */
    private recordFailure(
        context: WorkflowExecutionContext,
        block: IWorkflowBlock,
        detail: { reason: 'error'; error: string } | { reason: 'skipped'; blockedBy: string }
    ): void {
        if (!context.failures) return;
        context.failures.push({
            blockId: block.id,
            blockName: block.name,
            algorithmName: block.algorithmName,
            ...detail,
        });
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
        try {
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
        } catch (error: any) {
            // Already tagged by a nested block (FOREACH/IF sub-workflow) — let it bubble
            // up unchanged so the message points at the innermost failing block.
            if (error && error[BLOCK_TAGGED]) throw error;
            const baseMessage = error instanceof Error ? error.message : String(error);
            const tagged: any = new Error(
                `Block "${block.name}" (${block.algorithmName}): ${baseMessage}`
            );
            tagged[BLOCK_TAGGED] = true;
            throw tagged;
        }
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
        const subWorkflow = block.subWorkflow;
        const concurrency = normalizeForeachConcurrency(block.foreachConcurrency);

        // Dispatch the iterations per the block's concurrency (default SEQUENTIAL). Each
        // iteration runs in its own sub-context — a COPY of the parent block outputs plus the
        // current element — so a sub-block can read blocks computed before the FOREACH (parent
        // refs) and any ancestor FOREACH item (the same inheritance IF branches get), while
        // iterations stay isolated from each other and from the parent. Results come back in
        // input order regardless of mode; the FOREACH's own output is set on the parent below.
        const results = await runWithConcurrency(inputArray, concurrency, async (element) => {
            const subContext: WorkflowExecutionContext = {
                workNode: context.workNode,
                inputRegisters: new Map(context.inputRegisters),
                blockOutputs: new Map(context.blockOutputs),
                execution: context.execution,
                failures: context.failures,
            };

            // Inject the current element under its named virtual ID
            subContext.blockOutputs.set(itemVirtualId, element);

            // Execute sub-workflow DAG
            await this.executeDAG({ blocks: subWorkflow.blocks }, subContext);

            // Return the designated output for this element
            return subContext.blockOutputs.get(subWorkflow.outputBlockId);
        });

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
            execution: context.execution,
            failures: context.failures,
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
            execution: context.execution,
        };

        let output: unknown;
        try {
            output = await algorithm.run(
                algInput,
                block.parameters as AlgorithmParams,
                algContext
            );
        } catch (error: any) {
            const baseMessage = error instanceof Error ? error.message : String(error);
            const tagged: any = new Error(
                `Block "${block.name}" (${block.algorithmName}): ${baseMessage} ` +
                `[received input: ${describeValue(algInput)}]`
            );
            tagged[BLOCK_TAGGED] = true;
            throw tagged;
        }

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

            // Visit all predecessors first: data inputs AND order-only deps (`after`).
            // Both constrain ordering; only inputBlockIds carry data (see resolveInputs).
            const predecessors = [...block.inputBlockIds, ...block.orderBlockIds];
            for (const depId of predecessors) {
                const dep = blockMap.get(depId);
                if (dep) {
                    visit(dep);
                }
                // If dep is not in blockMap, it may be from an outer scope (e.g., parent workflow)
                // or a virtual id ($node, FOREACH item) — both are already available, so skip.
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
