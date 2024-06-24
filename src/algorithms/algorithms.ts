/* eslint-disable @typescript-eslint/no-explicit-any */
import { IAlgorithm } from '../interfaces/IAlgorithm';
import { IRequiredParameter } from '../interfaces/IRequiredParameter';
import { SpinalDateValue } from 'spinal-model-timeseries';

interface IParameters {
  [key: string]: string | number | boolean;
}

type PrimitiveInput = number | string | boolean;
type IInput = PrimitiveInput | SpinalDateValue[];

class Algorithm implements IAlgorithm {
  name: string;
  inputTypes: string[];
  outputType: string;
  description: string;
  requiredParams: IRequiredParameter[] | 'boolean' | 'number' | 'string';
  run: (input: IInput, params?: IParameters) => string | number | boolean;

  constructor(
    name: string,
    description: string,
    inputTypes: string[],
    outputType: string,
    requiredParams: IRequiredParameter[] | 'boolean' | 'number' | 'string',
    run: (input: any | any[], params?: IParameters) => string | number | boolean
  ) {
    this.name = name;
    this.inputTypes = inputTypes;
    this.outputType = outputType;
    this.description = description;
    this.requiredParams = requiredParams;
    this.run = run;
  }
}

export const PUTVALUE = new Algorithm(
  'PUTVALUE',
  'This algorithm returns the value set by the user (p1) regardless of input.',
  ['number'],
  'number',
  [{ name: 'p1', type: 'number', description: 'the value to inject' }],
  (
    input: boolean[],
    params: IParameters | undefined
  ): string | number | boolean => {
    if (!params) throw new Error('No parameters provided');
    if (params['p1'] === undefined) throw new Error('No value provided');
    return params['p1'];
  }
);

export const COPY = new Algorithm(
  'COPY',
  'This algorithm returns the value of first input',
  ['number'],
  'number',
  [],
  (input: IInput[]): any => {
    return input[0];
  }
);

export const DIVIDE = new Algorithm(
  'DIVIDE',
  'This algorithm returns the result of the division of the first input by the second input',
  ['number'],
  'number',
  [],
  (input: number[]): number => {
    if (input.length < 2) throw new Error('Not enough inputs');
    if (input[1] === 0) throw new Error('Division by zero');
    return input[0] / input[1];
  }
);

export const DIVIDE_BY = new Algorithm(
  'DIVIDE_BY',
  'This algorithm returns the result of the division of the first input by the value set by the user (p1)',
  ['number'],
  'number',
  [{ name: 'p1', type: 'number', description: 'the value to divide by' }],
  (input: number[], params: IParameters | undefined): number => {
    if (!params) throw new Error('No parameters provided');
    if (params['p1'] === 0) throw new Error('Division by zero');
    if (typeof params['p1'] !== 'number')
      throw new Error(
        `Invalid parameter type. Expected number, got ${typeof params['p1']}`
      );
    return input[0] / params['p1'];
  }
);

export const MULTIPLY_BY = new Algorithm(
  'MULTIPLY_BY',
  'This algorithm returns the result of the multiplication of the first input by the value set by the user (p1)',
  ['number'],
  'number',
  [{ name: 'p1', type: 'number', description: 'the value to multiply by' }],
  (input: number[], params: IParameters | undefined): number => {
    if (!params) throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
      throw new Error(
        `Invalid parameter type. Expected number, got ${typeof params['p1']}`
      );
    return input[0] * params['p1'];
  }
);

export const MULTIPLY = new Algorithm(
  'MULTIPLY',
  'This algorithm returns the result of the multiplication of the first input by the second input',
  ['number'],
  'number',
  [],
  (input: number[]): number => {
    if (input.length < 2) throw new Error('Not enough inputs');
    return input[0] * input[1];
  }
);

export const THRESHOLD_ABOVE = new Algorithm(
  'THRESHOLD_ABOVE',
  'This algorithm returns true if the input is above the threshold set by the user',
  ['number'],
  'boolean',
  [{ name: 'p1', type: 'number', description: 'the threshold value' }],
  (input: number[], params: IParameters | undefined): boolean => {
    if (!params) throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
      throw new Error(
        `Invalid parameter type. Expected number, got ${typeof params['p1']}`
      );
    const treshold = params['p1'];
    for (const n of input) {
      if (n > treshold) return true;
    }
    return false;
  }
);

export const THRESHOLD_BELOW = new Algorithm(
  'THRESHOLD_BELOW',
  'This algorithm returns true if the input is below the threshold set by the user',
  ['number'],
  'boolean',
  [{ name: 'p1', type: 'number', description: 'the threshold value' }],
  (input: number[], params: IParameters | undefined): boolean => {
    if (!params) throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
      throw new Error(
        `Invalid parameter type. Expected number, got ${typeof params['p1']}`
      );
    const treshold = params['p1'];
    for (const n of input) {
      if (n < treshold) return true;
    }
    return false;
  }
);

export const THRESHOLD_BETWEEN_IN = new Algorithm(
  'THRESHOLD_BETWEEN_IN',
  'This algorithm returns true if the input is between the two thresholds set by the user',
  ['number'],
  'boolean',
  [
    { name: 'p1', type: 'number', description: 'the first threshold value' },
    { name: 'p2', type: 'number', description: 'the second threshold value' },
  ],
  (input: number[], params: IParameters | undefined): boolean => {
    if (!params) throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
      throw new Error(
        `Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`
      );
    if (typeof params['p2'] !== 'number')
      throw new Error(
        `Invalid p2 parameter type. Expected number, got ${typeof params['p2']}`
      );
    const p1 = params['p1'];
    const p2 = params['p2'];
    const min = Math.min(p1, p2);
    const max = Math.max(p1, p2);
    for (const n of input) {
      if (n >= min && n <= max) return true;
    }
    return false;
  }
);

export const THRESHOLD_BETWEEN_OUT = new Algorithm(
  'THRESHOLD_BETWEEN_OUT',
  'This algorithm returns true if the input is outside the two thresholds set by the user',
  ['number'],
  'boolean',
  [
    { name: 'p1', type: 'number', description: 'the first threshold value' },
    { name: 'p2', type: 'number', description: 'the second threshold value' },
  ],
  (input: number[], params: IParameters | undefined): boolean => {
    if (!params) throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
      throw new Error(
        `Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`
      );
    if (typeof params['p2'] !== 'number')
      throw new Error(
        `Invalid p2 parameter type. Expected number, got ${typeof params['p2']}`
      );
    const p1 = params['p1'];
    const p2 = params['p2'];
    const min = Math.min(p1, p2);
    const max = Math.max(p1, p2);
    for (const n of input) {
      if (n <= min || n >= max) return true;
    }
    return false;
  }
);

export const THRESHOLD_ZSCORE = new Algorithm(
  'THRESHOLD_ZSCORE',
  `This algorithm is used to detect anomalies in a timeseries. 
   The Z-score is a measure of how many standard deviations an element is from the mean.
   It's calculated as Z = (X - mean) / stdDev 
   where X is the value, mean is the average of the timeserie and stdDev is the standard deviation of the timeserie.
   The threshold is a number set by the user. If the Z-score of the last value of the timeserie is above the threshold,
   the algorithm returns true, otherwise it returns false.`,
  ['Timeseries'],
  'boolean',
  [{ name: 'p1', type: 'number', description: 'the threshold value' }],
  (input: SpinalDateValue[][], params: IParameters | undefined): boolean => {
    if (!params) throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
      throw new Error(
        `Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`
      );
    const dataInput = input.reduce((acc, curr) => acc.concat(...curr), []);
    if (dataInput.length === 0) throw new Error('Timeseries is empty');
    const threshold = params['p1'];
    const mean =
      dataInput.reduce((acc, current) => acc + current.value, 0) /
      dataInput.length;
    const variance =
      dataInput.reduce(
        (acc, current) => acc + Math.pow(current.value - mean, 2),
        0
      ) / dataInput.length;
    const stdDev = Math.sqrt(variance);
    const zScore = (dataInput[dataInput.length - 1].value - mean) / stdDev;
    return zScore > threshold;
  }
);

export const AVERAGE = new Algorithm(
  'AVERAGE',
  'This algorithm returns the average of the inputs',
  ['number'],
  'number',
  [],
  (input: number[]): number => {
    return input.reduce((acc, current) => acc + current, 0) / input.length;
  }
);

export const TIMESERIES_AVERAGE = new Algorithm(
  'TIMESERIES_AVERAGE',
  'This algorithm returns the average of the timeseries',
  ['Timeseries'],
  'number',
  [],
  (input: SpinalDateValue[][]): number => {
    const dataInput = input.reduce((acc, curr) => acc.concat(...curr), []);
    if (dataInput.length === 0) throw new Error('Timeseries is empty');
    return (
      dataInput.reduce((acc, current) => acc + current.value, 0) /
      dataInput.length
    );
  }
);

export const TIMESERIES_TIME_WEIGHTED_AVERAGE = new Algorithm(
  'TIMESERIES_TIME_WEIGHTED_AVERAGE',
  'This algorithm calculates the time-weighted average value of a timeseries. It takes into account the time intervals between successive data points to compute the average.',
  ['Timeseries'],
  'number',
  [
    {
      name: 'p1',
      type: 'string',
      description:
        " 'normal' (default) => No interpolation , 'linear' => linear interpolation for two successive points",
    },
  ],
  (input: SpinalDateValue[][], params: IParameters | undefined): number => {
    const linearInterpolation = params && params['p1'] === 'linear';
    const dataInput = input.reduce((acc, curr) => acc.concat(...curr), []);
    if (dataInput.length < 2) {
      throw new Error(
        'Insufficient data. At least two timeseries data points are required.'
      );
    }
    dataInput.sort((a, b) => a.date - b.date);
    let sum = 0;
    for (let i = 0; i < dataInput.length - 1; i++) {
      const timeInterval = dataInput[i + 1].date - dataInput[i].date;
      if (linearInterpolation) {
        // For linear interpolation, take the average value of the current and next point
        const avgValue = (dataInput[i].value + dataInput[i + 1].value) / 2;
        sum += avgValue * timeInterval;
      } else {
        // Without interpolation, use the current value
        sum += dataInput[i].value * timeInterval;
      }
    }
    const totalTimeInterval =
      dataInput[dataInput.length - 1].date - dataInput[0].date;
    if (totalTimeInterval <= 0) {
      throw new Error(
        'Invalid date range. Ensure data is correctly ordered and spans a positive time interval.'
      );
    }
    const average = sum / totalTimeInterval;
    return average;
  }
);

export const TIMESERIES_BOOLEAN_RATE = new Algorithm(
  'TIMESERIES_BOOLEAN_RATE',
  'This algorithm calculates a rate on boolean timeseries (0 | 1).',
  ['Timeseries'],
  'number',
  [
    {
      name: 'p1',
      type: 'string',
      description:
        'Ratio || Percentage   (write one of the two, Ratio will be used by default)',
    },
  ],
  (input: SpinalDateValue[][], params: IParameters | undefined): number => {
    if (!params) throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'string')
      throw new Error(
        `Invalid p1 parameter type. Expected string, got ${typeof params['p1']}`
      );
    const percentageResult = params['p1'] === 'Percentage';
    const dataInput = input.reduce((acc, curr) => acc.concat(...curr), []);
    if (dataInput.length === 0) throw new Error('Timeseries is empty');
    // Ensure input is sorted by time
    dataInput.sort((a, b) => a.date - b.date);
    let sum = 0;
    for (let i = 0; i < dataInput.length - 1; i++) {
      // Calculate the difference in time
      const deltaTime = dataInput[i + 1].date - dataInput[i].date;

      // Calculate the average value between two points
      //const avgValue = (dataInput[i+1].value + dataInput[i].value) / 2;

      sum += dataInput[i].value * deltaTime;
    }

    if (!percentageResult)
      return sum / (dataInput[dataInput.length - 1].date - dataInput[0].date);
    else
      return (
        (sum / (dataInput[dataInput.length - 1].date - dataInput[0].date)) * 100
      );
  }
);

export const TIMESERIES_IS_EMPTY = new Algorithm(
  'TIMESERIES_IS_EMPTY',
  'This algorithm returns true if the input is an empty timeseries',
  ['Timeseries'],
  'boolean',
  [],
  (input: SpinalDateValue[][]): boolean => {
    const dataInput = input.reduce((acc, curr) => acc.concat(...curr), []);
    return dataInput.length === 0;
  }
);

export const TIMESERIES_SUM = new Algorithm(
  'TIMESERIES_SUM',
  'This algorithm returns the sum of the timeseries',
  ['Timeseries'],
  'number',
  [],
  (input: SpinalDateValue[][]): number => {
    const dataInput = input.reduce((acc, curr) => acc.concat(...curr), []);
    if (dataInput.length === 0) throw new Error('Timeseries is empty');
    return dataInput.reduce((acc, current) => acc + current.value, 0);
  }
);

export const TIMESERIES_EDGE_SUBSTRACT = new Algorithm(
  'TIMESERIES_EDGE_SUBSTRACT',
  'This algorithm returns the difference between the last and first value of the timeseries',
  ['Timeseries'],
  'number',
  [],
  (input: SpinalDateValue[][]): number => {
    const dataInput = input.reduce((acc, curr) => acc.concat(...curr), []);
    if (dataInput.length < 2) throw new Error('Timeseries should contain at least two values');
    return dataInput[dataInput.length - 1].value - dataInput[0].value;
  }
);

export const AND = new Algorithm(
  'AND',
  'This algorithm returns true if all the inputs are true',
  ['boolean'],
  'boolean',
  [],
  (input: boolean[]): boolean => {
    return !input.includes(false);
  }
);

export const OR = new Algorithm(
  'OR',
  'This algorithm returns true if at least one of the inputs is true',
  ['boolean'],
  'boolean',
  [],
  (input: boolean[]): boolean => {
    return input.includes(true);
  }
);

export const NOT = new Algorithm(
  'NOT',
  'This algorithm returns true if all the inputs are false',
  ['boolean'],
  'boolean',
  [],
  (input: boolean[]): boolean => {
    return !input.includes(true);
  }
);

export const DIFFERENCE_THRESHOLD = new Algorithm(
  'DIFFERENCE_THRESHOLD',
  'This algorithm returns true if the difference between the first and any other input is above the threshold set by the user',
  ['number'],
  'boolean',
  [{ name: 'p1', type: 'number', description: 'the threshold value' }],
  (input: number[], params: IParameters | undefined): boolean => {
    if (!params) throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
      throw new Error(
        `Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`
      );
    const treshold = params['p1'];
    const first = input[0];
    for (const n of input) {
      if (Math.abs(n - first) > treshold) return true;
    }
    return false;
  }
);

export const STANDARD_DEVIATION = new Algorithm(
  'STANDARD_DEVIATION',
  'This algorithm returns the standard deviation of the inputs',
  ['number'],
  'number',
  [],
  (input: number[]): number => {
    const n = input.length;
    const mean = input.reduce((a, b) => a + b) / n;
    return Math.sqrt(
      input.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
    );
  }
);

export const EQUAL_TO = new Algorithm(
  'EQUAL_TO',
  'This algorithm returns true if all inputs are equal to the parameter',
  ['number', 'string', 'boolean'],
  'boolean',
  [{ name: 'p1', type: 'number', description: 'the value to compare to' }],
  (input: PrimitiveInput[], params: IParameters | undefined): boolean => {
    if (!params) throw new Error('No parameters provided');
    for (const i of input) {
      if (i !== params['p1']) return false;
    }
    return true;
  }
);

export const IS_EMPTY = new Algorithm(
  'IS_EMPTY',
  'This algorithm returns true if the input is an empty list',
  ['number', 'string', 'boolean'],
  'boolean',
  [],
  (input: IInput[]): boolean => {
    return input.length === 0;
  }
);

export const CONV_BOOLEAN_TO_NUMBER = new Algorithm(
  'CONV_BOOLEAN_TO_NUMBER',
  'This algorithm converts a boolean to a number. True becomes 1, false becomes 0',
  ['boolean'],
  'number',
  [],
  (input: boolean[]): number => {
    return input[0] ? 1 : 0;
  }
);

export const CONV_NUMBER_TO_BOOLEAN = new Algorithm(
  'CONV_NUMBER_TO_BOOLEAN',
  'This algorithm converts a number to a boolean (0 is false, everything else is true)',
  ['number'],
  'boolean',
  [],
  (input: number[]): boolean => {
    return input[0] !== 0;
  }
);

export const CURRENT_EPOCH_TIME = new Algorithm(
  'CURRENT_EPOCH_TIME',
  'This algorithm returns the current epoch time',
  [],
  'number',
  [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (input: IInput[]): number => {
    return Date.now();
  }
);

export const SUBTRACT = new Algorithm(
  'SUBTRACT',
  'This algorithm returns the result of the subtraction of the first input by the second input',
  ['number'],
  'number',
  [],
  (input: number[]): number => {
    return input[0] - input[1];
  }
);

export const SUBTRACT_BY = new Algorithm(
  'SUBTRACT_BY',
  'This algorithm returns the result of the subtraction of the first input by the value set by the user (p1)',
  ['number'],
  'number',
  [{ name: 'p1', type: 'number', description: 'the value to subtract by' }],
  (input: number[], params: IParameters | undefined): number => {
    if (!params) throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number')
      throw new Error(
        `Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`
      );
    return input[0] - params['p1'];
  }
);

export const RANDOM_NUMBER = new Algorithm(
  'RANDOM_NUMBER',
  'This algorithm returns a random number between the two values set by the user',
  ['number'],
  'number',
  [
    { name: 'p1', type: 'number', description: 'the minimum value' },
    { name: 'p2', type: 'number', description: 'the maximum value' },
  ],
  (input: number[], params: IParameters | undefined): number => {
    if (!params) throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number' || typeof params['p2'] !== 'number')
      throw new Error(
        `Invalid parameter type. Expected number, got ${typeof params[
          'p1'
        ]} or ${typeof params['p2']}`
      );
    return Math.random() * (params['p2'] - params['p1']) + params['p1'];
  }
);

export const RANDOM_INTEGER = new Algorithm(
  'RANDOM_INTEGER',
  'This algorithm returns a random integer between the two values set by the user',
  ['number'],
  'number',
  [
    { name: 'p1', type: 'number', description: 'the minimum value' },
    { name: 'p2', type: 'number', description: 'the maximum value' },
  ],
  (input: number[], params: IParameters | undefined): number => {
    if (!params) throw new Error('No parameters provided');
    if (typeof params['p1'] !== 'number' || typeof params['p2'] !== 'number')
      throw new Error(
        `Invalid parameter type. Expected number, got ${typeof params[
          'p1'
        ]} or ${typeof params['p2']}`
      );
    return Math.floor(Math.random() * (params['p2'] - params['p1'] + 1) + params['p1']);
  }
);
export const RANDOM_BOOLEAN_NUMBER = new Algorithm(
  'RANDOM_BOOLEAN_NUMBER',
  'This algorithm returns a random boolean value 0 | 1',
  [],
  'number',
  [],
  (): number => {
    return Math.round(Math.random());
  });

export const RANDOM_BOOLEAN = new Algorithm(
  'RANDOM_BOOLEAN',
  'This algorithm returns a random boolean value true | false',
  [],
  'boolean',
  [],
  (): boolean => {
    return Math.random() < 0.5;
  });



export const EXIT = new Algorithm(
  'EXIT',
  'This algorithm is used to stop the execution of the workflow if the first input is true',
  ['boolean'],
  'void',
  [],
  (input: boolean[]): boolean => {
    return input[0];
  }
);

export const ALGORITHMS: { [key: string]: Algorithm } = {
  PUTVALUE,
  COPY,
  DIVIDE,
  DIVIDE_BY,
  MULTIPLY,
  MULTIPLY_BY,
  THRESHOLD_ABOVE,
  THRESHOLD_BELOW,
  THRESHOLD_BETWEEN_IN,
  THRESHOLD_BETWEEN_OUT,
  THRESHOLD_ZSCORE,
  AVERAGE,
  TIMESERIES_IS_EMPTY,
  TIMESERIES_AVERAGE,
  TIMESERIES_TIME_WEIGHTED_AVERAGE,
  TIMESERIES_SUM,
  TIMESERIES_BOOLEAN_RATE,
  TIMESERIES_EDGE_SUBSTRACT,
  AND,
  OR,
  NOT,
  DIFFERENCE_THRESHOLD,
  STANDARD_DEVIATION,
  EQUAL_TO,
  IS_EMPTY,
  CONV_BOOLEAN_TO_NUMBER,
  CONV_NUMBER_TO_BOOLEAN,
  CURRENT_EPOCH_TIME,
  SUBTRACT,
  SUBTRACT_BY,
  RANDOM_NUMBER,
  RANDOM_BOOLEAN_NUMBER,
  RANDOM_BOOLEAN,
  RANDOM_INTEGER,
  EXIT,
};
