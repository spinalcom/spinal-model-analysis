import { AlgorithmDefinition } from './core';
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
export declare const REGISTER_ALGORITHMS: AlgorithmDefinition[];
