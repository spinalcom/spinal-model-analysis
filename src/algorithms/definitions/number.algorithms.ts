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
  createAlgorithm({
    name: 'RANDOM_NUMBER',
    description: 'Generates a random number between min and max (inclusive). No input required.',
    inputTypes: [],
    outputType: 'number',
    parameters: [
      { name: 'min', type: 'number', description: 'Lower bound (inclusive)', required: true },
      { name: 'max', type: 'number', description: 'Upper bound (inclusive)', required: true },
    ],
    run: async (_input, params): AlgorithmRunResult => {
      const min = params?.min as number;
      const max = params?.max as number;
      if (typeof min !== 'number' || typeof max !== 'number') {
        throw new Error('RANDOM_NUMBER requires numeric min and max parameters');
      }
      return min + Math.random() * (max - min);
    },
  }),
];
