/* eslint-disable @typescript-eslint/no-explicit-any */
import { IAlgorithm } from '../interfaces/IAlgorithm';
import { IRequiredParameter } from '../interfaces/IRequiredParameter';

interface IParameters {
  [key: string]: string | number | boolean;
}

class Algorithm implements IAlgorithm {
  name: string;
  inputTypes: string[];
  outputType: string;
  description: string;
  requiredParams: IRequiredParameter[] | 'boolean' | 'number' | 'string';
  run: (input: any | any[], params?: IParameters) => string | number | boolean;

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
  'This algorithm returns the value set by the user (p1) regardless of the input',
  ['number'],
  'number',
  [{ name: 'p1', type: 'number', description: 'the value to inject' }],
  (input: number, params: IParameters | undefined ): string | number | boolean => {
    if(!params) throw new Error('No parameters provided');
    return params['p1'];
  }
);

export const COPY = new Algorithm(
  'COPY',
  'This algorithm returns the value of first input',
  ['number'],
  'number',
  [],
  (input: any[]): number => {
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    return flattenedArray[0];
  }
);

export const DIVIDE = new Algorithm(
  'DIVIDE',
  'This algorithm returns the result of the division of the first input by the second input',
  ['number'],
  'number',
  [],
  (input: any[]): number => {
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    return flattenedArray[0] / flattenedArray[1];
  }
);

export const DIVIDE_BY = new Algorithm(
  'DIVIDE_BY',
  'This algorithm returns the result of the division of the first input by the value set by the user (p1)',
  ['number'],
  'number',
  [{ name: 'p1', type: 'number', description: 'the value to divide by' }],
  (input: any[], params: IParameters | undefined): number => {
    if(!params) throw new Error('No parameters provided');
    if(params['p1'] === 0) throw new Error('Division by zero');
    if(typeof params['p1'] !== 'number') throw new Error(`Invalid parameter type. Expected number, got ${typeof params['p1']}`);
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    
    return flattenedArray[0] / params['p1'];
  }
);

export const THRESHOLD_ABOVE = new Algorithm(
  'THRESHOLD_ABOVE',
  'This algorithm returns true if the input is above the threshold set by the user',
  ['number'],
  'boolean',
  [{ name: 'p1', type: 'number', description: 'the threshold value' }],
  (input: any[], params: IParameters | undefined ): boolean => {
    if(!params) throw new Error('No parameters provided');
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    const treshold = params['p1'];
    for (const n of flattenedArray) {
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
  (input: any[], params: IParameters | undefined): boolean => {
    if(!params) throw new Error('No parameters provided');
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    const treshold = params['p1'];
    for (const n of flattenedArray) {
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
  (input: any[], params: IParameters | undefined ): boolean => {
    if(!params) throw new Error('No parameters provided');
    if(typeof params['p1'] !== 'number') throw new Error(`Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`);
    if(typeof params['p2'] !== 'number') throw new Error(`Invalid p2 parameter type. Expected number, got ${typeof params['p2']}`);
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    const p1 = params['p1'];
    const p2 = params['p2'];
    const min = Math.min(p1, p2);
    const max = Math.max(p1, p2);
    for (const n of flattenedArray) {
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
  (input: any[], params: IParameters | undefined ): boolean => {
    if(!params) throw new Error('No parameters provided');
    if(typeof params['p1'] !== 'number') throw new Error(`Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`);
    if(typeof params['p2'] !== 'number') throw new Error(`Invalid p2 parameter type. Expected number, got ${typeof params['p2']}`);
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    const p1 = params['p1'];
    const p2 = params['p2'];
    const min = Math.min(p1, p2);
    const max = Math.max(p1, p2);
    for (const n of flattenedArray) {
      if (n <= min || n >= max) return true;
    }
    return false;
  }
);

export const AVERAGE = new Algorithm(
  'AVERAGE',
  'This algorithm returns the average of the inputs',
  ['number'],
  'number',
  [],
  (input: any[]): number => {
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;

    return (
      flattenedArray.reduce((acc, current) => acc + current, 0) / input.length
    );
  }
);

export const AND = new Algorithm(
  'AND',
  'This algorithm returns true if all the inputs are true',
  ['boolean'],
  'boolean',
  [],
  (input: any[]): boolean => {
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;

    return !flattenedArray.includes(false);
  }
);

export const OR = new Algorithm(
  'OR',
  'This algorithm returns true if at least one of the inputs is true',
  ['boolean'],
  'boolean',
  [],
  (input: any[]): boolean => {
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    return flattenedArray.includes(true);
  }
);

export const NOT = new Algorithm(
  'NOT',
  'This algorithm returns true if all the inputs are false',
  ['boolean'],
  'boolean',
  [],
  (input: any[]): boolean => {
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    return !flattenedArray.includes(true);
  }
);

export const DIFFERENCE_THRESHOLD = new Algorithm(
  'DIFFERENCE_THRESHOLD',
  'This algorithm returns true if the difference between the first and any other input is above the threshold set by the user',
  ['number'],
  'boolean',
  [{ name: 'p1', type: 'number', description: 'the threshold value' }],
  (input: any[], params: IParameters | undefined ): boolean => {
    if(!params) throw new Error('No parameters provided');
    if(typeof params['p1'] !== 'number') throw new Error(`Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`);
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    const treshold = params['p1'];
    const first = flattenedArray[0];
    for (const n of flattenedArray) {
      if (Math.abs(n - first) > treshold) return true;
    }
    return false;
  }
);

export const INTEGRAL_BOOLEAN = new Algorithm(
  'INTEGRAL_BOOLEAN',
  'This algorithm calculates the integral of timeseries.',
  ['object'],
  'number',
  [
    {
      name: 'p1',
      type: 'number',
      description:
        'intervalTime, please copy paste the timeseries interval time',
    },
    {
      name: 'p2',
      type: 'string',
      description:
        'Ratio || Percentage   (write one of the two, Ratio will be used by default)',
    },
  ],
  (input: { date: number; value: number }[][], params: IParameters | undefined): number => {
    if(!params) throw new Error('No parameters provided');
    if(typeof params['p1'] !== 'number') throw new Error(`Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`);
    const percentageResult = params['p2'] === 'Percentage';
    const dataInput = input.reduce((acc, curr) => acc.concat(...curr), []);
    const invertBool = (bool) => (bool ? 0 : 1);
    dataInput.unshift({
      date: dataInput[dataInput.length - 1].date - params['p1'],
      value: invertBool(dataInput[0].value),
    });
    // Ensure input is sorted by time
    dataInput.sort((a, b) => a.date - b.date);

    let integral = 0;

    for (let i = 1; i < dataInput.length; i++) {
      // Calculate the difference in time
      const deltaTime = dataInput[i].date - dataInput[i - 1].date;

      // Calculate the average value between two points
      const avgValue = (dataInput[i].value + dataInput[i - 1].value) / 2;

      // Add the area of the trapezoid to the total integral
      integral += avgValue * deltaTime;
    }

    if (!percentageResult)
      return (
        integral / (dataInput[dataInput.length - 1].date - dataInput[0].date)
      );
    else
      return (
        (integral /
          (dataInput[dataInput.length - 1].date - dataInput[0].date)) *
        100
      );
  }
);

export const STANDARD_DEVIATION = new Algorithm(
  'STANDARD_DEVIATION',
  'This algorithm returns the standard deviation of the inputs',
  ['number'],
  'number',
  [],
  (input: any[]): number => {
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    const n = flattenedArray.length;
    const mean = flattenedArray.reduce((a, b) => a + b) / n;
    return Math.sqrt(
      flattenedArray.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) /
        n
    );
  }
);

export const EQUAL_TO = new Algorithm(
  'EQUAL_TO',
  'This algorithm returns true if the first input is equal to the parameter',
  ['number', 'string'],
  'boolean',
  [{ name: 'p1', type: 'number', description: 'the value to compare to' }],
  (input: any[], params: IParameters | undefined): boolean => {
    if(!params) throw new Error('No parameters provided');
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    return flattenedArray[0] === params['p1'];
  }
);

export const IS_EMPTY = new Algorithm(
  'IS_EMPTY',
  'This algorithm returns true if the input is an empty list',
  ['number', 'string'],
  'boolean',
  [],
  (input: any[]): boolean => {
    const flattenedArray = input.reduce((acc, curr) => acc.concat(...curr), []);
    return flattenedArray.length === 0;
  }
);

export const CONV_BOOLEAN_TO_NUMBER = new Algorithm(
  'CONV_BOOLEAN_TO_NUMBER',
  'This algorithm converts a boolean to a number',
  ['boolean'],
  'number',
  [],
  (input: any[]): number => {
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    return flattenedArray[0] ? 1 : 0;
  }
);

export const CONV_NUMBER_TO_BOOLEAN = new Algorithm(
  'CONV_NUMBER_TO_BOOLEAN',
  'This algorithm converts a number to a boolean (0 is false, everything else is true)',
  ['number'],
  'boolean',
  [],
  (input: any[]): boolean => {
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;

    console.log('conv to boolean :', flattenedArray)
    return flattenedArray[0] !== 0;
  }
);

export const CURRENT_EPOCH_TIME = new Algorithm(
  'CURRENT_EPOCH_TIME',
  'This algorithm returns the current epoch time',
  [],
  'number',
  [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (input: any[]): number => {
    return Date.now();
  }
);

export const SUBTRACT = new Algorithm(
  'SUBTRACT',
  'This algorithm returns the result of the subtraction of the first input by the second input',
  ['number'],
  'number',
  [],
  (input: any[]): number => {
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    return flattenedArray[0] - flattenedArray[1];
  }
);

export const SUBTRACT_BY = new Algorithm(
  'SUBTRACT_BY',
  'This algorithm returns the result of the subtraction of the first input by the value set by the user (p1)',
  ['number'],
  'number',
  [{ name: 'p1', type: 'number', description: 'the value to subtract by' }],
  (input: any[], params: IParameters | undefined): number => {
    if(!params) throw new Error('No parameters provided');
    if(typeof params['p1'] !== 'number') throw new Error(`Invalid p1 parameter type. Expected number, got ${typeof params['p1']}`);
    const isArrayofArrays = Array.isArray(input[0]);
    const flattenedArray = isArrayofArrays
      ? input.reduce((acc, curr) => acc.concat(...curr), [])
      : input;
    return flattenedArray[0] - params['p1'];
  }
);


export const ALGORITHMS: { [key: string]: Algorithm } = {
  PUTVALUE,
  COPY,
  DIVIDE,
  DIVIDE_BY,
  THRESHOLD_ABOVE,
  THRESHOLD_BELOW,
  THRESHOLD_BETWEEN_IN,
  THRESHOLD_BETWEEN_OUT,
  AVERAGE,
  AND,
  OR,
  NOT,
  DIFFERENCE_THRESHOLD,
  INTEGRAL_BOOLEAN,
  STANDARD_DEVIATION,
  EQUAL_TO,
  IS_EMPTY,
  CONV_BOOLEAN_TO_NUMBER,
  CONV_NUMBER_TO_BOOLEAN,
  CURRENT_EPOCH_TIME,
  SUBTRACT,
  SUBTRACT_BY,
};
