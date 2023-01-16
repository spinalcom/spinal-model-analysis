"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackedVariableMethod = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
class TrackedVariableMethod extends spinal_core_connectorjs_type_1.Model {
    constructor(trackedVariable) {
        super();
        this.add_attr(trackedVariable);
    }
}
exports.TrackedVariableMethod = TrackedVariableMethod;
spinal_core_connectorjs_type_1.spinalCore.register_models([TrackedVariableMethod]);
exports.default = TrackedVariableMethod;
//# sourceMappingURL=TrackedVariableMethod.js.map