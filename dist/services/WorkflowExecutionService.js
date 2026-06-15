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
exports.describeValue = exports.foreachItemVirtualId = exports.FOREACH_ITEM_SUFFIX = exports.FOREACH_ITEM_PREFIX = exports.WORK_NODE_RESERVED_ID = void 0;
/**
 * Reserved block ID that is always pre-seeded in blockOutputs with the context work node.
 * Blocks that need the work node can reference this in their inputBlockIds.
 * In JSON configs, use the special ref '$node' which maps to this ID.
 */
exports.WORK_NODE_RESERVED_ID = '__WORK_NODE__';
/**
 * Prefix for virtual block IDs representing FOREACH iteration elements.
 * Each FOREACH's element is stored as `__ITEM_<itemRef>__` in blockOutputs.
 */
exports.FOREACH_ITEM_PREFIX = '__ITEM_';
exports.FOREACH_ITEM_SUFFIX = '__';
/**
 * Generates the virtual block ID for a FOREACH item ref.
 * Used in both the factory (to store in inputBlockIds) and the executor (to inject the element).
 */
function foreachItemVirtualId(itemRef) {
    return `${exports.FOREACH_ITEM_PREFIX}${itemRef}${exports.FOREACH_ITEM_SUFFIX}`;
}
exports.foreachItemVirtualId = foreachItemVirtualId;
/**
 * Produces a short, bounded description of a runtime value for error messages —
 * enough to diagnose type mismatches (e.g. a register holding a model instead of
 * a node) without dumping large objects.
 */
function describeValue(value) {
    var _a;
    if (value === null)
        return 'null';
    if (value === undefined)
        return 'undefined';
    if (Array.isArray(value))
        return `array(length=${value.length})`;
    const t = typeof value;
    if (t !== 'object')
        return `${t} ${JSON.stringify(value)}`;
    const ctor = (_a = value.constructor) === null || _a === void 0 ? void 0 : _a.name;
    return ctor ? `object<${ctor}>` : 'object';
}
exports.describeValue = describeValue;
/** Marks an Error as already carrying block context, so it isn't wrapped again as it bubbles up. */
const BLOCK_TAGGED = Symbol('blockTagged');
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
class WorkflowExecutionService {
    constructor(registry) {
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
    executeDAG(dag, context) {
        return __awaiter(this, void 0, void 0, function* () {
            // Pre-seed the work node so blocks can reference it directly
            context.blockOutputs.set(exports.WORK_NODE_RESERVED_ID, context.workNode);
            const sorted = this.topologicalSort(dag.blocks);
            for (const block of sorted) {
                yield this.executeBlock(block, context);
            }
        });
    }
    /**
     * Executes a DAG and returns the output of a specific block.
     * Useful for workflows that produce a single result (e.g., worknode resolver).
     */
    executeDAGAndGetOutput(dag, context, outputBlockId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.executeDAG(dag, context);
            return context.blockOutputs.get(outputBlockId);
        });
    }
    // ─────────────────────────────────────────────────────
    //  BLOCK EXECUTION
    // ─────────────────────────────────────────────────────
    executeBlock(block, context) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    yield this.executeForeach(block, inputs, context);
                    return;
                }
                // ── IF (conditional branching) ──
                if (block.algorithmName === 'IF' && (block.thenWorkflow || block.elseWorkflow)) {
                    yield this.executeIf(block, inputs, context);
                    return;
                }
                // ── Normal algorithm execution ──
                yield this.executeNormalBlock(block, inputs, context);
            }
            catch (error) {
                // Already tagged by a nested block (FOREACH/IF sub-workflow) — let it bubble
                // up unchanged so the message points at the innermost failing block.
                if (error && error[BLOCK_TAGGED])
                    throw error;
                const baseMessage = error instanceof Error ? error.message : String(error);
                const tagged = new Error(`Block "${block.name}" (${block.algorithmName}): ${baseMessage}`);
                tagged[BLOCK_TAGGED] = true;
                throw tagged;
            }
        });
    }
    /**
     * Handles FETCH_INPUT_REGISTER: reads a named variable from inputRegisters.
     */
    executeFetchInputRegister(block, context) {
        const registerName = block.parameters['registerName'];
        if (!registerName) {
            throw new Error(`FETCH_INPUT_REGISTER block "${block.name}" is missing the registerName parameter`);
        }
        if (!context.inputRegisters.has(registerName)) {
            throw new Error(`Input register "${registerName}" not found (block: "${block.name}"). Available registers: ` +
                `[${[...context.inputRegisters.keys()].join(', ')}]`);
        }
        context.blockOutputs.set(block.id, context.inputRegisters.get(registerName));
    }
    /**
     * Handles FOREACH: iterates over an array input, executing the sub-workflow
     * for each element. Collects results into an output array.
     *
     * The current iteration element is injected under the virtual ID derived from
     * the block's foreachItemRef. Parent FOREACH item refs are propagated into
     * the sub-context so nested sub-workflows can access any ancestor's element.
     */
    executeForeach(block, inputs, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!block.subWorkflow) {
                throw new Error(`FOREACH block "${block.name}" has no subWorkflow defined`);
            }
            if (!block.foreachItemRef) {
                throw new Error(`FOREACH block "${block.name}" is missing foreachItemRef`);
            }
            const inputArray = inputs[0];
            if (!Array.isArray(inputArray)) {
                throw new Error(`FOREACH block "${block.name}" expects an array as its first input, ` +
                    `got ${typeof inputArray}`);
            }
            const itemVirtualId = foreachItemVirtualId(block.foreachItemRef);
            const results = [];
            for (const element of inputArray) {
                // Create an isolated sub-context for this iteration
                const subContext = {
                    workNode: context.workNode,
                    inputRegisters: new Map(context.inputRegisters),
                    blockOutputs: new Map(),
                    execution: context.execution,
                };
                // Propagate parent FOREACH item refs into the sub-context
                for (const [key, value] of context.blockOutputs) {
                    if (key.startsWith(exports.FOREACH_ITEM_PREFIX)) {
                        subContext.blockOutputs.set(key, value);
                    }
                }
                // Inject the current element under its named virtual ID
                subContext.blockOutputs.set(itemVirtualId, element);
                // Execute sub-workflow DAG
                yield this.executeDAG({ blocks: block.subWorkflow.blocks }, subContext);
                // Collect the designated output
                const result = subContext.blockOutputs.get(block.subWorkflow.outputBlockId);
                results.push(result);
            }
            context.blockOutputs.set(block.id, results);
        });
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
    executeIf(block, inputs, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const predicate = inputs[0];
            if (typeof predicate !== 'boolean') {
                throw new Error(`IF block "${block.name}" expects a boolean as its first input, ` +
                    `got ${typeof predicate}`);
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
            const subContext = {
                workNode: context.workNode,
                inputRegisters: new Map(context.inputRegisters),
                blockOutputs: new Map(context.blockOutputs),
                execution: context.execution,
            };
            // Execute the branch sub-workflow
            yield this.executeDAG({ blocks: branch.blocks }, subContext);
            // Collect the branch output
            const result = subContext.blockOutputs.get(branch.outputBlockId);
            context.blockOutputs.set(block.id, result);
        });
    }
    /**
     * Executes a normal (non-special) block by calling its algorithm from the registry.
     */
    executeNormalBlock(block, inputs, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const algorithm = this.registry.get(block.algorithmName);
            // Build the algorithm input:
            // - No inputs → empty array
            // - Single input → pass directly (algorithms expect single value or array)
            // - Multiple inputs → pass as array (algorithms like IF expect [payload, predicate])
            let algInput;
            if (inputs.length === 0) {
                algInput = [];
            }
            else if (inputs.length === 1) {
                algInput = inputs[0];
            }
            else {
                algInput = inputs;
            }
            // Build algorithm run context
            const algContext = {
                selfNode: context.workNode,
                execution: context.execution,
            };
            let output;
            try {
                output = yield algorithm.run(algInput, block.parameters, algContext);
            }
            catch (error) {
                const baseMessage = error instanceof Error ? error.message : String(error);
                const tagged = new Error(`Block "${block.name}" (${block.algorithmName}): ${baseMessage} ` +
                    `[received input: ${describeValue(algInput)}]`);
                tagged[BLOCK_TAGGED] = true;
                throw tagged;
            }
            context.blockOutputs.set(block.id, output);
            // If the block registers its output as a named variable
            if (block.registerAs) {
                context.inputRegisters.set(block.registerAs, output);
            }
        });
    }
    // ─────────────────────────────────────────────────────
    //  INPUT RESOLUTION
    // ─────────────────────────────────────────────────────
    /**
     * Resolves the ordered inputs for a block from previously computed block outputs.
     */
    resolveInputs(block, context) {
        return block.inputBlockIds.map((depId) => {
            if (!context.blockOutputs.has(depId)) {
                throw new Error(`Block "${block.name}" (${block.algorithmName}) depends on block "${depId}" ` +
                    'which has not been executed yet. Check for missing dependencies or cycles.');
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
    topologicalSort(blocks) {
        const blockMap = new Map(blocks.map((b) => [b.id, b]));
        const visited = new Set();
        const inProgress = new Set(); // for cycle detection
        const sorted = [];
        const visit = (block) => {
            if (visited.has(block.id))
                return;
            if (inProgress.has(block.id)) {
                throw new Error(`Cycle detected in workflow DAG at block "${block.name}" (${block.algorithmName})`);
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
exports.default = WorkflowExecutionService;
//# sourceMappingURL=WorkflowExecutionService.js.map