"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toWorkNodes = void 0;
const WorkflowExecutionService_1 = require("./WorkflowExecutionService");
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
function toWorkNodes(output) {
    if (output === null || output === undefined)
        return [];
    const items = Array.isArray(output) ? output.flat(Infinity) : [output];
    const seen = new Set();
    const workNodes = [];
    for (const item of items) {
        if (item === null || item === undefined)
            continue;
        if (!item || typeof item.getId !== 'function') {
            throw new Error(`The work node resolver must output nodes (a node or a list of nodes), got ${(0, WorkflowExecutionService_1.describeValue)(item)}` +
                `${Array.isArray(output) ? ' in its list' : ''}`);
        }
        const id = item.getId().get();
        if (seen.has(id))
            continue;
        seen.add(id);
        workNodes.push(item);
    }
    return workNodes;
}
exports.toWorkNodes = toWorkNodes;
//# sourceMappingURL=workNodes.js.map