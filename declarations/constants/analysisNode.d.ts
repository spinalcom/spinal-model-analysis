import { IConcurrencyConfig, AnalysisStatus, ConcurrencyMode, ErrorPolicy } from '../interfaces/IAnalysisConfigJSON';
export declare const ANALYSIS_NODE_TYPE = "analysisNode";
export declare const ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION: string;
/**
 * Documentation-attribute category holding the work-node concurrency config on the
 * analysis node. Stored as visible/editable attributes (like trigger configs) rather
 * than in node.info, so it shows up in the SpinalCom attributes panel. Read at
 * execution time to decide how the resolved work nodes are dispatched.
 */
export declare const CONCURRENCY_CATEGORY = "concurrency";
/** Attribute label holding the concurrency mode (BOUNDED | FULL | SEQUENTIAL). */
export declare const CONCURRENCY_ATTR_MODE = "mode";
/** Attribute label holding the BOUNDED-mode parallelism limit. */
export declare const CONCURRENCY_ATTR_LIMIT = "limit";
/** Default max number of work nodes executed in parallel in BOUNDED mode. */
export declare const DEFAULT_CONCURRENCY_LIMIT = 10;
/**
 * Effective concurrency applied when an analysis has no stored concurrency config
 * (e.g. omitted in the JSON, or created before this feature existed).
 */
export declare const DEFAULT_CONCURRENCY: Required<IConcurrencyConfig>;
/**
 * Documentation-attribute category holding the analysis lifecycle status, stored
 * as a visible/editable attribute on the analysis node (like the concurrency
 * config). The analysis organ reads it at startup to decide whether to start
 * triggers / do COV binding for the analysis.
 */
export declare const STATUS_CATEGORY = "status";
/** Attribute label holding the lifecycle status (Active | Inactive). */
export declare const STATUS_ATTR = "status";
/** The two valid lifecycle statuses. */
export declare const ANALYSIS_STATUS_VALUES: readonly AnalysisStatus[];
/**
 * Status applied when an analysis has no stored status (omitted in the JSON, or
 * created before this feature existed). Defaults to Inactive so analytics are
 * parked until explicitly activated.
 */
export declare const DEFAULT_ANALYSIS_STATUS: AnalysisStatus;
/**
 * Documentation-attribute category holding the analysis error policy, stored as a
 * visible/editable attribute on the analysis node (like the concurrency config / status).
 * Read at execution time to decide whether a block failure aborts the whole workflow
 * (`stop`) or is isolated to its downstream cone while independent branches continue (`continue`).
 */
export declare const ERROR_POLICY_CATEGORY = "errorPolicy";
/** Attribute label holding the error policy (stop | continue). */
export declare const ERROR_POLICY_ATTR = "policy";
/** The two valid error policies. */
export declare const ERROR_POLICY_VALUES: readonly ErrorPolicy[];
/**
 * Error policy applied when an analysis has no stored policy (omitted in the JSON, or
 * created before this feature existed). Defaults to `continue` — a failed block isolates
 * to its downstream cone and independent branches keep running (resilient by default).
 */
export declare const DEFAULT_ERROR_POLICY: ErrorPolicy;
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
export declare const CONCURRENCY_MODE_DEFINITIONS: IConcurrencyModeDefinition[];
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
export declare const ANALYSIS_STATUS_DEFINITIONS: IAnalysisStatusDefinition[];
/**
 * Describes a selectable error policy.
 */
export interface IErrorPolicyDefinition {
    /** The policy value. */
    value: ErrorPolicy;
    /** Human-readable explanation of what the policy does. */
    description: string;
    /** Whether this is the value applied when none is specified. */
    default: boolean;
}
/**
 * The available error policies. Keep in sync with ErrorPolicy.
 */
export declare const ERROR_POLICY_DEFINITIONS: IErrorPolicyDefinition[];
