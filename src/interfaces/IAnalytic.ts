import { ANALYTIC_RESULT_TYPE, ALGORITHMS } from "../constants";

/**
 * @property {string} name - The name of the analytic should correspond to the name of the analytic function
 * @property {ANALYTIC_RESULT_TYPE} resultType - The type of the result of the analytic ( e.g. "ticket")
 * @property {string} resultName - The name of the result of the analytic
 * @property {string} description - The description of the analytic
 * @export
 * @interface IAnalytic
 */
export interface IAnalytic {
   name: ALGORITHMS; 
   resultType: ANALYTIC_RESULT_TYPE;
   resultName: string;
   description: string;
   [key: string]: string;
}