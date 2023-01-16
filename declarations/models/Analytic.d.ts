import { Model } from "spinal-core-connectorjs_type";
import { IAnalytic } from "../interfaces/IAnalytic";
declare class Analytic extends Model {
    constructor(analytic: IAnalytic);
}
export default Analytic;
export { Analytic };
