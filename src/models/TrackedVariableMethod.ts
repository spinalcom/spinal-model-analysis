import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { ITrackedVariableMethod } from "../interfaces/ITrackedVariableMethod";
import { TRACKED_VARIABLE_METHOD_TYPE } from "../constants";



class TrackedVariableMethod extends Model {
   constructor(trackedVariable: ITrackedVariableMethod) {
      super();
      this.add_attr(trackedVariable);
      this.add_attr({type: TRACKED_VARIABLE_METHOD_TYPE});
   }
}



spinalCore.register_models(TrackedVariableMethod);
export default TrackedVariableMethod;
export {
   TrackedVariableMethod
}