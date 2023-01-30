/**
 * Interface for the AnalysisProcess node model
 * The interval time is in milliseconds and is the time between each execution of the process
 * e.g if the interval time is 60000, the process will be executed every minute.
 * if the interval time is 0 or negative, the process will be executed in COV (Change of value) mode.
 * It means that the process execution will be bound to each and every change of value of the tracked variables.
 * @property {string} name - The name of the process
 * @property {number} intervalTime - The interval time of the process.
 * @property {string} description - The description of the entity type not necessary.
 * @export
 * @interface IAnalysisProcess
 */
export interface IAnalysisProcess {
    name: string;
    intervalTime: number;
    description: string;
    [key: string]: string | number;
}
