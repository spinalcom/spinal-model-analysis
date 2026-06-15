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
/**
 * Describes a single configurable field of a trigger type.
 * Mirrors the shape of algorithm parameters so consumers (e.g. the analytics
 * builder web app) can render trigger forms the same way they render block params.
 */
export interface ITriggerTypeField {
    /** Field key as it appears in the trigger config JSON (e.g. "intervalTimeMs") */
    name: string;
    /** Primitive type expected for the field */
    type: 'string' | 'number' | 'boolean';
    /** Human-readable explanation of the field */
    description: string;
    /** Whether the field is mandatory for this trigger type */
    required: boolean;
}
/**
 * Describes a trigger type and the fields needed to configure it.
 */
export interface ITriggerTypeDefinition {
    /** The trigger type */
    type: TRIGGER_TYPE;
    /** Human-readable explanation of when/how this trigger fires */
    description: string;
    /** The fields a config of this type accepts (including common ones like "id") */
    fields: ITriggerTypeField[];
}
/**
 * Field schema for each trigger type, used by clients to build trigger configs.
 *
 * Keep this in sync with ITriggerConfigJSON (the accepted config shape) and
 * AnalysisTriggerService.normalizeTriggerConfig (which fields each type requires).
 */
export declare const TRIGGER_TYPE_DEFINITIONS: ITriggerTypeDefinition[];
