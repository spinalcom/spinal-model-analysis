/* eslint-disable @typescript-eslint/no-explicit-any */
import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import {
  SpinalGraphService,
  SpinalNodeRef,
} from 'spinal-env-viewer-graph-service';

import { attributeService } from 'spinal-env-viewer-plugin-documentation-service';
import { SpinalAttribute } from 'spinal-models-documentation';
import { SingletonServiceTimeseries } from './SingletonTimeSeries';
import * as CONSTANTS from '../constants';
import {
  SpinalDateValue,
  SpinalServiceTimeseries,
} from 'spinal-model-timeseries';

export default class AnalyticInputManagerService {
  private analyticNodeManagerService: AnalyticNodeManagerService;
  private spinalServiceTimeseries: SpinalServiceTimeseries;
  constructor(analyticNodeManagerService : AnalyticNodeManagerService) {
    this.analyticNodeManagerService = analyticNodeManagerService;
    this.spinalServiceTimeseries = SingletonServiceTimeseries.getInstance();
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
    authorizedRelations: string[],
    multipleModels = false
  ): Promise<SpinalNodeRef[] | SpinalNodeRef | SpinalAttribute | undefined> {
    if (followedEntity) {
      switch (trackMethod) {
        case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER: {
          if (multipleModels) {
            const endpoints = await this.findEndpoints(
              followedEntity.id.get(),
              filterValue,
              depth,
              strictDepth,
              authorizedRelations,
              CONSTANTS.ENDPOINT_RELATIONS,
              CONSTANTS.ENDPOINT_NODE_TYPE
            );
            return endpoints;
          }
          const endpoint = await this.findEndpoint(
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
          if (multipleModels) {
            const controlEndpoints = await this.findEndpoints(
              followedEntity.id.get(),
              filterValue,
              depth,
              strictDepth,
              authorizedRelations,
              CONSTANTS.CONTROL_ENDPOINT_RELATIONS,
              CONSTANTS.ENDPOINT_NODE_TYPE
            );
            return controlEndpoints;
          }
          const controlEndpoint = await this.findEndpoint(
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
          const foundAttribute = await this.findAttribute(
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
    const followedEntity =
      await this.analyticNodeManagerService.getFollowedEntity(analyticId);
    const trackingMethod =
      await this.analyticNodeManagerService.getTrackingMethod(analyticId);
    const config = await this.analyticNodeManagerService.getConfig(analyticId);
    const entityInfo =
      await this.analyticNodeManagerService.getEntityFromAnalytic(analyticId);

    if (!entityInfo || !followedEntity || !trackingMethod || !config) return;
    
    const entityType: string = entityInfo.entityType.get();
    const followedType: string = followedEntity.type.get();


    if (entityType == followedEntity.type.get()) {
      // we can continue as planned
      return [followedEntity];
    }

    // there is a mismatch between the followed entity type and the entity type of the analytic
    // we need to find the correct entities to work on, based on the followed entity type
    if (/group/i.test(followedType)) {
      console.log(
        'Anchor entity is a group, trying to find the correct entities with the relation name: ',
        CONSTANTS.GROUP_RELATION_PREFIX + entityType
      );
      return await SpinalGraphService.getChildren(followedEntity.id.get(), [
        CONSTANTS.GROUP_RELATION_PREFIX + entityType,
      ]);
    }
    if (/context/i.test(followedType)) {
      console.log(
        'Anchor entity is a context, trying to find the correct entities'
      );
      return await SpinalGraphService.findInContextByType(
        followedEntity.id.get(),
        followedEntity.id.get(),
        entityType
      );
    }

    // Handle known hardcoded parent-child type mappings
    const typeRelationMap: Record<string, { parent: string, relation: string }> = {
      geographicFloor: { parent: 'geographicBuilding', relation: 'hasGeographicFloor' },
      geographicRoom: { parent: 'geographicFloor', relation: 'hasGeographicRoom' },
      BIMObject: { parent: 'geographicRoom', relation: 'hasBimObject' }
    };

    for (const [childType, { parent, relation }] of Object.entries(typeRelationMap)) {
      if (entityType === childType && followedType === parent) {
        console.log(
          `Mapping from parent (${followedType}) to child (${entityType}) using relation: ${relation}`
        );
        return await SpinalGraphService.getChildren(followedEntity.id.get(), [relation]);
      }
    }

    console.log(
      'Failed to deduct the correct entities from the anchor entity'
    );
    return [];
  }
    
  public async getWorkingFollowedEntitiesWithParam(
    followedEntity: SpinalNodeRef,
    entityType: string
  ): Promise<SpinalNodeRef[]> {

    const followedType: string = followedEntity.type.get();
    if (entityType == followedType) {
      // we can continue as planned
      return [followedEntity];
    }
    if (/group/i.test(followedType)) {
      console.log(
        'Anchor entity is a group, trying to find the correct entities with the relation name: ',
        CONSTANTS.GROUP_RELATION_PREFIX + entityType
      );
      return await SpinalGraphService.getChildren(followedEntity.id.get(), [
        CONSTANTS.GROUP_RELATION_PREFIX + entityType,
      ]);
    }
    if (/context/i.test(followedType)) {
      console.log(
        'Anchor entity is a context, trying to find the correct entities'
      );
      return await SpinalGraphService.findInContextByType(
        followedEntity.id.get(),
        followedEntity.id.get(),
        entityType
      );
    }

    const typeRelationMap: Record<string, { parent: string, relation: string }> = {
      geographicFloor: { parent: 'geographicBuilding', relation: 'hasGeographicFloor' },
      geographicRoom: { parent: 'geographicFloor', relation: 'hasGeographicRoom' },
      BIMObject: { parent: 'geographicRoom', relation: 'hasBimObject' }
    };

    for (const [childType, { parent, relation }] of Object.entries(typeRelationMap)) {
      if (entityType === childType && followedType === parent) {
        console.log(
          `Mapping from parent (${followedType}) to child (${entityType}) using relation: ${relation}`
        );
        return await SpinalGraphService.getChildren(followedEntity.id.get(), [relation]);
      }
    }


    console.log('Failed to deduct the correct entities from the anchor entity');
    return [];
  }

  public async getEntryDataModelByInputIndex(
    analyticId: string,
    followedEntity: SpinalNodeRef,
    inputIndex: string,
    multipleModels = false
  ): Promise<SpinalNodeRef[] | SpinalNodeRef | SpinalAttribute | undefined> {
    const trackingMethod =
      await this.analyticNodeManagerService.getTrackingMethod(analyticId);
    if (!trackingMethod) return undefined;

    const inputParams =
      await this.analyticNodeManagerService.getAttributesFromNode(
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
      ),
      multipleModels
    );
  }
 
 

  private async getRelationsWithDepth(
    nodeId: string,
    depth: number
  ): Promise<string[]> {
    const relations = SpinalGraphService.getRelationNames(nodeId);
    if (depth <= 0) return relations;
    const children = await SpinalGraphService.getChildren(nodeId);
    for (const child of children) {
      const childRelations = await this.getRelationsWithDepth(
        child.id.get(),
        depth - 1
      );
      for (const childRelation of childRelations) {
        if (!relations.includes(childRelation)) relations.push(childRelation);
      }
    }
    return relations;
  }

  private async getChoiceRelationsWithDepth(
    nodeId: string,
    depth: number
  ): Promise<string[]> {
    const relations = await this.getRelationsWithDepth(nodeId, depth);
    const usefullRelations = relations.filter((relation) => {
      return (
        !CONSTANTS.ENDPOINT_RELATIONS.includes(relation) &&
        !CONSTANTS.CONTROL_ENDPOINT_RELATIONS.includes(relation)
      );
    });
    return usefullRelations;
  }

  public async getAvailableData(
    trackMethod: CONSTANTS.TRACK_METHOD,
    nodeId: string,
    filterValue: string,
    depth: number,
    stricDepth: boolean,
    authorizedRelations: string[]
  ): Promise<string[]> {
    switch (trackMethod) {
      case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER: {
        const data = await this.findEndpoints(
          nodeId,
          filterValue,
          depth,
          stricDepth,
          authorizedRelations,
          CONSTANTS.ENDPOINT_RELATIONS,
          CONSTANTS.ENDPOINT_NODE_TYPE
        );
        return data.map((endpoint) => endpoint.name.get());
      }
      case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER: {
        const data = await this.findEndpoints(
          nodeId,
          filterValue,
          depth,
          stricDepth,
          authorizedRelations,
          CONSTANTS.CONTROL_ENDPOINT_RELATIONS,
          CONSTANTS.ENDPOINT_NODE_TYPE
        );
        return data.map((endpoint) => endpoint.name.get());
      }
      case CONSTANTS.TRACK_METHOD.ATTRIBUTE_NAME_FILTER: {
        const [category, attribute] = filterValue.split(':');
        const data = await this.findAttributes(
          nodeId,
          category,
          attribute,
          depth,
          stricDepth,
          authorizedRelations
        );
        return data;
      }
      default: {
        console.log(
          'Get available data not implemented yet for this tracking method'
        );
        return [];
      }
    }
  }

  private async findNodes(
    nodeId: string,
    authorizedRelations: string[],
    nodeType: string
  ): Promise<SpinalNodeRef[]> {
    let res: SpinalNodeRef[] = [];
    const children = await SpinalGraphService.getChildren(
      nodeId,
      authorizedRelations
    );
    for (const child of children) {
      if (child.type.get() === nodeType) {
        res.push(child);
      } else {
        res = res.concat(
          await this.findNodes(child.id.get(), authorizedRelations, nodeType)
        );
      }
    }
    return res;
  }

  private async findSpecificNode(
    nodeId: string,
    filterNameValue: string,
    trackedRelations: string[],
    nodeType: string
  ): Promise<SpinalNodeRef | undefined> {
    const regex = new RegExp(filterNameValue); 
    const endpoints = await this.findNodes(nodeId, trackedRelations, nodeType);
  
    return endpoints.find(
      (endpoint) => regex.test(endpoint.name.get())
    );
  }

  private async findMatchingNodes(
    nodeId: string,
    filterNameValue: string,
    trackedRelations: string[],
    nodeType: string
  ): Promise<SpinalNodeRef[]> {
    const endpoints = await this.findNodes(nodeId, trackedRelations, nodeType);
    const regex = new RegExp(filterNameValue); 
    return endpoints.filter((endpoint) => 
      regex.test(endpoint.name.get())
    );
  }

  public async findEndpoint(
    nodeId: string,
    filterNameValue: string,
    depth: number,
    strictDepth: boolean,
    authorizedRelations: string[],
    trackedRelations: string[],
    nodeType: string
  ): Promise<SpinalNodeRef | undefined> {
    if (depth < 0) return undefined;

    // we dont look further
    if (depth == 0) {
      return await this.findSpecificNode(
        nodeId,
        filterNameValue,
        trackedRelations,
        nodeType
      );
    }

    // depth > 0

    if (!strictDepth) {
      const foundEndpoint = await this.findSpecificNode(
        nodeId,
        filterNameValue,
        trackedRelations,
        nodeType
      );
      if (foundEndpoint) return foundEndpoint;
    }

    const allRelations = SpinalGraphService.getRelationNames(nodeId);
    const checkedRelations = allRelations.filter((relation) =>
      authorizedRelations.includes(relation)
    );

    if (checkedRelations.length === 0) return undefined;

    const children = await SpinalGraphService.getChildren(
      nodeId,
      checkedRelations
    );
    for (const child of children) {
      const endpoint = await this.findEndpoint(
        child.id.get(),
        filterNameValue,
        depth - 1,
        strictDepth,
        authorizedRelations,
        trackedRelations,
        nodeType
      );
      if (endpoint) return endpoint;
    }
    return undefined;
  }

  public async findEndpoints(
    nodeId: string,
    filterNameValue: string,
    depth: number,
    strictDepth: boolean,
    authorizedRelations: string[],
    trackedRelations: string[],
    nodeType: string
  ): Promise<SpinalNodeRef[]> {
    if (depth == 0) {
      return await this.findMatchingNodes(
        nodeId,
        filterNameValue,
        trackedRelations,
        nodeType
      );
    }

    let results: SpinalNodeRef[] = [];

    if (!strictDepth) {
      results = results.concat(
        await this.findMatchingNodes(
          nodeId,
          filterNameValue,
          trackedRelations,
          nodeType
        )
      );
    }

    if (depth <= 0) return results;

    const allRelations = SpinalGraphService.getRelationNames(nodeId);
    const checkedRelations = allRelations.filter((relation) =>
      authorizedRelations.includes(relation)
    );

    if (checkedRelations.length === 0) return results;

    const children = await SpinalGraphService.getChildren(
      nodeId,
      checkedRelations
    );
    for (const child of children) {
      results = results.concat(
        await this.findEndpoints(
          child.id.get(),
          filterNameValue,
          depth - 1,
          strictDepth,
          authorizedRelations,
          trackedRelations,
          nodeType
        )
      );
    }

    return results;
  }

  public async findAttribute(
    nodeId: string,
    categoryName: string,
    attributeName: string,
    depth: number,
    strictDepth: boolean,
    authorizedRelations: string[]
  ): Promise<SpinalAttribute | -1> {
    if (depth < 0) return -1;

    const node = SpinalGraphService.getRealNode(nodeId);
    // we dont look further
    if (depth == 0) {
      return await attributeService.findOneAttributeInCategory(
        node,
        categoryName,
        attributeName
      );
    }

    // depth > 0
    if (!strictDepth) {
      const foundAttribute = await attributeService.findOneAttributeInCategory(
        node,
        categoryName,
        attributeName
      );
      if (foundAttribute != -1) return foundAttribute;
    }

    const allRelations = SpinalGraphService.getRelationNames(nodeId);
    const checkedRelations = allRelations.filter((relation) =>
      authorizedRelations.includes(relation)
    );

    if (checkedRelations.length === 0) return -1;

    const children = await SpinalGraphService.getChildren(
      nodeId,
      checkedRelations
    );
    for (const child of children) {
      const attribute = await this.findAttribute(
        child.id.get(),
        categoryName,
        attributeName,
        depth - 1,
        strictDepth,
        authorizedRelations
      );
      if (attribute != -1) return attribute;
    }
    return -1;
  }

  public async findAttributes(
    nodeId: string,
    categoryName: string,
    attributeName: string,
    depth: number,
    strictDepth: boolean,
    authorizedRelations: string[]
  ): Promise<string[]> {
    if (depth == 0) {
      return await this.findAllCategoriesAndAttributes(nodeId);
    }

    let results: string[] = [];

    if (!strictDepth) {
      results = results.concat(
        await this.findAllCategoriesAndAttributes(nodeId)
      );
    }

    if (depth <= 0) return results;

    const allRelations = SpinalGraphService.getRelationNames(nodeId);
    const checkedRelations = allRelations.filter((relation) =>
      authorizedRelations.includes(relation)
    );

    if (checkedRelations.length === 0) return results;

    const children = await SpinalGraphService.getChildren(
      nodeId,
      checkedRelations
    );
    for (const child of children) {
      results = results.concat(
        await this.findAttributes(
          child.id.get(),
          categoryName,
          attributeName,
          depth - 1,
          strictDepth,
          authorizedRelations
        )
      );
    }

    return results;
  }

  public async findAllCategoriesAndAttributes(
    followedEntityId: string
  ): Promise<string[]> {
    const node = SpinalGraphService.getRealNode(followedEntityId);
    const res: string[] = [];
    const categories = await attributeService.getCategory(node);
    for (const category of categories) {
      const attributes = await attributeService.getAttributesByCategory(
        node,
        category
      );
      for (const attribute of attributes) {
        const obj = attribute.get();
        res.push(`${category.nameCat}:${obj.label}`);
      }
    }
    return res;
  }

  public async getValueModelFromEntry(
    entryDataModel: SpinalNodeRef | SpinalAttribute
  ): Promise<spinal.Model> {
    if (!(entryDataModel instanceof SpinalAttribute)) {
      const element = await entryDataModel.element.load();
      return element.currentValue;
    }
    return entryDataModel.value;
  }

  public formatTrackingMethodsToList(obj): any[] {
    const result: any = [];
    const keys = Object.keys(obj);
    const length = (keys.length - 1) / 4;

    for (let i = 0; i < length; i++) {
      const item = {
        trackingMethod: obj[`trackingMethod${i}`],
        filterValue: obj[`filterValue${i}`],
        removeFromAnalysis: obj[`removeFromAnalysis${i}`],
        removeFromBinding: obj[`removeFromBinding${i}`],
      };
      result.push(item);
    }
    return result;
  }

  public filterAlgorithmParametersAttributesByIndex(
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

  public async getFormattedInputDataByIndex(
    analyticId: string,
    followedEntity: SpinalNodeRef,
    inputIndex: string,
    referenceEpochTime: number = Date.now()
  ): Promise<
    | boolean[]
    | string[]
    | number[]
    | SpinalDateValue[]
    | string
    | boolean
    | number
    | undefined
  > {
    const trackingMethod =
      await this.analyticNodeManagerService.getTrackingMethod(analyticId);
    if (!trackingMethod) return undefined;
    const trackingParams =
      await this.analyticNodeManagerService.getAttributesFromNode(
        trackingMethod.id.get(),
        inputIndex
      );

    const entryDataModel = await this.getEntryDataModelByInputIndex(
      analyticId,
      followedEntity,
      inputIndex,
      trackingParams[CONSTANTS.ATTRIBUTE_MULTIPLE_MODELS] || false
    );

    if (!entryDataModel) return undefined;
    if (
      !trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] ||
      trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] == 0
    ) {
      //test if entryDataModel is array ( spinalNodeRed[] )
      if (Array.isArray(entryDataModel)) {
        const res: any = [];
        for (const entry of entryDataModel) {
          const currentValue = await this.getValueModelFromEntry(entry);
          const assertedValue: string | number | boolean =
            currentValue.get() as string | number | boolean;

          res.push(assertedValue);
        }
        return res;
      }
      const currentValue = await this.getValueModelFromEntry(entryDataModel);
      const assertedValue: string | number | boolean = currentValue.get() as
        | string
        | number
        | boolean;
      return assertedValue;
    } else {
      if (Array.isArray(entryDataModel)) {
        throw new Error('Does not support multiple timeseries in 1 input');
      }
      const spinalTs = await this.spinalServiceTimeseries.getOrCreateTimeSeries(
        entryDataModel.id.get()
      );
      const end = referenceEpochTime;
      const start = end - trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES];
      const injectLastValueBeforeStart: boolean =
        trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES_VALUE_AT_START];
      let data = injectLastValueBeforeStart
        ? await spinalTs.getFromIntervalTime(start, end, true)
        : await spinalTs.getFromIntervalTime(start, end);
      if (injectLastValueBeforeStart) {
        data = this.timeseriesPreProcessing(start, end, data); // tidy up the data mainly at start and end
      }
      return data;
    }
  }

  public async getFormattedInputData(
    analyticId: string,
    followedEntity: SpinalNodeRef,
    inputIndex: string,
    executionTimes: number [] = [Date.now()]
  ): Promise<
    any
   >{
    const inputData = {};
    const trackingMethod =
      await this.analyticNodeManagerService.getTrackingMethod(analyticId);
    if (!trackingMethod) return undefined;
    const trackingParams =
      await this.analyticNodeManagerService.getAttributesFromNode(
        trackingMethod.id.get(),
        inputIndex
    );
    const entryDataModel = await this.getEntryDataModelByInputIndex(
      analyticId,
      followedEntity,
      inputIndex,
      trackingParams[CONSTANTS.ATTRIBUTE_MULTIPLE_MODELS] || false
    );
    if (!entryDataModel) return undefined;
    if( trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] <0) {
      throw new Error('Timeseries intervalTime cannot be negative');
    }
    if (!trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] ||
      trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES]== 0) {
      //add the current value for each executionTime
      if (Array.isArray(entryDataModel)) {
        const res: any = [];
        for (const entry of entryDataModel) {
          const currentValue = await this.getValueModelFromEntry(entry);
          const assertedValue: string | number | boolean =
            currentValue.get() as string | number | boolean;

          res.push(assertedValue);
        }
        for(const execTime of executionTimes){
          inputData[execTime] = res;
        }
      }
      else {
        const currentValue = await this.getValueModelFromEntry(entryDataModel);
        const assertedValue: string | number | boolean = currentValue.get() as
          | string
          | number
          | boolean;
          for(const execTime of executionTimes){
            inputData[execTime] = assertedValue;
          }
      }
    }

    else {
      if(Array.isArray(entryDataModel)) {
        throw new Error('Timeseries and multiple input capture is not compatible');
      }
      // add the timeseries data for each executionTime
      const oldestTime = Math.min(...executionTimes);
      const closestTime = Math.max(...executionTimes);
      
      const spinalTs = await this.spinalServiceTimeseries.getOrCreateTimeSeries(
        entryDataModel.id.get()
      );
      const end = closestTime;
      const start = oldestTime - trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES];
      const injectLastValueBeforeStart: boolean =
        trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES_VALUE_AT_START];
      const data =  await spinalTs.getFromIntervalTime(start, end, injectLastValueBeforeStart)
      
      for(const execTime of executionTimes) {
        const execTimeStart = execTime - trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES];
        const processedData =this.timeseriesPreProcessingData(execTimeStart, execTime, data,injectLastValueBeforeStart);
        inputData[execTime] = processedData;
      }
    }
    return inputData;
  }

  public async getAllDataFromAnalyticConfiguration(
    analyticId : string,
    entity: SpinalNodeRef,
    ioDependencies : any,
    executionTimes : number[]
  ): Promise<any>{
    const resultData = {};
    // Get all the inputs (I0, I1, I2, ...)
    const inputs : string [] = [];
    const keys = Object.keys(ioDependencies)
    for (const key of keys) {
      const myDependencies =
      ioDependencies[key]?.split(
        CONSTANTS.ATTRIBUTE_VALUE_SEPARATOR
      ) ?? [];
      for (const dep of myDependencies) {
        if(dep.startsWith('I') && !inputs.includes(dep)){
          inputs.push(dep);
        }
      }
    } // end for
    for( const input of inputs){
      const data = await this.getFormattedInputData(analyticId, entity, input, executionTimes);
      if(data){
        resultData[input] = data;
      }
    }
    return resultData;
  }


  private timeseriesPreProcessing(
    start: number,
    end: number,
    timeseries: SpinalDateValue[]
  ): SpinalDateValue[] {
    if (timeseries.length === 0) return [];
  
    //shifting the first timeseries to start if it is before start
    if (timeseries[0].date < start) {
      timeseries[0].date = start;
    }
  
    //copy last value to the end of the timeseries
    timeseries.push({
      date: end,
      value: timeseries[timeseries.length - 1].value,
    });
    return timeseries;
  }

  private timeseriesPreProcessingData(
    startTime: number,
    endTime: number,
    timeseries: SpinalDateValue[],
    injectLastValueBeforeStart: boolean
  ): SpinalDateValue[] {
    let hasInjectedValue = false;
    const resultTimeseries: SpinalDateValue[] = [];
    if (timeseries.length === 0) return [];
    for( const timeserie of timeseries){
      if(timeserie.date == startTime){
        hasInjectedValue = true;
        resultTimeseries.push(timeserie);
      }
      else if (timeserie.date > startTime && timeserie.date < endTime){
        resultTimeseries.push(timeserie);
      } 
    } // end for

    if(!hasInjectedValue && injectLastValueBeforeStart){
      for(let i = timeseries.length - 1; i >= 0; i--){
        if(timeseries[i].date < startTime){
          resultTimeseries.unshift({date : startTime, value : timeseries[i].value});
          break;
        }
      }
    }
    if(resultTimeseries.length!=0 && resultTimeseries[resultTimeseries.length - 1].date < endTime){
      resultTimeseries.push({date : endTime, value : resultTimeseries[resultTimeseries.length - 1].value});
    }
    return resultTimeseries;
  }

}
