---
name: spinal-analysis-workflow
description: Design analytics for a SpinalCom BOS (the spinal-model-analysis module) and load them into the analytics builder web app. Use when the user wants to create, change, explain or debug an analytic / analysis workflow ("analyse", "analytique") — for example "flag the rooms that are too hot", "average the temperature of each floor every hour", "create tickets from an Excel file" — or mentions the analysis module's blocks, triggers, work nodes, or the builder's canvas.
---

# Building a SpinalCom analytic

An analytic is one JSON config. **Write the JSON, validate it, then load it into the builder** — the
builder turns it into blocks and wires on the canvas for the user to review. Do not build a workflow
by clicking blocks and dragging wires in the browser: it is slow, and the builder takes the JSON as is.

## How an analytic runs

1. The **anchor** is one node of the building graph (a building, a floor, a context…), chosen by the user.
2. The **worknodeResolver** runs once, from the anchor, and returns the **work nodes**: the nodes the
   analytic works on (e.g. every room of the floor). Without a resolver the anchor is the only work node.
3. For **each work node**, the **inputWorkflow** runs first (it stores values in named registers), then
   the **executionWorkflow** (it reads, computes, decides and acts).
4. **Triggers** say when all this happens: on a schedule, or when a watched value changes.

In every workflow `$node` is the node it works on: the anchor in the resolver, the current work node
in the other two.

## The config

```json
{
  "contextName": "Confort",
  "analysisName": "Température moyenne par étage",
  "description": "What it does, for the next person.",
  "anchorNodeId": "…",
  "status": "Inactive",
  "triggers": [{ "id": "EveryHour", "type": "CRON", "cronExpression": "0 * * * *" }],
  "worknodeResolver": { "blocks": [ … ] },
  "inputWorkflow": { "blocks": [ … ] },
  "executionWorkflow": { "blocks": [ … ] }
}
```

- `contextName`, `analysisName` — required. The context groups analytics; it is created when missing.
- `anchorNodeId` — the id of the anchor node. Leave it out unless the user gave it: the builder has an
  entity picker for it.
- `status` — `"Inactive"` (default: saved but not running) or `"Active"`. Leave it `Inactive`; the user
  activates it.
- `triggers` — any number of:
  - `{ "type": "INTERVAL_TIME", "intervalTimeMs": 60000 }`
  - `{ "type": "CRON", "cronExpression": "0 * * * *" }`
  - `{ "type": "COV", "inputRegister": "I0", "threshold": 0.5 }` — runs when the value held by that
    register changes (by more than `threshold`, optional). `id` is an optional label on any trigger.
- `errorPolicy` — `"continue"` (default: a failed block skips only what depends on it) or `"stop"`.
- `concurrency` — `{ "mode": "BOUNDED", "limit": 10 }` (default), `"FULL"` or `"SEQUENTIAL"`: how many
  work nodes run at once.
- The three workflows are optional; an analytic that does something has an `executionWorkflow`.

### A block

```json
{ "ref": "Too hot", "algorithmName": "GREATER_THAN", "inputs": ["Temperature"], "parameters": { "threshold": 26 } }
```

- `ref` — the block's name: unique in its workflow, and what other blocks wire to. It is shown on the
  canvas and in the execution results, so write it for a human ("Rooms with a sensor", not "b3").
- `algorithmName` — a block of the reference, exactly.
- `inputs` — refs, **in the order of the block's inputs**: `"inputs": ["Sensor", "Point"]` wires `Sensor`
  to the first input and `Point` to the second. Besides refs of the same workflow, a ref can be `$node`,
  or the `itemRef` of an enclosing FOREACH / FILTER.
- `parameters` — static settings, by exact name. Numbers as numbers, booleans as booleans.
- `after` — refs that must run before this block when no data flows between them (rare).

A block whose name ends in `_PARAM` takes its value from a parameter; the same name without it takes
the value from a wire (SET_ATTRIBUTE_PARAM writes a fixed text, SET_ATTRIBUTE writes a computed value).

### Loops and conditions

```json
{ "ref": "Temperatures", "algorithmName": "FOREACH", "inputs": ["Rooms"], "itemRef": "room",
  "subWorkflow": { "outputRef": "Temperature", "blocks": [
    { "ref": "Sensor", "algorithmName": "GET_NODE_CHILD", "inputs": ["room"], "parameters": { "regex": "^hasBmsEndpoint$", "regexFilter": "Temp" } },
    { "ref": "Temperature", "algorithmName": "ENDPOINT_NODE_CURRENT_VALUE", "inputs": ["Sensor"] }
  ] } }
```

- **FOREACH** runs `subWorkflow` once per element of its input list. Inside, the element is wired by
  its `itemRef`. The block outputs the list of what the `outputRef` block returned, in input order.
- **FILTER** is the same shape, but `outputRef` must return a boolean: the output is the input elements
  for which it was true.
- **IF** takes the condition as its first input and has `thenWorkflow` and/or `elseWorkflow`, each
  `{ "outputRef": …, "blocks": [ … ] }`. Leave out a branch that does nothing — never an empty one.
- Blocks inside a container can wire to any block outside it and to the `itemRef` of every enclosing
  loop. An `itemRef` must differ from every block ref. Containers nest.

### Registers (inputWorkflow)

A block with `"registerAs": "I0"` in the inputWorkflow stores its input under that name (use
SET_INPUT_REGISTER for it). The executionWorkflow reads it with FETCH_INPUT_REGISTER
(`"parameters": { "registerName": "I0" }`). They exist for COV triggers — the trigger watches the
register — so an analytic on a schedule usually needs no inputWorkflow: read from `$node` directly.
A COV register must hold a **value model**, not a value: wire ENDPOINT_NODE_CURRENT_VALUE_MODEL or
GET_ATTRIBUTE_MODEL into it.

## Method

1. **Pin down the need**: what starts it, which nodes it works on, what it reads, what it decides,
   what it writes. Ask when one of these is unclear — do not fill the gap with a guess.
2. **Learn the building's vocabulary** (next section). Relation names, node types, endpoint names,
   attribute categories and labels are data, different in every building.
3. **Choose the blocks.** Read `reference/blocks.md` (one line per block), then the
   `reference/blocks/<CATEGORY>.md` of the blocks you will use, for their exact inputs and parameters.
   `reference/examples/` holds three analytics that are tested to run; start from the closest.
4. **Write the config** to a file.
5. **Validate**: `node scripts/validate.cjs <file.json>` (path relative to this skill). It runs the
   module's own checks — the ones the builder runs on save — and adds warnings for mistakes that only
   show at run time. Fix every error; read every warning. If the module is not on this machine, skip
   this: the builder lists the same errors when saving.
6. **Load it into the builder**, let the user look at it, then save (below).
7. **Report**: what it does in one or two sentences, what you assumed, and what it will write.

## The building's vocabulary

Never invent a relation name, a node type, an endpoint name or an attribute. Ask the user, read it in
the builder (the entity picker and the BOS show the tree), or add a LOG block and run once.

Names that are the same in every SpinalCom BOS:

- Spatial tree — relations `hasGeographicBuilding`, `hasGeographicFloor`, `hasGeographicRoom`,
  `hasGeographicZone`, `hasBimObject` (room → equipment); types `geographicBuilding`,
  `geographicFloor`, `geographicRoom`, `geographicZone`, `BIMObject`.
- BMS network — relations `hasBmsNetwork`, `hasBmsDevice`, `hasBmsEndpointGroup`, `hasBmsEndpoint`;
  types `BmsNetwork`, `BmsDevice`, `BmsEndpointGroup`, `BmsEndpoint`. An endpoint's live value is the
  `currentValue` of its element — read it with ENDPOINT_NODE_CURRENT_VALUE.

How a room reaches its endpoints (directly, through an equipment, through control points…) is NOT
standard: find out before writing the path.

## Loading it into the builder

The builder is the "analysis" app of the BOS portal (French interface). Analytics live in contexts;
on a context's page each analytic is a card. **The analytic goes into the context whose page is
open**, whatever `contextName` the file holds — open (or create) the right context first.

- **With a file you can hand to the page**: « Importer une analyse » fills a hidden
  `input[type=file]` (`.json`). Upload the config there; a new card appears first in the list, marked
  « Non enregistré ».
- **By pasting**: the « Modifier JSON » icon of a card opens a text area holding that analytic's whole
  config. Replace its content with yours and press « Enregistrer »; the card is then marked
  « Modification non validée ». To start a new analytic this way, « Créer une analyse » first, then
  « Modifier JSON » on the new card.

Either way the config is now a **local draft**: nothing is on the server yet. Then:

1. A card has four steps, each with « Modifier »: « Définition de l'entité » (the anchor — the user
   picks it when the config has no `anchorNodeId`), « Worknode resolver », « Construction de
   l'algorithme » (the input and execution workflows, on one canvas) and « Paramétrage du
   déclenchement » (the triggers).
2. Open « Construction de l'algorithme » so the user sees the blocks and wires, and let them check.
3. Save with « Créer l'analyse » (new) or « Valider la modification » (existing). If the server
   refuses, a dialog lists the reasons with the block concerned: fix the JSON and load it again.
   A refusal such as `FILTER block must have "itemRef"` for a FILTER that does have one means the
   builder is an old version that drops the content of FILTER blocks on import: tell the user.

« Simuler », on the canvas, **runs the analytic for real** on its work nodes — blocks that write do
write. Run it, or set the analytic Active, only when the user asks.

## Writing to the building

SET_ATTRIBUTE, SET_ENDPOINT_VALUE, SET_NODE_INFO, CREATE_NODE, LINK_NODES, SHARE_VALUE, CREATE_TICKET,
MOVE_TICKET_TO_NEXT_STEP, INSERT_TIMESERIES, PUSH_ENDPOINT_VALUE, SAVE_EXCEL_TO_NODE, SEND_MAIL and
CURL_REQUEST (and their `_PARAM` forms) change the real building or reach the outside. An analytic
runs again at every trigger, on every work node, so:

- Say what will be written, and where, before the user saves.
- Make every write safe to repeat: CREATE_NODE and CREATE_TICKET have `ifExists`; setting the same
  value twice is harmless; a mail or a ticket per run is not — put it behind an IF.

## Mistakes to avoid

- **A block that expects one node, given a list.** Check the input types in the reference:
  `SpinalNode` is one node, `SpinalNode[]` a list. Use FIRST_NODE / FIND_NODE to take one, FOREACH to
  work on each.
- **A lookup that finds nothing.** FIND_NODE, GET_NODE_CHILD and GET_NODE_PARENT fail when nothing
  matches. To skip what is missing, set `"ifNotFound": "null"` and test the result with EXISTS inside a
  FILTER — see `reference/examples/floor-average-temperature.json`.
- **Loose regexes.** `regex` on GET_NODE_CHILDREN matches the relation name and `regexFilter` matches a
  property: `"hasGeographicRoom"` also matches `groupHasGeographicRoom`. Anchor them: `"^hasGeographicRoom$"`.
- **Resolver with two ends.** The work nodes are the output of the resolver's last block — the one no
  other block uses. It must be single and return a node or a list of nodes.
- **Attributes are text.** GET_ATTRIBUTE returns `"21.5"`, not 21.5. The number and comparison blocks
  accept numeric text, so no conversion is needed before them.
- **Averaging a list.** The number blocks (SUM_NUMBERS, AVERAGE_NUMBERS, MIN_NUMBERS, …) take a list
  from one wire — typically the output of a FOREACH.
- **Guessing a parameter name.** Names are exact and case-sensitive (`categoryName`, `regexFilter`);
  the validator suggests the right one.
