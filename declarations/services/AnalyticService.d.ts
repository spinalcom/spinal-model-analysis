import { SpinalNodeRef, SpinalNode, SpinalContext } from 'spinal-env-viewer-graph-service';
import { IAnalytic } from '../interfaces/IAnalytic';
import { IAnalyticDetails } from '../interfaces/IAnalyticDetails';
import { IEntity } from '../interfaces/IEntity';
import { IResult } from '../interfaces/IAnalyticResult';
import { INodeDocumentation } from '../interfaces/IAttribute';
import { SpinalDateValue } from 'spinal-model-timeseries';
import { SpinalAttribute } from 'spinal-models-documentation';
/**
 * This class handles most of the logic for analytics. It provides methods for creating and retrieving analytics, entities, and contexts.
 * It also provides methods for applying tracking methods to followed entities and applying algorithms to inputs.
 *
 * @export
 * @class AnalyticService
 */
export default class AnalyticService {
    /**
     * The singleton instance of the Timeseries service.
     *
     * @private
     * @type {SpinalServiceTimeseries}
     * @memberof AnalyticService
     */
    private spinalServiceTimeseries;
    /**
     * The Twilio phone number to use for sending SMS messages.
     *
     * @private
     * @type {(string | undefined)}
     * @memberof AnalyticService
     */
    private twilioFromNumber;
    /**
     * The Twilio account SID to use for sending SMS messages.
     *
     * @private
     * @type {(string | undefined)}
     * @memberof AnalyticService
     */
    private twilioAccountSid;
    /**
     * The Twilio auth token to use for sending SMS messages.
     *
     * @private
     * @type {(string | undefined)}
     * @memberof AnalyticService
     */
    private twilioAuthToken;
    constructor();
    /**
     * Initialize private attributes with necessary information to use the the messaging service.
     *
     * @param {string} accountSid
     * @param {string} authToken
     * @param {string} fromNumber
     * @return {*}  {void}
     * @memberof AnalyticService
     */
    initTwilioCredentials(accountSid: string, authToken: string, fromNumber: string): void;
    /**
     * This method creates a new context and returns the info of the newly created context.
     * If the context already exists (same name), it just returns the info of that context instead of creating a new one.
     * @param {string} contextName
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    createContext(contextName: string): Promise<SpinalNodeRef>;
    /**
     * Retrieves and returns all contexts
     * handled by this service (type analysisContext)
     * @return {*}  {(SpinalNodeRef[] | undefined)}
     * @memberof AnalyticService
     */
    getContexts(): SpinalNodeRef[] | undefined;
    /**
     * This method use the context name to find and return the info of that context. If the context does not exist, it returns undefined.
     * If multiple contexts have the same name, it returns the first one.
     * @param {string} contextName
     * @return {*}  {(SpinalNodeRef | undefined)}
     * @memberof AnalyticService
     */
    getContext(contextName: string): SpinalNodeRef | undefined;
    getContextIdOfAnalytic(analyticId: string): string | undefined;
    /**
     * This method creates a new entity and returns the info of the newly created entity.
     *
     * @param {IEntity} entityInfo
     * @param {string} contextId
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    addEntity(entityInfo: IEntity, contextId: string): Promise<SpinalNodeRef>;
    /**
     * Returns all the entities withing a context that have the specified type.
     *
     * @param {SpinalContext<any>} context
     * @param {string} targetType
     * @return {*}  {(Promise<SpinalNode<any> | undefined>)}
     * @memberof AnalyticService
     */
    findEntityByTargetType(context: SpinalContext<any>, targetType: string): Promise<SpinalNode<any> | undefined>;
    /**
     * Retrieves a SpinalNodeRef for the specified entity within the specified context.
     * @async
     * @param {string} contextName - The name of the context to search within.
     * @param {string} entityName - The name of the entity to retrieve.
     * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the SpinalNodeRef for the entity, or undefined if the context or entity cannot be found.
     * @memberof AnalyticService
     */
    getEntity(contextName: string, entityName: string): Promise<SpinalNodeRef | undefined>;
    /**
     * Retrieves the parent entity of the specified analytic.
     * @async
     * @param {string} analyticId - The ID of the analytic for which to retrieve the parent entity.
     * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the parent entity, or undefined if the parent entity cannot be found.
     * @memberof AnalyticService
     */
    getEntityFromAnalytic(analyticId: string): Promise<SpinalNodeRef | undefined>;
    /**
     * Adds a new analytic to the specified entity within the specified context.
     * @async
     * @param {IAnalytic} analyticInfo - The information for the new analytic to add.
     * @param {string} contextId - The ID of the context in which to add the analytic.
     * @param {string} entityId - The ID of the entity to which to add the analytic.
     * @returns {Promise<SpinalNodeRef>} A Promise that resolves to the newly created analytic info.
     * @memberof AnalyticService
     */
    addAnalytic(analyticInfo: IAnalytic, contextId: string, entityId: string): Promise<SpinalNodeRef>;
    /**
     * Retrieves all analytics within the specified context.
     * @async
     * @param {string} contextId - The ID of the context in which to retrieve analytics.
     * @returns {Promise<SpinalNodeRef[]>} A Promise that resolves to an array of SpinalNodeRefs for all analytics in the context.
     * @memberof AnalyticService
     */
    getAllAnalytics(contextId: string): Promise<SpinalNodeRef[]>;
    /**
     * Retrieves the SpinalNodeRef for the specified analytic within the specified context.
     * @async
     * @param {string} contextId - The ID of the context in which to search for the analytic.
     * @param {string} analyticName - The name of the analytic to retrieve.
     * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the SpinalNodeRef for the analytic, or undefined if the analytic cannot be found.
     * @memberof AnalyticService
     */
    getAnalytic(contextId: string, analyticName: string): Promise<SpinalNodeRef | undefined>;
    /**
     * Adds an Inputs node to the specified analytic within the specified context.
     * @async
     * @param {string} analyticId - The ID of the analytic to which to add the Inputs node.
     * @param {string} contextId - The ID of the context in which to add the Inputs node.
     * @returns {Promise<SpinalNodeRef>} A Promise that resolves to the newly created Inputs node.
     * @memberof AnalyticService
     */
    private addInputsNode;
    /**
     * Adds an Outputs node to the specified analytic within the specified context.
     * @async
     * @param {string} analyticId - The ID of the analytic to which to add the Outputs node.
     * @param {string} contextId - The ID of the context in which to add the Outputs node.
     * @returns {Promise<SpinalNodeRef>} A Promise that resolves to the newly created Outputs node.
     * @memberof AnalyticService
     */
    private addOutputsNode;
    /**
     * Adds a new Config node to the specified analytic within the specified context, with the specified attributes.
     *
     * @param {INodeDocumentation} configAttributes - The attributes to add to the Config node.
     * @param {string} analyticId - The ID of the analytic to which to add the Config node.
     * @param {string} contextId - The ID of the context in which to add the Config node.
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    addConfig(configAttributes: INodeDocumentation, analyticId: string, contextId: string): Promise<SpinalNodeRef>;
    updateLastExecutionTime(analyticId: string): Promise<void>;
    /**
     * Retrieves the Config node for the specified analytic
     *
     * @async
     * @param {string} analyticId - The ID of the analytic for which to retrieve the Config node.
     * @return {*}  {(Promise<SpinalNodeRef | undefined>)} A Promise that resolves to the Config node, or undefined if the Config node cannot be found.
     * @memberof AnalyticService
     */
    getConfig(analyticId: string): Promise<SpinalNodeRef | undefined>;
    deleteConfigNode(analyticId: string): Promise<void>;
    /**
     * Retrieves the Inputs node for the specified analytic.
     * @async
     * @param {string} analyticId - The ID of the analytic for which to retrieve the Inputs node.
     * @return {*}  {(Promise<SpinalNodeRef | undefined>)} - A Promise that resolves to the Inputs node, or undefined if the Inputs node cannot be found.
     * @memberof AnalyticService
     */
    getInputsNode(analyticId: string): Promise<SpinalNodeRef | undefined>;
    /**
     * Retrieves the Outputs node for the specified analytic.
     * @async
     * @param {string} analyticId - The ID of the analytic for which to retrieve the Outputs node.
     * @returns {*} {(Promise<SpinalNodeRef | undefined>)} - A Promise that resolves to the Outputs node, or undefined if the Outputs node cannot be found.
     * @memberof AnalyticService
     */
    getOutputsNode(analyticId: string): Promise<SpinalNodeRef | undefined>;
    deleteInputsNode(analyticId: string): Promise<void>;
    deleteOutputsNode(analyticId: string, shouldDeleteChildren?: boolean): Promise<void>;
    deleteAnalytic(analyticId: string, shouldDeleteChildren?: boolean): Promise<void>;
    /**
     * Adds a new Tracking Method node to the specified Input node within the specified context.
     * @async
     * @param {INodeDocumentation} trackingMethodAttributes
     * @param {string} contextId - The ID of the context in which to add the Tracking Method node.
     * @param {string} inputId - The ID of the Input node to which to add the Tracking Method node.
     * @return {*}  {Promise<SpinalNodeRef>} - A Promise that resolves to the newly created Tracking Method node.
     * @memberof AnalyticService
     */
    addTrackingMethod(trackingMethodAttributes: INodeDocumentation, contextId: string, inputId: string): Promise<SpinalNodeRef>;
    /**
     * Adds a new Tracking Method node to the Inputs node of the specified analytic within the specified context.
     *
     * @async
     * @param {INodeDocumentation} trackingMethodAttributes - The attributes to add to the Tracking Method node.
     * @param {string} contextId - The ID of the context in which to add the Tracking Method node.
     * @param {string} analyticId - The ID of the analytic for which to add the Tracking Method node.
     * @return {*}  {Promise<SpinalNodeRef>} - A Promise that resolves to the newly created Tracking Method node.
     * @memberof AnalyticService
     */
    addInputTrackingMethod(trackingMethodAttributes: INodeDocumentation, contextId: string, analyticId: string): Promise<SpinalNodeRef>;
    /**
     * Retrieves all Tracking Method nodes associated with the Inputs node of the specified analytic.
     * @async
     * @param {string} analyticId - The ID of the analytic for which to retrieve the Tracking Method nodes.
     * @returns {Promise<SpinalNodeRef[]|undefined>} A Promise that resolves to an array of Tracking Method nodes, or undefined if the Inputs node or Tracking Method nodes cannot be found.
     * @memberof AnalyticService
     */
    getTrackingMethods(analyticId: string): Promise<SpinalNodeRef[] | undefined>;
    /**
     * Retrieves the first Tracking Method node associated with the Inputs node of the specified analytic.
     * @async
     * @param {string} analyticId - The ID of the analytic for which to retrieve the Tracking Method node.
     * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the first Tracking Method node, or undefined if the Inputs node or Tracking Method nodes cannot be found.
     * @memberof AnalyticService
     */
    getTrackingMethod(analyticId: string): Promise<SpinalNodeRef | undefined>;
    /**
     * Removes the specified Tracking Method node from the specified Inputs node and deletes it from the graph.
     * @async
     * @param {string} inputId - The ID of the Inputs node from which to remove the Tracking Method node.
     * @param {string} trackingMethodId - The ID of the Tracking Method node to remove and delete.
     * @returns {Promise<void>} A Promise that resolves when the Tracking Method node has been removed and deleted.
     * @memberof AnalyticService
     */
    removeTrackingMethod(inputId: string, trackingMethodId: string): Promise<void>;
    /**
     * Removes the specified Tracking Method node from the Inputs node of the specified analytic and deletes it from the graph.
     * @async
     * @param {string} analyticId - The ID of the analytic from which to remove the Tracking Method node.
     * @param {string} trackingMethodId - The ID of the Tracking Method node to remove and delete.
     * @throws {Error} Throws an error if the Inputs node cannot be found.
     * @returns {Promise<void>} A Promise that resolves when the Tracking Method node has been removed and deleted.
     * @memberof AnalyticService
     */
    removeInputTrackingMethod(analyticId: string, trackingMethodId: string): Promise<void>;
    /**
     *
     * @async
     * @param {string} trackMethod - The type of filter.
     * @param {string} filterValue - The filter value to use.
     * @param {SpinalNodeRef} followedEntity - The SpinalNodeRef object representing the Followed Entity to which the Tracking Method should be applied.
     * @returns {*} {Promise<SpinalNodeRef[] | SpinalNodeRef | undefined>} - A Promise that resolves with the results of the applied Tracking Method.
     * @memberof AnalyticService
     */
    applyTrackingMethodWithParams(followedEntity: SpinalNodeRef, trackMethod: string, filterValue: string, depth: number, strictDepth: boolean, authorizedRelations: string[]): Promise<SpinalNodeRef | SpinalAttribute | undefined>;
    /**
     * Adds a link between an input and a followed entity.
     * @param {string} contextId - The id of the context where the link will be created.
     * @param {string} inputId - The id of the input node.
     * @param {string} followedEntityId - The id of the followed entity node.
     * @returns {Promise<SpinalNodeRef>} The linked node.
     * @memberof AnalyticService
     */
    addLinkToFollowedEntity(contextId: string, inputId: string, followedEntityId: string): Promise<SpinalNodeRef>;
    /**
     * Adds a link between the input node of the specified analytic and a followed entity.
     * @param {string} contextId - The id of the context where the link will be created.
     * @param {string} analyticId - The id of the analytic node.
     * @param {string} followedEntityId - The id of the followed entity node.
     * @returns {Promise<SpinalNodeRef>} The linked node.
     * @memberof AnalyticService
     */
    addInputLinkToFollowedEntity(contextId: string, analyticId: string, followedEntityId: string): Promise<SpinalNodeRef>;
    /**
     * Removes the link between an input node and a followed entity node.
     *
     * @async
     * @param {string} analyticId - The ID of the analytic node.
     * @param {string} followedEntityId - The ID of the followed entity node.
     * @returns {Promise<void>}
     * @memberof AnalyticService
     */
    removeLinkToFollowedEntity(analyticId: string, followedEntityId: string): Promise<void>;
    /**
     * Get the followed entity node of an analytic.
     * @async
     * @param {string} analyticId - The id of the analytic.
     * @returns {Promise<SpinalNodeRef|undefined>} The followed entity node or undefined if it does not exist.
     * @memberof AnalyticService
     */
    getFollowedEntity(analyticId: string): Promise<SpinalNodeRef | undefined>;
    /**
     * Adds the specified attributes to the node with the specified ID.
     * @async
     * @param {SpinalNode<any>} node - The node to which to add the attributes.
     * @param {INodeDocumentation} attributes - An array of objects representing the attributes to add to the node.
     * @returns {Promise<void>} A Promise that resolves when the attributes have been added.
     * @memberof AnalyticService
     */
    addAttributesToNode(node: SpinalNode<any>, attributes: INodeDocumentation): Promise<void>;
    /**
     * Gets the attributes from a node.
     *
     * @param {string} nodeId - The ID of the node from which to retrieve the attributes.
     * @param {string} category - The category of the attributes to retrieve.
     * @return {*}  {Promise<any>} An object containing the attributes.
     * @memberof AnalyticService
     */
    getAttributesFromNode(nodeId: string, category: string): Promise<any>;
    /**
     * Gets the attribute from a node.
     *
     * @param {string} nodeId - The ID of the node from which to retrieve the attribute.
     * @param {string} category - The category of the attribute to retrieve.
     * @param {string} label - The label of the attribute to retrieve.
     * @return {*}  {Promise<any>}  An object containing the attribute { label: value}.
     * @memberof AnalyticService
     */
    getAttributeFromNode(nodeId: string, category: string, label: string): Promise<any>;
    getAllCategoriesAndAttributesFromNode(nodeId: string): Promise<{}>;
    /**
     * Gets the targeted entities for an analytic.
     *
     * @param {string} analyticId The ID of the analytic.
     * @return {*}  {(Promise<SpinalNodeRef[]|undefined>)} An array of SpinalNodeRefs for the entities
     * @memberof AnalyticService
     */
    getWorkingFollowedEntities(analyticId: string): Promise<SpinalNodeRef[] | undefined>;
    getWorkingFollowedEntitiesWithParam(followedEntity: SpinalNodeRef, entityType: string): Promise<SpinalNodeRef[]>;
    getEntryDataModelByInputIndex(analyticId: string, followedEntity: SpinalNodeRef, inputIndex: string): Promise<SpinalNodeRef | SpinalAttribute | undefined>;
    getFormattedInputDataByIndex(analyticId: string, followedEntity: SpinalNodeRef, inputIndex: string, referenceEpochTime?: number): Promise<SpinalDateValue[] | string | boolean | number | undefined>;
    getAnalyticDetails(analyticId: string): Promise<IAnalyticDetails>;
    findExecutionOrder(dependencies: any): string[] | null;
    private filterAlgorithmParametersAttributesByIndex;
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
    private handleTicketResult;
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
    private handleControlEndpointResult;
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
    private handleEndpointResult;
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
    private handleSMSResult;
    private handleGChatMessageResult;
    private handleGChatOrganCardResult;
}
export { AnalyticService };
