import { Model } from "spinal-core-connectorjs_type";
import { IEntityType } from "../interfaces/IEntityType";
declare class EntityType extends Model {
    constructor(entityType: IEntityType);
}
export default EntityType;
export { EntityType };
