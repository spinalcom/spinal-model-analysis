<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->
# Flow & execution (FLOW)

Loops and conditions, registers, and what triggered the execution.

## DELAY

Delay · French label in the builder: « Délai »

`DELAY(value: any) → any`

Waits for the given duration, then returns its input unchanged. Useful to pace a workflow, rate-limit calls, or sequence a downstream block to run after a delay (the downstream block depends on this block's output). Duration is capped at 300000 ms to avoid blocking the engine.

Inputs, in this order:
1. `value` (any) — Any value; returned unchanged after the delay.

Parameters:
- `durationMs` (number, required) — How long to wait before returning, in milliseconds (capped at 300000).

## IF

If / Else · French label in the builder: « Si / Sinon »

`IF(predicate: boolean, payload?: any) → any`

Conditional branching block. Takes a boolean predicate as inputs[0] and runs thenWorkflow if true, elseWorkflow if false; the chosen branch's "outputRef" result becomes the block's output (undefined when the matching branch is not defined). Branches inherit the surrounding context: they can read any block computed before the IF and any enclosing FOREACH / FILTER element by ref — there is no separate payload mechanism. Handled by the DAG executor — this run() is never called directly.

Inputs, in this order:
1. `predicate` (boolean) — Boolean deciding which branch runs (then/else).
2. `payload` (any, optional) — Reserved — currently ignored by the executor. Branches read the surrounding context by ref instead.

Parameters: none.

## LOG

Log · French label in the builder: « Journaliser »

`LOG(value: any) → any`

Logs its input to the console (always, regardless of ADVANCED_LOGGING) and returns it unchanged — a transparent tap you can insert anywhere in a workflow to inspect a value. Strings are logged as-is; other values are stringified (objects as JSON). An optional "prefix" parameter labels the line so you can tell which LOG block produced it.

Inputs, in this order:
1. `value` (any) — The value to log (typically a string); returned unchanged.

Parameters:
- `prefix` (string, optional, default "[LOG]") — Optional label prepended to the log line (default "[LOG]").

## GET_EXECUTION_REFERENCE_TIME

Execution Reference Time · French label in the builder: « Temps de référence de l'exécution »

`GET_EXECUTION_REFERENCE_TIME() → number`

Returns the execution reference time (epoch ms) from execution context. Useful for deterministic timeseries push/fetch operations.

Inputs: none.

Parameters: none.

## GET_CURRENT_DATE

Current Date · French label in the builder: « Date actuelle »

`GET_CURRENT_DATE() → number`

Returns the current date and time (epoch ms).

Inputs: none.

Parameters: none.

## GET_EXECUTION_TRIGGER_TYPE

Trigger Type · French label in the builder: « Type de déclencheur »

`GET_EXECUTION_TRIGGER_TYPE() → string`

Returns the trigger type that initiated this execution (e.g., INTERVAL_TIME, CRON, COV).

Inputs: none.

Parameters: none.

## GET_EXECUTION_TRIGGER_ID

Trigger ID · French label in the builder: « ID du déclencheur »

`GET_EXECUTION_TRIGGER_ID() → string`

Returns the optional trigger identifier (e.g., Trigger1) that initiated this execution.

Inputs: none.

Parameters: none.

## GET_EXECUTION_TRIGGER_INPUT_REGISTER

Trigger Input Register · French label in the builder: « Registre d'entrée du déclencheur »

`GET_EXECUTION_TRIGGER_INPUT_REGISTER() → string`

For COV executions, returns the input register name that was bound (e.g., I0).

Inputs: none.

Parameters: none.

## GET_EXECUTION_TRIGGER_THRESHOLD

Trigger Threshold · French label in the builder: « Seuil du déclencheur »

`GET_EXECUTION_TRIGGER_THRESHOLD() → number`

For COV executions with deadband, returns the threshold value.

Inputs: none.

Parameters: none.

## SET_INPUT_REGISTER

Set Input Register · French label in the builder: « Définir un registre d'entrée »

`SET_INPUT_REGISTER(value: any) → any`

Passes through the input value unchanged. The DAG executor uses the block's registerAs property to store this value as a named variable (e.g., I0, I1) for later use in the execution workflow.

Inputs, in this order:
1. `value` (any) — The value to register under the block's registerAs name.

Parameters: none.

## FETCH_INPUT_REGISTER

Fetch Input Register · French label in the builder: « Récupérer un registre d'entrée »

`FETCH_INPUT_REGISTER() → any`

Fetches a named input variable (e.g., I0, I1) that was set during the input workflow. Handled by the DAG executor — the run() function is never called directly.

Inputs: none.

Parameters:
- `registerName` (string, required) — Name of the register to fetch (e.g., I0)

## ELEMENT

Element · French label in the builder: « Élément »

`ELEMENT() → any`

Source block for FOREACH sub-workflows. Injects the current array element. The DAG executor provides the value — this run() is never called directly.

Inputs: none.

Parameters: none.

## FOREACH

For Each · French label in the builder: « Pour chaque »

`FOREACH(items: any[]) → any[]`

Higher-order block that takes an array input and runs its sub-workflow once per element, with the current element available to sub-blocks under the block's "itemRef" name. The sub-workflow's "outputRef" result for each element is collected into the output array (same length and order as the input). Iterations run one at a time unless the block's "concurrency" opts into BOUNDED / FULL. Handled by the DAG executor — this run() is never called directly.

Inputs, in this order:
1. `items` (any[]) — The array to iterate over.

Parameters: none.

## FILTER

Filter · French label in the builder: « Filtrer »

`FILTER(items: any[]) → any[]`

Keeps the elements of an array input for which a predicate sub-workflow returns true. Like FOREACH, the sub-workflow runs once per element (available under the block's "itemRef" name), but its "outputRef" block must produce a boolean: the output is the subset of INPUT elements — not the predicate results — in input order. Any test can be the predicate (a comparison on a fetched value, an attribute check, …), which is what FILTER_NODE's property regex cannot express. Supports the same "concurrency" as FOREACH. Handled by the DAG executor — this run() is never called directly.

Inputs, in this order:
1. `items` (any[]) — The array to filter.

Parameters: none.
