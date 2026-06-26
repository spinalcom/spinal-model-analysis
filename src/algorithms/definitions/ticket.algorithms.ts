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

export const TICKET_ALGORITHMS: AlgorithmDefinition[] = [
    createAlgorithm({
        name: 'CREATE_TICKET',
        description:
            'Creates a ticket attached to the input node, under a ticket context (a.k.a. workflow) → ' +
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


            // Resolve the ticket context (workflow) by name → first match.
            const context = await ticketService.getContexts(contextName);
            if (!context || typeof (context as any).getId !== 'function') {
                throw new Error(`CREATE_TICKET: ticket context (workflow) "${contextName}" not found`);
            }
            SpinalGraphService._addNode(context as any);
            const contextId: string = (context as any).getId().get();

            // Resolve the process (domain) by name within the context → first match.
            const processes = await ticketService.getAllProcess(contextId);
            const process = processes.find((p: any) => p?.name?.get?.() === processName);
            if (!process) {
                throw new Error(
                    `CREATE_TICKET: process (domain) "${processName}" not found in workflow "${contextName}"`
                );
            }
            const processId: string = (process as any).id.get();

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
            return ticketId;
        },
    }),
];
