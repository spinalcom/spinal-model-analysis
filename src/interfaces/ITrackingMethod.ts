import { TRACK_METHOD } from '../constants';

/**
 * @property {string} trackMethod - The method used to track the variable
 * @export
 * @interface ITrackingMethod
 */
export interface ITrackingMethod {
  trackMethod: TRACK_METHOD;
  filterValue?: string;
  [key: string]: string | undefined;
}
