
import { SpinalGraphService, SpinalNodeRef, SpinalNode, SpinalContext, SPINAL_RELATION_PTR_LST_TYPE } from "spinal-env-viewer-graph-service";
import * as CONSTANTS from "../constants";
import { ConfigModel } from "../models/ConfigModel";
import { IConfig } from "../interfaces/IConfig";
import { AnalyticModel } from "../models/AnalyticModel";
import { IAnalytic } from "../interfaces/IAnalytic";
import { EntityModel } from "../models/EntityModel";
import { IEntity } from "../interfaces/IEntity";
import { TrackingMethodModel } from "../models/TrackingMethodModel";
import { ITrackingMethod } from "../interfaces/ITrackingMethod";
import { IInputs } from "../interfaces/IInputs";
import { InputsModel} from "../models/InputsModel";
import { IOutputs } from "../interfaces/IOutputs";
import { OutputsModel } from "../models/OutputsModel";
import AttributeService, { serviceDocumentation } from 'spinal-env-viewer-plugin-documentation-service';
import { attributeService } from 'spinal-env-viewer-plugin-documentation-service';


import { findEndpoints, findControlEndpoints , addTicketAlarm, getAlgorithmParameters} from "./utils"
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

   public async addEntity(entityInfo: IEntity, contextId: string): Promise<SpinalNodeRef> {
      entityInfo.type = CONSTANTS.ENTITY_TYPE;
      const entityModel = new EntityModel(entityInfo);
      const entityNodeId = SpinalGraphService.createNode(entityInfo, entityModel);
      await SpinalGraphService.addChildInContext(contextId, entityNodeId, contextId, CONSTANTS.CONTEXT_TO_ENTITY_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      return SpinalGraphService.getInfo(entityNodeId);
   }

   public async findEntityByTargetType(context: SpinalContext<any>, targetType: string) : Promise<SpinalNode<any> | undefined> {
      const entities = await context.getChildren(CONSTANTS.CONTEXT_TO_ENTITY_RELATION);
      const result = entities.find(e => e.info.targetNodeType.get() == targetType);
      (<any>SpinalGraphService)._addNode(result);
      return result;
   }

   public async getEntity(contextName: string, entityName: string): Promise<SpinalNodeRef | undefined> {
      const context = this.getContext(contextName);
      if (!context) return undefined;
      const contextNode = SpinalGraphService.getRealNode(context.id.get());
      const entities = await contextNode.getChildren(CONSTANTS.CONTEXT_TO_ENTITY_RELATION);
      const entitiesModels = entities.map(el => SpinalGraphService.getInfo(el.info.id.get()));
      return entitiesModels.find(entity => entity.name.get() === entityName);
   }

   public async getEntityFromAnalytic (analyticId :string){
      const nodes = await SpinalGraphService.getParents(analyticId, [CONSTANTS.ENTITY_TO_ANALYTIC_RELATION]);
      if(nodes.length != 0){
         return nodes[0];
      }
      return undefined;
      
   }

   ////////////////////////////////////////////////////
   //////////////// Analytic //////////////////////////
   ////////////////////////////////////////////////////

   public async addAnalytic(analyticInfo: IAnalytic, contextId: string, entityId: string): Promise<SpinalNodeRef> {
      analyticInfo.type = CONSTANTS.ANALYTIC_TYPE;
      const analyticModel = new AnalyticModel(analyticInfo);
      const analyticNodeId = SpinalGraphService.createNode(analyticInfo, analyticModel);
      await SpinalGraphService.addChildInContext(entityId, analyticNodeId, contextId, CONSTANTS.ENTITY_TO_ANALYTIC_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      
      await this.addInputsNode(analyticNodeId, contextId);
      await this.addOutputsNode(analyticNodeId, contextId);
      
      return SpinalGraphService.getInfo(analyticNodeId);
   }

   public async getAllAnalytics(contextId: string) : Promise<SpinalNodeRef[]> {
      const analytics = await SpinalGraphService.findInContext(contextId, contextId, (node: SpinalNode<any>) => {
         if(node.getType().get() === CONSTANTS.ANALYTIC_TYPE) {               
            (<any>SpinalGraphService)._addNode(node);
            return true
         }
         return false;
      });
      return analytics;
   }

   public async getAnalytic(contextId: string, analyticName: string) : Promise<SpinalNodeRef | undefined> {
      const analytics = await SpinalGraphService.findInContext(contextId, contextId, (node: SpinalNode<any>) => {
      if (node.getType().get() === CONSTANTS.ANALYTIC_TYPE) {
          (<any>SpinalGraphService)._addNode(node);
          return true
      }
      return false;
      });
      const analytic = analytics.find( (el: SpinalNode<any>) => el.info.name.get() == analyticName);
      return SpinalGraphService.getInfo(analytic.id.get());
   }
   
   private async addInputsNode(analyticId: string , contextId: string): Promise<SpinalNodeRef> {
      const inputsInfo: IInputs = {
         name: "Inputs",
         description: ""
      };
      const inputsModel = new InputsModel(inputsInfo);
      let inputsId = SpinalGraphService.createNode(inputsInfo, inputsModel);
      await SpinalGraphService.addChildInContext(analyticId, inputsId, contextId, CONSTANTS.ANALYTIC_TO_INPUTS_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      return SpinalGraphService.getInfo(inputsId);
   }

   private async addOutputsNode(analyticId: string , contextId: string): Promise<SpinalNodeRef> {
      const outputsInfo: IOutputs = {
         name: "Outputs",
         description: ""
      };
      const outputsModel = new OutputsModel(outputsInfo);
      let outputsId = SpinalGraphService.createNode(outputsInfo, outputsModel);
      await SpinalGraphService.addChildInContext(analyticId, outputsId, contextId, CONSTANTS.ANALYTIC_TO_OUTPUTS_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      return SpinalGraphService.getInfo(outputsId);
   }

   public async addConfig(configInfo : IConfig , configAttributes : any, analyticId: string , contextId: string): Promise<SpinalNodeRef> {
      configInfo.name = "Config";
      configInfo.type = CONSTANTS.CONFIG_TYPE;
      const configModel = new ConfigModel(configInfo);
      let configId = SpinalGraphService.createNode(configInfo, configModel);
      const configNode = await SpinalGraphService.addChildInContext(analyticId, configId, contextId, CONSTANTS.ANALYTIC_TO_CONFIG_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      for (let attribute of configAttributes) {
         await AttributeService.addAttributeByCategoryName(configNode, CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS,
         attribute.name, attribute.value, attribute.type, "");
      }
      return SpinalGraphService.getInfo(configId);
   }

   public async getConfig(analyticId: string): Promise<SpinalNodeRef | undefined> {
      const nodes = await SpinalGraphService.getChildren(analyticId, [CONSTANTS.ANALYTIC_TO_CONFIG_RELATION]);
      if (nodes.length === 0) return undefined;
      return SpinalGraphService.getInfo(nodes[0].id.get());
   }

   public async getInputsNode(analyticId: string): Promise<SpinalNodeRef | undefined> {
      const nodes = await SpinalGraphService.getChildren(analyticId, [CONSTANTS.ANALYTIC_TO_INPUTS_RELATION]);
      if (nodes.length === 0) return undefined;
      return SpinalGraphService.getInfo(nodes[0].id.get());
   }

   public async getOutputsNode(analyticId: string): Promise<SpinalNodeRef | undefined> {
      const nodes = await SpinalGraphService.getChildren(analyticId, [CONSTANTS.ANALYTIC_TO_OUTPUTS_RELATION]);
      if (nodes.length === 0) return undefined;
      return SpinalGraphService.getInfo(nodes[0].id.get());
   
   }




   ////////////////////////////////////////////////////
   //////////////// TRACKED VARIABLE //////////////////
   ////////////////////////////////////////////////////

   public async addTrackingMethod(trackingMethodInfo: ITrackingMethod, contextId: string, inputId: string): Promise<SpinalNodeRef> {
      trackingMethodInfo.type = CONSTANTS.TRACKING_METHOD_TYPE;
      const trackingMethodModel = new TrackingMethodModel(trackingMethodInfo);
      const trackingMethodNodeId = SpinalGraphService.createNode(trackingMethodInfo, trackingMethodModel);
      await SpinalGraphService.addChildInContext(inputId, trackingMethodNodeId, contextId, CONSTANTS.ANALYTIC_INPUTS_TO_TRACKING_METHOD_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      return SpinalGraphService.getInfo(trackingMethodNodeId);
   }

   public async addInputTrackingMethod(trackingMethodInfo: ITrackingMethod, contextId: string, analyticId: string): Promise<SpinalNodeRef> {
      const inputs = await this.getInputsNode(analyticId);
      if (inputs === undefined) throw Error("Inputs node not found");
      return this.addTrackingMethod(trackingMethodInfo, contextId, inputs.id.get());
   }

   public async getTrackingMethods(analyticId: string) : Promise<SpinalNodeRef[] | undefined>{
      const inputs = await this.getInputsNode(analyticId);
      if (inputs === undefined) return undefined;
      const nodes = await SpinalGraphService.getChildren(inputs.id.get(), 
                                                         [CONSTANTS.ANALYTIC_INPUTS_TO_TRACKING_METHOD_RELATION]);
      return nodes;
   }


   public async getTrackingMethod(analyticId: string) : Promise<SpinalNodeRef | undefined>{
      const trackingMethods = await this.getTrackingMethods(analyticId);
      if (trackingMethods === undefined) return undefined;
      return trackingMethods[0];
   }

   public async removeTrackingMethod(inputId: string, trackingMethodId: string) {
      await SpinalGraphService.removeChild(inputId, trackingMethodId,
                                          CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION, 
                                          SPINAL_RELATION_PTR_LST_TYPE);
      await SpinalGraphService.removeFromGraph(trackingMethodId);
   }

   public async removeInputTrackingMethod(analyticId: string, trackingMethodId: string) {
      const inputs = await this.getInputsNode(analyticId);
      if (inputs === undefined) throw Error("Inputs node not found");
      await this.removeTrackingMethod(inputs.id.get(), trackingMethodId);
   }
   

   public async applyTrackingMethodLegacy(analyticId: string) {
      const trackingMethodModel = await this.getTrackingMethod(analyticId);
      const followedEntityModel = await this.getFollowedEntity(analyticId);
      if (followedEntityModel && trackingMethodModel) {
         const trackMethod = trackingMethodModel.trackMethod.get();
         const filterValue = trackingMethodModel.filterValue.get();
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

   public async applyTrackingMethod(trackingMethod: SpinalNodeRef, followedEntity: SpinalNodeRef){
      if (followedEntity && trackingMethod) {
         const trackMethod = trackingMethod.trackMethod.get();
         const filterValue = trackingMethod.filterValue.get();
         switch (trackMethod) { 
            case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER:
               const endpoints = await findEndpoints(followedEntity.id.get(), filterValue)
               return endpoints;
            case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER:
               const controlEndpoints = await findControlEndpoints(followedEntity.id.get(), filterValue)
               return controlEndpoints;
            case CONSTANTS.TRACK_METHOD.TICKET_NAME_FILTER:
               console.log("Ticket filter");
               break;
            default:
               console.log("Track method not recognized");
         }
      }
   }

   public async applyTrackingMethodWithParams(trackMethod: string, filterValue: string, followedEntity: SpinalNodeRef){
      if (followedEntity) {
         switch (trackMethod) { 
            case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER:
               const endpoints = await findEndpoints(followedEntity.id.get(), filterValue)
               return endpoints;
            case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER:
               const controlEndpoints = await findControlEndpoints(followedEntity.id.get(), filterValue)
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

   public async addLinkToFollowedEntity(contextId:string, inputId: string, followedEntityId:string): Promise<SpinalNodeRef> {
      const link = await SpinalGraphService.addChildInContext(inputId, 
         followedEntityId, contextId, 
         CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
      const id = link.info.id.get();
      return SpinalGraphService.getInfo(id);
   }

   public async addInputLinkToFollowedEntity(contextId:string, analyticId: string, followedEntityId:string): Promise<SpinalNodeRef> {
      const inputs = await this.getInputsNode(analyticId);
      if (inputs === undefined) throw Error("Inputs node not found");
      return this.addLinkToFollowedEntity(contextId, inputs.id.get(), followedEntityId);
   }

   public async removeLinkToFollowedEntity(analysisProcessId: string, followedEntityId:string) : Promise<void> {
      await SpinalGraphService.removeChild(analysisProcessId, followedEntityId,
         CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
   }

   public async getFollowedEntity(analyticId: string) {
      const inputsNode = await this.getInputsNode(analyticId);
      if (inputsNode === undefined) return undefined;
      const nodes = await SpinalGraphService.getChildren(inputsNode.id.get(), 
                                                         [CONSTANTS.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION]);
      if (nodes === undefined) return undefined;
      return nodes[0];
   }


   ///////////////////////////////////////////////////
   ///////////////////// GLOBAL //////////////////////
   ///////////////////////////////////////////////////

   /*public async getCompleteAnalysis(contextId: string, analysisProcessId: string) {
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
          //analysisList.push(analysis);
      }
      return analysisList;
   }*/

   public async applyResult(result : any, analyticId:string, config:SpinalNodeRef,
                            followedEntity:SpinalNodeRef, trackingMethod:SpinalNodeRef) {
      switch (config.resultType.get()) {
         case CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET:
         const analyticInfo = SpinalGraphService.getInfo(analyticId)
         const analyticName = analyticInfo.name.get();
         let ticketInfos = {
            name: analyticName + " : " + followedEntity.name.get()
         }
         const ticket = addTicketAlarm(ticketInfos,analyticInfo.id.get());
         break;
         case CONSTANTS.ANALYTIC_RESULT_TYPE.MODIFY_CONTROL_ENDPOINT:
            const entries = await this.applyTrackingMethod(trackingMethod, followedEntity);
            if (!entries) return;
            for (const entry of entries) {
               const cp = await entry.element.load();
               cp.currentValue.set(result);
            }
            console.log("Modify control endpoint");
            break;
      
      }
   }

   public async getWorkingFollowedEntities(analyticId:string) {
      const followedEntity = await this.getFollowedEntity(analyticId);
      const trackingMethod = await this.getTrackingMethod(analyticId);
      const config = await this.getConfig(analyticId);
      const entityInfo = await this.getEntityFromAnalytic(analyticId);
      const entityType:string  = entityInfo.entityType.get();
      if(followedEntity && trackingMethod && config){
         if (entityType == followedEntity.type.get()){
            // we can continue as planned
            return [followedEntity];
         }
         else {
            const isGroup : boolean = followedEntity.type.get().includes("group");
            const relationNameToTargets = isGroup ?   CONSTANTS.GROUP_RELATION_PREFIX+entityType : 
                                                      "has"+entityType.charAt(0).toUpperCase()+entityType.slice(1);
            const entities = await SpinalGraphService.getChildren(followedEntity.id.get(),[relationNameToTargets]);
            return entities;
         }
         
      }
   }


   public async getEntryDataModelsFromFollowedEntity(analyticId:string, followedEntity:SpinalNodeRef){
      const trackingMethod = await this.getTrackingMethod(analyticId);
      if(trackingMethod) return this.applyTrackingMethod(trackingMethod,followedEntity);
   }


   private async getDataAndApplyAlgorithm(analyticId:string , followedEntity:SpinalNodeRef ){
      const trackingMethod = await this.getTrackingMethod(analyticId);
      const config = await this.getConfig(analyticId);
      if (!trackingMethod || !config) return;
      const entryDataModels = await this.applyTrackingMethod(trackingMethod,followedEntity);
      if(entryDataModels){
         const algorithm_name = config.algorithm.get();
         const value = (await entryDataModels[0].element.load()).currentValue.get();
         //const value = entryDataModels[0].currentValue.get();
         const params = await getAlgorithmParameters(config);
         const result = algo[algorithm_name](value,params); // tmp
         console.log("ANALYSIS RESULT : ",result);
         if (result){
            this.applyResult(result,analyticId,config,followedEntity,trackingMethod);
         }
      }
   }

   public async doAnalysis(analyticId: string, followedEntity: SpinalNodeRef){
      const entryDataModels = this.getEntryDataModelsFromFollowedEntity(analyticId,followedEntity);
      if(!entryDataModels) return;
      this.getDataAndApplyAlgorithm(analyticId,followedEntity);

   }

}

export { AnalyticService }