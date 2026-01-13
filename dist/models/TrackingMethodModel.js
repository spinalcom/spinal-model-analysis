"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingMethodModel = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
class TrackingMethodModel extends spinal_core_connectorjs_type_1.Model {
    constructor(trackingMethod) {
        super();
        this.add_attr(trackingMethod);
    }
}
exports.TrackingMethodModel = TrackingMethodModel;
spinal_core_connectorjs_type_1.spinalCore.register_models(TrackingMethodModel);
exports.default = TrackingMethodModel;
//# sourceMappingURL=TrackingMethodModel.js.map