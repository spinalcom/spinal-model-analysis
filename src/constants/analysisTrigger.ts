import { ANALYSIS_NODE_TYPE } from "./analysisNode";

export const TRIGGER_NODE_NAME = 'Trigger';
export const TRIGGER_NODE_TYPE = 'analysisTriggerNode';
export const ANALYSIS_NODE_TO_TRIGGER_NODE_RELATION = ANALYSIS_NODE_TYPE + 'Has' + TRIGGER_NODE_TYPE;

/** Attribute category under which trigger configs are stored on the trigger node */
export const TRIGGER_CATEGORY = 'triggerConfig';
/** Attribute label holding the JSON-serialized trigger config array */
export const TRIGGER_ATTR_CONFIGS = 'triggers';

/**
 * Types of triggers that can start an analysis execution.
 */
export enum TRIGGER_TYPE {
    /** Periodic execution based on a fixed interval in milliseconds */
    INTERVAL_TIME = 'INTERVAL_TIME',
    /** Periodic execution based on a cron expression */
    CRON = 'CRON',
    /** Change-of-value: bind on input register models and execute on change */
    COV = 'COV',
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

/** Optional identifier field shared by every trigger type. */
const TRIGGER_ID_FIELD: ITriggerTypeField = {
    name: 'id',
    type: 'string',
    description: 'Optional user-defined identifier for this trigger (e.g. "Trigger1").',
    required: false,
};

/**
 * Field schema for each trigger type, used by clients to build trigger configs.
 *
 * Keep this in sync with ITriggerConfigJSON (the accepted config shape) and
 * AnalysisTriggerService.normalizeTriggerConfig (which fields each type requires).
 */
export const TRIGGER_TYPE_DEFINITIONS: ITriggerTypeDefinition[] = [
    {
        type: TRIGGER_TYPE.INTERVAL_TIME,
        description: 'Fires periodically, every N milliseconds.',
        fields: [
            TRIGGER_ID_FIELD,
            {
                name: 'intervalTimeMs',
                type: 'number',
                description: 'Interval between executions, in milliseconds.',
                required: true,
            },
        ],
    },
    {
        type: TRIGGER_TYPE.CRON,
        description: 'Fires on a cron schedule.',
        fields: [
            TRIGGER_ID_FIELD,
            {
                name: 'cronExpression',
                type: 'string',
                description: 'Cron expression defining the schedule (e.g. "*/2 * * * *").',
                required: true,
            },
        ],
    },
    {
        type: TRIGGER_TYPE.COV,
        description:
            'Change-of-value: binds on an input register model and fires when its value changes.',
        fields: [
            TRIGGER_ID_FIELD,
            {
                name: 'inputRegister',
                type: 'string',
                description:
                    'Name of the input register to bind on (e.g. "I0"). Must be produced by the input workflow.',
                required: true,
            },
            {
                name: 'threshold',
                type: 'number',
                description:
                    'Optional deadband. The trigger fires only when the absolute change exceeds this value.',
                required: false,
            },
        ],
    },
];
