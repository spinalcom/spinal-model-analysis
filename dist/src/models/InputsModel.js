"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputsModel = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
class InputsModel extends spinal_core_connectorjs_type_1.Model {
    constructor(inputInfo) {
        super();
        this.add_attr(inputInfo);
    }
}
exports.InputsModel = InputsModel;
spinal_core_connectorjs_type_1.spinalCore.register_models(InputsModel);
exports.default = InputsModel;
//# sourceMappingURL=InputsModel.js.map