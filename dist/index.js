"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_LOCALES = exports.getLocaleTranslations = exports.localizeAlgorithm = exports.ALGORITHM_TAGS = exports.AlgorithmRegistry = exports.createAlgorithm = exports.TICKET_ALGORITHMS = exports.HTTP_ALGORITHMS = exports.TIMESERIES_ALGORITHMS = exports.STRING_ALGORITHMS = exports.OBJECT_ALGORITHMS = exports.CONVERSION_ALGORITHMS = exports.BOOLEAN_ALGORITHMS = exports.LIST_ALGORITHMS = exports.REGISTER_ALGORITHMS = exports.FLOW_CONTROL_ALGORITHMS = exports.NODE_ATTRIBUTES_ALGORITHMS = exports.NODE_ALGORITHMS = exports.NUMBER_ALGORITHMS = exports.ALGORITHMS = exports.ALGORITHM_REGISTRY = exports.ALGORITHM_DEFINITIONS = exports.TRIGGER_TYPE = exports.foreachItemVirtualId = exports.FOREACH_ITEM_SUFFIX = exports.FOREACH_ITEM_PREFIX = exports.WORK_NODE_RESERVED_ID = exports.AnalysisTriggerService = exports.AnalysisFactoryService = exports.AnalysisExecutionService = exports.WorkflowExecutionService = exports.WorkflowBlockManagerService = exports.AnalyticNodeManagerService = exports.VERSION = exports.spinalAnalysisTriggerService = exports.spinalAnalysisFactoryService = exports.spinalAnalysisExecutionService = exports.spinalWorkflowExecutionService = exports.spinalWorkflowBlockManagerService = exports.spinalAnalyticNodeManagerService = void 0;
const version_1 = require("./version");
Object.defineProperty(exports, "VERSION", { enumerable: true, get: function () { return version_1.VERSION; } });
const AnalyticNodeManagerService_1 = require("./services/AnalyticNodeManagerService");
exports.AnalyticNodeManagerService = AnalyticNodeManagerService_1.default;
const WorkflowBlockManagerService_1 = require("./services/WorkflowBlockManagerService");
exports.WorkflowBlockManagerService = WorkflowBlockManagerService_1.default;
const WorkflowExecutionService_1 = require("./services/WorkflowExecutionService");
exports.WorkflowExecutionService = WorkflowExecutionService_1.default;
const AnalysisExecutionService_1 = require("./services/AnalysisExecutionService");
exports.AnalysisExecutionService = AnalysisExecutionService_1.default;
const AnalysisFactoryService_1 = require("./services/AnalysisFactoryService");
exports.AnalysisFactoryService = AnalysisFactoryService_1.default;
const AnalysisTriggerService_1 = require("./services/AnalysisTriggerService");
exports.AnalysisTriggerService = AnalysisTriggerService_1.default;
const algorithms_1 = require("./algorithms/algorithms");
const spinalAnalyticNodeManagerService = new AnalyticNodeManagerService_1.default();
exports.spinalAnalyticNodeManagerService = spinalAnalyticNodeManagerService;
const spinalWorkflowBlockManagerService = new WorkflowBlockManagerService_1.default();
exports.spinalWorkflowBlockManagerService = spinalWorkflowBlockManagerService;
const spinalWorkflowExecutionService = new WorkflowExecutionService_1.default(algorithms_1.ALGORITHM_REGISTRY);
exports.spinalWorkflowExecutionService = spinalWorkflowExecutionService;
const spinalAnalysisExecutionService = new AnalysisExecutionService_1.default(spinalAnalyticNodeManagerService, algorithms_1.ALGORITHM_REGISTRY);
exports.spinalAnalysisExecutionService = spinalAnalysisExecutionService;
const spinalAnalysisFactoryService = new AnalysisFactoryService_1.default(spinalAnalyticNodeManagerService, spinalWorkflowBlockManagerService);
exports.spinalAnalysisFactoryService = spinalAnalysisFactoryService;
const spinalAnalysisTriggerService = new AnalysisTriggerService_1.default(spinalAnalyticNodeManagerService, algorithms_1.ALGORITHM_REGISTRY);
exports.spinalAnalysisTriggerService = spinalAnalysisTriggerService;
// Execution context & result types
var WorkflowExecutionService_2 = require("./services/WorkflowExecutionService");
Object.defineProperty(exports, "WORK_NODE_RESERVED_ID", { enumerable: true, get: function () { return WorkflowExecutionService_2.WORK_NODE_RESERVED_ID; } });
Object.defineProperty(exports, "FOREACH_ITEM_PREFIX", { enumerable: true, get: function () { return WorkflowExecutionService_2.FOREACH_ITEM_PREFIX; } });
Object.defineProperty(exports, "FOREACH_ITEM_SUFFIX", { enumerable: true, get: function () { return WorkflowExecutionService_2.FOREACH_ITEM_SUFFIX; } });
Object.defineProperty(exports, "foreachItemVirtualId", { enumerable: true, get: function () { return WorkflowExecutionService_2.foreachItemVirtualId; } });
var analysisTrigger_1 = require("./constants/analysisTrigger");
Object.defineProperty(exports, "TRIGGER_TYPE", { enumerable: true, get: function () { return analysisTrigger_1.TRIGGER_TYPE; } });
// Constants
__exportStar(require("./constants/analysisContext"), exports);
__exportStar(require("./constants/analysisNode"), exports);
__exportStar(require("./constants/analysisAnchor"), exports);
__exportStar(require("./constants/analysisExecutionWorkflow"), exports);
__exportStar(require("./constants/analysisInput"), exports);
__exportStar(require("./constants/analysisOutput"), exports);
__exportStar(require("./constants/analysisTrigger"), exports);
__exportStar(require("./constants/analysisWorknodeResolver"), exports);
__exportStar(require("./constants/analysisAlgorithm"), exports);
__exportStar(require("./constants/analysisWorkflowBlock"), exports);
// Algorithms
var algorithms_2 = require("./algorithms/algorithms");
Object.defineProperty(exports, "ALGORITHM_DEFINITIONS", { enumerable: true, get: function () { return algorithms_2.ALGORITHM_DEFINITIONS; } });
Object.defineProperty(exports, "ALGORITHM_REGISTRY", { enumerable: true, get: function () { return algorithms_2.ALGORITHM_REGISTRY; } });
Object.defineProperty(exports, "ALGORITHMS", { enumerable: true, get: function () { return algorithms_2.ALGORITHMS; } });
Object.defineProperty(exports, "NUMBER_ALGORITHMS", { enumerable: true, get: function () { return algorithms_2.NUMBER_ALGORITHMS; } });
Object.defineProperty(exports, "NODE_ALGORITHMS", { enumerable: true, get: function () { return algorithms_2.NODE_ALGORITHMS; } });
Object.defineProperty(exports, "NODE_ATTRIBUTES_ALGORITHMS", { enumerable: true, get: function () { return algorithms_2.NODE_ATTRIBUTES_ALGORITHMS; } });
Object.defineProperty(exports, "FLOW_CONTROL_ALGORITHMS", { enumerable: true, get: function () { return algorithms_2.FLOW_CONTROL_ALGORITHMS; } });
Object.defineProperty(exports, "REGISTER_ALGORITHMS", { enumerable: true, get: function () { return algorithms_2.REGISTER_ALGORITHMS; } });
Object.defineProperty(exports, "LIST_ALGORITHMS", { enumerable: true, get: function () { return algorithms_2.LIST_ALGORITHMS; } });
Object.defineProperty(exports, "BOOLEAN_ALGORITHMS", { enumerable: true, get: function () { return algorithms_2.BOOLEAN_ALGORITHMS; } });
Object.defineProperty(exports, "CONVERSION_ALGORITHMS", { enumerable: true, get: function () { return algorithms_2.CONVERSION_ALGORITHMS; } });
Object.defineProperty(exports, "OBJECT_ALGORITHMS", { enumerable: true, get: function () { return algorithms_2.OBJECT_ALGORITHMS; } });
Object.defineProperty(exports, "STRING_ALGORITHMS", { enumerable: true, get: function () { return algorithms_2.STRING_ALGORITHMS; } });
Object.defineProperty(exports, "TIMESERIES_ALGORITHMS", { enumerable: true, get: function () { return algorithms_2.TIMESERIES_ALGORITHMS; } });
Object.defineProperty(exports, "HTTP_ALGORITHMS", { enumerable: true, get: function () { return algorithms_2.HTTP_ALGORITHMS; } });
Object.defineProperty(exports, "TICKET_ALGORITHMS", { enumerable: true, get: function () { return algorithms_2.TICKET_ALGORITHMS; } });
var core_1 = require("./algorithms/definitions/core");
Object.defineProperty(exports, "createAlgorithm", { enumerable: true, get: function () { return core_1.createAlgorithm; } });
Object.defineProperty(exports, "AlgorithmRegistry", { enumerable: true, get: function () { return core_1.AlgorithmRegistry; } });
var tags_1 = require("./algorithms/definitions/tags");
Object.defineProperty(exports, "ALGORITHM_TAGS", { enumerable: true, get: function () { return tags_1.ALGORITHM_TAGS; } });
// Algorithm metadata localization (i18n)
var localize_1 = require("./i18n/localize");
Object.defineProperty(exports, "localizeAlgorithm", { enumerable: true, get: function () { return localize_1.localizeAlgorithm; } });
Object.defineProperty(exports, "getLocaleTranslations", { enumerable: true, get: function () { return localize_1.getLocaleTranslations; } });
Object.defineProperty(exports, "SUPPORTED_LOCALES", { enumerable: true, get: function () { return localize_1.SUPPORTED_LOCALES; } });
exports.default = spinalAnalysisExecutionService;
//# sourceMappingURL=index.js.map