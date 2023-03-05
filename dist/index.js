"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALGO_DOC = exports.ENTITY_TYPE = exports.CONTEXT_TYPE = exports.TRACK_METHOD = exports.ANALYTIC_TYPE = exports.ANALYTIC_RESULT_TYPE = exports.ALGORITHMS = exports.ENTITY_TYPES = exports.TrackingMethodModel = exports.AnalyticModel = exports.spinalAnalyticService = void 0;
const AnalyticModel_1 = require("./models/AnalyticModel");
Object.defineProperty(exports, "AnalyticModel", { enumerable: true, get: function () { return AnalyticModel_1.AnalyticModel; } });
const TrackingMethodModel_1 = require("./models/TrackingMethodModel");
Object.defineProperty(exports, "TrackingMethodModel", { enumerable: true, get: function () { return TrackingMethodModel_1.TrackingMethodModel; } });
const constants_1 = require("./constants");
Object.defineProperty(exports, "ANALYTIC_RESULT_TYPE", { enumerable: true, get: function () { return constants_1.ANALYTIC_RESULT_TYPE; } });
Object.defineProperty(exports, "ALGORITHMS", { enumerable: true, get: function () { return constants_1.ALGORITHMS; } });
Object.defineProperty(exports, "ALGO_DOC", { enumerable: true, get: function () { return constants_1.ALGO_DOC; } });
Object.defineProperty(exports, "ANALYTIC_TYPE", { enumerable: true, get: function () { return constants_1.ANALYTIC_TYPE; } });
Object.defineProperty(exports, "TRACK_METHOD", { enumerable: true, get: function () { return constants_1.TRACK_METHOD; } });
Object.defineProperty(exports, "ENTITY_TYPES", { enumerable: true, get: function () { return constants_1.ENTITY_TYPES; } });
Object.defineProperty(exports, "CONTEXT_TYPE", { enumerable: true, get: function () { return constants_1.CONTEXT_TYPE; } });
Object.defineProperty(exports, "ENTITY_TYPE", { enumerable: true, get: function () { return constants_1.ENTITY_TYPE; } });
const AnalyticService_1 = require("./services/AnalyticService");
const globalRoot = typeof window === "undefined" ? global : window;
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