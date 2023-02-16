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
const ConfigModel_1 = require("../models/ConfigModel");
const AnalyticModel_1 = require("../models/AnalyticModel");
const EntityModel_1 = require("../models/EntityModel");
const TrackingMethodModel_1 = require("../models/TrackingMethodModel");
const InputsModel_1 = require("../models/InputsModel");
const OutputsModel_1 = require("../models/OutputsModel");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
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
    addEntity(entityInfo, contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            entityInfo.type = CONSTANTS.ENTITY_TYPE;
            const entityModel = new EntityModel_1.EntityModel(entityInfo);
            const entityNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(entityInfo, entityModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(contextId, entityNodeId, contextId, CONSTANTS.CONTEXT_TO_ENTITY_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(entityNodeId);
        });
    }
    findEntityByTargetType(context, targetType) {
        return __awaiter(this, void 0, void 0, function* () {
            const entities = yield context.getChildren(CONSTANTS.CONTEXT_TO_ENTITY_RELATION);
            const result = entities.find(e => e.info.targetNodeType.get() == targetType);
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(result);
            return result;
        });
    }
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
    getEntityFromAnalytic(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getParents(analyticId, [CONSTANTS.ENTITY_TO_ANALYTIC_RELATION]);
            if (nodes.length != 0) {
                return nodes[0];
            }
            return undefined;
        });
    }
    ////////////////////////////////////////////////////
    //////////////// Analytic //////////////////////////
    ////////////////////////////////////////////////////
    addAnalytic(analyticInfo, contextId, entityId) {
        return __awaiter(this, void 0, void 0, function* () {
            analyticInfo.type = CONSTANTS.ANALYTIC_TYPE;
            const analyticModel = new AnalyticModel_1.AnalyticModel(analyticInfo);
            const analyticNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(analyticInfo, analyticModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(entityId, analyticNodeId, contextId, CONSTANTS.ENTITY_TO_ANALYTIC_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            yield this.addInputsNode(analyticNodeId, contextId);
            yield this.addOutputsNode(analyticNodeId, contextId);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(analyticNodeId);
        });
    }
    getAllAnalytics(contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            const analytics = yield spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(contextId, contextId, (node) => {
                if (node.getType().get() === CONSTANTS.ANALYTIC_TYPE) {
                    spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
                    return true;
                }
                return false;
            });
            return analytics;
        });
    }
    getAnalytic(contextId, analyticName) {
        return __awaiter(this, void 0, void 0, function* () {
            const analytics = yield spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(contextId, contextId, (node) => {
                if (node.getType().get() === CONSTANTS.ANALYTIC_TYPE) {
                    spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
                    return true;
                }
                return false;
            });
            const analytic = analytics.find((el) => el.info.name.get() == analyticName);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(analytic.id.get());
        });
    }
    addInputsNode(analyticId, contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputsInfo = {
                name: "Inputs",
                description: ""
            };
            const inputsModel = new InputsModel_1.InputsModel(inputsInfo);
            let inputsId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(inputsInfo, inputsModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(analyticId, inputsId, contextId, CONSTANTS.ANALYTIC_TO_INPUTS_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(inputsId);
        });
    }
    addOutputsNode(analyticId, contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            const outputsInfo = {
                name: "Outputs",
                description: ""
            };
            const outputsModel = new OutputsModel_1.OutputsModel(outputsInfo);
            let outputsId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(outputsInfo, outputsModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(analyticId, outputsId, contextId, CONSTANTS.ANALYTIC_TO_OUTPUTS_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(outputsId);
        });
    }
    addConfig(configInfo, configAttributes, analyticId, contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            configInfo.name = "Config";
            configInfo.type = CONSTANTS.CONFIG_TYPE;
            const configModel = new ConfigModel_1.ConfigModel(configInfo);
            let configId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(configInfo, configModel);
            const configNode = yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(analyticId, configId, contextId, CONSTANTS.ANALYTIC_TO_CONFIG_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            for (let attribute of configAttributes) {
                yield spinal_env_viewer_plugin_documentation_service_1.default.addAttributeByCategoryName(configNode, CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS, attribute.name, attribute.value, attribute.type, "");
            }
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(configId);
        });
    }
    getConfig(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analyticId, [CONSTANTS.ANALYTIC_TO_CONFIG_RELATION]);
            if (nodes.length === 0)
                return undefined;
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(nodes[0].id.get());
        });
    }
    getInputsNode(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analyticId, [CONSTANTS.ANALYTIC_TO_INPUTS_RELATION]);
            if (nodes.length === 0)
                return undefined;
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(nodes[0].id.get());
        });
    }
    getOutputsNode(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analyticId, [CONSTANTS.ANALYTIC_TO_OUTPUTS_RELATION]);
            if (nodes.length === 0)
                return undefined;
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(nodes[0].id.get());
        });
    }
    ////////////////////////////////////////////////////
    //////////////// TRACKED VARIABLE //////////////////
    ////////////////////////////////////////////////////
    addTrackingMethod(trackingMethodInfo, contextId, inputId) {
        return __awaiter(this, void 0, void 0, function* () {
            trackingMethodInfo.type = CONSTANTS.TRACKING_METHOD_TYPE;
            const trackingMethodModel = new TrackingMethodModel_1.TrackingMethodModel(trackingMethodInfo);
            const trackingMethodNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(trackingMethodInfo, trackingMethodModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(inputId, trackingMethodNodeId, contextId, CONSTANTS.ANALYTIC_INPUTS_TO_TRACKING_METHOD_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(trackingMethodNodeId);
        });
    }
    addInputTrackingMethod(trackingMethodInfo, contextId, analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputs = yield this.getInputsNode(analyticId);
            if (inputs === undefined)
                throw Error("Inputs node not found");
            return this.addTrackingMethod(trackingMethodInfo, contextId, inputs.id.get());
        });
    }
    getTrackingMethods(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputs = yield this.getInputsNode(analyticId);
            if (inputs === undefined)
                return undefined;
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(inputs.id.get(), [CONSTANTS.ANALYTIC_INPUTS_TO_TRACKING_METHOD_RELATION]);
            return nodes;
        });
    }
    getTrackingMethod(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackingMethods = yield this.getTrackingMethods(analyticId);
            if (trackingMethods === undefined)
                return undefined;
            return trackingMethods[0];
        });
    }
    removeTrackingMethod(inputId, trackingMethodId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.removeChild(inputId, trackingMethodId, CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.removeFromGraph(trackingMethodId);
        });
    }
    removeInputTrackingMethod(analyticId, trackingMethodId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputs = yield this.getInputsNode(analyticId);
            if (inputs === undefined)
                throw Error("Inputs node not found");
            yield this.removeTrackingMethod(inputs.id.get(), trackingMethodId);
        });
    }
    applyTrackingMethodLegacy(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackingMethodModel = yield this.getTrackingMethod(analyticId);
            const followedEntityModel = yield this.getFollowedEntity(analyticId);
            if (followedEntityModel && trackingMethodModel) {
                const trackMethod = trackingMethodModel.trackMethod.get();
                const filterValue = trackingMethodModel.filterValue.get();
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
    applyTrackingMethod(trackingMethod, followedEntity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (followedEntity && trackingMethod) {
                const trackMethod = trackingMethod.trackMethod.get();
                const filterValue = trackingMethod.filterValue.get();
                switch (trackMethod) {
                    case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER:
                        const endpoints = yield (0, utils_1.findEndpoints)(followedEntity.id.get(), filterValue);
                        return endpoints;
                    case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER:
                        const controlEndpoints = yield (0, utils_1.findControlEndpoints)(followedEntity.id.get(), filterValue);
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
    addLinkToFollowedEntity(contextId, inputId, followedEntityId) {
        return __awaiter(this, void 0, void 0, function* () {
            const link = yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(inputId, followedEntityId, contextId, CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            const id = link.info.id.get();
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(id);
        });
    }
    addInputLinkToFollowedEntity(contextId, analyticId, followedEntityId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputs = yield this.getInputsNode(analyticId);
            if (inputs === undefined)
                throw Error("Inputs node not found");
            return this.addLinkToFollowedEntity(contextId, inputs.id.get(), followedEntityId);
        });
    }
    removeLinkToFollowedEntity(analysisProcessId, followedEntityId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.removeChild(analysisProcessId, followedEntityId, CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
        });
    }
    getFollowedEntity(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputsNode = yield this.getInputsNode(analyticId);
            if (inputsNode === undefined)
                return undefined;
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(inputsNode.id.get(), [CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION]);
            if (nodes === undefined)
                return undefined;
            return nodes[0];
        });
    }
    ///////////////////////////////////////////////////
    ///////////////////// GLOBAL //////////////////////
    ///////////////////////////////////////////////////
    /*public async getCompleteAnalysis(contextId: string, analysisProcessId: string) {
       const obj = {
           analysisProcessId: analysisProcessId,
           contextId: contextId,
           processName: "",
           intervalProcessing : "",
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
       const analysisProcessNode = SpinalGraphService.getRealNode(analysisProcessId);
       (<any>SpinalGraphService)._addNode(analysisProcessNode);
 
       const entity = await this.getFollowedEntity(analysisProcessId);
       if (entity != undefined) {
           obj.followedEntityId = entity.id.get();
           obj.followedEntityType = entity.type.get();
       }
       const analytic = await this.getAnalytic(analysisProcessId);
       if (analytic != undefined) {
          obj.analytic.id = analytic.info.id.get();
          obj.analytic.algorithmUsed = analytic.info.name.get();
          obj.analytic.resultName = analytic.info.resultName.get();
          obj.analytic.resultType = analytic.info.resultType.get();
       }
       const followedVariable = await this.getTrackedVariableMethod(analysisProcessId);
       if(followedVariable != undefined){
           obj.variableType = followedVariable.type.get();
           obj.variableName = followedVariable.name.get();
       }
       return obj;
    }
 
    public async getCompleteAnalysisList(contextId: string) {
       const analysisProcessList = await this.getAllAnalysisProcesses(contextId);
       const analysisList = [];
       for (const analysisProcess of analysisProcessList) {
           const analysis = await this.getCompleteAnalysis(contextId, analysisProcess.id.get());
           //analysisList.push(analysis);
       }
       return analysisList;
    }*/
    applyResult(result, analyticId, config, followedEntity, trackingMethod) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (config.resultType.get()) {
                case CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET:
                    const analyticInfo = spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(analyticId);
                    const analyticName = analyticInfo.name.get();
                    let ticketInfos = {
                        name: analyticName + " : " + followedEntity.name.get()
                    };
                    const ticket = (0, utils_1.addTicketAlarm)(ticketInfos, analyticInfo.id.get());
                    break;
                case CONSTANTS.ANALYTIC_RESULT_TYPE.MODIFY_CONTROL_ENDPOINT:
                    const entries = yield this.applyTrackingMethod(trackingMethod, followedEntity);
                    if (!entries)
                        return;
                    for (const entry of entries) {
                        const cp = yield entry.element.load();
                        cp.currentValue.set(result);
                    }
                    console.log("Modify control endpoint");
                    break;
            }
        });
    }
    getWorkingFollowedEntities(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const followedEntity = yield this.getFollowedEntity(analyticId);
            const trackingMethod = yield this.getTrackingMethod(analyticId);
            const config = yield this.getConfig(analyticId);
            const entityInfo = yield this.getEntityFromAnalytic(analyticId);
            const entityType = entityInfo.entityType.get();
            if (followedEntity && trackingMethod && config) {
                if (entityType == followedEntity.type.get()) {
                    // we can continue as planned
                    return [followedEntity];
                }
                else {
                    const isGroup = followedEntity.type.get().includes("group");
                    const relationNameToTargets = isGroup ? CONSTANTS.GROUP_RELATION_PREFIX + entityType :
                        "has" + entityType.charAt(0).toUpperCase() + entityType.slice(1);
                    const entities = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(followedEntity.id.get(), [relationNameToTargets]);
                    return entities;
                }
            }
        });
    }
    getEntryDataModelsFromFollowedEntity(analyticId, followedEntity) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackingMethod = yield this.getTrackingMethod(analyticId);
            if (trackingMethod)
                return this.applyTrackingMethod(trackingMethod, followedEntity);
        });
    }
    getDataAndApplyAlgorithm(analyticId, followedEntity) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackingMethod = yield this.getTrackingMethod(analyticId);
            const config = yield this.getConfig(analyticId);
            if (!trackingMethod || !config)
                return;
            const entryDataModels = yield this.applyTrackingMethod(trackingMethod, followedEntity);
            if (entryDataModels) {
                const algorithm_name = config.algorithm.get();
                const value = (yield entryDataModels[0].element.load()).currentValue.get();
                //const value = entryDataModels[0].currentValue.get();
                const params = yield (0, utils_1.getAlgorithmParameters)(config);
                const result = algo[algorithm_name](value, params); // tmp
                console.log("ANALYSIS RESULT : ", result);
                if (result) {
                    this.applyResult(result, analyticId, config, followedEntity, trackingMethod);
                }
            }
        });
    }
    doAnalysis(analyticId, followedEntity) {
        return __awaiter(this, void 0, void 0, function* () {
            const entryDataModels = this.getEntryDataModelsFromFollowedEntity(analyticId, followedEntity);
            if (!entryDataModels)
                return;
            this.getDataAndApplyAlgorithm(analyticId, followedEntity);
        });
    }
}
exports.default = AnalyticService;
exports.AnalyticService = AnalyticService;
//# sourceMappingURL=AnalyticService.js.map