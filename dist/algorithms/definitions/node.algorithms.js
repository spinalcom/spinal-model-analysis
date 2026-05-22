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
const core_1 = require("./core");
const isSpinalNode = (value) => {
    return (Boolean(value) &&
        typeof value === 'object' &&
        typeof value.getId === 'function');
};
const isNodeArray = (value) => {
    return Array.isArray(value) && value.every((item) => isSpinalNode(item));
};
exports.NODE_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'FIRST_NODE',
        description: 'Returns the node input, or first node of a node array.',
        inputTypes: ['SpinalNode', 'SpinalNode[]'],
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
        name: 'GET_NODE_SERVER_ID',
        description: 'Returns the ID of a SpinalNode.',
        inputTypes: ['SpinalNode'],
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
        inputTypes: ['SpinalNode'],
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
        inputTypes: ['SpinalNode'],
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
        name: 'FILTER_NODE',
        description: 'Filter Nodes based on specified criteria.',
        inputTypes: ['SpinalNode', 'SpinalNode[]'],
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
        inputTypes: ['SpinalNode', 'SpinalNode[]'],
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
        inputTypes: ['SpinalNode'],
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
        name: 'SET_ENDPOINT_VALUE',
        description: 'Sets the current value of an endpoint node. Takes 2 inputs: [endpointNode, value]. ' +
            'Returns the value that was set.',
        inputTypes: ['SpinalNode', 'any'],
        outputType: 'any',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            var _b;
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('SET_ENDPOINT_VALUE expects 2 inputs: [endpointNode, value]');
            }
            const node = input[0];
            const value = input[1];
            if (!isSpinalNode(node)) {
                throw new Error('SET_ENDPOINT_VALUE: first input must be a SpinalNode');
            }
            const nodeElement = yield ((_b = node.element) === null || _b === void 0 ? void 0 : _b.load());
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
        inputTypes: ['SpinalNode'],
        outputType: 'any',
        parameters: [
            { name: 'value', type: 'string', description: 'The value to set (string, number, or boolean)', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            var _c;
            if (!isSpinalNode(input)) {
                throw new Error('SET_ENDPOINT_VALUE_PARAM expects a SpinalNode input');
            }
            const value = params === null || params === void 0 ? void 0 : params.value;
            if (value === undefined) {
                throw new Error('SET_ENDPOINT_VALUE_PARAM requires a "value" parameter');
            }
            const nodeElement = yield ((_c = input.element) === null || _c === void 0 ? void 0 : _c.load());
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