import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { ITrackedVariableMethod } from "../interfaces/ITrackedVariableMethod";



class TrackedVariableMethod extends Model {
   constructor(trackedVariable: ITrackedVariableMethod) {
      super();
      this.add_attr(trackedVariable);
   }
}



spinalCore.register_models([TrackedVariableMethod]);
export default TrackedVariableMethod;
export {
   TrackedVariableMethod
}