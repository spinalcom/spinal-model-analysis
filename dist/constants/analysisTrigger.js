"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRIGGER_TYPE_DEFINITIONS = exports.TRIGGER_TYPE = exports.TRIGGER_ATTR_CONFIGS = exports.TRIGGER_CATEGORY = exports.ANALYSIS_NODE_TO_TRIGGER_NODE_RELATION = exports.TRIGGER_NODE_TYPE = exports.TRIGGER_NODE_NAME = void 0;
const analysisNode_1 = require("./analysisNode");
exports.TRIGGER_NODE_NAME = 'Trigger';
exports.TRIGGER_NODE_TYPE = 'analysisTriggerNode';
exports.ANALYSIS_NODE_TO_TRIGGER_NODE_RELATION = analysisNode_1.ANALYSIS_NODE_TYPE + 'Has' + exports.TRIGGER_NODE_TYPE;
/** Attribute category under which trigger configs are stored on the trigger node */
exports.TRIGGER_CATEGORY = 'triggerConfig';
/** Attribute label holding the JSON-serialized trigger config array */
exports.TRIGGER_ATTR_CONFIGS = 'triggers';
/**
 * Types of triggers that can start an analysis execution.
 */
var TRIGGER_TYPE;
(function (TRIGGER_TYPE) {
    /** Periodic execution based on a fixed interval in milliseconds */
    TRIGGER_TYPE["INTERVAL_TIME"] = "INTERVAL_TIME";
    /** Periodic execution based on a cron expression */
    TRIGGER_TYPE["CRON"] = "CRON";
    /** Change-of-value: bind on input register models and execute on change */
    TRIGGER_TYPE["COV"] = "COV";
})(TRIGGER_TYPE = exports.TRIGGER_TYPE || (exports.TRIGGER_TYPE = {}));
/** Optional identifier field shared by every trigger type. */
const TRIGGER_ID_FIELD = {
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
exports.TRIGGER_TYPE_DEFINITIONS = [
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
        description: 'Change-of-value: binds on an input register model and fires when its value changes.',
        fields: [
            TRIGGER_ID_FIELD,
            {
                name: 'inputRegister',
                type: 'string',
                description: 'Name of the input register to bind on (e.g. "I0"). Must be produced by the input workflow.',
                required: true,
            },
            {
                name: 'threshold',
                type: 'number',
                description: 'Optional deadband. The trigger fires only when the absolute change exceeds this value.',
                required: false,
            },
        ],
    },
];
//# sourceMappingURL=analysisTrigger.js.map