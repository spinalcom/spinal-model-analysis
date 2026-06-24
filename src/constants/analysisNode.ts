import { ANALYSIS_CONTEXT_NODE_TYPE } from './analysisContext';
import { IConcurrencyConfig, AnalysisStatus } from '../interfaces/IAnalysisConfigJSON';

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
