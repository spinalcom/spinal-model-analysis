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



];
