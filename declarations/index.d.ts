import { IAnalytic } from "./interfaces/IAnalytic";
import { Analytic } from "./models/Analytic";
import { AnalyticService } from "./services/AnalyticService";
declare const spinalAnalyticService: AnalyticService;
export { spinalAnalyticService, IAnalytic, Analytic };
export default spinalAnalyticService;
