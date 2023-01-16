"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityType = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
class EntityType extends spinal_core_connectorjs_type_1.Model {
    constructor(entityType) {
        super();
        this.add_attr(entityType);
    }
}
exports.EntityType = EntityType;
spinal_core_connectorjs_type_1.spinalCore.register_models([EntityType]);
exports.default = EntityType;
//# sourceMappingURL=EntityType.js.map