/* eslint-disable @typescript-eslint/no-explicit-any */
import { SpinalNode } from 'spinal-env-viewer-graph-service';
import {
    attributeService,
} from 'spinal-env-viewer-plugin-documentation-service';

import { SpinalAttribute } from 'spinal-models-documentation';
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

export const NODE_ATTRIBUTES_ALGORITHMS: AlgorithmDefinition[] = [
    createAlgorithm({
        name: 'GET_ATTRIBUTE',
        description: 'Gets the value of an attribute from a node by category and label.',
        inputTypes: ['SpinalNode'],
        outputType: 'any',
        parameters: [
            { name: 'categoryName', type: 'string', description: 'The attribute category name', required: true },
            { name: 'label', type: 'string', description: 'The attribute label', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');

            const categoryName = params?.categoryName;
            const label = params?.label;
            if (typeof categoryName !== 'string' || categoryName.length === 0) {
                throw new Error('Invalid or missing categoryName parameter');
            }
            if (typeof label !== 'string' || label.length === 0) {
                throw new Error('Invalid or missing label parameter');
            }

            const attr = await attributeService.findOneAttributeInCategory(input, categoryName);
            if (attr === -1) {
                throw new Error(`Attribute "${label}" not found in category "${categoryName}"`);
            }
            return attr.value?.get();
        },
    }),

    createAlgorithm({
        name: 'SET_ATTRIBUTE',
        description: 'Sets an attribute on a node by category and label. Can create or only update based on the createIfNotExist parameter.',
        inputTypes: ['SpinalNode', 'any'],
        outputType: 'any',
        parameters: [
            { name: 'categoryName', type: 'string', description: 'The attribute category name', required: true },
            { name: 'label', type: 'string', description: 'The attribute label', required: true },
            { name: 'createIfNotExist', type: 'boolean', description: 'If true, creates the attribute if it does not exist. If false, only updates existing attributes (default: true).', required: false },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('SET_ATTRIBUTE expects 2 inputs: [node, value]');
            }
            const node = input[0];
            const value = input[1];
            if (!isSpinalNode(node)) throw new Error('First input must be a SpinalNode');

            const categoryName = params?.categoryName;
            const label = params?.label;
            const createIfNotExist = params?.createIfNotExist !== false && params?.createIfNotExist !== 'false';
            if (typeof categoryName !== 'string' || categoryName.length === 0) {
                throw new Error('Invalid or missing categoryName parameter');
            }
            if (typeof label !== 'string' || label.length === 0) {
                throw new Error('Invalid or missing label parameter');
            }

            if (!createIfNotExist) {
                const attrs = await attributeService.getAttributesByCategory(node, categoryName);
                const existing = attrs.find((a: any) => a.label?.get() === label);
                if (!existing) {
                    throw new Error(`Attribute "${label}" not found in category "${categoryName}" and createIfNotExist is false`);
                }
            }

            await attributeService.createOrUpdateAttrsAndCategories(node, categoryName, { [label]: String(value) });
            return value as any;
        },
    }),

    createAlgorithm({
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
        run: async (input, params): AlgorithmRunResult => {
            if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');

            const categoryName = params?.categoryName;
            const label = params?.label;
            const value = params?.value;
            const createIfNotExist = params?.createIfNotExist !== false && params?.createIfNotExist !== 'false';
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
                const attrs = await attributeService.getAttributesByCategory(input, categoryName);
                const existing = attrs.find((a: any) => a.label?.get() === label);
                if (!existing) {
                    throw new Error(`Attribute "${label}" not found in category "${categoryName}" and createIfNotExist is false`);
                }
            }

            await attributeService.createOrUpdateAttrsAndCategories(input, categoryName, { [label]: String(value) });
            return value as any;
        },
    }),

    createAlgorithm({
        name: 'GET_ALL_ATTRIBUTES',
        description: 'Gets all attributes of a node within a specific category. Returns a string representation.',
        inputTypes: ['SpinalNode'],
        outputType: 'string',
        parameters: [
            { name: 'categoryName', type: 'string', description: 'The attribute category name', required: false },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');

            const categoryName = params?.categoryName;
            if (categoryName !== undefined && (typeof categoryName !== 'string' || categoryName.length === 0)) {
                throw new Error('Invalid or missing categoryName parameter');
            }
            let attrs: SpinalAttribute[];
            if (categoryName) {
                attrs = await attributeService.getAttributesByCategory(input, categoryName);
            } else {
                attrs = await attributeService.getAllAttributes(input);
            }
            const result: Record<string, unknown> = {};
            for (const attr of attrs) {
                const label = attr.label?.get();
                const value = attr.value?.get();
                if (label) result[label] = value;
            }
            return JSON.stringify(result);
        },
    }),

    createAlgorithm({
        name: 'GET_ATTRIBUTE_MODEL',
        description: 'Gets the SpinalAttribute model from a node by category and label. Useful for binding onChange listeners.',
        inputTypes: ['SpinalNode'],
        outputType: 'SpinalAttribute',
        parameters: [
            { name: 'categoryName', type: 'string', description: 'The attribute category name', required: true },
            { name: 'label', type: 'string', description: 'The attribute label', required: true },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');

            const categoryName = params?.categoryName;
            const label = params?.label;
            if (typeof categoryName !== 'string' || categoryName.length === 0) {
                throw new Error('Invalid or missing categoryName parameter');
            }
            if (typeof label !== 'string' || label.length === 0) {
                throw new Error('Invalid or missing label parameter');
            }

            const attrs = await attributeService.getAttributesByCategory(input, categoryName);
            const attr = attrs.find((a: any) => a.label?.get() === label);
            if (!attr) {
                throw new Error(`Attribute "${label}" not found in category "${categoryName}"`);
            }
            return attr;
        },
    }),

    createAlgorithm({
        name: 'GET_ALL_ATTRIBUTE_MODELS',
        description: 'Gets all SpinalAttribute models of a node within a specific category. Useful for binding onChange listeners.',
        inputTypes: ['SpinalNode'],
        outputType: 'SpinalAttribute[]',
        parameters: [
            { name: 'categoryName', type: 'string', description: 'The attribute category name', required: false },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');

            const categoryName = params?.categoryName;
            if (categoryName !== undefined && (typeof categoryName !== 'string' || categoryName.length === 0)) {
                throw new Error('Invalid categoryName parameter');
            }
            let attrs: SpinalAttribute[];
            if (categoryName) {
                attrs = await attributeService.getAttributesByCategory(input, categoryName);
            } else {
                attrs = await attributeService.getAllAttributes(input);
            }
            return attrs;
        },
    }),
];
