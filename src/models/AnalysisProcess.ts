import { spinalCore, Model } from "spinal-core-connectorjs_type";
import { IAnalysisProcess } from "../interfaces/IAnalysisProcess";



class AnalysisProcess extends Model {
   constructor(analysisProcess: IAnalysisProcess) {
      super();
      this.add_attr(analysisProcess);
   }
}



spinalCore.register_models([AnalysisProcess]);
export default AnalysisProcess;
export {
    AnalysisProcess
}