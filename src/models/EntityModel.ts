import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { IEntity } from "../interfaces/IEntity";


class EntityModel extends Model {
   constructor(entity: IEntity) {
      super();
      this.add_attr(entity);
   }
}



spinalCore.register_models(EntityModel);
export default EntityModel;
export {
   EntityModel
}