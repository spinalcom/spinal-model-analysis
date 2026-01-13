import { AxiosResponse } from 'axios';
export default class TwilioManagerService {
    /**
     * The Twilio phone number to use for sending SMS messages.
     *
     * @private
     * @type {(string)}
     * @memberof AnalyticService
     */
    private twilioFromNumber;
    /**
     * The Twilio account SID to use for sending SMS messages.
     *
     * @private
     * @type {(string)}
     * @memberof AnalyticService
     */
    private twilioAccountSid;
    /**
     * The Twilio auth token to use for sending SMS messages.
     *
     * @private
     * @type {(string)}
     * @memberof AnalyticService
     */
    private twilioAuthToken;
    constructor(accountSid: string, authToken: string, fromNumber: string);
    sendMessage(message: string, toNumber: string, entityName: string): Promise<AxiosResponse<any, any>>;
}
