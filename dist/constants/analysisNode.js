"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYSIS_STATUS_DEFINITIONS = exports.CONCURRENCY_MODE_DEFINITIONS = exports.DEFAULT_ANALYSIS_STATUS = exports.ANALYSIS_STATUS_VALUES = exports.STATUS_ATTR = exports.STATUS_CATEGORY = exports.DEFAULT_CONCURRENCY = exports.DEFAULT_CONCURRENCY_LIMIT = exports.CONCURRENCY_ATTR_LIMIT = exports.CONCURRENCY_ATTR_MODE = exports.CONCURRENCY_CATEGORY = exports.ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION = exports.ANALYSIS_NODE_TYPE = void 0;
const analysisContext_1 = require("./analysisContext");
exports.ANALYSIS_NODE_TYPE = 'analysisNode';
exports.ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION = analysisContext_1.ANALYSIS_CONTEXT_NODE_TYPE + 'Has' + exports.ANALYSIS_NODE_TYPE;
/**
 * Documentation-attribute category holding the work-node concurrency config on the
 * analysis node. Stored as visible/editable attributes (like trigger configs) rather
 * than in node.info, so it shows up in the SpinalCom attributes panel. Read at
 * execution time to decide how the resolved work nodes are dispatched.
 */
exports.CONCURRENCY_CATEGORY = 'concurrency';
/** Attribute label holding the concurrency mode (BOUNDED | FULL | SEQUENTIAL). */
exports.CONCURRENCY_ATTR_MODE = 'mode';
/** Attribute label holding the BOUNDED-mode parallelism limit. */
exports.CONCURRENCY_ATTR_LIMIT = 'limit';
/** Default max number of work nodes executed in parallel in BOUNDED mode. */
exports.DEFAULT_CONCURRENCY_LIMIT = 10;
/**
 * Effective concurrency applied when an analysis has no stored concurrency config
 * (e.g. omitted in the JSON, or created before this feature existed).
 */
exports.DEFAULT_CONCURRENCY = {
    mode: 'BOUNDED',
    limit: exports.DEFAULT_CONCURRENCY_LIMIT,
};
/**
 * Documentation-attribute category holding the analysis lifecycle status, stored
 * as a visible/editable attribute on the analysis node (like the concurrency
 * config). The analysis organ reads it at startup to decide whether to start
 * triggers / do COV binding for the analysis.
 */
exports.STATUS_CATEGORY = 'status';
/** Attribute label holding the lifecycle status (Active | Inactive). */
exports.STATUS_ATTR = 'status';
/** The two valid lifecycle statuses. */
exports.ANALYSIS_STATUS_VALUES = ['Active', 'Inactive'];
/**
 * Status applied when an analysis has no stored status (omitted in the JSON, or
 * created before this feature existed). Defaults to Inactive so analytics are
 * parked until explicitly activated.
 */
exports.DEFAULT_ANALYSIS_STATUS = 'Inactive';
/**
 * The available work-node concurrency modes and their configuration fields.
 * Keep in sync with ConcurrencyMode and AnalyticNodeManagerService.normalizeConcurrency.
 */
exports.CONCURRENCY_MODE_DEFINITIONS = [
    {
        mode: 'BOUNDED',
        description: 'Run work nodes in parallel, but never more than `limit` at once. The default strategy.',
        default: exports.DEFAULT_CONCURRENCY.mode === 'BOUNDED',
        fields: [
            {
                name: 'limit',
                type: 'number',
                description: 'Maximum number of work nodes executing in parallel.',
                required: false,
                default: exports.DEFAULT_CONCURRENCY_LIMIT,
            },
        ],
    },
    {
        mode: 'FULL',
        description: 'Run every work node in parallel at once (no cap). Fastest for small sets; can spike external APIs / DB / memory on large sets.',
        default: exports.DEFAULT_CONCURRENCY.mode === 'FULL',
        fields: [],
    },
    {
        mode: 'SEQUENTIAL',
        description: 'Run one work node at a time. Predictable and gentle on resources, but slow when blocks wait (DELAY, CURL, timeseries).',
        default: exports.DEFAULT_CONCURRENCY.mode === 'SEQUENTIAL',
        fields: [],
    },
];
/**
 * The available lifecycle statuses. Keep in sync with AnalysisStatus.
 */
exports.ANALYSIS_STATUS_DEFINITIONS = [
    {
        value: 'Active',
        description: 'The analysis organ runs it: starts its triggers and performs COV binding.',
        default: exports.DEFAULT_ANALYSIS_STATUS === 'Active',
    },
    {
        value: 'Inactive',
        description: 'Parked — stored in the database but not running. The default.',
        default: exports.DEFAULT_ANALYSIS_STATUS === 'Inactive',
    },
];
//# sourceMappingURL=analysisNode.js.map