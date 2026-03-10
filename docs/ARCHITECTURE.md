# spinal-model-analysis — Architecture Guide

> This document is written as a self-contained briefing for an AI agent (or any developer)
> continuing work on this module. It covers the full architecture, file map, data flow,
> and design decisions so you can be productive immediately without needing to re-read
> every source file.

---

## 1. What This Module Does

`spinal-model-analysis` is a **DAG-based analysis execution engine** built on top of the
[SpinalCom](https://www.spinalcom.com/) graph framework. It lets users define analyses as
JSON configurations. Each analysis:

1. **Anchors** to a starting node in the SpinalCom graph.
2. **Resolves work nodes** from the anchor (e.g., all rooms under a building).
3. **Runs an input workflow** per work node to extract data (endpoints, attributes) into
   named registers (`I0`, `I1`, …).
4. **Runs an execution workflow** per work node that consumes those registers and produces
   named outputs.

Every workflow is a **Directed Acyclic Graph (DAG)** of blocks. Each block wraps an
algorithm from a registry and declares ordered input dependencies on other blocks.

---

## 2. High-Level Data Flow

```
                        ┌──────────────────────────────────────────────────┐
                        │                 Analysis Node                    │
                        │  (SpinalNode, type: analysisNode)                │
                        └────┬───┬────┬────┬────┬────┬─────────────────────┘
                             │   │    │    │    │    │
              ┌──────────────┘   │    │    │    │    └──────────────┐
              ▼                  ▼    ▼    ▼    ▼                   ▼
          Anchor            Resolver Input  Exec  Output         Trigger
        (target node)       Workflow Wkfl   Wkfl  (future)      (future)
              │                  │    │      │
              │                  │    │      │
              ▼                  ▼    ▼      ▼
         target node       ┌────────────────────┐
         in the graph      │  DAG of Blocks      │  ← each workflow has one
                           │  (IWorkflowBlock[]) │
                           └────────────────────┘
```

### Execution Pipeline (AnalysisExecutionService)

```
1. resolveAnchorTarget(analysisNode)
   → follows Anchor → linked target node

2. resolveWorkNodes(analysisNode, targetNode)
   → executes worknodeResolver DAG on targetNode
   → returns SpinalNode[] (or [targetNode] if no resolver blocks)

3. For each workNode:
   a. executeInputWorkflow(analysisNode, workNode)
      → runs input DAG → populates inputRegisters Map<string, unknown>
      → e.g. { "I0": <some SpinalNode>, "I1": 42 }

   b. executeExecutionWorkflow(analysisNode, workNode, inputRegisters)
      → runs execution DAG with access to those registers
      → returns Record<string, unknown> keyed by block name (ref)
```

---

## 3. File Map

### Interfaces (`src/interfaces/`)

| File | Purpose |
|------|---------|
| `IWorkflowBlock.ts` | In-memory block representation: `{ id, name, algorithmName, parameters, inputBlockIds, registerAs?, subWorkflow? }`. Also `ISubWorkflow`, `IWorkflowDAG`. |
| `IAnalysisConfigJSON.ts` | JSON-serializable descriptor for creating an entire analysis. Contains `IAnalysisConfigJSON`, `IWorkflowConfigJSON`, `IBlockConfigJSON`. |
| `IAlgorithmParameter.ts` | `{ name, type, description, required? }` — describes an algorithm parameter. |
| `IAlgorithm.ts` | Legacy interface, not actively used by the DAG engine. |

### Constants (`src/constants/`)

Each file defines node type names and relation names used to structure the SpinalGraph.

| File | Key Exports |
|------|-------------|
| `analysisContext.ts` | `ANALYSIS_CONTEXT_NODE_TYPE` |
| `analysisNode.ts` | `ANALYSIS_NODE_TYPE`, `ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION` |
| `analysisAnchor.ts` | `ANCHOR_NODE_TYPE`, `ANCHOR_NODE_TO_LINKED_NODE_RELATION` |
| `analysisWorknodeResolver.ts` | `WORKNODE_RESOLVER_NODE_TYPE`, relation to analysis node |
| `analysisInput.ts` | `INPUT_NODE_TYPE`, relation to analysis node |
| `analysisExecutionWorkflow.ts` | `EXECUTION_WORKFLOW_NODE_TYPE`, relation to analysis node |
| `analysisOutput.ts` | `OUTPUT_NODE_TYPE` (future — no execution logic yet) |
| `analysisTrigger.ts` | `TRIGGER_NODE_TYPE` (future — no execution logic yet) |
| `analysisWorkflowBlock.ts` | `WORKFLOW_BLOCK_NODE_TYPE`, `PARENT_TO_WORKFLOW_BLOCK_RELATION`, `FOREACH_TO_SUB_BLOCK_RELATION` |
| `analysisAlgorithm.ts` | `ALGORITHM_NODE_TYPE` (legacy) |

### Algorithms (`src/algorithms/`)

#### Core (`definitions/core.ts`)

- `AlgorithmDefinition`: `{ name, description, inputTypes, outputType, parameters, run() }`
- `AlgorithmRegistry`: Map-based registry with `register()`, `get()`, `execute()`, `list()`, `toObject()`
- `createAlgorithm()`: Freezes a definition for immutability.
- Key types: `AlgorithmInputValue`, `AlgorithmParams`, `AlgorithmRunContext`, `AlgorithmRunResult`

#### Algorithm Categories

| File | Algorithms |
|------|-----------|
| `number.algorithms.ts` | `COPY_FIRST_NUMBER`, `SUM_NUMBERS` |
| `node.algorithms.ts` | `FIRST_NODE`, `GET_NODE_SERVER_ID`, `GET_NODE_CHILDREN`, `GET_NODE_PARENTS`, `FILTER_NODE` |
| `flow-control.algorithms.ts` | `IF` (routes to then/else child branches) |
| `register.algorithms.ts` | `CURRENT_NODE`, `SET_INPUT_REGISTER`, `FETCH_INPUT_REGISTER`, `ELEMENT`, `FOREACH` |

#### Register Algorithms — Special Handling

These are **not** regular algorithms. The DAG executor intercepts them:

| Algorithm | Behavior |
|-----------|----------|
| `CURRENT_NODE` | Returns `context.selfNode`. Mostly obsolete — use `$node` ref instead. |
| `SET_INPUT_REGISTER` | Passes through input; executor writes output to `inputRegisters[block.registerAs]`. |
| `FETCH_INPUT_REGISTER` | Executor reads `inputRegisters[params.registerName]` and sets as block output. `run()` is never called. |
| `ELEMENT` | Executor pre-injects the current iteration element. `run()` is never called. |
| `FOREACH` | Executor iterates over array input, runs sub-workflow per element. `run()` is never called. |

#### Aggregation (`algorithms.ts`)

Combines all categories into `ALGORITHM_DEFINITIONS[]`, creates a shared `ALGORITHM_REGISTRY` instance, and exports `ALGORITHMS` (name-keyed object).

### Services (`src/services/`)

| File | Class | Purpose |
|------|-------|---------|
| `AnalyticNodeManagerService.ts` | `AnalyticNodeManagerService` | Graph CRUD: create contexts, analysis nodes (with 6 mandatory sub-nodes), get sub-nodes, link anchors, safe deletion. |
| `WorkflowBlockManagerService.ts` | `WorkflowBlockManagerService` | Block CRUD: `createBlock()` (parented), `createOrphanBlock()` (unparented), `createForeachSubBlock()`, `addDependency()`, `updateBlock()`, `loadWorkflowDAG()` (recursive graph → in-memory). |
| `WorkflowExecutionService.ts` | `WorkflowExecutionService` | **DAG execution engine**: topological sort, block execution, input resolution, special block handling (FOREACH, ELEMENT, FETCH_INPUT_REGISTER). Exports `WORK_NODE_RESERVED_ID`. |
| `AnalysisExecutionService.ts` | `AnalysisExecutionService` | **Pipeline orchestrator**: anchor resolution → worknode resolution → per-node input workflow → per-node execution workflow. Returns `AnalysisExecutionResult`. |
| `AnalysisFactoryService.ts` | `AnalysisFactoryService` | **JSON → Graph**: `createFromJSON(config)` builds context, analysis node, anchor link, all 3 workflow DAGs from `IAnalysisConfigJSON`. |
| `utils.ts` | — | `logMessage()` (conditional on `ADVANCED_LOGGING` env), `parseValue()` |
| `SingletonTimeSeries.ts` | `SingletonServiceTimeseries` | Singleton wrapper for `SpinalServiceTimeseries`. |

### Entry Point (`src/index.ts`)

Creates singleton instances of all services and exports them, along with classes, types, and constants. Default export is `spinalAnalysisExecutionService`.

---

## 4. Graph Structure

When an analysis is created, the following SpinalNode tree is built:

```
Context (type: analysisContext)
  └─ Analysis Node (type: analysisNode)
       ├─ Anchor (type: analysisAnchorNode)
       │    └─ [linked target node] (any existing SpinalNode)
       ├─ WorknodeResolver (type: analysisWorknodeResolverNode)
       │    ├─ Block A [root] (type: workflowBlockNode)
       │    │    └─ Block B [dependent] (type: workflowBlockNode)
       │    └─ Block C [root]
       ├─ Input (type: analysisInputWorkflowNode)
       │    └─ ... blocks ...
       ├─ ExecutionWorkflow (type: analysisExecutionWorkflowNode)
       │    └─ ... blocks ...
       ├─ Output (type: analysisOutputNode)        ← future
       └─ Trigger (type: analysisTriggerNode)      ← future
```

### Block Parenting Rules

- **Root blocks** (no real dependencies, or only `$node`): children of the workflow node.
- **Dependent blocks**: children of their **source** (dependency) block, NOT the workflow node.
  This was a deliberate fix to avoid the "double-parenting" bug.
- **FOREACH sub-blocks**: children of the FOREACH block via `FOREACH_TO_SUB_BLOCK_RELATION`.

### Block SpinalNode Info Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Human-readable name (from `ref` in JSON config) |
| `type` | string | Always `'workflowBlockNode'` |
| `algorithmName` | string | Registry key of the algorithm |
| `parameters` | JSON string | `'{"regex":"hasEndpoint"}'` |
| `inputBlockIds` | JSON string | `'["block-id-1","block-id-2"]'` — ordered dependency IDs |
| `registerAs` | string? | e.g., `"I0"` — only on SET_INPUT_REGISTER blocks |
| `foreachOutputBlockId` | string? | Only on FOREACH blocks — designates the output sub-block |

---

## 5. DAG Execution Engine (WorkflowExecutionService)

### WorkflowExecutionContext

```typescript
{
  workNode: SpinalNode,           // current work node
  inputRegisters: Map<string, unknown>,  // named variables (I0, I1, ...)
  blockOutputs: Map<string, unknown>,    // block ID → computed output
}
```

### Execution Steps

1. **Pre-seed** `blockOutputs.set('__WORK_NODE__', context.workNode)` — makes the work node
   available to any block referencing `$node`.
2. **Topological sort** — iterative DFS with cycle detection on `inputBlockIds`.
3. **Execute each block** in sorted order:

   - **Input resolution**: For each ID in `block.inputBlockIds`, look up `blockOutputs[id]`.
     Multiple inputs → passed as array to the algorithm.
   - **Special block routing**:
     - `FETCH_INPUT_REGISTER` → read from `inputRegisters[params.registerName]`
     - `ELEMENT` → value already injected by FOREACH parent, skip
     - `FOREACH` → iterate input array, run sub-DAG per element, collect results
   - **Normal blocks** → call `algorithm.run(input, params, context)`
   - **Output storage**: `blockOutputs.set(block.id, output)`
   - **Register storage** (if `registerAs`): `inputRegisters.set(block.registerAs, output)`

### FOREACH Sub-Execution

For each element in the input array:
1. Create isolated `subContext` with fresh `blockOutputs` (inherits `inputRegisters` copy)
2. Inject element as `subContext.blockOutputs.set(elementBlock.id, element)`
3. Execute sub-DAG via `executeDAG(subWorkflow, subContext)`
4. Read result from `subContext.blockOutputs.get(subWorkflow.outputBlockId)`
5. Collect all results into output array

---

## 6. JSON Config Format (IAnalysisConfigJSON)

This is the format consumed by `AnalysisFactoryService.createFromJSON()`:

```json
{
  "contextName": "MyContext",
  "analysisName": "Temperature Monitor",
  "description": "optional",
  "anchorNodeId": "server-id-of-anchor-target",
  "worknodeResolver": {
    "blocks": [
      {
        "ref": "rooms",
        "algorithmName": "GET_NODE_CHILDREN",
        "inputs": ["$node"],
        "parameters": { "regex": "groupHasRoom" }
      }
    ]
  },
  "inputWorkflow": {
    "blocks": [
      {
        "ref": "endpoints",
        "algorithmName": "GET_NODE_CHILDREN",
        "inputs": ["$node"],
        "parameters": { "regex": "hasEndpoint" }
      },
      {
        "ref": "tempEndpoint",
        "algorithmName": "FILTER_NODE",
        "inputs": ["endpoints"],
        "parameters": { "filterProperty": "name", "regexFilter": "COMMAND_TEMPERATURE" }
      },
      {
        "ref": "singleTemp",
        "algorithmName": "FIRST_NODE",
        "inputs": ["tempEndpoint"]
      },
      {
        "ref": "setI0",
        "algorithmName": "SET_INPUT_REGISTER",
        "inputs": ["singleTemp"],
        "registerAs": "I0"
      }
    ]
  },
  "executionWorkflow": {
    "blocks": [
      {
        "ref": "fetchI0",
        "algorithmName": "FETCH_INPUT_REGISTER",
        "parameters": { "registerName": "I0" }
      },
      {
        "ref": "serverId",
        "algorithmName": "GET_NODE_SERVER_ID",
        "inputs": ["fetchI0"]
      }
    ]
  }
}
```

### Key Concepts in Block Definitions

- **`ref`**: Local ID within the config. Used in `inputs` arrays to reference other blocks.
  Becomes the block's `name` in the graph (human-readable label).
- **`inputs`**: Ordered array of refs. Position = input slot index. The algorithm receives
  inputs in this order.
- **`$node`**: Special ref that maps to `WORK_NODE_RESERVED_ID` (`'__WORK_NODE__'`).
  No graph edge is created — the work node is pre-seeded in blockOutputs.
  - In worknodeResolver: `$node` = anchor target node
  - In input/execution workflows: `$node` = current work node
- **`registerAs`**: Stores the block's output as a named variable in `inputRegisters`.
  Only meaningful in the input workflow.
- **`parameters`**: Static key-value pairs passed to the algorithm's `run()` function.

### Factory Build Strategy (AnalysisFactoryService.buildWorkflow)

**Phase 1 — Create nodes**:
- If a block has no inputs (or only `$node`), it's a **root block** → `createBlock()` (parented to workflow node).
- Otherwise → `createOrphanBlock()` (not parented yet — will be wired in phase 2).

**Phase 2 — Wire dependencies**:
- For each non-`$node` input ref, call `addDependency(sourceNode, dependentNode, context, slot)`.
  This creates a graph edge AND updates `inputBlockIds`.
- For `$node` refs, manually inject `WORK_NODE_RESERVED_ID` into `inputBlockIds` at the right slot.

---

## 7. Result Types

### AnalysisExecutionResult

```typescript
{
  analysisName: string;
  totalWorkNodes: number;
  results: WorkNodeExecutionResult[];
}
```

### WorkNodeExecutionResult

```typescript
{
  workNodeId: string;      // SpinalNode ID
  workNodeName: string;    // human-readable
  success: boolean;
  inputRegisters?: Record<string, unknown>;  // from Object.fromEntries(Map)
  executionOutputs?: Record<string, unknown>; // keyed by block name (ref), not ID
  error?: string;          // only on failure
}
```

The `executionOutputs` record is keyed by block **name** (which comes from the `ref`
in the JSON config). The internal `__WORK_NODE__` entry is filtered out.

---

## 8. Design Decisions & Gotchas

### Why `createOrphanBlock()` exists
Initially, all blocks were created as children of the workflow node. Then `addDependency()`
added them as children of source blocks too, causing **double-parenting**. Now only root
blocks are parented to the workflow node; dependent blocks start as orphans and get parented
only to their source block.

### Why `$node` / `WORK_NODE_RESERVED_ID`
Before this, every workflow needed an explicit `CURRENT_NODE` block as the entry point for
the work node. This was boilerplate. Now the work node is pre-seeded under `__WORK_NODE__`
in `blockOutputs` before execution. The JSON config uses `$node` as a virtual ref that maps
to this reserved ID without creating any graph edge.

### Why `executionOutputs` uses names, not IDs
SpinalNode IDs are opaque strings like `"SpinalNode-abc-123"`. Consumers of analysis results
want to read `result.executionOutputs["serverId"]` not `result.executionOutputs["SpinalNode-abc-123"]`.
The `mapBlockOutputsByName()` helper converts ID-keyed `blockOutputs` to name-keyed records.

### Block parameters are stored as JSON strings
SpinalNode `info` attributes are `Model` objects that serialize to/from the SpinalCom hub.
Complex objects like `{ regex: "hasEndpoint" }` are stored as `JSON.stringify()`-ed strings
and parsed back on load.

### `inputBlockIds` is a JSON string array
Same reason — stored as `'["id1","id2"]'` in the SpinalNode info, parsed on load.
Order matters: position = input slot index.

### FOREACH sub-blocks use a separate relation
`FOREACH_TO_SUB_BLOCK_RELATION` distinguishes sub-workflow blocks from normal dependency
blocks. The FOREACH node's `foreachOutputBlockId` info property designates which sub-block
produces the iteration result.

### Output and Trigger nodes exist but have no logic yet
`addAnalysisNode()` creates Output and Trigger sub-nodes as placeholders. No services read
or write to them currently. They're reserved for future features (e.g., writing results to
endpoints, scheduling analysis runs).

### `CURRENT_NODE` algorithm still exists
It's still in the registry for backward compatibility but is no longer needed in typical
workflows since `$node` handles the same use case implicitly.

---

## 9. Dependencies

| Package | Usage |
|---------|-------|
| `spinal-env-viewer-graph-service` | `SpinalNode`, `SpinalGraphService`, `SpinalContext`, relation types |
| `spinal-model-timeseries` | `SpinalServiceTimeseries`, `SpinalDateValue` (type only in core.ts) |
| `spinal-env-viewer-plugin-documentation-service` | `attributeService` for metadata on context nodes |
| `spinal-models-documentation` | `SpinalAttribute` type (imported but light usage) |

---

## 10. Build & Package

- **TypeScript**: `tsconfig.json` targets `es2015`, `commonjs`, strict mode.
- **Build**: `npm run build` → runs version stamp prebuild, then `rm -fr dist declarations && tsc`.
- **Output**: `dist/` (JS) + `declarations/` (`.d.ts`).
- **Version**: `3.3.0` (in `src/version.ts`, auto-stamped).

---

## 11. Quick Reference: Adding a New Algorithm

1. Create or edit a file in `src/algorithms/definitions/`.
2. Use `createAlgorithm({ name, description, inputTypes, outputType, parameters, run })`.
3. Export the array (e.g., `MY_ALGORITHMS`).
4. Import and spread into `ALGORITHM_DEFINITIONS` in `src/algorithms/algorithms.ts`.
5. If it needs special executor handling (like FOREACH), add a case in
   `WorkflowExecutionService.executeBlock()`.

---

## 12. Quick Reference: Service Singletons

In `src/index.ts`, these singletons are created and exported:

```typescript
spinalAnalyticNodeManagerService   // graph CRUD
spinalWorkflowBlockManagerService  // block CRUD
spinalWorkflowExecutionService     // DAG execution
spinalAnalysisExecutionService     // full pipeline
spinalAnalysisFactoryService       // JSON → graph
```

Consumers typically use:
- `spinalAnalysisFactoryService.createFromJSON(config)` to create an analysis.
- `spinalAnalysisExecutionService.executeAnalysis(analysisNode)` to run it.
