import { IAnalytic } from "./interfaces/IAnalytic";
import { IAnalysisProcess } from "./interfaces/IAnalysisProcess";
import { IEntityType } from "./interfaces/IEntityType";
import { ITrackedVariableMethod } from "./interfaces/ITrackedVariableMethod";
import { Analytic } from "./models/Analytic";
import { AnalysisProcess } from "./models/AnalysisProcess";
import { EntityType } from "./models/EntityType";
import { TrackedVariableMethod } from "./models/TrackedVariableMethod";
import { ANALYTIC_RESULT_TYPE, ALGORITHMS, ANALYSIS_PROCESS_TYPE, TRACK_METHOD , ENTITY_TYPES} from "./constants";
import { AnalyticService } from "./services/AnalyticService";


const globalRoot: any = typeof window === "undefined" ? global : window;

const spinalAnalyticService = new AnalyticService();


if (typeof globalRoot.spinal === 'undefined') globalRoot.spinal = {};

if (typeof globalRoot.spinal.spinalAnalyticService === 'undefined') {
   globalRoot.spinal.spinalAnalyticService = spinalAnalyticService;
}

if (typeof globalRoot.spinal.spinalAnalyticService === 'undefined') {
   globalRoot.spinal.spinalAnalyticService = spinalAnalyticService;
}

export {
   spinalAnalyticService,
   IAnalytic,
   IAnalysisProcess,
   IEntityType,
   ITrackedVariableMethod,
   Analytic,
   AnalysisProcess,
   EntityType,
   TrackedVariableMethod,
   ENTITY_TYPES,
   ALGORITHMS,
   ANALYTIC_RESULT_TYPE,
   TRACK_METHOD
}

export default spinalAnalyticService;