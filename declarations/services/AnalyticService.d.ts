import { SpinalNodeRef, SpinalNode, SpinalContext } from "spinal-env-viewer-graph-service";
import { IAnalytic } from "../interfaces/IAnalytic";
import { IAnalysisProcess } from "../interfaces/IAnalysisProcess";
import { IEntityType } from "../interfaces/IEntityType";
import { ITrackedVariableMethod } from "../interfaces/ITrackedVariableMethod";
export default class AnalyticService {
    constructor();
    /**
       * This method creates an analysis context. Since it does not have any particular additional info for now
       * it does not have a specific model.
       * @param  {string} contextName - The analysis's context Name
       * @returns Promise of the node's info (SpinalNodeRef)
       */
    createContext(contextName: string): Promise<SpinalNodeRef>;
    /**
     * Retrieves and returns a single (if provided a context name) or all contexts
     * handled by this service (type analysisContext)
     * @returns Promise
     */
    getContexts(contextName?: string): Array<SpinalNodeRef> | SpinalNodeRef | undefined;
    addEntity(entityTypeInfo: IEntityType, contextId: string): Promise<SpinalNodeRef>;
    findEntityByTargetType(context: SpinalContext<any>, targetType: string): Promise<SpinalNode<any> | undefined>;
    getEntityFromProcess(analysisProcessId: string): Promise<any>;
    addAnalysisProcess(analysisProcessInfo: IAnalysisProcess, contextId: string, entityId: string): Promise<SpinalNodeRef>;
    getAllAnalysisProcesses(contextId: string): Promise<any>;
    addAnalytic(analyticInfo: IAnalytic, contextId: string, analysisProcessId: string): Promise<SpinalNodeRef>;
    getAnalytic(analysisProcessId: string): Promise<SpinalNode<any> | undefined>;
    addTrackedVariableMethod(trackedVariableInfo: ITrackedVariableMethod, contextId: string, analyticId: string): Promise<SpinalNodeRef>;
    getTrackedVariableMethods(analysisProcessId: string): Promise<SpinalNodeRef[] | undefined>;
    getTrackedVariableMethod(analysisProcessId: string): Promise<SpinalNodeRef | undefined>;
    addLinkToFollowedEntity(contextId: string, analysisProcessId: string, followedEntityId: string): Promise<SpinalNodeRef>;
    removeLinkToFollowedEntity(analysisProcessId: string, followedEntityId: string): Promise<void>;
    getFollowedEntity(analysisProcessId: string): Promise<SpinalNodeRef | undefined>;
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
    getCompleteAnalysisList(contextId: string): Promise<{
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
    }[]>;
}
export { AnalyticService };
