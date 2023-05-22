import { IRequiredParameter } from "./IRequiredParameter";
export interface IAlgorithm {
    name: string;
    inputTypes: string[];
    outputType: string;
    description:string;
    requiredParams: IRequiredParameter[];
    run: (input: any|any[], params?:any) => any;
    
}