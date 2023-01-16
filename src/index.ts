import { IAnalytic } from "./interfaces/IAnalytic";
import { Analytic } from "./models/Analytic";
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
   Analytic
}

export default spinalAnalyticService;