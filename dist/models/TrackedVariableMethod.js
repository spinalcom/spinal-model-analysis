"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackedVariableMethod = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const constants_1 = require("../constants");
class TrackedVariableMethod extends spinal_core_connectorjs_type_1.Model {
    constructor(trackedVariable) {
        super();
        this.add_attr(trackedVariable);
        this.add_attr({ type: constants_1.TRACKED_VARIABLE_METHOD_TYPE });
    }
}
exports.TrackedVariableMethod = TrackedVariableMethod;
spinal_core_connectorjs_type_1.spinalCore.register_models(TrackedVariableMethod);
exports.default = TrackedVariableMethod;
//# sourceMappingURL=TrackedVariableMethod.js.map