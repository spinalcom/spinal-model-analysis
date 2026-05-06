import {
  AlgorithmDefinition,
  AlgorithmRunResult,
  createAlgorithm,
} from './core';

export const FLOW_CONTROL_ALGORITHMS: AlgorithmDefinition[] = [
  createAlgorithm({
    name: 'IF',
    description:
      'Conditional branching block. Takes a boolean predicate as inputs[0] and an optional ' +
      'payload as inputs[1]. Executes thenWorkflow if true, elseWorkflow if false. ' +
      'The payload is injected as $item in the chosen branch. ' +
      'Handled by the DAG executor — this run() is never called directly.',
    inputTypes: ['boolean'],
    outputType: 'any',
    parameters: [],
    run: async (): AlgorithmRunResult => {
      throw new Error(
        'IF is handled by the DAG executor, not called directly'
      );
    },
  }),
];

