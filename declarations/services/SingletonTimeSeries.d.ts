import { SpinalServiceTimeseries } from 'spinal-model-timeseries';
export declare class SingletonServiceTimeseries {
    private static instance;
    private constructor();
    static getInstance(): SpinalServiceTimeseries;
}
