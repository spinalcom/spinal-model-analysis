import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { IOutputs } from "../interfaces/IOutputs";


class OutputsModel extends Model {
   constructor(outputInfo: IOutputs) {
      super();
      this.add_attr(outputInfo);

   }
}



spinalCore.register_models(OutputsModel);
export default OutputsModel;
export {
    OutputsModel
}