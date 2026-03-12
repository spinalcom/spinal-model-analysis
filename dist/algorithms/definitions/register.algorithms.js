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
exports.REGISTER_ALGORITHMS = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const core_1 = require("./core");
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
exports.REGISTER_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'CURRENT_NODE',
        description: 'Returns the current work node from the execution context. ' +
            'Used as a root/source block in workflows to inject the work node into the DAG.',
        inputTypes: [],
        outputType: 'SpinalNode',
        parameters: [],
        run: (_input, _params, context) => __awaiter(void 0, void 0, void 0, function* () {
            if (!(context === null || context === void 0 ? void 0 : context.selfNode)) {
                throw new Error('CURRENT_NODE: no work node available in execution context');
            }
            return context.selfNode;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SET_INPUT_REGISTER',
        description: 'Passes through the input value unchanged. The DAG executor uses the block\'s ' +
            'registerAs property to store this value as a named variable (e.g., I0, I1) ' +
            'for later use in the execution workflow.',
        inputTypes: ['any'],
        outputType: 'any',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            // Pass through unchanged — the executor handles registration via block.registerAs
            return input;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'FETCH_INPUT_REGISTER',
        description: 'Fetches a named input variable (e.g., I0, I1) that was set during the input workflow. ' +
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
        run: () => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('FETCH_INPUT_REGISTER is handled by the DAG executor, not called directly');
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'ELEMENT',
        description: 'Source block for FOREACH sub-workflows. Injects the current array element. ' +
            'The DAG executor provides the value — this run() is never called directly.',
        inputTypes: [],
        outputType: 'any',
        parameters: [],
        run: () => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('ELEMENT block is handled by the DAG executor, not called directly');
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'FOREACH',
        description: 'Higher-order block that takes an array input and executes a sub-workflow ' +
            'on each element. Results are collected into an output array. ' +
            'The sub-workflow must contain an ELEMENT block as the element source. ' +
            'Handled by the DAG executor — this run() is never called directly.',
        inputTypes: ['any[]'],
        outputType: 'any[]',
        parameters: [],
        run: () => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('FOREACH is handled by the DAG executor, not called directly');
        }),
    }),
];
//# sourceMappingURL=register.algorithms.js.map