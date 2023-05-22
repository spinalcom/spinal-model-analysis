import { SpinalServiceTimeseries } from "spinal-model-timeseries"

export class SingletonServiceTimeseries {
    private static instance: SpinalServiceTimeseries = new SpinalServiceTimeseries();
  
    private constructor() {}
  
    public static getInstance(): SpinalServiceTimeseries {
      if (!SingletonServiceTimeseries.instance) {
        SingletonServiceTimeseries.instance = new SpinalServiceTimeseries();
      }
  
      return SingletonServiceTimeseries.instance;
    }
  }