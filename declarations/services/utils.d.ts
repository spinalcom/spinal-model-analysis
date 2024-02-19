import { SpinalNodeRef } from 'spinal-env-viewer-graph-service';
import * as CONSTANTS from '../constants';
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
export declare function getRelationsWithDepth(nodeId: string, depth: number): Promise<string[]>;
export declare function getChoiceRelationsWithDepth(nodeId: string, depth: number): Promise<string[]>;
export declare function getAvailableData(trackMethod: CONSTANTS.TRACK_METHOD, nodeId: string, filterValue: string, depth: number, stricDepth: boolean, authorizedRelations: string[]): Promise<string[]>;
export declare function findNodes(nodeId: string, authorizedRelations: string[], nodeType: string): Promise<SpinalNodeRef[]>;
export declare function findEndpoint(nodeId: string, filterNameValue: string, depth: number, strictDepth: boolean, authorizedRelations: string[], trackedRelations: string[], nodeType: string): Promise<SpinalNodeRef | undefined>;
export declare function findEndpoints(nodeId: string, filterNameValue: string, depth: number, strictDepth: boolean, authorizedRelations: string[], trackedRelations: string[], nodeType: string): Promise<SpinalNodeRef[]>;
export declare function findAttribute(nodeId: string, categoryName: string, attributeName: string, depth: number, strictDepth: boolean, authorizedRelations: string[]): Promise<SpinalAttribute | -1>;
export declare function findAttributes(nodeId: string, categoryName: string, attributeName: string, depth: number, strictDepth: boolean, authorizedRelations: string[]): Promise<string[]>;
export declare function findAllCategoriesAndAttributes(followedEntityId: string): Promise<string[]>;
export declare function getValueModelFromEntry(entryDataModel: SpinalNodeRef | SpinalAttribute): Promise<spinal.Model>;
export declare function formatTrackingMethodsToList(obj: any): any[];
/**
 * Adds a ticket alarm to the context and process and link it with the node
 *
 * @export
 * @param {*} ticketInfos
 * @param {SpinalNodeRef} configInfo
 * @param {string} nodeId
 */
export declare function addTicketAlarm(ticketInfos: any, configInfo: SpinalNodeRef, analyticContextId: string, outputNodeId: string, entityNodeId: string, ticketType: string): Promise<void>;
export declare function safeDeleteNode(nodeId: string, shouldDeleteChildren?: boolean): Promise<void>;
