import { SpinalNodeRef } from 'spinal-env-viewer-graph-service';
import { ITwilioCredentials } from '../interfaces/ITwilioCredentials';
import { IResult } from '../interfaces/IAnalyticResult';
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
    /**
     * Performs an analysis on an entity for an analytic.
     * @param {string} analyticId The ID of the analytic.
     * @param {SpinalNodeRef} entity The SpinalNodeRef for the entity to analyze.
     * @returns {*} {Promise<void>}
     * @memberof AnalyticService
     */
    doAnalysisOnEntity(analyticId: string, entity: SpinalNodeRef, configAttributes?: any, executionTime?: number): Promise<IResult>;
    /**
     * Performs an analysis on all entities for an analytic.
     * @param {string} analyticId The ID of the analytic.
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    doAnalysis(analyticId: string, triggerObject: {
        triggerType: string;
        triggerValue: string;
    }): Promise<IResult[]>;
    /**
     * Applies the result of an algorithm.
     *
     * @param {*} result The result of the algorithm used.
     * @param {string} analyticId The ID of the analytic.
     * @param {SpinalNodeRef} configNode The SpinalNodeRef of the configuration of the analytic.
     * @param {SpinalNodeRef} followedEntityNode The SpinalNodeRef of the entity.
     * @return {*}
     * @memberof AnalyticService
     */
    applyResult(result: any, analyticId: string, configAttributes: any, followedEntityNode: SpinalNodeRef, referenceEpochTime?: number): Promise<IResult>;
    getCronMissingExecutionTimes(cronSyntax: string, lastExecutedTime: number): number[];
    getIntervalTimeMissingExecutionTimes(intervalTime: number, lastExecutedTime: number): number[];
}
export { AnalyticExecutionManagerService };
