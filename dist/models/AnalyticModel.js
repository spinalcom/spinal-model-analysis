"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticModel = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
class AnalyticModel extends spinal_core_connectorjs_type_1.Model {
    constructor(analytic) {
        super();
        this.add_attr(analytic);
    }
}
exports.AnalyticModel = AnalyticModel;
spinal_core_connectorjs_type_1.spinalCore.register_models(AnalyticModel);
exports.default = AnalyticModel;
//# sourceMappingURL=AnalyticModel.js.map