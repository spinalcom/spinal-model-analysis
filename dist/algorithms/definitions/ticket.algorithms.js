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
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const core_1 = require("./core");
const utils_1 = require("../../services/utils");
const concurrency_1 = require("../../services/concurrency");
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
/** Node type of an individual ticket (matches spinal-service-ticket's SPINAL_TICKET_SERVICE_TICKET_TYPE). */
const TICKET_NODE_TYPE = 'SpinalSystemServiceTicketTypeTicket';
/**
 * Relation from a host node to its tickets (matches SPINAL_TICKET_SERVICE_TICKET_RELATION_NAME) —
 * also the relation from a step to its tickets.
 */
const TICKET_RELATION_NAME = 'SpinalSystemServiceTicketHasTicket';
/** Relation from a host node to its alarms (matches spinal-service-ticket's ALARM_RELATION_NAME). */
const ALARM_RELATION_NAME = 'hasAlarm';
/** Node type of a process step, and the relation from a process to its steps. */
const STEP_NODE_TYPE = 'SpinalSystemServiceTicketTypeStep';
const STEP_RELATION_NAME = 'SpinalSystemServiceTicketHasStep';
/** The attribute category where the ticket service stores a ticket's own information. */
const TICKET_INFO_CATEGORY = 'default';
/** The ticket's own fields in a ticket input; any other key is an extra attribute. */
const TICKET_FIELDS = new Set(['name', 'priority', 'description', 'declarer_id']);
/** Keys the ticket service writes itself in the ticket's category ("user" feeds its creation log). */
const SERVICE_KEYS = new Set(['processId', 'stepId', 'contextId', 'creationDate', 'user']);
/** Present in a ticket input: null, undefined and blank text count as absent. */
const isPresent = (value) => value !== null && value !== undefined && !(typeof value === 'string' && value.trim() === '');
/** The ticket input as fields: a name, or an object of fields and attributes (e.g. a GET_EXCEL_ROWS row). */
function readTicketInput(value) {
    if (value === null || value === undefined)
        return {};
    if (typeof value === 'number')
        return { name: value };
    if (typeof value === 'string') {
        if (value.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(value);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
                    return parsed;
            }
            catch (_a) {
                // Not JSON: it is a name that starts with "{".
            }
        }
        return { name: value };
    }
    if (typeof value === 'object' && !Array.isArray(value) && !isSpinalNode(value) && !(value instanceof Date)) {
        return value;
    }
    throw new Error(`CREATE_TICKET: the ticket input must be a name, or an object of ticket fields (e.g. an Excel row), got ` +
        `${Array.isArray(value) ? 'a list' : isSpinalNode(value) ? 'a node' : typeof value}`);
}
/** A ticket priority as the BOS knows it: 0, 1 or 2 (a numeric string is fine). */
function resolvePriority(raw) {
    if (!isPresent(raw))
        return undefined;
    const priority = typeof raw === 'number' ? raw : Number(String(raw).trim());
    if (priority !== 0 && priority !== 1 && priority !== 2) {
        throw new Error(`CREATE_TICKET: priority must be 0 (occasionally), 1 (normal) or 2 (urgent), got ${JSON.stringify(raw)}`);
    }
    return priority;
}
const resolveIfExists = (raw) => {
    if (raw === undefined || raw === null || raw === '')
        return 'allow';
    const policy = String(raw).trim().toLowerCase();
    if (policy === 'allow' || policy === 'reuse' || policy === 'error')
        return policy;
    throw new Error(`CREATE_TICKET: "ifExists" must be "allow", "reuse" or "error", got ${JSON.stringify(raw)}`);
};
/** The target's ticket with this name in a step of this process — any step, the archive included. */
function findTicket(target, relationName, name, processId) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const ticket of (yield target.getChildren([relationName]))) {
            if (ticket.getType().get() !== TICKET_NODE_TYPE || ticket.getName().get() !== name)
                continue;
            // A ticket's parents through the ticket relation are its step and the node(s) it is attached to.
            for (const step of (yield ticket.getParents([TICKET_RELATION_NAME]))) {
                if (step.getType().get() !== STEP_NODE_TYPE)
                    continue;
                const processes = (yield step.getParents([STEP_RELATION_NAME]));
                if (processes.some((process) => process.getId().get() === processId))
                    return ticket;
            }
        }
        return undefined;
    });
}
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
            "process's first step automatically. Returns the ticket node (chainable into " +
            'MOVE_TICKET_TO_NEXT_STEP). Resolution is by name — the first matching context, then the ' +
            'first matching process within it, are used. Wire a second input to give the ticket from ' +
            'data: a name, or an object such as a row of GET_EXCEL_ROWS — its "name", "priority", ' +
            '"description" and "declarer_id" keys are the ticket\'s fields (they override the ' +
            'parameters) and every other key becomes a ticket attribute. Analytics run again on every ' +
            'trigger: set "ifExists" to "reuse" so a ticket is created only once.',
        inputs: [
            { name: 'node', types: ['SpinalNode'], description: 'The node the ticket is attached to (e.g. the work node / equipment / room the ticket concerns).', required: true },
            { name: 'ticket', types: ['string', 'number', 'object'], description: 'Optional: the ticket name, or an object of ticket fields and attributes (e.g. a row of GET_EXCEL_ROWS read with columns "Nom=name, Priorité=priority").', required: false },
        ],
        outputType: 'SpinalNode',
        parameters: [
            { name: 'contextName', type: 'string', description: 'Name of the ticket context (a.k.a. workflow) the ticket belongs to.', required: true },
            { name: 'processName', type: 'string', description: "Name of the process (a.k.a. domain) within the context. The ticket is created in this process's first step.", required: true },
            { name: 'name', type: 'string', description: 'The ticket name / title (unless the ticket input gives one).', required: false },
            { name: 'priority', type: 'number', description: 'Optional ticket priority: 0 (occasionally), 1 (normal) or 2 (urgent).', options: [0, 1, 2], required: false },
            { name: 'description', type: 'string', description: 'Optional ticket description.', required: false },
            { name: 'ticketType', type: 'string', description: 'Optional ticket type — "Ticket" (default) or "Alarm".', options: ['Ticket', 'Alarm'], default: 'Ticket', required: false },
            {
                name: 'attributesCategory',
                type: 'string',
                description: 'Attribute category for the extra keys of the ticket input. Default "default": the ticket\'s own ' +
                    'category, where the ticket service keeps its name, priority, description, step, …',
                default: 'default',
                required: false,
            },
            {
                name: 'ifExists',
                type: 'string',
                description: 'When the node already has a ticket with the same name in this process (in any step, the ' +
                    'archive included): "allow" (default — create another one), "reuse" (return it, unchanged) or "error".',
                options: ['allow', 'reuse', 'error'],
                default: 'allow',
                required: false,
            },
        ],
        run: (input, params, runContext) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            // One wired input → the node; two → [node, ticket]. A ticket input is never a node, which is
            // what tells the pair apart from a list of nodes wired alone.
            const wired = (_a = runContext === null || runContext === void 0 ? void 0 : runContext.inputCount) !== null && _a !== void 0 ? _a : (Array.isArray(input) && input.length === 2 && isSpinalNode(input[0]) && !isSpinalNode(input[1]) ? 2 : 1);
            if (wired > 2)
                throw new Error('CREATE_TICKET takes at most 2 inputs: [node, ticket]');
            const [target, ticketInput] = wired === 2 && Array.isArray(input) ? input : [input];
            if (Array.isArray(target)) {
                throw new Error('CREATE_TICKET expects ONE node, got a list — wrap it in a FOREACH to create one ticket per node');
            }
            if (!isSpinalNode(target)) {
                throw new Error('CREATE_TICKET expects a SpinalNode input (the node the ticket is attached to)');
            }
            const contextName = params === null || params === void 0 ? void 0 : params.contextName;
            const processName = params === null || params === void 0 ? void 0 : params.processName;
            if (typeof contextName !== 'string' || contextName.trim() === '') {
                throw new Error('CREATE_TICKET requires a non-empty "contextName" parameter');
            }
            if (typeof processName !== 'string' || processName.trim() === '') {
                throw new Error('CREATE_TICKET requires a non-empty "processName" parameter');
            }
            const fields = readTicketInput(ticketInput);
            const nameSource = [fields.name, params === null || params === void 0 ? void 0 : params.name].find(isPresent);
            const ticketName = nameSource === undefined ? '' : (0, utils_1.toAttributeText)(nameSource).trim();
            if (!ticketName) {
                throw new Error('CREATE_TICKET needs a name: set the "name" parameter, or wire a name — or an object with a ' +
                    '"name" key, e.g. an Excel row read with columns "Nom=name"');
            }
            const priority = resolvePriority(isPresent(fields.priority) ? fields.priority : params === null || params === void 0 ? void 0 : params.priority);
            const description = [fields.description, params === null || params === void 0 ? void 0 : params.description].find(isPresent);
            const ifExists = resolveIfExists(params === null || params === void 0 ? void 0 : params.ifExists);
            const attributesCategory = (typeof (params === null || params === void 0 ? void 0 : params.attributesCategory) === 'string' ? params.attributesCategory.trim() : '') || TICKET_INFO_CATEGORY;
            // Build the ticket info (the service stores it as attributes of the ticket's own category).
            const ticketInfo = { name: ticketName };
            if (priority !== undefined)
                ticketInfo.priority = priority;
            if (description !== undefined)
                ticketInfo.description = (0, utils_1.toAttributeText)(description);
            if (isPresent(fields.declarer_id))
                ticketInfo.declarer_id = (0, utils_1.toAttributeText)(fields.declarer_id);
            const extraAttributes = {};
            for (const [key, value] of Object.entries(fields)) {
                if (TICKET_FIELDS.has(key) || !key.trim() || !isPresent(value))
                    continue;
                extraAttributes[key] = (0, utils_1.toAttributeText)(value);
            }
            if (attributesCategory === TICKET_INFO_CATEGORY) {
                const clashing = Object.keys(extraAttributes).filter((key) => SERVICE_KEYS.has(key));
                if (clashing.length > 0) {
                    throw new Error(`CREATE_TICKET: ${clashing.map((key) => `"${key}"`).join(', ')} is written by the ticket service ` +
                        'itself — rename that column, or put the extra attributes in another "attributesCategory"');
                }
                Object.assign(ticketInfo, extraAttributes);
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
            const ticketType = typeof (params === null || params === void 0 ? void 0 : params.ticketType) === 'string' && params.ticketType.trim() !== ''
                ? params.ticketType
                : 'Ticket';
            // The target node should already be in the graph service (it's a resolved
            // work node), but _addNode is idempotent and guards getRealNode lookups.
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(target);
            const targetId = target.getId().get();
            // The service drops the ticket into the process's first step.
            const create = () => __awaiter(void 0, void 0, void 0, function* () {
                const ticketId = yield ticketService.addTicket(Object.assign({}, ticketInfo), processId, contextId, targetId, ticketType);
                // addTicket registers the ticket node (graphServiceAddNode), so it's resolvable here.
                const ticketNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(ticketId);
                if (!ticketNode) {
                    throw new Error(`CREATE_TICKET: ticket "${ticketId}" was created but could not be resolved as a node`);
                }
                if (attributesCategory !== TICKET_INFO_CATEGORY && Object.keys(extraAttributes).length > 0) {
                    yield spinal_env_viewer_plugin_documentation_service_1.attributeService.createOrUpdateAttrsAndCategories(ticketNode, attributesCategory, extraAttributes);
                }
                return ticketNode;
            });
            if (ifExists === 'allow')
                return create();
            // Get-or-create, serialized per (node, process, name) so parallel FOREACH iterations
            // cannot both miss the lookup and create the ticket twice.
            const relationName = ticketType === 'Alarm' ? ALARM_RELATION_NAME : TICKET_RELATION_NAME;
            return (0, concurrency_1.withKeyLock)(`ticket|${targetId}|${processId}|${relationName}|${ticketName}`, () => __awaiter(void 0, void 0, void 0, function* () {
                const existing = yield findTicket(target, relationName, ticketName, processId);
                if (!existing)
                    return create();
                if (ifExists === 'error') {
                    throw new Error(`CREATE_TICKET: "${target.getName().get()}" already has a ticket "${ticketName}" in process "${processName}"`);
                }
                spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(existing);
                return existing;
            }));
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_TICKETS_FROM_NODE',
        description: 'Returns the ticket nodes attached to the input node as a SpinalNode array (empty if none). ' +
            'Use it to avoid duplicates — e.g. CREATE_TICKET only when this list is empty. Composes with ' +
            'the node blocks (FIRST_NODE, FILTER_NODE, GET_ATTRIBUTE, …); feed a ticket node to ' +
            'MOVE_TICKET_TO_NEXT_STEP.',
        inputs: [
            { name: 'node', types: ['SpinalNode'], description: 'The node whose attached tickets to list.', required: true },
        ],
        outputType: 'SpinalNode[]',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isSpinalNode(input)) {
                throw new Error('GET_TICKETS_FROM_NODE expects a SpinalNode input (the node whose tickets to list)');
            }
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(input);
            // Tickets hang off the node via the ticket relation — pure node traversal, no ticket service.
            const tickets = (yield input.getChildren([TICKET_RELATION_NAME]));
            // Register each ticket so a downstream MOVE_TICKET_TO_NEXT_STEP can resolve it.
            tickets.forEach((t) => spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(t));
            return tickets;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'MOVE_TICKET_TO_NEXT_STEP',
        description: 'Advances a ticket to the next step of its process. Takes the ticket NODE as input (e.g. an ' +
            'element of GET_TICKETS_FROM_NODE). The context (workflow) is resolved by name from the ' +
            'parameter; the process is derived from the ticket. Returns the (unchanged) ticket node for ' +
            'chaining. Moving past the last step is a no-op.',
        inputs: [
            { name: 'ticket', types: ['SpinalNode'], description: `The ticket node to advance (type must be "${TICKET_NODE_TYPE}").`, required: true },
        ],
        outputType: 'SpinalNode',
        parameters: [
            { name: 'contextName', type: 'string', description: 'Name of the ticket context (a.k.a. workflow) the ticket belongs to.', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isSpinalNode(input)) {
                throw new Error('MOVE_TICKET_TO_NEXT_STEP expects a SpinalNode input (the ticket node to advance)');
            }
            const nodeType = input.getType().get();
            if (nodeType !== TICKET_NODE_TYPE) {
                throw new Error(`MOVE_TICKET_TO_NEXT_STEP expects a ticket node (type "${TICKET_NODE_TYPE}") but got "${nodeType}"`);
            }
            const contextName = params === null || params === void 0 ? void 0 : params.contextName;
            if (typeof contextName !== 'string' || contextName.trim() === '') {
                throw new Error('MOVE_TICKET_TO_NEXT_STEP requires a non-empty "contextName" parameter');
            }
            const ticketService = getTicketService();
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(input);
            const ticketId = input.getId().get();
            // Resolve + register the context (by name) and the process (derived from the ticket),
            // so the service's getRealNode lookups for all three nodes succeed.
            const context = resolveTicketContext(contextName, 'MOVE_TICKET_TO_NEXT_STEP');
            const contextId = context.getId().get();
            const processNode = (yield ticketService.getTicketProcess(ticketId));
            const processId = processNode.getId().get();
            yield ticketService.moveTicketToNextStep(contextId, processId, ticketId);
            return input;
        }),
    }),
];
//# sourceMappingURL=ticket.algorithms.js.map