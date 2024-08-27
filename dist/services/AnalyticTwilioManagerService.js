"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const axios_1 = require("axios");
const qs_1 = require("qs");
class TwilioManagerService {
    constructor(accountSid, authToken, fromNumber) {
        this.twilioAccountSid = accountSid;
        this.twilioAuthToken = authToken;
        this.twilioFromNumber = fromNumber;
    }
    sendMessage(message, toNumber, entityName) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;
            const data = {
                Body: `Analytic on ${entityName} triggered with the following message : ${message}`,
                From: this.twilioFromNumber,
                To: toNumber,
            };
            const config = {
                method: 'POST',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                auth: {
                    username: this.twilioAccountSid,
                    password: this.twilioAuthToken,
                },
                data: (0, qs_1.stringify)(data),
                url,
            };
            const axiosResult = yield (0, axios_1.default)(config);
            return axiosResult;
        });
    }
}
exports.default = TwilioManagerService;
//# sourceMappingURL=AnalyticTwilioManagerService.js.map