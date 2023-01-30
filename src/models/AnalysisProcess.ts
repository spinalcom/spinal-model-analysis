import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { IAnalysisProcess } from "../interfaces/IAnalysisProcess";
import { ANALYSIS_PROCESS_TYPE } from "../constants";



class AnalysisProcess extends Model {
   constructor(analysisProcess: IAnalysisProcess) {
      super();
      this.add_attr(analysisProcess);
      
      //this.add_attr({type: ANALYSIS_PROCESS_TYPE});

   }
}



spinalCore.register_models(AnalysisProcess);
export default AnalysisProcess;
export {
    AnalysisProcess
}