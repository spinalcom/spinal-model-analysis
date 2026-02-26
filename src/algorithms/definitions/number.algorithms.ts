import {
  AlgorithmDefinition,
  AlgorithmRunResult,
  createAlgorithm,
} from './core';

const isNumberArray = (value: unknown): value is number[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'number');
};

export const NUMBER_ALGORITHMS: AlgorithmDefinition[] = [
  createAlgorithm({
    name: 'COPY_FIRST_NUMBER',
    description: 'Returns the number input, or first value of a number array.',
    inputTypes: ['number'],
    outputType: 'number',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      if (typeof input === 'number') return input;
      if (isNumberArray(input)) {
        if (input.length === 0) throw new Error('No numeric input provided');
        return input[0];
      }
      throw new Error('Expected number or number[] input');
    },
  }),
  createAlgorithm({
    name: 'SUM_NUMBERS',
    description: 'Sums all numbers from a number array input.',
    inputTypes: ['number'],
    outputType: 'number',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      if (!isNumberArray(input)) throw new Error('Expected number[] input');
      if (input.length === 0) throw new Error('No numeric input provided');
      return input.reduce((acc, current) => acc + current, 0);
    },
  }),
];
