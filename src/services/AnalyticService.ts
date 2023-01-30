
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
import { findEndpoints, findControlEndpoints , addTicketAlarm} from "./utils"
import * as algo from "../algorithms/algorithms";



export default class AnalyticService {
   // eslint-disable-next-line @typescript-eslint/no-empty-function
   constructor() { }

   /**
    * This method creates a new context and returns its info.
    * If the context already exists (same name), it returns its info instead of creating a new one.
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
      return SpinalGraphService.addContext(contextName, CONSTANTS.CONTEXT_TYPE, undefined)
      .then((context) => {
         const contextId = context.getId().get();
         return SpinalGraphService.getInfo(contextId);
      })
   }


   /**
    * Retrieves and returns all contexts
    * handled by this service (type analysisContext)
    * @return {*}  {(SpinalNodeRef[] | undefined)}
    * @memberof AnalyticService
    */
   public getContexts(): SpinalNodeRef[] | undefined {
      const contexts = SpinalGraphService.getContextWithType(CONSTANTS.CONTEXT_TYPE);
      const argContexts = contexts.map(el => SpinalGraphService.getInfo(el.info.id.get()));
      return argContexts;
   }

   /**
    * This method retrieves and returns the info of a context. If the context does not exist, it returns undefined.
    * @param {string} contextName
    * @return {*}  {(SpinalNodeRef | undefined)}
    * @memberof AnalyticService
    */
   public getContext(contextName: string) : SpinalNodeRef | undefined {
      const contexts = this.getContexts();
      if (!contexts) return undefined;
      return contexts.find(context => context.name.get() === contextName)
   }

   ////////////////////////////////////////////////////
   /////////////////// ENTITY /////////////////////////
   ////////////////////////////////////////////////////

   /**
    * This method creates a new entity type node and returns its info.
    *
    * @param {IEntityType} entityTypeInfo
    * @param {string} contextId
    * @return {*}  {Promise<SpinalNodeRef>}
    * @memberof AnalyticService
    */
   public async addEntity(entityTypeInfo: IEntityType, contextId: string): Promise<SpinalNodeRef> {
      entityTypeInfo.type = CONSTANTS.ENTITY_TYPE;
      const entityModel = new EntityType(entityTypeInfo);
      const entityNodeId = SpinalGraphService.createNode(entityTypeInfo, entityModel);
      await SpinalGraphService.addChildInContext(contextId, entityNodeId, contextId, CONSTANTS.CONTEXT_TO_ENTITY_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      return SpinalGraphService.getInfo(entityNodeId);
   }

  /**
   * This method find all entities in a context that have a certain type
   *
   * @param {SpinalContext<any>} context
   * @param {string} targetType
   * @return {*}  {(Promise<SpinalNode<any> | undefined>)}
   * @memberof AnalyticService
   */
   public async findEntityByTargetType(context: SpinalContext<any>, targetType: string) : Promise<SpinalNode<any> | undefined> {
      const entities = await context.getChildren(CONSTANTS.CONTEXT_TO_ENTITY_RELATION);
      const result = entities.find(e => e.info.targetNodeType.get() == targetType);
      (<any>SpinalGraphService)._addNode(result);
      return result;
   }

   /**
    * This method returns the info of an entity if provided with the context name and the entity name.
    *
    * @param {string} contextName
    * @param {string} entityName
    * @return {*}  {(Promise<SpinalNodeRef | undefined>)}
    * @memberof AnalyticService
    */
   public async getEntity(contextName: string, entityName: string): Promise<SpinalNodeRef | undefined> {
      const context = this.getContext(contextName);
      if (!context) return undefined;
      const contextNode = SpinalGraphService.getRealNode(context.id.get());
      const entities = await contextNode.getChildren(CONSTANTS.CONTEXT_TO_ENTITY_RELATION);
      const entitiesModels = entities.map(el => SpinalGraphService.getInfo(el.info.id.get()));
      return entitiesModels.find(entity => entity.name.get() === entityName);
   }

   /**
    * This method finds the entity that is the parent of the given analysis process.
    *
    * @param {string} analysisProcessId
    * @return {*} 
    * @memberof AnalyticService
    */
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

   /**
    * This method creates a new analysis process node and returns its info.
    *
    * @param {IAnalysisProcess} analysisProcessInfo
    * @param {string} contextId
    * @param {string} entityId
    * @return {*}  {Promise<SpinalNodeRef>}
    * @memberof AnalyticService
    */
   public async addAnalysisProcess(analysisProcessInfo: IAnalysisProcess, contextId: string, entityId: string): Promise<SpinalNodeRef> {
      analysisProcessInfo.type = CONSTANTS.ANALYSIS_PROCESS_TYPE;
      const analysisProcessModel = new AnalysisProcess(analysisProcessInfo);
      const analysisProcessNodeId = SpinalGraphService.createNode(analysisProcessInfo, analysisProcessModel);
      await SpinalGraphService.addChildInContext(entityId, analysisProcessNodeId, contextId, CONSTANTS.ENTITY_TO_ANALYSIS_PROCESS_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      return SpinalGraphService.getInfo(analysisProcessNodeId);
   }

   /**
    * This method retrieves and returns all analysis processes in a context.
    *
    * @param {string} contextId
    * @return {*} 
    * @memberof AnalyticService
    */
   public async getAllAnalysisProcesses(contextId: string) : Promise<SpinalNodeRef[]> {
      const analysisProcesses = await SpinalGraphService.findInContext(contextId, contextId, (node: SpinalNode<any>) => {
         if(node.getType().get() === CONSTANTS.ANALYSIS_PROCESS_TYPE) {               
            (<any>SpinalGraphService)._addNode(node);
            return true
         }
         return false;
      });
      return analysisProcesses;
  }

   public async getAnalysisProcess(contextId: string, analysisProcessId: string) : Promise<SpinalNodeRef | undefined> {
      const analysisProcesses = await SpinalGraphService.findInContext(contextId, contextId, (node: SpinalNode<any>) => {
      if (node.getType().get() === CONSTANTS.ANALYSIS_PROCESS_TYPE) {
          (<any>SpinalGraphService)._addNode(node);
          return true
      }
      return false;
   });
   return SpinalGraphService.getInfo(analysisProcessId);
  }


   public async getAnalysisProcessByName(contextId: string, analysisProcessName: string) : Promise<SpinalNodeRef | undefined> {
      const analysisProcesses = await SpinalGraphService.findInContext(contextId, contextId, (node: SpinalNode<any>) => {
      if (node.getType().get() === CONSTANTS.ANALYSIS_PROCESS_TYPE) {
          (<any>SpinalGraphService)._addNode(node);
          return true
      }
      return false;
      });
      const analysisProcess = analysisProcesses.find( (el: SpinalNode<any>) => el.info.name.get() == analysisProcessName);
      return SpinalGraphService.getInfo(analysisProcess.id.get());
   }

   ////////////////////////////////////////////////////
   /////////////////// ANALYTIC ///////////////////////
   ////////////////////////////////////////////////////

   /**
    * This method creates a new analytic node and returns its info.
    *
    * @param {IAnalytic} analyticInfo
    * @param {string} contextId
    * @param {string} analysisProcessId
    * @return {*}  {Promise<SpinalNodeRef>}
    * @memberof AnalyticService
    */
   public async addAnalytic(analyticInfo: IAnalytic, contextId: string, analysisProcessId: string): Promise<SpinalNodeRef> {
      analyticInfo.type = CONSTANTS.ANALYTIC_TYPE;
      const analyticModel = new Analytic(analyticInfo);
      const analyticNodeId = SpinalGraphService.createNode(analyticInfo, analyticModel);
      await SpinalGraphService.addChildInContext(analysisProcessId, analyticNodeId, contextId, CONSTANTS.ANALYSIS_PROCESS_TO_ANALYTIC_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      return SpinalGraphService.getInfo(analyticNodeId);
   }

   /**
    * This method retrieves and returns all analytics in a context.
    *
    * @param {string} analysisProcessId
    * @return {*}  {(Promise<SpinalNode<any> | undefined>)}
    * @memberof AnalyticService
    */
   public async getAnalytic(analysisProcessId: string) : Promise<SpinalNodeRef | undefined> {
      const node = await SpinalGraphService.getChildren(analysisProcessId, [CONSTANTS.ANALYSIS_PROCESS_TO_ANALYTIC_RELATION]);
      
      
      if (node.length != 0) {
         return node[0];
      }
      return undefined;
  }

   


   ////////////////////////////////////////////////////
   //////////////// TRACKED VARIABLE //////////////////
   ////////////////////////////////////////////////////

   /**
    * This method creates a new tracked variable node and returns its info.
    *
    * @param {ITrackedVariableMethod} trackedVariableInfo
    * @param {string} contextId
    * @param {string} analysisProcessId
    * @return {*}  {Promise<SpinalNodeRef>}
    * @memberof AnalyticService
    */
   public async addTrackedVariableMethod(trackedVariableInfo: ITrackedVariableMethod, contextId: string, analysisProcessId: string): Promise<SpinalNodeRef> {
      trackedVariableInfo.type = CONSTANTS.TRACKED_VARIABLE_METHOD_TYPE;
      const trackedVariableModel = new TrackedVariableMethod(trackedVariableInfo);
      const trackedVariableNodeId = SpinalGraphService.createNode(trackedVariableInfo, trackedVariableModel);
      await SpinalGraphService.addChildInContext(analysisProcessId, trackedVariableNodeId, contextId, CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      return SpinalGraphService.getInfo(trackedVariableNodeId);
   }

   /**
    * This method retrieves and returns all tracked variables children of an analysis process.
    *
    * @param {string} analysisProcessId
    * @return {*}  {(Promise<SpinalNodeRef[] | undefined>)}
    * @memberof AnalyticService
    */
   public async getTrackedVariableMethods(analysisProcessId: string) : Promise<SpinalNodeRef[] | undefined>{
      const nodes = await SpinalGraphService.getChildren(analysisProcessId, [CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION]);
      if (nodes.length != 0) {
          return nodes;
      }
      return undefined;
   }

   /**
    * This method retrieves and returns the tracked variable child (the first one) of an analysis process.
    *
    * @param {string} analysisProcessId
    * @return {*}  {(Promise<SpinalNodeRef | undefined>)}
    * @memberof AnalyticService
    */
   public async getTrackedVariableMethod(analysisProcessId: string) : Promise<SpinalNodeRef | undefined>{
      const nodes = await SpinalGraphService.getChildren(analysisProcessId, 
                                                         [CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION]);
      if (nodes.length != 0) {
          return nodes[0];
      }
      return undefined;
   }

   /**
    * This method removes a tracked variable child of an analysis process.
    *
    * @param {string} analysisProcessId
    * @param {string} trackedVariableId
    * @memberof AnalyticService
    */
   public async removeTrackedVariableMethod(analysisProcessId: string, trackedVariableId: string) {
      await SpinalGraphService.removeChild(analysisProcessId, trackedVariableId,
                                          CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION, 
                                          SPINAL_RELATION_PTR_LST_TYPE);
      await SpinalGraphService.removeFromGraph(trackedVariableId);
   }
   
   /**
    * This method applies a tracked variable method to an analysis process's followed entity to get the entry data.
    *
    * @param {string} analysisProcessId
    * @param {string} trackedVariableId
    * @memberof AnalyticService
    */
   public async applyTrackedVariableMethod(analysisProcessId: string) {
      const trackedVariableMethodModel = await this.getTrackedVariableMethod(analysisProcessId);
      const followedEntityModel = await this.getFollowedEntity(analysisProcessId);
      if (followedEntityModel && trackedVariableMethodModel) {
         const trackMethod = trackedVariableMethodModel.trackMethod.get();
         const filterValue = trackedVariableMethodModel.filterValue.get();
         switch (trackMethod) { 
            case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER:
               const endpoints = await findEndpoints(followedEntityModel.id.get(), filterValue)
               return endpoints;
            case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER:
               const controlEndpoints = await findControlEndpoints(followedEntityModel.id.get(), filterValue)
               return controlEndpoints;
            case CONSTANTS.TRACK_METHOD.TICKET_NAME_FILTER:
               console.log("Ticket filter");
               break;
            default:
               console.log("Track method not recognized");
         }
      }
   }


   ////////////////////////////////////////////////////
   //////////////// FOLLOWED ENTITY ///////////////////
   ////////////////////////////////////////////////////

   /**
    * This method creates a new link between an analysis process and a followed entity.
    *
    * @param {string} contextId
    * @param {string} analysisProcessId
    * @param {string} followedEntityId
    * @return {*}  {Promise<SpinalNodeRef>}
    * @memberof AnalyticService
    */
   public async addLinkToFollowedEntity(contextId:string, analysisProcessId: string, followedEntityId:string): Promise<SpinalNodeRef> {
      const link = await SpinalGraphService.addChildInContext(analysisProcessId, 
         followedEntityId, contextId, 
         CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_ENTITY_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      console.log(link);
      const id = link.info.id.get();
      return SpinalGraphService.getInfo(id);
   }

   /**
    * This method removes the link between an analysis process and a followed entity.
    *
    * @param {string} analysisProcessId
    * @param {string} followedEntityId
    * @return {*}  {Promise<void>}
    * @memberof AnalyticService
    */
   public async removeLinkToFollowedEntity(analysisProcessId: string, followedEntityId:string) : Promise<void> {
      await SpinalGraphService.removeChild(analysisProcessId, followedEntityId,
         CONSTANTS.ANALYSIS_PROCESS_TO_FOLLOWED_ENTITY_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
   }

   /**
    * This method retrieves and returns the followed entity child of an analysis process.
    *
    * @param {string} analysisProcessId
    * @return {*} 
    * @memberof AnalyticService
    */
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

   /**
    * This method aims at giving a full report of an analysis process.
    * 
    *
    * @param {string} contextId
    * @param {string} analysisProcessId
    * @return {*} 
    * @memberof AnalyticService
    */
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

  /**
   * Get the complete report for all analysis processes in a context.
   *
   * @param {string} contextId
   * @return {*} 
   * @memberof AnalyticService
   */
   public async getCompleteAnalysisList(contextId: string) {
      const analysisProcessList = await this.getAllAnalysisProcesses(contextId);
      const analysisList = [];
      for (const analysisProcess of analysisProcessList) {
          const analysis = await this.getCompleteAnalysis(contextId, analysisProcess.id.get());
          //analysisList.push(analysis);
      }
      return analysisList;
   }

   public async doAnalysis(analysisProcessId: string){
      //step 1 get all three infos : 1- analytic , 2- followed entity, 3- tracked variable
      //step 2 use the tracked variable method to get the data
      //step 3 use analytic to call the correct algorithme and produce the correct result

      
      const followedEntity = await this.getFollowedEntity(analysisProcessId);
      const trackedVariable = await this.getTrackedVariableMethod(analysisProcessId);
      const analytic = await this.getAnalytic(analysisProcessId);
      //step1 done 
      if(followedEntity && trackedVariable && analytic){
         const trackedVariableId = trackedVariable.id.get();
         const analyticId = analytic.id.get();
         const followedEntityId = followedEntity.id.get();
         const entryDataModels = await this.applyTrackedVariableMethod(analysisProcessId);
         //step2 done
         if(entryDataModels){
            const algorithm_name = analytic.name.get();
            const value = (await entryDataModels[0].element.load()).currentValue.get();
            //const value = entryDataModels[0].currentValue.get();
            const result = algo[algorithm_name](value,[15]); // tmp
            console.log("ANALYSIS RESULT : ",result);
            if (result){
               switch (analytic.resultType.get()) {
                  case CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET:
                  const analysisInfo = SpinalGraphService.getInfo(analysisProcessId)
                  const analysisName = analysisInfo.name.get();
                  let ticketInfos = {
                     name: analysisName + " : " + followedEntity.name.get()
                  }
                  const ticket = addTicketAlarm(ticketInfos,analysisInfo.id.get());
                  

                  break;
               
               }
               //step3 done
            }
         }
      }
   }
   

}

export { AnalyticService }