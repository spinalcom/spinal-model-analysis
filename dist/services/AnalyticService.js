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
class AnalyticService {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }
    /**
       * This method creates an analysis context. Since it does not have any particular additional info for now
       * it does not have a specific model.
       * @param  {string} contextName - The analysis's context Name
       * @returns Promise of the node's info (SpinalNodeRef)
       */
    createContext(contextName) {
        return spinal_env_viewer_graph_service_1.SpinalGraphService.addContext(contextName, CONSTANTS.CONTEXT_TYPE, undefined)
            .then((context) => {
            const contextId = context.getId().get();
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(contextId);
        });
    }
    /**
     * Retrieves and returns a single (if provided a context name) or all contexts
     * handled by this service (type analysisContext)
     * @returns Promise
     */
    getContexts(contextName) {
        const contexts = spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType(CONSTANTS.CONTEXT_TYPE);
        const argContexts = contexts.map(el => spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(el.id));
        if (typeof contextName === "undefined")
            return argContexts;
        return argContexts.find(context => context.name.get() === contextName);
    }
    ////////////////////////////////////////////////////
    /////////////////// ENTITY /////////////////////////
    ////////////////////////////////////////////////////
    addEntity(entityTypeInfo, contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            const entityModel = new EntityType_1.EntityType(entityTypeInfo);
            const entityNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(entityTypeInfo, entityModel);
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
    addAnalysisProcess(analysisProcessInfo, contextId, entityId) {
        return __awaiter(this, void 0, void 0, function* () {
            const analysisProcessModel = new AnalysisProcess_1.AnalysisProcess(analysisProcessInfo);
            const analysisProcessNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(analysisProcessInfo, analysisProcessModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(entityId, analysisProcessNodeId, contextId, CONSTANTS.ENTITY_TO_ANALYSIS_PROCESS_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(analysisProcessNodeId);
        });
    }
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
    ////////////////////////////////////////////////////
    /////////////////// ANALYTIC ///////////////////////
    ////////////////////////////////////////////////////
    addAnalytic(analyticInfo, contextId, analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const analyticModel = new Analytic_1.Analytic(analyticInfo);
            const analyticNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(analyticInfo, analyticModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(analysisProcessId, analyticNodeId, contextId, CONSTANTS.ANALYSIS_PROCESS_TO_ANALYTIC_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(analyticNodeId);
        });
    }
    getAnalytic(analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analysisProcessId, [CONSTANTS.ANALYSIS_PROCESS_TO_ANALYTIC_RELATION]);
            if (node.length != 0) {
                const realNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(node[0].id.get());
                spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(realNode);
                return realNode;
            }
            return undefined;
        });
    }
    ////////////////////////////////////////////////////
    //////////////// TRACKED VARIABLE //////////////////
    ////////////////////////////////////////////////////
    addTrackedVariableMethod(trackedVariableInfo, contextId, analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackedVariableModel = new TrackedVariableMethod_1.TrackedVariableMethod(trackedVariableInfo);
            const trackedVariableNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(trackedVariableInfo, trackedVariableModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(analyticId, trackedVariableNodeId, contextId, CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(trackedVariableNodeId);
        });
    }
    getTrackedVariableMethods(analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analysisProcessId, [CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION]);
            if (nodes.length != 0) {
                return nodes;
            }
            return undefined;
        });
    }
    getTrackedVariableMethod(analysisProcessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analysisProcessId, [CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION]);
            if (nodes.length != 0) {
                return nodes[0];
            }
            return undefined;
        });
    }
    ////////////////////////////////////////////////////
    //////////////// FOLLOWED ENTITY ///////////////////
    ////////////////////////////////////////////////////
    addLinkToFollowedEntity(contextId, analysisProcessId, followedEntityId) {
        return __awaiter(this, void 0, void 0, function* () {
            const link = yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(analysisProcessId, followedEntityId, contextId, CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_ENTITY_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            const id = link.getId().get();
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(id);
        });
    }
    removeLinkToFollowedEntity(analysisProcessId, followedEntityId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.removeChild(analysisProcessId, followedEntityId, CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_ENTITY_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
        });
    }
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
    getCompleteAnalysisList(contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            const analysisProcessList = yield this.getAllAnalysisProcesses(contextId);
            const analysisList = [];
            for (const analysisProcess of analysisProcessList) {
                const analysis = yield this.getCompleteAnalysis(contextId, analysisProcess.id.get());
                analysisList.push(analysis);
            }
            return analysisList;
        });
    }
}
exports.default = AnalyticService;
exports.AnalyticService = AnalyticService;
//# sourceMappingURL=AnalyticService.js.map