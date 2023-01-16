/**
 * @property {string} name - The name of the entity type e.g. "Bâtiment / Etage / Pièce"
 * @property {string} description - The description of the entity type
 * @property {string} key - Any additional attribute
 * @export
 * @interface ITrackedVariableMethod
 */
export interface ITrackedVariableMethod {
    trackMethod: string;
    type: string;
    [key: string]: string;
}
