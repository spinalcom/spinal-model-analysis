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
/* eslint-disable @typescript-eslint/no-explicit-any */
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
const SingletonTimeSeries_1 = require("./SingletonTimeSeries");
const algorithms_1 = require("../algorithms/algorithms");
const axios_1 = require("axios");
const qs_1 = require("qs");
const Errors_1 = require("../classes/Errors");
/**
 * This class handles most of the logic for analytics. It provides methods for creating and retrieving analytics, entities, and contexts.
 * It also provides methods for applying tracking methods to followed entities and applying algorithms to inputs.
 *
 * @export
 * @class AnalyticService
 */
class AnalyticService {
    //private googleChatService: GoogleChatService;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {
        /**
         * The singleton instance of the Timeseries service.
         *
         * @private
         * @type {SpinalServiceTimeseries}
         * @memberof AnalyticService
         */
        this.spinalServiceTimeseries = SingletonTimeSeries_1.SingletonServiceTimeseries.getInstance();
    }
    /**
     * Initialize private attributes with necessary information to use the the messaging service.
     *
     * @param {string} accountSid
     * @param {string} authToken
     * @param {string} fromNumber
     * @return {*}  {void}
     * @memberof AnalyticService
     */
    initTwilioCredentials(accountSid, authToken, fromNumber) {
        if (!accountSid || !authToken || !fromNumber) {
            console.error('Twilio credentials not set, Messaging services will not work');
            return;
        }
        console.log('Init connection to messaging services...');
        this.twilioFromNumber = fromNumber;
        this.twilioAccountSid = accountSid;
        this.twilioAuthToken = authToken;
        console.log('Done.');
    }
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
    getContextIdOfAnalytic(analyticId) {
        const contexts = this.getContexts();
        if (!contexts)
            return undefined;
        const analyticNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(analyticId);
        const contextId = analyticNode.getContextIds()[0];
        return contextId;
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
                type: CONSTANTS.INPUTS_TYPE,
            };
            const inputsModel = new InputsModel_1.InputsModel(inputsInfo);
            const inputsId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(inputsInfo, inputsModel);
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
                type: CONSTANTS.OUTPUTS_TYPE,
            };
            const outputsModel = new OutputsModel_1.OutputsModel(outputsInfo);
            const outputsId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(outputsInfo, outputsModel);
            yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(analyticId, outputsId, contextId, CONSTANTS.ANALYTIC_TO_OUTPUTS_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(outputsId);
        });
    }
    /**
     * Adds a new Config node to the specified analytic within the specified context, with the specified attributes.
     *
     * @param {INodeDocumentation} configAttributes - The attributes to add to the Config node.
     * @param {string} analyticId - The ID of the analytic to which to add the Config node.
     * @param {string} contextId - The ID of the context in which to add the Config node.
     * @return {*}  {Promise<SpinalNodeRef>}
     * @memberof AnalyticService
     */
    addConfig(configAttributes, analyticId, contextId) {
        return __awaiter(this, void 0, void 0, function* () {
            const configNodeInfo = { name: 'Config', type: CONSTANTS.CONFIG_TYPE };
            const configModel = new ConfigModel_1.ConfigModel(configNodeInfo);
            const configId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode(configNodeInfo, configModel);
            const configNode = yield spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(analyticId, configId, contextId, CONSTANTS.ANALYTIC_TO_CONFIG_RELATION, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            this.addAttributesToNode(configNode, configAttributes);
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(configId);
        });
    }
    updateLastExecutionTime(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const configNode = yield this.getConfig(analyticId);
            if (!configNode)
                throw Error('Config node not found');
            const realNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(configNode.id.get());
            const attr = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.addAttributeByCategoryName(realNode, CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS, CONSTANTS.ATTRIBUTE_LAST_EXECUTION_TIME, Date.now().toString(), 'number');
        });
    }
    /**
     * Retrieves the Config node for the specified analytic
     *
     * @async
     * @param {string} analyticId - The ID of the analytic for which to retrieve the Config node.
     * @return {*}  {(Promise<SpinalNodeRef | undefined>)} A Promise that resolves to the Config node, or undefined if the Config node cannot be found.
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
    deleteConfigNode(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const configNode = yield this.getConfig(analyticId);
            if (configNode)
                yield (0, utils_1.safeDeleteNode)(configNode.id.get());
        });
    }
    /**
     * Retrieves the Inputs node for the specified analytic.
     * @async
     * @param {string} analyticId - The ID of the analytic for which to retrieve the Inputs node.
     * @return {*}  {(Promise<SpinalNodeRef | undefined>)} - A Promise that resolves to the Inputs node, or undefined if the Inputs node cannot be found.
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
     * @returns {*} {(Promise<SpinalNodeRef | undefined>)} - A Promise that resolves to the Outputs node, or undefined if the Outputs node cannot be found.
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
    deleteInputsNode(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputsNode = yield this.getInputsNode(analyticId);
            if (inputsNode)
                yield (0, utils_1.safeDeleteNode)(inputsNode.id.get(), false);
        });
    }
    deleteOutputsNode(analyticId, shouldDeleteChildren = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const outputsNode = yield this.getOutputsNode(analyticId);
            if (outputsNode)
                yield (0, utils_1.safeDeleteNode)(outputsNode.id.get(), shouldDeleteChildren);
        });
    }
    deleteAnalytic(analyticId, shouldDeleteChildren = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputsNode = yield this.getInputsNode(analyticId);
            const outputsNode = yield this.getOutputsNode(analyticId);
            if (inputsNode)
                yield (0, utils_1.safeDeleteNode)(inputsNode.id.get());
            if (outputsNode)
                yield (0, utils_1.safeDeleteNode)(outputsNode.id.get(), shouldDeleteChildren);
            yield (0, utils_1.safeDeleteNode)(analyticId);
        });
    }
    ////////////////////////////////////////////////////
    //////////////// TRACKED VARIABLE //////////////////
    ////////////////////////////////////////////////////
    /**
     * Adds a new Tracking Method node to the specified Input node within the specified context.
     * @async
     * @param {INodeDocumentation} trackingMethodAttributes
     * @param {string} contextId - The ID of the context in which to add the Tracking Method node.
     * @param {string} inputId - The ID of the Input node to which to add the Tracking Method node.
     * @return {*}  {Promise<SpinalNodeRef>} - A Promise that resolves to the newly created Tracking Method node.
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
     *
     * @async
     * @param {INodeDocumentation} trackingMethodAttributes - The attributes to add to the Tracking Method node.
     * @param {string} contextId - The ID of the context in which to add the Tracking Method node.
     * @param {string} analyticId - The ID of the analytic for which to add the Tracking Method node.
     * @return {*}  {Promise<SpinalNodeRef>} - A Promise that resolves to the newly created Tracking Method node.
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
     *
     * @async
     * @param {string} trackMethod - The type of filter.
     * @param {string} filterValue - The filter value to use.
     * @param {SpinalNodeRef} followedEntity - The SpinalNodeRef object representing the Followed Entity to which the Tracking Method should be applied.
     * @returns {*} {Promise<SpinalNodeRef[] | SpinalNodeRef | undefined>} - A Promise that resolves with the results of the applied Tracking Method.
     * @memberof AnalyticService
     */
    applyTrackingMethodWithParams(followedEntity, trackMethod, filterValue, depth, strictDepth, authorizedRelations) {
        return __awaiter(this, void 0, void 0, function* () {
            if (followedEntity) {
                switch (trackMethod) {
                    case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER: {
                        const endpoint = yield (0, utils_1.findEndpoint)(followedEntity.id.get(), filterValue, depth, strictDepth, authorizedRelations, CONSTANTS.ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
                        return endpoint;
                    }
                    case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER: {
                        const controlEndpoint = yield (0, utils_1.findEndpoint)(followedEntity.id.get(), filterValue, depth, strictDepth, authorizedRelations, CONSTANTS.CONTROL_ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
                        return controlEndpoint;
                    }
                    case CONSTANTS.TRACK_METHOD.ATTRIBUTE_NAME_FILTER: {
                        const [first, second] = filterValue.split(':');
                        const foundAttribute = yield (0, utils_1.findAttribute)(followedEntity.id.get(), first, second, depth, strictDepth, authorizedRelations);
                        if (foundAttribute == -1)
                            return undefined;
                        return foundAttribute;
                        //}
                    }
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
            for (const categoryName of Object.keys(attributes)) {
                for (const attribute of attributes[categoryName]) {
                    yield spinal_env_viewer_plugin_documentation_service_1.default.addAttributeByCategoryName(node, categoryName, attribute.name, attribute.value, attribute.type, '');
                }
            }
        });
    }
    /**
     * Gets the attributes from a node.
     *
     * @param {string} nodeId - The ID of the node from which to retrieve the attributes.
     * @param {string} category - The category of the attributes to retrieve.
     * @return {*}  {Promise<any>} An object containing the attributes.
     * @memberof AnalyticService
     */
    getAttributesFromNode(nodeId, category) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
            const res = {};
            const parameters = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(node, category);
            for (const param of parameters) {
                const obj = param.get();
                res[obj.label] = obj.value;
            }
            return res;
        });
    }
    /**
     * Gets the attribute from a node.
     *
     * @param {string} nodeId - The ID of the node from which to retrieve the attribute.
     * @param {string} category - The category of the attribute to retrieve.
     * @param {string} label - The label of the attribute to retrieve.
     * @return {*}  {Promise<any>}  An object containing the attribute { label: value}.
     * @memberof AnalyticService
     */
    getAttributeFromNode(nodeId, category, label) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
            const parameters = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(node, category);
            for (const param of parameters) {
                const obj = param.get();
                if (obj.label === label)
                    return { [obj.label]: obj.value };
            }
            return undefined;
        });
    }
    getAllCategoriesAndAttributesFromNode(nodeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
            const res = {};
            const categories = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getCategory(node);
            for (const cat of categories) {
                const categoryName = cat.nameCat;
                res[categoryName] = {};
                const attributes = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(node, categoryName);
                for (const attribute of attributes) {
                    const obj = attribute.get();
                    res[categoryName][obj.label] = obj.value;
                }
            }
            return res;
        });
    }
    /**
     * Gets the targeted entities for an analytic.
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
                if (followedEntity.type.get().includes('group') ||
                    followedEntity.type.get().includes('Group')) {
                    console.log('Anchor entity is a group, trying to find the correct entities with the relation name: ', CONSTANTS.GROUP_RELATION_PREFIX + entityType);
                    return yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(followedEntity.id.get(), [
                        CONSTANTS.GROUP_RELATION_PREFIX + entityType,
                    ]);
                }
                if (followedEntity.type.get().includes('context') ||
                    followedEntity.type.get().includes('Context')) {
                    console.log('Anchor entity is a context, trying to find the correct entities');
                    return yield spinal_env_viewer_graph_service_1.SpinalGraphService.findInContextByType(followedEntity.id.get(), followedEntity.id.get(), entityType);
                }
                console.log('Failed to deduct the correct entities from the anchor entity');
                return [];
            }
        });
    }
    getWorkingFollowedEntitiesWithParam(followedEntity, entityType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (entityType == followedEntity.type.get()) {
                // we can continue as planned
                return [followedEntity];
            }
            if (followedEntity.type.get().includes('group') ||
                followedEntity.type.get().includes('Group')) {
                console.log('Anchor entity is a group, trying to find the correct entities with the relation name: ', CONSTANTS.GROUP_RELATION_PREFIX + entityType);
                return yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(followedEntity.id.get(), [
                    CONSTANTS.GROUP_RELATION_PREFIX + entityType,
                ]);
            }
            if (followedEntity.type.get().includes('context') ||
                followedEntity.type.get().includes('Context')) {
                console.log('Anchor entity is a context, trying to find the correct entities');
                return yield spinal_env_viewer_graph_service_1.SpinalGraphService.findInContextByType(followedEntity.id.get(), followedEntity.id.get(), entityType);
            }
            console.log('Failed to deduct the correct entities from the anchor entity');
            return [];
        });
    }
    getEntryDataModelByInputIndex(analyticId, followedEntity, inputIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackingMethod = yield this.getTrackingMethod(analyticId);
            if (!trackingMethod)
                return undefined;
            const inputParams = yield this.getAttributesFromNode(trackingMethod.id.get(), inputIndex);
            return yield this.applyTrackingMethodWithParams(followedEntity, inputParams[CONSTANTS.ATTRIBUTE_TRACKING_METHOD], inputParams[CONSTANTS.ATTRIBUTE_FILTER_VALUE], inputParams[CONSTANTS.ATTRIBUTE_SEARCH_DEPTH], inputParams[CONSTANTS.ATTRIBUTE_STRICT_DEPTH], inputParams[CONSTANTS.ATTRIBUTE_SEARCH_RELATIONS].split(CONSTANTS.ATTRIBUTE_VALUE_SEPARATOR));
        });
    }
    getFormattedInputDataByIndex(analyticId, followedEntity, inputIndex, referenceEpochTime = Date.now()) {
        return __awaiter(this, void 0, void 0, function* () {
            const entryDataModel = yield this.getEntryDataModelByInputIndex(analyticId, followedEntity, inputIndex);
            if (!entryDataModel)
                return undefined;
            const trackingMethod = yield this.getTrackingMethod(analyticId);
            if (!trackingMethod)
                return undefined;
            const trackingParams = yield this.getAttributesFromNode(trackingMethod.id.get(), inputIndex);
            if (!trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] ||
                trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] == 0) {
                const currentValue = yield (0, utils_1.getValueModelFromEntry)(entryDataModel);
                const assertedValue = currentValue.get();
                return assertedValue;
            }
            else {
                const spinalTs = yield this.spinalServiceTimeseries.getOrCreateTimeSeries(entryDataModel.id.get());
                const end = referenceEpochTime;
                const start = end - trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES];
                const injectLastValueBeforeStart = trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES_VALUE_AT_START];
                let data = injectLastValueBeforeStart ?
                    yield spinalTs.getFromIntervalTime(start, end, true) :
                    yield spinalTs.getFromIntervalTime(start, end);
                data = (0, utils_1.timeseriesPreProcessing)(start, end, data); // tidy up the data mainly at start and end
                return data;
            }
        });
    }
    getAnalyticDetails(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield this.getConfig(analyticId);
            const trackingMethod = yield this.getTrackingMethod(analyticId);
            const followedEntity = yield this.getFollowedEntity(analyticId);
            const entity = yield this.getEntityFromAnalytic(analyticId);
            const analyticNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(analyticId);
            if (!analyticNode)
                throw new Error('No analytic node found');
            if (!config)
                throw new Error('No config node found');
            if (!trackingMethod)
                throw new Error('No tracking method node found');
            if (!followedEntity)
                throw new Error('No followed entity node found');
            if (!entity)
                throw new Error('No entity node found');
            const configNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(config.id.get());
            const trackingMethodNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(trackingMethod.id.get());
            const configCategoryAttributes = (yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getCategory(configNode)).map((el) => {
                return el.nameCat;
            });
            const trackingMethodCategoryAttributes = (yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getCategory(trackingMethodNode)).map((el) => {
                return el.nameCat;
            });
            const configInfo = {};
            const trackingMethodInfo = {};
            for (const cat of configCategoryAttributes) {
                const attributes = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(configNode, cat);
                configInfo[cat] = attributes;
            }
            for (const cat of trackingMethodCategoryAttributes) {
                const attributes = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(trackingMethodNode, cat);
                trackingMethodInfo[cat] = attributes;
            }
            const analyticDetails = spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(analyticId);
            const followedEntityId = followedEntity.id.get();
            const res = {
                entityNodeInfo: entity,
                analyticName: analyticDetails.name.get(),
                config: configInfo,
                trackingMethod: trackingMethodInfo,
                followedEntityId,
            };
            return res;
        });
    }
    /*public async createAnalytic(contextId : string, entityId :string , analyticDetails : IAnalyticDetails){
      const analyticCreationInfo : IAnalytic = {name : analyticDetails.analyticName, description : ''};
      const analyticNode = await this.addAnalytic(analyticCreationInfo,contextId,entityId)
      const InputNode = await this.addInputsNode(analyticNode.id.get(),contextId);
      const OutputNode = await this.addOutputsNode(analyticNode.id.get(),contextId);
      //const configNode = await this.addConfig(analyticDetails.config,analyticNode.id.get(),contextId);
    }*/
    findExecutionOrder(dependencies) {
        const graph = {};
        const visited = {};
        const stack = [];
        // Create graph from dependency map
        for (const algo of Object.keys(dependencies)) {
            graph[algo] = graph[algo] || [];
            const dependency = dependencies[algo];
            graph[dependency] = graph[dependency] || [];
            graph[dependency].push(algo);
        }
        const visit = (node) => {
            if (!visited[node]) {
                visited[node] = true;
                if (graph[node]) {
                    for (const neighbor of graph[node]) {
                        visit(neighbor);
                    }
                }
                stack.push(node);
            }
        };
        for (const node of Object.keys(graph)) {
            if (!visited[node]) {
                visit(node);
            }
        }
        // Check for circular dependencies (not handled in this simple implementation)
        for (const node of Object.keys(graph)) {
            if (stack.indexOf(node) > stack.indexOf(dependencies[node])) {
                return null; // Circular dependency detected
            }
        }
        return stack.filter((x) => x.startsWith('A'));
    }
    filterAlgorithmParametersAttributesByIndex(algoParams, indexName) {
        const result = {};
        for (const key in algoParams) {
            if (key.startsWith(indexName)) {
                const newKey = key.replace(indexName + CONSTANTS.ATTRIBUTE_SEPARATOR, '');
                result[newKey] = algoParams[key];
            }
        }
        return result;
    }
    recExecuteAlgorithm(analyticId, entity, algoIndexName, ioDependencies, algoIndexMapping, algoParams, referenceEpochTime = Date.now()) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const inputs = [];
            const myDependencies = (_b = (_a = ioDependencies[algoIndexName]) === null || _a === void 0 ? void 0 : _a.split(CONSTANTS.ATTRIBUTE_VALUE_SEPARATOR)) !== null && _b !== void 0 ? _b : [];
            for (const dependency of myDependencies) {
                if (!dependency)
                    continue; // if the dependency is empty
                // if dependency is an algorithm then rec call with that algorithm
                if (dependency.startsWith('A')) {
                    // save the result of the algorithm in the inputs array
                    const res = yield this.recExecuteAlgorithm(analyticId, entity, dependency, ioDependencies, algoIndexMapping, algoParams);
                    inputs.push(res);
                }
                else {
                    // if dependency is an input then get the value of the input
                    const inputData = yield this.getFormattedInputDataByIndex(analyticId, entity, dependency, referenceEpochTime);
                    if (inputData == undefined) {
                        throw new Error(`Input data ${dependency} could not be retrieved`);
                    }
                    inputs.push(inputData);
                }
            }
            // after the inputs are ready we can execute the algorithm
            const algorithm_name = algoIndexMapping[algoIndexName];
            const algorithmParameters = this.filterAlgorithmParametersAttributesByIndex(algoParams, algoIndexName);
            const result = algorithms_1.ALGORITHMS[algorithm_name].run(inputs, algorithmParameters);
            if (result == undefined)
                throw new Error(`Algorithm ${algorithm_name} returned undefined`);
            if (algorithm_name === 'EXIT' && result === true)
                throw new Errors_1.ExitAnalyticError('EXIT algorithm triggered');
            return result;
        });
    }
    /**
     * Performs an analysis on an entity for an analytic.
     * @param {string} analyticId The ID of the analytic.
     * @param {SpinalNodeRef} entity The SpinalNodeRef for the entity to analyze.
     * @returns {*} {Promise<void>}
     * @memberof AnalyticService
     */
    doAnalysisOnEntity(analyticId, entity, configAttributes, executionTime = Date.now()) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get the io dependencies of the analytic
                if (!configAttributes) {
                    const configNode = yield this.getConfig(analyticId);
                    if (!configNode)
                        return { success: false, error: 'No config node found' };
                    configAttributes = yield this.getAllCategoriesAndAttributesFromNode(configNode.id.get());
                }
                // const ioDependencies = await this.getAttributesFromNode(
                //   configNode.id.get(),
                //   CONSTANTS.CATEGORY_ATTRIBUTE_IO_DEPENDENCIES
                // );
                // const algoIndexMapping = await this.getAttributesFromNode(
                //   configNode.id.get(),
                //   CONSTANTS.CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING
                // );
                // const algoParams = await this.getAttributesFromNode(
                //   configNode.id.get(),
                //   CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS
                // );
                const ioDependencies = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_IO_DEPENDENCIES];
                const algoIndexMapping = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING];
                const algoParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS];
                const R = ioDependencies['R'];
                const result = yield this.recExecuteAlgorithm(analyticId, entity, R, ioDependencies, algoIndexMapping, algoParams, executionTime);
                return yield this.applyResult(result, analyticId, configAttributes, entity);
            }
            catch (error) {
                const analyticInfo = spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(analyticId);
                const positionString = ' on ' +
                    entity.name.get() +
                    ' in analytic : ' +
                    analyticInfo.name.get();
                if (error instanceof Error || error instanceof Errors_1.ExitAnalyticError) {
                    return { success: false, error: error.message + positionString };
                }
                else {
                    return {
                        success: false,
                        error: 'An unknown error occurred' + positionString,
                    };
                }
            }
        });
    }
    /**
     * Performs an analysis on all entities for an analytic.
     * @param {string} analyticId The ID of the analytic.
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    doAnalysis(analyticId, triggerObject) {
        return __awaiter(this, void 0, void 0, function* () {
            const entities = yield this.getWorkingFollowedEntities(analyticId);
            if (!entities)
                return [{ success: false, error: 'No entities found' }];
            const configNode = yield this.getConfig(analyticId);
            if (!configNode)
                return [{ success: false, error: 'No config node found' }];
            const configAttributes = yield this.getAllCategoriesAndAttributesFromNode(configNode.id.get());
            const lastExecutionTime = parseInt(configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS][CONSTANTS.ATTRIBUTE_LAST_EXECUTION_TIME]);
            const shouldCatchUpMissedExecutions = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS][CONSTANTS.ATTRIBUTE_ANALYTIC_PAST_EXECUTIONS];
            let missingExecutionsTimes = [];
            if (shouldCatchUpMissedExecutions) {
                if (triggerObject.triggerType === CONSTANTS.TRIGGER_TYPE.CRON) {
                    missingExecutionsTimes = (0, utils_1.getCronMissingExecutionTimes)(triggerObject.triggerValue, lastExecutionTime);
                }
                if (triggerObject.triggerType === CONSTANTS.TRIGGER_TYPE.INTERVAL_TIME) {
                    missingExecutionsTimes = (0, utils_1.getIntervalTimeMissingExecutionTimes)(parseInt(triggerObject.triggerValue), lastExecutionTime);
                }
            }
            missingExecutionsTimes.push(Date.now());
            const analysisPromises = entities.map((entity) => missingExecutionsTimes.map((missingExecutionsTime) => this.doAnalysisOnEntity(analyticId, entity, configAttributes, missingExecutionsTime)));
            const results = yield Promise.all(analysisPromises.flat());
            return results;
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
     * @return {*}
     * @memberof AnalyticService
     */
    applyResult(result, analyticId, configAttributes, followedEntityNode, referenceEpochTime = Date.now()) {
        return __awaiter(this, void 0, void 0, function* () {
            if (result === undefined)
                return { success: false, error: 'Result is undefined' };
            //const params = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS];
            switch (configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_TYPE]) {
                case CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET:
                    yield this.handleTicketResult(result, analyticId, configAttributes, followedEntityNode, 'Ticket');
                    return {
                        success: true,
                        resultValue: result,
                        error: '',
                        resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET,
                    };
                case CONSTANTS.ANALYTIC_RESULT_TYPE.CONTROL_ENDPOINT:
                    yield this.handleControlEndpointResult(result, followedEntityNode, configAttributes, referenceEpochTime);
                    return {
                        success: true,
                        resultValue: result,
                        error: '',
                        resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.CONTROL_ENDPOINT,
                    };
                case CONSTANTS.ANALYTIC_RESULT_TYPE.ENDPOINT:
                    yield this.handleEndpointResult(result, followedEntityNode, configAttributes, referenceEpochTime);
                    return {
                        success: true,
                        resultValue: result,
                        error: '',
                        resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.ENDPOINT,
                    };
                case CONSTANTS.ANALYTIC_RESULT_TYPE.ALARM:
                    return yield this.handleTicketResult(result, analyticId, configAttributes, followedEntityNode, 'Alarm');
                case CONSTANTS.ANALYTIC_RESULT_TYPE.SMS:
                    return yield this.handleSMSResult(result, analyticId, configAttributes, followedEntityNode);
                case CONSTANTS.ANALYTIC_RESULT_TYPE.LOG:
                    console.log(`LOG : ${configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_NAME]} \t|\t Result : ${result}`);
                    return {
                        success: true,
                        resultValue: result,
                        error: '',
                        resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.LOG,
                    };
                case CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE:
                    return this.handleGChatMessageResult(result, analyticId, configAttributes, followedEntityNode);
                case CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_ORGAN_CARD:
                    return this.handleGChatOrganCardResult(result, analyticId, configAttributes, followedEntityNode);
                default:
                    return { success: false, error: 'Result type not recognized' };
            }
        });
    }
    /**
     * Handles the result of an algorithm that creates a ticket or an alarm.
     *
     * @private
     * @param {*} result
     * @param {string} analyticId
     * @param {SpinalNodeRef} configNode
     * @param {SpinalNodeRef} followedEntityNode
     * @param {*} params
     * @param {string} ticketType
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    handleTicketResult(result, analyticId, configAttributes, followedEntityNode, ticketType // Alarm or Ticket
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            if (result == false)
                return {
                    success: true,
                    error: '',
                    resultValue: result,
                    resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET,
                };
            const outputNode = yield this.getOutputsNode(analyticId);
            if (!outputNode)
                return { success: false, error: ' Output Node not found' };
            const analyticContextId = this.getContextIdOfAnalytic(analyticId);
            if (!analyticContextId)
                return { success: false, error: ' Analytic context id not found' };
            const ticketInfo = {
                name: `${configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_NAME]} : ${followedEntityNode.name.get()}`,
            };
            (0, utils_1.addTicketAlarm)(ticketInfo, configAttributes, analyticContextId, outputNode.id.get(), followedEntityNode.id.get(), ticketType);
            return {
                success: true,
                error: '',
                resultValue: result,
                resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET,
            };
        });
    }
    /**
     * Handles the result of an algorithm that modifies a control point.
     *
     * @private
     * @param {*} result
     * @param {SpinalNodeRef} followedEntityNode
     * @param {*} params
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    handleControlEndpointResult(result, followedEntityNode, configAttributes, referenceEpochTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const controlEndpointNode = yield (0, utils_1.findEndpoint)(followedEntityNode.id.get(), configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_NAME], 0, true, [], CONSTANTS.CONTROL_ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
            if (!controlEndpointNode)
                return { success: false, error: ' Control endpoint node not found' };
            const controlEndpoint = yield controlEndpointNode.element.load();
            controlEndpoint.currentValue.set(result);
            const bool = yield this.spinalServiceTimeseries.insertFromEndpoint(controlEndpointNode.id.get(), result, referenceEpochTime);
            if (!bool)
                return { success: false, error: 'Failed to insert data in timeseries' };
            return {
                success: true,
                resultValue: result,
                error: '',
                resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.CONTROL_ENDPOINT,
            };
        });
    }
    /**
     * Handles the result of an algorithm that modifies an Endpoint.
     *
     * @private
     * @param {*} result
     * @param {SpinalNodeRef} followedEntityNode
     * @param {*} params
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    handleEndpointResult(result, followedEntityNode, configAttributes, referenceEpochTime) {
        return __awaiter(this, void 0, void 0, function* () {
            let endpointNode = yield (0, utils_1.findEndpoint)(followedEntityNode.id.get(), configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_NAME], 0, true, [], CONSTANTS.ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
            if (!endpointNode && !configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_CREATE_ENDPOINT_IF_NOT_EXIST])
                return { success: false, error: 'Endpoint node not found' };
            if (!endpointNode) {
                endpointNode = yield (0, utils_1.createEndpoint)(referenceEpochTime, followedEntityNode.id.get(), configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_NAME], result, configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ENDPOINT_PARAMETERS][CONSTANTS.ATTRIBUTE_CREATE_ENDPOINT_UNIT], configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ENDPOINT_PARAMETERS][CONSTANTS.ATTRIBUTE_CREATE_ENDPOINT_MAX_DAYS]);
                if (!endpointNode)
                    return { success: false, error: 'Failed endpoint creation' };
            }
            const endpoint = yield endpointNode.element.load();
            endpoint.currentValue.set(result);
            const bool = yield this.spinalServiceTimeseries.insertFromEndpoint(endpointNode.id.get(), result, referenceEpochTime);
            if (!bool)
                return { success: false, error: 'Failed to insert data in timeseries' };
            return {
                success: true,
                resultValue: result,
                error: '',
                resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.ENDPOINT,
            };
        });
    }
    /**
     * Handles the result of an algorithm that sends an SMS.
     *
     * @private
     * @param {*} result
     * @param {SpinalNodeRef} configNode
     * @param {SpinalNodeRef} followedEntityNode
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    handleSMSResult(result, analyticId, configAttributes, followedEntityNode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.twilioAccountSid ||
                !this.twilioAuthToken ||
                !this.twilioFromNumber)
                return { success: false, error: 'Twilio parameters not found' };
            if (result == false)
                return {
                    success: true,
                    resultValue: result,
                    error: '',
                    resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.SMS,
                };
            console.log('SMS result');
            const twilioParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_TWILIO_PARAMETERS];
            const toNumber = twilioParams[CONSTANTS.ATTRIBUTE_PHONE_NUMBER];
            let message = twilioParams[CONSTANTS.ATTRIBUTE_PHONE_MESSAGE];
            const variables = message.match(/[^{}]+(?=\})/g);
            if (variables) {
                for (const variable of variables) {
                    const value = yield this.getFormattedInputDataByIndex(analyticId, followedEntityNode, variable);
                    message = message.replace(`{${variable}}`, '' + value);
                }
            }
            const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;
            const entityName = followedEntityNode.name
                .get()
                .replace(/[0-9]/g, '*');
            const data = {
                Body: `Analytic on ${entityName} triggered with the following message : ${message}`,
                From: this.twilioFromNumber,
                To: toNumber,
            };
            const config = {
                method: 'POST',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                auth: {
                    username: this.twilioAccountSid,
                    password: this.twilioAuthToken,
                },
                data: (0, qs_1.stringify)(data),
                url,
            };
            const axiosResult = yield (0, axios_1.default)(config);
            console.log({ status: axiosResult.status, data: axiosResult.data });
            return {
                success: true,
                resultValue: result,
                error: '',
                resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.SMS,
            };
        });
    }
    handleGChatMessageResult(result, analyticId, configAttributes, followedEntityNode) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Handling Google chat message result');
            if (result == false)
                return {
                    success: true,
                    resultValue: result,
                    error: '',
                    resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE,
                };
            const analyticParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS];
            const gChatParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_GCHAT_PARAMETERS];
            const spaceName = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_SPACE];
            let message = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_MESSAGE];
            const analyticDescription = analyticParams[CONSTANTS.ATTRIBUTE_ANALYTIC_DESCRIPTION];
            const variables = message.match(/[^{}]+(?=\})/g);
            if (variables) {
                for (const variable of variables) {
                    const value = yield this.getFormattedInputDataByIndex(analyticId, followedEntityNode, variable);
                    message = message.replace(`{${variable}}`, '' + value);
                }
            }
            const resultInfo = {
                success: true,
                resultValue: result,
                error: '',
                spaceName: spaceName,
                message: 'The following message has been triggered by an analytic.\n ' +
                    '\nAnalysis on item : ' +
                    followedEntityNode.name.get() +
                    '\nDescription : ' +
                    analyticDescription +
                    '\nMessage : ' +
                    message,
                resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE,
            };
            return resultInfo;
        });
    }
    handleGChatOrganCardResult(result, analyticId, configAttributes, followedEntityNode) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Handling Google chat organ card result');
            if (result == false)
                return {
                    success: true,
                    resultValue: result,
                    error: '',
                    resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE,
                };
            const analyticParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS];
            const resultParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS];
            const gChatParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_GCHAT_PARAMETERS];
            const title = resultParams[CONSTANTS.ATTRIBUTE_RESULT_NAME];
            const spaceName = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_SPACE];
            let message = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_MESSAGE];
            const variables = message.match(/[^{}]+(?=\})/g);
            if (variables) {
                for (const variable of variables) {
                    const value = yield this.getFormattedInputDataByIndex(analyticId, followedEntityNode, variable);
                    message = message.replace(`{${variable}}`, '' + value);
                }
            }
            const analyticDescription = analyticParams[CONSTANTS.ATTRIBUTE_ANALYTIC_DESCRIPTION];
            const lastPing = yield (0, utils_1.findEndpoint)(followedEntityNode.id.get(), 'last_ping', 0, true, [], CONSTANTS.ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
            if (!lastPing)
                return {
                    success: false,
                    error: 'endpoint lastPing not found on organ node',
                };
            const lastPingValue = yield (0, utils_1.getValueModelFromEntry)(lastPing);
            const lastPingDate = new Date(lastPingValue.get()).toString();
            const parents = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getParents(followedEntityNode.id.get(), 'HasOrgan');
            let platformName = "Couldn't find the platform name";
            let ipAddress = "Couldn't find the ip adress";
            for (const parent of parents) {
                if (parent.id.get() == ((_a = followedEntityNode.platformId) === null || _a === void 0 ? void 0 : _a.get())) {
                    platformName = (_b = parent.name) === null || _b === void 0 ? void 0 : _b.get();
                    ipAddress = (_c = parent.ipAdress) === null || _c === void 0 ? void 0 : _c.get();
                }
            }
            const card = {
                header: {
                    title: title,
                    subtitle: new Date().toLocaleDateString(),
                },
                sections: [
                    {
                        header: 'Analytic details',
                        widgets: [
                            {
                                keyValue: {
                                    topLabel: 'Analytic description',
                                    content: analyticDescription,
                                },
                            },
                            {
                                keyValue: {
                                    topLabel: 'Message',
                                    content: message,
                                },
                            },
                        ],
                    },
                    {
                        header: 'Organ details',
                        widgets: [
                            {
                                keyValue: {
                                    topLabel: 'Organ name',
                                    content: followedEntityNode.name.get(),
                                },
                            },
                            {
                                keyValue: {
                                    topLabel: 'Organ type',
                                    content: (_d = followedEntityNode.organType) === null || _d === void 0 ? void 0 : _d.get(),
                                },
                            },
                            {
                                keyValue: {
                                    topLabel: 'Last ping',
                                    content: lastPingDate,
                                },
                            },
                        ],
                    },
                    {
                        header: 'Platform details',
                        widgets: [
                            {
                                keyValue: {
                                    topLabel: 'Platform name',
                                    content: platformName,
                                },
                            },
                            {
                                keyValue: {
                                    topLabel: 'Platform id',
                                    content: (_e = followedEntityNode.platformId) === null || _e === void 0 ? void 0 : _e.get(),
                                },
                            },
                            {
                                keyValue: {
                                    topLabel: 'Ip Address',
                                    content: ipAddress,
                                },
                            },
                        ],
                    },
                ],
            };
            const resultInfo = {
                success: true,
                resultValue: result,
                error: '',
                spaceName: spaceName,
                resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_ORGAN_CARD,
                card: card,
            };
            return resultInfo;
        });
    }
}
exports.default = AnalyticService;
exports.AnalyticService = AnalyticService;
//# sourceMappingURL=AnalyticService.js.map