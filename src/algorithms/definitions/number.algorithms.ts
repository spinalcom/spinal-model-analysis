import {
  AlgorithmDefinition,
  AlgorithmRunResult,
  createAlgorithm,
  toNumber,
} from './core';

/** Numeric types accepted by the number algorithms: a number or a numeric string. */
const NUMERIC_TYPES = ['number', 'string'];

export const NUMBER_ALGORITHMS: AlgorithmDefinition[] = [
  createAlgorithm({
    name: 'COPY_FIRST_NUMBER',
    description: 'Returns the number input, or first value of a number array. Numeric strings are accepted.',
    inputs: [
      { name: 'numbers', types: NUMERIC_TYPES, description: 'One or more numbers (or numeric strings); the first one is returned.', required: true, variadic: true },
    ],
    outputType: 'number',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      const arr: unknown[] = Array.isArray(input) ? input : [input];
      if (arr.length === 0) throw new Error('COPY_FIRST_NUMBER: no numeric input provided');
      return toNumber(arr[0], 'COPY_FIRST_NUMBER input');
    },
  }),
  createAlgorithm({
    name: 'SUM_NUMBERS',
    description: 'Sums all numbers from a number array input. Numeric strings are accepted.',
    inputs: [
      { name: 'numbers', types: NUMERIC_TYPES, description: 'One or more numbers (or numeric strings) to sum.', required: true, variadic: true },
    ],
    outputType: 'number',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      const arr: unknown[] = Array.isArray(input) ? input : [input];
      if (arr.length === 0) throw new Error('SUM_NUMBERS: no numeric input provided');
      return arr.reduce((acc: number, current) => acc + toNumber(current, 'SUM_NUMBERS input'), 0);
    },
  }),
  createAlgorithm({
    name: 'SUBTRACT',
    description:
      'Subtracts numbers in order from a number array input: input[0] − input[1] − … ' +
      'Requires at least two numbers (e.g. two block inputs [a, b] → a − b). Numeric strings are accepted.',
    inputs: [
      { name: 'numbers', types: NUMERIC_TYPES, description: 'Two or more numbers (or numeric strings); subsequent values are subtracted from the first.', required: true, variadic: true },
    ],
    outputType: 'number',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      if (!Array.isArray(input) || input.length < 2) {
        throw new Error('SUBTRACT requires at least two numbers');
      }
      const nums = input.map((v) => toNumber(v, 'SUBTRACT input'));
      return nums.reduce((acc, current) => acc - current);
    },
  }),
  createAlgorithm({
    name: 'RANDOM_NUMBER',
    description:
      'Generates a random number between min and max. No input required. By default a float in ' +
      '[min, max). Set "integer" to true for a random integer in [min, max] inclusive.',
    inputs: [],
    outputType: 'number',
    parameters: [
      { name: 'min', type: 'number', description: 'Lower bound (inclusive)', required: true },
      { name: 'max', type: 'number', description: 'Upper bound (float: exclusive; integer: inclusive)', required: true },
      { name: 'integer', type: 'boolean', description: 'When true, return an integer in [min, max] inclusive instead of a float. Defaults to false.', required: false },
    ],
    run: async (_input, params): AlgorithmRunResult => {
      const min = params?.min as number;
      const max = params?.max as number;
      if (typeof min !== 'number' || typeof max !== 'number') {
        throw new Error('RANDOM_NUMBER requires numeric min and max parameters');
      }

      const asInteger = params?.integer === true || params?.integer === 'true';
      if (asInteger) {
        const lo = Math.ceil(min);
        const hi = Math.floor(max);
        if (lo > hi) {
          throw new Error(`RANDOM_NUMBER: no integer exists between min=${min} and max=${max}`);
        }
        return Math.floor(Math.random() * (hi - lo + 1)) + lo;
      }

      return min + Math.random() * (max - min);
    },
  }),
  createAlgorithm({
    name: 'CONSTANT_NUMBER',
    description:
      'Produces a constant number from the "value" parameter. Takes no input — useful as a ' +
      'numeric source to feed math or comparison blocks.',
    inputs: [],
    outputType: 'number',
    parameters: [
      { name: 'value', type: 'number', description: 'The constant number to produce.', required: true },
    ],
    run: async (_input, params): AlgorithmRunResult => {
      return toNumber(params?.value, 'CONSTANT_NUMBER value');
    },
  }),
  createAlgorithm({
    name: 'ADD_PARAM',
    description: 'Adds the "value" parameter to the input number (input + value).',
    inputs: [
      { name: 'number', types: NUMERIC_TYPES, description: 'The input number (or numeric string).', required: true },
    ],
    outputType: 'number',
    parameters: [
      { name: 'value', type: 'number', description: 'The number to add to the input.', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      return toNumber(input, 'ADD_PARAM input') + toNumber(params?.value, 'ADD_PARAM value');
    },
  }),
  createAlgorithm({
    name: 'SUBTRACT_PARAM',
    description: 'Subtracts the "value" parameter from the input number (input − value).',
    inputs: [
      { name: 'number', types: NUMERIC_TYPES, description: 'The input number (or numeric string).', required: true },
    ],
    outputType: 'number',
    parameters: [
      { name: 'value', type: 'number', description: 'The number to subtract from the input.', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      return toNumber(input, 'SUBTRACT_PARAM input') - toNumber(params?.value, 'SUBTRACT_PARAM value');
    },
  }),
  createAlgorithm({
    name: 'MULTIPLY_PARAM',
    description: 'Multiplies the input number by the "value" parameter (input × value).',
    inputs: [
      { name: 'number', types: NUMERIC_TYPES, description: 'The input number (or numeric string).', required: true },
    ],
    outputType: 'number',
    parameters: [
      { name: 'value', type: 'number', description: 'The number to multiply the input by.', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      return toNumber(input, 'MULTIPLY_PARAM input') * toNumber(params?.value, 'MULTIPLY_PARAM value');
    },
  }),
  createAlgorithm({
    name: 'DIVIDE_PARAM',
    description: 'Divides the input number by the "value" parameter (input ÷ value). Throws if value is 0.',
    inputs: [
      { name: 'number', types: NUMERIC_TYPES, description: 'The input number (or numeric string).', required: true },
    ],
    outputType: 'number',
    parameters: [
      { name: 'value', type: 'number', description: 'The number to divide the input by (must not be 0).', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      const divisor = toNumber(params?.value, 'DIVIDE_PARAM value');
      if (divisor === 0) throw new Error('DIVIDE_PARAM: cannot divide by zero');
      return toNumber(input, 'DIVIDE_PARAM input') / divisor;
    },
  }),
  createAlgorithm({
    name: 'POLYNOMIAL',
    description:
      'Evaluates a polynomial at the input value x. Coefficients are given via the ' +
      '"coefficients" parameter as a JSON array in ascending power order: ' +
      '[c0, c1, c2, ...] → c0 + c1·x + c2·x² + … Numeric strings are accepted for x.',
    inputs: [
      { name: 'x', types: NUMERIC_TYPES, description: 'The value of x to evaluate the polynomial at.', required: true },
    ],
    outputType: 'number',
    parameters: [
      { name: 'coefficients', type: 'string', description: 'JSON array of coefficients in ascending power order: [c0, c1, c2, ...] for c0 + c1·x + c2·x² + …', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      const x = toNumber(input, 'POLYNOMIAL x');
      const raw = params?.coefficients;
      if (typeof raw !== 'string' || raw.trim() === '') {
        throw new Error('POLYNOMIAL requires a "coefficients" JSON array parameter');
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error(`POLYNOMIAL: "coefficients" is not valid JSON: ${raw}`);
      }
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('POLYNOMIAL: "coefficients" must be a non-empty JSON array');
      }
      const coeffs = parsed.map((c, i) => toNumber(c, `POLYNOMIAL coefficient[${i}]`));
      // Horner's method, coefficients in ascending power order.
      let result = 0;
      for (let i = coeffs.length - 1; i >= 0; i--) {
        result = result * x + coeffs[i];
      }
      return result;
    },
  }),
  createAlgorithm({
    name: 'AVERAGE_NUMBERS',
    description: 'Returns the arithmetic mean of a number array input. Numeric strings are accepted.',
    inputs: [
      { name: 'numbers', types: NUMERIC_TYPES, description: 'One or more numbers (or numeric strings) to average.', required: true, variadic: true },
    ],
    outputType: 'number',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      const arr: unknown[] = Array.isArray(input) ? input : [input];
      if (arr.length === 0) throw new Error('AVERAGE_NUMBERS: no numeric input provided');
      const sum = arr.reduce((acc: number, current) => acc + toNumber(current, 'AVERAGE_NUMBERS input'), 0);
      return sum / arr.length;
    },
  }),
  createAlgorithm({
    name: 'MIN_NUMBERS',
    description: 'Returns the smallest of a number array input. Numeric strings are accepted.',
    inputs: [
      { name: 'numbers', types: NUMERIC_TYPES, description: 'One or more numbers (or numeric strings).', required: true, variadic: true },
    ],
    outputType: 'number',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      const arr: unknown[] = Array.isArray(input) ? input : [input];
      if (arr.length === 0) throw new Error('MIN_NUMBERS: no numeric input provided');
      return Math.min(...arr.map((v) => toNumber(v, 'MIN_NUMBERS input')));
    },
  }),
  createAlgorithm({
    name: 'MAX_NUMBERS',
    description: 'Returns the largest of a number array input. Numeric strings are accepted.',
    inputs: [
      { name: 'numbers', types: NUMERIC_TYPES, description: 'One or more numbers (or numeric strings).', required: true, variadic: true },
    ],
    outputType: 'number',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      const arr: unknown[] = Array.isArray(input) ? input : [input];
      if (arr.length === 0) throw new Error('MAX_NUMBERS: no numeric input provided');
      return Math.max(...arr.map((v) => toNumber(v, 'MAX_NUMBERS input')));
    },
  }),
  createAlgorithm({
    name: 'ROUND',
    description: 'Rounds the input number to "decimals" decimal places (default 0). Numeric strings are accepted.',
    inputs: [
      { name: 'number', types: NUMERIC_TYPES, description: 'The input number (or numeric string).', required: true },
    ],
    outputType: 'number',
    parameters: [
      { name: 'decimals', type: 'number', description: 'Number of decimal places to round to (default 0).', required: false },
    ],
    run: async (input, params): AlgorithmRunResult => {
      const n = toNumber(input, 'ROUND input');
      const decimals = params?.decimals !== undefined ? toNumber(params.decimals, 'ROUND decimals') : 0;
      const d = Math.max(0, Math.floor(decimals));
      const factor = Math.pow(10, d);
      return Math.round(n * factor) / factor;
    },
  }),
  createAlgorithm({
    name: 'ABS',
    description: 'Returns the absolute value of the input number. Numeric strings are accepted.',
    inputs: [
      { name: 'number', types: NUMERIC_TYPES, description: 'The input number (or numeric string).', required: true },
    ],
    outputType: 'number',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      return Math.abs(toNumber(input, 'ABS input'));
    },
  }),
  createAlgorithm({
    name: 'CLAMP',
    description: 'Constrains the input number to the [min, max] range. Numeric strings are accepted.',
    inputs: [
      { name: 'number', types: NUMERIC_TYPES, description: 'The input number (or numeric string).', required: true },
    ],
    outputType: 'number',
    parameters: [
      { name: 'min', type: 'number', description: 'Lower bound (inclusive).', required: true },
      { name: 'max', type: 'number', description: 'Upper bound (inclusive).', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      const n = toNumber(input, 'CLAMP input');
      const min = toNumber(params?.min, 'CLAMP min');
      const max = toNumber(params?.max, 'CLAMP max');
      if (min > max) throw new Error(`CLAMP: min (${min}) must not exceed max (${max})`);
      return Math.min(Math.max(n, min), max);
    },
  }),
];
