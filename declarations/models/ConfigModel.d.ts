import { Model } from "spinal-core-connectorjs_type";
import { IConfig } from "../interfaces/IConfig";
declare class ConfigModel extends Model {
    constructor(config: IConfig);
}
export default ConfigModel;
export { ConfigModel };
