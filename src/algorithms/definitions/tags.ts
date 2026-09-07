/**
 * Cross-cutting search tags for algorithms, keyed by the stable algorithm name.
 *
 * The /algorithms API already groups blocks by category (NUMBER, TIMESERIES, …);
 * tags add finer, cross-cutting search terms (e.g. "aggregation" spans number +
 * timeseries + list; "io" spans http + endpoints + registers). They are injected
 * into each definition by createAlgorithm(), so every served algorithm carries its
 * tags. A block may also declare inline `tags` in its definition — those are merged
 * with (and de-duplicated against) the entries here.
 *
 * Keep names in sync with the algorithm definitions; an unknown name here is simply
 * ignored, and a missing entry just yields no tags (graceful).
 */
export const ALGORITHM_TAGS: Record<string, readonly string[]> = {
  // ── boolean ──
  GREATER_THAN: ['boolean', 'comparison', 'threshold'],
  LESS_THAN: ['boolean', 'comparison', 'threshold'],
  BETWEEN: ['boolean', 'comparison', 'range'],
  NOT_BETWEEN: ['boolean', 'comparison', 'range'],
  DIFFERENCE_THRESHOLD: ['boolean', 'comparison', 'threshold'],
  AND: ['boolean', 'logic'],
  OR: ['boolean', 'logic'],
  NOT: ['boolean', 'logic'],

  // ── conversion ──
  PARSE_NUMBER: ['conversion', 'number', 'cast'],
  BOOLEAN_TO_NUMBER: ['conversion', 'number', 'boolean', 'cast'],
  NUMBER_TO_BOOLEAN: ['conversion', 'boolean', 'number', 'cast'],

  // ── flow-control ──
  DELAY: ['flow-control', 'timing'],
  IF: ['flow-control', 'logic', 'conditional', 'branch'],
  LOG: ['flow-control', 'debug', 'logging', 'utility'],

  // ── http ──
  CURL_REQUEST: ['http', 'io', 'request', 'integration'],

  // ── list ──
  CREATE_LIST: ['list', 'json', 'create', 'source'],
  LIST_PUSH: ['list', 'json', 'mutation'],
  LIST_PUSH_PARAM: ['list', 'json', 'mutation'],
  LIST_POP: ['list', 'json', 'mutation'],
  LIST_SHIFT: ['list', 'json', 'mutation'],
  LIST_UNSHIFT: ['list', 'json', 'mutation'],
  LIST_CONCAT: ['list', 'json'],
  LIST_GET: ['list', 'json', 'read', 'access'],
  LIST_LENGTH: ['list', 'json', 'aggregation'],
  LIST_INCLUDES: ['list', 'json', 'search'],
  LIST_INDEX_OF: ['list', 'json', 'search'],
  LIST_SLICE: ['list', 'json'],
  LIST_REVERSE: ['list', 'json'],
  LIST_FLATTEN: ['list', 'json'],
  LIST_UNIQUE: ['list', 'json'],

  // ── node ──
  FIRST_NODE: ['node', 'graph', 'list'],
  MERGE_NODES: ['node', 'graph', 'list', 'merge', 'aggregation'],
  GET_CONTEXT: ['node', 'graph', 'context'],
  GET_NODE_SERVER_ID: ['node', 'graph', 'read'],
  SET_NODE_INFO: ['node', 'graph', 'write', 'info', 'mutation'],
  SET_NODE_INFO_PARAM: ['node', 'graph', 'write', 'info', 'mutation'],
  GET_NODE_CHILDREN: ['node', 'graph', 'traversal', 'children'],
  GET_NODE_PARENTS: ['node', 'graph', 'traversal', 'parents'],
  GET_NODE_CHILD: ['node', 'graph', 'traversal', 'children', 'search'],
  GET_NODE_PARENT: ['node', 'graph', 'traversal', 'parents', 'search'],
  FILTER_NODE: ['node', 'graph', 'filter', 'search'],
  FIND_NODE: ['node', 'graph', 'search', 'filter'],
  ENDPOINT_NODE_CURRENT_VALUE: ['node', 'endpoint', 'read', 'io', 'value'],
  ENDPOINT_NODE_CURRENT_VALUE_MODEL: ['node', 'endpoint', 'read', 'model', 'cov'],
  SET_ENDPOINT_VALUE: ['node', 'endpoint', 'write', 'io', 'value'],
  SET_ENDPOINT_VALUE_PARAM: ['node', 'endpoint', 'write', 'io', 'value'],

  // ── node.attributes ──
  GET_ATTRIBUTE: ['node', 'attribute', 'read'],
  SET_ATTRIBUTE: ['node', 'attribute', 'write'],
  SET_ATTRIBUTE_PARAM: ['node', 'attribute', 'write'],
  GET_ALL_ATTRIBUTES: ['node', 'attribute', 'read'],
  GET_ATTRIBUTE_MODEL: ['node', 'attribute', 'read', 'model'],
  GET_ALL_ATTRIBUTE_MODELS: ['node', 'attribute', 'read', 'model'],

  // ── number ──
  COPY_FIRST_NUMBER: ['number', 'math'],
  SUM_NUMBERS: ['number', 'math', 'aggregation', 'reducer'],
  COMPACT_NUMBERS: ['number', 'array', 'filter', 'clean', 'null'],
  SUBTRACT: ['number', 'math', 'reducer'],
  RANDOM_NUMBER: ['number', 'math', 'random', 'source'],
  CONSTANT_NUMBER: ['number', 'source', 'constant'],
  ADD_PARAM: ['number', 'math'],
  SUBTRACT_PARAM: ['number', 'math'],
  MULTIPLY_PARAM: ['number', 'math'],
  DIVIDE_PARAM: ['number', 'math'],
  POLYNOMIAL: ['number', 'math'],
  AVERAGE_NUMBERS: ['number', 'math', 'aggregation', 'reducer', 'statistics'],
  MIN_NUMBERS: ['number', 'math', 'aggregation', 'reducer', 'statistics'],
  MAX_NUMBERS: ['number', 'math', 'aggregation', 'reducer', 'statistics'],
  ROUND: ['number', 'math', 'rounding'],
  ABS: ['number', 'math'],
  CLAMP: ['number', 'math', 'range'],

  // ── object ──
  CREATE_OBJECT: ['object', 'json', 'create', 'source'],
  GET_PROPERTY: ['object', 'json', 'read', 'access'],
  SET_PROPERTY: ['object', 'json', 'write', 'mutation'],
  SET_PROPERTY_DYNAMIC: ['object', 'json', 'write', 'mutation'],
  DELETE_PROPERTY: ['object', 'json', 'mutation'],
  MERGE_OBJECTS: ['object', 'json'],
  HAS_PROPERTY: ['object', 'json', 'read'],
  GET_KEYS: ['object', 'json', 'read'],

  // ── register / execution context ──
  CURRENT_NODE: ['register', 'context', 'node', 'worknode'],
  GET_EXECUTION_REFERENCE_TIME: ['register', 'context', 'time', 'execution'],
  GET_CURRENT_DATE: ['register', 'context', 'time'],
  GET_EXECUTION_TRIGGER_TYPE: ['register', 'context', 'trigger', 'execution'],
  GET_EXECUTION_TRIGGER_ID: ['register', 'context', 'trigger', 'execution'],
  GET_EXECUTION_TRIGGER_INPUT_REGISTER: ['register', 'context', 'trigger', 'execution'],
  GET_EXECUTION_TRIGGER_THRESHOLD: ['register', 'context', 'trigger', 'execution'],
  SET_INPUT_REGISTER: ['register', 'write', 'io'],
  FETCH_INPUT_REGISTER: ['register', 'read', 'io'],
  ELEMENT: ['register', 'node', 'element'],
  FOREACH: ['register', 'flow-control', 'iteration', 'loop'],

  // ── string ──
  FORMAT_STRING: ['string', 'template', 'format'],

  // ── ticket ──
  CREATE_TICKET: ['ticket', 'create', 'write', 'workflow'],
  GET_TICKETS_FROM_NODE: ['ticket', 'read', 'node'],
  MOVE_TICKET_TO_NEXT_STEP: ['ticket', 'write', 'workflow', 'step'],

  // ── excel ──
  LOAD_EXCEL: ['excel', 'xlsx', 'document', 'file', 'report', 'template', 'read', 'io'],
  GET_EXCEL_VARIABLES: ['excel', 'xlsx', 'report', 'template', 'read'],
  GET_EXCEL_SHEETS: ['excel', 'xlsx', 'read', 'sheet', 'worksheet', 'extract'],
  GET_EXCEL_CELL: ['excel', 'xlsx', 'read', 'cell', 'extract'],
  GET_EXCEL_COLUMN: ['excel', 'xlsx', 'read', 'column', 'extract', 'timeseries'],
  GET_EXCEL_RANGE: ['excel', 'xlsx', 'read', 'range', 'table', 'extract'],
  COLUMNS_TO_TIMESERIES: ['excel', 'timeseries', 'transform', 'extract', 'inject'],
  SET_EXCEL_VARIABLES: ['excel', 'xlsx', 'report', 'template', 'fill', 'write'],
  SET_EXCEL_CELLS: ['excel', 'xlsx', 'report', 'fill', 'write', 'cell'],
  SET_EXCEL_RANGE: ['excel', 'xlsx', 'report', 'fill', 'write', 'range', 'table'],
  SET_EXCEL_COMMENTS: ['excel', 'xlsx', 'report', 'comment', 'note', 'write'],
  ADD_EXCEL_SHEET: ['excel', 'xlsx', 'report', 'sheet', 'worksheet'],
  RENAME_EXCEL_SHEET: ['excel', 'xlsx', 'report', 'sheet', 'worksheet'],
  DELETE_EXCEL_SHEET: ['excel', 'xlsx', 'report', 'sheet', 'worksheet'],
  SAVE_EXCEL_TO_NODE: ['excel', 'xlsx', 'report', 'document', 'file', 'save', 'write', 'io'],
  EXCEL_TO_BASE64: ['excel', 'xlsx', 'report', 'base64', 'export', 'io'],

  // ── timeseries ──
  GET_ENDPOINT_TIMESERIES: ['timeseries', 'endpoint', 'read', 'io', 'history'],
  TIMESERIES_FIRST: ['timeseries', 'reducer', 'aggregation'],
  TIMESERIES_LAST: ['timeseries', 'reducer', 'aggregation'],
  TIMESERIES_DELTA: ['timeseries', 'reducer', 'aggregation', 'energy'],
  TIMESERIES_TIME_WEIGHTED_AVERAGE: ['timeseries', 'reducer', 'aggregation', 'statistics', 'average'],
  TIMESERIES_MIN: ['timeseries', 'reducer', 'aggregation', 'statistics'],
  TIMESERIES_MAX: ['timeseries', 'reducer', 'aggregation', 'statistics'],
  TIMESERIES_AVERAGE: ['timeseries', 'reducer', 'aggregation', 'statistics', 'average'],
  TIMESERIES_SUM: ['timeseries', 'reducer', 'aggregation', 'energy'],
  TIMESERIES_COUNT: ['timeseries', 'reducer', 'aggregation'],
  PUSH_ENDPOINT_VALUE: ['timeseries', 'endpoint', 'write', 'io', 'value'],
  INSERT_TIMESERIES: ['timeseries', 'endpoint', 'write', 'io', 'inject', 'backfill', 'import'],
  GENERATE_TIMESTAMPS: ['timeseries', 'date', 'time', 'generate', 'axis', 'daily', 'schedule'],
  TIMESERIES_DESPIKE: ['timeseries', 'clean', 'filter', 'outlier', 'spike', 'quality', 'meter'],
};
