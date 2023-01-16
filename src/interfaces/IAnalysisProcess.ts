/**
 * @property {string} name - The name of the process
 * @property {string} type - "analysisProcess"
 * @property {string} description - The description of the entity type
 * @property {string} key - Any additional attribute
 * @export
 * @interface IAnalysisProcess
 */
export interface IAnalysisProcess {
    name: string;
    type: string;
    intervalTime: number;
    description: string;
    [key: string]: string | number;
}