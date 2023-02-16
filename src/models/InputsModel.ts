import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { IInputs } from "../interfaces/IInputs";

class InputsModel extends Model {
   constructor(inputInfo: IInputs) {
      super();
      this.add_attr(inputInfo);

   }
}



spinalCore.register_models(InputsModel);
export default InputsModel;
export {
    InputsModel
}