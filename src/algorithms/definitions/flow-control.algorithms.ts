import {
  AlgorithmDefinition,
  AlgorithmRunResult,
  createAlgorithm,
} from './core';

/** Upper bound on DELAY so a stray duration can't block a work node indefinitely. */
const MAX_DELAY_MS = 5 * 60 * 1000;

export const FLOW_CONTROL_ALGORITHMS: AlgorithmDefinition[] = [
  createAlgorithm({
    name: 'DELAY',
    description:
      'Waits for the given duration, then returns its input unchanged. Useful to pace a ' +
      'workflow, rate-limit calls, or sequence a downstream block to run after a delay ' +
      '(the downstream block depends on this block\'s output). ' +
      `Duration is capped at ${MAX_DELAY_MS} ms to avoid blocking the engine.`,
    inputs: [
      { name: 'value', types: ['any'], description: 'Any value; returned unchanged after the delay.', required: true },
    ],
    outputType: 'any',
    parameters: [
      { name: 'durationMs', type: 'number', description: 'How long to wait before returning, in milliseconds (capped at 300000).', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      const raw = Number(params?.durationMs);
      if (isNaN(raw) || raw < 0) {
        throw new Error('DELAY requires a non-negative "durationMs" parameter');
      }
      const ms = Math.min(raw, MAX_DELAY_MS);
      await new Promise((resolve) => setTimeout(resolve, ms));
      return input as any;
    },
  }),
  createAlgorithm({
    name: 'IF',
    description:
      'Conditional branching block. Takes a boolean predicate as inputs[0] and an optional ' +
      'payload as inputs[1]. Executes thenWorkflow if true, elseWorkflow if false. ' +
      'The payload is injected as $item in the chosen branch. ' +
      'Handled by the DAG executor — this run() is never called directly.',
    inputs: [
      { name: 'predicate', types: ['boolean'], description: 'Boolean deciding which branch runs (then/else).', required: true },
      { name: 'payload', types: ['any'], description: 'Optional value injected as $item into the chosen branch.', required: false },
    ],
    outputType: 'any',
    parameters: [],
    run: async (): AlgorithmRunResult => {
      throw new Error(
        'IF is handled by the DAG executor, not called directly'
      );
    },
  }),
];

