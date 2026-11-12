import { SpinalNode } from 'spinal-env-viewer-graph-service';
/**
 * The work nodes a work node resolver produced, from the output of its last block.
 *
 * - Lists are flattened: a FOREACH returns one result per element, so a resolver ending with a
 *   FOREACH over steps that reads their tickets gives a list of lists.
 * - A node appearing several times is kept once — otherwise it would run (and be bound) twice.
 * - Nothing (null / undefined, or null entries such as an IF without an "else" inside a FOREACH)
 *   means no work node — never the anchor node instead.
 * - Anything else that isn't a node is an error: every block that reads $node would fail on it.
 */
export declare function toWorkNodes(output: unknown): SpinalNode<any>[];
