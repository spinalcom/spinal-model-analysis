import { LocaleTranslations } from './localize';

/**
 * English display labels for algorithms, keyed by the stable algorithm name.
 *
 * This bundle intentionally provides ONLY `label` (a human-friendly title). The
 * English `description`, input and parameter texts are canonical in the algorithm
 * definitions themselves, so they are NOT duplicated here — localizeAlgorithm falls
 * back to the definition for those, which keeps them from drifting. Add other locale
 * bundles (fr.ts, …) with full text; only English gets to lean on the definitions.
 */
export const EN: LocaleTranslations = {
  // ── number ──
  COPY_FIRST_NUMBER: { label: 'First Number' },
  SUM_NUMBERS: { label: 'Sum' },
  SUBTRACT: { label: 'Subtract' },
  RANDOM_NUMBER: { label: 'Random Number' },
  CONSTANT_NUMBER: { label: 'Constant Number' },
  ADD_PARAM: { label: 'Add' },
  SUBTRACT_PARAM: { label: 'Subtract (by value)' },
  MULTIPLY_PARAM: { label: 'Multiply' },
  DIVIDE_PARAM: { label: 'Divide' },
  POLYNOMIAL: { label: 'Polynomial' },
  AVERAGE_NUMBERS: { label: 'Average' },
  MIN_NUMBERS: { label: 'Minimum' },
  MAX_NUMBERS: { label: 'Maximum' },
  ROUND: { label: 'Round' },
  ABS: { label: 'Absolute Value' },
  CLAMP: { label: 'Clamp' },

  // ── node ──
  FIRST_NODE: { label: 'First Node' },
  MERGE_NODES: { label: 'Merge Nodes' },
  GET_CONTEXT: { label: 'Get Context' },
  GET_NODE_SERVER_ID: { label: 'Node Server ID' },
  SET_NODE_INFO: { label: 'Set Node Info' },
  SET_NODE_INFO_PARAM: { label: 'Set Node Info (constant)' },
  GET_NODE_CHILDREN: { label: 'Node Children' },
  GET_NODE_PARENTS: { label: 'Node Parents' },
  GET_NODE_CHILD: { label: 'Find Child Node' },
  GET_NODE_PARENT: { label: 'Find Parent Node' },
  FILTER_NODE: { label: 'Filter Nodes' },
  FIND_NODE: { label: 'Find Node' },
  ENDPOINT_NODE_CURRENT_VALUE: { label: 'Endpoint Current Value' },
  ENDPOINT_NODE_CURRENT_VALUE_MODEL: { label: 'Endpoint Current Value (Model)' },
  SET_ENDPOINT_VALUE: { label: 'Set Endpoint Value' },
  SET_ENDPOINT_VALUE_PARAM: { label: 'Set Endpoint Value (constant)' },

  // ── node attributes ──
  GET_ATTRIBUTE: { label: 'Get Attribute' },
  SET_ATTRIBUTE: { label: 'Set Attribute' },
  SET_ATTRIBUTE_PARAM: { label: 'Set Attribute (constant)' },
  GET_ALL_ATTRIBUTES: { label: 'Get All Attributes' },
  GET_ATTRIBUTE_MODEL: { label: 'Get Attribute (Model)' },
  GET_ALL_ATTRIBUTE_MODELS: { label: 'Get All Attributes (Models)' },

  // ── flow control ──
  DELAY: { label: 'Delay' },
  IF: { label: 'If / Else' },
  LOG: { label: 'Log' },

  // ── register / execution context ──
  CURRENT_NODE: { label: 'Current Work Node' },
  GET_EXECUTION_REFERENCE_TIME: { label: 'Execution Reference Time' },
  GET_EXECUTION_TRIGGER_TYPE: { label: 'Trigger Type' },
  GET_EXECUTION_TRIGGER_ID: { label: 'Trigger ID' },
  GET_EXECUTION_TRIGGER_INPUT_REGISTER: { label: 'Trigger Input Register' },
  GET_EXECUTION_TRIGGER_THRESHOLD: { label: 'Trigger Threshold' },
  SET_INPUT_REGISTER: { label: 'Set Input Register' },
  FETCH_INPUT_REGISTER: { label: 'Fetch Input Register' },
  ELEMENT: { label: 'Element' },
  FOREACH: { label: 'For Each' },

  // ── boolean ──
  GREATER_THAN: { label: 'Greater Than' },
  LESS_THAN: { label: 'Less Than' },
  BETWEEN: { label: 'Between' },
  NOT_BETWEEN: { label: 'Not Between' },
  DIFFERENCE_THRESHOLD: { label: 'Difference Exceeds' },
  AND: { label: 'And' },
  OR: { label: 'Or' },
  NOT: { label: 'Not' },

  // ── conversion ──
  PARSE_NUMBER: { label: 'Parse Number' },
  BOOLEAN_TO_NUMBER: { label: 'Boolean to Number' },
  NUMBER_TO_BOOLEAN: { label: 'Number to Boolean' },

  // ── object ──
  CREATE_OBJECT: { label: 'Create Object' },
  GET_PROPERTY: { label: 'Get Property' },
  SET_PROPERTY: { label: 'Set Property' },
  SET_PROPERTY_DYNAMIC: { label: 'Set Property (dynamic)' },
  DELETE_PROPERTY: { label: 'Delete Property' },
  MERGE_OBJECTS: { label: 'Merge Objects' },
  HAS_PROPERTY: { label: 'Has Property' },
  GET_KEYS: { label: 'Get Keys' },

  // ── list ──
  CREATE_LIST: { label: 'Create List' },
  LIST_PUSH: { label: 'List Push' },
  LIST_PUSH_PARAM: { label: 'List Push (constant)' },
  LIST_POP: { label: 'List Pop' },
  LIST_SHIFT: { label: 'List Shift' },
  LIST_UNSHIFT: { label: 'List Unshift' },
  LIST_CONCAT: { label: 'List Concat' },
  LIST_GET: { label: 'List Get' },
  LIST_LENGTH: { label: 'List Length' },
  LIST_INCLUDES: { label: 'List Includes' },
  LIST_INDEX_OF: { label: 'List Index Of' },
  LIST_SLICE: { label: 'List Slice' },
  LIST_REVERSE: { label: 'List Reverse' },
  LIST_FLATTEN: { label: 'List Flatten' },
  LIST_UNIQUE: { label: 'List Unique' },

  // ── timeseries ──
  GET_ENDPOINT_TIMESERIES: { label: 'Endpoint Timeseries' },
  TIMESERIES_FIRST: { label: 'Timeseries First' },
  TIMESERIES_LAST: { label: 'Timeseries Last' },
  TIMESERIES_DELTA: { label: 'Timeseries Delta' },
  TIMESERIES_TIME_WEIGHTED_AVERAGE: { label: 'Time-Weighted Average' },
  TIMESERIES_MIN: { label: 'Timeseries Min' },
  TIMESERIES_MAX: { label: 'Timeseries Max' },
  TIMESERIES_AVERAGE: { label: 'Timeseries Average' },
  TIMESERIES_SUM: { label: 'Timeseries Sum' },
  TIMESERIES_COUNT: { label: 'Timeseries Count' },
  PUSH_ENDPOINT_VALUE: { label: 'Push Endpoint Value' },

  // ── http ──
  CURL_REQUEST: { label: 'cURL Request' },

  // ── string ──
  FORMAT_STRING: { label: 'Format String' },

  // ── ticket ──
  CREATE_TICKET: { label: 'Create Ticket' },
  GET_TICKETS_FROM_NODE: { label: 'Get Node Tickets' },
  MOVE_TICKET_TO_NEXT_STEP: { label: 'Move Ticket to Next Step' },
};
