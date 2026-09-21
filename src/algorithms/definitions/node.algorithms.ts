/* eslint-disable @typescript-eslint/no-explicit-any */
import { SpinalNode, SpinalGraphService } from 'spinal-env-viewer-graph-service';
import {
  AlgorithmDefinition,
  AlgorithmRunResult,
  createAlgorithm,
} from './core';
import { parseValue, resolveBooleanFlag, touchDirectModificationDate } from '../../services/utils';

/** Shared description for the updateDirectModificationDate parameter of the endpoint setters. */
const UPDATE_DIRECT_MODIFICATION_DATE_DESC =
  'If true, also stamps node.info.directModificationDate with the current time after setting ' +
  'the value, so the BOS can detect the direct modification (default: false).';

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

/** Returns the first node whose info[propName] is a string matching the regex (like FIND_NODE). */
const findNodeByProperty = (
  nodes: SpinalNode<any>[],
  propName: string,
  regex: RegExp
): SpinalNode<any> | undefined =>
  nodes.find((node) => {
    const infoProp = node.info[propName];
    if (!infoProp || typeof infoProp.get !== 'function') return false;
    const value: unknown = infoProp.get();
    return typeof value === 'string' && regex.test(value);
  });

/** The "ifNotFound" parameter of the lookups: fail the block (default) or return null. */
const NOT_FOUND_PARAM = {
  name: 'ifNotFound',
  type: 'string',
  description:
    'What to do when nothing matches: "error" (default — the block fails) or "null" (return null, so ' +
    'EXISTS — e.g. inside a FILTER — can test whether something was found).',
  required: false,
};

const resolveNotFoundPolicy = (raw: unknown, blockName: string): 'error' | 'null' => {
  if (raw === undefined || raw === null || raw === '') return 'error';
  const policy = String(raw).trim().toLowerCase();
  if (policy === 'error' || policy === 'null') return policy;
  throw new Error(`${blockName}: "ifNotFound" must be "error" or "null", got ${JSON.stringify(raw)}`);
};

/**
 * Info keys that must not be overwritten: `id` is the node's identity and the key
 * SpinalGraphService indexes nodes by — changing it would desync the registry and
 * break every relation referencing the node.
 */
const PROTECTED_INFO_KEYS = new Set(['id']);

/**
 * Sets a property on a node's info model: updates it in place if it already exists,
 * otherwise creates it (add_attr). Refuses to touch a protected key.
 */
const setNodeInfoProperty = (node: SpinalNode<any>, property: string, value: unknown, blockName: string): void => {
  if (typeof property !== 'string' || property.trim() === '') {
    throw new Error(`${blockName} requires a non-empty "property" parameter`);
  }
  if (PROTECTED_INFO_KEYS.has(property)) {
    throw new Error(`${blockName}: "${property}" is a protected info property and cannot be modified`);
  }
  if (!node.info[property]) {
    node.info.add_attr(property, value);
  } else {
    node.info[property].set(value);
  }
};

export const NODE_ALGORITHMS: AlgorithmDefinition[] = [
  createAlgorithm({
    name: 'FIRST_NODE',
    description: 'Returns the node input, or first node of a node array.',
    inputs: [
      { name: 'nodes', types: ['SpinalNode', 'SpinalNode[]'], description: 'A node, or a list of nodes (the first is returned).', required: true },
    ],
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
    name: 'MERGE_NODES',
    description:
      'Merges several node inputs into a single SpinalNode array. Each input may be a node or a ' +
      'node array — they are flattened (one level) into one list, in input order. Use it to combine ' +
      'e.g. children from two different relations. Set "deduplicate" to remove nodes that appear ' +
      'more than once (by id). Returns [] when nothing is wired.',
    inputs: [
      { name: 'nodes', types: ['SpinalNode', 'SpinalNode[]'], description: 'Two or more nodes and/or node arrays to merge.', required: true, variadic: true },
    ],
    outputType: 'SpinalNode[]',
    parameters: [
      { name: 'deduplicate', type: 'boolean', description: 'If true, keep each node only once (by id), preserving first occurrence. Default false (plain concatenation).', required: false },
    ],
    run: async (input, params): AlgorithmRunResult => {
      // Variadic collapse: 0 -> [], 1 -> the value as-is, 2+ -> array of the inputs.
      const items: unknown[] = Array.isArray(input) ? input : [input];
      const merged: SpinalNode<any>[] = [];
      for (const item of items) {
        if (isNodeArray(item)) merged.push(...item);      // node array (empty spreads nothing)
        else if (isSpinalNode(item)) merged.push(item);   // single node
        else throw new Error('MERGE_NODES: each input must be a SpinalNode or a SpinalNode[]');
      }

      const deduplicate = params?.deduplicate === true || params?.deduplicate === 'true';
      if (!deduplicate) return merged;

      const seen = new Set<string>();
      return merged.filter((node) => {
        const id = node.getId().get();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    },
  }),
  createAlgorithm({
    name: 'GET_CONTEXT',
    description:
      'Returns the context (SpinalContext) with the given name from the graph. ' +
      'Takes no input — the context is looked up by the "name" parameter. ' +
      'Throws if no context with that name exists.',
    inputs: [],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'name', type: 'string', description: 'The name of the context to fetch.', required: true },
    ],
    run: async (_input, params): AlgorithmRunResult => {
      const name = params?.name;
      if (typeof name !== 'string' || name.length === 0) {
        throw new Error('GET_CONTEXT requires a non-empty "name" parameter');
      }
      const context = SpinalGraphService.getContext(name);
      if (!context) {
        throw new Error(`GET_CONTEXT: no context found with name "${name}"`);
      }
      return context as unknown as SpinalNode<any>;
    },
  }),
  createAlgorithm({
    name: 'GET_NODE_SERVER_ID',
    description: 'Returns the ID of a SpinalNode.',
    inputs: [
      { name: 'node', types: ['SpinalNode'], description: 'The node whose server id to return.', required: true },
    ],
    outputType: 'number',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');
      return input._server_id;
    },
  }),
  createAlgorithm({
    name: 'SET_NODE_INFO',
    description:
      'Sets a property on a node\'s info to a dynamic value input. Takes 2 inputs: [node, value]. ' +
      'The property key comes from the "property" parameter. Creates the property if it does not ' +
      'exist, otherwise updates it in place (e.g. rename a node by setting "name"). These info ' +
      'properties are what FILTER_NODE / FIND_NODE match on. Returns the node for chaining. ' +
      'The "id" property is protected and cannot be changed.',
    inputs: [
      { name: 'node', types: ['SpinalNode'], description: 'The node whose info to update.', required: true },
      { name: 'value', types: ['any'], description: 'The value to set on the info property.', required: true },
    ],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'property', type: 'string', description: 'The info property key to set (e.g. "name").', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!Array.isArray(input) || input.length < 2) {
        throw new Error('SET_NODE_INFO expects 2 inputs: [node, value]');
      }
      const node = input[0];
      const value = input[1];
      if (!isSpinalNode(node)) {
        throw new Error('SET_NODE_INFO: first input must be a SpinalNode');
      }
      setNodeInfoProperty(node, params?.property as string, value, 'SET_NODE_INFO');
      return node;
    },
  }),
  createAlgorithm({
    name: 'SET_NODE_INFO_PARAM',
    description:
      'Sets a property on a node\'s info to a static parameter value. Takes 1 input: the node, and ' +
      '"property" + "value" parameters. Creates the property if it does not exist, otherwise updates ' +
      'it in place (e.g. rename a node by setting "name"). These info properties are what FILTER_NODE ' +
      '/ FIND_NODE match on. Returns the node for chaining. The "id" property is protected and cannot ' +
      'be changed.',
    inputs: [
      { name: 'node', types: ['SpinalNode'], description: 'The node whose info to update.', required: true },
    ],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'property', type: 'string', description: 'The info property key to set (e.g. "name").', required: true },
      { name: 'value', type: 'string', description: 'The value to set. Numeric strings ("42") and "true"/"false"/"null" are coerced to their real type, so a new numeric property becomes a Val (number). Pass a genuine string via SET_NODE_INFO (dynamic) if you need "42" to stay text.', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!isSpinalNode(input)) {
        throw new Error('SET_NODE_INFO_PARAM expects a SpinalNode input');
      }
      if (params?.value === undefined) {
        throw new Error('SET_NODE_INFO_PARAM requires a "value" parameter');
      }
      // Coerce numeric/boolean/null strings to their real JS type so a NEW property
      // gets the right model type (number -> Val, boolean -> Bool). For an existing
      // property, the model re-coerces to its own type anyway.
      setNodeInfoProperty(input, params?.property as string, parseValue(params.value), 'SET_NODE_INFO_PARAM');
      return input;
    },
  }),
  createAlgorithm({
    name: 'GET_NODE_CHILDREN',
    description: 'Returns the children of a SpinalNode.',
    inputs: [
      { name: 'node', types: ['SpinalNode'], description: 'The node whose children to return.', required: true },
    ],
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
    inputs: [
      { name: 'node', types: ['SpinalNode'], description: 'The node whose parents to return.', required: true },
    ],
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
    name: 'GET_NODE_INFO',
    description:
      'Reads one field of a node\'s info: "name" (default), "type", "id", "server_id" or any other ' +
      'info key. Returns the plain value (string / number / boolean), or null when the key is absent. ' +
      'The usual first step of a predicate on a node — e.g. GET_NODE_INFO "type" → EQUALS_PARAM ' +
      '"geographicRoom", or GET_NODE_INFO "name" → MATCHES_REGEX "^Bureau".',
    inputs: [
      { name: 'node', types: ['SpinalNode'], description: 'The node to read.', required: true },
    ],
    outputType: 'any',
    parameters: [
      { name: 'property', type: 'string', description: 'Info key to read (default "name").', required: false },
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('GET_NODE_INFO expects a SpinalNode input');
      const property = typeof params?.property === 'string' && params.property.trim() !== ''
        ? params.property.trim()
        : 'name';
      if (property === 'server_id') return ((input as any)._server_id ?? null) as any;
      const raw = (input.info as any)?.[property];
      if (raw === undefined || raw === null) return null as any;
      const value = typeof raw?.get === 'function' ? raw.get() : raw;
      return (value === undefined ? null : value) as any;
    },
  }),
  createAlgorithm({
    name: 'GET_NODE_CHILD',
    description:
      'Shortcut for GET_NODE_CHILDREN + FIND_NODE: returns the first child of the input node whose ' +
      'property matches a regex. The optional "regex" limits which relations are traversed; ' +
      '"filterProperty" (default "name") and "regexFilter" select the child. Fails if none matches, ' +
      'unless "ifNotFound" is "null".',
    inputs: [
      { name: 'node', types: ['SpinalNode'], description: 'The node whose children to search.', required: true },
    ],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'regex', type: 'string', description: 'Optional regex on the relation name to limit which children are traversed.', required: false },
      { name: 'filterProperty', type: 'string', description: 'Info property to match on (default "name").', required: false },
      { name: 'regexFilter', type: 'string', description: 'Regex the property value must match to select the child.', required: true },
      NOT_FOUND_PARAM,
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('GET_NODE_CHILD expects a SpinalNode input');
      const rawRegexFilter = params?.regexFilter;
      if (typeof rawRegexFilter !== 'string' || rawRegexFilter.length === 0) {
        throw new Error('GET_NODE_CHILD requires a non-empty "regexFilter" parameter');
      }
      const relationRegex = params?.regex ? new RegExp(String(params.regex)) : undefined;
      const propName = typeof params?.filterProperty === 'string' && params.filterProperty.length > 0
        ? params.filterProperty
        : 'name';
      const regexFilter = new RegExp(rawRegexFilter);

      const children = await input.getChildren(relationRegex);
      const found = findNodeByProperty(children, propName, regexFilter);
      if (!found) {
        if (resolveNotFoundPolicy(params?.ifNotFound, 'GET_NODE_CHILD') === 'null') return null as any;
        throw new Error(`GET_NODE_CHILD: no child found with ${propName} =~ /${rawRegexFilter}/`);
      }
      return found;
    },
  }),
  createAlgorithm({
    name: 'GET_NODE_PARENT',
    description:
      'Shortcut for GET_NODE_PARENTS + FIND_NODE: returns the first parent of the input node whose ' +
      'property matches a regex. The optional "regex" limits which relations are traversed; ' +
      '"filterProperty" (default "name") and "regexFilter" select the parent. Fails if none matches, ' +
      'unless "ifNotFound" is "null".',
    inputs: [
      { name: 'node', types: ['SpinalNode'], description: 'The node whose parents to search.', required: true },
    ],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'regex', type: 'string', description: 'Optional regex on the relation name to limit which parents are traversed.', required: false },
      { name: 'filterProperty', type: 'string', description: 'Info property to match on (default "name").', required: false },
      { name: 'regexFilter', type: 'string', description: 'Regex the property value must match to select the parent.', required: true },
      NOT_FOUND_PARAM,
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('GET_NODE_PARENT expects a SpinalNode input');
      const rawRegexFilter = params?.regexFilter;
      if (typeof rawRegexFilter !== 'string' || rawRegexFilter.length === 0) {
        throw new Error('GET_NODE_PARENT requires a non-empty "regexFilter" parameter');
      }
      const relationRegex = params?.regex ? new RegExp(String(params.regex)) : undefined;
      const propName = typeof params?.filterProperty === 'string' && params.filterProperty.length > 0
        ? params.filterProperty
        : 'name';
      const regexFilter = new RegExp(rawRegexFilter);

      const parents = await input.getParents(relationRegex);
      const found = findNodeByProperty(parents, propName, regexFilter);
      if (!found) {
        if (resolveNotFoundPolicy(params?.ifNotFound, 'GET_NODE_PARENT') === 'null') return null as any;
        throw new Error(`GET_NODE_PARENT: no parent found with ${propName} =~ /${rawRegexFilter}/`);
      }
      return found;
    },
  }),

  createAlgorithm({
    name: 'FILTER_NODE',
    description: 'Filter Nodes based on specified criteria.',
    inputs: [
      { name: 'nodes', types: ['SpinalNode', 'SpinalNode[]'], description: 'A node or list of nodes to filter.', required: true },
    ],
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
    description:
      'Returns the first node matching the specified criteria (like FILTER_NODE but returns a single ' +
      'node). Fails if none matches, unless "ifNotFound" is "null".',
    inputs: [
      { name: 'nodes', types: ['SpinalNode', 'SpinalNode[]'], description: 'A node or list of nodes to search.', required: true },
    ],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'filterProperty', type: 'string', description: 'Name of the info property (must be in the info of the node)', required: true },
      { name: 'regexFilter', type: 'string', description: 'Regex pattern to filter by', required: true },
      NOT_FOUND_PARAM,
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

      if (!found) {
        if (resolveNotFoundPolicy(params?.ifNotFound, 'FIND_NODE') === 'null') return null as any;
        throw new Error(`No node found matching ${propName} =~ /${rawRegexFilter}/`);
      }
      return found;
    },
  }),

  createAlgorithm({
    name: 'ENDPOINT_NODE_CURRENT_VALUE',
    description: 'For a node representing an endpoint, returns the current value.',
    inputs: [
      { name: 'endpoint', types: ['SpinalNode'], description: 'The endpoint node whose current value to read.', required: true },
    ],
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
    inputs: [
      { name: 'endpoint', types: ['SpinalNode'], description: 'The endpoint node whose current value model to return.', required: true },
    ],
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
    inputs: [
      { name: 'endpoint', types: ['SpinalNode'], description: 'The endpoint node to update.', required: true },
      { name: 'value', types: ['any'], description: 'The value to set on the endpoint.', required: true },
    ],
    outputType: 'any',
    parameters: [
      { name: 'updateDirectModificationDate', type: 'boolean', description: UPDATE_DIRECT_MODIFICATION_DATE_DESC, required: false },
    ],
    run: async (input, params): AlgorithmRunResult => {
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
      if (resolveBooleanFlag(params?.updateDirectModificationDate, false)) {
        touchDirectModificationDate(node);
      }
      return value as any;
    },
  }),

  createAlgorithm({
    name: 'SET_ENDPOINT_VALUE_PARAM',
    description:
      'Sets the current value of an endpoint node to a static parameter value. ' +
      'Takes 1 input: endpointNode, and a "value" parameter. Returns the value that was set.',
    inputs: [
      { name: 'endpoint', types: ['SpinalNode'], description: 'The endpoint node to update.', required: true },
    ],
    outputType: 'any',
    parameters: [
      { name: 'value', type: 'string', description: 'The value to set (string, number, or boolean)', required: true },
      { name: 'updateDirectModificationDate', type: 'boolean', description: UPDATE_DIRECT_MODIFICATION_DATE_DESC, required: false },
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
      if (resolveBooleanFlag(params?.updateDirectModificationDate, false)) {
        touchDirectModificationDate(input);
      }
      return value as any;
    },
  }),
];
