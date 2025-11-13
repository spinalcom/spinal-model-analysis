/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SpinalGraphService,
  SpinalNodeRef,
  SpinalNode,
  SpinalContext,
  SPINAL_RELATION_PTR_LST_TYPE,
  SPINAL_RELATION_LST_PTR_TYPE,
} from 'spinal-env-viewer-graph-service';

import * as CONSTANTS from '../constants';

import { ConfigModel } from '../models/ConfigModel';
import { AnalyticModel } from '../models/AnalyticModel';
import { IAnalytic } from '../interfaces/IAnalytic';
import { IAnalyticDetails } from '../interfaces/IAnalyticDetails';
import { TrackingMethodModel } from '../models/TrackingMethodModel';
import { EntityModel } from '../models/EntityModel';
import { IEntity } from '../interfaces/IEntity';
import { IInputs } from '../interfaces/IInputs';
import { IAnalyticConfig } from '../interfaces/IAnalyticConfig';
import { InputsModel } from '../models/InputsModel';
import { IOutputs } from '../interfaces/IOutputs';
import { OutputsModel } from '../models/OutputsModel';
import { INodeDocumentation } from '../interfaces/IAttribute';
import AttributeService, {
  attributeService,
} from 'spinal-env-viewer-plugin-documentation-service';

import { parseValue } from './utils';

export default class AnalyticNodeManagerService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  // #region CONTEXT

  /**
   * Retrieves and returns all contexts
   * handled by this service (type analysisContext)
   * @return {*}  {(SpinalNodeRef[] | undefined)}
   * @memberof AnalyticService
   */
  public getContexts(): SpinalNodeRef[] | undefined {
    const contexts = SpinalGraphService.getContextWithType(
      CONSTANTS.CONTEXT_TYPE
    );
    const argContexts = contexts.map((el) =>
      SpinalGraphService.getInfo(el.info.id.get())
    );
    return argContexts;
  }
  /**
   * This method use the context name to find and return the info of that context. If the context does not exist, it returns undefined.
   * If multiple contexts have the same name, it returns the first one.
   * @param {string} contextName
   * @return {*}  {(SpinalNodeRef | undefined)}
   * @memberof AnalyticService
   */
  public getContext(contextName: string): SpinalNodeRef | undefined {
    const contexts = this.getContexts();
    if (!contexts) return undefined;
    return contexts.find((context) => context.name.get() === contextName);
  }
  /**
   * This method creates a new context and returns the info of the newly created context.
   * If the context already exists (same name), it just returns the info of that context instead of creating a new one.
   * @param {string} contextName
   * @return {*}  {Promise<SpinalNodeRef>}
   * @memberof AnalyticService
   */
  public async createContext(contextName: string): Promise<SpinalNodeRef> {
    const alreadyExists = this.getContext(contextName);
    if (alreadyExists) {
      console.error(`Context ${contextName} already exists`);
      return alreadyExists;
    }
    return SpinalGraphService.addContext(
      contextName,
      CONSTANTS.CONTEXT_TYPE,
      undefined
    ).then((context) => {
      const contextId = context.getId().get();
      return SpinalGraphService.getInfo(contextId);
    });
  }

  public getContextIdOfAnalytic(analyticId: string): string | undefined {
    const contexts = this.getContexts();
    if (!contexts) return undefined;
    const analyticNode = SpinalGraphService.getRealNode(analyticId);

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
  public async addEntity(
    entityInfo: IEntity,
    contextId: string
  ): Promise<SpinalNodeRef> {
    entityInfo.type = CONSTANTS.ENTITY_TYPE;
    const entityModel = new EntityModel(entityInfo);
    const entityNodeId = SpinalGraphService.createNode(entityInfo, entityModel);
    await SpinalGraphService.addChildInContext(
      contextId,
      entityNodeId,
      contextId,
      CONSTANTS.CONTEXT_TO_ENTITY_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    );
    return SpinalGraphService.getInfo(entityNodeId);
  }

  /**
   * Returns all the entities withing a context that have the specified type.
   *
   * @param {SpinalContext<any>} context
   * @param {string} targetType
   * @return {*}  {(Promise<SpinalNode<any> | undefined>)}
   * @memberof AnalyticService
   */
  public async findEntityByTargetType(
    context: SpinalContext<any>,
    targetType: string
  ): Promise<SpinalNode<any> | undefined> {
    const entities = await context.getChildren(
      CONSTANTS.CONTEXT_TO_ENTITY_RELATION
    );
    const result = entities.find((e) => e.info.entityType.get() == targetType);
    (<any>SpinalGraphService)._addNode(result);
    return result;
  }

  /**
   * Retrieves a SpinalNodeRef for the specified entity within the specified context.
   * @async
   * @param {string} contextName - The name of the context to search within.
   * @param {string} entityName - The name of the entity to retrieve.
   * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the SpinalNodeRef for the entity, or undefined if the context or entity cannot be found.
   * @memberof AnalyticService
   */
  public async getEntity(
    contextName: string,
    entityName: string
  ): Promise<SpinalNodeRef | undefined> {
    const context = this.getContext(contextName);
    if (!context) return undefined;
    const contextNode = SpinalGraphService.getRealNode(context.id.get());
    const entities = await contextNode.getChildren(
      CONSTANTS.CONTEXT_TO_ENTITY_RELATION
    );
    const entitiesModels = entities.map((el) =>
      SpinalGraphService.getInfo(el.info.id.get())
    );
    return entitiesModels.find((entity) => entity.name.get() === entityName);
  }

  /**
   * Retrieves the parent entity of the specified analytic.
   * @async
   * @param {string} analyticId - The ID of the analytic for which to retrieve the parent entity.
   * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the parent entity, or undefined if the parent entity cannot be found.
   * @memberof AnalyticService
   */
  public async getEntityFromAnalytic(
    analyticId: string
  ): Promise<SpinalNodeRef | undefined> {
    const nodes = await SpinalGraphService.getParents(analyticId, [
      CONSTANTS.ENTITY_TO_ANALYTIC_RELATION,
    ]);
    if (nodes.length != 0) {
      return nodes[0];
    }
    return undefined;
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
  public async addAnalytic(
    analyticInfo: IAnalytic,
    contextId: string,
    entityId: string
  ): Promise<SpinalNodeRef> {
    analyticInfo.type = CONSTANTS.ANALYTIC_TYPE;
    const analyticModel = new AnalyticModel(analyticInfo);
    const analyticNodeId = SpinalGraphService.createNode(
      analyticInfo,
      analyticModel
    );
    await SpinalGraphService.addChildInContext(
      entityId,
      analyticNodeId,
      contextId,
      CONSTANTS.ENTITY_TO_ANALYTIC_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    );

    await this.addInputsNode(analyticNodeId, contextId);
    await this.addOutputsNode(analyticNodeId, contextId);

    return SpinalGraphService.getInfo(analyticNodeId);
  }

  /**
   * Retrieves all analytics within the specified context.
   * @async
   * @param {string} contextId - The ID of the context in which to retrieve analytics.
   * @returns {Promise<SpinalNodeRef[]>} A Promise that resolves to an array of SpinalNodeRefs for all analytics in the context.
   * @memberof AnalyticService
   */
  public async getAllAnalytics(contextId: string): Promise<SpinalNodeRef[]> {
    const analytics = await SpinalGraphService.findInContext(
      contextId,
      contextId,
      (node: SpinalNode<any>) => {
        if (node.getType().get() === CONSTANTS.ANALYTIC_TYPE) {
          (<any>SpinalGraphService)._addNode(node);
          return true;
        }
        return false;
      }
    );
    return analytics;
  }

  /**
   * Retrieves the SpinalNodeRef for the specified analytic within the specified context.
   * @async
   * @param {string} contextId - The ID of the context in which to search for the analytic.
   * @param {string} analyticName - The name of the analytic to retrieve.
   * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the SpinalNodeRef for the analytic, or undefined if the analytic cannot be found.
   * @memberof AnalyticService
   */
  public async getAnalytic(
    contextId: string,
    analyticName: string
  ): Promise<SpinalNodeRef | undefined> {
    const analytics = await SpinalGraphService.findInContext(
      contextId,
      contextId,
      (node: SpinalNode<any>) => {
        if (node.getType().get() === CONSTANTS.ANALYTIC_TYPE) {
          (<any>SpinalGraphService)._addNode(node);
          return true;
        }
        return false;
      }
    );
    const analytic = analytics.find(
      (el: SpinalNode<any>) => el.info.name.get() == analyticName
    );
    return SpinalGraphService.getInfo(analytic.id.get());
  }

  public async deleteAnalytic(
    analyticId: string,
    shouldDeleteChildren = false
  ): Promise<void> {
    const inputsNode = await this.getInputsNode(analyticId);
    const outputsNode = await this.getOutputsNode(analyticId);
    if (inputsNode) await this.safeDeleteNode(inputsNode.id.get());
    if (outputsNode)
      await this.safeDeleteNode(outputsNode.id.get(), shouldDeleteChildren);

    await this.safeDeleteNode(analyticId);
  }

  public async getAnalyticDetails(analyticId: string) {
    const config = await this.getConfig(analyticId);
    const trackingMethod = await this.getTrackingMethod(analyticId);
    const followedEntity = await this.getFollowedEntity(analyticId);
    const entity = await this.getEntityFromAnalytic(analyticId);
    const analyticNode = SpinalGraphService.getRealNode(analyticId);
    if (!analyticNode) throw new Error('No analytic node found');
    if (!config) throw new Error('No config node found');
    if (!trackingMethod) throw new Error('No tracking method node found');
    if (!followedEntity) throw new Error('No followed entity node found');
    if (!entity) throw new Error('No entity node found');

    const configNode = SpinalGraphService.getRealNode(config.id.get());
    const trackingMethodNode = SpinalGraphService.getRealNode(
      trackingMethod.id.get()
    );

    const configCategoryAttributes = (
      await attributeService.getCategory(configNode)
    ).map((el) => {
      return el.nameCat;
    });
    const trackingMethodCategoryAttributes = (
      await attributeService.getCategory(trackingMethodNode)
    ).map((el) => {
      return el.nameCat;
    });

    const configInfo = {};
    const trackingMethodInfo = {};

    for (const cat of configCategoryAttributes) {
      const attributes = await attributeService.getAttributesByCategory(
        configNode,
        cat
      );
      configInfo[cat] = attributes;
    }

    for (const cat of trackingMethodCategoryAttributes) {
      const attributes = await attributeService.getAttributesByCategory(
        trackingMethodNode,
        cat
      );
      trackingMethodInfo[cat] = attributes;
    }

    const analyticDetails = SpinalGraphService.getInfo(analyticId);

    const followedEntityId = followedEntity.id.get();
    const res: IAnalyticDetails = {
      entityNodeInfo: entity,
      analyticName: analyticDetails.name.get(),
      config: configInfo,
      trackingMethod: trackingMethodInfo,
      followedEntityId,
    };
    return res;
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
  private async addInputsNode(
    analyticId: string,
    contextId: string
  ): Promise<SpinalNodeRef> {
    const inputsInfo: IInputs = {
      name: 'Inputs',
      description: '',
      type: CONSTANTS.INPUTS_TYPE,
    };
    const inputsModel = new InputsModel(inputsInfo);
    const inputsId = SpinalGraphService.createNode(inputsInfo, inputsModel);
    await SpinalGraphService.addChildInContext(
      analyticId,
      inputsId,
      contextId,
      CONSTANTS.ANALYTIC_TO_INPUTS_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    );
    return SpinalGraphService.getInfo(inputsId);
  }

  /**
   * Adds an Outputs node to the specified analytic within the specified context.
   * @async
   * @param {string} analyticId - The ID of the analytic to which to add the Outputs node.
   * @param {string} contextId - The ID of the context in which to add the Outputs node.
   * @returns {Promise<SpinalNodeRef>} A Promise that resolves to the newly created Outputs node.
   * @memberof AnalyticService
   */
  private async addOutputsNode(
    analyticId: string,
    contextId: string
  ): Promise<SpinalNodeRef> {
    const outputsInfo: IOutputs = {
      name: 'Outputs',
      description: '',
      type: CONSTANTS.OUTPUTS_TYPE,
    };
    const outputsModel = new OutputsModel(outputsInfo);
    const outputsId = SpinalGraphService.createNode(outputsInfo, outputsModel);
    await SpinalGraphService.addChildInContext(
      analyticId,
      outputsId,
      contextId,
      CONSTANTS.ANALYTIC_TO_OUTPUTS_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    );
    return SpinalGraphService.getInfo(outputsId);
  }

  /**
   * Retrieves the Inputs node for the specified analytic.
   * @async
   * @param {string} analyticId - The ID of the analytic for which to retrieve the Inputs node.
   * @return {*}  {(Promise<SpinalNodeRef | undefined>)} - A Promise that resolves to the Inputs node, or undefined if the Inputs node cannot be found.
   * @memberof AnalyticService
   */
  public async getInputsNode(
    analyticId: string
  ): Promise<SpinalNodeRef | undefined> {
    const nodes = await SpinalGraphService.getChildren(analyticId, [
      CONSTANTS.ANALYTIC_TO_INPUTS_RELATION,
    ]);
    if (nodes.length === 0) return undefined;
    return SpinalGraphService.getInfo(nodes[0].id.get());
  }

  /**
   * Retrieves the Outputs node for the specified analytic.
   * @async
   * @param {string} analyticId - The ID of the analytic for which to retrieve the Outputs node.
   * @returns {*} {(Promise<SpinalNodeRef | undefined>)} - A Promise that resolves to the Outputs node, or undefined if the Outputs node cannot be found.
   * @memberof AnalyticService
   */
  public async getOutputsNode(
    analyticId: string
  ): Promise<SpinalNodeRef | undefined> {
    const nodes = await SpinalGraphService.getChildren(analyticId, [
      CONSTANTS.ANALYTIC_TO_OUTPUTS_RELATION,
    ]);
    if (nodes.length === 0) return undefined;
    return SpinalGraphService.getInfo(nodes[0].id.get());
  }

  public async deleteInputsNode(analyticId: string): Promise<void> {
    const inputsNode = await this.getInputsNode(analyticId);
    if (inputsNode) await this.safeDeleteNode(inputsNode.id.get(), false);
  }

  public async deleteOutputsNode(
    analyticId: string,
    shouldDeleteChildren = false
  ): Promise<void> {
    const outputsNode = await this.getOutputsNode(analyticId);
    if (outputsNode)
      await this.safeDeleteNode(outputsNode.id.get(), shouldDeleteChildren);
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
  public async addConfig(
    configAttributes: INodeDocumentation,
    analyticId: string,
    contextId: string
  ): Promise<SpinalNodeRef> {
    const configNodeInfo = { name: 'Config', type: CONSTANTS.CONFIG_TYPE };
    const configModel = new ConfigModel(configNodeInfo);
    const configId = SpinalGraphService.createNode(configNodeInfo, configModel);
    const configNode = await SpinalGraphService.addChildInContext(
      analyticId,
      configId,
      contextId,
      CONSTANTS.ANALYTIC_TO_CONFIG_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    );
    this.addAttributesToNode(configNode, configAttributes);
    return SpinalGraphService.getInfo(configId);
  }

  /**
   * Retrieves the Config node for the specified analytic
   *
   * @async
   * @param {string} analyticId - The ID of the analytic for which to retrieve the Config node.
   * @return {*}  {(Promise<SpinalNodeRef | undefined>)} A Promise that resolves to the Config node, or undefined if the Config node cannot be found.
   * @memberof AnalyticService
   */
  public async getConfig(
    analyticId: string
  ): Promise<SpinalNodeRef | undefined> {
    const nodes = await SpinalGraphService.getChildren(analyticId, [
      CONSTANTS.ANALYTIC_TO_CONFIG_RELATION,
    ]);
    if (nodes.length === 0) return undefined;
    return SpinalGraphService.getInfo(nodes[0].id.get());
  }

  public async deleteConfigNode(analyticId: string): Promise<void> {
    const configNode = await this.getConfig(analyticId);
    if (configNode) await this.safeDeleteNode(configNode.id.get());
  }
  // #endregion CONFIG

  // #region TRACKING METHOD
  public async addInputTrackingMethod(
    trackingMethodAttributes: INodeDocumentation,
    contextId: string,
    analyticId: string
  ): Promise<SpinalNodeRef> {
    const inputs = await this.getInputsNode(analyticId);
    if (inputs === undefined) throw Error('Inputs node not found');
    return this.addTrackingMethod(
      trackingMethodAttributes,
      contextId,
      inputs.id.get()
    );
  }

  /**
   * Retrieves all Tracking Method nodes associated with the Inputs node of the specified analytic.
   * @async
   * @param {string} analyticId - The ID of the analytic for which to retrieve the Tracking Method nodes.
   * @returns {Promise<SpinalNodeRef[]|undefined>} A Promise that resolves to an array of Tracking Method nodes, or undefined if the Inputs node or Tracking Method nodes cannot be found.
   * @memberof AnalyticService
   */
  public async getTrackingMethods(
    analyticId: string
  ): Promise<SpinalNodeRef[] | undefined> {
    const inputs = await this.getInputsNode(analyticId);
    if (inputs === undefined) return undefined;
    const nodes = await SpinalGraphService.getChildren(inputs.id.get(), [
      CONSTANTS.ANALYTIC_INPUTS_TO_TRACKING_METHOD_RELATION,
    ]);
    return nodes;
  }

  /**
   * Retrieves the first Tracking Method node associated with the Inputs node of the specified analytic.
   * @async
   * @param {string} analyticId - The ID of the analytic for which to retrieve the Tracking Method node.
   * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the first Tracking Method node, or undefined if the Inputs node or Tracking Method nodes cannot be found.
   * @memberof AnalyticService
   */
  public async getTrackingMethod(
    analyticId: string
  ): Promise<SpinalNodeRef | undefined> {
    const trackingMethods = await this.getTrackingMethods(analyticId);
    if (trackingMethods === undefined) return undefined;
    return trackingMethods[0];
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
  public async addTrackingMethod(
    trackingMethodAttributes: INodeDocumentation,
    contextId: string,
    inputId: string
  ): Promise<SpinalNodeRef> {
    const trackingMethodNodeInfo = {
      name: 'TrackingMethod',
      type: CONSTANTS.TRACKING_METHOD_TYPE,
    };
    const trackingMethodModel = new TrackingMethodModel(trackingMethodNodeInfo);
    const trackingMethodNodeId = SpinalGraphService.createNode(
      trackingMethodNodeInfo,
      trackingMethodModel
    );
    const createdNode = await SpinalGraphService.addChildInContext(
      inputId,
      trackingMethodNodeId,
      contextId,
      CONSTANTS.ANALYTIC_INPUTS_TO_TRACKING_METHOD_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    );

    this.addAttributesToNode(createdNode, trackingMethodAttributes);
    return SpinalGraphService.getInfo(trackingMethodNodeId);
  }

  /**
   * Removes the specified Tracking Method node from the specified Inputs node and deletes it from the graph.
   * @async
   * @param {string} inputId - The ID of the Inputs node from which to remove the Tracking Method node.
   * @param {string} trackingMethodId - The ID of the Tracking Method node to remove and delete.
   * @returns {Promise<void>} A Promise that resolves when the Tracking Method node has been removed and deleted.
   * @memberof AnalyticService
   */
  public async removeTrackingMethod(
    inputId: string,
    trackingMethodId: string
  ): Promise<void> {
    await SpinalGraphService.removeChild(
      inputId,
      trackingMethodId,
      CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    );
    await SpinalGraphService.removeFromGraph(trackingMethodId);
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
  public async removeInputTrackingMethod(
    analyticId: string,
    trackingMethodId: string
  ): Promise<void> {
    const inputs = await this.getInputsNode(analyticId);
    if (inputs === undefined) throw Error('Inputs node not found');
    await this.removeTrackingMethod(inputs.id.get(), trackingMethodId);
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
  public async addLinkToFollowedEntity(
    contextId: string,
    inputId: string,
    followedEntityId: string
  ): Promise<SpinalNodeRef> {
    const link = await SpinalGraphService.addChildInContext(
      inputId,
      followedEntityId,
      contextId,
      CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    );
    const id = link.info.id.get();
    return SpinalGraphService.getInfo(id);
  }

  /**
   * Adds a link between the input node of the specified analytic and a followed entity.
   * @param {string} contextId - The id of the context where the link will be created.
   * @param {string} analyticId - The id of the analytic node.
   * @param {string} followedEntityId - The id of the followed entity node.
   * @returns {Promise<SpinalNodeRef>} The linked node.
   * @memberof AnalyticService
   */
  public async addInputLinkToFollowedEntity(
    contextId: string,
    analyticId: string,
    followedEntityId: string
  ): Promise<SpinalNodeRef> {
    const inputs = await this.getInputsNode(analyticId);
    if (inputs === undefined) throw Error('Inputs node not found');
    return this.addLinkToFollowedEntity(
      contextId,
      inputs.id.get(),
      followedEntityId
    );
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
  public async removeLinkToFollowedEntity(
    analyticId: string,
    followedEntityId: string
  ): Promise<void> {
    const inputNodeRef = await this.getInputsNode(analyticId);
    if (inputNodeRef === undefined) throw Error('Inputs node not found');
    await SpinalGraphService.removeChild(
      inputNodeRef.id.get(),
      followedEntityId,
      CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    );
  }

  /**
   * Get the followed entity node of an analytic.
   * @async
   * @param {string} analyticId - The id of the analytic.
   * @returns {Promise<SpinalNodeRef|undefined>} The followed entity node or undefined if it does not exist.
   * @memberof AnalyticService
   */
  public async getFollowedEntity(analyticId: string) {
    const inputsNode = await this.getInputsNode(analyticId);
    if (inputsNode === undefined) return undefined;
    const nodes = await SpinalGraphService.getChildren(inputsNode.id.get(), [
      CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION,
    ]);
    if (nodes === undefined) return undefined;
    return nodes[0];
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
  public async addAttributesToNode(
    node: SpinalNode<any>,
    attributes: INodeDocumentation
  ): Promise<void> {
    for (const categoryName of Object.keys(attributes)) {
      for (const attribute of attributes[categoryName]) {
        await AttributeService.addAttributeByCategoryName(
          node,
          categoryName,
          attribute.name,
          attribute.value,
          attribute.type,
          ''
        );
      }
    }
  }

  public async getAttributesFromNode(
    nodeId: string,
    category: string
  ): Promise<any> {
    const node = SpinalGraphService.getRealNode(nodeId);
    const res = {};
    const parameters = await attributeService.getAttributesByCategory(
      node,
      category
    );
    for (const param of parameters) {
      const obj = param.get();
      res[obj.label] = parseValue(obj.value);
    }
    return res;
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
  public async getAttributeFromNode(
    nodeId: string,
    category: string,
    label: string
  ): Promise<any> {
    const node = SpinalGraphService.getRealNode(nodeId);
    const parameters = await attributeService.getAttributesByCategory(
      node,
      category
    );
    for (const param of parameters) {
      const obj = param.get();
      if (obj.label === label) return { [obj.label]: parseValue(obj.value) };
    }
    return undefined;
  }

  public async getAllCategoriesAndAttributesFromNode(nodeId: string) : Promise<IAnalyticConfig> {
    const node = SpinalGraphService.getRealNode(nodeId);
    const res = {};
    const categories = await attributeService.getCategory(node);
    for (const cat of categories) {
      const categoryName = cat.nameCat;
      res[categoryName] = {};
      const attributes = await attributeService.getAttributesByCategory(
        node,
        categoryName
      );
      for (const attribute of attributes) {
        const obj = attribute.get();
        res[categoryName][obj.label] = parseValue(obj.value);
      }
    }
    return res;
  }
  //#endregion NODE DOCUMENTATION

  // #region NODE GLOBAL
  private async removeChild(
    parentNode: SpinalNode<any>,
    childNode: SpinalNode<any>,
    relation: string
  ): Promise<void> {
    try {
      await parentNode.removeChild(
        childNode,
        relation,
        SPINAL_RELATION_PTR_LST_TYPE
      );
    } catch (e) {
      try {
        await parentNode.removeChild(
          childNode,
          relation,
          SPINAL_RELATION_LST_PTR_TYPE
        );
      } catch (e) {
        console.log(e);
      }
    }
  }

  public async safeDeleteNode(
    nodeId: string,
    shouldDeleteChildren = false
  ): Promise<void> {
    const realNode = SpinalGraphService.getRealNode(nodeId);
    const relations = realNode.getRelationNames();
    for (const relation of relations) {
      const children = await realNode.getChildren(relation);
      for (const child of children) {
        await this.removeChild(realNode, child, relation);
        if (shouldDeleteChildren) await child.removeFromGraph();
      }
    }
    await realNode.removeFromGraph();
  }
  // #endregion NODE GLOBAL
}
