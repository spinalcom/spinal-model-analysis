/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { AxiosResponse } from 'axios';
import { stringify } from 'qs';

export default class TwilioManagerService {
  /**
   * The Twilio phone number to use for sending SMS messages.
   *
   * @private
   * @type {(string)}
   * @memberof AnalyticService
   */
  private twilioFromNumber: string;
  /**
   * The Twilio account SID to use for sending SMS messages.
   *
   * @private
   * @type {(string)}
   * @memberof AnalyticService
   */
  private twilioAccountSid: string;
  /**
   * The Twilio auth token to use for sending SMS messages.
   *
   * @private
   * @type {(string)}
   * @memberof AnalyticService
   */
  private twilioAuthToken: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.twilioAccountSid = accountSid;
    this.twilioAuthToken = authToken;
    this.twilioFromNumber = fromNumber;
  }

  public async sendMessage(
    message: string,
    toNumber: string,
    entityName: string
  ): Promise<AxiosResponse<any, any>> {
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
      data: stringify(data),
      url,
    };

    const axiosResult = await axios(config);
    return axiosResult;
  }
}
