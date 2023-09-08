"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYTIC_STATUS = exports.algos = exports.getValueModelFromEntry = exports.findEndpoints = exports.findControlEndpoints = exports.ATTRIBUTE_VALUE_SEPARATOR = exports.ATTRIBUTE_ALARM_PRIORITY = exports.ATTRIBUTE_TICKET_PROCESS_ID = exports.ATTRIBUTE_TICKET_CONTEXT_ID = exports.ATTRIBUTE_TRIGGER_AT_START = exports.ATTRIBUTE_ANALYTIC_DESCRIPTION = exports.ATTRIBUTE_ANALYTIC_STATUS = exports.ATTRIBUTE_RESULT_TYPE = exports.ATTRIBUTE_RESULT_NAME = exports.ATTRIBUTE_SEPARATOR = exports.ATTRIBUTE_TIMESERIES = exports.ATTRIBUTE_FILTER_VALUE = exports.ATTRIBUTE_TRACKING_METHOD = exports.ATTRIBUTE_PHONE_MESSAGE = exports.ATTRIBUTE_PHONE_NUMBER = exports.CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING = exports.CATEGORY_ATTRIBUTE_TRIGGER_PARAMETERS = exports.CATEGORY_ATTRIBUTE_IO_DEPENDENCIES = exports.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS = exports.CATEGORY_ATTRIBUTE_TWILIO_PARAMETERS = exports.CATEGORY_ATTRIBUTE_TRACKING_METHOD_PARAMETERS = exports.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS = exports.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS = exports.CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS = exports.ENTITY_TYPE = exports.CONTEXT_TYPE = exports.TRIGGER_TYPE = exports.TRACK_METHOD = exports.ANALYTIC_TYPE = exports.ANALYTIC_RESULT_TYPE = exports.ENTITY_TYPES = exports.TrackingMethodModel = exports.AnalyticModel = exports.spinalAnalyticService = exports.AnalyticService = void 0;
const AnalyticModel_1 = require("./models/AnalyticModel");
Object.defineProperty(exports, "AnalyticModel", { enumerable: true, get: function () { return AnalyticModel_1.AnalyticModel; } });
const TrackingMethodModel_1 = require("./models/TrackingMethodModel");
Object.defineProperty(exports, "TrackingMethodModel", { enumerable: true, get: function () { return TrackingMethodModel_1.TrackingMethodModel; } });
const constants_1 = require("./constants");
Object.defineProperty(exports, "ANALYTIC_RESULT_TYPE", { enumerable: true, get: function () { return constants_1.ANALYTIC_RESULT_TYPE; } });
Object.defineProperty(exports, "ANALYTIC_TYPE", { enumerable: true, get: function () { return constants_1.ANALYTIC_TYPE; } });
Object.defineProperty(exports, "TRACK_METHOD", { enumerable: true, get: function () { return constants_1.TRACK_METHOD; } });
Object.defineProperty(exports, "ENTITY_TYPES", { enumerable: true, get: function () { return constants_1.ENTITY_TYPES; } });
Object.defineProperty(exports, "CONTEXT_TYPE", { enumerable: true, get: function () { return constants_1.CONTEXT_TYPE; } });
Object.defineProperty(exports, "ENTITY_TYPE", { enumerable: true, get: function () { return constants_1.ENTITY_TYPE; } });
Object.defineProperty(exports, "TRIGGER_TYPE", { enumerable: true, get: function () { return constants_1.TRIGGER_TYPE; } });
Object.defineProperty(exports, "CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS", { enumerable: true, get: function () { return constants_1.CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS; } });
Object.defineProperty(exports, "CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS", { enumerable: true, get: function () { return constants_1.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS; } });
Object.defineProperty(exports, "CATEGORY_ATTRIBUTE_RESULT_PARAMETERS", { enumerable: true, get: function () { return constants_1.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS; } });
Object.defineProperty(exports, "CATEGORY_ATTRIBUTE_TRACKING_METHOD_PARAMETERS", { enumerable: true, get: function () { return constants_1.CATEGORY_ATTRIBUTE_TRACKING_METHOD_PARAMETERS; } });
Object.defineProperty(exports, "CATEGORY_ATTRIBUTE_TWILIO_PARAMETERS", { enumerable: true, get: function () { return constants_1.CATEGORY_ATTRIBUTE_TWILIO_PARAMETERS; } });
Object.defineProperty(exports, "CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS", { enumerable: true, get: function () { return constants_1.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS; } });
Object.defineProperty(exports, "CATEGORY_ATTRIBUTE_IO_DEPENDENCIES", { enumerable: true, get: function () { return constants_1.CATEGORY_ATTRIBUTE_IO_DEPENDENCIES; } });
Object.defineProperty(exports, "CATEGORY_ATTRIBUTE_TRIGGER_PARAMETERS", { enumerable: true, get: function () { return constants_1.CATEGORY_ATTRIBUTE_TRIGGER_PARAMETERS; } });
Object.defineProperty(exports, "CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING", { enumerable: true, get: function () { return constants_1.CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING; } });
Object.defineProperty(exports, "ATTRIBUTE_PHONE_NUMBER", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_PHONE_NUMBER; } });
Object.defineProperty(exports, "ATTRIBUTE_PHONE_MESSAGE", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_PHONE_MESSAGE; } });
Object.defineProperty(exports, "ATTRIBUTE_TRACKING_METHOD", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_TRACKING_METHOD; } });
Object.defineProperty(exports, "ATTRIBUTE_FILTER_VALUE", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_FILTER_VALUE; } });
Object.defineProperty(exports, "ATTRIBUTE_TIMESERIES", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_TIMESERIES; } });
Object.defineProperty(exports, "ATTRIBUTE_SEPARATOR", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_SEPARATOR; } });
Object.defineProperty(exports, "ATTRIBUTE_VALUE_SEPARATOR", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_VALUE_SEPARATOR; } });
Object.defineProperty(exports, "ATTRIBUTE_RESULT_NAME", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_RESULT_NAME; } });
Object.defineProperty(exports, "ATTRIBUTE_RESULT_TYPE", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_RESULT_TYPE; } });
Object.defineProperty(exports, "ATTRIBUTE_ANALYTIC_STATUS", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_ANALYTIC_STATUS; } });
Object.defineProperty(exports, "ATTRIBUTE_ANALYTIC_DESCRIPTION", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_ANALYTIC_DESCRIPTION; } });
Object.defineProperty(exports, "ATTRIBUTE_TRIGGER_AT_START", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_TRIGGER_AT_START; } });
Object.defineProperty(exports, "ATTRIBUTE_TICKET_CONTEXT_ID", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_TICKET_CONTEXT_ID; } });
Object.defineProperty(exports, "ATTRIBUTE_TICKET_PROCESS_ID", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_TICKET_PROCESS_ID; } });
Object.defineProperty(exports, "ATTRIBUTE_ALARM_PRIORITY", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_ALARM_PRIORITY; } });
Object.defineProperty(exports, "ANALYTIC_STATUS", { enumerable: true, get: function () { return constants_1.ANALYTIC_STATUS; } });
const algos = require("./algorithms/algorithms");
exports.algos = algos;
const AnalyticService_1 = require("./services/AnalyticService");
Object.defineProperty(exports, "AnalyticService", { enumerable: true, get: function () { return AnalyticService_1.AnalyticService; } });
const utils_1 = require("./services/utils");
Object.defineProperty(exports, "findControlEndpoints", { enumerable: true, get: function () { return utils_1.findControlEndpoints; } });
Object.defineProperty(exports, "findEndpoints", { enumerable: true, get: function () { return utils_1.findEndpoints; } });
Object.defineProperty(exports, "getValueModelFromEntry", { enumerable: true, get: function () { return utils_1.getValueModelFromEntry; } });
const globalRoot = typeof window === 'undefined' ? global : window;
const spinalAnalyticService = new AnalyticService_1.AnalyticService();
exports.spinalAnalyticService = spinalAnalyticService;
if (typeof globalRoot.spinal === 'undefined')
    globalRoot.spinal = {};
if (typeof globalRoot.spinal.spinalAnalyticService === 'undefined') {
    globalRoot.spinal.spinalAnalyticService = spinalAnalyticService;
}
if (typeof globalRoot.spinal.spinalAnalyticService === 'undefined') {
    globalRoot.spinal.spinalAnalyticService = spinalAnalyticService;
}
exports.default = spinalAnalyticService;
//# sourceMappingURL=index.js.map