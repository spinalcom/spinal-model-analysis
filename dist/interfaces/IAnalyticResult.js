"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGChatOrganCardResult = exports.isGChatMessageResult = exports.isResultSuccess = void 0;
const constants_1 = require("../constants");
function isResultSuccess(result) {
    return result.success = true;
}
exports.isResultSuccess = isResultSuccess;
function isGChatMessageResult(result) {
    return result.resultType === constants_1.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE;
}
exports.isGChatMessageResult = isGChatMessageResult;
function isGChatOrganCardResult(result) {
    return result.resultType === constants_1.ANALYTIC_RESULT_TYPE.GCHAT_ORGAN_CARD;
}
exports.isGChatOrganCardResult = isGChatOrganCardResult;
//# sourceMappingURL=IAnalyticResult.js.map