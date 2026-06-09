export declare const TRIGGER_NODE_NAME = "Trigger";
export declare const TRIGGER_NODE_TYPE = "analysisTriggerNode";
export declare const ANALYSIS_NODE_TO_TRIGGER_NODE_RELATION: string;
/** Attribute category under which trigger configs are stored on the trigger node */
export declare const TRIGGER_CATEGORY = "triggerConfig";
/** Attribute label holding the JSON-serialized trigger config array */
export declare const TRIGGER_ATTR_CONFIGS = "triggers";
/**
 * Types of triggers that can start an analysis execution.
 */
export declare enum TRIGGER_TYPE {
    /** Periodic execution based on a fixed interval in milliseconds */
    INTERVAL_TIME = "INTERVAL_TIME",
    /** Periodic execution based on a cron expression */
    CRON = "CRON",
    /** Change-of-value: bind on input register models and execute on change */
    COV = "COV"
}
