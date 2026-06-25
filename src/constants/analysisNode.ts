import { ANALYSIS_CONTEXT_NODE_TYPE } from './analysisContext';
import { IConcurrencyConfig, AnalysisStatus, ConcurrencyMode } from '../interfaces/IAnalysisConfigJSON';

export const ANALYSIS_NODE_TYPE = 'analysisNode';
export const ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION = ANALYSIS_CONTEXT_NODE_TYPE + 'Has' + ANALYSIS_NODE_TYPE;

/**
 * Documentation-attribute category holding the work-node concurrency config on the
 * analysis node. Stored as visible/editable attributes (like trigger configs) rather
 * than in node.info, so it shows up in the SpinalCom attributes panel. Read at
 * execution time to decide how the resolved work nodes are dispatched.
 */
export const CONCURRENCY_CATEGORY = 'concurrency';
/** Attribute label holding the concurrency mode (BOUNDED | FULL | SEQUENTIAL). */
export const CONCURRENCY_ATTR_MODE = 'mode';
/** Attribute label holding the BOUNDED-mode parallelism limit. */
export const CONCURRENCY_ATTR_LIMIT = 'limit';

/** Default max number of work nodes executed in parallel in BOUNDED mode. */
export const DEFAULT_CONCURRENCY_LIMIT = 10;

/**
 * Effective concurrency applied when an analysis has no stored concurrency config
 * (e.g. omitted in the JSON, or created before this feature existed).
 */
export const DEFAULT_CONCURRENCY: Required<IConcurrencyConfig> = {
    mode: 'BOUNDED',
    limit: DEFAULT_CONCURRENCY_LIMIT,
};

/**
 * Documentation-attribute category holding the analysis lifecycle status, stored
 * as a visible/editable attribute on the analysis node (like the concurrency
 * config). The analysis organ reads it at startup to decide whether to start
 * triggers / do COV binding for the analysis.
 */
export const STATUS_CATEGORY = 'status';
/** Attribute label holding the lifecycle status (Active | Inactive). */
export const STATUS_ATTR = 'status';

/** The two valid lifecycle statuses. */
export const ANALYSIS_STATUS_VALUES: readonly AnalysisStatus[] = ['Active', 'Inactive'];

/**
 * Status applied when an analysis has no stored status (omitted in the JSON, or
 * created before this feature existed). Defaults to Inactive so analytics are
 * parked until explicitly activated.
 */
export const DEFAULT_ANALYSIS_STATUS: AnalysisStatus = 'Inactive';

// ─────────────────────────────────────────────────────────────────────────────
//  CLIENT-FACING OPTION DEFINITIONS
//  Metadata describing the selectable analytic-level options (concurrency, status)
//  and their sub-fields/defaults, so clients (the analytics-builder web app) can
//  render forms generically — the same way TRIGGER_TYPE_DEFINITIONS drives the
//  trigger forms. These are the single source of truth for the option values.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Describes a single configurable sub-field of a concurrency mode. Mirrors the
 * shape of ITriggerTypeField so the web app can reuse the same field renderer.
 */
export interface IConcurrencyModeField {
    /** Field key as it appears in the concurrency config JSON (e.g. "limit"). */
    name: string;
    /** Primitive type expected for the field. */
    type: 'string' | 'number' | 'boolean';
    /** Human-readable explanation of the field. */
    description: string;
    /** Whether the field is mandatory for this mode. */
    required: boolean;
    /** Value to pre-fill in the form when none is provided. */
    default?: string | number | boolean;
}

/**
 * Describes a concurrency mode and the fields needed to configure it.
 */
export interface IConcurrencyModeDefinition {
    /** The concurrency mode. */
    mode: ConcurrencyMode;
    /** Human-readable explanation of what the mode does. */
    description: string;
    /** Whether this is the mode applied when none is specified. */
    default: boolean;
    /** The fields a config of this mode accepts. */
    fields: IConcurrencyModeField[];
}

/**
 * The available work-node concurrency modes and their configuration fields.
 * Keep in sync with ConcurrencyMode and AnalyticNodeManagerService.normalizeConcurrency.
 */
export const CONCURRENCY_MODE_DEFINITIONS: IConcurrencyModeDefinition[] = [
    {
        mode: 'BOUNDED',
        description:
            'Run work nodes in parallel, but never more than `limit` at once. The default strategy.',
        default: DEFAULT_CONCURRENCY.mode === 'BOUNDED',
        fields: [
            {
                name: 'limit',
                type: 'number',
                description: 'Maximum number of work nodes executing in parallel.',
                required: false,
                default: DEFAULT_CONCURRENCY_LIMIT,
            },
        ],
    },
    {
        mode: 'FULL',
        description:
            'Run every work node in parallel at once (no cap). Fastest for small sets; can spike external APIs / DB / memory on large sets.',
        default: DEFAULT_CONCURRENCY.mode === 'FULL',
        fields: [],
    },
    {
        mode: 'SEQUENTIAL',
        description:
            'Run one work node at a time. Predictable and gentle on resources, but slow when blocks wait (DELAY, CURL, timeseries).',
        default: DEFAULT_CONCURRENCY.mode === 'SEQUENTIAL',
        fields: [],
    },
];

/**
 * Describes a selectable lifecycle status.
 */
export interface IAnalysisStatusDefinition {
    /** The status value. */
    value: AnalysisStatus;
    /** Human-readable explanation of what the status means. */
    description: string;
    /** Whether this is the value applied when none is specified. */
    default: boolean;
}

/**
 * The available lifecycle statuses. Keep in sync with AnalysisStatus.
 */
export const ANALYSIS_STATUS_DEFINITIONS: IAnalysisStatusDefinition[] = [
    {
        value: 'Active',
        description:
            'The analysis organ runs it: starts its triggers and performs COV binding.',
        default: (DEFAULT_ANALYSIS_STATUS as AnalysisStatus) === 'Active',
    },
    {
        value: 'Inactive',
        description:
            'Parked — stored in the database but not running. The default.',
        default: (DEFAULT_ANALYSIS_STATUS as AnalysisStatus) === 'Inactive',
    },
];
