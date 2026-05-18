/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SpinalGraphService,
  SpinalNode,
  SpinalContext,
  SPINAL_RELATION_PTR_LST_TYPE,
  SPINAL_RELATION_LST_PTR_TYPE,
} from 'spinal-env-viewer-graph-service';

import {
  ANALYSIS_NODE_TYPE,
  ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION
} from '../constants/analysisNode';

import {
  ANALYSIS_CONTEXT_NODE_TYPE
} from '../constants/analysisContext';

import { ANALYSIS_NODE_TO_ANCHOR_RELATION, ANCHOR_NODE_NAME, ANCHOR_NODE_TO_LINKED_NODE_RELATION, ANCHOR_NODE_TYPE } from '../constants/analysisAnchor'
import { EXECUTION_WORKFLOW_NODE_NAME, EXECUTION_WORKFLOW_NODE_TYPE, ANALYSIS_NODE_TO_EXECUTION_WORKFLOW_RELATION } from '../constants/analysisExecutionWorkflow'
import { ANALYSIS_NODE_TO_INPUT_NODE_RELATION, INPUT_NODE_NAME, INPUT_NODE_TYPE } from '../constants/analysisInput'
import { ANALYSIS_NODE_TO_OUTPUT_NODE_RELATION, OUTPUT_NODE_NAME, OUTPUT_NODE_TYPE } from '../constants/analysisOutput'
import { ANALYSIS_NODE_TO_TRIGGER_NODE_RELATION, TRIGGER_NODE_NAME, TRIGGER_NODE_TYPE } from '../constants/analysisTrigger'
import { ANALYSIS_NODE_TO_WORKNODE_RESOLVER_RELATION, WORKNODE_RESOLVER_NODE_NAME, WORKNODE_RESOLVER_NODE_TYPE } from '../constants/analysisWorknodeResolver'

import AttributeService, {
  attributeService,
} from 'spinal-env-viewer-plugin-documentation-service';
import { SpinalAttribute } from 'spinal-models-documentation';

import { parseValue } from './utils';
import { VERSION } from '../version';
import WorkflowBlockManagerService from './WorkflowBlockManagerService';
import { WORK_NODE_RESERVED_ID, FOREACH_ELEMENT_RESERVED_ID } from './WorkflowExecutionService';
import { IAnalysisConfigJSON, IWorkflowConfigJSON, IBlockConfigJSON } from '../interfaces/IAnalysisConfigJSON';
import { IWorkflowBlock, ISubWorkflow } from '../interfaces/IWorkflowBlock';

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
      ANALYSIS_CONTEXT_NODE_TYPE
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
    return contexts.find((context) => context.getName().get() === contextName);
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
      ANALYSIS_CONTEXT_NODE_TYPE,
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
    if (analyticNode.getType().get() !== ANALYSIS_NODE_TYPE) {
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
   * Adds a new analysis node, also adds the mandatory children nodes of the analysis node, and links the analysis node to the specified context.
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
      type: ANALYSIS_NODE_TYPE,
    };

    const analysisNodeId = SpinalGraphService.createNode(
      analysisNodeInfo
    );
    const analysisNode = SpinalGraphService.getRealNode(analysisNodeId);
    if (!analysisNode) throw new Error('Failed to create analytic node');

    await contextNode.addChildInContext(analysisNode, ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION, SPINAL_RELATION_PTR_LST_TYPE, contextNode);


    // Add mandatory nodes
    await this.addWorkflowNodeToAnalysisNode(analysisNode, contextNode);
    await this.addInputNodeToAnalysisNode(analysisNode, contextNode);
    await this.addOutputNodeToAnalysisNode(analysisNode, contextNode);
    await this.addTriggerNodeToAnalysisNode(analysisNode, contextNode);
    await this.addWorknodeResolverNodeToAnalysisNode(analysisNode, contextNode);
    await this.addAnchorNodeToAnalysisNode(analysisNode, contextNode);
    return analysisNode;
  }

  public async getAnalysisNodesByContextName(contextName: string): Promise<SpinalNode<any>[]> {
    const context = this.getContext(contextName);
    if (!context) throw new Error(`Context with name ${contextName} not found`);
    const analysisNodes = await context.getChildren(ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION);
    return analysisNodes;
  }


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

  // #endregion ANALYSIS


  // #region ANALYSIS DETAILS

  /**
   * Extracts a complete JSON descriptor from an existing analysis node.
   * The returned object conforms to IAnalysisConfigJSON and can be fed
   * back into AnalysisFactoryService.createFromJSON() to recreate the analysis.
   *
   * @param analysisNode - The SpinalNode of type analysisNode
   * @returns A round-trippable IAnalysisConfigJSON
   */
  public async getAnalyticDetails(
    analysisNode: SpinalNode<any>
  ): Promise<IAnalysisConfigJSON> {
    const blockManager = new WorkflowBlockManagerService();
    const context = this.getContextOfAnalytic(analysisNode);

    // ── Anchor ──
    const anchorNode = await this.getAnalysisAnchorNodeNode(analysisNode);
    const anchorTargets = await anchorNode.getChildren(ANCHOR_NODE_TO_LINKED_NODE_RELATION);
    const anchorNodeId = anchorTargets.length > 0
      ? anchorTargets[0].getId().get()
      : undefined;

    // ── Workflows ──
    const resolverNode = await this.getAnalysisWorknodeResolverNode(analysisNode);
    const inputNode = await this.getAnalysisInputNode(analysisNode);
    const executionNode = await this.getAnalysisExecutionWorkflowNode(analysisNode);

    const resolverDAG = await blockManager.loadWorkflowDAG(resolverNode);
    const inputDAG = await blockManager.loadWorkflowDAG(inputNode);
    const executionDAG = await blockManager.loadWorkflowDAG(executionNode);

    // ── Build result ──
    const result: IAnalysisConfigJSON = {
      contextName: context.getName().get(),
      analysisName: analysisNode.getName().get(),
      description: analysisNode.info.description?.get() ?? '',
    };

    if (anchorNodeId) result.anchorNodeId = anchorNodeId;

    if (resolverDAG.blocks.length > 0)
      result.worknodeResolver = this.dagToWorkflowConfig(resolverDAG.blocks);
    if (inputDAG.blocks.length > 0)
      result.inputWorkflow = this.dagToWorkflowConfig(inputDAG.blocks);
    if (executionDAG.blocks.length > 0)
      result.executionWorkflow = this.dagToWorkflowConfig(executionDAG.blocks);

    return result;
  }

  // #endregion ANALYSIS DETAILS

  // #region DAG → JSON CONVERSION

  /**
   * Converts an array of in-memory workflow blocks back to a JSON workflow config.
   */
  private dagToWorkflowConfig(blocks: IWorkflowBlock[]): IWorkflowConfigJSON {
    const idToRef = this.buildIdToRefMap(blocks);
    return {
      blocks: blocks.map((b) => this.blockToConfig(b, idToRef)),
    };
  }

  /**
   * Converts a sub-workflow (FOREACH / IF branch) back to its JSON config shape.
   * @param parentIdToRef - id→ref map of the parent workflow, used to resolve parent refs in IF branches
   */
  private subWorkflowToConfig(
    sub: ISubWorkflow,
    parentIdToRef: Map<string, string>
  ): { blocks: IBlockConfigJSON[]; outputRef: string } {
    const subIdToRef = this.buildIdToRefMap(sub.blocks);

    // Merge parent refs so IF sub-block inputs referencing parent blocks resolve correctly
    const mergedIdToRef = new Map<string, string>([...parentIdToRef, ...subIdToRef]);

    return {
      blocks: sub.blocks.map((b) => this.blockToConfig(b, mergedIdToRef, parentIdToRef)),
      outputRef: subIdToRef.get(sub.outputBlockId) ?? sub.outputBlockId,
    };
  }

  /**
   * Converts a single IWorkflowBlock to an IBlockConfigJSON.
   */
  private blockToConfig(
    block: IWorkflowBlock,
    idToRef: Map<string, string>,
    parentIdToRef?: Map<string, string>
  ): IBlockConfigJSON {
    const config: IBlockConfigJSON = {
      ref: idToRef.get(block.id) ?? block.name,
      algorithmName: block.algorithmName,
    };

    if (Object.keys(block.parameters).length > 0) {
      config.parameters = block.parameters;
    }

    if (block.inputBlockIds.length > 0) {
      config.inputs = block.inputBlockIds.map((id) => {
        if (id === WORK_NODE_RESERVED_ID) return '$node';
        if (id === FOREACH_ELEMENT_RESERVED_ID) return '$item';
        return idToRef.get(id) ?? parentIdToRef?.get(id) ?? id;
      });
    }

    if (block.registerAs) {
      config.registerAs = block.registerAs;
    }

    if (block.subWorkflow) {
      config.subWorkflow = this.subWorkflowToConfig(block.subWorkflow, idToRef);
    }
    if (block.thenWorkflow) {
      config.thenWorkflow = this.subWorkflowToConfig(block.thenWorkflow, idToRef);
    }
    if (block.elseWorkflow) {
      config.elseWorkflow = this.subWorkflowToConfig(block.elseWorkflow, idToRef);
    }

    return config;
  }

  /**
   * Builds a map of block ID → ref name from an array of blocks.
   * Uses block.name as the ref (which was set from the original ref during creation).
   * Disambiguates duplicate names by appending a suffix.
   */
  private buildIdToRefMap(blocks: IWorkflowBlock[]): Map<string, string> {
    const idToRef = new Map<string, string>();
    const usedRefs = new Set<string>();

    for (const block of blocks) {
      let ref = block.name;
      if (usedRefs.has(ref)) {
        let suffix = 2;
        while (usedRefs.has(`${block.name}_${suffix}`)) suffix++;
        ref = `${block.name}_${suffix}`;
      }
      usedRefs.add(ref);
      idToRef.set(block.id, ref);
    }

    return idToRef;
  }

  // #endregion DAG → JSON CONVERSION



  // #region ANCHOR


  public async linkNodeToAnchorNode(
    anchorNode: SpinalNode<any>,
    nodeToLink: SpinalNode<any>,
    contextNode: SpinalNode<any>
  ): Promise<void> {
    await anchorNode.addChildInContext(
      nodeToLink,
      ANALYSIS_NODE_TO_ANCHOR_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE,
      contextNode
    );
  }

  public async removeLinkToAnchorNode(
    anchorNode: SpinalNode<any>,
    anchoredNode: SpinalNode<any>
  ): Promise<void> {
    anchorNode.removeChild(
      anchoredNode,
      ANCHOR_NODE_TO_LINKED_NODE_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    );
  }


  // #endregion ANCHOR


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

  public async deleteAnalysisContext(contextNode: SpinalNode<any>): Promise<void> {
    const analysisNodes = await contextNode.getChildren(ANALYSIS_CONTEXT_TO_ANALYSIS_NODE_RELATION);
    for (const analysisNode of analysisNodes) {
      await this.deleteAnalysisNode(analysisNode);
    }
    await contextNode.removeFromGraph();
  }

  public async deleteAnalysisNode(analysisNode: SpinalNode<any>): Promise<void> {
    const anchorNode = await this.getAnalysisAnchorNodeNode(analysisNode);
    const relations = anchorNode.getRelationNames();
    if (relations.includes(ANCHOR_NODE_TO_LINKED_NODE_RELATION)) {
      await anchorNode.removeRelation(ANCHOR_NODE_TO_LINKED_NODE_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
    }
    await analysisNode.removeFromGraph();
  }

  // #endregion NODE GLOBAL



  // #region ADD ANALYSIS SUBNODES
  public async addWorkflowNodeToAnalysisNode(analysisNode: SpinalNode<any>, contextNode: SpinalNode<any>): Promise<SpinalNode<any>> {
    const workflowNodeId = SpinalGraphService.createNode({
      name: EXECUTION_WORKFLOW_NODE_NAME,
      type: EXECUTION_WORKFLOW_NODE_TYPE
    });
    const workflowNode = SpinalGraphService.getRealNode(workflowNodeId);
    if (!workflowNode) throw new Error('Failed to create workflow node');

    await analysisNode.addChildInContext(workflowNode, ANALYSIS_NODE_TO_EXECUTION_WORKFLOW_RELATION, SPINAL_RELATION_PTR_LST_TYPE, contextNode);
    return workflowNode;
  }

  private async addInputNodeToAnalysisNode(analysisNode: SpinalNode<any>, contextNode: SpinalNode<any>): Promise<SpinalNode<any>> {
    const inputNodeId = SpinalGraphService.createNode({
      name: INPUT_NODE_NAME,
      type: INPUT_NODE_TYPE
    });
    const inputNode = SpinalGraphService.getRealNode(inputNodeId);
    if (!inputNode) throw new Error('Failed to create inputs node');

    await analysisNode.addChildInContext(inputNode, ANALYSIS_NODE_TO_INPUT_NODE_RELATION, SPINAL_RELATION_PTR_LST_TYPE, contextNode);
    return inputNode;
  }


  private async addOutputNodeToAnalysisNode(analysisNode: SpinalNode<any>, contextNode: SpinalNode<any>): Promise<SpinalNode<any>> {
    const outputNodeId = SpinalGraphService.createNode({
      name: OUTPUT_NODE_NAME,
      type: OUTPUT_NODE_TYPE
    });
    const outputNode = SpinalGraphService.getRealNode(outputNodeId);
    if (!outputNode) throw new Error('Failed to create output node');

    await analysisNode.addChildInContext(outputNode, ANALYSIS_NODE_TO_OUTPUT_NODE_RELATION, SPINAL_RELATION_PTR_LST_TYPE, contextNode);
    return outputNode;
  }

  private async addTriggerNodeToAnalysisNode(analysisNode: SpinalNode<any>, contextNode: SpinalNode<any>): Promise<SpinalNode<any>> {
    const triggerNodeId = SpinalGraphService.createNode({
      name: TRIGGER_NODE_NAME,
      type: TRIGGER_NODE_TYPE
    });
    const triggerNode = SpinalGraphService.getRealNode(triggerNodeId);
    if (!triggerNode) throw new Error('Failed to create trigger node');

    await analysisNode.addChildInContext(triggerNode, ANALYSIS_NODE_TO_TRIGGER_NODE_RELATION, SPINAL_RELATION_PTR_LST_TYPE, contextNode);
    return triggerNode;
  }

  private async addWorknodeResolverNodeToAnalysisNode(analysisNode: SpinalNode<any>, contextNode: SpinalNode<any>): Promise<SpinalNode<any>> {
    const worknodeResolverNodeId = SpinalGraphService.createNode({
      name: WORKNODE_RESOLVER_NODE_NAME,
      type: WORKNODE_RESOLVER_NODE_TYPE
    });
    const worknodeResolverNode = SpinalGraphService.getRealNode(worknodeResolverNodeId);
    if (!worknodeResolverNode) throw new Error('Failed to create worknode resolver node');

    await analysisNode.addChildInContext(worknodeResolverNode, ANALYSIS_NODE_TO_WORKNODE_RESOLVER_RELATION, SPINAL_RELATION_PTR_LST_TYPE, contextNode);
    return worknodeResolverNode;
  }

  public async addAnchorNodeToAnalysisNode(
    analysisNode: SpinalNode<any>,
    contextNode: SpinalNode<any>
  ): Promise<SpinalNode<any>> {
    const anchorNodeId = SpinalGraphService.createNode({
      name: ANCHOR_NODE_NAME,
      type: ANCHOR_NODE_TYPE
    });
    const anchorNode = SpinalGraphService.getRealNode(anchorNodeId);
    if (!anchorNode) throw new Error('Failed to create anchor node');
    await analysisNode.addChildInContext(anchorNode, ANALYSIS_NODE_TO_ANCHOR_RELATION, SPINAL_RELATION_PTR_LST_TYPE, contextNode);
    return anchorNode;
  }
  // #endregion ADD ANALYSIS SUBNODES


  // #region GET ANALYSIS SUBNODES

  public async getAnalysisExecutionWorkflowNode(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>> {
    const workflowNode = await analysisNode.getChild(
      ((child) => child.getName().get() === EXECUTION_WORKFLOW_NODE_NAME),
      ANALYSIS_NODE_TO_EXECUTION_WORKFLOW_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    )
    if (!workflowNode) throw new Error('Workflow node not found for analysis node ' + analysisNode.getName().get());
    return workflowNode;
  }

  public async getAnalysisInputNode(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>> {
    const inputNode = await analysisNode.getChild(
      ((child) => child.getName().get() === INPUT_NODE_NAME),
      ANALYSIS_NODE_TO_INPUT_NODE_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    )
    if (!inputNode) throw new Error('Input node not found for analysis node ' + analysisNode.getName().get());
    return inputNode;
  }

  public async getAnalysisOutputNode(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>> {
    const outputNode = await analysisNode.getChild(
      ((child) => child.getName().get() === OUTPUT_NODE_NAME),
      ANALYSIS_NODE_TO_OUTPUT_NODE_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    )
    if (!outputNode) throw new Error('Output node not found for analysis node ' + analysisNode.getName().get());
    return outputNode;
  }

  public async getAnalysisTriggerNode(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>> {
    const triggerNode = await analysisNode.getChild(
      ((child) => child.getName().get() === TRIGGER_NODE_NAME),
      ANALYSIS_NODE_TO_TRIGGER_NODE_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    )
    if (!triggerNode) throw new Error('Trigger node not found for analysis node ' + analysisNode.getName().get());
    return triggerNode;
  }

  public async getAnalysisWorknodeResolverNode(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>> {
    const worknodeResolverNode = await analysisNode.getChild(
      ((child) => child.getName().get() === WORKNODE_RESOLVER_NODE_NAME),
      ANALYSIS_NODE_TO_WORKNODE_RESOLVER_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    )
    if (!worknodeResolverNode) throw new Error('Worknode resolver node not found for analysis node ' + analysisNode.getName().get());
    return worknodeResolverNode;
  }

  public async getAnalysisAnchorNodeNode(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>> {
    const anchorNode = await analysisNode.getChild(
      ((child) => child.getName().get() === ANCHOR_NODE_NAME),
      ANALYSIS_NODE_TO_ANCHOR_RELATION,
      SPINAL_RELATION_PTR_LST_TYPE
    )
    if (!anchorNode) throw new Error('Anchor node not found for analysis node ' + analysisNode.getName().get());
    return anchorNode;
  }

  // #endregion GET ANALYSIS SUBNODES



  // #region PRIVATE


  // #endregion PRIVATE


  public async reverseChildrenOrder(node: SpinalNode<any>, relationName: string): Promise<void> {
    const myRelation = node.children.PtrLst[relationName].children;
    const ids = myRelation.info.ids;
    [ids[0], ids[1]] = [ids[1], ids[0]];
    const myPtr = await myRelation.ptr.load();
    [myPtr[0], myPtr[1]] = [myPtr[1], myPtr[0]];

    ids._signal_change();
    myPtr._signal_change();
  }

}
