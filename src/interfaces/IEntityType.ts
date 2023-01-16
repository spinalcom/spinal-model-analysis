
import {ENTITY_TYPES} from "../constants"
/**
 * @property {string} name - The name of the entity type e.g. "Bâtiment / Etage / Pièce"
 * @property {string} standard_name - The standard name of the entity type e.g. "Buildings / Floors / Rooms"
 * @property {string} type - The type of the entity type "entityType"
 * @property {string} entityType - The entity type of the entity type
 * @property {string} description - The description of the entity type
 * @property {string} key - Any additional attribute
 * @export
 * @interface IEntityType
 */
export interface IEntityType {
    name: string;
    standard_name: string;
    type: string;
    entityType: ENTITY_TYPES ;
    description: string;
    [key: string]: string;
}