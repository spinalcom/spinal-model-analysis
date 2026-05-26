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
exports.NODE_ATTRIBUTES_ALGORITHMS = void 0;
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const core_1 = require("./core");
const isSpinalNode = (value) => {
    return (Boolean(value) &&
        typeof value === 'object' &&
        typeof value.getId === 'function');
};
exports.NODE_ATTRIBUTES_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'GET_ATTRIBUTE',
        description: 'Gets the value of an attribute from a node by category and label.',
        inputTypes: ['SpinalNode'],
        outputType: 'any',
        parameters: [
            { name: 'categoryName', type: 'string', description: 'The attribute category name', required: true },
            { name: 'label', type: 'string', description: 'The attribute label', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            if (!isSpinalNode(input))
                throw new Error('Expected SpinalNode input');
            const categoryName = params === null || params === void 0 ? void 0 : params.categoryName;
            const label = params === null || params === void 0 ? void 0 : params.label;
            if (typeof categoryName !== 'string' || categoryName.length === 0) {
                throw new Error('Invalid or missing categoryName parameter');
            }
            if (typeof label !== 'string' || label.length === 0) {
                throw new Error('Invalid or missing label parameter');
            }
            const attr = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.findOneAttributeInCategory(input, categoryName);
            if (attr === -1) {
                throw new Error(`Attribute "${label}" not found in category "${categoryName}"`);
            }
            return (_a = attr.value) === null || _a === void 0 ? void 0 : _a.get();
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SET_ATTRIBUTE',
        description: 'Sets an attribute on a node by category and label. Can create or only update based on the createIfNotExist parameter.',
        inputTypes: ['SpinalNode', 'any'],
        outputType: 'any',
        parameters: [
            { name: 'categoryName', type: 'string', description: 'The attribute category name', required: true },
            { name: 'label', type: 'string', description: 'The attribute label', required: true },
            { name: 'createIfNotExist', type: 'boolean', description: 'If true, creates the attribute if it does not exist. If false, only updates existing attributes (default: true).', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('SET_ATTRIBUTE expects 2 inputs: [node, value]');
            }
            const node = input[0];
            const value = input[1];
            if (!isSpinalNode(node))
                throw new Error('First input must be a SpinalNode');
            const categoryName = params === null || params === void 0 ? void 0 : params.categoryName;
            const label = params === null || params === void 0 ? void 0 : params.label;
            const createIfNotExist = (params === null || params === void 0 ? void 0 : params.createIfNotExist) !== false && (params === null || params === void 0 ? void 0 : params.createIfNotExist) !== 'false';
            if (typeof categoryName !== 'string' || categoryName.length === 0) {
                throw new Error('Invalid or missing categoryName parameter');
            }
            if (typeof label !== 'string' || label.length === 0) {
                throw new Error('Invalid or missing label parameter');
            }
            if (!createIfNotExist) {
                const attrs = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(node, categoryName);
                const existing = attrs.find((a) => { var _a; return ((_a = a.label) === null || _a === void 0 ? void 0 : _a.get()) === label; });
                if (!existing) {
                    throw new Error(`Attribute "${label}" not found in category "${categoryName}" and createIfNotExist is false`);
                }
            }
            yield spinal_env_viewer_plugin_documentation_service_1.attributeService.createOrUpdateAttrsAndCategories(node, categoryName, { [label]: String(value) });
            return value;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SET_ATTRIBUTE_PARAM',
        description: 'Sets an attribute on a node using a static parameter value. Can create or only update based on the createIfNotExist parameter.',
        inputTypes: ['SpinalNode'],
        outputType: 'any',
        parameters: [
            { name: 'categoryName', type: 'string', description: 'The attribute category name', required: true },
            { name: 'label', type: 'string', description: 'The attribute label', required: true },
            { name: 'value', type: 'string', description: 'The value to set', required: true },
            { name: 'createIfNotExist', type: 'boolean', description: 'If true, creates the attribute if it does not exist. If false, only updates existing attributes (default: true).', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isSpinalNode(input))
                throw new Error('Expected SpinalNode input');
            const categoryName = params === null || params === void 0 ? void 0 : params.categoryName;
            const label = params === null || params === void 0 ? void 0 : params.label;
            const value = params === null || params === void 0 ? void 0 : params.value;
            const createIfNotExist = (params === null || params === void 0 ? void 0 : params.createIfNotExist) !== false && (params === null || params === void 0 ? void 0 : params.createIfNotExist) !== 'false';
            if (typeof categoryName !== 'string' || categoryName.length === 0) {
                throw new Error('Invalid or missing categoryName parameter');
            }
            if (typeof label !== 'string' || label.length === 0) {
                throw new Error('Invalid or missing label parameter');
            }
            if (value === undefined) {
                throw new Error('Invalid or missing value parameter');
            }
            if (!createIfNotExist) {
                const attrs = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(input, categoryName);
                const existing = attrs.find((a) => { var _a; return ((_a = a.label) === null || _a === void 0 ? void 0 : _a.get()) === label; });
                if (!existing) {
                    throw new Error(`Attribute "${label}" not found in category "${categoryName}" and createIfNotExist is false`);
                }
            }
            yield spinal_env_viewer_plugin_documentation_service_1.attributeService.createOrUpdateAttrsAndCategories(input, categoryName, { [label]: String(value) });
            return value;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_ALL_ATTRIBUTES',
        description: 'Gets all attributes of a node within a specific category. Returns a string representation.',
        inputTypes: ['SpinalNode'],
        outputType: 'string',
        parameters: [
            { name: 'categoryName', type: 'string', description: 'The attribute category name', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            var _b, _c;
            if (!isSpinalNode(input))
                throw new Error('Expected SpinalNode input');
            const categoryName = params === null || params === void 0 ? void 0 : params.categoryName;
            if (categoryName !== undefined && (typeof categoryName !== 'string' || categoryName.length === 0)) {
                throw new Error('Invalid or missing categoryName parameter');
            }
            let attrs;
            if (categoryName) {
                attrs = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(input, categoryName);
            }
            else {
                attrs = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAllAttributes(input);
            }
            const result = {};
            for (const attr of attrs) {
                const label = (_b = attr.label) === null || _b === void 0 ? void 0 : _b.get();
                const value = (_c = attr.value) === null || _c === void 0 ? void 0 : _c.get();
                if (label)
                    result[label] = value;
            }
            return JSON.stringify(result);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_ATTRIBUTE_MODEL',
        description: 'Gets the SpinalAttribute model from a node by category and label. Useful for binding onChange listeners.',
        inputTypes: ['SpinalNode'],
        outputType: 'SpinalAttribute',
        parameters: [
            { name: 'categoryName', type: 'string', description: 'The attribute category name', required: true },
            { name: 'label', type: 'string', description: 'The attribute label', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isSpinalNode(input))
                throw new Error('Expected SpinalNode input');
            const categoryName = params === null || params === void 0 ? void 0 : params.categoryName;
            const label = params === null || params === void 0 ? void 0 : params.label;
            if (typeof categoryName !== 'string' || categoryName.length === 0) {
                throw new Error('Invalid or missing categoryName parameter');
            }
            if (typeof label !== 'string' || label.length === 0) {
                throw new Error('Invalid or missing label parameter');
            }
            const attrs = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(input, categoryName);
            const attr = attrs.find((a) => { var _a; return ((_a = a.label) === null || _a === void 0 ? void 0 : _a.get()) === label; });
            if (!attr) {
                throw new Error(`Attribute "${label}" not found in category "${categoryName}"`);
            }
            return attr;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_ALL_ATTRIBUTE_MODELS',
        description: 'Gets all SpinalAttribute models of a node within a specific category. Useful for binding onChange listeners.',
        inputTypes: ['SpinalNode'],
        outputType: 'SpinalAttribute[]',
        parameters: [
            { name: 'categoryName', type: 'string', description: 'The attribute category name', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isSpinalNode(input))
                throw new Error('Expected SpinalNode input');
            const categoryName = params === null || params === void 0 ? void 0 : params.categoryName;
            if (categoryName !== undefined && (typeof categoryName !== 'string' || categoryName.length === 0)) {
                throw new Error('Invalid categoryName parameter');
            }
            let attrs;
            if (categoryName) {
                attrs = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(input, categoryName);
            }
            else {
                attrs = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAllAttributes(input);
            }
            return attrs;
        }),
    }),
];
//# sourceMappingURL=node.attributes.algorithms.js.map