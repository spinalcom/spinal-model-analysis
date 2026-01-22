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
/* eslint-disable @typescript-eslint/no-explicit-any */
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const CONSTANTS = require("../constants");
const ConfigModel_1 = require("../models/ConfigModel");
const AnalyticModel_1 = require("../models/AnalyticModel");
const TrackingMethodModel_1 = require("../models/TrackingMethodModel");
const EntityModel_1 = require("../models/EntityModel");
const InputsModel_1 = require("../models/InputsModel");
const OutputsModel_1 = require("../models/OutputsModel");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const utils_1 = require("./utils");
const version_1 = require("../version");
class AnalyticNodeManagerService {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }
    // #region CONTEXT
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
                spinal_env_viewer_plugin_documentation_service_1.attributeService.createOrUpdateAttrsAndCategories(context, "metadata", {
                    version: version_1.VERSION
                });
                return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(contextId);
            });
        });
    }
    getContextIdOfAnalytic(analyticId) {
        const contexts = this.getContexts();
        if (!contexts)
            return undefined;
        const analyticNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(analyticId);
        const contextId = analyticNode.getContextIds()[0];
        return contextId;
    }
    // #endregion CONTEXT
    // #region ENTITY
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
    // #endregion ENTITY
    // #region ANALYTIC
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
    deleteAnalytic(analyticId, shouldDeleteChildren = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputsNode = yield this.getInputsNode(analyticId);
            const outputsNode = yield this.getOutputsNode(analyticId);
            if (inputsNode)
                yield this.safeDeleteNode(inputsNode.id.get());
            if (outputsNode)
                yield this.safeDeleteNode(outputsNode.id.get(), shouldDeleteChildren);
            yield this.safeDeleteNode(analyticId);
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
            // Config node
            const analyticConfigAttributes = yield this.getAllCategoriesAndAttributesFromNode(config.id.get());
            // Anchor node 
            const analyticAnchorNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(followedEntity.id.get());
            const inputAttributes = yield this.getAllCategoriesAndAttributesFromNode(trackingMethod.id.get());
            return {
                id: analyticNode._server_id,
                name: analyticNode.getName().get(),
                type: analyticNode.getType().get(),
                analyticOnEntityName: entity.name.get(),
                analyticOnEntityType: entity.entityType.get(),
                config: analyticConfigAttributes,
                inputs: inputAttributes,
                anchor: {
                    id: analyticAnchorNode._server_id,
                    name: analyticAnchorNode.getName().get(),
                    type: analyticAnchorNode.getType().get()
                }
            };
        });
    }
    createAnalytic(analyticDetails, contextNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const entity = yield this.getEntity(contextNode.getName().get(), analyticDetails.analyticOnEntityName);
            if (!entity)
                throw new Error(`Entity ${analyticDetails.analyticOnEntityName} not found in context ${contextNode.getName().get()}`);
            const analyticInfo = {
                name: analyticDetails.name,
                description: ''
            };
            const analyticNodeRef = yield this.addAnalytic(analyticInfo, contextNode.getId().get(), entity.id.get()); // also creates inputs/outputs nodes
            const configRef = yield this.addConfig(analyticDetails.config, analyticNodeRef.id.get(), contextNode.getId().get());
            const configNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(configRef.id.get());
            yield this.addNewAttributesToNode(configNode, analyticDetails.config);
            const trackingMethodRef = yield this.addInputTrackingMethod(analyticDetails.inputs, contextNode.getId().get(), analyticNodeRef.id.get());
            const trackingMethodNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(trackingMethodRef.id.get());
            yield this.addNewAttributesToNode(trackingMethodNode, analyticDetails.inputs);
            yield this.addInputLinkToFollowedEntity(contextNode.getId().get(), analyticDetails.anchor, analyticNodeRef.id.get());
            return this.getAnalyticDetails(analyticNodeRef.id.get());
        });
    }
    // #endregion ANALYTIC
    // #region INPUTS/OUTPUTS
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
                yield this.safeDeleteNode(inputsNode.id.get(), false);
        });
    }
    deleteOutputsNode(analyticId, shouldDeleteChildren = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const outputsNode = yield this.getOutputsNode(analyticId);
            if (outputsNode)
                yield this.safeDeleteNode(outputsNode.id.get(), shouldDeleteChildren);
        });
    }
    // #endregion INPUTS/OUTPUTS
    // #region CONFIG
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
                yield this.safeDeleteNode(configNode.id.get());
        });
    }
    // #endregion CONFIG
    // #region TRACKING METHOD
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
    // #endregion TRACKING METHOD
    // #region FOLLOWED ENTITY
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
    // #endregion FOLLOWED ENTITY
    // #region NODE DOCUMENTATION
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
    addNewAttributesToNode(node, attributes) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const categoryName of Object.keys(attributes)) {
                spinal_env_viewer_plugin_documentation_service_1.attributeService.createOrUpdateAttrsAndCategories(node, categoryName, attributes[categoryName]);
            }
        });
    }
    getAttributesFromNode(nodeId, category) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
            const res = {};
            const parameters = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(node, category);
            for (const param of parameters) {
                const obj = param.get();
                res[obj.label] = (0, utils_1.parseValue)(obj.value);
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
                    return { [obj.label]: (0, utils_1.parseValue)(obj.value) };
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
                    res[categoryName][obj.label] = (0, utils_1.parseValue)(obj.value);
                }
            }
            return res;
        });
    }
    //#endregion NODE DOCUMENTATION
    // #region NODE GLOBAL
    removeChild(parentNode, childNode, relation) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield parentNode.removeChild(childNode, relation, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            }
            catch (e) {
                try {
                    yield parentNode.removeChild(childNode, relation, spinal_env_viewer_graph_service_1.SPINAL_RELATION_LST_PTR_TYPE);
                }
                catch (e) {
                    console.log(e);
                }
            }
        });
    }
    safeDeleteNode(nodeId, shouldDeleteChildren = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const realNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
            const relations = realNode.getRelationNames();
            for (const relation of relations) {
                const children = yield realNode.getChildren(relation);
                for (const child of children) {
                    yield this.removeChild(realNode, child, relation);
                    if (shouldDeleteChildren)
                        yield child.removeFromGraph();
                }
            }
            yield realNode.removeFromGraph();
        });
    }
}
exports.default = AnalyticNodeManagerService;
//# sourceMappingURL=AnalyticNodeManagerService.js.map