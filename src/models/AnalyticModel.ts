import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { IAnalytic } from "../interfaces/IAnalytic";

class AnalyticModel extends Model {
   constructor(analytic: IAnalytic) {
      super();
      this.add_attr(analytic);

   }
}



spinalCore.register_models(AnalyticModel);
export default AnalyticModel;
export {
   AnalyticModel
}