"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExitAnalyticError = void 0;
class ExitAnalyticError extends Error {
    constructor(message) {
        super(message);
        this.name = "ExitAlgorithmError";
    }
}
exports.ExitAnalyticError = ExitAnalyticError;
//# sourceMappingURL=Errors.js.map