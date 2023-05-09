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
const spinal_env_viewer_plugin_documentation_service_2 = require("spinal-env-viewer-plugin-documentation-service");
const utils_1 = require("./utils");
const algo = require("../algorithms/algorithms");
class AnalyticService {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }
    /**
     * This method creates a new context and returns the info of the newly created context.
     * If the context already exists (same name), it just returns the info of that context instead of creating a new one.
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
            return spinal_env_viewer_graph_service_1.SpinalGraphService.addContext(contextName, CONSTANTS.CONTEXT_TYPE, undefined).then((context) => {
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
        const argContexts = contexts.map((el) => spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(el.info.id.get()));
        return argContexts;
    }
    /**
     * This method use the context name to find and return the info of that context. If the context does not exist, it returns undefined.
     * If multiple contexts have the same name, it returns the first one.
     * @param {string} contextName
     * @return {*}  {(SpinalNodeRef | undefined)}
     * @memberof AnalyticService
     */
    getContext(contextName) {
        const contexts = this.getContexts();
        if (!contexts)
            return undefined;
        return contexts.find((context) => context.name.get() === contextName);
    }
    ////////////////////////////////////////////////////
    /////////////////// ENTITY /////////////////////////
    ////////////////////////////////////////////////////
    /**
     * This method creates a new entity and returns the info of the newly created entity.
     *
     * @param {IEntity} entityInfo
     * @param {string} contextId
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    addEntity(entityInfo, contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            entityInfo.type = CONSTANTS.ENTITY_TYPE;
            const entityModel = new EntityModel_1.EntityModel(entityInfo);
            const entityNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(entityInfo, entityModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(contextId, entityNodeId, contextId, CONSTANTS.CONTEXT_TO_ENTITY_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(entityNodeId);
        });
    }
    /**
     * Returns all the entities withing a context that have the specified type.
     *
     * @param {SpinalContext<any>} context
     * @param {string} targetType
     * @return {*}  {(Promise<SpinalNode<any> | undefined>)}
     * @memberof AnalyticService
     */
    findEntityByTargetType(context, targetType) {
        return __awaiter(this, void 0, void 0, function* () {
            const entities = yield context.getChildren(CONSTANTS.CONTEXT_TO_ENTITY_RELATION);
            const result = entities.find((e) => e.info.entityType.get() == targetType);
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(result);
            return result;
        });
    }
    /**
     * Retrieves a SpinalNodeRef for the specified entity within the specified context.
     * @async
     * @param {string} contextName - The name of the context to search within.
     * @param {string} entityName - The name of the entity to retrieve.
     * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the SpinalNodeRef for the entity, or undefined if the context or entity cannot be found.
     * @memberof AnalyticService
     */
    getEntity(contextName, entityName) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = this.getContext(contextName);
            if (!context)
                return undefined;
            const contextNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(context.id.get());
            const entities = yield contextNode.getChildren(CONSTANTS.CONTEXT_TO_ENTITY_RELATION);
            const entitiesModels = entities.map((el) => spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(el.info.id.get()));
            return entitiesModels.find((entity) => entity.name.get() === entityName);
        });
    }
    /**
     * Retrieves the parent entity of the specified analytic.
     * @async
     * @param {string} analyticId - The ID of the analytic for which to retrieve the parent entity.
     * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the parent entity, or undefined if the parent entity cannot be found.
     * @memberof AnalyticService
     */
    getEntityFromAnalytic(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getParents(analyticId, [
                CONSTANTS.ENTITY_TO_ANALYTIC_RELATION,
            ]);
            if (nodes.length != 0) {
                return nodes[0];
            }
            return undefined;
        });
    }
    ////////////////////////////////////////////////////
    //////////////// Analytic //////////////////////////
    ////////////////////////////////////////////////////
    /**
     * Adds a new analytic to the specified entity within the specified context.
     * @async
     * @param {IAnalytic} analyticInfo - The information for the new analytic to add.
     * @param {string} contextId - The ID of the context in which to add the analytic.
     * @param {string} entityId - The ID of the entity to which to add the analytic.
     * @returns {Promise<SpinalNodeRef>} A Promise that resolves to the newly created analytic info.
     * @memberof AnalyticService
     */
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
    /**
     * Retrieves all analytics within the specified context.
     * @async
     * @param {string} contextId - The ID of the context in which to retrieve analytics.
     * @returns {Promise<SpinalNodeRef[]>} A Promise that resolves to an array of SpinalNodeRefs for all analytics in the context.
     * @memberof AnalyticService
     */
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
    /**
     * Retrieves the SpinalNodeRef for the specified analytic within the specified context.
     * @async
     * @param {string} contextId - The ID of the context in which to search for the analytic.
     * @param {string} analyticName - The name of the analytic to retrieve.
     * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the SpinalNodeRef for the analytic, or undefined if the analytic cannot be found.
     * @memberof AnalyticService
     */
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
    /**
     * Adds an Inputs node to the specified analytic within the specified context.
     * @async
     * @param {string} analyticId - The ID of the analytic to which to add the Inputs node.
     * @param {string} contextId - The ID of the context in which to add the Inputs node.
     * @returns {Promise<SpinalNodeRef>} A Promise that resolves to the newly created Inputs node.
     * @memberof AnalyticService
     */
    addInputsNode(analyticId, contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputsInfo = {
                name: 'Inputs',
                description: '',
            };
            const inputsModel = new InputsModel_1.InputsModel(inputsInfo);
            let inputsId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(inputsInfo, inputsModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(analyticId, inputsId, contextId, CONSTANTS.ANALYTIC_TO_INPUTS_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(inputsId);
        });
    }
    /**
     * Adds an Outputs node to the specified analytic within the specified context.
     * @async
     * @param {string} analyticId - The ID of the analytic to which to add the Outputs node.
     * @param {string} contextId - The ID of the context in which to add the Outputs node.
     * @returns {Promise<SpinalNodeRef>} A Promise that resolves to the newly created Outputs node.
     * @memberof AnalyticService
     */
    addOutputsNode(analyticId, contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            const outputsInfo = {
                name: 'Outputs',
                description: '',
            };
            const outputsModel = new OutputsModel_1.OutputsModel(outputsInfo);
            let outputsId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(outputsInfo, outputsModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(analyticId, outputsId, contextId, CONSTANTS.ANALYTIC_TO_OUTPUTS_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(outputsId);
        });
    }
    /**
     * Adds a new Config node to the specified analytic within the specified context, with the specified attributes.
     * @async
     * @param {IConfig} configInfo - The information for the new Config node to add.
     * @param {any[]} configAttributes - An array of objects representing the attributes to add to the Config node.
     * @param {string} analyticId - The ID of the analytic to which to add the Config node.
     * @param {string} contextId - The ID of the context in which to add the Config node.
     * @returns {Promise<SpinalNodeRef>} A Promise that resolves to the newly created Config node.
     * @memberof AnalyticService
     */
    addConfig(configAttributes, analyticId, contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            const configNodeInfo = { name: 'Config', type: CONSTANTS.CONFIG_TYPE };
            const configModel = new ConfigModel_1.ConfigModel(configNodeInfo);
            let configId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(configNodeInfo, configModel);
            const configNode = yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(analyticId, configId, contextId, CONSTANTS.ANALYTIC_TO_CONFIG_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            this.addAttributesToNode(configNode, configAttributes);
            /*for (let attribute of configAttributes) {
              await AttributeService.addAttributeByCategoryName(
                configNode,
                CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS,
                attribute.name,
                attribute.value,
                attribute.type,
                ''
              );
            }*/
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(configId);
        });
    }
    /**
     * Retrieves the Config node for the specified analytic.
     * @async
     * @param {string} analyticId - The ID of the analytic for which to retrieve the Config node.
     * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the Config node, or undefined if the Config node cannot be found.
     * @memberof AnalyticService
     */
    getConfig(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analyticId, [
                CONSTANTS.ANALYTIC_TO_CONFIG_RELATION,
            ]);
            if (nodes.length === 0)
                return undefined;
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(nodes[0].id.get());
        });
    }
    /**
     * Retrieves the Inputs node for the specified analytic.
     * @async
     * @param {string} analyticId - The ID of the analytic for which to retrieve the Inputs node.
     * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the Inputs node, or undefined if the Inputs node cannot be found.
     * @memberof AnalyticService
     */
    getInputsNode(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analyticId, [
                CONSTANTS.ANALYTIC_TO_INPUTS_RELATION,
            ]);
            if (nodes.length === 0)
                return undefined;
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(nodes[0].id.get());
        });
    }
    /**
     * Retrieves the Outputs node for the specified analytic.
     * @async
     * @param {string} analyticId - The ID of the analytic for which to retrieve the Outputs node.
     * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the Outputs node, or undefined if the Outputs node cannot be found.
     * @memberof AnalyticService
     */
    getOutputsNode(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analyticId, [
                CONSTANTS.ANALYTIC_TO_OUTPUTS_RELATION,
            ]);
            if (nodes.length === 0)
                return undefined;
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(nodes[0].id.get());
        });
    }
    ////////////////////////////////////////////////////
    //////////////// TRACKED VARIABLE //////////////////
    ////////////////////////////////////////////////////
    /**
     * Adds a new Tracking Method node to the specified Input node within the specified context.
     * @async
     * @param {ITrackingMethod} trackingMethodInfo - The information for the new Tracking Method node to add.
     * @param {string} contextId - The ID of the context in which to add the Tracking Method node.
     * @param {string} inputId - The ID of the Input node to which to add the Tracking Method node.
     * @returns {Promise<SpinalNodeRef>} A Promise that resolves to the newly created Tracking Method node.
     * @memberof AnalyticService
     */
    addTrackingMethod(trackingMethodAttributes, contextId, inputId) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackingMethodNodeInfo = {
                name: 'TrackingMethod',
                type: CONSTANTS.TRACKING_METHOD_TYPE,
            };
            const trackingMethodModel = new TrackingMethodModel_1.TrackingMethodModel(trackingMethodNodeInfo);
            const trackingMethodNodeId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(trackingMethodNodeInfo, trackingMethodModel);
            const createdNode = yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(inputId, trackingMethodNodeId, contextId, CONSTANTS.ANALYTIC_INPUTS_TO_TRACKING_METHOD_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            this.addAttributesToNode(createdNode, trackingMethodAttributes);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(trackingMethodNodeId);
        });
    }
    /**
     * Adds a new Tracking Method node to the Inputs node of the specified analytic within the specified context.
     * @async
     * @param {ITrackingMethod} trackingMethodInfo - The information for the new Tracking Method node to add.
     * @param {string} contextId - The ID of the context in which to add the Tracking Method node.
     * @param {string} analyticId - The ID of the analytic for which to add the Tracking Method node.
     * @returns {Promise<SpinalNodeRef>} A Promise that resolves to the newly created Tracking Method node.
     * @throws {Error} Throws an error if the Inputs node cannot be found.
     * @memberof AnalyticService
     */
    addInputTrackingMethod(trackingMethodAttributes, contextId, analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputs = yield this.getInputsNode(analyticId);
            if (inputs === undefined)
                throw Error('Inputs node not found');
            return this.addTrackingMethod(trackingMethodAttributes, contextId, inputs.id.get());
        });
    }
    /**
     * Retrieves all Tracking Method nodes associated with the Inputs node of the specified analytic.
     * @async
     * @param {string} analyticId - The ID of the analytic for which to retrieve the Tracking Method nodes.
     * @returns {Promise<SpinalNodeRef[]|undefined>} A Promise that resolves to an array of Tracking Method nodes, or undefined if the Inputs node or Tracking Method nodes cannot be found.
     * @memberof AnalyticService
     */
    getTrackingMethods(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputs = yield this.getInputsNode(analyticId);
            if (inputs === undefined)
                return undefined;
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(inputs.id.get(), [
                CONSTANTS.ANALYTIC_INPUTS_TO_TRACKING_METHOD_RELATION,
            ]);
            return nodes;
        });
    }
    /**
     * Retrieves the first Tracking Method node associated with the Inputs node of the specified analytic.
     * @async
     * @param {string} analyticId - The ID of the analytic for which to retrieve the Tracking Method node.
     * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the first Tracking Method node, or undefined if the Inputs node or Tracking Method nodes cannot be found.
     * @memberof AnalyticService
     */
    getTrackingMethod(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackingMethods = yield this.getTrackingMethods(analyticId);
            if (trackingMethods === undefined)
                return undefined;
            return trackingMethods[0];
        });
    }
    /**
     * Removes the specified Tracking Method node from the specified Inputs node and deletes it from the graph.
     * @async
     * @param {string} inputId - The ID of the Inputs node from which to remove the Tracking Method node.
     * @param {string} trackingMethodId - The ID of the Tracking Method node to remove and delete.
     * @returns {Promise<void>} A Promise that resolves when the Tracking Method node has been removed and deleted.
     * @memberof AnalyticService
     */
    removeTrackingMethod(inputId, trackingMethodId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.removeChild(inputId, trackingMethodId, CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.removeFromGraph(trackingMethodId);
        });
    }
    /**
     * Removes the specified Tracking Method node from the Inputs node of the specified analytic and deletes it from the graph.
     * @async
     * @param {string} analyticId - The ID of the analytic from which to remove the Tracking Method node.
     * @param {string} trackingMethodId - The ID of the Tracking Method node to remove and delete.
     * @throws {Error} Throws an error if the Inputs node cannot be found.
     * @returns {Promise<void>} A Promise that resolves when the Tracking Method node has been removed and deleted.
     * @memberof AnalyticService
     */
    removeInputTrackingMethod(analyticId, trackingMethodId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputs = yield this.getInputsNode(analyticId);
            if (inputs === undefined)
                throw Error('Inputs node not found');
            yield this.removeTrackingMethod(inputs.id.get(), trackingMethodId);
        });
    }
    /**
     * Applies the Tracking Method specified for the specified analytic to the Followed Entity and returns the results.
     * @async
     * @param {string} analyticId - The ID of the analytic for which to apply the Tracking Method.
     * @throws {Error} Throws an error if the Tracking Method or Followed Entity nodes cannot be found.
     * @returns {Promise<any>} A Promise that resolves with the results of the applied Tracking Method.
     * @memberof AnalyticService
     */
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
                        console.log('Ticket filter');
                        break;
                    default:
                        console.log('Track method not recognized');
                }
            }
        });
    }
    /**
     * Applies the specified Tracking Method to the specified Followed Entity and returns the results.
     * @async
     * @param {SpinalNodeRef} trackingMethod - The SpinalNodeRef object representing the Tracking Method to apply.
     * @param {SpinalNodeRef} followedEntity - The SpinalNodeRef object representing the Followed Entity to which the Tracking Method should be applied.
     * @returns {Promise<any>} A Promise that resolves with the results of the applied Tracking Method.
     * @memberof AnalyticService
     */
    applyTrackingMethod(trackingMethod, followedEntity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (followedEntity && trackingMethod) {
                const params = yield this.getAttributesFromNode(trackingMethod.id.get(), CONSTANTS.CATEGORY_ATTRIBUTE_TRACKING_METHOD_PARAMETERS);
                const trackMethod = params['trackMethod'];
                const filterValue = params['filterValue'];
                switch (trackMethod) {
                    case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER:
                        const endpoints = yield (0, utils_1.findEndpoints)(followedEntity.id.get(), filterValue);
                        return endpoints;
                    case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER:
                        const controlEndpoints = yield (0, utils_1.findControlEndpoints)(followedEntity.id.get(), filterValue);
                        return controlEndpoints;
                    case CONSTANTS.TRACK_METHOD.TICKET_NAME_FILTER:
                        console.log('Ticket filter');
                        break;
                    default:
                        console.log('Track method not recognized');
                }
            }
        });
    }
    /**
     * Applies the specified Tracking Method to the specified Followed Entity using the specified filter value and returns the results.
     * @async
     * @param {string} trackMethod - The name of the Tracking Method to apply.
     * @param {string} filterValue - The filter value to use when applying the Tracking Method.
     * @param {SpinalNodeRef} followedEntity - The SpinalNodeRef object representing the Followed Entity to which the Tracking Method should be applied.
     * @returns {Promise<any>} A Promise that resolves with the results of the applied Tracking Method.
     * @memberof AnalyticService
     */
    applyTrackingMethodWithParams(trackMethod, filterValue, followedEntity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (followedEntity) {
                switch (trackMethod) {
                    case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER:
                        const endpoints = yield (0, utils_1.findEndpoints)(followedEntity.id.get(), filterValue);
                        return endpoints;
                    case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER:
                        const controlEndpoints = yield (0, utils_1.findControlEndpoints)(followedEntity.id.get(), filterValue);
                        return controlEndpoints;
                    case CONSTANTS.TRACK_METHOD.TICKET_NAME_FILTER:
                        console.log('Ticket filter');
                        break;
                    default:
                        console.log('Track method not recognized');
                }
            }
        });
    }
    ////////////////////////////////////////////////////
    //////////////// FOLLOWED ENTITY ///////////////////
    ////////////////////////////////////////////////////
    /**
     * Adds a link between an input and a followed entity.
     * @param {string} contextId - The id of the context where the link will be created.
     * @param {string} inputId - The id of the input node.
     * @param {string} followedEntityId - The id of the followed entity node.
     * @returns {Promise<SpinalNodeRef>} The linked node.
     * @memberof AnalyticService
     */
    addLinkToFollowedEntity(contextId, inputId, followedEntityId) {
        return __awaiter(this, void 0, void 0, function* () {
            const link = yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(inputId, followedEntityId, contextId, CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            const id = link.info.id.get();
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(id);
        });
    }
    /**
     * Adds a link between the input node of the specified analytic and a followed entity.
     * @param {string} contextId - The id of the context where the link will be created.
     * @param {string} analyticId - The id of the analytic node.
     * @param {string} followedEntityId - The id of the followed entity node.
     * @returns {Promise<SpinalNodeRef>} The linked node.
     * @memberof AnalyticService
     */
    addInputLinkToFollowedEntity(contextId, analyticId, followedEntityId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputs = yield this.getInputsNode(analyticId);
            if (inputs === undefined)
                throw Error('Inputs node not found');
            return this.addLinkToFollowedEntity(contextId, inputs.id.get(), followedEntityId);
        });
    }
    /**
     * Removes the link between an input node and a followed entity node.
     *
     * @async
     * @param {string} analyticId - The ID of the analytic node.
     * @param {string} followedEntityId - The ID of the followed entity node.
     * @returns {Promise<void>}
     * @memberof AnalyticService
     */
    removeLinkToFollowedEntity(analyticId, followedEntityId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputNodeRef = yield this.getInputsNode(analyticId);
            if (inputNodeRef === undefined)
                throw Error('Inputs node not found');
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.removeChild(inputNodeRef.id.get(), followedEntityId, CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
        });
    }
    /**
     * Get the followed entity node of an analytic.
     * @async
     * @param {string} analyticId - The id of the analytic.
     * @returns {Promise<SpinalNodeRef|undefined>} The followed entity node or undefined if it does not exist.
     * @memberof AnalyticService
     */
    getFollowedEntity(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputsNode = yield this.getInputsNode(analyticId);
            if (inputsNode === undefined)
                return undefined;
            const nodes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(inputsNode.id.get(), [
                CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION,
            ]);
            if (nodes === undefined)
                return undefined;
            return nodes[0];
        });
    }
    ///////////////////////////////////////////////////
    ///////////////////// GLOBAL //////////////////////
    ///////////////////////////////////////////////////
    /**
     * Adds the specified attributes to the node with the specified ID.
     * @async
     * @param {SpinalNode<any>} node - The node to which to add the attributes.
     * @param {INodeDocumentation} attributes - An array of objects representing the attributes to add to the node.
     * @returns {Promise<void>} A Promise that resolves when the attributes have been added.
     * @memberof AnalyticService
     */
    addAttributesToNode(node, attributes) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let categoryName of Object.keys(attributes)) {
                for (let attribute of attributes[categoryName]) {
                    yield spinal_env_viewer_plugin_documentation_service_1.default.addAttributeByCategoryName(node, categoryName, attribute.name, attribute.value, attribute.type, '');
                }
            }
        });
    }
    getAttributesFromNode(nodeId, category) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
            const res = {};
            const parameters = yield spinal_env_viewer_plugin_documentation_service_2.attributeService.getAttributesByCategory(node, category);
            for (const param of parameters) {
                const obj = param.get();
                res[obj.label] = obj.value;
            }
            return res;
        });
    }
    /**
     * Gets the real targeted entities for an analytic.
     *
     * @param {string} analyticId The ID of the analytic.
     * @return {*}  {(Promise<SpinalNodeRef[]|undefined>)} An array of SpinalNodeRefs for the entities
     * @memberof AnalyticService
     */
    getWorkingFollowedEntities(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const followedEntity = yield this.getFollowedEntity(analyticId);
            const trackingMethod = yield this.getTrackingMethod(analyticId);
            const config = yield this.getConfig(analyticId);
            const entityInfo = yield this.getEntityFromAnalytic(analyticId);
            if (!entityInfo)
                return;
            const entityType = entityInfo.entityType.get();
            if (followedEntity && trackingMethod && config) {
                if (entityType == followedEntity.type.get()) {
                    // we can continue as planned
                    return [followedEntity];
                }
                else {
                    const isGroup = followedEntity.type.get().includes('group');
                    const relationNameToTargets = isGroup
                        ? CONSTANTS.GROUP_RELATION_PREFIX + entityType
                        : 'has' + entityType.charAt(0).toUpperCase() + entityType.slice(1);
                    const entities = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(followedEntity.id.get(), [relationNameToTargets]);
                    return entities;
                }
            }
        });
    }
    /**
     * Gets the entry data models from a followed entity for an analytic.
     * @param {string} analyticId The ID of the analytic.
     * @param {SpinalNodeRef} followedEntity The SpinalNodeRef for the entity being tracked.
     * @returns {*} The entry data models for the followed entity.
     * @memberof AnalyticService
     */
    getEntryDataModelsFromFollowedEntity(analyticId, followedEntity) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackingMethod = yield this.getTrackingMethod(analyticId);
            if (trackingMethod)
                return this.applyTrackingMethod(trackingMethod, followedEntity);
        });
    }
    /**
     * Gets the data for a followed entity and applies an algorithm to it for an analytic.
     * @private
     * @param {string} analyticId The ID of the analytic.
     * @param {SpinalNodeRef} followedEntity The SpinalNodeRef for the entity being tracked.
     * @returns {*}
     * @memberof AnalyticService
     */
    getDataAndApplyAlgorithm(analyticId, followedEntity) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackingMethod = yield this.getTrackingMethod(analyticId);
            const config = yield this.getConfig(analyticId);
            if (!trackingMethod || !config)
                return;
            const entryDataModels = yield this.applyTrackingMethod(trackingMethod, followedEntity);
            if (entryDataModels) {
                const params = yield (0, utils_1.getAlgorithmParameters)(config);
                const algorithm_name = params['algorithm'];
                // this is another way to get the value that i would like to measure the performance of, later.
                //const value2 = await attributeService.findOneAttributeInCategory(entryDataModels[0], "default", "currentValue");
                const value = (yield entryDataModels[0].element.load()).currentValue.get();
                //const value = entryDataModels[0].currentValue.get();
                const result = algo[algorithm_name](value, params);
                if (typeof result === 'undefined')
                    return;
                this.applyResult(result, analyticId, config, followedEntity, trackingMethod);
            }
        });
    }
    /**
     * Performs an analysis on an entity for an analytic.
     * @param {string} analyticId The ID of the analytic.
     * @param {SpinalNodeRef} entity The SpinalNodeRef for the entity to analyze.
     * @returns {*}
     * @memberof AnalyticService
     */
    doAnalysis(analyticId, entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const entryDataModels = this.getEntryDataModelsFromFollowedEntity(analyticId, entity);
            if (!entryDataModels)
                return;
            this.getDataAndApplyAlgorithm(analyticId, entity);
        });
    }
    ///////////////////////////////////////////////////
    ///////////////// RESULT HANDLING /////////////////
    ///////////////////////////////////////////////////
    /**
     * Applies the result of an algorithm.
     *
     * @param {*} result The result of the algorithm used.
     * @param {string} analyticId The ID of the analytic.
     * @param {SpinalNodeRef} configNode The SpinalNodeRef of the configuration of the analytic.
     * @param {SpinalNodeRef} followedEntityNode The SpinalNodeRef of the entity.
     * @param {SpinalNodeRef} trackingMethodNode The SpinalNodeRef of the tracking method.
     * @return {*}
     * @memberof AnalyticService
     */
    applyResult(result, analyticId, configNode, followedEntityNode, trackingMethodNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = yield this.getAttributesFromNode(configNode.id.get(), CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS);
            switch (params['resultType']) {
                case CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET:
                    yield this.handleTicketResult(result, analyticId, configNode, followedEntityNode, params, "Ticket");
                    break;
                case CONSTANTS.ANALYTIC_RESULT_TYPE.MODIFY_CONTROL_ENDPOINT:
                    yield this.handleModifyControlEndpointResult(result, trackingMethodNode, followedEntityNode);
                    break;
                case CONSTANTS.ANALYTIC_RESULT_TYPE.CONTROL_ENDPOINT:
                    yield this.handleControlEndpointResult(result, followedEntityNode, params);
                    break;
                case CONSTANTS.ANALYTIC_RESULT_TYPE.ALARM:
                    yield this.handleTicketResult(result, analyticId, configNode, followedEntityNode, params, "Alarm");
            }
        });
    }
    handleTicketResult(result, analyticId, configNode, followedEntityNode, params, ticketType // Alarm or Ticket
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!result)
                return;
            const outputNode = yield this.getOutputsNode(analyticId);
            if (!outputNode)
                return;
            const ticketInfo = {
                name: `${params['resultName']} : ${followedEntityNode.name.get()}`,
            };
            (0, utils_1.addTicketAlarm)(ticketInfo, configNode, outputNode.id.get(), ticketType);
        });
    }
    handleModifyControlEndpointResult(result, trackingMethodNode, followedEntityNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const controlEndpoints = yield this.applyTrackingMethod(trackingMethodNode, followedEntityNode);
            if (!controlEndpoints)
                return;
            for (const controlEndpointEntry of controlEndpoints) {
                const controlEndpoint = yield controlEndpointEntry.element.load();
                controlEndpoint.currentValue.set(result);
            }
        });
    }
    handleControlEndpointResult(result, followedEntityNode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const controlEndpoints = yield this.applyTrackingMethodWithParams(CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER, params['resultName'], followedEntityNode);
            if (!controlEndpoints)
                return;
            for (const controlEndpointEntry of controlEndpoints) {
                const controlEndpoint = yield controlEndpointEntry.element.load();
                controlEndpoint.currentValue.set(result);
            }
        });
    }
}
exports.default = AnalyticService;
exports.AnalyticService = AnalyticService;
//# sourceMappingURL=AnalyticService.js.map