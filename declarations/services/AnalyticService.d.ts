import { SpinalNodeRef, SpinalNode, SpinalContext } from "spinal-env-viewer-graph-service";
import { IAnalytic } from "../interfaces/IAnalytic";
import { IAnalysisProcess } from "../interfaces/IAnalysisProcess";
import { IEntityType } from "../interfaces/IEntityType";
import { ITrackedVariableMethod } from "../interfaces/ITrackedVariableMethod";
export default class AnalyticService {
    constructor();
    /**
     * This method creates a new context and returns its info.
     * If the context already exists (same name), it returns its info instead of creating a new one.
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
     * This method retrieves and returns the info of a context. If the context does not exist, it returns undefined.
     * @param {string} contextName
     * @return {*}  {(SpinalNodeRef | undefined)}
     * @memberof AnalyticService
     */
    getContext(contextName: string): SpinalNodeRef | undefined;
    /**
     * This method creates a new entity type node and returns its info.
     *
     * @param {IEntityType} entityTypeInfo
     * @param {string} contextId
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    addEntity(entityTypeInfo: IEntityType, contextId: string): Promise<SpinalNodeRef>;
    /**
     * This method find all entities in a context that have a certain type
     *
     * @param {SpinalContext<any>} context
     * @param {string} targetType
     * @return {*}  {(Promise<SpinalNode<any> | undefined>)}
     * @memberof AnalyticService
     */
    findEntityByTargetType(context: SpinalContext<any>, targetType: string): Promise<SpinalNode<any> | undefined>;
    /**
     * This method returns the info of an entity if provided with the context name and the entity name.
     *
     * @param {string} contextName
     * @param {string} entityName
     * @return {*}  {(Promise<SpinalNodeRef | undefined>)}
     * @memberof AnalyticService
     */
    getEntity(contextName: string, entityName: string): Promise<SpinalNodeRef | undefined>;
    /**
     * This method finds the entity that is the parent of the given analysis process.
     *
     * @param {string} analysisProcessId
     * @return {*}
     * @memberof AnalyticService
     */
    getEntityFromProcess(analysisProcessId: string): Promise<any>;
    /**
     * This method creates a new analysis process node and returns its info.
     *
     * @param {IAnalysisProcess} analysisProcessInfo
     * @param {string} contextId
     * @param {string} entityId
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    addAnalysisProcess(analysisProcessInfo: IAnalysisProcess, contextId: string, entityId: string): Promise<SpinalNodeRef>;
    /**
     * This method retrieves and returns all analysis processes in a context.
     *
     * @param {string} contextId
     * @return {*}
     * @memberof AnalyticService
     */
    getAllAnalysisProcesses(contextId: string): Promise<SpinalNodeRef[]>;
    getAnalysisProcess(contextId: string, analysisProcessId: string): Promise<SpinalNodeRef | undefined>;
    getAnalysisProcessByName(contextId: string, analysisProcessName: string): Promise<SpinalNodeRef | undefined>;
    /**
     * This method creates a new analytic node and returns its info.
     *
     * @param {IAnalytic} analyticInfo
     * @param {string} contextId
     * @param {string} analysisProcessId
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    addAnalytic(analyticInfo: IAnalytic, contextId: string, analysisProcessId: string): Promise<SpinalNodeRef>;
    /**
     * This method retrieves and returns all analytics in a context.
     *
     * @param {string} analysisProcessId
     * @return {*}  {(Promise<SpinalNode<any> | undefined>)}
     * @memberof AnalyticService
     */
    getAnalytic(analysisProcessId: string): Promise<SpinalNodeRef | undefined>;
    /**
     * This method creates a new tracked variable node and returns its info.
     *
     * @param {ITrackedVariableMethod} trackedVariableInfo
     * @param {string} contextId
     * @param {string} analysisProcessId
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    addTrackedVariableMethod(trackedVariableInfo: ITrackedVariableMethod, contextId: string, analysisProcessId: string): Promise<SpinalNodeRef>;
    /**
     * This method retrieves and returns all tracked variables children of an analysis process.
     *
     * @param {string} analysisProcessId
     * @return {*}  {(Promise<SpinalNodeRef[] | undefined>)}
     * @memberof AnalyticService
     */
    getTrackedVariableMethods(analysisProcessId: string): Promise<SpinalNodeRef[] | undefined>;
    /**
     * This method retrieves and returns the tracked variable child (the first one) of an analysis process.
     *
     * @param {string} analysisProcessId
     * @return {*}  {(Promise<SpinalNodeRef | undefined>)}
     * @memberof AnalyticService
     */
    getTrackedVariableMethod(analysisProcessId: string): Promise<SpinalNodeRef | undefined>;
    /**
     * This method removes a tracked variable child of an analysis process.
     *
     * @param {string} analysisProcessId
     * @param {string} trackedVariableId
     * @memberof AnalyticService
     */
    removeTrackedVariableMethod(analysisProcessId: string, trackedVariableId: string): Promise<void>;
    /**
     * This method applies a tracked variable method to an analysis process's followed entity to get the entry data.
     *
     * @param {string} analysisProcessId
     * @param {string} trackedVariableId
     * @memberof AnalyticService
     */
    applyTrackedVariableMethod(analysisProcessId: string): Promise<SpinalNodeRef[] | undefined>;
    /**
     * This method creates a new link between an analysis process and a followed entity.
     *
     * @param {string} contextId
     * @param {string} analysisProcessId
     * @param {string} followedEntityId
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    addLinkToFollowedEntity(contextId: string, analysisProcessId: string, followedEntityId: string): Promise<SpinalNodeRef>;
    /**
     * This method removes the link between an analysis process and a followed entity.
     *
     * @param {string} analysisProcessId
     * @param {string} followedEntityId
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    removeLinkToFollowedEntity(analysisProcessId: string, followedEntityId: string): Promise<void>;
    /**
     * This method retrieves and returns the followed entity child of an analysis process.
     *
     * @param {string} analysisProcessId
     * @return {*}
     * @memberof AnalyticService
     */
    getFollowedEntity(analysisProcessId: string): Promise<SpinalNodeRef | undefined>;
    /**
     * This method aims at giving a full report of an analysis process.
     *
     *
     * @param {string} contextId
     * @param {string} analysisProcessId
     * @return {*}
     * @memberof AnalyticService
     */
    getCompleteAnalysis(contextId: string, analysisProcessId: string): Promise<{
        analysisProcessId: string;
        contextId: string;
        processName: string;
        intervalProcessing: string;
        followedEntityId: string;
        followedEntityType: string;
        variableName: string;
        variableType: string;
        analytic: {
            id: string;
            algorithmUsed: string;
            resultName: string;
            resultType: string;
        };
    }>;
    /**
     * Get the complete report for all analysis processes in a context.
     *
     * @param {string} contextId
     * @return {*}
     * @memberof AnalyticService
     */
    getCompleteAnalysisList(contextId: string): Promise<never[]>;
    doAnalysis(analysisProcessId: string): Promise<void>;
}
export { AnalyticService };
