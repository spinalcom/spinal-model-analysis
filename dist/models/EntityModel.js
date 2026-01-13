"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityModel = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
class EntityModel extends spinal_core_connectorjs_type_1.Model {
    constructor(entity) {
        super();
        this.add_attr(entity);
    }
}
exports.EntityModel = EntityModel;
spinal_core_connectorjs_type_1.spinalCore.register_models(EntityModel);
exports.default = EntityModel;
//# sourceMappingURL=EntityModel.js.map