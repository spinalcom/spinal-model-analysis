"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.algos = exports.findEndpoints = exports.findControlEndpoints = exports.ATTRIBUTE_PHONE_MESSAGE = exports.ATTRIBUTE_PHONE_NUMBER = exports.CATEGORY_ATTRIBUTE_TWILIO_PARAMETERS = exports.CATEGORY_ATTRIBUTE_TRACKING_METHOD_PARAMETERS = exports.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS = exports.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS = exports.CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS = exports.ENTITY_TYPE = exports.CONTEXT_TYPE = exports.TRACK_METHOD = exports.ANALYTIC_TYPE = exports.ANALYTIC_RESULT_TYPE = exports.ENTITY_TYPES = exports.TrackingMethodModel = exports.AnalyticModel = exports.spinalAnalyticService = void 0;
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
Object.defineProperty(exports, "CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS", { enumerable: true, get: function () { return constants_1.CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS; } });
Object.defineProperty(exports, "CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS", { enumerable: true, get: function () { return constants_1.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS; } });
Object.defineProperty(exports, "CATEGORY_ATTRIBUTE_RESULT_PARAMETERS", { enumerable: true, get: function () { return constants_1.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS; } });
Object.defineProperty(exports, "CATEGORY_ATTRIBUTE_TRACKING_METHOD_PARAMETERS", { enumerable: true, get: function () { return constants_1.CATEGORY_ATTRIBUTE_TRACKING_METHOD_PARAMETERS; } });
Object.defineProperty(exports, "CATEGORY_ATTRIBUTE_TWILIO_PARAMETERS", { enumerable: true, get: function () { return constants_1.CATEGORY_ATTRIBUTE_TWILIO_PARAMETERS; } });
Object.defineProperty(exports, "ATTRIBUTE_PHONE_NUMBER", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_PHONE_NUMBER; } });
Object.defineProperty(exports, "ATTRIBUTE_PHONE_MESSAGE", { enumerable: true, get: function () { return constants_1.ATTRIBUTE_PHONE_MESSAGE; } });
const algos = require("./algorithms/algorithms");
exports.algos = algos;
const AnalyticService_1 = require("./services/AnalyticService");
const utils_1 = require("./services/utils");
Object.defineProperty(exports, "findControlEndpoints", { enumerable: true, get: function () { return utils_1.findControlEndpoints; } });
Object.defineProperty(exports, "findEndpoints", { enumerable: true, get: function () { return utils_1.findEndpoints; } });
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