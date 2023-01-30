"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analytic = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const constants_1 = require("../constants");
class Analytic extends spinal_core_connectorjs_type_1.Model {
    constructor(analytic) {
        super();
        this.add_attr(analytic);
        this.add_attr({ type: constants_1.ANALYTIC_TYPE });
    }
}
exports.Analytic = Analytic;
spinal_core_connectorjs_type_1.spinalCore.register_models(Analytic);
exports.default = Analytic;
//# sourceMappingURL=Analytic.js.map