"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputsModel = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
class OutputsModel extends spinal_core_connectorjs_type_1.Model {
    constructor(outputInfo) {
        super();
        this.add_attr(outputInfo);
    }
}
exports.OutputsModel = OutputsModel;
spinal_core_connectorjs_type_1.spinalCore.register_models(OutputsModel);
exports.default = OutputsModel;
//# sourceMappingURL=OutputsModel.js.map