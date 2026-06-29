/* eslint-disable @typescript-eslint/no-explicit-any */
import { SpinalNode, SpinalGraphService } from 'spinal-env-viewer-graph-service';
import {
    AlgorithmDefinition,
    AlgorithmRunResult,
    createAlgorithm,
} from './core';

const isSpinalNode = (value: unknown): value is SpinalNode<any> =>
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as SpinalNode<any>).getId === 'function';

/**
 * The ticket service is loaded lazily (inside run) rather than at module load.
 * The algorithm *definitions* are imported by metadata-only consumers (e.g. the
 * api-server's /algorithms route) that never execute ticket blocks; they shouldn't
 * have to pull in the whole ticket graph service. Only execution needs it.
 */
function getTicketService() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return (require('spinal-service-ticket') as typeof import('spinal-service-ticket')).spinalServiceTicket;
}

/** Context type used by spinal-service-ticket for ticket contexts (a.k.a. workflows). */
const TICKET_CONTEXT_TYPE = 'SpinalSystemServiceTicket';
/** Node type of an individual ticket (matches spinal-service-ticket's SPINAL_TICKET_SERVICE_TICKET_TYPE). */
const TICKET_NODE_TYPE = 'SpinalSystemServiceTicketTypeTicket';
/** Relation from a host node to its tickets (matches SPINAL_TICKET_SERVICE_TICKET_RELATION_NAME). */
const TICKET_RELATION_NAME = 'SpinalSystemServiceTicketHasTicket';

/**
 * Resolves a ticket context (workflow) by name and registers it in the graph
 * service. Uses getContextWithType, which is registry-based (unlike getGraph(),
 * which can be undefined here); matching the ticket type also prevents picking up
 * a same-named context of another service. Throws (prefixed with `who`) if missing.
 */
function resolveTicketContext(contextName: string, who: string): SpinalNode<any> {
    const ticketContexts = SpinalGraphService.getContextWithType(
        TICKET_CONTEXT_TYPE
    ) as unknown as SpinalNode<any>[];
    const context = ticketContexts.find((c) => c?.getName?.().get?.() === contextName);
    if (!context || typeof context.getId !== 'function') {
        throw new Error(`${who}: ticket context (workflow) "${contextName}" not found`);
    }
    SpinalGraphService._addNode(context);
    return context;
}

export const TICKET_ALGORITHMS: AlgorithmDefinition[] = [
    createAlgorithm({
        name: 'CREATE_TICKET',
        description:
            'Creates a ticket attached to the input node, under a ticket context (a.k.a. workflow) → ' +
            'process (a.k.a. domain) resolved by name from the parameters. The ticket lands in the ' +
            "process's first step automatically. Returns the new ticket node (chainable into " +
            'MOVE_TICKET_TO_NEXT_STEP). Resolution is by name — the first matching context, then the ' +
            'first matching process within it, are used.',
        inputs: [
            { name: 'node', types: ['SpinalNode'], description: 'The node the ticket is attached to (e.g. the work node / equipment / room the ticket concerns).', required: true },
        ],
        outputType: 'SpinalNode',
        parameters: [
            { name: 'contextName', type: 'string', description: 'Name of the ticket context (a.k.a. workflow) the ticket belongs to.', required: true },
            { name: 'processName', type: 'string', description: "Name of the process (a.k.a. domain) within the context. The ticket is created in this process's first step.", required: true },
            { name: 'name', type: 'string', description: 'The ticket name / title.', required: true },
            { name: 'priority', type: 'number', description: 'Optional ticket priority.', required: false },
            { name: 'ticketType', type: 'string', description: 'Optional ticket type — "Ticket" (default) or "Alarm".', required: false },
        ],
        run: async (input, params): AlgorithmRunResult => {
            if (!isSpinalNode(input)) {
                throw new Error('CREATE_TICKET expects a SpinalNode input (the node the ticket is attached to)');
            }

            const contextName = params?.contextName;
            const processName = params?.processName;
            const ticketName = params?.name;
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
            const contextId: string = context.getId().get();

            // Resolve the process (domain) by name → first match. Processes are the context's
            // children; traverse them directly so we don't depend on getGraph() either.
            const processes = (await context.getChildrenInContext(context as any)) as SpinalNode<any>[];
            const process = processes.find((p) => p?.getName?.().get?.() === processName);
            if (!process) {
                throw new Error(
                    `CREATE_TICKET: process (domain) "${processName}" not found in workflow "${contextName}"`
                );
            }
            SpinalGraphService._addNode(process);
            const processId: string = process.getId().get();

            // Build the ticket info and create it (the service drops it into the first step).
            const ticketInfo: Record<string, any> = { name: ticketName };
            if (typeof params?.priority === 'number') ticketInfo.priority = params.priority;

            const ticketType =
                typeof params?.ticketType === 'string' && params.ticketType.trim() !== ''
                    ? params.ticketType
                    : 'Ticket';

            // The target node should already be in the graph service (it's a resolved
            // work node), but _addNode is idempotent and guards getRealNode lookups.
            SpinalGraphService._addNode(input);

            const ticketId = await ticketService.addTicket(
                ticketInfo,
                processId,
                contextId,
                input.getId().get(),
                ticketType
            );

            // addTicket registers the ticket node (graphServiceAddNode), so it's resolvable here.
            const ticketNode = SpinalGraphService.getRealNode(ticketId) as unknown as SpinalNode<any>;
            if (!ticketNode) {
                throw new Error(`CREATE_TICKET: ticket "${ticketId}" was created but could not be resolved as a node`);
            }
            return ticketNode;
        },
    }),

    createAlgorithm({
        name: 'GET_TICKETS_FROM_NODE',
        description:
            'Returns the ticket nodes attached to the input node as a SpinalNode array (empty if none). ' +
            'Use it to avoid duplicates — e.g. CREATE_TICKET only when this list is empty. Composes with ' +
            'the node blocks (FIRST_NODE, FILTER_NODE, GET_ATTRIBUTE, …); feed a ticket node to ' +
            'MOVE_TICKET_TO_NEXT_STEP.',
        inputs: [
            { name: 'node', types: ['SpinalNode'], description: 'The node whose attached tickets to list.', required: true },
        ],
        outputType: 'SpinalNode[]',
        parameters: [],
        run: async (input): AlgorithmRunResult => {
            if (!isSpinalNode(input)) {
                throw new Error('GET_TICKETS_FROM_NODE expects a SpinalNode input (the node whose tickets to list)');
            }
            SpinalGraphService._addNode(input);
            // Tickets hang off the node via the ticket relation — pure node traversal, no ticket service.
            const tickets = (await input.getChildren([TICKET_RELATION_NAME])) as SpinalNode<any>[];
            // Register each ticket so a downstream MOVE_TICKET_TO_NEXT_STEP can resolve it.
            tickets.forEach((t) => SpinalGraphService._addNode(t));
            return tickets;
        },
    }),

    createAlgorithm({
        name: 'MOVE_TICKET_TO_NEXT_STEP',
        description:
            'Advances a ticket to the next step of its process. Takes the ticket NODE as input (e.g. an ' +
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
        run: async (input, params): AlgorithmRunResult => {
            if (!isSpinalNode(input)) {
                throw new Error('MOVE_TICKET_TO_NEXT_STEP expects a SpinalNode input (the ticket node to advance)');
            }
            const nodeType = input.getType().get();
            if (nodeType !== TICKET_NODE_TYPE) {
                throw new Error(
                    `MOVE_TICKET_TO_NEXT_STEP expects a ticket node (type "${TICKET_NODE_TYPE}") but got "${nodeType}"`
                );
            }
            const contextName = params?.contextName;
            if (typeof contextName !== 'string' || contextName.trim() === '') {
                throw new Error('MOVE_TICKET_TO_NEXT_STEP requires a non-empty "contextName" parameter');
            }

            const ticketService = getTicketService();

            SpinalGraphService._addNode(input);
            const ticketId: string = input.getId().get();

            // Resolve + register the context (by name) and the process (derived from the ticket),
            // so the service's getRealNode lookups for all three nodes succeed.
            const context = resolveTicketContext(contextName, 'MOVE_TICKET_TO_NEXT_STEP');
            const contextId: string = context.getId().get();

            const processNode = (await ticketService.getTicketProcess(ticketId)) as unknown as SpinalNode<any>;
            const processId: string = processNode.getId().get();

            await ticketService.moveTicketToNextStep(contextId, processId, ticketId);
            return input;
        },
    }),
];
