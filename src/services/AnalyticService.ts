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
import { IAnalyticDetails } from '../interfaces/IAnalyticDetails';
import { EntityModel } from '../models/EntityModel';
import { IEntity } from '../interfaces/IEntity';
import { TrackingMethodModel } from '../models/TrackingMethodModel';
import {
  IGChatMessageResult,
  IResult,
  IGChatOrganCardResult,
  IGChatCard,
} from '../interfaces/IAnalyticResult';
import { IInputs } from '../interfaces/IInputs';
import { InputsModel } from '../models/InputsModel';
import { IOutputs } from '../interfaces/IOutputs';
import { OutputsModel } from '../models/OutputsModel';
import { INodeDocumentation } from '../interfaces/IAttribute';
import AttributeService, {
  attributeService,
} from 'spinal-env-viewer-plugin-documentation-service';
import {
  SpinalDateValue,
  SpinalServiceTimeseries,
} from 'spinal-model-timeseries';

import {
  findEndpoint,
  findAttribute,
  addTicketAlarm,
  getValueModelFromEntry,
  getCronMissingExecutionTimes,
  getIntervalTimeMissingExecutionTimes,
  safeDeleteNode,
  timeseriesPreProcessing,
  createEndpoint
} from './utils';
import { SingletonServiceTimeseries } from './SingletonTimeSeries';
import { SpinalAttribute } from 'spinal-models-documentation';
import { ALGORITHMS } from '../algorithms/algorithms';
import axios from 'axios';
import { stringify } from 'qs';
import { ExitAnalyticError } from '../classes/Errors';
import * as cronParser from 'cron-parser';



// Logging function
function logMessage(message: string): void {
  if (process.env.ADVANCED_LOGGING === 'true') {
    console.log(message);
  }
}

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

  //private googleChatService: GoogleChatService;

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

  public async updateLastExecutionTime(analyticId: string): Promise<void> {
    const configNode = await this.getConfig(analyticId);
    if (!configNode) throw Error('Config node not found');
    const realNode = SpinalGraphService.getRealNode(configNode.id.get());
    await attributeService.addAttributeByCategoryName(
      realNode,
      CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS,
      CONSTANTS.ATTRIBUTE_LAST_EXECUTION_TIME,
      Date.now().toString(),
      'number'
    );
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
    if (configNode) await safeDeleteNode(configNode.id.get());
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
    if (inputsNode) await safeDeleteNode(inputsNode.id.get(), false);
  }

  public async deleteOutputsNode(
    analyticId: string,
    shouldDeleteChildren = false
  ): Promise<void> {
    const outputsNode = await this.getOutputsNode(analyticId);
    if (outputsNode)
      await safeDeleteNode(outputsNode.id.get(), shouldDeleteChildren);
  }

  public async deleteAnalytic(
    analyticId: string,
    shouldDeleteChildren = false
  ): Promise<void> {
    const inputsNode = await this.getInputsNode(analyticId);
    const outputsNode = await this.getOutputsNode(analyticId);
    if (inputsNode) await safeDeleteNode(inputsNode.id.get());
    if (outputsNode)
      await safeDeleteNode(outputsNode.id.get(), shouldDeleteChildren);

    await safeDeleteNode(analyticId);
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
   *
   * @async
   * @param {string} trackMethod - The type of filter.
   * @param {string} filterValue - The filter value to use.
   * @param {SpinalNodeRef} followedEntity - The SpinalNodeRef object representing the Followed Entity to which the Tracking Method should be applied.
   * @returns {*} {Promise<SpinalNodeRef[] | SpinalNodeRef | undefined>} - A Promise that resolves with the results of the applied Tracking Method.
   * @memberof AnalyticService
   */
  public async applyTrackingMethodWithParams(
    followedEntity: SpinalNodeRef,
    trackMethod: string,
    filterValue: string,
    depth: number,
    strictDepth: boolean,
    authorizedRelations: string[]
  ): Promise<SpinalNodeRef | SpinalAttribute | undefined> {
    if (followedEntity) {
      switch (trackMethod) {
        case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER: {
          const endpoint = await findEndpoint(
            followedEntity.id.get(),
            filterValue,
            depth,
            strictDepth,
            authorizedRelations,
            CONSTANTS.ENDPOINT_RELATIONS,
            CONSTANTS.ENDPOINT_NODE_TYPE
          );
          return endpoint;
        }
        case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER: {
          const controlEndpoint = await findEndpoint(
            followedEntity.id.get(),
            filterValue,
            depth,
            strictDepth,
            authorizedRelations,
            CONSTANTS.CONTROL_ENDPOINT_RELATIONS,
            CONSTANTS.ENDPOINT_NODE_TYPE
          );
          return controlEndpoint;
        }
        case CONSTANTS.TRACK_METHOD.ATTRIBUTE_NAME_FILTER: {
          const [first, second] = filterValue.split(':');
          const foundAttribute = await findAttribute(
            followedEntity.id.get(),
            first,
            second,
            depth,
            strictDepth,
            authorizedRelations
          );
          if (foundAttribute == -1) return undefined;
          return foundAttribute;

          //}
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
      if (obj.label === label) return { [obj.label]: obj.value };
    }
    return undefined;
  }

  public async getAllCategoriesAndAttributesFromNode(nodeId: string) {
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
      }
      if (
        followedEntity.type.get().includes('group') ||
        followedEntity.type.get().includes('Group')
      ) {
        console.log(
          'Anchor entity is a group, trying to find the correct entities with the relation name: ',
          CONSTANTS.GROUP_RELATION_PREFIX + entityType
        );
        return await SpinalGraphService.getChildren(followedEntity.id.get(), [
          CONSTANTS.GROUP_RELATION_PREFIX + entityType,
        ]);
      }
      if (
        followedEntity.type.get().includes('context') ||
        followedEntity.type.get().includes('Context')
      ) {
        console.log(
          'Anchor entity is a context, trying to find the correct entities'
        );
        return await SpinalGraphService.findInContextByType(
          followedEntity.id.get(),
          followedEntity.id.get(),
          entityType
        );
      }
      console.log(
        'Failed to deduct the correct entities from the anchor entity'
      );
      return [];
    }
  }

  public async getWorkingFollowedEntitiesWithParam(
    followedEntity: SpinalNodeRef,
    entityType: string
  ): Promise<SpinalNodeRef[]> {
    if (entityType == followedEntity.type.get()) {
      // we can continue as planned
      return [followedEntity];
    }
    if (
      followedEntity.type.get().includes('group') ||
      followedEntity.type.get().includes('Group')
    ) {
      console.log(
        'Anchor entity is a group, trying to find the correct entities with the relation name: ',
        CONSTANTS.GROUP_RELATION_PREFIX + entityType
      );
      return await SpinalGraphService.getChildren(followedEntity.id.get(), [
        CONSTANTS.GROUP_RELATION_PREFIX + entityType,
      ]);
    }
    if (
      followedEntity.type.get().includes('context') ||
      followedEntity.type.get().includes('Context')
    ) {
      console.log(
        'Anchor entity is a context, trying to find the correct entities'
      );
      return await SpinalGraphService.findInContextByType(
        followedEntity.id.get(),
        followedEntity.id.get(),
        entityType
      );
    }
    console.log('Failed to deduct the correct entities from the anchor entity');
    return [];
  }

  public async getEntryDataModelByInputIndex(
    analyticId: string,
    followedEntity: SpinalNodeRef,
    inputIndex: string
  ): Promise<SpinalNodeRef | SpinalAttribute | undefined> {
    const trackingMethod = await this.getTrackingMethod(analyticId);
    if (!trackingMethod) return undefined;

    const inputParams = await this.getAttributesFromNode(
      trackingMethod.id.get(),
      inputIndex
    );

    return await this.applyTrackingMethodWithParams(
      followedEntity,
      inputParams[CONSTANTS.ATTRIBUTE_TRACKING_METHOD],
      inputParams[CONSTANTS.ATTRIBUTE_FILTER_VALUE],
      inputParams[CONSTANTS.ATTRIBUTE_SEARCH_DEPTH],
      inputParams[CONSTANTS.ATTRIBUTE_STRICT_DEPTH],
      inputParams[CONSTANTS.ATTRIBUTE_SEARCH_RELATIONS].split(
        CONSTANTS.ATTRIBUTE_VALUE_SEPARATOR
      )
    );
  }

  public async getFormattedInputDataByIndex(
    analyticId: string,
    followedEntity: SpinalNodeRef,
    inputIndex: string,
    referenceEpochTime: number = Date.now()
  ): Promise<SpinalDateValue[] | string | boolean | number | undefined> {
    const entryDataModel = await this.getEntryDataModelByInputIndex(
      analyticId,
      followedEntity,
      inputIndex
    );
    if (!entryDataModel) return undefined;
    const trackingMethod = await this.getTrackingMethod(analyticId);
    if (!trackingMethod) return undefined;
    const trackingParams = await this.getAttributesFromNode(
      trackingMethod.id.get(),
      inputIndex
    );
    if (
      !trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] ||
      trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] == 0
    ) {
      const currentValue = await getValueModelFromEntry(entryDataModel);
      const assertedValue: string | number | boolean = currentValue.get() as
        | string
        | number
        | boolean;
      return assertedValue;
    } else {
      const spinalTs = await this.spinalServiceTimeseries.getOrCreateTimeSeries(
        entryDataModel.id.get()
      );
      const end = referenceEpochTime;
      const start = end - trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES];
      const injectLastValueBeforeStart : boolean = trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES_VALUE_AT_START];
      let data = injectLastValueBeforeStart ?
                    await spinalTs.getFromIntervalTime(start, end,true) :
                    await spinalTs.getFromIntervalTime(start, end);
      if(injectLastValueBeforeStart){
        data = timeseriesPreProcessing(start,end,data) // tidy up the data mainly at start and end
      }
      return data;
    }
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

  /*public async createAnalytic(contextId : string, entityId :string , analyticDetails : IAnalyticDetails){
    const analyticCreationInfo : IAnalytic = {name : analyticDetails.analyticName, description : ''};
    const analyticNode = await this.addAnalytic(analyticCreationInfo,contextId,entityId)
    const InputNode = await this.addInputsNode(analyticNode.id.get(),contextId);
    const OutputNode = await this.addOutputsNode(analyticNode.id.get(),contextId);
    //const configNode = await this.addConfig(analyticDetails.config,analyticNode.id.get(),contextId);
  }*/

  public findExecutionOrder(dependencies): string[] | null {
    const graph: { [key: string]: string[] } = {};
    const visited: { [key: string]: boolean } = {};
    const stack: string[] = [];

    // Create graph from dependency map
    for (const algo of Object.keys(dependencies)) {
      graph[algo] = graph[algo] || [];
      const dependency = dependencies[algo];
      graph[dependency] = graph[dependency] || [];
      graph[dependency].push(algo);
    }
    const visit = (node: string) => {
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

  private filterAlgorithmParametersAttributesByIndex(
    algoParams: any,
    indexName: string
  ) {
    const result = {};
    for (const key in algoParams) {
      if (key.startsWith(indexName)) {
        const newKey = key.replace(
          indexName + CONSTANTS.ATTRIBUTE_SEPARATOR,
          ''
        );
        result[newKey] = algoParams[key];
      }
    }

    return result;
  }

  private async recExecuteAlgorithm(
    analyticId: string,
    entity: SpinalNodeRef,
    algoIndexName: string,
    ioDependencies: any,
    algoIndexMapping: any,
    algoParams: any,
    referenceEpochTime :number = Date.now()
  ): Promise<any> {
    const inputs: any[] = [];
    const myDependencies =
      ioDependencies[algoIndexName]?.split(
        CONSTANTS.ATTRIBUTE_VALUE_SEPARATOR
      ) ?? [];
    for (const dependency of myDependencies) {
      if (!dependency) continue; // if the dependency is empty

      // if dependency is an algorithm then rec call with that algorithm
      if (dependency.startsWith('A')) {
        // save the result of the algorithm in the inputs array
        const res = await this.recExecuteAlgorithm(
          analyticId,
          entity,
          dependency,
          ioDependencies,
          algoIndexMapping,
          algoParams
        );
        inputs.push(res);
      } else {
        // if dependency is an input then get the value of the input
        const inputData = await this.getFormattedInputDataByIndex(
          analyticId,
          entity,
          dependency,
          referenceEpochTime
        );
        if (inputData == undefined) {
          throw new Error(`Input data ${dependency} could not be retrieved`);
        }
        inputs.push(inputData);
      }
    }
    // after the inputs are ready we can execute the algorithm
    const algorithm_name = algoIndexMapping[algoIndexName];
    const algorithmParameters = this.filterAlgorithmParametersAttributesByIndex(
      algoParams,
      algoIndexName
    );
    const result = ALGORITHMS[algorithm_name].run(inputs, algorithmParameters);
    if (result == undefined)
      throw new Error(`Algorithm ${algorithm_name} returned undefined`);
    if (algorithm_name === 'EXIT' && result === true)
      throw new ExitAnalyticError('EXIT algorithm triggered');
    return result;
  }

  /**
   * Performs an analysis on an entity for an analytic.
   * @param {string} analyticId The ID of the analytic.
   * @param {SpinalNodeRef} entity The SpinalNodeRef for the entity to analyze.
   * @returns {*} {Promise<void>}
   * @memberof AnalyticService
   */
  public async doAnalysisOnEntity(
    analyticId: string,
    entity: SpinalNodeRef,
    configAttributes? : any,
    executionTime : number = Date.now()

  ): Promise<IResult> {
    try {
      // Get the io dependencies of the analytic
      if(!configAttributes){
        const configNode = await this.getConfig(analyticId);
        if (!configNode) return { success: false, error: 'No config node found' };
        configAttributes = await this.getAllCategoriesAndAttributesFromNode(configNode.id.get());
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
      const ioDependencies= configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_IO_DEPENDENCIES];

      const algoIndexMapping = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING];
      
      const algoParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS];
      

      const R = ioDependencies['R'];

        const result = await this.recExecuteAlgorithm(
          analyticId,
          entity,
          R,
          ioDependencies,
          algoIndexMapping,
          algoParams,
          executionTime);
          
        return await this.applyResult(result, analyticId, configAttributes, entity, executionTime);
    } catch (error) {
      const analyticInfo = SpinalGraphService.getInfo(analyticId);
      const positionString =
        ' on ' +
        entity.name.get() +
        ' in analytic : ' +
        analyticInfo.name.get() +
        ' at ' +
        Date.now();
      if (error instanceof Error || error instanceof ExitAnalyticError) {
        return { success: false, error: error.message + positionString };
      } else {
        return {
          success: false,
          error: 'An unknown error occurred' + positionString,
        };
      }
    }
  }

  /**
   * Performs an analysis on all entities for an analytic.
   * @param {string} analyticId The ID of the analytic.
   * @return {*}  {Promise<void>}
   * @memberof AnalyticService
   */
  public async doAnalysis(analyticId: string, triggerObject: {triggerType:string, triggerValue:string }): Promise<IResult[]> {
    const entities = await this.getWorkingFollowedEntities(analyticId);
    if (!entities) return [{ success: false, error: 'No entities found' }];

    const configNode = await this.getConfig(analyticId);
    if (!configNode) return [{ success: false, error: 'No config node found' }];

    const configAttributes = await this.getAllCategoriesAndAttributesFromNode(configNode.id.get());
    
    const lastExecutionTime = parseInt(configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS][CONSTANTS.ATTRIBUTE_LAST_EXECUTION_TIME]);
    const shouldCatchUpMissedExecutions : boolean = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS][CONSTANTS.ATTRIBUTE_ANALYTIC_PAST_EXECUTIONS]
    let executionsTimes : number[] = [];

    if(shouldCatchUpMissedExecutions){
      if(triggerObject.triggerType === CONSTANTS.TRIGGER_TYPE.CRON){
        executionsTimes = getCronMissingExecutionTimes(triggerObject.triggerValue, lastExecutionTime);
      }
      if(triggerObject.triggerType === CONSTANTS.TRIGGER_TYPE.INTERVAL_TIME){
        executionsTimes = getIntervalTimeMissingExecutionTimes(parseInt(triggerObject.triggerValue), lastExecutionTime);
      }
    }
    executionsTimes.push(Date.now());

    // Adjust the last execution time for cron triggers to match the exact time
    if (triggerObject.triggerType === CONSTANTS.TRIGGER_TYPE.CRON) {
    const interval = cronParser.parseExpression(triggerObject.triggerValue);
    const nextExecutionTime = interval.prev().getTime();
    executionsTimes[executionsTimes.length - 1] = nextExecutionTime;
  }

    logMessage(`executionsTimes : ${executionsTimes}`)
    
    const analysisPromises = entities.map((entity) =>
      executionsTimes.map((executionTime) => 
      this.doAnalysisOnEntity(analyticId, entity,configAttributes, executionTime))
      
    );
    const results = await Promise.all(analysisPromises.flat());
    return results;
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
  public async applyResult(
    result: any,
    analyticId: string,
    configAttributes: any,
    followedEntityNode: SpinalNodeRef,
    referenceEpochTime : number = Date.now()
  ): Promise<IResult> {
    if (result === undefined)
      return { success: false, error: 'Result is undefined' };
    
    //const params = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS];
    switch (configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_TYPE]) {
      case CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET:
        await this.handleTicketResult(
          result,
          analyticId,
          configAttributes,
          followedEntityNode,
          'Ticket'
        );
        return {
          success: true,
          resultValue: result,
          error: '',
          resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET,
        };

      case CONSTANTS.ANALYTIC_RESULT_TYPE.CONTROL_ENDPOINT:
        await this.handleControlEndpointResult(
          result,
          followedEntityNode,
          configAttributes,
          referenceEpochTime
        );
        return {
          success: true,
          resultValue: result,
          error: '',
          resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.CONTROL_ENDPOINT,
        };
      case CONSTANTS.ANALYTIC_RESULT_TYPE.ENDPOINT:
        await this.handleEndpointResult(result, followedEntityNode, configAttributes,referenceEpochTime);
        return {
          success: true,
          resultValue: result,
          error: '',
          resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.ENDPOINT,
        };
      case CONSTANTS.ANALYTIC_RESULT_TYPE.ALARM:
        return await this.handleTicketResult(
          result,
          analyticId,
          configAttributes,
          followedEntityNode,
          'Alarm'
        );

      case CONSTANTS.ANALYTIC_RESULT_TYPE.SMS:
        return await this.handleSMSResult(
          result,
          analyticId,
          configAttributes,
          followedEntityNode
        );

      case CONSTANTS.ANALYTIC_RESULT_TYPE.LOG:
        console.log(
          `LOG : ${
            configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_NAME]
          } \t|\t Result : ${result}`
        );
        return {
          success: true,
          resultValue: result,
          error: '',
          resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.LOG,
        };

      case CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE:
        return this.handleGChatMessageResult(
          result,
          analyticId,
          configAttributes,
          followedEntityNode
        );

      case CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_ORGAN_CARD:
        return this.handleGChatOrganCardResult(
          result,
          analyticId,
          configAttributes,
          followedEntityNode
        );

      default:
        return { success: false, error: 'Result type not recognized' };
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
    configAttributes: any,
    followedEntityNode: SpinalNodeRef,
    ticketType: string // Alarm or Ticket
  ): Promise<IResult> {
    if (result == false)
      return {
        success: true,
        error: '',
        resultValue: result,
        resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET,
      };

    const outputNode = await this.getOutputsNode(analyticId);
    if (!outputNode) return { success: false, error: ' Output Node not found' };

    const analyticContextId = this.getContextIdOfAnalytic(analyticId);
    if (!analyticContextId)
      return { success: false, error: ' Analytic context id not found' };

    const ticketInfo = {
      name: `${
        configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_NAME]
      } : ${followedEntityNode.name.get()}`,
    };

    addTicketAlarm(
      ticketInfo,
      configAttributes,
      analyticContextId,
      outputNode.id.get(),
      followedEntityNode.id.get(),
      ticketType
    );
    return {
      success: true,
      error: '',
      resultValue: result,
      resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET,
    };
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
    configAttributes: any,
    referenceEpochTime : number
  ): Promise<IResult> {
    const controlEndpointNode = await findEndpoint(
      followedEntityNode.id.get(),
      configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_NAME],
      0,
      true,
      [],
      CONSTANTS.CONTROL_ENDPOINT_RELATIONS,
      CONSTANTS.ENDPOINT_NODE_TYPE
    );
    if (!controlEndpointNode)
      return { success: false, error: ' Control endpoint node not found' };

    const controlEndpoint = await controlEndpointNode.element.load();
    controlEndpoint.currentValue.set(result);
    const bool = await this.spinalServiceTimeseries.insertFromEndpoint(
      controlEndpointNode.id.get(),
      result,
      referenceEpochTime
    );
    if(!bool) throw new Error('Failed to insert data in timeseries');
    logMessage(`CP ${controlEndpointNode.name.get()} updated with value : ${result} on ${followedEntityNode.name.get()} at ${referenceEpochTime}`)
    //console.log(`CP ${controlEndpointNode.name.get()} updated with value : , ${result},  on , ${followedEntityNode.name.get()}`)
    return {
      success: true,
      resultValue: result,
      error: '',
      resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.CONTROL_ENDPOINT,
    };
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
  private async handleEndpointResult(
    result: any,
    followedEntityNode: SpinalNodeRef,
    configAttributes: any,
    referenceEpochTime: number
  ): Promise<IResult> {
    let endpointNode = await findEndpoint(
      followedEntityNode.id.get(),
      configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_NAME],
      0,
      true,
      [],
      CONSTANTS.ENDPOINT_RELATIONS,
      CONSTANTS.ENDPOINT_NODE_TYPE
    );

    if (!endpointNode && !configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_CREATE_ENDPOINT_IF_NOT_EXIST])
      return { success: false, error: 'Endpoint node not found' };

    if (!endpointNode) {
      endpointNode = await createEndpoint(referenceEpochTime,
        followedEntityNode.id.get(),
        configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_NAME],
        result,
        configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ENDPOINT_PARAMETERS][CONSTANTS.ATTRIBUTE_CREATE_ENDPOINT_UNIT],
        configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ENDPOINT_PARAMETERS][CONSTANTS.ATTRIBUTE_CREATE_ENDPOINT_MAX_DAYS])
      
        if(!endpointNode) return { success: false, error: 'Failed endpoint creation' };
    }
    const endpoint = await endpointNode.element.load();
    endpoint.currentValue.set(result);
    const bool = await this.spinalServiceTimeseries.insertFromEndpoint(
      endpointNode.id.get(),
      result,
      referenceEpochTime
    );
    if(!bool) return { success: false, error: 'Failed to insert data in timeseries' };
    logMessage(`EP ${endpointNode.name.get()} updated with value : ${result} on ${followedEntityNode.name.get()} at ${referenceEpochTime}`)
    return {
      success: true,
      resultValue: result,
      error: '',
      resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.ENDPOINT,
    };
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
    analyticId: string,
    configAttributes: any,
    followedEntityNode: SpinalNodeRef
  ): Promise<IResult> {
    if (
      !this.twilioAccountSid ||
      !this.twilioAuthToken ||
      !this.twilioFromNumber
    )
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
    const toNumber: string = twilioParams[CONSTANTS.ATTRIBUTE_PHONE_NUMBER];
    let message = twilioParams[CONSTANTS.ATTRIBUTE_PHONE_MESSAGE];
    const variables = message.match(/[^{}]+(?=\})/g);
    if (variables) {
      for (const variable of variables) {
        const value = await this.getFormattedInputDataByIndex(
          analyticId,
          followedEntityNode,
          variable
        );
        message = message.replace(`{${variable}}`, '' + value);
      }
    }
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;
    const entityName: string = followedEntityNode.name
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
      data: stringify(data),
      url,
    };

    const axiosResult = await axios(config);
    console.log({ status: axiosResult.status, data: axiosResult.data });
    return {
      success: true,
      resultValue: result,
      error: '',
      resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.SMS,
    };
  }

  private async handleGChatMessageResult(
    result: any,
    analyticId: string,
    configAttributes: any,
    followedEntityNode: SpinalNodeRef
  ): Promise<IResult> {
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
    let message: string = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_MESSAGE];
    const analyticDescription =
      analyticParams[CONSTANTS.ATTRIBUTE_ANALYTIC_DESCRIPTION];
    const variables = message.match(/[^{}]+(?=\})/g);
    if (variables) {
      for (const variable of variables) {
        const value = await this.getFormattedInputDataByIndex(
          analyticId,
          followedEntityNode,
          variable
        );
        message = message.replace(`{${variable}}`, '' + value);
      }
    }
    const resultInfo: IGChatMessageResult = {
      success: true,
      resultValue: result,
      error: '',
      spaceName: spaceName,
      message:
        'The following message has been triggered by an analytic.\n ' +
        '\nAnalysis on item : ' +
        followedEntityNode.name.get() +
        '\nDescription : ' +
        analyticDescription +
        '\nMessage : ' +
        message,
      resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE,
    };
    return resultInfo;
  }

  private async handleGChatOrganCardResult(
    result: any,
    analyticId: string,
    configAttributes: any,
    followedEntityNode: SpinalNodeRef
  ): Promise<IResult> {
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
    const spaceName: string = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_SPACE];
    let message: string = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_MESSAGE];
    const variables = message.match(/[^{}]+(?=\})/g);
    if (variables) {
      for (const variable of variables) {
        const value = await this.getFormattedInputDataByIndex(
          analyticId,
          followedEntityNode,
          variable
        );
        message = message.replace(`{${variable}}`, '' + value);
      }
    }
    const analyticDescription: string =
      analyticParams[CONSTANTS.ATTRIBUTE_ANALYTIC_DESCRIPTION];

    const lastPing = await findEndpoint(
      followedEntityNode.id.get(),
      'last_ping',
      0,
      true,
      [],
      CONSTANTS.ENDPOINT_RELATIONS,
      CONSTANTS.ENDPOINT_NODE_TYPE
    );
    if (!lastPing)
      return {
        success: false,
        error: 'endpoint lastPing not found on organ node',
      };
    const lastPingValue = await getValueModelFromEntry(lastPing);
    const lastPingDate = new Date(lastPingValue.get()).toString();
    const parents = await SpinalGraphService.getParents(
      followedEntityNode.id.get(),
      'HasOrgan'
    );
    let platformName = "Couldn't find the platform name";
    let ipAddress = "Couldn't find the ip adress";
    for (const parent of parents) {
      if (parent.id.get() == followedEntityNode.platformId?.get()) {
        platformName = parent.name?.get();
        ipAddress = parent.ipAdress?.get();
      }
    }
    const card: IGChatCard = {
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
                content: followedEntityNode.organType?.get(),
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
                content: followedEntityNode.platformId?.get(),
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
    const resultInfo: IGChatOrganCardResult = {
      success: true,
      resultValue: result,
      error: '',
      spaceName: spaceName,
      resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_ORGAN_CARD,
      card: card,
    };
    return resultInfo;
  }
}

export { AnalyticService };
