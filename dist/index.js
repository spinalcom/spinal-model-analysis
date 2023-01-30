"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRACK_METHOD = exports.ANALYTIC_RESULT_TYPE = exports.ALGORITHMS = exports.ENTITY_TYPES = exports.TrackedVariableMethod = exports.EntityType = exports.AnalysisProcess = exports.Analytic = exports.spinalAnalyticService = void 0;
const Analytic_1 = require("./models/Analytic");
Object.defineProperty(exports, "Analytic", { enumerable: true, get: function () { return Analytic_1.Analytic; } });
const AnalysisProcess_1 = require("./models/AnalysisProcess");
Object.defineProperty(exports, "AnalysisProcess", { enumerable: true, get: function () { return AnalysisProcess_1.AnalysisProcess; } });
const EntityType_1 = require("./models/EntityType");
Object.defineProperty(exports, "EntityType", { enumerable: true, get: function () { return EntityType_1.EntityType; } });
const TrackedVariableMethod_1 = require("./models/TrackedVariableMethod");
Object.defineProperty(exports, "TrackedVariableMethod", { enumerable: true, get: function () { return TrackedVariableMethod_1.TrackedVariableMethod; } });
const constants_1 = require("./constants");
Object.defineProperty(exports, "ANALYTIC_RESULT_TYPE", { enumerable: true, get: function () { return constants_1.ANALYTIC_RESULT_TYPE; } });
Object.defineProperty(exports, "ALGORITHMS", { enumerable: true, get: function () { return constants_1.ALGORITHMS; } });
Object.defineProperty(exports, "TRACK_METHOD", { enumerable: true, get: function () { return constants_1.TRACK_METHOD; } });
Object.defineProperty(exports, "ENTITY_TYPES", { enumerable: true, get: function () { return constants_1.ENTITY_TYPES; } });
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