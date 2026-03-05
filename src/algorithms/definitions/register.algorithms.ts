/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AlgorithmDefinition,
    AlgorithmRunResult,
    createAlgorithm,
} from './core';

/**
 * Algorithms used by the DAG execution engine for:
 * - Bridging the execution context into the DAG (CURRENT_NODE)
 * - Registering named variables in the input workflow (SET_INPUT_REGISTER)
 * - Fetching named variables in the execution workflow (FETCH_INPUT_REGISTER)
 * - Source block for FOREACH sub-workflows (ELEMENT)
 * - Higher-order iteration block (FOREACH)
 *
 * Some of these (ELEMENT, FOREACH, FETCH_INPUT_REGISTER) are handled specially
 * by the DAG executor and their run() is never called directly.
 */
export const REGISTER_ALGORITHMS: AlgorithmDefinition[] = [
    createAlgorithm({
        name: 'CURRENT_NODE',
        description:
            'Returns the current work node from the execution context. ' +
            'Used as a root/source block in workflows to inject the work node into the DAG.',
        inputTypes: [],
        outputType: 'SpinalNode',
        parameters: [],
        run: async (_input, _params, context): AlgorithmRunResult => {
            if (!context?.selfNode) {
                throw new Error('CURRENT_NODE: no work node available in execution context');
            }
            return context.selfNode;
        },
    }),

    createAlgorithm({
        name: 'SET_INPUT_REGISTER',
        description:
            'Passes through the input value unchanged. The DAG executor uses the block\'s ' +
            'registerAs property to store this value as a named variable (e.g., I0, I1) ' +
            'for later use in the execution workflow.',
        inputTypes: ['any'],
        outputType: 'any',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            // Pass through — the executor handles registration via block.registerAs
            if (Array.isArray(input)) {
                return input.length > 0 ? (input[0] as any) : undefined;
            }
            return input as any;
        },
    }),

    createAlgorithm({
        name: 'FETCH_INPUT_REGISTER',
        description:
            'Fetches a named input variable (e.g., I0, I1) that was set during the input workflow. ' +
            'Handled by the DAG executor — the run() function is never called directly.',
        inputTypes: [],
        outputType: 'any',
        parameters: [
            {
                name: 'registerName',
                type: 'string',
                description: 'Name of the register to fetch (e.g., I0)',
                required: true,
            },
        ],
        run: async (): AlgorithmRunResult => {
            throw new Error(
                'FETCH_INPUT_REGISTER is handled by the DAG executor, not called directly'
            );
        },
    }),

    createAlgorithm({
        name: 'ELEMENT',
        description:
            'Source block for FOREACH sub-workflows. Injects the current array element. ' +
            'The DAG executor provides the value — this run() is never called directly.',
        inputTypes: [],
        outputType: 'any',
        parameters: [],
        run: async (): AlgorithmRunResult => {
            throw new Error(
                'ELEMENT block is handled by the DAG executor, not called directly'
            );
        },
    }),

    createAlgorithm({
        name: 'FOREACH',
        description:
            'Higher-order block that takes an array input and executes a sub-workflow ' +
            'on each element. Results are collected into an output array. ' +
            'The sub-workflow must contain an ELEMENT block as the element source. ' +
            'Handled by the DAG executor — this run() is never called directly.',
        inputTypes: ['any[]'],
        outputType: 'any[]',
        parameters: [],
        run: async (): AlgorithmRunResult => {
            throw new Error(
                'FOREACH is handled by the DAG executor, not called directly'
            );
        },
    }),
];
