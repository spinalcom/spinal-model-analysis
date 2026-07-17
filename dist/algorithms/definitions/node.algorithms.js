"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NODE_ALGORITHMS = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const core_1 = require("./core");
const isSpinalNode = (value) => {
    return (Boolean(value) &&
        typeof value === 'object' &&
        typeof value.getId === 'function');
};
const isNodeArray = (value) => {
    return Array.isArray(value) && value.every((item) => isSpinalNode(item));
};
/** Returns the first node whose info[propName] is a string matching the regex (like FIND_NODE). */
const findNodeByProperty = (nodes, propName, regex) => nodes.find((node) => {
    const infoProp = node.info[propName];
    if (!infoProp || typeof infoProp.get !== 'function')
        return false;
    const value = infoProp.get();
    return typeof value === 'string' && regex.test(value);
});
exports.NODE_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'FIRST_NODE',
        description: 'Returns the node input, or first node of a node array.',
        inputs: [
            { name: 'nodes', types: ['SpinalNode', 'SpinalNode[]'], description: 'A node, or a list of nodes (the first is returned).', required: true },
        ],
        outputType: 'SpinalNode',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (isSpinalNode(input))
                return input;
            if (isNodeArray(input)) {
                if (input.length === 0)
                    throw new Error('No SpinalNode input provided');
                return input[0];
            }
            throw new Error('Expected SpinalNode or SpinalNode[] input');
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'MERGE_NODES',
        description: 'Merges several node inputs into a single SpinalNode array. Each input may be a node or a ' +
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
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            // Variadic collapse: 0 -> [], 1 -> the value as-is, 2+ -> array of the inputs.
            const items = Array.isArray(input) ? input : [input];
            const merged = [];
            for (const item of items) {
                if (isNodeArray(item))
                    merged.push(...item); // node array (empty spreads nothing)
                else if (isSpinalNode(item))
                    merged.push(item); // single node
                else
                    throw new Error('MERGE_NODES: each input must be a SpinalNode or a SpinalNode[]');
            }
            const deduplicate = (params === null || params === void 0 ? void 0 : params.deduplicate) === true || (params === null || params === void 0 ? void 0 : params.deduplicate) === 'true';
            if (!deduplicate)
                return merged;
            const seen = new Set();
            return merged.filter((node) => {
                const id = node.getId().get();
                if (seen.has(id))
                    return false;
                seen.add(id);
                return true;
            });
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_CONTEXT',
        description: 'Returns the context (SpinalContext) with the given name from the graph. ' +
            'Takes no input — the context is looked up by the "name" parameter. ' +
            'Throws if no context with that name exists.',
        inputs: [],
        outputType: 'SpinalNode',
        parameters: [
            { name: 'name', type: 'string', description: 'The name of the context to fetch.', required: true },
        ],
        run: (_input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const name = params === null || params === void 0 ? void 0 : params.name;
            if (typeof name !== 'string' || name.length === 0) {
                throw new Error('GET_CONTEXT requires a non-empty "name" parameter');
            }
            const context = spinal_env_viewer_graph_service_1.SpinalGraphService.getContext(name);
            if (!context) {
                throw new Error(`GET_CONTEXT: no context found with name "${name}"`);
            }
            return context;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_NODE_SERVER_ID',
        description: 'Returns the ID of a SpinalNode.',
        inputs: [
            { name: 'node', types: ['SpinalNode'], description: 'The node whose server id to return.', required: true },
        ],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isSpinalNode(input))
                throw new Error('Expected SpinalNode input');
            return input._server_id;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_NODE_CHILDREN',
        description: 'Returns the children of a SpinalNode.',
        inputs: [
            { name: 'node', types: ['SpinalNode'], description: 'The node whose children to return.', required: true },
        ],
        outputType: 'SpinalNode[]',
        parameters: [
            { name: 'regex', type: 'string', description: 'Regex pattern to relation used to get children nodes', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isSpinalNode(input))
                throw new Error('Expected SpinalNode input');
            const regex = (params === null || params === void 0 ? void 0 : params.regex) ? new RegExp(String(params.regex)) : undefined;
            return yield input.getChildren(regex);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_NODE_PARENTS',
        description: 'Returns the parents of a SpinalNode.',
        inputs: [
            { name: 'node', types: ['SpinalNode'], description: 'The node whose parents to return.', required: true },
        ],
        outputType: 'SpinalNode[]',
        parameters: [
            { name: 'regex', type: 'string', description: 'Regex pattern to relation used to get parent nodes', required: false }
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isSpinalNode(input))
                throw new Error('Expected SpinalNode input');
            const regex = (params === null || params === void 0 ? void 0 : params.regex) ? new RegExp(String(params.regex)) : undefined;
            return yield input.getParents(regex);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_NODE_CHILD',
        description: 'Shortcut for GET_NODE_CHILDREN + FIND_NODE: returns the first child of the input node whose ' +
            'property matches a regex. The optional "regex" limits which relations are traversed; ' +
            '"filterProperty" (default "name") and "regexFilter" select the child. Throws if none matches.',
        inputs: [
            { name: 'node', types: ['SpinalNode'], description: 'The node whose children to search.', required: true },
        ],
        outputType: 'SpinalNode',
        parameters: [
            { name: 'regex', type: 'string', description: 'Optional regex on the relation name to limit which children are traversed.', required: false },
            { name: 'filterProperty', type: 'string', description: 'Info property to match on (default "name").', required: false },
            { name: 'regexFilter', type: 'string', description: 'Regex the property value must match to select the child.', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isSpinalNode(input))
                throw new Error('GET_NODE_CHILD expects a SpinalNode input');
            const rawRegexFilter = params === null || params === void 0 ? void 0 : params.regexFilter;
            if (typeof rawRegexFilter !== 'string' || rawRegexFilter.length === 0) {
                throw new Error('GET_NODE_CHILD requires a non-empty "regexFilter" parameter');
            }
            const relationRegex = (params === null || params === void 0 ? void 0 : params.regex) ? new RegExp(String(params.regex)) : undefined;
            const propName = typeof (params === null || params === void 0 ? void 0 : params.filterProperty) === 'string' && params.filterProperty.length > 0
                ? params.filterProperty
                : 'name';
            const regexFilter = new RegExp(rawRegexFilter);
            const children = yield input.getChildren(relationRegex);
            const found = findNodeByProperty(children, propName, regexFilter);
            if (!found) {
                throw new Error(`GET_NODE_CHILD: no child found with ${propName} =~ /${rawRegexFilter}/`);
            }
            return found;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_NODE_PARENT',
        description: 'Shortcut for GET_NODE_PARENTS + FIND_NODE: returns the first parent of the input node whose ' +
            'property matches a regex. The optional "regex" limits which relations are traversed; ' +
            '"filterProperty" (default "name") and "regexFilter" select the parent. Throws if none matches.',
        inputs: [
            { name: 'node', types: ['SpinalNode'], description: 'The node whose parents to search.', required: true },
        ],
        outputType: 'SpinalNode',
        parameters: [
            { name: 'regex', type: 'string', description: 'Optional regex on the relation name to limit which parents are traversed.', required: false },
            { name: 'filterProperty', type: 'string', description: 'Info property to match on (default "name").', required: false },
            { name: 'regexFilter', type: 'string', description: 'Regex the property value must match to select the parent.', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isSpinalNode(input))
                throw new Error('GET_NODE_PARENT expects a SpinalNode input');
            const rawRegexFilter = params === null || params === void 0 ? void 0 : params.regexFilter;
            if (typeof rawRegexFilter !== 'string' || rawRegexFilter.length === 0) {
                throw new Error('GET_NODE_PARENT requires a non-empty "regexFilter" parameter');
            }
            const relationRegex = (params === null || params === void 0 ? void 0 : params.regex) ? new RegExp(String(params.regex)) : undefined;
            const propName = typeof (params === null || params === void 0 ? void 0 : params.filterProperty) === 'string' && params.filterProperty.length > 0
                ? params.filterProperty
                : 'name';
            const regexFilter = new RegExp(rawRegexFilter);
            const parents = yield input.getParents(relationRegex);
            const found = findNodeByProperty(parents, propName, regexFilter);
            if (!found) {
                throw new Error(`GET_NODE_PARENT: no parent found with ${propName} =~ /${rawRegexFilter}/`);
            }
            return found;
        }),
    }),
    (0, core_1.createAlgorithm)({
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
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const nodes = isSpinalNode(input)
                ? [input]
                : isNodeArray(input)
                    ? input
                    : (() => {
                        throw new Error('Expected SpinalNode or SpinalNode[] input');
                    })();
            const rawRegexFilter = params === null || params === void 0 ? void 0 : params.regexFilter;
            if (typeof rawRegexFilter !== 'string' || rawRegexFilter.length === 0) {
                throw new Error('Invalid or missing regexFilter parameter');
            }
            const rawPropName = params === null || params === void 0 ? void 0 : params.filterProperty;
            if (typeof rawPropName !== 'string' || rawPropName.length === 0) {
                throw new Error('Invalid or missing filterProperty parameter');
            }
            const regexFilter = new RegExp(rawRegexFilter);
            const propName = rawPropName;
            return nodes.filter(node => {
                const infoProp = node.info[propName];
                if (!infoProp || typeof infoProp.get !== 'function')
                    return false;
                const info = infoProp.get();
                const matchesName = typeof info === 'string' && regexFilter.test(info);
                return matchesName;
            });
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'FIND_NODE',
        description: 'Returns the first node matching the specified criteria (like FILTER_NODE but returns a single node).',
        inputs: [
            { name: 'nodes', types: ['SpinalNode', 'SpinalNode[]'], description: 'A node or list of nodes to search.', required: true },
        ],
        outputType: 'SpinalNode',
        parameters: [
            { name: 'filterProperty', type: 'string', description: 'Name of the info property (must be in the info of the node)', required: true },
            { name: 'regexFilter', type: 'string', description: 'Regex pattern to filter by', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const nodes = isSpinalNode(input)
                ? [input]
                : isNodeArray(input)
                    ? input
                    : (() => {
                        throw new Error('Expected SpinalNode or SpinalNode[] input');
                    })();
            const rawRegexFilter = params === null || params === void 0 ? void 0 : params.regexFilter;
            if (typeof rawRegexFilter !== 'string' || rawRegexFilter.length === 0) {
                throw new Error('Invalid or missing regexFilter parameter');
            }
            const rawPropName = params === null || params === void 0 ? void 0 : params.filterProperty;
            if (typeof rawPropName !== 'string' || rawPropName.length === 0) {
                throw new Error('Invalid or missing filterProperty parameter');
            }
            const regexFilter = new RegExp(rawRegexFilter);
            const propName = rawPropName;
            const found = nodes.find(node => {
                const infoProp = node.info[propName];
                if (!infoProp || typeof infoProp.get !== 'function')
                    return false;
                const info = infoProp.get();
                return typeof info === 'string' && regexFilter.test(info);
            });
            if (!found)
                throw new Error(`No node found matching ${propName} =~ /${rawRegexFilter}/`);
            return found;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'ENDPOINT_NODE_CURRENT_VALUE',
        description: 'For a node representing an endpoint, returns the current value.',
        inputs: [
            { name: 'endpoint', types: ['SpinalNode'], description: 'The endpoint node whose current value to read.', required: true },
        ],
        outputType: 'any',
        parameters: [],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            if (!isSpinalNode(input))
                throw new Error('Expected SpinalNode input');
            const nodeElement = yield ((_a = input.element) === null || _a === void 0 ? void 0 : _a.load());
            if (!nodeElement)
                throw new Error('Node has no element to load');
            const currentValue = nodeElement.currentValue;
            if (currentValue === undefined)
                throw new Error('Node element has no currentValue');
            return currentValue.get();
        })
    }),
    (0, core_1.createAlgorithm)({
        name: 'ENDPOINT_NODE_CURRENT_VALUE_MODEL',
        description: 'For a node representing an endpoint, returns the bindable currentValue MODEL ' +
            '(not the primitive value). Use this to populate an input register that a COV ' +
            'trigger can bind on to react to value changes.',
        inputs: [
            { name: 'endpoint', types: ['SpinalNode'], description: 'The endpoint node whose current value model to return.', required: true },
        ],
        outputType: 'any',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            var _b;
            if (!isSpinalNode(input))
                throw new Error('Expected SpinalNode input');
            const nodeElement = yield ((_b = input.element) === null || _b === void 0 ? void 0 : _b.load());
            if (!nodeElement)
                throw new Error('Node has no element to load');
            const currentValue = nodeElement.currentValue;
            if (currentValue === undefined)
                throw new Error('Node element has no currentValue');
            return currentValue;
        })
    }),
    (0, core_1.createAlgorithm)({
        name: 'SET_ENDPOINT_VALUE',
        description: 'Sets the current value of an endpoint node. Takes 2 inputs: [endpointNode, value]. ' +
            'Returns the value that was set.',
        inputs: [
            { name: 'endpoint', types: ['SpinalNode'], description: 'The endpoint node to update.', required: true },
            { name: 'value', types: ['any'], description: 'The value to set on the endpoint.', required: true },
        ],
        outputType: 'any',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            var _c;
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('SET_ENDPOINT_VALUE expects 2 inputs: [endpointNode, value]');
            }
            const node = input[0];
            const value = input[1];
            if (!isSpinalNode(node)) {
                throw new Error('SET_ENDPOINT_VALUE: first input must be a SpinalNode');
            }
            const nodeElement = yield ((_c = node.element) === null || _c === void 0 ? void 0 : _c.load());
            if (!nodeElement)
                throw new Error('SET_ENDPOINT_VALUE: node has no element to load');
            const currentValue = nodeElement.currentValue;
            if (currentValue === undefined) {
                throw new Error('SET_ENDPOINT_VALUE: node element has no currentValue');
            }
            currentValue.set(value);
            return value;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SET_ENDPOINT_VALUE_PARAM',
        description: 'Sets the current value of an endpoint node to a static parameter value. ' +
            'Takes 1 input: endpointNode, and a "value" parameter. Returns the value that was set.',
        inputs: [
            { name: 'endpoint', types: ['SpinalNode'], description: 'The endpoint node to update.', required: true },
        ],
        outputType: 'any',
        parameters: [
            { name: 'value', type: 'string', description: 'The value to set (string, number, or boolean)', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            var _d;
            if (!isSpinalNode(input)) {
                throw new Error('SET_ENDPOINT_VALUE_PARAM expects a SpinalNode input');
            }
            const value = params === null || params === void 0 ? void 0 : params.value;
            if (value === undefined) {
                throw new Error('SET_ENDPOINT_VALUE_PARAM requires a "value" parameter');
            }
            const nodeElement = yield ((_d = input.element) === null || _d === void 0 ? void 0 : _d.load());
            if (!nodeElement)
                throw new Error('SET_ENDPOINT_VALUE_PARAM: node has no element to load');
            const currentValue = nodeElement.currentValue;
            if (currentValue === undefined) {
                throw new Error('SET_ENDPOINT_VALUE_PARAM: node element has no currentValue');
            }
            currentValue.set(value);
            return value;
        }),
    }),
];
//# sourceMappingURL=node.algorithms.js.map