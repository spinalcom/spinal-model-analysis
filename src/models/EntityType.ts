import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { IEntityType } from "../interfaces/IEntityType";
import { ENTITY_TYPE } from "../constants";


class EntityType extends Model {
   constructor(entityType: IEntityType) {
      super();
      this.add_attr(entityType);
      this.add_attr({type : ENTITY_TYPE })
   }
}



spinalCore.register_models(EntityType);
export default EntityType;
export {
    EntityType
}