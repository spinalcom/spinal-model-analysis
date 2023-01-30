import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { IAnalytic } from "../interfaces/IAnalytic";
import { ANALYTIC_TYPE } from "../constants";


class Analytic extends Model {
   constructor(analytic: IAnalytic) {
      super();
      this.add_attr(analytic);
      this.add_attr({type: ANALYTIC_TYPE});
   }
}



spinalCore.register_models(Analytic);
export default Analytic;
export {
   Analytic
}