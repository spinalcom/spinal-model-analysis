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
exports.TICKET_ALGORITHMS = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const core_1 = require("./core");
const isSpinalNode = (value) => Boolean(value) &&
    typeof value === 'object' &&
    typeof value.getId === 'function';
/**
 * The ticket service is loaded lazily (inside run) rather than at module load.
 * The algorithm *definitions* are imported by metadata-only consumers (e.g. the
 * api-server's /algorithms route) that never execute ticket blocks; they shouldn't
 * have to pull in the whole ticket graph service. Only execution needs it.
 */
function getTicketService() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('spinal-service-ticket').spinalServiceTicket;
}
/** Context type used by spinal-service-ticket for ticket contexts (a.k.a. workflows). */
const TICKET_CONTEXT_TYPE = 'SpinalSystemServiceTicket';
/**
 * Resolves a ticket context (workflow) by name and registers it in the graph
 * service. Uses getContextWithType, which is registry-based (unlike getGraph(),
 * which can be undefined here); matching the ticket type also prevents picking up
 * a same-named context of another service. Throws (prefixed with `who`) if missing.
 */
function resolveTicketContext(contextName, who) {
    const ticketContexts = spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType(TICKET_CONTEXT_TYPE);
    const context = ticketContexts.find((c) => { var _a, _b, _c; return ((_c = (_a = c === null || c === void 0 ? void 0 : c.getName) === null || _a === void 0 ? void 0 : (_b = _a.call(c)).get) === null || _c === void 0 ? void 0 : _c.call(_b)) === contextName; });
    if (!context || typeof context.getId !== 'function') {
        throw new Error(`${who}: ticket context (workflow) "${contextName}" not found`);
    }
    spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(context);
    return context;
}
exports.TICKET_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'CREATE_TICKET',
        description: 'Creates a ticket attached to the input node, under a ticket context (a.k.a. workflow) → ' +
            'process (a.k.a. domain) resolved by name from the parameters. The ticket lands in the ' +
            "process's first step automatically. Returns the new ticket id. Resolution is by name — " +
            'the first matching context, then the first matching process within it, are used.',
        inputs: [
            { name: 'node', types: ['SpinalNode'], description: 'The node the ticket is attached to (e.g. the work node / equipment / room the ticket concerns).', required: true },
        ],
        outputType: 'string',
        parameters: [
            { name: 'contextName', type: 'string', description: 'Name of the ticket context (a.k.a. workflow) the ticket belongs to.', required: true },
            { name: 'processName', type: 'string', description: "Name of the process (a.k.a. domain) within the context. The ticket is created in this process's first step.", required: true },
            { name: 'name', type: 'string', description: 'The ticket name / title.', required: true },
            { name: 'priority', type: 'number', description: 'Optional ticket priority.', required: false },
            { name: 'ticketType', type: 'string', description: 'Optional ticket type — "Ticket" (default) or "Alarm".', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isSpinalNode(input)) {
                throw new Error('CREATE_TICKET expects a SpinalNode input (the node the ticket is attached to)');
            }
            const contextName = params === null || params === void 0 ? void 0 : params.contextName;
            const processName = params === null || params === void 0 ? void 0 : params.processName;
            const ticketName = params === null || params === void 0 ? void 0 : params.name;
            if (typeof contextName !== 'string' || contextName.trim() === '') {
                throw new Error('CREATE_TICKET requires a non-empty "contextName" parameter');
            }
            if (typeof processName !== 'string' || processName.trim() === '') {
                throw new Error('CREATE_TICKET requires a non-empty "processName" parameter');
            }
            if (typeof ticketName !== 'string' || ticketName.trim() === '') {
                throw new Error('CREATE_TICKET requires a non-empty "name" parameter');
            }
            const ticketService = getTicketService();
            // Resolve + register the ticket context (workflow) by name.
            const context = resolveTicketContext(contextName, 'CREATE_TICKET');
            const contextId = context.getId().get();
            // Resolve the process (domain) by name → first match. Processes are the context's
            // children; traverse them directly so we don't depend on getGraph() either.
            const processes = (yield context.getChildrenInContext(context));
            const process = processes.find((p) => { var _a, _b, _c; return ((_c = (_a = p === null || p === void 0 ? void 0 : p.getName) === null || _a === void 0 ? void 0 : (_b = _a.call(p)).get) === null || _c === void 0 ? void 0 : _c.call(_b)) === processName; });
            if (!process) {
                throw new Error(`CREATE_TICKET: process (domain) "${processName}" not found in workflow "${contextName}"`);
            }
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(process);
            const processId = process.getId().get();
            // Build the ticket info and create it (the service drops it into the first step).
            const ticketInfo = { name: ticketName };
            if (typeof (params === null || params === void 0 ? void 0 : params.priority) === 'number')
                ticketInfo.priority = params.priority;
            const ticketType = typeof (params === null || params === void 0 ? void 0 : params.ticketType) === 'string' && params.ticketType.trim() !== ''
                ? params.ticketType
                : 'Ticket';
            // The target node should already be in the graph service (it's a resolved
            // work node), but _addNode is idempotent and guards getRealNode lookups.
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(input);
            const ticketId = yield ticketService.addTicket(ticketInfo, processId, contextId, input.getId().get(), ticketType);
            return ticketId;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_TICKETS_FROM_NODE',
        description: 'Returns the tickets attached to the input node as a JSON array string of ticket info ' +
            'objects (id, name, stepId, …). Returns "[]" when the node has no tickets. Use it to avoid ' +
            'duplicates — e.g. CREATE_TICKET only when this list is empty (feed it to LIST_LENGTH and ' +
            'gate on 0). Extract a ticket id with LIST_GET then GET_PROPERTY(…, "id").',
        inputs: [
            { name: 'node', types: ['SpinalNode'], description: 'The node whose attached tickets to list.', required: true },
        ],
        outputType: 'string',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isSpinalNode(input)) {
                throw new Error('GET_TICKETS_FROM_NODE expects a SpinalNode input (the node whose tickets to list)');
            }
            const ticketService = getTicketService();
            // The work node is already registered, but _addNode guards the getRealNode lookup.
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(input);
            const tickets = yield ticketService.getTicketsFromNode(input.getId().get());
            return JSON.stringify(tickets !== null && tickets !== void 0 ? tickets : []);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'MOVE_TICKET_TO_NEXT_STEP',
        description: 'Advances a ticket to the next step of its process. Takes the ticket id as input (e.g. ' +
            "CREATE_TICKET's output, or extracted from GET_TICKETS_FROM_NODE). The context (workflow) is " +
            'resolved by name from the parameter so it is reliably registered; the process is derived ' +
            'from the ticket. Returns the (unchanged) ticket id for chaining. Moving past the last step ' +
            'is a no-op. The ticket must already be loaded — i.e. created this run or obtained via ' +
            'GET_TICKETS_FROM_NODE in the same execution.',
        inputs: [
            { name: 'ticketId', types: ['string'], description: 'The id of the ticket to advance.', required: true },
        ],
        outputType: 'string',
        parameters: [
            { name: 'contextName', type: 'string', description: 'Name of the ticket context (a.k.a. workflow) the ticket belongs to.', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const ticketId = typeof input === 'string' ? input.trim() : '';
            if (ticketId === '') {
                throw new Error('MOVE_TICKET_TO_NEXT_STEP expects a non-empty ticket id string input');
            }
            const contextName = params === null || params === void 0 ? void 0 : params.contextName;
            if (typeof contextName !== 'string' || contextName.trim() === '') {
                throw new Error('MOVE_TICKET_TO_NEXT_STEP requires a non-empty "contextName" parameter');
            }
            const ticketService = getTicketService();
            // The ticket must already be loaded/registered (created this run, or listed via
            // GET_TICKETS_FROM_NODE which registers each ticket). Without it, getRealNode →
            // undefined and the service would throw an opaque error.
            const ticketNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(ticketId);
            if (!ticketNode) {
                throw new Error(`MOVE_TICKET_TO_NEXT_STEP: ticket "${ticketId}" is not loaded — obtain it via ` +
                    'CREATE_TICKET or GET_TICKETS_FROM_NODE in the same execution first');
            }
            // Resolve + register the context (by name) and the process (derived from the ticket),
            // so the service's getRealNode lookups for all three nodes succeed.
            const context = resolveTicketContext(contextName, 'MOVE_TICKET_TO_NEXT_STEP');
            const contextId = context.getId().get();
            const processNode = (yield ticketService.getTicketProcess(ticketId));
            const processId = processNode.getId().get();
            yield ticketService.moveTicketToNextStep(contextId, processId, ticketId);
            return ticketId;
        }),
    }),
];
//# sourceMappingURL=ticket.algorithms.js.map