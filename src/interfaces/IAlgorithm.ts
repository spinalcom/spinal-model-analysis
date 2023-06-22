import { IRequiredParameter } from "./IRequiredParameter";
export interface IAlgorithm {
    name: string;
    inputTypes: string[];
    outputType: string;
    description:string;
    requiredParams: IRequiredParameter[] | string;
    run: (input: any|any[], params?:any) => any;
    
}