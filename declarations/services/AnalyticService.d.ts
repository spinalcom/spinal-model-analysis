import { SpinalNodeRef, SpinalNode, SpinalContext } from "spinal-env-viewer-graph-service";
import { IConfig } from "../interfaces/IConfig";
import { IAnalytic } from "../interfaces/IAnalytic";
import { IEntity } from "../interfaces/IEntity";
import { ITrackingMethod } from "../interfaces/ITrackingMethod";
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
    addEntity(entityInfo: IEntity, contextId: string): Promise<SpinalNodeRef>;
    findEntityByTargetType(context: SpinalContext<any>, targetType: string): Promise<SpinalNode<any> | undefined>;
    getEntity(contextName: string, entityName: string): Promise<SpinalNodeRef | undefined>;
    getEntityFromAnalytic(analyticId: string): Promise<any>;
    addAnalytic(analyticInfo: IAnalytic, contextId: string, entityId: string): Promise<SpinalNodeRef>;
    getAllAnalytics(contextId: string): Promise<SpinalNodeRef[]>;
    getAnalytic(contextId: string, analyticName: string): Promise<SpinalNodeRef | undefined>;
    private addInputsNode;
    private addOutputsNode;
    addConfig(configInfo: IConfig, configAttributes: any, analyticId: string, contextId: string): Promise<SpinalNodeRef>;
    getConfig(analyticId: string): Promise<SpinalNodeRef | undefined>;
    getInputsNode(analyticId: string): Promise<SpinalNodeRef | undefined>;
    getOutputsNode(analyticId: string): Promise<SpinalNodeRef | undefined>;
    addTrackingMethod(trackingMethodInfo: ITrackingMethod, contextId: string, inputId: string): Promise<SpinalNodeRef>;
    addInputTrackingMethod(trackingMethodInfo: ITrackingMethod, contextId: string, analyticId: string): Promise<SpinalNodeRef>;
    getTrackingMethods(analyticId: string): Promise<SpinalNodeRef[] | undefined>;
    getTrackingMethod(analyticId: string): Promise<SpinalNodeRef | undefined>;
    removeTrackingMethod(inputId: string, trackingMethodId: string): Promise<void>;
    removeInputTrackingMethod(analyticId: string, trackingMethodId: string): Promise<void>;
    applyTrackingMethodLegacy(analyticId: string): Promise<SpinalNodeRef[] | undefined>;
    applyTrackingMethod(trackingMethod: SpinalNodeRef, followedEntity: SpinalNodeRef): Promise<SpinalNodeRef[] | undefined>;
    addLinkToFollowedEntity(contextId: string, inputId: string, followedEntityId: string): Promise<SpinalNodeRef>;
    addInputLinkToFollowedEntity(contextId: string, analyticId: string, followedEntityId: string): Promise<SpinalNodeRef>;
    removeLinkToFollowedEntity(analysisProcessId: string, followedEntityId: string): Promise<void>;
    getFollowedEntity(analyticId: string): Promise<SpinalNodeRef | undefined>;
    applyResult(result: any, analyticId: string, config: SpinalNodeRef, followedEntity: SpinalNodeRef, trackingMethod: SpinalNodeRef): Promise<void>;
    getWorkingFollowedEntities(analyticId: string): Promise<SpinalNodeRef[] | undefined>;
    getEntryDataModelsFromFollowedEntity(analyticId: string, followedEntity: SpinalNodeRef): Promise<SpinalNodeRef[] | undefined>;
    private getDataAndApplyAlgorithm;
    doAnalysis(analyticId: string, followedEntity: SpinalNodeRef): Promise<void>;
}
export { AnalyticService };
