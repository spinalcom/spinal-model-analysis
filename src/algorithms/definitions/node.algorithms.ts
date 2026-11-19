/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SpinalNode,
  SpinalGraphService,
  SpinalContext,
  SPINAL_RELATION_PTR_LST_TYPE,
  SPINAL_RELATION_LST_PTR_TYPE,
  SPINAL_RELATION_TYPE,
} from 'spinal-env-viewer-graph-service';
import { FileSystem, Model, Obj, Str } from 'spinal-core-connectorjs_type';
import { attributeService } from 'spinal-env-viewer-plugin-documentation-service';
import {
  AlgorithmDefinition,
  AlgorithmParams,
  AlgorithmRunResult,
  createAlgorithm,
} from './core';
import { parseValue, resolveBooleanFlag, touchDirectModificationDate } from '../../services/utils';
import { withKeyLock } from '../../services/concurrency';

/** Shared description for the updateDirectModificationDate parameter of the endpoint setters. */
const UPDATE_DIRECT_MODIFICATION_DATE_DESC =
  'If true, also stamps node.info.directModificationDate with the current time after setting ' +
  'the value, so the BOS can detect the direct modification (default: false).';

const isSpinalNode = (value: unknown): value is SpinalNode<any> => {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as SpinalNode<any>).getId === 'function'
  );
};

const isNodeArray = (value: unknown): value is SpinalNode<any>[] => {
  return Array.isArray(value) && value.every((item) => isSpinalNode(item));
};

/** A node, or a list of nodes, as a list. */
const asNodeList = (input: unknown, blockName: string): SpinalNode<any>[] => {
  if (isSpinalNode(input)) return [input];
  if (isNodeArray(input)) return input;
  throw new Error(`${blockName} expects a SpinalNode or a list of SpinalNodes`);
};

/** Concatenates node lists, keeping the first occurrence of each node (by id). */
const mergeUnique = (lists: SpinalNode<any>[][]): SpinalNode<any>[] => {
  const seen = new Set<string>();
  const merged: SpinalNode<any>[] = [];
  for (const node of lists.flat()) {
    const id = node.getId().get();
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(node);
  }
  return merged;
};

/** Returns the first node whose info[propName] is a string matching the regex (like FIND_NODE). */
const findNodeByProperty = (
  nodes: SpinalNode<any>[],
  propName: string,
  regex: RegExp
): SpinalNode<any> | undefined =>
  nodes.find((node) => {
    const infoProp = node.info[propName];
    if (!infoProp || typeof infoProp.get !== 'function') return false;
    const value: unknown = infoProp.get();
    return typeof value === 'string' && regex.test(value);
  });

/** The "ifNotFound" parameter of the lookups: fail the block (default) or return null. */
const NOT_FOUND_PARAM = {
  name: 'ifNotFound',
  type: 'string',
  description:
    'What to do when nothing matches: "error" (default — the block fails) or "null" (return null, so ' +
    'EXISTS — e.g. inside a FILTER — can test whether something was found).',
  options: ['error', 'null'],
  default: 'error',
  required: false,
};

const resolveNotFoundPolicy = (raw: unknown, blockName: string): 'error' | 'null' => {
  if (raw === undefined || raw === null || raw === '') return 'error';
  const policy = String(raw).trim().toLowerCase();
  if (policy === 'error' || policy === 'null') return policy;
  throw new Error(`${blockName}: "ifNotFound" must be "error" or "null", got ${JSON.stringify(raw)}`);
};

// ── GET_NODE_BY_SERVER_ID ────────────────────────────────────────────────────

/** How long the hub has to answer a load before the block fails (it never answers some ids). */
const SERVER_ID_LOAD_TIMEOUT_MS = 30_000;

/** The wired id, else the parameter, as a positive integer. */
const resolveServerId = (input: unknown, param: unknown): number => {
  const raw = [input, param].find((value) => value !== undefined && value !== null && String(value).trim() !== '');
  if (raw === undefined) {
    throw new Error('GET_NODE_BY_SERVER_ID needs a server id: set the "serverId" parameter or wire the serverId input');
  }
  if (typeof raw !== 'number' && typeof raw !== 'string') {
    throw new Error(`GET_NODE_BY_SERVER_ID expects a server id (a number), got ${Array.isArray(raw) ? 'a list — use a FOREACH' : typeof raw}`);
  }
  const serverId = Number(String(raw).trim());
  if (!Number.isInteger(serverId) || serverId <= 0) {
    throw new Error(`GET_NODE_BY_SERVER_ID: ${JSON.stringify(raw)} is not a server id (a positive whole number)`);
  }
  return serverId;
};

/**
 * The model with this server id: from memory when this process already holds it, else from the
 * hub. Resolves undefined when the hub has no such id.
 */
const loadByServerId = (serverId: number): Promise<unknown> => {
  const loaded = (FileSystem as any)._objects?.[serverId];
  if (loaded !== undefined) return Promise.resolve(loaded);
  const fs = (FileSystem as any).get_inst?.();
  if (!fs) {
    return Promise.reject(new Error(`GET_NODE_BY_SERVER_ID: server id ${serverId} is not loaded and there is no hub connection to load it`));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`GET_NODE_BY_SERVER_ID: the hub did not answer for server id ${serverId} within ${SERVER_ID_LOAD_TIMEOUT_MS / 1000} s`)),
      SERVER_ID_LOAD_TIMEOUT_MS
    );
    try {
      fs.load_ptr(serverId, (model: unknown) => {
        clearTimeout(timer);
        resolve(model ?? undefined);
      });
    } catch (error) {
      clearTimeout(timer);
      reject(error as Error);
    }
  });
};

// ── Graph writes (CREATE_NODE / LINK_NODES) ──────────────────────────────────

/** The relation types a link can use, as the graph library names them. */
const RELATION_TYPES: string[] = [SPINAL_RELATION_PTR_LST_TYPE, SPINAL_RELATION_LST_PTR_TYPE, SPINAL_RELATION_TYPE];

const RELATION_NAME_PARAM = {
  name: 'relationName',
  type: 'string',
  description: 'Name of the relation from the parent to the child, e.g. "hasCustomNode" (matched exactly).',
  required: true,
};

const RELATION_TYPE_PARAM = {
  name: 'relationType',
  type: 'string',
  description: 'PtrLst, LstPtr or Ref. Leave empty to use the type the parent already has for this relation (else PtrLst).',
  options: RELATION_TYPES,
  required: false,
};

const CONTEXT_NAME_PARAM = {
  name: 'contextName',
  type: 'string',
  description:
    'Context to register the link in (e.g. "Spatial"), so the child shows in that context\'s tree in the BOS. ' +
    'Leave empty for a plain link outside any context. The parent must be that context or belong to it. ' +
    'A child that is already linked gets the context added to its existing link.',
  required: false,
};

const nodeLabel = (node: SpinalNode<any>): string => `"${node.getName().get()}"`;

const requireRelationName = (params: AlgorithmParams | undefined, blockName: string): string => {
  const relationName = typeof params?.relationName === 'string' ? params.relationName.trim() : '';
  if (!relationName) {
    throw new Error(`${blockName} requires a non-empty "relationName" parameter (e.g. "hasCustomNode")`);
  }
  return relationName;
};

/**
 * The relation type to link with. By default the type the parent already uses for this relation
 * name, else PtrLst. An explicit type must not contradict an existing relation of the same name:
 * that would silently start a second, parallel relation instead of adding to the existing one.
 */
const resolveRelationType = (
  parent: SpinalNode<any>,
  relationName: string,
  raw: unknown,
  blockName: string
): string => {
  const existing = RELATION_TYPES.filter((type) => parent.hasRelation(relationName, type));
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return existing[0] ?? SPINAL_RELATION_PTR_LST_TYPE;
  }
  const requested = RELATION_TYPES.find((type) => type.toLowerCase() === String(raw).trim().toLowerCase());
  if (!requested) {
    throw new Error(`${blockName}: "relationType" must be one of ${RELATION_TYPES.join(', ')}, got ${JSON.stringify(raw)}`);
  }
  if (existing.length > 0 && !existing.includes(requested)) {
    throw new Error(
      `${blockName}: relation "${relationName}" already exists on ${nodeLabel(parent)} as ${existing.join(' / ')} — ` +
      `use that "relationType" (or leave it empty) instead of ${requested}`
    );
  }
  return requested;
};

const contextLabel = (contextId: string): string => {
  const context = SpinalGraphService.getRealNode(contextId);
  return context ? nodeLabel(context) : contextId;
};

/**
 * The context to register a link in — the caller's choice, as in the graph library itself (addChild
 * vs addChildInContext): no "contextName" → a plain link outside any context; a name → the link is
 * registered in that context, so the child shows in its tree in the BOS. That tree is walked from
 * the context through links registered in it, so the parent must be the context or belong to it —
 * otherwise the child would be saved but never shown there.
 */
const resolveLinkContext = (
  parent: SpinalNode<any>,
  raw: unknown,
  blockName: string
): SpinalContext<any> | undefined => {
  const contextName = typeof raw === 'string' ? raw.trim() : '';
  if (!contextName) return undefined;

  const context = SpinalGraphService.getContext(contextName);
  if (!context) throw new Error(`${blockName}: no context named "${contextName}" is loaded`);
  const contextId = context.getId().get();
  const parentContextIds: string[] = parent.getContextIds();
  if (parent.getId().get() !== contextId && !parentContextIds.includes(contextId)) {
    throw new Error(
      `${blockName}: ${nodeLabel(parent)} does not belong to context "${contextName}", so the link would not ` +
      `be visible in it. Its contexts: ${parentContextIds.map(contextLabel).join(', ') || 'none'}`
    );
  }
  return context;
};

/**
 * Registers an EXISTING link in `context`. A context tree shows a child only when both the relation
 * holding it and the child carry the context id; setting both makes a context chosen after the link
 * was first made (e.g. on a later run) apply to it too. addContextId is idempotent on both.
 */
const ensureLinkInContext = (
  parent: SpinalNode<any>,
  child: SpinalNode<any>,
  relationName: string,
  context: SpinalContext<any>
): void => {
  const contextId = context.getId().get();
  const childId = child.getId().get();
  child.addContextId(contextId);
  for (const type of RELATION_TYPES) {
    if (!parent.hasRelation(relationName, type)) continue;
    // Same relation object addChildInContext tags; not part of SpinalNode's public typings.
    const relation = (parent as any)._getRelation(relationName, type);
    if (relation.getChildrenIds().includes(childId)) relation.addContextId(contextId);
  }
};

/** Whether `childId` is already a child of `parent` through `relationName` (any relation type). */
const isLinked = async (parent: SpinalNode<any>, childId: string, relationName: string): Promise<boolean> =>
  (await parent.getChildren(relationName)).some((node) => node.getId().get() === childId);

/** Links `child` under `parent`, inside `context` when there is one (see resolveLinkContext). */
const addLink = async (
  parent: SpinalNode<any>,
  child: SpinalNode<any>,
  relationName: string,
  relationType: string,
  context: SpinalContext<any> | undefined
): Promise<void> => {
  if (context) await parent.addChildInContext(child, relationName, relationType, context);
  else await parent.addChild(child, relationName, relationType);
};

/** The "ifExists" parameter of CREATE_NODE. */
const resolveIfExists = (raw: unknown): 'reuse' | 'error' | 'allow' => {
  if (raw === undefined || raw === null || raw === '') return 'reuse';
  const policy = String(raw).trim().toLowerCase();
  if (policy === 'reuse' || policy === 'error' || policy === 'allow') return policy;
  throw new Error(`CREATE_NODE: "ifExists" must be "reuse", "error" or "allow", got ${JSON.stringify(raw)}`);
};

/**
 * Info keys that must not be overwritten: `id` is the node's identity and the key
 * SpinalGraphService indexes nodes by — changing it would desync the registry and
 * break every relation referencing the node.
 */
const PROTECTED_INFO_KEYS = new Set(['id']);

/**
 * Sets a property on a node's info model: updates it in place if it already exists,
 * otherwise creates it (add_attr). Refuses to touch a protected key.
 */
const setNodeInfoProperty = (node: SpinalNode<any>, property: string, value: unknown, blockName: string): void => {
  if (typeof property !== 'string' || property.trim() === '') {
    throw new Error(`${blockName} requires a non-empty "property" parameter`);
  }
  if (PROTECTED_INFO_KEYS.has(property)) {
    throw new Error(`${blockName}: "${property}" is a protected info property and cannot be modified`);
  }
  if (!node.info[property]) {
    node.info.add_attr(property, value);
  } else {
    node.info[property].set(value);
  }
};

// ── Shared values (SHARE_VALUE) ──────────────────────────────────────────────

/** A place on a node that holds one value: an info property, an element property, or an attribute. */
type ValuePlace =
  | { kind: 'info' | 'element'; key: string; text: string }
  | { kind: 'attr'; category: string; label: string; text: string };

const VALUE_PLACE_FORMS =
  '"element.<key>" (e.g. "element.currentValue", an endpoint\'s value), "attr.<Category>.<Label>" (an attribute) ' +
  'or "info.<key>" (an info property)';

/**
 * Parses a "sourceProperty" / "targetProperty" — the same path syntax as the API's `$modelRef`.
 * Refuses the keys that are not data: `info.id` (the node's identity) and internals (`_…`).
 */
const parseValuePlace = (raw: unknown, paramName: string): ValuePlace => {
  const text = typeof raw === 'string' ? raw.trim() : '';
  const invalid = (): Error =>
    new Error(`SHARE_VALUE: "${paramName}" must be ${VALUE_PLACE_FORMS}, got ${JSON.stringify(raw ?? '')}`);
  const [kind, ...rest] = text.split('.');
  if (kind === 'attr') {
    // The category runs to the first dot and the label is everything after, so a label may hold dots.
    const category = (rest[0] ?? '').trim();
    const label = rest.slice(1).join('.').trim();
    if (!category || !label) throw invalid();
    return { kind, category, label, text: `attr.${category}.${label}` };
  }
  if ((kind !== 'info' && kind !== 'element') || rest.length !== 1) throw invalid();
  const key = rest[0].trim();
  if (!key) throw invalid();
  if (key.startsWith('_') || key === 'model_id' || (kind === 'info' && key === 'id')) {
    throw new Error(`SHARE_VALUE: "${kind}.${key}" is reserved and cannot be shared`);
  }
  return { kind, key, text: `${kind}.${key}` };
};

const isSamePlace = (a: ValuePlace, b: ValuePlace): boolean => a.text === b.text;

const findAttributeModel = async (node: SpinalNode<any>, category: string, label: string): Promise<any | undefined> => {
  const attribute = await attributeService.findOneAttributeInCategory(node, category, label);
  return attribute === -1 ? undefined : attribute;
};

/** The model held at `place` on `node`, or undefined when there is nothing there. */
const readValueModel = async (node: SpinalNode<any>, place: ValuePlace): Promise<unknown> => {
  if (place.kind === 'attr') return (await findAttributeModel(node, place.category, place.label))?.value;
  const holder: any = place.kind === 'info' ? node.info : await node.getElement(true);
  return holder?._attribute_names?.includes(place.key) ? holder[place.key] : undefined;
};

/** What the node does have, to finish a "nothing at this place" error — the usual cause is a typo. */
const describeAvailableValues = async (node: SpinalNode<any>, place: ValuePlace): Promise<string> => {
  if (place.kind === 'attr') {
    const labels: string[] = (await attributeService.getAttributesByCategory(node, place.category).catch(() => []))
      .map((attribute: any) => attribute.label?.get());
    return labels.length > 0
      ? `category "${place.category}" holds: ${labels.join(', ')}`
      : `it has no attribute in category "${place.category}"`;
  }
  const holder: any = place.kind === 'info' ? node.info : await node.getElement(true);
  if (!holder) return 'it has no element';
  const keys: string[] = holder._attribute_names.filter((key: string) => holder[key] instanceof Obj);
  return `its ${place.kind} holds: ${keys.join(', ') || 'no value'}`;
};

/**
 * Makes `place` on `node` BE `value` — the same model, not a copy — creating the place when it is
 * missing (the attribute and its category, or the element of a node that has none). Nothing is
 * touched when the place already holds that model, so re-running is free.
 */
const writeValueModel = async (node: SpinalNode<any>, place: ValuePlace, value: Model): Promise<void> => {
  if (place.kind === 'attr') {
    let attribute = await findAttributeModel(node, place.category, place.label);
    if (!attribute) {
      await attributeService.createOrUpdateAttrsAndCategories(node, place.category, { [place.label]: '' });
      attribute = await findAttributeModel(node, place.category, place.label);
      if (!attribute) throw new Error(`SHARE_VALUE: could not create ${place.text} on ${nodeLabel(node)}`);
    }
    if (attribute.value === value) return;
    attribute.mod_attr('value', value);
    attribute.lastModificationDate?.set(Date.now());
    return;
  }
  // getElement() gives a node that has no element an empty one.
  const holder: any = place.kind === 'info' ? node.info : await node.getElement();
  // A new key named like a method of the holding model ("get", "set", "size", …) would replace it.
  if (!holder._attribute_names.includes(place.key) && place.key in holder) {
    throw new Error(`SHARE_VALUE: "${place.key}" is a reserved name and cannot be created in the ${place.kind} of ${nodeLabel(node)}`);
  }
  holder.mod_attr(place.key, value); // a no-op when the place already holds this model
};

export const NODE_ALGORITHMS: AlgorithmDefinition[] = [
  createAlgorithm({
    name: 'FIRST_NODE',
    description: 'Returns the node input, or first node of a node array.',
    inputs: [
      { name: 'nodes', types: ['SpinalNode', 'SpinalNode[]'], description: 'A node, or a list of nodes (the first is returned).', required: true },
    ],
    outputType: 'SpinalNode',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      if (isSpinalNode(input)) return input;
      if (isNodeArray(input)) {
        if (input.length === 0) throw new Error('No SpinalNode input provided');
        return input[0];
      }
      throw new Error('Expected SpinalNode or SpinalNode[] input');
    },
  }),
  createAlgorithm({
    name: 'MERGE_NODES',
    description:
      'Merges several node inputs into a single SpinalNode array. Each input may be a node or a ' +
      'node array — they are flattened (one level) into one list, in input order. Use it to combine ' +
      'e.g. children from two different relations. Set "deduplicate" to remove nodes that appear ' +
      'more than once (by id). Returns [] when nothing is wired.',
    inputs: [
      { name: 'nodes', types: ['SpinalNode', 'SpinalNode[]'], description: 'Two or more nodes and/or node arrays to merge.', required: true, variadic: true },
    ],
    outputType: 'SpinalNode[]',
    parameters: [
      { name: 'deduplicate', type: 'boolean', description: 'If true, keep each node only once (by id), preserving first occurrence. Default false (plain concatenation).', default: false, required: false },
    ],
    run: async (input, params): AlgorithmRunResult => {
      // Variadic collapse: 0 -> [], 1 -> the value as-is, 2+ -> array of the inputs.
      const items: unknown[] = Array.isArray(input) ? input : [input];
      const merged: SpinalNode<any>[] = [];
      for (const item of items) {
        if (isNodeArray(item)) merged.push(...item);      // node array (empty spreads nothing)
        else if (isSpinalNode(item)) merged.push(item);   // single node
        else throw new Error('MERGE_NODES: each input must be a SpinalNode or a SpinalNode[]');
      }

      const deduplicate = params?.deduplicate === true || params?.deduplicate === 'true';
      if (!deduplicate) return merged;

      const seen = new Set<string>();
      return merged.filter((node) => {
        const id = node.getId().get();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    },
  }),
  createAlgorithm({
    name: 'GET_CONTEXT',
    description:
      'Returns the context (SpinalContext) with the given name from the graph. ' +
      'Takes no input — the context is looked up by the "name" parameter. ' +
      'Throws if no context with that name exists.',
    inputs: [],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'name', type: 'string', description: 'The name of the context to fetch.', required: true },
    ],
    run: async (_input, params): AlgorithmRunResult => {
      const name = params?.name;
      if (typeof name !== 'string' || name.length === 0) {
        throw new Error('GET_CONTEXT requires a non-empty "name" parameter');
      }
      const context = SpinalGraphService.getContext(name);
      if (!context) {
        throw new Error(`GET_CONTEXT: no context found with name "${name}"`);
      }
      return context as unknown as SpinalNode<any>;
    },
  }),
  createAlgorithm({
    name: 'GET_NODE_SERVER_ID',
    description: 'Returns the ID of a SpinalNode.',
    inputs: [
      { name: 'node', types: ['SpinalNode'], description: 'The node whose server id to return.', required: true },
    ],
    outputType: 'number',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');
      return input._server_id;
    },
  }),
  createAlgorithm({
    name: 'GET_NODE_BY_SERVER_ID',
    description:
      'Returns the node with the given server id — the reverse of GET_NODE_SERVER_ID. Give the id in the ' +
      '"serverId" parameter, or wire it (a number or a numeric text, e.g. read from an Excel cell or an ' +
      'attribute). A node this organ has already loaded is returned at once; any other is loaded from the hub. ' +
      'For a list of ids, use a FOREACH.',
    inputs: [
      { name: 'serverId', types: ['number', 'string'], description: 'Optional dynamic server id; when wired, it overrides the "serverId" parameter.', required: false },
    ],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'serverId', type: 'number', description: 'Server id of the node (unless the serverId input is wired).', required: false },
      NOT_FOUND_PARAM,
    ],
    run: async (input, params): AlgorithmRunResult => {
      const notFound = resolveNotFoundPolicy(params?.ifNotFound, 'GET_NODE_BY_SERVER_ID');
      const serverId = resolveServerId(input, params?.serverId);
      const model = await loadByServerId(serverId);
      if (model === undefined) {
        if (notFound === 'null') return null as any;
        throw new Error(`GET_NODE_BY_SERVER_ID: no node with server id ${serverId}`);
      }
      if (!isSpinalNode(model)) {
        const kind = (model as any)?.constructor?.name ?? typeof model;
        throw new Error(`GET_NODE_BY_SERVER_ID: server id ${serverId} is a ${kind}, not a node`);
      }
      // Blocks reading nodes by id (tickets, …) go through SpinalGraphService: register it.
      SpinalGraphService._addNode(model);
      return model;
    },
  }),
  createAlgorithm({
    name: 'SET_NODE_INFO',
    description:
      'Sets a property on a node\'s info to a dynamic value input. Takes 2 inputs: [node, value]. ' +
      'The property key comes from the "property" parameter. Creates the property if it does not ' +
      'exist, otherwise updates it in place (e.g. rename a node by setting "name"). These info ' +
      'properties are what FILTER_NODE / FIND_NODE match on. Returns the node for chaining. ' +
      'The "id" property is protected and cannot be changed.',
    inputs: [
      { name: 'node', types: ['SpinalNode'], description: 'The node whose info to update.', required: true },
      { name: 'value', types: ['any'], description: 'The value to set on the info property.', required: true },
    ],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'property', type: 'string', description: 'The info property key to set (e.g. "name").', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!Array.isArray(input) || input.length < 2) {
        throw new Error('SET_NODE_INFO expects 2 inputs: [node, value]');
      }
      const node = input[0];
      const value = input[1];
      if (!isSpinalNode(node)) {
        throw new Error('SET_NODE_INFO: first input must be a SpinalNode');
      }
      setNodeInfoProperty(node, params?.property as string, value, 'SET_NODE_INFO');
      return node;
    },
  }),
  createAlgorithm({
    name: 'SET_NODE_INFO_PARAM',
    description:
      'Sets a property on a node\'s info to a static parameter value. Takes 1 input: the node, and ' +
      '"property" + "value" parameters. Creates the property if it does not exist, otherwise updates ' +
      'it in place (e.g. rename a node by setting "name"). These info properties are what FILTER_NODE ' +
      '/ FIND_NODE match on. Returns the node for chaining. The "id" property is protected and cannot ' +
      'be changed.',
    inputs: [
      { name: 'node', types: ['SpinalNode'], description: 'The node whose info to update.', required: true },
    ],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'property', type: 'string', description: 'The info property key to set (e.g. "name").', required: true },
      { name: 'value', type: 'string', description: 'The value to set. Numeric strings ("42") and "true"/"false"/"null" are coerced to their real type, so a new numeric property becomes a Val (number). Pass a genuine string via SET_NODE_INFO (dynamic) if you need "42" to stay text.', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!isSpinalNode(input)) {
        throw new Error('SET_NODE_INFO_PARAM expects a SpinalNode input');
      }
      if (params?.value === undefined) {
        throw new Error('SET_NODE_INFO_PARAM requires a "value" parameter');
      }
      // Coerce numeric/boolean/null strings to their real JS type so a NEW property
      // gets the right model type (number -> Val, boolean -> Bool). For an existing
      // property, the model re-coerces to its own type anyway.
      setNodeInfoProperty(input, params?.property as string, parseValue(params.value), 'SET_NODE_INFO_PARAM');
      return input;
    },
  }),
  createAlgorithm({
    name: 'GET_NODE_CHILDREN',
    description:
      'Returns the children of a node — or of every node of a list, merged without duplicates. The optional ' +
      '"regex" limits which relations are followed (e.g. the tickets of several steps).',
    inputs: [
      { name: 'node', types: ['SpinalNode', 'SpinalNode[]'], description: 'The node, or list of nodes, whose children to return.', required: true },
    ],
    outputType: 'SpinalNode[]',
    parameters: [
      { name: 'regex', type: 'string', description: 'Regex pattern to relation used to get children nodes', required: false },

    ],
    run: async (input, params): AlgorithmRunResult => {
      const nodes = asNodeList(input, 'GET_NODE_CHILDREN');
      const regex = params?.regex ? new RegExp(String(params.regex)) : undefined;
      return mergeUnique(await Promise.all(nodes.map((node) => node.getChildren(regex))));
    },
  }),
  createAlgorithm({
    name: 'GET_NODE_PARENTS',
    description:
      'Returns the parents of a node — or of every node of a list, merged without duplicates. The optional ' +
      '"regex" limits which relations are followed.',
    inputs: [
      { name: 'node', types: ['SpinalNode', 'SpinalNode[]'], description: 'The node, or list of nodes, whose parents to return.', required: true },
    ],
    outputType: 'SpinalNode[]',
    parameters: [
      { name: 'regex', type: 'string', description: 'Regex pattern to relation used to get parent nodes', required: false }
    ],
    run: async (input, params): AlgorithmRunResult => {
      const nodes = asNodeList(input, 'GET_NODE_PARENTS');
      const regex = params?.regex ? new RegExp(String(params.regex)) : undefined;
      return mergeUnique(await Promise.all(nodes.map((node) => node.getParents(regex))));
    },
  }),
  createAlgorithm({
    name: 'FIND_IN_CONTEXT',
    description:
      'Finds every node of a given "type" — and/or whose property matches "regexFilter" — under a start node, ' +
      'at any depth, following only the relations registered in a context (like SpinalNode.findInContext). ' +
      'E.g. all the tickets of a ticket context, the steps of a process, the rooms of a building in the ' +
      'spatial context. The start node itself is not returned; with a list of start nodes the results are ' +
      'merged without duplicates. Leave "contextName" empty when the start node is the context itself.',
    inputs: [
      { name: 'start', types: ['SpinalNode', 'SpinalNode[]'], description: 'Where to search from: the context itself, or a node (or list of nodes) of the context.', required: true },
    ],
    outputType: 'SpinalNode[]',
    parameters: [
      { name: 'type', type: 'string', description: 'Node type to find, matched exactly (e.g. "SpinalSystemServiceTicketTypeTicket").', required: false },
      { name: 'filterProperty', type: 'string', description: 'Info property tested by "regexFilter" (default "name").', default: 'name', required: false },
      { name: 'regexFilter', type: 'string', description: 'Regex the property must match, e.g. "^(?!Terminées$)" for every name except "Terminées".', required: false },
      { name: 'contextName', type: 'string', description: 'Context to search in. Leave empty when the start node is the context itself.', required: false },
    ],
    run: async (input, params): AlgorithmRunResult => {
      const starts = asNodeList(input, 'FIND_IN_CONTEXT');
      const type = typeof params?.type === 'string' ? params.type.trim() : '';
      const rawRegex = typeof params?.regexFilter === 'string' ? params.regexFilter : '';
      if (!type && !rawRegex) {
        throw new Error('FIND_IN_CONTEXT needs a "type" and/or a "regexFilter" (it would otherwise return every node under the start)');
      }
      let regex: RegExp | undefined;
      try {
        regex = rawRegex ? new RegExp(rawRegex) : undefined;
      } catch (error) {
        throw new Error(`FIND_IN_CONTEXT: invalid "regexFilter" /${rawRegex}/: ${error instanceof Error ? error.message : String(error)}`);
      }
      const propName = typeof params?.filterProperty === 'string' && params.filterProperty.trim() !== ''
        ? params.filterProperty.trim()
        : 'name';
      const contextName = typeof params?.contextName === 'string' ? params.contextName.trim() : '';
      const namedContext = contextName ? SpinalGraphService.getContext(contextName) : undefined;
      if (contextName && !namedContext) throw new Error(`FIND_IN_CONTEXT: no context named "${contextName}" is loaded`);

      const matches = (node: SpinalNode<any>): boolean => {
        if (type && node.getType().get() !== type) return false;
        if (!regex) return true;
        const value: unknown = node.info[propName]?.get?.();
        return typeof value === 'string' && regex.test(value);
      };

      const found = await Promise.all(starts.map(async (start) => {
        let context: SpinalContext<any>;
        if (namedContext) {
          const contextId = namedContext.getId().get();
          if (start.getId().get() !== contextId && !start.getContextIds().includes(contextId)) {
            throw new Error(`FIND_IN_CONTEXT: ${nodeLabel(start)} does not belong to context "${contextName}"`);
          }
          context = namedContext;
        } else if (start instanceof SpinalContext) {
          context = start;
        } else {
          throw new Error(`FIND_IN_CONTEXT: ${nodeLabel(start)} is not a context — set "contextName" to the context to search in`);
        }
        const startId = start.getId().get();
        return start.findInContext(context, (node: SpinalNode<any>) => node.getId().get() !== startId && matches(node));
      }));
      return mergeUnique(found);
    },
  }),
  createAlgorithm({
    name: 'GET_NODE_INFO',
    description:
      'Reads one field of a node\'s info: "name" (default), "type", "id", "server_id" or any other ' +
      'info key. Returns the plain value (string / number / boolean), or null when the key is absent. ' +
      'The usual first step of a predicate on a node — e.g. GET_NODE_INFO "type" → EQUALS_PARAM ' +
      '"geographicRoom", or GET_NODE_INFO "name" → MATCHES_REGEX "^Bureau".',
    inputs: [
      { name: 'node', types: ['SpinalNode'], description: 'The node to read.', required: true },
    ],
    outputType: 'any',
    parameters: [
      { name: 'property', type: 'string', description: 'Info key to read (default "name").', default: 'name', required: false },
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('GET_NODE_INFO expects a SpinalNode input');
      const property = typeof params?.property === 'string' && params.property.trim() !== ''
        ? params.property.trim()
        : 'name';
      if (property === 'server_id') return ((input as any)._server_id ?? null) as any;
      const raw = (input.info as any)?.[property];
      if (raw === undefined || raw === null) return null as any;
      const value = typeof raw?.get === 'function' ? raw.get() : raw;
      return (value === undefined ? null : value) as any;
    },
  }),
  createAlgorithm({
    name: 'GET_NODE_CHILD',
    description:
      'Shortcut for GET_NODE_CHILDREN + FIND_NODE: returns the first child of the input node whose ' +
      'property matches a regex. The optional "regex" limits which relations are traversed; ' +
      '"filterProperty" (default "name") and "regexFilter" select the child. Fails if none matches, ' +
      'unless "ifNotFound" is "null".',
    inputs: [
      { name: 'node', types: ['SpinalNode'], description: 'The node whose children to search.', required: true },
    ],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'regex', type: 'string', description: 'Optional regex on the relation name to limit which children are traversed.', required: false },
      { name: 'filterProperty', type: 'string', description: 'Info property to match on (default "name").', default: 'name', required: false },
      { name: 'regexFilter', type: 'string', description: 'Regex the property value must match to select the child.', required: true },
      NOT_FOUND_PARAM,
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('GET_NODE_CHILD expects a SpinalNode input');
      const rawRegexFilter = params?.regexFilter;
      if (typeof rawRegexFilter !== 'string' || rawRegexFilter.length === 0) {
        throw new Error('GET_NODE_CHILD requires a non-empty "regexFilter" parameter');
      }
      const relationRegex = params?.regex ? new RegExp(String(params.regex)) : undefined;
      const propName = typeof params?.filterProperty === 'string' && params.filterProperty.length > 0
        ? params.filterProperty
        : 'name';
      const regexFilter = new RegExp(rawRegexFilter);

      const children = await input.getChildren(relationRegex);
      const found = findNodeByProperty(children, propName, regexFilter);
      if (!found) {
        if (resolveNotFoundPolicy(params?.ifNotFound, 'GET_NODE_CHILD') === 'null') return null as any;
        throw new Error(`GET_NODE_CHILD: no child found with ${propName} =~ /${rawRegexFilter}/`);
      }
      return found;
    },
  }),
  createAlgorithm({
    name: 'GET_NODE_PARENT',
    description:
      'Shortcut for GET_NODE_PARENTS + FIND_NODE: returns the first parent of the input node whose ' +
      'property matches a regex. The optional "regex" limits which relations are traversed; ' +
      '"filterProperty" (default "name") and "regexFilter" select the parent. Fails if none matches, ' +
      'unless "ifNotFound" is "null".',
    inputs: [
      { name: 'node', types: ['SpinalNode'], description: 'The node whose parents to search.', required: true },
    ],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'regex', type: 'string', description: 'Optional regex on the relation name to limit which parents are traversed.', required: false },
      { name: 'filterProperty', type: 'string', description: 'Info property to match on (default "name").', required: false },
      { name: 'regexFilter', type: 'string', description: 'Regex the property value must match to select the parent.', required: true },
      NOT_FOUND_PARAM,
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('GET_NODE_PARENT expects a SpinalNode input');
      const rawRegexFilter = params?.regexFilter;
      if (typeof rawRegexFilter !== 'string' || rawRegexFilter.length === 0) {
        throw new Error('GET_NODE_PARENT requires a non-empty "regexFilter" parameter');
      }
      const relationRegex = params?.regex ? new RegExp(String(params.regex)) : undefined;
      const propName = typeof params?.filterProperty === 'string' && params.filterProperty.length > 0
        ? params.filterProperty
        : 'name';
      const regexFilter = new RegExp(rawRegexFilter);

      const parents = await input.getParents(relationRegex);
      const found = findNodeByProperty(parents, propName, regexFilter);
      if (!found) {
        if (resolveNotFoundPolicy(params?.ifNotFound, 'GET_NODE_PARENT') === 'null') return null as any;
        throw new Error(`GET_NODE_PARENT: no parent found with ${propName} =~ /${rawRegexFilter}/`);
      }
      return found;
    },
  }),

  createAlgorithm({
    name: 'FILTER_NODE',
    description: 'Filter Nodes based on specified criteria.',
    inputs: [
      { name: 'nodes', types: ['SpinalNode', 'SpinalNode[]'], description: 'A node or list of nodes to filter.', required: true },
    ],
    outputType: 'SpinalNode[]',
    parameters: [
      { name: 'filterProperty', type: 'string', description: 'Name of the info property ( must be in the info of the node)', required: true },
      { name: 'regexFilter', type: 'string', description: 'Regex pattern to filter by', required: true }

    ],
    run: async (input, params): AlgorithmRunResult => {
      const nodes = isSpinalNode(input)
        ? [input]
        : isNodeArray(input)
          ? input
          : (() => {
            throw new Error('Expected SpinalNode or SpinalNode[] input');
          })();

      const rawRegexFilter = params?.regexFilter;
      if (typeof rawRegexFilter !== 'string' || rawRegexFilter.length === 0) {
        throw new Error('Invalid or missing regexFilter parameter');
      }

      const rawPropName = params?.filterProperty;
      if (typeof rawPropName !== 'string' || rawPropName.length === 0) {
        throw new Error('Invalid or missing filterProperty parameter');
      }

      const regexFilter = new RegExp(rawRegexFilter);
      const propName = rawPropName;

      return nodes.filter(node => {
        const infoProp = node.info[propName];
        if (!infoProp || typeof infoProp.get !== 'function') return false;
        const info: unknown = infoProp.get();
        const matchesName = typeof info === 'string' && regexFilter.test(info);
        return matchesName;
      });
    },
  }),

  createAlgorithm({
    name: 'FIND_NODE',
    description:
      'Returns the first node matching the specified criteria (like FILTER_NODE but returns a single ' +
      'node). Fails if none matches, unless "ifNotFound" is "null".',
    inputs: [
      { name: 'nodes', types: ['SpinalNode', 'SpinalNode[]'], description: 'A node or list of nodes to search.', required: true },
    ],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'filterProperty', type: 'string', description: 'Name of the info property (must be in the info of the node)', required: true },
      { name: 'regexFilter', type: 'string', description: 'Regex pattern to filter by', required: true },
      NOT_FOUND_PARAM,
    ],
    run: async (input, params): AlgorithmRunResult => {
      const nodes = isSpinalNode(input)
        ? [input]
        : isNodeArray(input)
          ? input
          : (() => {
            throw new Error('Expected SpinalNode or SpinalNode[] input');
          })();

      const rawRegexFilter = params?.regexFilter;
      if (typeof rawRegexFilter !== 'string' || rawRegexFilter.length === 0) {
        throw new Error('Invalid or missing regexFilter parameter');
      }

      const rawPropName = params?.filterProperty;
      if (typeof rawPropName !== 'string' || rawPropName.length === 0) {
        throw new Error('Invalid or missing filterProperty parameter');
      }

      const regexFilter = new RegExp(rawRegexFilter);
      const propName = rawPropName;

      const found = nodes.find(node => {
        const infoProp = node.info[propName];
        if (!infoProp || typeof infoProp.get !== 'function') return false;
        const info: unknown = infoProp.get();
        return typeof info === 'string' && regexFilter.test(info);
      });

      if (!found) {
        if (resolveNotFoundPolicy(params?.ifNotFound, 'FIND_NODE') === 'null') return null as any;
        throw new Error(`No node found matching ${propName} =~ /${rawRegexFilter}/`);
      }
      return found;
    },
  }),

  createAlgorithm({
    name: 'ENDPOINT_NODE_CURRENT_VALUE',
    category: 'ENDPOINT',
    description: 'For a node representing an endpoint, returns the current value.',
    inputs: [
      { name: 'endpoint', types: ['SpinalNode'], description: 'The endpoint node whose current value to read.', required: true },
    ],
    outputType: 'any', // Can be number, boolean , string, etc. depending on the endpoint
    parameters: [
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');
      const nodeElement = await input.element?.load();
      if (!nodeElement) throw new Error('Node has no element to load');
      const currentValue = nodeElement.currentValue;
      if (currentValue === undefined) throw new Error('Node element has no currentValue');
      return currentValue.get();
    }
  }),

  createAlgorithm({
    name: 'ENDPOINT_NODE_CURRENT_VALUE_MODEL',
    category: 'ENDPOINT',
    description:
      'For a node representing an endpoint, returns the bindable currentValue MODEL ' +
      '(not the primitive value). Use this to populate an input register that a COV ' +
      'trigger can bind on to react to value changes.',
    inputs: [
      { name: 'endpoint', types: ['SpinalNode'], description: 'The endpoint node whose current value model to return.', required: true },
    ],
    outputType: 'any', // The underlying spinal model wrapping the value (bindable)
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      if (!isSpinalNode(input)) throw new Error('Expected SpinalNode input');
      const nodeElement = await input.element?.load();
      if (!nodeElement) throw new Error('Node has no element to load');
      const currentValue = nodeElement.currentValue;
      if (currentValue === undefined) throw new Error('Node element has no currentValue');
      return currentValue;
    }
  }),

  createAlgorithm({
    name: 'SET_ENDPOINT_VALUE',
    category: 'ENDPOINT',
    description:
      'Sets the current value of an endpoint node. Takes 2 inputs: [endpointNode, value]. ' +
      'Returns the value that was set.',
    inputs: [
      { name: 'endpoint', types: ['SpinalNode'], description: 'The endpoint node to update.', required: true },
      { name: 'value', types: ['any'], description: 'The value to set on the endpoint.', required: true },
    ],
    outputType: 'any',
    parameters: [
      { name: 'updateDirectModificationDate', type: 'boolean', description: UPDATE_DIRECT_MODIFICATION_DATE_DESC, default: false, required: false },
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!Array.isArray(input) || input.length < 2) {
        throw new Error('SET_ENDPOINT_VALUE expects 2 inputs: [endpointNode, value]');
      }
      const node = input[0];
      const value = input[1];
      if (!isSpinalNode(node)) {
        throw new Error('SET_ENDPOINT_VALUE: first input must be a SpinalNode');
      }
      const nodeElement = await (node as SpinalNode<any>).element?.load();
      if (!nodeElement) throw new Error('SET_ENDPOINT_VALUE: node has no element to load');
      const currentValue = nodeElement.currentValue;
      if (currentValue === undefined) {
        throw new Error('SET_ENDPOINT_VALUE: node element has no currentValue');
      }
      currentValue.set(value);
      if (resolveBooleanFlag(params?.updateDirectModificationDate, false)) {
        touchDirectModificationDate(node);
      }
      return value as any;
    },
  }),

  createAlgorithm({
    name: 'SET_ENDPOINT_VALUE_PARAM',
    category: 'ENDPOINT',
    description:
      'Sets the current value of an endpoint node to a static parameter value. ' +
      'Takes 1 input: endpointNode, and a "value" parameter. Returns the value that was set.',
    inputs: [
      { name: 'endpoint', types: ['SpinalNode'], description: 'The endpoint node to update.', required: true },
    ],
    outputType: 'any',
    parameters: [
      { name: 'value', type: 'string', description: 'The value to set (string, number, or boolean)', required: true },
      { name: 'updateDirectModificationDate', type: 'boolean', description: UPDATE_DIRECT_MODIFICATION_DATE_DESC, default: false, required: false },
    ],
    run: async (input, params): AlgorithmRunResult => {
      if (!isSpinalNode(input)) {
        throw new Error('SET_ENDPOINT_VALUE_PARAM expects a SpinalNode input');
      }
      const value = params?.value;
      if (value === undefined) {
        throw new Error('SET_ENDPOINT_VALUE_PARAM requires a "value" parameter');
      }
      const nodeElement = await input.element?.load();
      if (!nodeElement) throw new Error('SET_ENDPOINT_VALUE_PARAM: node has no element to load');
      const currentValue = nodeElement.currentValue;
      if (currentValue === undefined) {
        throw new Error('SET_ENDPOINT_VALUE_PARAM: node element has no currentValue');
      }
      currentValue.set(value);
      if (resolveBooleanFlag(params?.updateDirectModificationDate, false)) {
        touchDirectModificationDate(input);
      }
      return value as any;
    },
  }),

  createAlgorithm({
    name: 'CREATE_NODE',
    description:
      'Creates a node and links it under a parent node — a node that is not linked into the graph is ' +
      'never saved, so creation always attaches it. Give its "name" (or wire a dynamic name, e.g. from ' +
      'FORMAT_STRING), its "type", and the "relationName" from the parent to it. Analytics run again on ' +
      'every trigger, so by default a child with the same name and type already under that relation is ' +
      'reused instead of creating a duplicate (see "ifExists"). Set "contextName" to register the link in a ' +
      'context, so the node shows in that context\'s tree in the BOS; leave it empty for a plain link. Returns ' +
      'the node — new or reused — for chaining (SET_NODE_INFO_PARAM, SET_ATTRIBUTE_PARAM, LINK_NODES, …).',
    inputs: [
      { name: 'parent', types: ['SpinalNode'], description: 'The node the new node is linked under.', required: true },
      { name: 'name', types: ['string', 'number'], description: 'Optional dynamic name; when wired, it overrides the "name" parameter.', required: false },
    ],
    outputType: 'SpinalNode',
    parameters: [
      { name: 'name', type: 'string', description: 'Name of the node (unless the name input is wired).', required: false },
      { name: 'type', type: 'string', description: 'Type of the node, e.g. "geographicRoomGroup" or a custom type.', required: true },
      RELATION_NAME_PARAM,
      RELATION_TYPE_PARAM,
      CONTEXT_NAME_PARAM,
      {
        name: 'ifExists',
        type: 'string',
        description:
          'When a child with the same name and type already exists under the relation: "reuse" (default — ' +
          'return it), "error" (fail), or "allow" (create another one anyway).',
        options: ['reuse', 'error', 'allow'],
        default: 'reuse',
        required: false,
      },
    ],
    run: async (input, params): AlgorithmRunResult => {
      // One wired input → the parent itself; with the name input wired too → [parent, name]. A name
      // is never a node, which is what tells the two apart from a list of nodes wired as the parent.
      const [parentInput, dynamicName]: unknown[] =
        Array.isArray(input) && input.length === 2 && isSpinalNode(input[0]) && !isSpinalNode(input[1])
          ? (input as unknown[])
          : [input];
      if (isNodeArray(parentInput)) {
        throw new Error('CREATE_NODE expects ONE parent node, got a list — wrap it in a FOREACH to create one node per parent');
      }
      if (!isSpinalNode(parentInput)) throw new Error('CREATE_NODE expects a SpinalNode parent');
      const parent: SpinalNode<any> = parentInput;

      const name = [dynamicName, params?.name]
        .map((value) => (typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''))
        .find((value) => value.length > 0);
      if (!name) throw new Error('CREATE_NODE needs a name: set the "name" parameter or wire the name input');
      const type = typeof params?.type === 'string' ? params.type.trim() : '';
      if (!type) throw new Error('CREATE_NODE requires a non-empty "type" parameter');
      const ifExists = resolveIfExists(params?.ifExists);

      // Everything that can fail is resolved before anything is created.
      const relationName = requireRelationName(params, 'CREATE_NODE');
      const relationType = resolveRelationType(parent, relationName, params?.relationType, 'CREATE_NODE');
      const context = resolveLinkContext(parent, params?.contextName, 'CREATE_NODE');

      const create = async (): Promise<SpinalNode<any>> => {
        const node = SpinalGraphService.getRealNode(SpinalGraphService.createNode({ name, type }, undefined));
        await addLink(parent, node, relationName, relationType, context);
        return node;
      };
      if (ifExists === 'allow') return create();

      // Get-or-create, serialized per (parent, relation, type, name) so parallel FOREACH
      // iterations cannot both miss the lookup and create the node twice.
      return withKeyLock(`create|${parent.getId().get()}|${relationName}|${type}|${name}`, async () => {
        const existing = (await parent.getChildren(relationName))
          .find((child) => child.getName().get() === name && child.getType().get() === type);
        if (!existing) return create();
        if (ifExists === 'error') {
          throw new Error(`CREATE_NODE: ${nodeLabel(parent)} already has a "${type}" named "${name}" under "${relationName}"`);
        }
        if (context) ensureLinkInContext(parent, existing, relationName, context);
        return existing;
      });
    },
  }),

  createAlgorithm({
    name: 'LINK_NODES',
    description:
      'Links a child node — or every node of a list — under a parent node through the "relationName" ' +
      'relation (e.g. put the rooms kept by a FILTER into a group). Idempotent: a child already linked ' +
      'under that relation is not linked again, so re-running the analytic never fails or duplicates. Set ' +
      '"contextName" to register the links in a context, so the children show in its tree in the BOS; leave ' +
      'it empty for plain links. Refuses to link a node to itself, or under its own child through the same ' +
      'relation (a cycle). Takes 2 inputs: [parent, child(ren)]; returns the child input unchanged, for chaining.',
    inputs: [
      { name: 'parent', types: ['SpinalNode'], description: 'The node to link under.', required: true },
      { name: 'child', types: ['SpinalNode', 'SpinalNode[]'], description: 'The node, or list of nodes, to link under the parent.', required: true },
    ],
    outputType: 'any',
    parameters: [RELATION_NAME_PARAM, RELATION_TYPE_PARAM, CONTEXT_NAME_PARAM],
    run: async (input, params, context): AlgorithmRunResult => {
      // A lone list of two nodes wired as the parent would look exactly like [parent, child];
      // the executor's wired-input count tells them apart.
      const wired = context?.inputCount;
      if ((wired !== undefined && wired !== 2) || !Array.isArray(input) || input.length !== 2) {
        throw new Error('LINK_NODES expects 2 inputs: [parent, child(ren)] — wire both the parent and the child');
      }
      const [parentInput, childInput] = input as unknown[];
      if (!isSpinalNode(parentInput)) throw new Error('LINK_NODES expects a SpinalNode parent');
      const parent: SpinalNode<any> = parentInput;
      const children: SpinalNode<any>[] = isSpinalNode(childInput)
        ? [childInput]
        : isNodeArray(childInput)
          ? childInput
          : (() => {
            throw new Error('LINK_NODES expects a SpinalNode or a list of SpinalNodes as the child');
          })();

      const relationName = requireRelationName(params, 'LINK_NODES');
      const parentId = parent.getId().get();

      // Structural errors first — they are the real problem whatever the relation / context settings.
      for (const child of children) {
        if (child.getId().get() === parentId) throw new Error(`LINK_NODES: cannot link ${nodeLabel(parent)} to itself`);
        if (await isLinked(child, parentId, relationName)) {
          throw new Error(
            `LINK_NODES: ${nodeLabel(child)} is already the parent of ${nodeLabel(parent)} through ` +
            `"${relationName}" — linking it the other way would create a cycle`
          );
        }
      }

      const relationType = resolveRelationType(parent, relationName, params?.relationType, 'LINK_NODES');
      const linkContext = resolveLinkContext(parent, params?.contextName, 'LINK_NODES');

      for (const child of children) {
        const childId = child.getId().get();
        // Check-then-link, serialized per (parent, relation, child). Unserialized, parallel links of
        // the same child all pass the library's own duplicate check (the id is only recorded after an
        // await) and the relation silently ends up holding the child several times.
        await withKeyLock(`link|${parentId}|${relationName}|${childId}`, async () => {
          if (await isLinked(parent, childId, relationName)) {
            if (linkContext) ensureLinkInContext(parent, child, relationName, linkContext);
            return;
          }
          await addLink(parent, child, relationName, relationType, linkContext);
        });
      }
      return childInput as any;
    },
  }),

  createAlgorithm({
    name: 'SHARE_VALUE',
    description:
      'Makes two nodes hold the SAME value instead of two copies: the target\'s property becomes the ' +
      'source\'s, so a write on either node — by an analytic, the BOS, or a connector — shows on both at ' +
      'once, with nothing to re-run (e.g. a node created under a room sharing the "element.currentValue" ' +
      'of an endpoint, or two nodes sharing an attribute). Name the value with "sourceProperty": ' +
      '"element.<key>", "attr.<Category>.<Label>" or "info.<key>"; it lands at the same place on the target ' +
      'unless "targetProperty" says otherwise, and that place is created when missing. The target\'s own ' +
      'value there is replaced — best done right after CREATE_NODE, before anything watches the target. ' +
      'An attribute can only share a text value. Running it again changes nothing. Takes 2 inputs: ' +
      '[source, target]; returns the target node, for chaining.',
    inputs: [
      { name: 'source', types: ['SpinalNode'], description: 'The node that owns the value — it is kept as is.', required: true },
      { name: 'target', types: ['SpinalNode'], description: 'The node that gets the shared value — its own value at that place is replaced.', required: true },
    ],
    outputType: 'SpinalNode',
    parameters: [
      {
        name: 'sourceProperty',
        type: 'string',
        description:
          'The value to share, on the source node: "element.currentValue" (an endpoint\'s value), ' +
          '"attr.<Category>.<Label>" (an attribute) or "info.<key>" (an info property, e.g. "info.name").',
        required: true,
      },
      {
        name: 'targetProperty',
        type: 'string',
        description: 'Where the value goes on the target node, in the same form. Leave empty to use the same place as on the source.',
        required: false,
      },
    ],
    run: async (input, params, context): AlgorithmRunResult => {
      // Two wired inputs, told apart from a lone list of two nodes by the executor's wired-input count.
      const wired = context?.inputCount;
      if ((wired !== undefined && wired !== 2) || !Array.isArray(input) || input.length !== 2) {
        throw new Error('SHARE_VALUE expects 2 inputs: [source, target] — wire both nodes');
      }
      const [source, target] = input as unknown[];
      if (!isSpinalNode(source) || !isSpinalNode(target)) {
        throw new Error('SHARE_VALUE expects two SpinalNodes: [source, target] — for a list of targets, wrap it in a FOREACH');
      }

      const from = parseValuePlace(params?.sourceProperty, 'sourceProperty');
      const rawTarget = params?.targetProperty;
      const to = typeof rawTarget === 'string' && rawTarget.trim() !== '' ? parseValuePlace(rawTarget, 'targetProperty') : from;
      if (source.getId().get() === target.getId().get() && isSamePlace(from, to)) {
        throw new Error(`SHARE_VALUE: ${from.text} of ${nodeLabel(source)} cannot be shared with itself — wire two nodes, or give another "targetProperty"`);
      }

      const value = await readValueModel(source, from);
      if (value === undefined) {
        throw new Error(`SHARE_VALUE: ${nodeLabel(source)} has no ${from.text} — ${await describeAvailableValues(source, from)}`);
      }
      if (!(value instanceof Obj)) {
        throw new Error(`SHARE_VALUE: ${from.text} of ${nodeLabel(source)} is not a single value (text, number or boolean) — an object, a list or a pointer cannot be shared`);
      }
      // An attribute rewrites a value that is not text with a new model on its next write, which
      // would silently drop the share — so, as in the API, only text may be shared into one.
      if (to.kind === 'attr' && !(value instanceof Str)) {
        throw new Error(
          `SHARE_VALUE: ${from.text} of ${nodeLabel(source)} is a ${typeof value.get()}, and an attribute can only share a text ` +
          `value — share it into "element.<key>" or "info.<key>" of the target instead`
        );
      }

      await withKeyLock(`share|${target.getId().get()}|${to.text}`, () => writeValueModel(target, to, value));
      return target;
    },
  }),
];
