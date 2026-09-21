'use strict';
/**
 * Shared harness for the module's tests.
 *
 * Tests run the REAL factory / node manager / block manager / executor against an in-memory
 * SpinalGraph. Where a workflow would read the building graph (GET_NODE_CHILDREN, …) or write
 * to it (SET_ATTRIBUTE, …), a test swaps in a deterministic stand-in via makeRegistry(); every
 * other block is the real one.
 *
 * Tests exercise `dist/` (the CommonJS build) — `npm test` rebuilds it first.
 */
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'dist');
const mod = require(ROOT);
const { SpinalGraph } = require('spinal-model-graph');
const { SpinalGraphService } = require('spinal-env-viewer-graph-service');
const WorkflowBlockManagerService = require(path.join(ROOT, 'services/WorkflowBlockManagerService')).default;
const WorkflowExecution = require(path.join(ROOT, 'services/WorkflowExecutionService'));
const AnalysisExecutionService = require(path.join(ROOT, 'services/AnalysisExecutionService')).default;
const core = require(path.join(ROOT, 'algorithms/definitions/core'));

// Silence the engine's progress and isolated-failure logs so test output stays readable.
const NOISE = /^\[(AnalysisFactory|AnalysisExecution|Execution)\]|^Context .* already exists/;
for (const level of ['log', 'error', 'warn']) {
  const original = console[level].bind(console);
  console[level] = (...args) => {
    if (NOISE.test(String(args[0] ?? ''))) return;
    original(...args);
  };
}

const factory = mod.spinalAnalysisFactoryService;
const manager = mod.spinalAnalyticNodeManagerService;
const blockManager = new WorkflowBlockManagerService();

const clone = (value) => JSON.parse(JSON.stringify(value));

/** An algorithm stand-in with no declared inputs / parameters. */
function fakeAlgorithm(name, run) {
  return core.createAlgorithm({ name, description: 'test stand-in', inputs: [], outputType: 'any', parameters: [], run });
}

/** The real catalog, with the given stand-ins replacing the same-named algorithms. */
function makeRegistry(overrides = {}) {
  const real = mod.ALGORITHM_DEFINITIONS.filter((algorithm) => !overrides[algorithm.name]);
  return new core.AlgorithmRegistry([...real, ...Object.values(overrides)]);
}

function makeExecutor(registry) {
  return new WorkflowExecution.default(registry);
}

/** Executes a DAG on a work node (a dummy by default); returns the context (outputs, registers, failures). */
async function runDag(executor, dag, { errorPolicy = 'stop', registers = [], workNode = { fake: 'workNode' } } = {}) {
  const context = {
    workNode,
    failures: [],
    inputRegisters: new Map(registers),
    blockOutputs: new Map([[WorkflowExecution.WORK_NODE_RESERVED_ID, workNode]]),
    execution: { referenceTime: Date.now(), errorPolicy },
  };
  await executor.executeDAG(dag, context);
  return context;
}

function blockByName(dag, name) {
  const block = dag.blocks.find((candidate) => candidate.name === name);
  if (!block) throw new Error(`no block named "${name}" in DAG [${dag.blocks.map((b) => b.name).join(', ')}]`);
  return block;
}

const blockNames = (dag) => dag.blocks.map((block) => block.name).sort();
const outputOf = (dag, context, name) => context.blockOutputs.get(blockByName(dag, name).id);

/** Creates the analysis from a config and loads its execution-workflow DAG. */
async function createAndLoad(config, graph) {
  const node = await factory.createFromJSON(config, graph);
  const dag = await blockManager.loadWorkflowDAG(await manager.getAnalysisExecutionWorkflowNode(node));
  return { node, dag };
}

/** A registered in-memory node, usable as an analysis anchor target or a work node. */
function createAnchor(name = 'Room 1') {
  const id = SpinalGraphService.createNode({ name, type: 'geographicRoom' });
  return { id, node: SpinalGraphService.getRealNode(id) };
}

module.exports = {
  mod,
  core,
  factory,
  manager,
  blockManager,
  SpinalGraph,
  SpinalGraphService,
  AnalysisExecutionService,
  WORK_NODE_RESERVED_ID: WorkflowExecution.WORK_NODE_RESERVED_ID,
  clone,
  fakeAlgorithm,
  makeRegistry,
  makeExecutor,
  runDag,
  blockByName,
  blockNames,
  outputOf,
  createAndLoad,
  createAnchor,
};
