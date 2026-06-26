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
            // Resolve the ticket context (workflow) by name → first match.
            const context = yield ticketService.getContexts(contextName);
            if (!context || typeof context.getId !== 'function') {
                throw new Error(`CREATE_TICKET: ticket context (workflow) "${contextName}" not found`);
            }
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(context);
            const contextId = context.getId().get();
            // Resolve the process (domain) by name within the context → first match.
            const processes = yield ticketService.getAllProcess(contextId);
            const process = processes.find((p) => { var _a, _b; return ((_b = (_a = p === null || p === void 0 ? void 0 : p.name) === null || _a === void 0 ? void 0 : _a.get) === null || _b === void 0 ? void 0 : _b.call(_a)) === processName; });
            if (!process) {
                throw new Error(`CREATE_TICKET: process (domain) "${processName}" not found in workflow "${contextName}"`);
            }
            const processId = process.id.get();
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
];
//# sourceMappingURL=ticket.algorithms.js.map