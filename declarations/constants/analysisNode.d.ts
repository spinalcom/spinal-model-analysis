import { IConcurrencyConfig } from '../interfaces/IAnalysisConfigJSON';
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
