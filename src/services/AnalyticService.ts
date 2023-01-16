
import { SpinalGraphService, SpinalNodeRef, SpinalNode, SpinalContext, SPINAL_RELATION_PTR_LST_TYPE } from "spinal-env-viewer-graph-service";
import * as CONSTANTS from "../constants";
import { Analytic } from "../models/Analytic";
import { IAnalytic } from "../interfaces/IAnalytic";
import { AnalysisProcess } from "../models/AnalysisProcess";
import { IAnalysisProcess } from "../interfaces/IAnalysisProcess";
import { EntityType } from "../models/EntityType";
import { IEntityType } from "../interfaces/IEntityType";
import { TrackedVariableMethod } from "../models/TrackedVariableMethod";
import { ITrackedVariableMethod } from "../interfaces/ITrackedVariableMethod";



export default class AnalyticService {
   // eslint-disable-next-line @typescript-eslint/no-empty-function
   constructor() { }

   /**
      * This method creates an analysis context. Since it does not have any particular additional info for now
      * it does not have a specific model.
      * @param  {string} contextName - The analysis's context Name
      * @returns Promise of the node's info (SpinalNodeRef)
      */
   public createContext(contextName: string): Promise<SpinalNodeRef> {
      return SpinalGraphService.addContext(contextName, CONSTANTS.CONTEXT_TYPE, undefined)
      .then((context) => {
         const contextId = context.getId().get();
         return SpinalGraphService.getInfo(contextId);
      })
   }


   /**
    * Retrieves and returns a single (if provided a context name) or all contexts
    * handled by this service (type analysisContext)
    * @returns Promise
    */
   public getContexts(contextName?: string): Array<SpinalNodeRef> | SpinalNodeRef | undefined {
      const contexts = SpinalGraphService.getContextWithType(CONSTANTS.CONTEXT_TYPE);
      const argContexts = contexts.map(el => SpinalGraphService.getInfo(el.id));
      if (typeof contextName === "undefined") return argContexts;
      return argContexts.find(context => context.name.get() === contextName)
   }

   ////////////////////////////////////////////////////
   /////////////////// ENTITY /////////////////////////
   ////////////////////////////////////////////////////

   public async addEntity(entityTypeInfo: IEntityType, contextId: string): Promise<SpinalNodeRef> {
      const entityModel = new EntityType(entityTypeInfo);
      const entityNodeId = SpinalGraphService.createNode(entityTypeInfo, entityModel);
      await SpinalGraphService.addChildInContext(contextId, entityNodeId, contextId, CONSTANTS.CONTEXT_TO_ENTITY_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      return SpinalGraphService.getInfo(entityNodeId);
  }

   public async findEntityByTargetType(context: SpinalContext<any>, targetType: string) : Promise<SpinalNode<any> | undefined> {
      const entities = await context.getChildren(CONSTANTS.CONTEXT_TO_ENTITY_RELATION);
      const result = entities.find(e => e.info.targetNodeType.get() == targetType);
      (<any>SpinalGraphService)._addNode(result);
      return result;
   } 

   public async getEntityFromProcess(analysisProcessId:string){
      const nodes = await SpinalGraphService.getParents(analysisProcessId, [CONSTANTS.ENTITY_TO_ANALYSIS_PROCESS_RELATION]);
      //
      if(nodes.length != 0){
          if(nodes[0].type.get() == CONSTANTS.ENTITY_TYPE) return nodes[1];
          else return nodes[0];
      }
      return undefined;
      
  }

   ////////////////////////////////////////////////////
   //////////////// ANALYSIS PROCESS //////////////////
   ////////////////////////////////////////////////////

   public async addAnalysisProcess(analysisProcessInfo: IAnalysisProcess, contextId: string, entityId: string): Promise<SpinalNodeRef> {
      const analysisProcessModel = new AnalysisProcess(analysisProcessInfo);
      const analysisProcessNodeId = SpinalGraphService.createNode(analysisProcessInfo, analysisProcessModel);
      await SpinalGraphService.addChildInContext(entityId, analysisProcessNodeId, contextId, CONSTANTS.ENTITY_TO_ANALYSIS_PROCESS_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      return SpinalGraphService.getInfo(analysisProcessNodeId);
   }

   public async getAllAnalysisProcesses(contextId: string) {
      const analysisProcesses = await SpinalGraphService.findInContext(contextId, contextId, (node: SpinalNode<any>) => {
          if (node.getType().get() === CONSTANTS.ANALYSIS_PROCESS_TYPE) {
              (<any>SpinalGraphService)._addNode(node);
              return true
          }
          return false;
      });
      return analysisProcesses;
  }

   ////////////////////////////////////////////////////
   /////////////////// ANALYTIC ///////////////////////
   ////////////////////////////////////////////////////
   public async addAnalytic(analyticInfo: IAnalytic, contextId: string, analysisProcessId: string): Promise<SpinalNodeRef> {
      const analyticModel = new Analytic(analyticInfo);
      const analyticNodeId = SpinalGraphService.createNode(analyticInfo, analyticModel);
      await SpinalGraphService.addChildInContext(analysisProcessId, analyticNodeId, contextId, CONSTANTS.ANALYSIS_PROCESS_TO_ANALYTIC_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      return SpinalGraphService.getInfo(analyticNodeId);
   }
   public async getAnalytic(analysisProcessId: string) : Promise<SpinalNode<any> | undefined> {
      const node = await SpinalGraphService.getChildren(analysisProcessId, [CONSTANTS.ANALYSIS_PROCESS_TO_ANALYTIC_RELATION]);
      if (node.length != 0) {
          const realNode = SpinalGraphService.getRealNode(node[0].id.get());
          (<any>SpinalGraphService)._addNode(realNode)
            return realNode;
      }
      return undefined;
  }

   


   ////////////////////////////////////////////////////
   //////////////// TRACKED VARIABLE //////////////////
   ////////////////////////////////////////////////////
   public async addTrackedVariableMethod(trackedVariableInfo: ITrackedVariableMethod, contextId: string, analyticId: string): Promise<SpinalNodeRef> {
      const trackedVariableModel = new TrackedVariableMethod(trackedVariableInfo);
      const trackedVariableNodeId = SpinalGraphService.createNode(trackedVariableInfo, trackedVariableModel);
      await SpinalGraphService.addChildInContext(analyticId, trackedVariableNodeId, contextId, CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      return SpinalGraphService.getInfo(trackedVariableNodeId);
   }

   public async getTrackedVariableMethods(analysisProcessId: string) : Promise<SpinalNodeRef[] | undefined>{
      const nodes = await SpinalGraphService.getChildren(analysisProcessId, [CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION]);
      if (nodes.length != 0) {
          return nodes;
      }
      return undefined;
   }

   public async getTrackedVariableMethod(analysisProcessId: string) : Promise<SpinalNodeRef | undefined>{
      const nodes = await SpinalGraphService.getChildren(analysisProcessId, [CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION]);
      if (nodes.length != 0) {
          return nodes[0];
      }
      return undefined;
   }

   ////////////////////////////////////////////////////
   //////////////// FOLLOWED ENTITY ///////////////////
   ////////////////////////////////////////////////////

   public async addLinkToFollowedEntity(contextId:string, analysisProcessId: string, followedEntityId:string) : Promise<SpinalNodeRef> {
      const link = await SpinalGraphService.addChildInContext(analysisProcessId, 
         followedEntityId, contextId, 
         CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_ENTITY_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      const id = link.getId().get();
      return SpinalGraphService.getInfo(id);
   }

   public async removeLinkToFollowedEntity(analysisProcessId: string, followedEntityId:string) : Promise<void> {
      await SpinalGraphService.removeChild(analysisProcessId, followedEntityId,
         CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_ENTITY_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
   }
   public async getFollowedEntity(analysisProcessId: string) {
      const node = await SpinalGraphService.getChildren(analysisProcessId, [CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_ENTITY_RELATION]);
      if (node.length != 0) {
          return node[0];
      }
      return undefined;
  }


   ///////////////////////////////////////////////////
   ///////////////////// GLOBAL //////////////////////
   ///////////////////////////////////////////////////
   public async getCompleteAnalysis(contextId: string, analysisProcessId: string) {
      const obj = {
          analysisProcessId: analysisProcessId,
          contextId: contextId,
          processName: "",
          intervalProcessing : "",
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
      const analysisProcessNode = SpinalGraphService.getRealNode(analysisProcessId);
      (<any>SpinalGraphService)._addNode(analysisProcessNode);

      const entity = await this.getFollowedEntity(analysisProcessId);
      if (entity != undefined) {
          obj.followedEntityId = entity.id.get();
          obj.followedEntityType = entity.type.get();
      }
      const analytic = await this.getAnalytic(analysisProcessId);
      if (analytic != undefined) {
         obj.analytic.id = analytic.info.id.get();
         obj.analytic.algorithmUsed = analytic.info.name.get();
         obj.analytic.resultName = analytic.info.resultName.get();
         obj.analytic.resultType = analytic.info.resultType.get();
      }
      const followedVariable = await this.getTrackedVariableMethod(analysisProcessId);
      if(followedVariable != undefined){
          obj.variableType = followedVariable.type.get();
          obj.variableName = followedVariable.name.get();
      }
      return obj;
  }

   public async getCompleteAnalysisList(contextId: string) {
      const analysisProcessList = await this.getAllAnalysisProcesses(contextId);
      const analysisList = [];
      for (const analysisProcess of analysisProcessList) {
          const analysis = await this.getCompleteAnalysis(contextId, analysisProcess.id.get());
          analysisList.push(analysis);
      }
      return analysisList;
   }


}

export { AnalyticService }