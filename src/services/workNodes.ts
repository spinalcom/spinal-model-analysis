/* eslint-disable @typescript-eslint/no-explicit-any */
import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { describeValue } from './WorkflowExecutionService';

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
export function toWorkNodes(output: unknown): SpinalNode<any>[] {
  if (output === null || output === undefined) return [];
  const items: unknown[] = Array.isArray(output) ? (output as unknown[]).flat(Infinity) : [output];

  const seen = new Set<string>();
  const workNodes: SpinalNode<any>[] = [];
  for (const item of items) {
    if (item === null || item === undefined) continue;
    if (!item || typeof (item as any).getId !== 'function') {
      throw new Error(
        `The work node resolver must output nodes (a node or a list of nodes), got ${describeValue(item)}` +
        `${Array.isArray(output) ? ' in its list' : ''}`
      );
    }
    const id: string = (item as SpinalNode<any>).getId().get();
    if (seen.has(id)) continue;
    seen.add(id);
    workNodes.push(item as SpinalNode<any>);
  }
  return workNodes;
}
