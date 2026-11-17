<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->
# Attributes (NODE_ATTRIBUTES)

Read and write the attributes of a node.

## GET_ATTRIBUTE

Get Attribute · French label in the builder: « Lire un attribut »

`GET_ATTRIBUTE(node: SpinalNode) → any`

Gets the value of an attribute from a node by category and label.

Inputs, in this order:
1. `node` (SpinalNode) — The node to read the attribute from.

Parameters:
- `categoryName` (string, required) — The attribute category name
- `label` (string, required) — The attribute label

## SET_ATTRIBUTE

Set Attribute · French label in the builder: « Définir un attribut »

`SET_ATTRIBUTE(node: SpinalNode, value: any) → any`

Sets an attribute on a node by category and label. Can create or only update based on the createIfNotExist parameter.

Inputs, in this order:
1. `node` (SpinalNode) — The node to set the attribute on.
2. `value` (any) — The value to set on the attribute.

Parameters:
- `categoryName` (string, required) — The attribute category name
- `label` (string, required) — The attribute label
- `createIfNotExist` (boolean, optional, default true) — If true, creates the attribute if it does not exist. If false, only updates existing attributes (default: true).
- `updateDirectModificationDate` (boolean, optional, default false) — If true, also stamps node.info.directModificationDate with the current time when the attribute actually changes, so the BOS can detect the direct modification (default: false).

## SET_ATTRIBUTE_PARAM

Set Attribute (constant) · French label in the builder: « Définir un attribut (constante) »

`SET_ATTRIBUTE_PARAM(node: SpinalNode) → any`

Sets an attribute on a node using a static parameter value. Can create or only update based on the createIfNotExist parameter.

Inputs, in this order:
1. `node` (SpinalNode) — The node to set the attribute on.

Parameters:
- `categoryName` (string, required) — The attribute category name
- `label` (string, required) — The attribute label
- `value` (string, required) — The value to set
- `createIfNotExist` (boolean, optional, default true) — If true, creates the attribute if it does not exist. If false, only updates existing attributes (default: true).
- `updateDirectModificationDate` (boolean, optional, default false) — If true, also stamps node.info.directModificationDate with the current time when the attribute actually changes, so the BOS can detect the direct modification (default: false).

## GET_ALL_ATTRIBUTES

Get All Attributes · French label in the builder: « Lire tous les attributs »

`GET_ALL_ATTRIBUTES(node: SpinalNode) → string`

Gets all attributes of a node within a specific category. Returns a string representation.

Inputs, in this order:
1. `node` (SpinalNode) — The node whose attributes to return.

Parameters:
- `categoryName` (string, optional) — The attribute category name

## GET_ATTRIBUTE_MODEL

Get Attribute (Model) · French label in the builder: « Lire un attribut (modèle) »

`GET_ATTRIBUTE_MODEL(node: SpinalNode) → SpinalAttribute`

Gets the SpinalAttribute model from a node by category and label. Useful for binding onChange listeners.

Inputs, in this order:
1. `node` (SpinalNode) — The node to read the attribute model from.

Parameters:
- `categoryName` (string, required) — The attribute category name
- `label` (string, required) — The attribute label

## GET_ALL_ATTRIBUTE_MODELS

Get All Attributes (Models) · French label in the builder: « Lire tous les attributs (modèles) »

`GET_ALL_ATTRIBUTE_MODELS(node: SpinalNode) → SpinalAttribute[]`

Gets all SpinalAttribute models of a node within a specific category. Useful for binding onChange listeners.

Inputs, in this order:
1. `node` (SpinalNode) — The node whose attribute models to return.

Parameters:
- `categoryName` (string, optional) — The attribute category name
