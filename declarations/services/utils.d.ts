import { SpinalNodeRef } from "spinal-env-viewer-graph-service";
import { SpinalAttribute } from 'spinal-models-documentation';
/**
 * Uses the documentation service to get the attributes related to the algorithm parameters
 *
 * @export
 * @param {SpinalNodeRef} config
 * @return {*}
 */
export declare function getAlgorithmParameters(config: SpinalNodeRef): Promise<any>;
/**
 * Uses the documentation service to get the attributes related to the ticket localization
 * (context and process) parameters
 *
 * @export
 * @param {SpinalNodeRef} config
 * @return {*}
 */
export declare function getTicketLocalizationParameters(config: SpinalNodeRef): Promise<any>;
/**
 * Applies a name filter to find the endpoints connected to the entity
 *
 * @export
 * @param {string} followedEntityId
 * @param {string} filterNameValue
 * @return {*}  {Promise<SpinalNodeRef[]>}
 */
export declare function findEndpoints(followedEntityId: string, acc: SpinalNodeRef[]): Promise<SpinalNodeRef[]>;
/**
 * Applies a name filter to find the ControlEndpoints connected to the entity
 *
 * @export
 * @param {string} followedEntityId
 * @param {string} filterNameValue
 * @return {*}  {Promise<SpinalNodeRef[]>}
 */
export declare function findControlEndpoints(followedEntityId: string, filterNameValue: string): Promise<SpinalNodeRef[]>;
/**
 * Applies a name filter to find the endpoint connected to the entity
 *
 * @export
 * @param {string} followedEntityId
 * @param {string} filterNameValue
 * @return {*}  {Promise<SpinalNodeRef|undefined>}
 */
export declare function findEndpoint(followedEntityId: string, filterNameValue: string): Promise<SpinalNodeRef | undefined>;
/**
 * Applies a name filter to find the ControlEndpoint connected to the entity
 *
 * @export
 * @param {string} followedEntityId
 * @param {string} filterNameValue
 * @return {*}  {Promise<SpinalNodeRef|undefined>}
 */
export declare function findControlEndpoint(followedEntityId: string, filterNameValue: string): Promise<SpinalNodeRef | undefined>;
export declare function findAllCategoriesAndAttributes(followedEntityId: string): Promise<any>;
export declare function getValueModelFromEntry(entryDataModel: SpinalNodeRef | SpinalAttribute): Promise<any>;
export declare function formatTrackingMethodsToList(obj: any): any[];
/**
 * Adds a ticket alarm to the context and process and link it with the node
 *
 * @export
 * @param {*} ticketInfos
 * @param {SpinalNodeRef} configInfo
 * @param {string} nodeId
 */
export declare function addTicketAlarm(ticketInfos: any, configInfo: SpinalNodeRef, nodeId: string, ticketType: string): Promise<void>;
