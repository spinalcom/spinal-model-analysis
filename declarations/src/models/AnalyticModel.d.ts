import { Model } from "spinal-core-connectorjs_type";
import { IAnalytic } from "../interfaces/IAnalytic";
declare class AnalyticModel extends Model {
    constructor(analytic: IAnalytic);
}
export default AnalyticModel;
export { AnalyticModel };
