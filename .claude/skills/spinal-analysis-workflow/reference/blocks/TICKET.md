<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->
# Tickets (TICKET)

Create tickets and move them through their process.

## CREATE_TICKET

Create Ticket · French label in the builder: « Créer un ticket »

`CREATE_TICKET(node: SpinalNode, ticket?: string | number | object) → SpinalNode`

Creates a ticket attached to the input node, under a ticket context (a.k.a. workflow) → process (a.k.a. domain) resolved by name from the parameters. The ticket lands in the process's first step automatically. Returns the ticket node (chainable into MOVE_TICKET_TO_NEXT_STEP). Resolution is by name — the first matching context, then the first matching process within it, are used. Wire a second input to give the ticket from data: a name, or an object such as a row of GET_EXCEL_ROWS — its "name", "priority", "description" and "declarer_id" keys are the ticket's fields (they override the parameters) and every other key becomes a ticket attribute. Analytics run again on every trigger: set "ifExists" to "reuse" so a ticket is created only once.

Inputs, in this order:
1. `node` (SpinalNode) — The node the ticket is attached to (e.g. the work node / equipment / room the ticket concerns).
2. `ticket` (string | number | object, optional) — Optional: the ticket name, or an object of ticket fields and attributes (e.g. a row of GET_EXCEL_ROWS read with columns "Nom=name, Priorité=priority").

Parameters:
- `contextName` (string, required) — Name of the ticket context (a.k.a. workflow) the ticket belongs to.
- `processName` (string, required) — Name of the process (a.k.a. domain) within the context. The ticket is created in this process's first step.
- `name` (string, optional) — The ticket name / title (unless the ticket input gives one).
- `priority` (number, optional, one of 0, 1, 2) — Optional ticket priority: 0 (occasionally), 1 (normal) or 2 (urgent).
- `description` (string, optional) — Optional ticket description.
- `ticketType` (string, optional, one of "Ticket", "Alarm", default "Ticket") — Optional ticket type — "Ticket" (default) or "Alarm".
- `attributesCategory` (string, optional, default "default") — Attribute category for the extra keys of the ticket input. Default "default": the ticket's own category, where the ticket service keeps its name, priority, description, step, …
- `ifExists` (string, optional, one of "allow", "reuse", "error", default "allow") — When the node already has a ticket with the same name in this process (in any step, the archive included): "allow" (default — create another one), "reuse" (return it, unchanged) or "error".

## GET_TICKETS_FROM_NODE

Get Node Tickets · French label in the builder: « Tickets d'un nœud »

`GET_TICKETS_FROM_NODE(node: SpinalNode) → SpinalNode[]`

Returns the ticket nodes attached to the input node as a SpinalNode array (empty if none). Use it to avoid duplicates — e.g. CREATE_TICKET only when this list is empty. Composes with the node blocks (FIRST_NODE, FILTER_NODE, GET_ATTRIBUTE, …); feed a ticket node to MOVE_TICKET_TO_NEXT_STEP.

Inputs, in this order:
1. `node` (SpinalNode) — The node whose attached tickets to list.

Parameters: none.

## MOVE_TICKET_TO_NEXT_STEP

Move Ticket to Next Step · French label in the builder: « Passer le ticket à l'étape suivante »

`MOVE_TICKET_TO_NEXT_STEP(ticket: SpinalNode) → SpinalNode`

Advances a ticket to the next step of its process. Takes the ticket NODE as input (e.g. an element of GET_TICKETS_FROM_NODE). The context (workflow) is resolved by name from the parameter; the process is derived from the ticket. Returns the (unchanged) ticket node for chaining. Moving past the last step is a no-op.

Inputs, in this order:
1. `ticket` (SpinalNode) — The ticket node to advance (type must be "SpinalSystemServiceTicketTypeTicket").

Parameters:
- `contextName` (string, required) — Name of the ticket context (a.k.a. workflow) the ticket belongs to.
