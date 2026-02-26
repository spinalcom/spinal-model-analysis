import { IAlgorithmParameter } from './IAlgorithmParameter';
export interface IAlgorithm {
    name: string;
    inputTypes: string[];
    outputType: string;
    description: string;
    requiredParams: IAlgorithmParameter[] | string;
    run: (input: any | any[], params?: any) => any;
}
