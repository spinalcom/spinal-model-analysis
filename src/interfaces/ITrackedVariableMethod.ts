import { TRACK_METHOD } from "../constants";

/**
 * @property {string} trackMethod - The method used to track the variable
 * @property {string} description - The description of the node
 * @export
 * @interface ITrackedVariableMethod
 */
export interface ITrackedVariableMethod {
    trackMethod: TRACK_METHOD;
    [key: string]: string;
}