<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->
# Nodes & graph (NODE)

Find nodes through the graph, read their info, create and link them.

## FIRST_NODE

First Node · French label in the builder: « Premier nœud »

`FIRST_NODE(nodes: SpinalNode | SpinalNode[]) → SpinalNode`

Returns the node input, or first node of a node array.

Inputs, in this order:
1. `nodes` (SpinalNode | SpinalNode[]) — A node, or a list of nodes (the first is returned).

Parameters: none.

## MERGE_NODES

Merge Nodes · French label in the builder: « Fusionner des nœuds »

`MERGE_NODES(...nodes: SpinalNode | SpinalNode[]) → SpinalNode[]`

Merges several node inputs into a single SpinalNode array. Each input may be a node or a node array — they are flattened (one level) into one list, in input order. Use it to combine e.g. children from two different relations. Set "deduplicate" to remove nodes that appear more than once (by id). Returns [] when nothing is wired.

Inputs, in this order:
1. `nodes` (SpinalNode | SpinalNode[], one or more) — Two or more nodes and/or node arrays to merge.

Parameters:
- `deduplicate` (boolean, optional, default false) — If true, keep each node only once (by id), preserving first occurrence. Default false (plain concatenation).

## GET_CONTEXT

Get Context · French label in the builder: « Récupérer un contexte »

`GET_CONTEXT() → SpinalNode`

Returns the context (SpinalContext) with the given name from the graph. Takes no input — the context is looked up by the "name" parameter. Throws if no context with that name exists.

Inputs: none.

Parameters:
- `name` (string, required) — The name of the context to fetch.

## GET_NODE_SERVER_ID

Node Server ID · French label in the builder: « ID serveur du nœud »

`GET_NODE_SERVER_ID(node: SpinalNode) → number`

Returns the ID of a SpinalNode.

Inputs, in this order:
1. `node` (SpinalNode) — The node whose server id to return.

Parameters: none.

## GET_NODE_BY_SERVER_ID

Node by Server ID · French label in the builder: « Nœud par ID serveur »

`GET_NODE_BY_SERVER_ID(serverId?: number | string) → SpinalNode`

Returns the node with the given server id — the reverse of GET_NODE_SERVER_ID. Give the id in the "serverId" parameter, or wire it (a number or a numeric text, e.g. read from an Excel cell or an attribute). A node this organ has already loaded is returned at once; any other is loaded from the hub. For a list of ids, use a FOREACH.

Inputs, in this order:
1. `serverId` (number | string, optional) — Optional dynamic server id; when wired, it overrides the "serverId" parameter.

Parameters:
- `serverId` (number, optional) — Server id of the node (unless the serverId input is wired).
- `ifNotFound` (string, optional, one of "error", "null", default "error") — What to do when nothing matches: "error" (default — the block fails) or "null" (return null, so EXISTS — e.g. inside a FILTER — can test whether something was found).

## SET_NODE_INFO

Set Node Info · French label in the builder: « Définir une info du nœud »

`SET_NODE_INFO(node: SpinalNode, value: any) → SpinalNode`

Sets a property on a node's info to a dynamic value input. Takes 2 inputs: [node, value]. The property key comes from the "property" parameter. Creates the property if it does not exist, otherwise updates it in place (e.g. rename a node by setting "name"). These info properties are what FILTER_NODE / FIND_NODE match on. Returns the node for chaining. The "id" property is protected and cannot be changed.

Inputs, in this order:
1. `node` (SpinalNode) — The node whose info to update.
2. `value` (any) — The value to set on the info property.

Parameters:
- `property` (string, required) — The info property key to set (e.g. "name").

## SET_NODE_INFO_PARAM

Set Node Info (constant) · French label in the builder: « Définir une info du nœud (constante) »

`SET_NODE_INFO_PARAM(node: SpinalNode) → SpinalNode`

Sets a property on a node's info to a static parameter value. Takes 1 input: the node, and "property" + "value" parameters. Creates the property if it does not exist, otherwise updates it in place (e.g. rename a node by setting "name"). These info properties are what FILTER_NODE / FIND_NODE match on. Returns the node for chaining. The "id" property is protected and cannot be changed.

Inputs, in this order:
1. `node` (SpinalNode) — The node whose info to update.

Parameters:
- `property` (string, required) — The info property key to set (e.g. "name").
- `value` (string, required) — The value to set. Numeric strings ("42") and "true"/"false"/"null" are coerced to their real type, so a new numeric property becomes a Val (number). Pass a genuine string via SET_NODE_INFO (dynamic) if you need "42" to stay text.

## GET_NODE_CHILDREN

Node Children · French label in the builder: « Enfants du nœud »

`GET_NODE_CHILDREN(node: SpinalNode | SpinalNode[]) → SpinalNode[]`

Returns the children of a node — or of every node of a list, merged without duplicates. The optional "regex" limits which relations are followed (e.g. the tickets of several steps).

Inputs, in this order:
1. `node` (SpinalNode | SpinalNode[]) — The node, or list of nodes, whose children to return.

Parameters:
- `regex` (string, optional) — Regex pattern to relation used to get children nodes

## GET_NODE_PARENTS

Node Parents · French label in the builder: « Parents du nœud »

`GET_NODE_PARENTS(node: SpinalNode | SpinalNode[]) → SpinalNode[]`

Returns the parents of a node — or of every node of a list, merged without duplicates. The optional "regex" limits which relations are followed.

Inputs, in this order:
1. `node` (SpinalNode | SpinalNode[]) — The node, or list of nodes, whose parents to return.

Parameters:
- `regex` (string, optional) — Regex pattern to relation used to get parent nodes

## FIND_IN_CONTEXT

Find in Context · French label in the builder: « Chercher dans un contexte »

`FIND_IN_CONTEXT(start: SpinalNode | SpinalNode[]) → SpinalNode[]`

Finds every node of a given "type" — and/or whose property matches "regexFilter" — under a start node, at any depth, following only the relations registered in a context (like SpinalNode.findInContext). E.g. all the tickets of a ticket context, the steps of a process, the rooms of a building in the spatial context. The start node itself is not returned; with a list of start nodes the results are merged without duplicates. Leave "contextName" empty when the start node is the context itself.

Inputs, in this order:
1. `start` (SpinalNode | SpinalNode[]) — Where to search from: the context itself, or a node (or list of nodes) of the context.

Parameters:
- `type` (string, optional) — Node type to find, matched exactly (e.g. "SpinalSystemServiceTicketTypeTicket").
- `filterProperty` (string, optional, default "name") — Info property tested by "regexFilter" (default "name").
- `regexFilter` (string, optional) — Regex the property must match, e.g. "^(?!Terminées$)" for every name except "Terminées".
- `contextName` (string, optional) — Context to search in. Leave empty when the start node is the context itself.

## GET_NODE_INFO

Node Info · French label in the builder: « Info du nœud »

`GET_NODE_INFO(node: SpinalNode) → any`

Reads one field of a node's info: "name" (default), "type", "id", "server_id" or any other info key. Returns the plain value (string / number / boolean), or null when the key is absent. The usual first step of a predicate on a node — e.g. GET_NODE_INFO "type" → EQUALS_PARAM "geographicRoom", or GET_NODE_INFO "name" → MATCHES_REGEX "^Bureau".

Inputs, in this order:
1. `node` (SpinalNode) — The node to read.

Parameters:
- `property` (string, optional, default "name") — Info key to read (default "name").

## GET_NODE_CHILD

Find Child Node · French label in the builder: « Trouver un enfant »

`GET_NODE_CHILD(node: SpinalNode) → SpinalNode`

Shortcut for GET_NODE_CHILDREN + FIND_NODE: returns the first child of the input node whose property matches a regex. The optional "regex" limits which relations are traversed; "filterProperty" (default "name") and "regexFilter" select the child. Fails if none matches, unless "ifNotFound" is "null".

Inputs, in this order:
1. `node` (SpinalNode) — The node whose children to search.

Parameters:
- `regex` (string, optional) — Optional regex on the relation name to limit which children are traversed.
- `filterProperty` (string, optional, default "name") — Info property to match on (default "name").
- `regexFilter` (string, required) — Regex the property value must match to select the child.
- `ifNotFound` (string, optional, one of "error", "null", default "error") — What to do when nothing matches: "error" (default — the block fails) or "null" (return null, so EXISTS — e.g. inside a FILTER — can test whether something was found).

## GET_NODE_PARENT

Find Parent Node · French label in the builder: « Trouver un parent »

`GET_NODE_PARENT(node: SpinalNode) → SpinalNode`

Shortcut for GET_NODE_PARENTS + FIND_NODE: returns the first parent of the input node whose property matches a regex. The optional "regex" limits which relations are traversed; "filterProperty" (default "name") and "regexFilter" select the parent. Fails if none matches, unless "ifNotFound" is "null".

Inputs, in this order:
1. `node` (SpinalNode) — The node whose parents to search.

Parameters:
- `regex` (string, optional) — Optional regex on the relation name to limit which parents are traversed.
- `filterProperty` (string, optional) — Info property to match on (default "name").
- `regexFilter` (string, required) — Regex the property value must match to select the parent.
- `ifNotFound` (string, optional, one of "error", "null", default "error") — What to do when nothing matches: "error" (default — the block fails) or "null" (return null, so EXISTS — e.g. inside a FILTER — can test whether something was found).

## FILTER_NODE

Filter Nodes · French label in the builder: « Filtrer des nœuds »

`FILTER_NODE(nodes: SpinalNode | SpinalNode[]) → SpinalNode[]`

Filter Nodes based on specified criteria.

Inputs, in this order:
1. `nodes` (SpinalNode | SpinalNode[]) — A node or list of nodes to filter.

Parameters:
- `filterProperty` (string, required) — Name of the info property ( must be in the info of the node)
- `regexFilter` (string, required) — Regex pattern to filter by

## FIND_NODE

Find Node · French label in the builder: « Trouver un nœud »

`FIND_NODE(nodes: SpinalNode | SpinalNode[]) → SpinalNode`

Returns the first node matching the specified criteria (like FILTER_NODE but returns a single node). Fails if none matches, unless "ifNotFound" is "null".

Inputs, in this order:
1. `nodes` (SpinalNode | SpinalNode[]) — A node or list of nodes to search.

Parameters:
- `filterProperty` (string, required) — Name of the info property (must be in the info of the node)
- `regexFilter` (string, required) — Regex pattern to filter by
- `ifNotFound` (string, optional, one of "error", "null", default "error") — What to do when nothing matches: "error" (default — the block fails) or "null" (return null, so EXISTS — e.g. inside a FILTER — can test whether something was found).

## CREATE_NODE

Create Node · French label in the builder: « Créer un nœud »

`CREATE_NODE(parent: SpinalNode, name?: string | number) → SpinalNode`

Creates a node and links it under a parent node — a node that is not linked into the graph is never saved, so creation always attaches it. Give its "name" (or wire a dynamic name, e.g. from FORMAT_STRING), its "type", and the "relationName" from the parent to it. Analytics run again on every trigger, so by default a child with the same name and type already under that relation is reused instead of creating a duplicate (see "ifExists"). Set "contextName" to register the link in a context, so the node shows in that context's tree in the BOS; leave it empty for a plain link. Returns the node — new or reused — for chaining (SET_NODE_INFO_PARAM, SET_ATTRIBUTE_PARAM, LINK_NODES, …).

Inputs, in this order:
1. `parent` (SpinalNode) — The node the new node is linked under.
2. `name` (string | number, optional) — Optional dynamic name; when wired, it overrides the "name" parameter.

Parameters:
- `name` (string, optional) — Name of the node (unless the name input is wired).
- `type` (string, required) — Type of the node, e.g. "geographicRoomGroup" or a custom type.
- `relationName` (string, required) — Name of the relation from the parent to the child, e.g. "hasCustomNode" (matched exactly).
- `relationType` (string, optional, one of "PtrLst", "LstPtr", "Ref") — PtrLst, LstPtr or Ref. Leave empty to use the type the parent already has for this relation (else PtrLst).
- `contextName` (string, optional) — Context to register the link in (e.g. "Spatial"), so the child shows in that context's tree in the BOS. Leave empty for a plain link outside any context. The parent must be that context or belong to it. A child that is already linked gets the context added to its existing link.
- `ifExists` (string, optional, one of "reuse", "error", "allow", default "reuse") — When a child with the same name and type already exists under the relation: "reuse" (default — return it), "error" (fail), or "allow" (create another one anyway).

## LINK_NODES

Link Nodes · French label in the builder: « Lier des nœuds »

`LINK_NODES(parent: SpinalNode, child: SpinalNode | SpinalNode[]) → any`

Links a child node — or every node of a list — under a parent node through the "relationName" relation (e.g. put the rooms kept by a FILTER into a group). Idempotent: a child already linked under that relation is not linked again, so re-running the analytic never fails or duplicates. Set "contextName" to register the links in a context, so the children show in its tree in the BOS; leave it empty for plain links. Refuses to link a node to itself, or under its own child through the same relation (a cycle). Takes 2 inputs: [parent, child(ren)]; returns the child input unchanged, for chaining.

Inputs, in this order:
1. `parent` (SpinalNode) — The node to link under.
2. `child` (SpinalNode | SpinalNode[]) — The node, or list of nodes, to link under the parent.

Parameters:
- `relationName` (string, required) — Name of the relation from the parent to the child, e.g. "hasCustomNode" (matched exactly).
- `relationType` (string, optional, one of "PtrLst", "LstPtr", "Ref") — PtrLst, LstPtr or Ref. Leave empty to use the type the parent already has for this relation (else PtrLst).
- `contextName` (string, optional) — Context to register the link in (e.g. "Spatial"), so the child shows in that context's tree in the BOS. Leave empty for a plain link outside any context. The parent must be that context or belong to it. A child that is already linked gets the context added to its existing link.

## SHARE_VALUE

Share a Value · French label in the builder: « Partager une valeur »

`SHARE_VALUE(source: SpinalNode, target: SpinalNode) → SpinalNode`

Makes two nodes hold the SAME value instead of two copies: the target's property becomes the source's, so a write on either node — by an analytic, the BOS, or a connector — shows on both at once, with nothing to re-run (e.g. a node created under a room sharing the "element.currentValue" of an endpoint, or two nodes sharing an attribute). Name the value with "sourceProperty": "element.<key>", "attr.<Category>.<Label>" or "info.<key>"; it lands at the same place on the target unless "targetProperty" says otherwise, and that place is created when missing. The target's own value there is replaced — best done right after CREATE_NODE, before anything watches the target. An attribute can only share a text value. Running it again changes nothing. Takes 2 inputs: [source, target]; returns the target node, for chaining.

Inputs, in this order:
1. `source` (SpinalNode) — The node that owns the value — it is kept as is.
2. `target` (SpinalNode) — The node that gets the shared value — its own value at that place is replaced.

Parameters:
- `sourceProperty` (string, required) — The value to share, on the source node: "element.currentValue" (an endpoint's value), "attr.<Category>.<Label>" (an attribute) or "info.<key>" (an info property, e.g. "info.name").
- `targetProperty` (string, optional) — Where the value goes on the target node, in the same form. Leave empty to use the same place as on the source.

## CURRENT_NODE

Current Work Node · French label in the builder: « Nœud de travail courant »

`CURRENT_NODE() → SpinalNode`

Returns the current work node from the execution context. Used as a root/source block in workflows to inject the work node into the DAG.

Inputs: none.

Parameters: none.
