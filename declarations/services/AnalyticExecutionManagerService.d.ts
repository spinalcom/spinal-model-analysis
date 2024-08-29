import { SpinalNodeRef } from 'spinal-env-viewer-graph-service';
import { ITwilioCredentials } from '../interfaces/ITwilioCredentials';
import { IResult } from '../interfaces/IAnalyticResult';
import { IAnalyticConfig } from '../interfaces/IAnalyticConfig';
import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import AnalyticInputManagerService from './AnalyticInputManagerService';
import AnalyticOutputManagerService from './AnalyticOutputManagerService';
/**
 * This class handles the execution for analytics.
 * It also provides methods for applying tracking methods to followed entities and applying algorithms to inputs.
 *
 * @export
 * @class AnalyticService
 */
export default class AnalyticExecutionManagerService {
    private analyticNodeManagerService;
    private analyticInputManagerService;
    private analyticOutputManagerService;
    constructor(analyticNodeManagerService: AnalyticNodeManagerService, analyticInputManagerService: AnalyticInputManagerService, analyticOutputManagerService: AnalyticOutputManagerService);
    initTwilioManagerService(twilioCredentials: ITwilioCredentials): void;
    updateLastExecutionTime(analyticId: string): Promise<void>;
    private recExecuteAlgorithm;
    private optExecuteAlgorithm;
    /**
     * Performs an analysis on an entity for an analytic.
     * @param {string} analyticId The ID of the analytic.
     * @param {SpinalNodeRef} entity The SpinalNodeRef for the entity to analyze.
     * @returns {*} {Promise<void>}
     * @memberof AnalyticService
     */
    doAnalysisOnEntity(analyticId: string, entity: SpinalNodeRef, executionTimes?: number[], configAttributes?: IAnalyticConfig): Promise<IResult[]>;
    doAnalysis(analyticId: string, triggerObject: {
        triggerType: string;
        triggerValue: string;
    }): Promise<IResult[]>;
    /**
     * Performs an analysis on all entities for an analytic.
     * @param {string} analyticId The ID of the analytic.
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    getCronMissingExecutionTimes(cronSyntax: string, lastExecutedTime: number): number[];
    getIntervalTimeMissingExecutionTimes(intervalTime: number, lastExecutedTime: number): number[];
    getExecutionTimestamps(aggregateExecutionTime: string, executionTime: string, lastExecutionTime: number): number[];
}
export { AnalyticExecutionManagerService };
