import {
  AlgorithmDefinition,
  AlgorithmRunContext,
  AlgorithmRunResult,
  createAlgorithm,
} from './core';

const ensureIfInput = (input: unknown): { payload: unknown; predicate: boolean } => {
  if (!Array.isArray(input) || input.length < 2) {
    throw new Error('IF expects 2 inputs: [payload, predicate]');
  }

  const payload = input[0];
  const predicate = input[1];

  if (typeof predicate !== 'boolean') {
    throw new Error('IF second input (predicate) must be a boolean');
  }

  return { payload, predicate };
};

const routeIfBranch = async (
  predicate: boolean,
  context?: AlgorithmRunContext
): Promise<void> => {
  if (!context?.getChildren || !context?.setNextNodes) return;

  const children = await context.getChildren();
  const thenNode = children[0];
  const elseNode = children[1];

  if (!thenNode || !elseNode) {
    throw new Error('IF requires 2 child nodes: [then, else]');
  }

  context.setNextNodes([predicate ? thenNode : elseNode]);
};

export const FLOW_CONTROL_ALGORITHMS: AlgorithmDefinition[] = [
  createAlgorithm({
    name: 'IF',
    description:
      'Routes execution to the first child (then) or second child (else) based on the boolean predicate, and returns the payload unchanged.',
    inputTypes: ['any', 'boolean'],
    outputType: 'any',
    parameters: [],
    run: async (input, _params, context): AlgorithmRunResult => {
      const { payload, predicate } = ensureIfInput(input);
      await routeIfBranch(predicate, context);
      return payload as any;
    },
  }),
];

