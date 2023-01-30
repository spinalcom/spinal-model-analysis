"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticService = void 0;
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const CONSTANTS = require("../constants");
const Analytic_1 = require("../models/Analytic");
const AnalysisProcess_1 = require("../models/AnalysisProcess");
const EntityType_1 = require("../models/EntityType");
const TrackedVariableMethod_1 = require("../models/TrackedVariableMethod");
const utils_1 = require("./utils");
const algo = require("../algorithms/algorithms");
class AnalyticService {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }
    /**
     * This method creates a new context and returns its info.
     * If the context already exists (same name), it returns its info instead of creating a new one.
     * @param {string} contextName
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    createContext(contextName) {
        return __awaiter(this, void 0, void 0, function* () {
            const alreadyExists = this.getContext(contextName);
            if (alreadyExists) {
                console.error(`Context ${contextName} already exists`);
                return alreadyExists;
            }
            return spinal_env_viewer_graph_service_1.SpinalGraphService.addContext(contextName, CONSTANTS.CONTEXT_TYPE, undefined)
                .then((context) => {
                const contextId = context.getId().get();
                return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(contextId);
            });
        });
    }
    /**
     * Retrieves and returns all contexts
     * handled by this service (type analysisContext)
     * @return {*}  {(SpinalNodeRef[] | undefined)}
     * @memberof AnalyticService
     */
    getContexts() {
        const contexts = spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType(CONSTANTS.CONTEXT_TYPE);
        const argContexts = contexts.map(el => spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(el.info.id.get()));
        return argContexts;
    }
    /**
     * This method retrieves and returns the info of a context. If the context does not exist, it returns undefined.
     * @param {string} contextName
     * @return {*}  {(SpinalNodeRef | undefined)}
     * @memberof AnalyticService
     */
    getContext(contextName) {
        const contexts = this.getContexts();
        if (!contexts)
            return undefined;
        return contexts.find(context => context.name.get() === contextName);
    }
    ////////////////////////////////////////////////////
    /////////////////// ENTITY /////////////////////////
    ////////////////////////////////////////////////////
    /**
     * This method creates a new entity type node and returns its info.
     *
     * @param {IEntityType} entityTypeInfo
     * @param {string} contextId
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    addEntity(entityTypeInfo, contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            entityTypeInfo.type = CONSTANTS.ENTITY_TYPE;
            const entityModel = new EntityType_1.EntityType(entityTypeInfo);
            const entityNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(entityTypeInfo, entityModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(contextId, entityNodeId, contextId, CONSTANTS.CONTEXT_TO_ENTITY_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(entityNodeId);
        });
    }
    /**
     * This method find all entities in a context that have a certain type
     *
     * @param {SpinalContext<any>} context
     * @param {string} targetType
     * @return {*}  {(Promise<SpinalNode<any> | undefined>)}
     * @memberof AnalyticService
     */
    findEntityByTargetType(context, targetType) {
        return __awaiter(this, void 0, void 0, function* () {
            const entities = yield context.getChildren(CONSTANTS.CONTEXT_TO_ENTITY_RELATION);
            const result = entities.find(e => e.info.targetNodeType.get() == targetType);
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(result);
            return result;
        });
    }
    /**
     * This method returns the info of an entity if provided with the context name and the entity name.
     *
     * @param {string} contextName
     * @param {string} entityName
     * @return {*}  {(Promise<SpinalNodeRef | undefined>)}
     * @memberof AnalyticService
     */
    getEntity(contextName, entityName) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = this.getContext(contextName);
            if (!context)
                return undefined;
            const contextNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(context.id.get());
            const entities = yield contextNode.getChildren(CONSTANTS.CONTEXT_TO_ENTITY_RELATION);
            const entitiesModels = entities.map(el => spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(el.info.id.get()));
            return entitiesModels.find(entity => entity.name.get() === entityName);
        });
    }
    /**
     * This method finds the entity that is the parent of the given analysis process.
     *
     * @param {string} analysisProcessId
     * @return {*}
     * @memberof AnalyticService
     */
    getEntityFromProcess(analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getParents(analysisProcessId, [CONSTANTS.ENTITY_TO_ANALYSIS_PROCESS_RELATION]);
            //
            if (nodes.length != 0) {
                if (nodes[0].type.get() == CONSTANTS.ENTITY_TYPE)
                    return nodes[1];
                else
                    return nodes[0];
            }
            return undefined;
        });
    }
    ////////////////////////////////////////////////////
    //////////////// ANALYSIS PROCESS //////////////////
    ////////////////////////////////////////////////////
    /**
     * This method creates a new analysis process node and returns its info.
     *
     * @param {IAnalysisProcess} analysisProcessInfo
     * @param {string} contextId
     * @param {string} entityId
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    addAnalysisProcess(analysisProcessInfo, contextId, entityId) {
        return __awaiter(this, void 0, void 0, function* () {
            analysisProcessInfo.type = CONSTANTS.ANALYSIS_PROCESS_TYPE;
            const analysisProcessModel = new AnalysisProcess_1.AnalysisProcess(analysisProcessInfo);
            const analysisProcessNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(analysisProcessInfo, analysisProcessModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(entityId, analysisProcessNodeId, contextId, CONSTANTS.ENTITY_TO_ANALYSIS_PROCESS_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(analysisProcessNodeId);
        });
    }
    /**
     * This method retrieves and returns all analysis processes in a context.
     *
     * @param {string} contextId
     * @return {*}
     * @memberof AnalyticService
     */
    getAllAnalysisProcesses(contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            const analysisProcesses = yield spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(contextId, contextId, (node) => {
                if (node.getType().get() === CONSTANTS.ANALYSIS_PROCESS_TYPE) {
                    spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
                    return true;
                }
                return false;
            });
            return analysisProcesses;
        });
    }
    getAnalysisProcess(contextId, analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const analysisProcesses = yield spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(contextId, contextId, (node) => {
                if (node.getType().get() === CONSTANTS.ANALYSIS_PROCESS_TYPE) {
                    spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
                    return true;
                }
                return false;
            });
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(analysisProcessId);
        });
    }
    getAnalysisProcessByName(contextId, analysisProcessName) {
        return __awaiter(this, void 0, void 0, function* () {
            const analysisProcesses = yield spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(contextId, contextId, (node) => {
                if (node.getType().get() === CONSTANTS.ANALYSIS_PROCESS_TYPE) {
                    spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
                    return true;
                }
                return false;
            });
            const analysisProcess = analysisProcesses.find((el) => el.info.name.get() == analysisProcessName);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(analysisProcess.id.get());
        });
    }
    ////////////////////////////////////////////////////
    /////////////////// ANALYTIC ///////////////////////
    ////////////////////////////////////////////////////
    /**
     * This method creates a new analytic node and returns its info.
     *
     * @param {IAnalytic} analyticInfo
     * @param {string} contextId
     * @param {string} analysisProcessId
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    addAnalytic(analyticInfo, contextId, analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            analyticInfo.type = CONSTANTS.ANALYTIC_TYPE;
            const analyticModel = new Analytic_1.Analytic(analyticInfo);
            const analyticNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(analyticInfo, analyticModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(analysisProcessId, analyticNodeId, contextId, CONSTANTS.ANALYSIS_PROCESS_TO_ANALYTIC_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(analyticNodeId);
        });
    }
    /**
     * This method retrieves and returns all analytics in a context.
     *
     * @param {string} analysisProcessId
     * @return {*}  {(Promise<SpinalNode<any> | undefined>)}
     * @memberof AnalyticService
     */
    getAnalytic(analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analysisProcessId, [CONSTANTS.ANALYSIS_PROCESS_TO_ANALYTIC_RELATION]);
            if (node.length != 0) {
                return node[0];
            }
            return undefined;
        });
    }
    ////////////////////////////////////////////////////
    //////////////// TRACKED VARIABLE //////////////////
    ////////////////////////////////////////////////////
    /**
     * This method creates a new tracked variable node and returns its info.
     *
     * @param {ITrackedVariableMethod} trackedVariableInfo
     * @param {string} contextId
     * @param {string} analysisProcessId
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    addTrackedVariableMethod(trackedVariableInfo, contextId, analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            trackedVariableInfo.type = CONSTANTS.TRACKED_VARIABLE_METHOD_TYPE;
            const trackedVariableModel = new TrackedVariableMethod_1.TrackedVariableMethod(trackedVariableInfo);
            const trackedVariableNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(trackedVariableInfo, trackedVariableModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(analysisProcessId, trackedVariableNodeId, contextId, CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(trackedVariableNodeId);
        });
    }
    /**
     * This method retrieves and returns all tracked variables children of an analysis process.
     *
     * @param {string} analysisProcessId
     * @return {*}  {(Promise<SpinalNodeRef[] | undefined>)}
     * @memberof AnalyticService
     */
    getTrackedVariableMethods(analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analysisProcessId, [CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION]);
            if (nodes.length != 0) {
                return nodes;
            }
            return undefined;
        });
    }
    /**
     * This method retrieves and returns the tracked variable child (the first one) of an analysis process.
     *
     * @param {string} analysisProcessId
     * @return {*}  {(Promise<SpinalNodeRef | undefined>)}
     * @memberof AnalyticService
     */
    getTrackedVariableMethod(analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analysisProcessId, [CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION]);
            if (nodes.length != 0) {
                return nodes[0];
            }
            return undefined;
        });
    }
    /**
     * This method removes a tracked variable child of an analysis process.
     *
     * @param {string} analysisProcessId
     * @param {string} trackedVariableId
     * @memberof AnalyticService
     */
    removeTrackedVariableMethod(analysisProcessId, trackedVariableId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.removeChild(analysisProcessId, trackedVariableId, CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.removeFromGraph(trackedVariableId);
        });
    }
    /**
     * This method applies a tracked variable method to an analysis process's followed entity to get the entry data.
     *
     * @param {string} analysisProcessId
     * @param {string} trackedVariableId
     * @memberof AnalyticService
     */
    applyTrackedVariableMethod(analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackedVariableMethodModel = yield this.getTrackedVariableMethod(analysisProcessId);
            const followedEntityModel = yield this.getFollowedEntity(analysisProcessId);
            if (followedEntityModel && trackedVariableMethodModel) {
                const trackMethod = trackedVariableMethodModel.trackMethod.get();
                const filterValue = trackedVariableMethodModel.filterValue.get();
                switch (trackMethod) {
                    case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER:
                        const endpoints = yield (0, utils_1.findEndpoints)(followedEntityModel.id.get(), filterValue);
                        return endpoints;
                    case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER:
                        const controlEndpoints = yield (0, utils_1.findControlEndpoints)(followedEntityModel.id.get(), filterValue);
                        return controlEndpoints;
                    case CONSTANTS.TRACK_METHOD.TICKET_NAME_FILTER:
                        console.log("Ticket filter");
                        break;
                    default:
                        console.log("Track method not recognized");
                }
            }
        });
    }
    ////////////////////////////////////////////////////
    //////////////// FOLLOWED ENTITY ///////////////////
    ////////////////////////////////////////////////////
    /**
     * This method creates a new link between an analysis process and a followed entity.
     *
     * @param {string} contextId
     * @param {string} analysisProcessId
     * @param {string} followedEntityId
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    addLinkToFollowedEntity(contextId, analysisProcessId, followedEntityId) {
        return __awaiter(this, void 0, void 0, function* () {
            const link = yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(analysisProcessId, followedEntityId, contextId, CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_ENTITY_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            console.log(link);
            const id = link.info.id.get();
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(id);
        });
    }
    /**
     * This method removes the link between an analysis process and a followed entity.
     *
     * @param {string} analysisProcessId
     * @param {string} followedEntityId
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    removeLinkToFollowedEntity(analysisProcessId, followedEntityId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.removeChild(analysisProcessId, followedEntityId, CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_ENTITY_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
        });
    }
    /**
     * This method retrieves and returns the followed entity child of an analysis process.
     *
     * @param {string} analysisProcessId
     * @return {*}
     * @memberof AnalyticService
     */
    getFollowedEntity(analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analysisProcessId, [CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_ENTITY_RELATION]);
            if (node.length != 0) {
                return node[0];
            }
            return undefined;
        });
    }
    ///////////////////////////////////////////////////
    ///////////////////// GLOBAL //////////////////////
    ///////////////////////////////////////////////////
    /**
     * This method aims at giving a full report of an analysis process.
     *
     *
     * @param {string} contextId
     * @param {string} analysisProcessId
     * @return {*}
     * @memberof AnalyticService
     */
    getCompleteAnalysis(contextId, analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const obj = {
                analysisProcessId: analysisProcessId,
                contextId: contextId,
                processName: "",
                intervalProcessing: "",
                followedEntityId: "",
                followedEntityType: "",
                variableName: "",
                variableType: "",
                analytic: {
                    id: "",
                    algorithmUsed: "",
                    resultName: "",
                    resultType: "",
                }
            };
            const analysisProcessNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(analysisProcessId);
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(analysisProcessNode);
            const entity = yield this.getFollowedEntity(analysisProcessId);
            if (entity != undefined) {
                obj.followedEntityId = entity.id.get();
                obj.followedEntityType = entity.type.get();
            }
            const analytic = yield this.getAnalytic(analysisProcessId);
            if (analytic != undefined) {
                obj.analytic.id = analytic.info.id.get();
                obj.analytic.algorithmUsed = analytic.info.name.get();
                obj.analytic.resultName = analytic.info.resultName.get();
                obj.analytic.resultType = analytic.info.resultType.get();
            }
            const followedVariable = yield this.getTrackedVariableMethod(analysisProcessId);
            if (followedVariable != undefined) {
                obj.variableType = followedVariable.type.get();
                obj.variableName = followedVariable.name.get();
            }
            return obj;
        });
    }
    /**
     * Get the complete report for all analysis processes in a context.
     *
     * @param {string} contextId
     * @return {*}
     * @memberof AnalyticService
     */
    getCompleteAnalysisList(contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            const analysisProcessList = yield this.getAllAnalysisProcesses(contextId);
            const analysisList = [];
            for (const analysisProcess of analysisProcessList) {
                const analysis = yield this.getCompleteAnalysis(contextId, analysisProcess.id.get());
                //analysisList.push(analysis);
            }
            return analysisList;
        });
    }
    doAnalysis(analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            //step 1 get all three infos : 1- analytic , 2- followed entity, 3- tracked variable
            //step 2 use the tracked variable method to get the data
            //step 3 use analytic to call the correct algorithme and produce the correct result
            const followedEntity = yield this.getFollowedEntity(analysisProcessId);
            const trackedVariable = yield this.getTrackedVariableMethod(analysisProcessId);
            const analytic = yield this.getAnalytic(analysisProcessId);
            //step1 done 
            if (followedEntity && trackedVariable && analytic) {
                const trackedVariableId = trackedVariable.id.get();
                const analyticId = analytic.id.get();
                const followedEntityId = followedEntity.id.get();
                const entryDataModels = yield this.applyTrackedVariableMethod(analysisProcessId);
                //step2 done
                if (entryDataModels) {
                    const algorithm_name = analytic.name.get();
                    const value = (yield entryDataModels[0].element.load()).currentValue.get();
                    //const value = entryDataModels[0].currentValue.get();
                    const result = algo[algorithm_name](value, [15]); // tmp
                    console.log("ANALYSIS RESULT : ", result);
                    if (result) {
                        switch (analytic.resultType.get()) {
                            case CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET:
                                const analysisInfo = spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(analysisProcessId);
                                const analysisName = analysisInfo.name.get();
                                let ticketInfos = {
                                    name: analysisName + " : " + followedEntity.name.get()
                                };
                                const ticket = (0, utils_1.addTicketAlarm)(ticketInfos, analysisInfo.id.get());
                                break;
                        }
                        //step3 done
                    }
                }
            }
        });
    }
}
exports.default = AnalyticService;
exports.AnalyticService = AnalyticService;
//# sourceMappingURL=AnalyticService.js.map