import { IAnalytic } from "./interfaces/IAnalytic";
import { IEntity } from "./interfaces/IEntity";
import { ITrackingMethod } from "./interfaces/ITrackingMethod";
import { IConfig } from "./interfaces/IConfig"
import { ConfigModel } from "./models/ConfigModel";
import { AnalyticModel } from "./models/AnalyticModel";
import { EntityModel } from "./models/EntityModel";
import { TrackingMethodModel } from "./models/TrackingMethodModel";
import { ANALYTIC_RESULT_TYPE, ALGORITHMS, ALGO_DOC, ALGO_DOC_DESCRIPTION, ANALYTIC_TYPE, TRACK_METHOD , ENTITY_TYPES,
   CONTEXT_TYPE, ENTITY_TYPE} from "./constants";
import { AnalyticService } from "./services/AnalyticService";
import {findControlEndpoints, findEndpoints} from "./services/utils"


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
   ITrackingMethod,
   IEntity,
   IConfig,
   AnalyticModel,
   TrackingMethodModel,
   ENTITY_TYPES,
   ALGORITHMS,
   ANALYTIC_RESULT_TYPE,
   ANALYTIC_TYPE,
   TRACK_METHOD,
   CONTEXT_TYPE,
   ENTITY_TYPE,
   ALGO_DOC,
   ALGO_DOC_DESCRIPTION,
   findControlEndpoints,
   findEndpoints,
}

export default spinalAnalyticService;