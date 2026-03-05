"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.spinalAnalyticNodeManagerService = void 0;
const version_1 = require("./version");
Object.defineProperty(exports, "VERSION", { enumerable: true, get: function () { return version_1.VERSION; } });
const AnalyticNodeManagerService_1 = require("./services/AnalyticNodeManagerService");
const spinalAnalyticNodeManagerService = new AnalyticNodeManagerService_1.default();
exports.spinalAnalyticNodeManagerService = spinalAnalyticNodeManagerService;
exports.default = spinalAnalyticNodeManagerService;
//# sourceMappingURL=index.js.map