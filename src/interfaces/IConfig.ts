import { ANALYTIC_RESULT_TYPE } from "../constants";

/**
 * @property {string} name - The name of the analytic should correspond to the name of the analytic function
 * @property {ANALYTIC_RESULT_TYPE} resultType - The type of the result of the analytic ( e.g. "ticket")
 * @property {string} resultName - The name of the result of the analytic
 * @property {string} description - The description of the analytic
 * @export
 * @interface IConfig
 */
export interface IConfig {
   algorithm: string;
   resultType: ANALYTIC_RESULT_TYPE;
   resultName: string;
   [key: string]: string | number | undefined;
}