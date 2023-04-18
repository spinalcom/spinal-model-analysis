import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { IConfig } from "../interfaces/IConfig";


class ConfigModel extends Model {
   constructor(nodeInfo: any) {
      super();
      this.add_attr(nodeInfo);
   }
}



spinalCore.register_models(ConfigModel);
export default ConfigModel;
export {
   ConfigModel
}