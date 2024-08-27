import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import AnalyticInputManagerService from './AnalyticInputManagerService';
import { SpinalNodeRef } from 'spinal-env-viewer-graph-service';
import { IResult } from '../interfaces/IAnalyticResult';
import { ITwilioCredentials } from '../interfaces/ITwilioCredentials';
export default class AnalyticOutputManagerService {
    private analyticNodeManagerService;
    private analyticInputManagerService;
    private analyticTwilioManagerService;
    private spinalServiceTimeseries;
    constructor(analyticNodeManagerService: AnalyticNodeManagerService, analyticInputManagerService: AnalyticInputManagerService);
    initTwilioManagerService(twilioCredentials: ITwilioCredentials): void;
    /**
     * Handles the result of an algorithm that creates a ticket or an alarm.
     *
     * @private
     * @param {*} result
     * @param {string} analyticId
     * @param {SpinalNodeRef} configNode
     * @param {SpinalNodeRef} followedEntityNode
     * @param {*} params
     * @param {string} ticketType
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    handleTicketResult(result: any, analyticId: string, configAttributes: any, followedEntityNode: SpinalNodeRef, ticketType: string): Promise<IResult>;
    /**
     * Handles the result of an algorithm that modifies a control point.
     *
     * @private
     * @param {*} result
     * @param {SpinalNodeRef} followedEntityNode
     * @param {*} params
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    handleControlEndpointResult(result: any, followedEntityNode: SpinalNodeRef, configAttributes: any, referenceEpochTime: number): Promise<IResult>;
    /**
     * Handles the result of an algorithm that modifies an Endpoint.
     *
     * @private
     * @param {*} result
     * @param {SpinalNodeRef} followedEntityNode
     * @param {*} params
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    handleEndpointResult(result: any, followedEntityNode: SpinalNodeRef, configAttributes: any, referenceEpochTime: number): Promise<IResult>;
    /**
     * Handles the result of an algorithm that sends an SMS.
     *
     * @private
     * @param {*} result
     * @param {SpinalNodeRef} configNode
     * @param {SpinalNodeRef} followedEntityNode
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    handleSMSResult(result: any, analyticId: string, configAttributes: any, followedEntityNode: SpinalNodeRef): Promise<IResult>;
    handleGChatMessageResult(result: any, analyticId: string, configAttributes: any, followedEntityNode: SpinalNodeRef): Promise<IResult>;
    handleGChatOrganCardResult(result: any, analyticId: string, configAttributes: any, followedEntityNode: SpinalNodeRef): Promise<IResult>;
    /**
     * Gets the ticket context that has the corresponding contextId
     *
     * @param {string} contextId
     * @return {*}
     */
    private getTicketContext;
    /**
     * Gets the ticket process that has the corresponding processId in the context that has the corresponding contextId
     *
     * @param {string} contextId
     * @param {string} processId
     * @return {*}
     */
    private getTicketProcess;
    /**
     * Checks if an alarm is already declared in the context and process.
     *
     * @param {string} nodeId
     * @param {string} contextId
     * @param {string} processId
     * @param {string} ticketName
     * @return {*}
     */
    private alarmAlreadyDeclared;
    private addTicketAlarm;
    private updateEndpointOccurenceNumber;
    private createEndpoint;
}
