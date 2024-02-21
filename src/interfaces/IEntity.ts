import { ENTITY_TYPES } from '../constants';
/**
 * @property {string} name - The name of the entity type e.g. "Bâtiment / Etage / Pièce"
 * @property {string} standard_name - The standard name of the entity type e.g. "Buildings / Floors / Rooms"
 * @property {string} entityType - The entity type of the entity type
 * @property {string} description - The description of the entity type
 * @export
 * @interface IEntity
 */
export interface IEntity {
  name: string;
  standard_name: string;
  entityType: ENTITY_TYPES;
  description: string;
  [key: string]: string;
}
