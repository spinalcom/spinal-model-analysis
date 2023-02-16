import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { IConfig } from "../interfaces/IConfig";


class ConfigModel extends Model {
   constructor(config: IConfig) {
      super();
      this.add_attr(config);
   }
}



spinalCore.register_models(ConfigModel);
export default ConfigModel;
export {
   ConfigModel
}