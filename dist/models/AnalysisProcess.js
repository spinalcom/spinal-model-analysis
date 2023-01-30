"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisProcess = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
class AnalysisProcess extends spinal_core_connectorjs_type_1.Model {
    constructor(analysisProcess) {
        super();
        this.add_attr(analysisProcess);
        //this.add_attr({type: ANALYSIS_PROCESS_TYPE});
    }
}
exports.AnalysisProcess = AnalysisProcess;
spinal_core_connectorjs_type_1.spinalCore.register_models(AnalysisProcess);
exports.default = AnalysisProcess;
//# sourceMappingURL=AnalysisProcess.js.map