import { Model } from "spinal-core-connectorjs_type";
import { IEntity } from "../interfaces/IEntity";
declare class EntityModel extends Model {
    constructor(entity: IEntity);
}
export default EntityModel;
export { EntityModel };
