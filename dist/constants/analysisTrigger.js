"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRIGGER_TYPE = exports.TRIGGER_ATTR_CONFIGS = exports.TRIGGER_CATEGORY = exports.ANALYSIS_NODE_TO_TRIGGER_NODE_RELATION = exports.TRIGGER_NODE_TYPE = exports.TRIGGER_NODE_NAME = void 0;
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
//# sourceMappingURL=analysisTrigger.js.map