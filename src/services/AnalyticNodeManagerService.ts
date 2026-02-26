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
import { SpinalAttribute } from 'spinal-models-documentation';

import { parseValue } from './utils';
import { VERSION } from '../version';

export default class AnalyticNodeManagerService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() { }

  // #region CONTEXT

  /**
   * Retrieves and returns all contexts
   * handled by this service (type analysisContext)
   * @return {*}  {SpinalNode<any>[]}
   * @memberof AnalyticService
   */
  public getContexts(): SpinalNode<any>[] {
    const contexts = SpinalGraphService.getContextWithType(
      CONSTANTS.CONTEXT_NODE_TYPE
    );
    return contexts;
  }

  /**
   * This method use the context name to find and return the info of that context. If the context does not exist, it returns undefined.
   * If multiple contexts have the same name, it returns the first one.
   * @param {string} contextName
   * @return {*}  {(SpinalNode<any> | undefined)}
   * @memberof AnalyticService
   */
  public getContext(contextName: string): SpinalNode<any> | undefined {
    const contexts = this.getContexts();
    if (!contexts) return undefined;
    return contexts.find((context) => context.name.get() === contextName);
  }

  /**
   * This method creates a new context and returns the info of the newly created context.
   * If the context already exists (same name), it just returns the info of that context instead of creating a new one.
   * @param {string} contextName
   * @return {*}  {Promise<SpinalNode<any>>}
   * @memberof AnalyticService
   */
  public async createContext(contextName: string): Promise<SpinalNode<any>> {
    const alreadyExists = this.getContext(contextName);
    if (alreadyExists) {
      console.error(`Context ${contextName} already exists`);
      return alreadyExists;
    }
    return SpinalGraphService.addContext(
      contextName,
      CONSTANTS.CONTEXT_NODE_TYPE,
      undefined
    ).then((context) => {
      const contextId = context.getId().get();
      attributeService.createOrUpdateAttrsAndCategories(context, "metadata",
        {
          version: VERSION
        }
      )
      return context;
    });
  }

  public getContextOfAnalytic(analyticNode: SpinalNode<any>): SpinalNode<any> {
    if (analyticNode.getType().get() !== CONSTANTS.ANALYSIS_NODE_TYPE) {
      throw new Error('Node is not an analysis node');
    }
    const contexts = this.getContexts()
    const contextId = analyticNode.getContextIds()[0];
    const context = contexts.find(c => c.getId().get() === contextId);
    if (!context) {
      throw new Error('Context not found for analytic node ( should not happen since analysisNode should always be in a context)');
    }
    return context;
  }

  // #endregion CONTEXT

  // #region ANALYSIS
  /**
   * Adds a new analysis node, also adds the mandatory workflow node as a child of the analysis node, and links the analysis node to the specified context.
   * @async
   * @param {IAnalytic} analysisNodeInfo - The information for the new analytic to add.
   * @param {string} contextId - The ID of the context in which to add the analytic.
   * @returns {Promise<SpinalNode<any>>} A Promise that resolves to the newly created analytic info.
   * @memberof AnalyticService
   */
  public async addAnalysisNode(
    analysisNodeName: string,
    analysisNodeDescription: string,
    contextNode: SpinalNode<any>,
  ): Promise<SpinalNode<any>> {

    const analysisNodeInfo = {
      name: analysisNodeName,
      description: analysisNodeDescription,
      type: CONSTANTS.ANALYSIS_NODE_TYPE,
    };

    const analysisNodeId = SpinalGraphService.createNode(
      analysisNodeInfo
    );
    const analysisNode = SpinalGraphService.getRealNode(analysisNodeId);
    if (!analysisNode) throw new Error('Failed to create analytic node');

    await contextNode.addChildInContext(analysisNode, CONSTANTS.CONTEXT_TO_ANALYSIS_NODE_RELATION, SPINAL_RELATION_PTR_LST_TYPE, contextNode);
    // Add workflow node
    await this.addWorkflowNode(analysisNode, contextNode);
    return analysisNode;
  }

  public async getWorkflowNode(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>> {
    const workflowNode = await analysisNode.getChild(
      ((child) => child.getName().get() === CONSTANTS.WORKFLOW_NODE_NAME),
      CONSTANTS.ANALYSIS_TO_WORKFLOW_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    )
    if (!workflowNode) throw new Error('Workflow node not found for analysis node ' + analysisNode.getName().get());
    return workflowNode;
  }

  public async addWorkflowNode(analysisNode: SpinalNode<any>, contextNode: SpinalNode<any>): Promise<SpinalNode<any>> {
    const workflowNodeId = SpinalGraphService.createNode({
      name: CONSTANTS.WORKFLOW_NODE_NAME
    });
    const workflowNode = SpinalGraphService.getRealNode(workflowNodeId);
    if (!workflowNode) throw new Error('Failed to create workflow node');

    await analysisNode.addChildInContext(workflowNode, CONSTANTS.ANALYSIS_TO_WORKFLOW_RELATION, SPINAL_RELATION_PTR_LST_TYPE, contextNode);
    return workflowNode;
  }


  /**
   * Retrieves all analytics within the specified context.
   * @async
   * @param {string} contextId - The ID of the context in which to retrieve analytics.
   * @returns {Promise<SpinalNodeRef[]>} A Promise that resolves to an array of SpinalNodeRefs for all analytics in the context.
   * @memberof AnalyticService
   */
  public async getAnalysisNodesByContextName(contextName: string): Promise<SpinalNode<any>[]> {
    const context = this.getContext(contextName);
    if (!context) throw new Error(`Context with name ${contextName} not found`);
    const analysisNodes = await context.getChildren(CONSTANTS.CONTEXT_TO_ANALYSIS_NODE_RELATION);
    return analysisNodes;
  }


  /**
   * Retrieves the SpinalNode for the specified analytic within the specified context.
   * @async
   * @param {string} contextName - The name of the context in which to search for the analytic.
   * @param {string} analyticName - The name of the analytic to retrieve.
   * @returns {Promise<SpinalNode<any> | undefined>} A Promise that resolves to the SpinalNode for the analytic, or undefined if the analytic cannot be found.
   * @memberof AnalyticService
   */
  public async getAnalysisNode(
    contextName: string,
    analyticName: string
  ): Promise<SpinalNode<any> | undefined> {

    const analysisNodes = await this.getAnalysisNodesByContextName(contextName);
    const analysisNode = analysisNodes.find(
      (node) => node.getName().get() === analyticName
    );
    if (!analysisNode) return undefined;
    return analysisNode;
  }

  public async deleteAnalysis(
    analysisNode: SpinalNode<any>,
    shouldDeleteChildren = false
  ): Promise<void> {
    const workflowNode = await this.getWorkflowNode(analysisNode);
    if (workflowNode) await this.safeDeleteNode(workflowNode, true);

    await this.safeDeleteNode(analysisNode);
  }

  // #endregion ANALYSIS


  // #region ANALYSIS DETAILS

  /*
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

    // Config node
    const analyticConfigAttributes = await this.getAllCategoriesAndAttributesFromNode(config.id.get());

    // Anchor node 
    const analyticAnchorNode = SpinalGraphService.getRealNode(followedEntity.id.get());


    const inputAttributes = await this.getAllCategoriesAndAttributesFromNode(trackingMethod.id.get());
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
    }
  }

  public async createAnalytic(analyticDetails: any, contextNode: SpinalNode<any>): Promise<any> {

    const entity = await this.getEntity(contextNode.getName().get(), analyticDetails.analyticOnEntityName);
    if (!entity) throw new Error(`Entity ${analyticDetails.analyticOnEntityName} not found in context ${contextNode.getName().get()}`);

    const analyticInfo: IAnalytic = {
      name: analyticDetails.name,
      description: ''
    };

    const anchorNode = SpinalGraphService.getRealNode(analyticDetails.anchor.id);
    SpinalGraphService._addNode(anchorNode);

    const analyticNodeRef = await this.addAnalytic(analyticInfo, contextNode.getId().get(), entity.id.get()); // also creates inputs/outputs nodes

    const configRef = await this.addConfig(analyticDetails.config, analyticNodeRef.id.get(), contextNode.getId().get());
    //const configNode = SpinalGraphService.getRealNode(configRef.id.get());
    //await this.addAttributesToNode(configNode, analyticDetails.config);
    const trackingMethodRef = await this.addInputTrackingMethod(analyticDetails.inputs, contextNode.getId().get(), analyticNodeRef.id.get());
    //const trackingMethodNode = SpinalGraphService.getRealNode(trackingMethodRef.id.get());
    //await this.addAttributesToNode(trackingMethodNode, analyticDetails.inputs);
    await this.addInputLinkToFollowedEntity(contextNode.getId().get(), analyticNodeRef.id.get(), anchorNode.getId().get());
    return this.getAnalyticDetails(analyticNodeRef.id.get());
    }
    */

  // #endregion ANALYSIS DETAILS

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

  public async addAttributesToNode(
    node: SpinalNode<any>,
    attributes: Record<string, Record<string, string>>
  ) {
    for (const categoryName of Object.keys(attributes)) {
      attributeService.createOrUpdateAttrsAndCategories(
        node,
        categoryName,
        {
          ...attributes[categoryName]
        }
      )
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

  public async getAllCategoriesAndAttributesFromNode(nodeId: string): Promise<IAnalyticConfig> {
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
    node: SpinalNode<any>,
    shouldDeleteChildren = false
  ): Promise<void> {
    const relations = node.getRelationNames();
    for (const relation of relations) {
      const children = await node.getChildren(relation);
      for (const child of children) {
        await this.removeChild(node, child, relation);
        if (shouldDeleteChildren) await child.removeFromGraph();
      }
    }
    await node.removeFromGraph();
  }
  // #endregion NODE GLOBAL
}
