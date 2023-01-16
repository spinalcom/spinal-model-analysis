import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { IAnalytic } from "../interfaces/IAnalytic";



class Analytic extends Model {
   constructor(analytic: IAnalytic) {
      super();
      this.add_attr(analytic);
   }
}



spinalCore.register_models([Analytic]);
export default Analytic;
export {
   Analytic
}