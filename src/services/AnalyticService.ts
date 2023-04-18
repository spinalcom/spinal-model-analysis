import {
  SpinalGraphService,
  SpinalNodeRef,
  SpinalNode,
  SpinalContext,
  SPINAL_RELATION_PTR_LST_TYPE,
} from 'spinal-env-viewer-graph-service';
import * as CONSTANTS from '../constants';
import { ConfigModel } from '../models/ConfigModel';
import { IConfig } from '../interfaces/IConfig';
import { AnalyticModel } from '../models/AnalyticModel';
import { IAnalytic } from '../interfaces/IAnalytic';
import { EntityModel } from '../models/EntityModel';
import { IEntity } from '../interfaces/IEntity';
import { TrackingMethodModel } from '../models/TrackingMethodModel';
import { ITrackingMethod } from '../interfaces/ITrackingMethod';
import { IInputs } from '../interfaces/IInputs';
import { InputsModel } from '../models/InputsModel';
import { IOutputs } from '../interfaces/IOutputs';
import { OutputsModel } from '../models/OutputsModel';
import { IAttribute, INodeDocumentation } from '../interfaces/IAttribute';
import AttributeService, {
  serviceDocumentation,
} from 'spinal-env-viewer-plugin-documentation-service';
import { attributeService } from 'spinal-env-viewer-plugin-documentation-service';

import {
  findEndpoints,
  findControlEndpoints,
  addTicketAlarm,
  getAlgorithmParameters,
} from './utils';
import * as algo from '../algorithms/algorithms';

export default class AnalyticService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

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
    };
    const inputsModel = new InputsModel(inputsInfo);
    let inputsId = SpinalGraphService.createNode(inputsInfo, inputsModel);
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
    };
    const outputsModel = new OutputsModel(outputsInfo);
    let outputsId = SpinalGraphService.createNode(outputsInfo, outputsModel);
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
   * Adds a new Config node to the specified analytic within the specified context, with the specified attributes.
   * @async
   * @param {IConfig} configInfo - The information for the new Config node to add.
   * @param {any[]} configAttributes - An array of objects representing the attributes to add to the Config node.
   * @param {string} analyticId - The ID of the analytic to which to add the Config node.
   * @param {string} contextId - The ID of the context in which to add the Config node.
   * @returns {Promise<SpinalNodeRef>} A Promise that resolves to the newly created Config node.
   * @memberof AnalyticService
   */
  public async addConfig(
    configAttributes: INodeDocumentation,
    analyticId: string,
    contextId: string
  ): Promise<SpinalNodeRef> {
    const configNodeInfo = { name: 'Config', type: CONSTANTS.CONFIG_TYPE };
    const configModel = new ConfigModel(configNodeInfo);
    let configId = SpinalGraphService.createNode(configNodeInfo, configModel);
    const configNode = await SpinalGraphService.addChildInContext(
      analyticId,
      configId,
      contextId,
      CONSTANTS.ANALYTIC_TO_CONFIG_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    );

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
    return SpinalGraphService.getInfo(configId);
  }

  /**
   * Retrieves the Config node for the specified analytic.
   * @async
   * @param {string} analyticId - The ID of the analytic for which to retrieve the Config node.
   * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the Config node, or undefined if the Config node cannot be found.
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

  /**
   * Retrieves the Inputs node for the specified analytic.
   * @async
   * @param {string} analyticId - The ID of the analytic for which to retrieve the Inputs node.
   * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the Inputs node, or undefined if the Inputs node cannot be found.
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
   * @returns {Promise<SpinalNodeRef|undefined>} A Promise that resolves to the Outputs node, or undefined if the Outputs node cannot be found.
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
   * Adds a new Tracking Method node to the Inputs node of the specified analytic within the specified context.
   * @async
   * @param {ITrackingMethod} trackingMethodInfo - The information for the new Tracking Method node to add.
   * @param {string} contextId - The ID of the context in which to add the Tracking Method node.
   * @param {string} analyticId - The ID of the analytic for which to add the Tracking Method node.
   * @returns {Promise<SpinalNodeRef>} A Promise that resolves to the newly created Tracking Method node.
   * @throws {Error} Throws an error if the Inputs node cannot be found.
   * @memberof AnalyticService
   */
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

  /**
   * Applies the Tracking Method specified for the specified analytic to the Followed Entity and returns the results.
   * @async
   * @param {string} analyticId - The ID of the analytic for which to apply the Tracking Method.
   * @throws {Error} Throws an error if the Tracking Method or Followed Entity nodes cannot be found.
   * @returns {Promise<any>} A Promise that resolves with the results of the applied Tracking Method.
   * @memberof AnalyticService
   */
  public async applyTrackingMethodLegacy(analyticId: string): Promise<any> {
    const trackingMethodModel = await this.getTrackingMethod(analyticId);
    const followedEntityModel = await this.getFollowedEntity(analyticId);
    if (followedEntityModel && trackingMethodModel) {
      const trackMethod = trackingMethodModel.trackMethod.get();
      const filterValue = trackingMethodModel.filterValue.get();
      switch (trackMethod) {
        case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER:
          const endpoints = await findEndpoints(
            followedEntityModel.id.get(),
            filterValue
          );
          return endpoints;
        case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER:
          const controlEndpoints = await findControlEndpoints(
            followedEntityModel.id.get(),
            filterValue
          );
          return controlEndpoints;
        case CONSTANTS.TRACK_METHOD.TICKET_NAME_FILTER:
          console.log('Ticket filter');
          break;
        default:
          console.log('Track method not recognized');
      }
    }
  }

  public async getTrackingMethodParameters(
    trackingMethodId: string
  ): Promise<any> {
    const trackingNode = SpinalGraphService.getRealNode(
      trackingMethodId
    );
    const res = {};
    const algorithmParameters = await attributeService.getAttributesByCategory(
      trackingNode,
      CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS
    );
    for (const param of algorithmParameters) {
      const obj = param.get();
      res[obj.label] = obj.value;
    }
    //console.log("ALGORITHM PARAMETERS : ",res);
    return res;
  }

  /**
   * Applies the specified Tracking Method to the specified Followed Entity and returns the results.
   * @async
   * @param {SpinalNodeRef} trackingMethod - The SpinalNodeRef object representing the Tracking Method to apply.
   * @param {SpinalNodeRef} followedEntity - The SpinalNodeRef object representing the Followed Entity to which the Tracking Method should be applied.
   * @returns {Promise<any>} A Promise that resolves with the results of the applied Tracking Method.
   * @memberof AnalyticService
   */
  public async applyTrackingMethod(
    trackingMethod: SpinalNodeRef,
    followedEntity: SpinalNodeRef
  ): Promise<any> {
    if (followedEntity && trackingMethod) {
      const params = await this.getTrackingMethodParameters(trackingMethod.id.get());
      const trackMethod = params['trackMethod'];
      const filterValue = params['filterValue'];
      switch (trackMethod) {
        case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER:
          const endpoints = await findEndpoints(
            followedEntity.id.get(),
            filterValue
          );
          return endpoints;
        case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER:
          const controlEndpoints = await findControlEndpoints(
            followedEntity.id.get(),
            filterValue
          );
          return controlEndpoints;
        case CONSTANTS.TRACK_METHOD.TICKET_NAME_FILTER:
          console.log('Ticket filter');
          break;
        default:
          console.log('Track method not recognized');
      }
    }
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
  public async applyTrackingMethodWithParams(
    trackMethod: string,
    filterValue: string,
    followedEntity: SpinalNodeRef
  ) {
    if (followedEntity) {
      switch (trackMethod) {
        case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER:
          const endpoints = await findEndpoints(
            followedEntity.id.get(),
            filterValue
          );
          return endpoints;
        case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER:
          const controlEndpoints = await findControlEndpoints(
            followedEntity.id.get(),
            filterValue
          );
          return controlEndpoints;
        case CONSTANTS.TRACK_METHOD.TICKET_NAME_FILTER:
          console.log('Ticket filter');
          break;
        default:
          console.log('Track method not recognized');
      }
    }
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
   * @param {string} inputNodeId - The ID of the input node.
   * @param {string} followedEntityId - The ID of the followed entity node.
   * @returns {Promise<void>}
   * @memberof AnalyticService
   */
  public async removeLinkToFollowedEntity(
    inputNodeId: string,
    followedEntityId: string
  ): Promise<void> {
    await SpinalGraphService.removeChild(
      inputNodeId,
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
  public async addAttributesToNode(
    node: SpinalNode<any>,
    attributes: INodeDocumentation
  ): Promise<void> {
    for (let categoryName of Object.keys(attributes)) {
      for (let attribute of attributes[categoryName]) {
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

  public async getAttributesFromNode(nodeId: string,category:string) : Promise<any> {
    const node = SpinalGraphService.getRealNode(nodeId);
    const res = {}
    const parameters = await attributeService.getAttributesByCategory(node, category);
    for (const param of parameters) {
        const obj = param.get();
        res[obj.label] = obj.value;
    } 
    return res
  }
  /**
   * Applies the result of an algorithm.
   *
   * @param {*} result The result of the algorithm used.
   * @param {string} analyticId The ID of the analytic.
   * @param {SpinalNodeRef} config The SpinalNodeRef of the configuration of the analytic.
   * @param {SpinalNodeRef} followedEntity The SpinalNodeRef of the entity.
   * @param {SpinalNodeRef} trackingMethod The SpinalNodeRef of the tracking method.
   * @return {*}
   * @memberof AnalyticService
   */
  public async applyResult(
    result: any,
    analyticId: string,
    config: SpinalNodeRef,
    followedEntity: SpinalNodeRef,
    trackingMethod: SpinalNodeRef
  ) {
    const params = this.getAttributesFromNode(config.id.get(), CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS);
    switch (params['resultType']) {
      case CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET:
        if (!result) return;
        const analyticInfo = SpinalGraphService.getInfo(analyticId);
        let ticketInfos = {
          name: params['resultName'] + ' : ' + followedEntity.name.get(),
        };
        const ticket = addTicketAlarm(
          ticketInfos,
          config,
          analyticInfo.id.get()
        );
        break;
      case CONSTANTS.ANALYTIC_RESULT_TYPE.MODIFY_CONTROL_ENDPOINT:
        const entries = await this.applyTrackingMethod(
          trackingMethod,
          followedEntity
        );
        if (!entries) return;
        for (const entry of entries) {
          const cp = await entry.element.load();
          cp.currentValue.set(result);
        }
        break;
      case CONSTANTS.ANALYTIC_RESULT_TYPE.CONTROL_ENDPOINT:
        const entries2 = await this.applyTrackingMethodWithParams(
          CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER,
          params['resultName'],
          followedEntity
        );
        if (!entries2) return;
        for (const entry of entries2) {
          const cp = await entry.element.load();
          cp.currentValue.set(result);
        }
    }
  }

  /**
   * Gets the real targeted entities for an analytic.
   *
   * @param {string} analyticId The ID of the analytic.
   * @return {*}  {(Promise<SpinalNodeRef[]|undefined>)} An array of SpinalNodeRefs for the entities
   * @memberof AnalyticService
   */
  public async getWorkingFollowedEntities(
    analyticId: string
  ): Promise<SpinalNodeRef[] | undefined> {
    const followedEntity = await this.getFollowedEntity(analyticId);
    const trackingMethod = await this.getTrackingMethod(analyticId);
    const config = await this.getConfig(analyticId);
    const entityInfo = await this.getEntityFromAnalytic(analyticId);
    if (!entityInfo) return;
    const entityType: string = entityInfo.entityType.get();
    if (followedEntity && trackingMethod && config) {
      if (entityType == followedEntity.type.get()) {
        // we can continue as planned
        return [followedEntity];
      } else {
        const isGroup: boolean = followedEntity.type.get().includes('group');
        const relationNameToTargets = isGroup
          ? CONSTANTS.GROUP_RELATION_PREFIX + entityType
          : 'has' + entityType.charAt(0).toUpperCase() + entityType.slice(1);
        const entities = await SpinalGraphService.getChildren(
          followedEntity.id.get(),
          [relationNameToTargets]
        );
        return entities;
      }
    }
  }

  /**
   * Gets the entry data models from a followed entity for an analytic.
   * @param {string} analyticId The ID of the analytic.
   * @param {SpinalNodeRef} followedEntity The SpinalNodeRef for the entity being tracked.
   * @returns {*} The entry data models for the followed entity.
   * @memberof AnalyticService
   */
  public async getEntryDataModelsFromFollowedEntity(
    analyticId: string,
    followedEntity: SpinalNodeRef
  ): Promise<any> {
    const trackingMethod = await this.getTrackingMethod(analyticId);
    if (trackingMethod)
      return this.applyTrackingMethod(trackingMethod, followedEntity);
  }

  /**
   * Gets the data for a followed entity and applies an algorithm to it for an analytic.
   * @private
   * @param {string} analyticId The ID of the analytic.
   * @param {SpinalNodeRef} followedEntity The SpinalNodeRef for the entity being tracked.
   * @returns {*}
   * @memberof AnalyticService
   */
  private async getDataAndApplyAlgorithm(
    analyticId: string,
    followedEntity: SpinalNodeRef
  ): Promise<void> {
    const trackingMethod = await this.getTrackingMethod(analyticId);
    const config = await this.getConfig(analyticId);
    if (!trackingMethod || !config) return;

    const entryDataModels = await this.applyTrackingMethod(
      trackingMethod,
      followedEntity
    );
    if (entryDataModels) {
      const params = await getAlgorithmParameters(config);
      const algorithm_name = params['algorithm'];
      // this is another way to get the value that i would like to measure the performance of, later.
      //const value2 = await attributeService.findOneAttributeInCategory(entryDataModels[0], "default", "currentValue");
      const value = (
        await entryDataModels[0].element.load()
      ).currentValue.get();
      //const value = entryDataModels[0].currentValue.get();
      
      const result = algo[algorithm_name](value, params);
      //console.log("ANALYSIS RESULT : ",result);
      if (typeof result === 'undefined') return;
      this.applyResult(
        result,
        analyticId,
        config,
        followedEntity,
        trackingMethod
      );
    }
  }

  /**
   * Performs an analysis on an entity for an analytic.
   * @param {string} analyticId The ID of the analytic.
   * @param {SpinalNodeRef} entity The SpinalNodeRef for the entity to analyze.
   * @returns {*}
   * @memberof AnalyticService
   */
  public async doAnalysis(analyticId: string, entity: SpinalNodeRef) {
    const entryDataModels = this.getEntryDataModelsFromFollowedEntity(
      analyticId,
      entity
    );
    if (!entryDataModels) return;
    this.getDataAndApplyAlgorithm(analyticId, entity);
  }
}

export { AnalyticService };
