import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { ITrackingMethod } from "../interfaces/ITrackingMethod";



class TrackingMethodModel extends Model {
   constructor(trackingMethod: any) {
      super();
      this.add_attr(trackingMethod);
   }
}



spinalCore.register_models(TrackingMethodModel);
export default TrackingMethodModel;
export {
   TrackingMethodModel
}