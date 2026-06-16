import { IAlgorithmParameter } from './IAlgorithmParameter';
import { IAlgorithmInput } from './IAlgorithmInput';
export interface IAlgorithm {
    name: string;
    inputs: IAlgorithmInput[];
    outputType: string;
    description: string;
    requiredParams: IAlgorithmParameter[] | string;
    run: (input: any | any[], params?: any) => any;
}
