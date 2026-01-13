"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigModel = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
class ConfigModel extends spinal_core_connectorjs_type_1.Model {
    constructor(nodeInfo) {
        super();
        this.add_attr(nodeInfo);
    }
}
exports.ConfigModel = ConfigModel;
spinal_core_connectorjs_type_1.spinalCore.register_models(ConfigModel);
exports.default = ConfigModel;
//# sourceMappingURL=ConfigModel.js.map