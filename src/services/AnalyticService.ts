/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SpinalGraphService,
  SpinalNodeRef,
  SpinalNode,
  SpinalContext,
  SPINAL_RELATION_PTR_LST_TYPE,
} from 'spinal-env-viewer-graph-service';
import * as CONSTANTS from '../constants';
import { ConfigModel } from '../models/ConfigModel';
import { AnalyticModel } from '../models/AnalyticModel';
import { IAnalytic } from '../interfaces/IAnalytic';
import { EntityModel } from '../models/EntityModel';
import { IEntity } from '../interfaces/IEntity';
import { TrackingMethodModel } from '../models/TrackingMethodModel';

import { IInputs } from '../interfaces/IInputs';
import { InputsModel } from '../models/InputsModel';
import { IOutputs } from '../interfaces/IOutputs';
import { OutputsModel } from '../models/OutputsModel';
import { INodeDocumentation } from '../interfaces/IAttribute';
import AttributeService, { attributeService} from 'spinal-env-viewer-plugin-documentation-service';
import {
  SpinalServiceTimeseries,
} from 'spinal-model-timeseries';
import { SingletonServiceTimeseries } from './SingletonTimeSeries';

import {
  findEndpoints,
  findControlEndpoints,
  findControlEndpoint,
  findEndpoint,
  addTicketAlarm,
  formatTrackingMethodsToList,
  findAllCategoriesAndAttributes,
  getValueModelFromEntry,
} from './utils';
import { SpinalAttribute } from 'spinal-models-documentation';
import * as algo from '../algorithms/algorithms';
import axios from 'axios';
import {stringify} from 'qs'

/**
 * This class handles most of the logic for analytics. It provides methods for creating and retrieving analytics, entities, and contexts.
 * It also provides methods for applying tracking methods to followed entities and applying algorithms to inputs.
 * 
 * @export
 * @class AnalyticService
 */
export default class AnalyticService {

  /**
   * The singleton instance of the Timeseries service.
   *
   * @private
   * @type {SpinalServiceTimeseries}
   * @memberof AnalyticService
   */
  private spinalServiceTimeseries: SpinalServiceTimeseries =
    SingletonServiceTimeseries.getInstance();

  /**
   * The Twilio phone number to use for sending SMS messages.
   *
   * @private
   * @type {(string | undefined)}
   * @memberof AnalyticService
   */
  private twilioFromNumber: string | undefined;
  /**
   * The Twilio account SID to use for sending SMS messages.
   *
   * @private
   * @type {(string | undefined)}
   * @memberof AnalyticService
   */
  private twilioAccountSid: string | undefined;
  /**
   * The Twilio auth token to use for sending SMS messages.
   *
   * @private
   * @type {(string | undefined)}
   * @memberof AnalyticService
   */
  private twilioAuthToken: string | undefined;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  /**
   * Initialize private attributes with necessary information to use the the messaging service.
   *
   * @param {string} accountSid
   * @param {string} authToken
   * @param {string} fromNumber
   * @return {*}  {void}
   * @memberof AnalyticService
   */
  public initTwilioCredentials(
    accountSid: string,
    authToken: string,
    fromNumber: string
  ): void {
    if (!accountSid || !authToken || !fromNumber) {
      console.error(
        'Twilio credentials not set, Messaging services will not work'
      );
      return;
    }
    console.log("Init connection to messaging services...");
    this.twilioFromNumber = fromNumber;
    this.twilioAccountSid = accountSid;
    this.twilioAuthToken = authToken;
    console.log('Done.')
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

  public getContextIdOfAnalytic(analyticId: string): string | undefined {
    const contexts = this.getContexts();
    if (!contexts) return undefined;
    const analyticNode = SpinalGraphService.getRealNode(analyticId);

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
      type: CONSTANTS.OUTPUTS_TYPE
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
   * 
   * @async
   * @param {INodeDocumentation} trackingMethodAttributes - The attributes to add to the Tracking Method node.
   * @param {string} contextId - The ID of the context in which to add the Tracking Method node.
   * @param {string} analyticId - The ID of the analytic for which to add the Tracking Method node.
   * @return {*}  {Promise<SpinalNodeRef>} - A Promise that resolves to the newly created Tracking Method node.
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
   * Applies the provided filter parameters to the specified Followed Entity using the specified filter value and returns the results.
   * If filterValue is an empty string, it will act as if everything should be returned.
   * @async
   * @param {string} trackMethod - The type of filter.
   * @param {string} filterValue - The filter value to use.
   * @param {SpinalNodeRef} followedEntity - The SpinalNodeRef object representing the Followed Entity to which the Tracking Method should be applied.
   * @returns {*} {Promise<SpinalNodeRef[] | SpinalNodeRef | undefined>} - A Promise that resolves with the results of the applied Tracking Method.
   * @memberof AnalyticService
   */
  public async applyTrackingMethodWithParams(
    trackMethod: string,
    filterValue: string,
    followedEntity: SpinalNodeRef
  ) : Promise<SpinalNodeRef[] | SpinalNodeRef | SpinalAttribute |SpinalAttribute[] | undefined>{
    if (followedEntity) {
      switch (trackMethod) {
        case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER: {
          if (filterValue === '')
            return await findEndpoints(followedEntity.id.get());
          const endpoints = await findEndpoint(
            followedEntity.id.get(),
            filterValue
          );
          return endpoints;
        }
        case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER: {
          if (filterValue === '')
            return await findControlEndpoints(followedEntity.id.get(), filterValue);
          const controlEndpoints = await findControlEndpoint(
            followedEntity.id.get(),
            filterValue
          );
          return controlEndpoints;
        }
        case CONSTANTS.TRACK_METHOD.ATTRIBUTE_NAME_FILTER: {
          console.log('Attribute filter');
          const node = SpinalGraphService.getRealNode(followedEntity.id.get());
          if (filterValue === ''){
            const result = await findAllCategoriesAndAttributes(followedEntity.id.get())
            return result;
          }
          else {
            const [first,second] = filterValue.split(':');
            const foundAttribute = await attributeService.findOneAttributeInCategory(node,first,second);
            console.log(foundAttribute);
            if(foundAttribute === -1 ) return undefined;
            return foundAttribute
            
          }
        }
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

  /**
   * Gets the attributes from a node.
   *
   * @param {string} nodeId - The ID of the node from which to retrieve the attributes.
   * @param {string} category - The category of the attributes to retrieve.
   * @return {*}  {Promise<any>} An object containing the attributes.
   * @memberof AnalyticService
   */
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
      res[obj.label] = obj.value;
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
      if (obj.label === label) return { [obj.label]: obj.value};
    }
    return undefined;
  }

  public async getAllCategoriesAndAttributesFromNode(nodeId: string,){
    const node = SpinalGraphService.getRealNode(nodeId);
    const res = {};
    const categories = await attributeService.getCategory(node);
    for (const cat of categories) {
      const categoryName = cat.nameCat
      res[categoryName] = {};
      const attributes = await attributeService.getAttributesByCategory(node,categoryName);
      for(const attribute of attributes){
        const obj = attribute.get();
        res[categoryName][obj.label] = obj.value;
      }
    }
    return res;
  }

  /**
   * Gets the targeted entities for an analytic.
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
        const isGroup: boolean = followedEntity.type.get().includes('group') || followedEntity.type.get().includes('Group');

        const relationNameToTargets = isGroup
          ? CONSTANTS.GROUP_RELATION_PREFIX + entityType
          : 'has' + entityType.charAt(0).toUpperCase() + entityType.slice(1);

        console.log('Followed entity is a', followedEntity.type.get(), ' but the analytic is under a ', entityType, ' entity.');
        console.log('Trying to find the correct entities with the deducted relation name: ', relationNameToTargets);
        const entities = await SpinalGraphService.getChildren(
          followedEntity.id.get(),
          [relationNameToTargets]
        );
        return entities;
      }
    }
  }

  public async getEntryDataModelByInputIndex(
    analyticId: string,
    followedEntity: SpinalNodeRef,
    inputIndex: string
  ) : Promise<SpinalNodeRef|SpinalAttribute | undefined> {
    const trackingMethod = await this.getTrackingMethod(analyticId);
    if (trackingMethod){
      const inputParams = await this.getAttributesFromNode(
      trackingMethod.id.get(),
      inputIndex
      );
      
      switch (inputParams[CONSTANTS.ATTRIBUTE_TRACKING_METHOD]) {
        case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER: {
          const endpoint = await findEndpoint(
            followedEntity.id.get(),
            inputParams[CONSTANTS.ATTRIBUTE_FILTER_VALUE]
          );
          return endpoint;
        }
        case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER: {
          const controlEndpoint = await findControlEndpoint(
            followedEntity.id.get(),
            inputParams[CONSTANTS.ATTRIBUTE_FILTER_VALUE]
          );
          return controlEndpoint;
        }
        case CONSTANTS.TRACK_METHOD.ATTRIBUTE_NAME_FILTER: {
          const node = SpinalGraphService.getRealNode(followedEntity.id.get());
          const [first,second] = inputParams[CONSTANTS.ATTRIBUTE_FILTER_VALUE].split(':');
          const foundAttribute = await attributeService.findOneAttributeInCategory(node,first,second);
          if(foundAttribute === -1 ) return undefined;
          return foundAttribute
        }
        default:
          console.log('Track method not recognized');
      
    }
    }
  }

  public async getFormattedInputDataByIndex(
    analyticId: string,
    followedEntity: SpinalNodeRef,
    inputIndex: string
  ) : Promise<any []> {
    console.log("getFormattedInputDataByIndex :",inputIndex)
    const input : any[] = [];
    const entryDataModel = await this.getEntryDataModelByInputIndex(analyticId,followedEntity,inputIndex);
    if(!entryDataModel) return input;
    const trackingMethod = await this.getTrackingMethod(analyticId);
    if(!trackingMethod) return input;
    const trackingParams = await this.getAttributesFromNode(
      trackingMethod.id.get(),
      inputIndex
    );

    console.log("trackingParams",trackingParams)
    if ( !trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] || trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] == 0) {
        const currentValue = await getValueModelFromEntry(entryDataModel);
        input.push(currentValue.get());
        
    } else {
      const spinalTs =
        await this.spinalServiceTimeseries.getOrCreateTimeSeries(
          entryDataModel.id.get()
        );
      const end = Date.now();
      const start = end - trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES];
      const data = await spinalTs.getFromIntervalTime(start, end);

      //add fictive data copying last value to currentTime.
      data.push({date : end, value: data[data.length - 1].value});
      //const dataValues = data.map((el) => el.value);
      input.push(data);
    }
    return input;
  }

  



  private filterAlgorithmParametersAttributesByIndex(algoParams :any , indexName : string){
    const result = {};
      for (const key in algoParams) {
          if (key.startsWith(indexName)) {
              const newKey = key.replace(indexName + CONSTANTS.ATTRIBUTE_SEPARATOR, "");
              result[newKey] = algoParams[key];
          }
      }

      return result;

  }

  private async recExecuteAlgorithm(analyticId :string ,entity: SpinalNodeRef, algoIndexName : string ,ioDependencies :any , algoIndexMapping: any,algoParams :any ) :Promise<any> {
    const inputs: any[] =[]
    const myDependencies = ioDependencies[algoIndexName].split(CONSTANTS.ATTRIBUTE_VALUE_SEPARATOR);
    console.log("myDependencies",myDependencies);

    for (const dependency of myDependencies){
      // if dependency is an algorithm then rec call with that algorithm
      if(dependency.startsWith('A')){
        // save the result of the algorithm in the inputs array
        const res  = await this.recExecuteAlgorithm(analyticId,entity,dependency,ioDependencies,algoIndexMapping,algoParams);
        inputs.push(res);
      }
      else {
        // if dependency is an input then get the value of the input
        const inputData = await this.getFormattedInputDataByIndex(analyticId,entity,dependency);
        inputs.push(inputData);
      }
    }
    // after the inputs are ready we can execute the algorithm
    const algorithm_name = algoIndexMapping[algoIndexName];
    const algorithmParameters = this.filterAlgorithmParametersAttributesByIndex(algoParams,algoIndexName);
    const result = algo[algorithm_name].run(inputs, algorithmParameters);
    return result;
  }

  /**
   * Performs an analysis on an entity for an analytic.
   * @param {string} analyticId The ID of the analytic.
   * @param {SpinalNodeRef} entity The SpinalNodeRef for the entity to analyze.
   * @returns {*} {Promise<void>}
   * @memberof AnalyticService
   */
  public async doAnalysis(analyticId: string, entity: SpinalNodeRef) : Promise<void> {
    //Get the io dependencies of the analytic
    const configNode = await this.getConfig(analyticId);
    if(!configNode) return;
    const ioDependencies = await this.getAttributesFromNode(configNode.id.get(), CONSTANTS.CATEGORY_ATTRIBUTE_IO_DEPENDENCIES);
    const algoIndexMapping = await this.getAttributesFromNode(configNode.id.get(), CONSTANTS.CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING);
    const algoParams = await this.getAttributesFromNode(configNode.id.get(), CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS);
    //console.log("ioDependencies",ioDependencies);
    //console.log("algoIndexMapping",algoIndexMapping);
    //console.log("algoParams",algoParams);

    const R = ioDependencies['R'];
    const result = await this.recExecuteAlgorithm(analyticId,entity,R,ioDependencies,algoIndexMapping,algoParams);
    console.log("result",result);
    this.applyResult(result,analyticId,configNode,entity);
    
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
  public async applyResult(
    result: any,
    analyticId: string,
    configNode: SpinalNodeRef,
    followedEntityNode: SpinalNodeRef,
  ): Promise<void> {
    const params = await this.getAttributesFromNode(
      configNode.id.get(),
      CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS
    );

    switch (params[CONSTANTS.ATTRIBUTE_RESULT_TYPE]) {
      case CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET:
        await this.handleTicketResult(
          result,
          analyticId,
          configNode,
          followedEntityNode,
          params,
          'Ticket'
        );
        break;
      case CONSTANTS.ANALYTIC_RESULT_TYPE.CONTROL_ENDPOINT:
        await this.handleControlEndpointResult(
          result,
          followedEntityNode,
          params
        );
        break;
      case CONSTANTS.ANALYTIC_RESULT_TYPE.ALARM:
        await this.handleTicketResult(
          result,
          analyticId,
          configNode,
          followedEntityNode,
          params,
          'Alarm'
        );
        break;
      case CONSTANTS.ANALYTIC_RESULT_TYPE.SMS:
        await this.handleSMSResult(
          result,
          configNode,
          followedEntityNode);
    }
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
  private async handleTicketResult(
    result: any,
    analyticId: string,
    configNode: SpinalNodeRef,
    followedEntityNode: SpinalNodeRef,
    params: any,
    ticketType: string // Alarm or Ticket
  ): Promise<void> {
    if (!result) return;

    const outputNode = await this.getOutputsNode(analyticId);
    if (!outputNode) return;

    const analyticContextId = this.getContextIdOfAnalytic(analyticId);
    if (!analyticContextId) return;

    const ticketInfo = {
      name: `${params[CONSTANTS.ATTRIBUTE_RESULT_NAME]} : ${followedEntityNode.name.get()}`,
    };

    addTicketAlarm(ticketInfo, configNode, analyticContextId, outputNode.id.get(), followedEntityNode.id.get(), ticketType);
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
  private async handleControlEndpointResult(
    result: any,
    followedEntityNode: SpinalNodeRef,
    params: any
  ): Promise<void> {

    const controlEndpointNode = await findControlEndpoint(
      followedEntityNode.id.get(),
      params[CONSTANTS.ATTRIBUTE_RESULT_NAME]
    );

    if (!controlEndpointNode) return;
    const controlEndpoint = await controlEndpointNode.element.load();
    controlEndpoint.currentValue.set(result);
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
  private async handleSMSResult(
    result: any,
    configNode: SpinalNodeRef,
    followedEntityNode: SpinalNodeRef,
  ): Promise<void> {
    console.log('SMS result');
    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioFromNumber || !result) return;
    const twilioParams = await this.getAttributesFromNode(configNode.id.get(), CONSTANTS.CATEGORY_ATTRIBUTE_TWILIO_PARAMETERS);
    const toNumber : string = twilioParams[CONSTANTS.ATTRIBUTE_PHONE_NUMBER]
    const message = twilioParams[CONSTANTS.ATTRIBUTE_PHONE_MESSAGE]
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;
    const entityName: string = followedEntityNode.name.get().replace(/[0-9]/g, "*");
    const data = {
        Body: `Analytic on ${entityName} triggered with the following message : ${message}`,
        From: this.twilioFromNumber,
        To: toNumber
    }
    const config = {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      auth: {
        username: this.twilioAccountSid,
        password: this.twilioAuthToken
      },
      data: stringify(data),
      url
    }

    const axiosResult = await axios(config)
    console.log({status : axiosResult.status,data :axiosResult.data});

  }
}

export { AnalyticService };
