/* eslint-disable @typescript-eslint/no-explicit-any */
import { SpinalNode } from 'spinal-env-viewer-graph-service';
import {
  AlgorithmDefinition,
  AlgorithmRunResult,
  createAlgorithm,
} from './core';

const isSpinalNode = (value: unknown): value is SpinalNode<any> => {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as SpinalNode<any>).getId === 'function'
  );
};

const isNodeArray = (value: unknown): value is SpinalNode<any>[] => {
  return Array.isArray(value) && value.every((item) => isSpinalNode(item));
};

export const NODE_ALGORITHMS: AlgorithmDefinition[] = [
  createAlgorithm({
    name: 'FIRST_NODE',
    description: 'Returns the node input, or first node of a node array.',
    inputTypes: ['SpinalNode', 'SpinalNode[]'],
    outputType: 'SpinalNode',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      if (isSpinalNode(input)) return input;
      if (isNodeArray(input)) {
        if (input.length === 0) throw new Error('No SpinalNode input provided');
        return input[0];
      }
      throw new Error('Expected SpinalNode or SpinalNode[] input');
    },
  }),
  createAlgorithm({
    name: 'GET_NODE_SERVER_ID',
    description: 'Returns the ID of a SpinalNode.',
    inputTypes: ['SpinalNode'],
    outputType: 'number',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');
      return input._server_id;
    },
  }),
  createAlgorithm({
    name: 'GET_NODE_CHILDREN',
    description: 'Returns the children of a SpinalNode.',
    inputTypes: ['SpinalNode'],
    outputType: 'SpinalNode[]',
    parameters: [
      { name: 'regex', type: 'string', description: 'Regex pattern to relation used to get children nodes', required: false },

    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');
      const regex = params?.regex ? new RegExp(String(params.regex)) : undefined;
      return await input.getChildren(regex);
    },
  }),
  createAlgorithm({
    name: 'GET_NODE_PARENTS',
    description: 'Returns the parents of a SpinalNode.',
    inputTypes: ['SpinalNode'],
    outputType: 'SpinalNode[]',
    parameters: [
      { name: 'regex', type: 'string', description: 'Regex pattern to relation used to get parent nodes', required: false }
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');
      const regex = params?.regex ? new RegExp(String(params.regex)) : undefined;
      return await input.getParents(regex);
    },
  }),

  createAlgorithm({
    name: 'FILTER_NODE',
    description: 'Filter Nodes based on specified criteria.',
    inputTypes: ['SpinalNode', 'SpinalNode[]'],
    outputType: 'SpinalNode[]',
    parameters: [
      { name: 'filterProperty', type: 'string', description: 'Name of the info property ( must be in the info of the node)', required: true },
      { name: 'regexFilter', type: 'string', description: 'Regex pattern to filter by', required: true }

    ],
    run: async (input, params): AlgorithmRunResult => {
      const nodes = isSpinalNode(input)
        ? [input]
        : isNodeArray(input)
          ? input
          : (() => {
            throw new Error('Expected SpinalNode or SpinalNode[] input');
          })();

      const rawRegexFilter = params?.regexFilter;
      if (typeof rawRegexFilter !== 'string' || rawRegexFilter.length === 0) {
        throw new Error('Invalid or missing regexFilter parameter');
      }

      const rawPropName = params?.filterProperty;
      if (typeof rawPropName !== 'string' || rawPropName.length === 0) {
        throw new Error('Invalid or missing filterProperty parameter');
      }

      const regexFilter = new RegExp(rawRegexFilter);
      const propName = rawPropName;

      return nodes.filter(node => {
        const infoProp = node.info[propName];
        if (!infoProp || typeof infoProp.get !== 'function') return false;
        const info: unknown = infoProp.get();
        const matchesName = typeof info === 'string' && regexFilter.test(info);
        return matchesName;
      });
    },
  }),

  createAlgorithm({
    name: 'FIND_NODE',
    description: 'Returns the first node matching the specified criteria (like FILTER_NODE but returns a single node).',
    inputTypes: ['SpinalNode', 'SpinalNode[]'],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'filterProperty', type: 'string', description: 'Name of the info property (must be in the info of the node)', required: true },
      { name: 'regexFilter', type: 'string', description: 'Regex pattern to filter by', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      const nodes = isSpinalNode(input)
        ? [input]
        : isNodeArray(input)
          ? input
          : (() => {
            throw new Error('Expected SpinalNode or SpinalNode[] input');
          })();

      const rawRegexFilter = params?.regexFilter;
      if (typeof rawRegexFilter !== 'string' || rawRegexFilter.length === 0) {
        throw new Error('Invalid or missing regexFilter parameter');
      }

      const rawPropName = params?.filterProperty;
      if (typeof rawPropName !== 'string' || rawPropName.length === 0) {
        throw new Error('Invalid or missing filterProperty parameter');
      }

      const regexFilter = new RegExp(rawRegexFilter);
      const propName = rawPropName;

      const found = nodes.find(node => {
        const infoProp = node.info[propName];
        if (!infoProp || typeof infoProp.get !== 'function') return false;
        const info: unknown = infoProp.get();
        return typeof info === 'string' && regexFilter.test(info);
      });

      if (!found) throw new Error(`No node found matching ${propName} =~ /${rawRegexFilter}/`);
      return found;
    },
  }),

  createAlgorithm({
    name: 'ENDPOINT_NODE_CURRENT_VALUE',
    description: 'For a node representing an endpoint, returns the current value.',
    inputTypes: ['SpinalNode'],
    outputType: 'any', // Can be number, boolean , string, etc. depending on the endpoint
    parameters: [
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');
      const nodeElement = await input.element?.load();
      if (!nodeElement) throw new Error('Node has no element to load');
      const currentValue = nodeElement.currentValue;
      if (currentValue === undefined) throw new Error('Node element has no currentValue');
      return currentValue.get();
    }
  }),

  createAlgorithm({
    name: 'ENDPOINT_NODE_CURRENT_VALUE_MODEL',
    description:
      'For a node representing an endpoint, returns the bindable currentValue MODEL ' +
      '(not the primitive value). Use this to populate an input register that a COV ' +
      'trigger can bind on to react to value changes.',
    inputTypes: ['SpinalNode'],
    outputType: 'any', // The underlying spinal model wrapping the value (bindable)
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');
      const nodeElement = await input.element?.load();
      if (!nodeElement) throw new Error('Node has no element to load');
      const currentValue = nodeElement.currentValue;
      if (currentValue === undefined) throw new Error('Node element has no currentValue');
      return currentValue;
    }
  }),

  createAlgorithm({
    name: 'SET_ENDPOINT_VALUE',
    description:
      'Sets the current value of an endpoint node. Takes 2 inputs: [endpointNode, value]. ' +
      'Returns the value that was set.',
    inputTypes: ['SpinalNode', 'any'],
    outputType: 'any',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      if (!Array.isArray(input) || input.length < 2) {
        throw new Error('SET_ENDPOINT_VALUE expects 2 inputs: [endpointNode, value]');
      }
      const node = input[0];
      const value = input[1];
      if (!isSpinalNode(node)) {
        throw new Error('SET_ENDPOINT_VALUE: first input must be a SpinalNode');
      }
      const nodeElement = await (node as SpinalNode<any>).element?.load();
      if (!nodeElement) throw new Error('SET_ENDPOINT_VALUE: node has no element to load');
      const currentValue = nodeElement.currentValue;
      if (currentValue === undefined) {
        throw new Error('SET_ENDPOINT_VALUE: node element has no currentValue');
      }
      currentValue.set(value);
      return value as any;
    },
  }),

  createAlgorithm({
    name: 'SET_ENDPOINT_VALUE_PARAM',
    description:
      'Sets the current value of an endpoint node to a static parameter value. ' +
      'Takes 1 input: endpointNode, and a "value" parameter. Returns the value that was set.',
    inputTypes: ['SpinalNode'],
    outputType: 'any',
    parameters: [
      { name: 'value', type: 'string', description: 'The value to set (string, number, or boolean)', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!isSpinalNode(input)) {
        throw new Error('SET_ENDPOINT_VALUE_PARAM expects a SpinalNode input');
      }
      const value = params?.value;
      if (value === undefined) {
        throw new Error('SET_ENDPOINT_VALUE_PARAM requires a "value" parameter');
      }
      const nodeElement = await input.element?.load();
      if (!nodeElement) throw new Error('SET_ENDPOINT_VALUE_PARAM: node has no element to load');
      const currentValue = nodeElement.currentValue;
      if (currentValue === undefined) {
        throw new Error('SET_ENDPOINT_VALUE_PARAM: node element has no currentValue');
      }
      currentValue.set(value);
      return value as any;
    },
  }),
];
