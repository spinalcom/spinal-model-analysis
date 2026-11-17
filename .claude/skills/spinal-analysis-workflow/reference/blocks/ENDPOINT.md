<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->
# Endpoints (ENDPOINT)

Read and write the current value of an endpoint.

## ENDPOINT_NODE_CURRENT_VALUE

Endpoint Current Value · French label in the builder: « Valeur courante d'un endpoint »

`ENDPOINT_NODE_CURRENT_VALUE(endpoint: SpinalNode) → any`

For a node representing an endpoint, returns the current value.

Inputs, in this order:
1. `endpoint` (SpinalNode) — The endpoint node whose current value to read.

Parameters: none.

## ENDPOINT_NODE_CURRENT_VALUE_MODEL

Endpoint Current Value (Model) · French label in the builder: « Valeur courante d'un endpoint (modèle) »

`ENDPOINT_NODE_CURRENT_VALUE_MODEL(endpoint: SpinalNode) → any`

For a node representing an endpoint, returns the bindable currentValue MODEL (not the primitive value). Use this to populate an input register that a COV trigger can bind on to react to value changes.

Inputs, in this order:
1. `endpoint` (SpinalNode) — The endpoint node whose current value model to return.

Parameters: none.

## SET_ENDPOINT_VALUE

Set Endpoint Value · French label in the builder: « Définir la valeur d'un endpoint »

`SET_ENDPOINT_VALUE(endpoint: SpinalNode, value: any) → any`

Sets the current value of an endpoint node. Takes 2 inputs: [endpointNode, value]. Returns the value that was set.

Inputs, in this order:
1. `endpoint` (SpinalNode) — The endpoint node to update.
2. `value` (any) — The value to set on the endpoint.

Parameters:
- `updateDirectModificationDate` (boolean, optional, default false) — If true, also stamps node.info.directModificationDate with the current time after setting the value, so the BOS can detect the direct modification (default: false).

## SET_ENDPOINT_VALUE_PARAM

Set Endpoint Value (constant) · French label in the builder: « Définir la valeur d'un endpoint (constante) »

`SET_ENDPOINT_VALUE_PARAM(endpoint: SpinalNode) → any`

Sets the current value of an endpoint node to a static parameter value. Takes 1 input: endpointNode, and a "value" parameter. Returns the value that was set.

Inputs, in this order:
1. `endpoint` (SpinalNode) — The endpoint node to update.

Parameters:
- `value` (string, required) — The value to set (string, number, or boolean)
- `updateDirectModificationDate` (boolean, optional, default false) — If true, also stamps node.info.directModificationDate with the current time after setting the value, so the BOS can detect the direct modification (default: false).

## PUSH_ENDPOINT_VALUE

Push Endpoint Value · French label in the builder: « Pousser une valeur sur un endpoint »

`PUSH_ENDPOINT_VALUE(endpoint: SpinalNode, value: any) → any`

Records a value on an endpoint: updates the node element's currentValue (like SET_ENDPOINT_VALUE) AND appends a point to the endpoint's timeseries (creating the timeseries if it does not exist yet). Takes 2 inputs: [endpointNode, value]. The timeseries point is dated at the execution reference time by default, or at the optional "date" parameter. Returns the value that was recorded.

Inputs, in this order:
1. `endpoint` (SpinalNode) — The endpoint node to record the value on.
2. `value` (any) — The value to set as currentValue and append to the timeseries.

Parameters:
- `date` (string, optional) — Timestamp for the timeseries point, epoch ms or a parseable date string. Defaults to the execution reference time (or now if unavailable).
- `updateDirectModificationDate` (boolean, optional, default false) — If true, also stamps node.info.directModificationDate with the current time after recording the value, so the BOS can detect the direct modification (default: false).
