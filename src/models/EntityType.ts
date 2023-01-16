import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { IEntityType } from "../interfaces/IEntityType";



class EntityType extends Model {
   constructor(entityType: IEntityType) {
      super();
      this.add_attr(entityType);
   }
}



spinalCore.register_models([EntityType]);
export default EntityType;
export {
    EntityType
}