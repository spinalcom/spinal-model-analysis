import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import { SpinalNodeRef } from 'spinal-env-viewer-graph-service';
import { SpinalAttribute } from 'spinal-models-documentation';
import * as CONSTANTS from '../constants';
import { SpinalDateValue } from 'spinal-model-timeseries';
export default class AnalyticInputManagerService {
    private analyticNodeManagerService;
    private spinalServiceTimeseries;
    constructor(analyticNodeManagerService: AnalyticNodeManagerService);
    /**
     *
     * @async
     * @param {string} trackMethod - The type of filter.
     * @param {string} filterValue - The filter value to use.
     * @param {SpinalNodeRef} followedEntity - The SpinalNodeRef object representing the Followed Entity to which the Tracking Method should be applied.
     * @returns {*} {Promise<SpinalNodeRef[] | SpinalNodeRef | undefined>} - A Promise that resolves with the results of the applied Tracking Method.
     * @memberof AnalyticService
     */
    applyTrackingMethodWithParams(followedEntity: SpinalNodeRef, trackMethod: string, filterValue: string, depth: number, strictDepth: boolean, authorizedRelations: string[], multipleModels?: boolean): Promise<SpinalNodeRef[] | SpinalNodeRef | SpinalAttribute | undefined>;
    /**
     * Gets the targeted entities for an analytic.
     *
     * @param {string} analyticId The ID of the analytic.
     * @return {*}  {(Promise<SpinalNodeRef[]|undefined>)} An array of SpinalNodeRefs for the entities
     * @memberof AnalyticService
     */
    getWorkingFollowedEntities(analyticId: string): Promise<SpinalNodeRef[] | undefined>;
    getWorkingFollowedEntitiesWithParam(followedEntity: SpinalNodeRef, entityType: string): Promise<SpinalNodeRef[]>;
    getEntryDataModelByInputIndex(analyticId: string, followedEntity: SpinalNodeRef, inputIndex: string, multipleModels?: boolean): Promise<SpinalNodeRef[] | SpinalNodeRef | SpinalAttribute | undefined>;
    private getRelationsWithDepth;
    private getChoiceRelationsWithDepth;
    getAvailableData(trackMethod: CONSTANTS.TRACK_METHOD, nodeId: string, filterValue: string, depth: number, stricDepth: boolean, authorizedRelations: string[]): Promise<string[]>;
    private findNodes;
    private findSpecificNode;
    private findMatchingNodes;
    findEndpoint(nodeId: string, filterNameValue: string, depth: number, strictDepth: boolean, authorizedRelations: string[], trackedRelations: string[], nodeType: string): Promise<SpinalNodeRef | undefined>;
    findEndpoints(nodeId: string, filterNameValue: string, depth: number, strictDepth: boolean, authorizedRelations: string[], trackedRelations: string[], nodeType: string): Promise<SpinalNodeRef[]>;
    findAttribute(nodeId: string, categoryName: string, attributeName: string, depth: number, strictDepth: boolean, authorizedRelations: string[]): Promise<SpinalAttribute | -1>;
    findAttributes(nodeId: string, categoryName: string, attributeName: string, depth: number, strictDepth: boolean, authorizedRelations: string[]): Promise<string[]>;
    findAllCategoriesAndAttributes(followedEntityId: string): Promise<string[]>;
    getValueModelFromEntry(entryDataModel: SpinalNodeRef | SpinalAttribute): Promise<spinal.Model>;
    formatTrackingMethodsToList(obj: any): any[];
    filterAlgorithmParametersAttributesByIndex(algoParams: any, indexName: string): {};
    getFormattedInputDataByIndex(analyticId: string, followedEntity: SpinalNodeRef, inputIndex: string, referenceEpochTime?: number): Promise<boolean[] | string[] | number[] | SpinalDateValue[] | string | boolean | number | undefined>;
    getFormattedInputData(analyticId: string, followedEntity: SpinalNodeRef, inputIndex: string, executionTimes?: number[]): Promise<any>;
    getAllDataFromAnalyticConfiguration(analyticId: string, entity: SpinalNodeRef, ioDependencies: any, executionTimes: number[]): Promise<any>;
    private timeseriesPreProcessing;
    private timeseriesPreProcessingData;
}
