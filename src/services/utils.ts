/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Copyright 2022 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */

import {
  SpinalGraphService,
  SpinalNodeRef,
  SPINAL_RELATION_PTR_LST_TYPE,
  SPINAL_RELATION_LST_PTR_TYPE,
  SpinalNode,
} from 'spinal-env-viewer-graph-service';
import { attributeService } from 'spinal-env-viewer-plugin-documentation-service';
import {
  serviceTicketPersonalized,
  spinalServiceTicket,
  ALARM_RELATION_NAME,
  TICKET_RELATION_TYPE,
  TICKET_RELATION_NAME,
} from 'spinal-service-ticket';
import {
  InputDataEndpointDataType,
  InputDataEndpointType,
  SpinalBmsEndpoint,
} from 'spinal-model-bmsnetwork';
import { InputDataEndpoint } from '../models/InputData/InputDataModel/InputDataEndpoint';
import * as CONSTANTS from '../constants';
import { SpinalAttribute } from 'spinal-models-documentation';
import { SingletonServiceTimeseries } from './SingletonTimeSeries';
import * as cronParser from 'cron-parser';
import { SpinalDateValue } from 'spinal-model-timeseries';


const serviceTimeseries = SingletonServiceTimeseries.getInstance();

/**
 * Uses the documentation service to get the attributes related to the algorithm parameters
 *
 * @export
 * @param {SpinalNodeRef} config
 * @return {*}
 */
export async function getAlgorithmParameters(
  config: SpinalNodeRef
): Promise<any> {
  const configNode = SpinalGraphService.getRealNode(config.id.get());
  const res = {};
  const algorithmParameters = await attributeService.getAttributesByCategory(
    configNode,
    CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS
  );
  for (const param of algorithmParameters) {
    const obj = param.get();
    res[obj.label] = obj.value;
  }
  return res;
}

/**
 * Uses the documentation service to get the attributes related to the ticket localization
 * (context and process) parameters
 *
 * @export
 * @param {SpinalNodeRef} config
 * @return {*}
 */
export async function getTicketLocalizationParameters(
  config: SpinalNodeRef
): Promise<any> {
  const configNode = SpinalGraphService.getRealNode(config.id.get());
  const res = {};
  const localizationParameters = await attributeService.getAttributesByCategory(
    configNode,
    CONSTANTS.CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS
  );
  for (const param of localizationParameters) {
    const obj = param.get();
    res[obj.label] = obj.value;
  }
  return res;
}

export async function getRelationsWithDepth(
  nodeId: string,
  depth: number
): Promise<string[]> {
  const relations = SpinalGraphService.getRelationNames(nodeId);
  if (depth <= 0) return relations;
  const children = await SpinalGraphService.getChildren(nodeId);
  for (const child of children) {
    const childRelations = await getRelationsWithDepth(
      child.id.get(),
      depth - 1
    );
    for (const childRelation of childRelations) {
      if (!relations.includes(childRelation)) relations.push(childRelation);
    }
  }
  return relations;
}

export async function getChoiceRelationsWithDepth(
  nodeId: string,
  depth: number
): Promise<string[]> {
  const relations = await getRelationsWithDepth(nodeId, depth);
  const usefullRelations = relations.filter((relation) => {
    return (
      !CONSTANTS.ENDPOINT_RELATIONS.includes(relation) &&
      !CONSTANTS.CONTROL_ENDPOINT_RELATIONS.includes(relation)
    );
  });
  return usefullRelations;
}

export async function getAvailableData(
  trackMethod: CONSTANTS.TRACK_METHOD,
  nodeId: string,
  filterValue: string,
  depth: number,
  stricDepth: boolean,
  authorizedRelations: string[]
): Promise<string[]> {
  switch (trackMethod) {
    case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER: {
      const data = await findEndpoints(
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
      const data = await findEndpoints(
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
      const data = await findAttributes(
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

export async function findNodes(
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
        await findNodes(child.id.get(), authorizedRelations, nodeType)
      );
    }
  }
  return res;
}

async function findSpecificNode(
  nodeId: string,
  filterNameValue: string,
  trackedRelations: string[],
  nodeType: string
): Promise<SpinalNodeRef | undefined> {
  const endpoints = await findNodes(nodeId, trackedRelations, nodeType);
  return endpoints.find((endpoint) => endpoint.name.get() === filterNameValue);
}

async function findMatchingNodes(
  nodeId: string,
  filterNameValue: string,
  trackedRelations: string[],
  nodeType: string
): Promise<SpinalNodeRef[]> {
  const endpoints = await findNodes(nodeId, trackedRelations, nodeType);
  return endpoints.filter((endpoint) =>
    endpoint.name.get().includes(filterNameValue)
  );
}

export async function findEndpoint(
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
    return await findSpecificNode(
      nodeId,
      filterNameValue,
      trackedRelations,
      nodeType
    );
  }

  // depth > 0

  if (!strictDepth) {
    const foundEndpoint = await findSpecificNode(
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
    const endpoint = await findEndpoint(
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

export async function findEndpoints(
  nodeId: string,
  filterNameValue: string,
  depth: number,
  strictDepth: boolean,
  authorizedRelations: string[],
  trackedRelations: string[],
  nodeType: string
): Promise<SpinalNodeRef[]> {
  if (depth == 0) {
    return await findMatchingNodes(
      nodeId,
      filterNameValue,
      trackedRelations,
      nodeType
    );
  }

  let results: SpinalNodeRef[] = [];

  if (!strictDepth) {
    results = results.concat(
      await findMatchingNodes(
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
      await findEndpoints(
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

export async function findAttribute(
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
    const attribute = await findAttribute(
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

export async function findAttributes(
  nodeId: string,
  categoryName: string,
  attributeName: string,
  depth: number,
  strictDepth: boolean,
  authorizedRelations: string[]
): Promise<string[]> {
  if (depth == 0) {
    return await findAllCategoriesAndAttributes(nodeId);
  }

  let results: string[] = [];

  if (!strictDepth) {
    results = results.concat(await findAllCategoriesAndAttributes(nodeId));
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
      await findAttributes(
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

export async function findAllCategoriesAndAttributes(
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

export async function getValueModelFromEntry(
  entryDataModel: SpinalNodeRef | SpinalAttribute
): Promise<spinal.Model> {
  if (!(entryDataModel instanceof SpinalAttribute)) {
    const element = await entryDataModel.element.load();
    return element.currentValue;
  }
  return entryDataModel.value;
}

export function formatTrackingMethodsToList(obj): any[] {
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
// ticket creation

/**
 * Gets the ticket context that has the corresponding contextId
 *
 * @param {string} contextId
 * @return {*}
 */
function getTicketContext(contextId: string) {
  const contexts = SpinalGraphService.getContextWithType(
    'SpinalSystemServiceTicket'
  );
  const context = contexts.find((ctx) => {
    return ctx.info.id.get() == contextId;
  });
  return context;
}

/**
 * Gets the ticket process that has the corresponding processId in the context that has the corresponding contextId
 *
 * @param {string} contextId
 * @param {string} processId
 * @return {*}
 */
async function getTicketProcess(contextId: string, processId: string) {
  const processes = await SpinalGraphService.getChildrenInContext(
    contextId,
    contextId
  );
  const process = processes.find((process) => {
    return process.id.get() == processId;
  });
  return process;
}

/**
 * Checks if an alarm is already declared in the context and process.
 *
 * @param {string} nodeId
 * @param {string} contextId
 * @param {string} processId
 * @param {string} ticketName
 * @return {*}
 */
async function alarmAlreadyDeclared(
  nodeId: string,
  contextId: string,
  processId: string,
  ticketName: string
) {
  //SpinalNode
  const tickets = await spinalServiceTicket.getAlarmsFromNode(nodeId);
  const found = tickets.find((ticket) => {
    return (
      contextId == ticket.contextId &&
      processId == ticket.processId &&
      ticket.name == ticketName
    );
  });

  return found;
}

/**
 * Adds a ticket alarm to the context and process and link it with the node
 *
 * @export
 * @param {*} ticketInfos
 * @param {SpinalNodeRef} configInfo
 * @param {string} nodeId
 */
export async function addTicketAlarm(
  ticketInfos: any,
  configAttributes: any,
  analyticContextId: string,
  outputNodeId: string,
  entityNodeId: string,
  ticketType: string
) {
  const localizationInfo = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS];
  const contextId: string =
    localizationInfo[CONSTANTS.ATTRIBUTE_TICKET_CONTEXT_ID];
  const processId: string =
    localizationInfo[CONSTANTS.ATTRIBUTE_TICKET_PROCESS_ID];
  const context = getTicketContext(contextId);
  const process = await getTicketProcess(context.info.id.get(), processId);

  const alreadyDeclared = await alarmAlreadyDeclared(
    entityNodeId,
    contextId,
    processId,
    ticketInfos.name
  );

  if (alreadyDeclared) {
    //just update the ticket
    const firstStep = await serviceTicketPersonalized.getFirstStep(
      processId,
      contextId
    );
    console.log('update ticket ' + ticketInfos.name);
    const declaredTicketNode = SpinalGraphService.getRealNode(
      alreadyDeclared.id
    );
    if (declaredTicketNode.info.stepId.get() == firstStep) {
      const attr = await attributeService.findOneAttributeInCategory(
        declaredTicketNode,
        'default',
        'Occurrence number'
      );
      if (attr != -1) {
        // found the attribute
        const value = attr.value.get();
        const str = value.toString();
        const newValueInt = parseInt(str) + 1;
        await attributeService.updateAttribute(
          declaredTicketNode,
          'default',
          'Occurrence number',
          { value: newValueInt.toString() }
        );
        await updateEndpointOccurenceNumber(declaredTicketNode, newValueInt);
      }
    } else {
      // move the ticket to the first step and reset the occurrence number
      await serviceTicketPersonalized.moveTicket(
        declaredTicketNode.info.id.get(),
        declaredTicketNode.info.stepId.get(),
        firstStep,
        contextId
      );
      await attributeService.updateAttribute(
        declaredTicketNode,
        'default',
        'Occurrence number',
        { value: '1' }
      );
      await updateEndpointOccurenceNumber(declaredTicketNode, 1);
      console.log(
        `${ticketInfos.name} has been re-triggered and moved back to the first step`
      );
    }
  } else {
    console.log('create ticket ' + ticketInfos.name);
    if (process) {
      try {
        const ticketId = await spinalServiceTicket.addTicket(
          ticketInfos,
          process.id.get(),
          context.info.id.get(),
          entityNodeId,
          ticketType
        );
        if (ticketId instanceof Error) return;
        if (ticketType == 'Alarm') {
          SpinalGraphService.addChildInContext(
            outputNodeId,
            ticketId,
            analyticContextId,
            ALARM_RELATION_NAME,
            TICKET_RELATION_TYPE
          );
        } else {
          SpinalGraphService.addChildInContext(
            outputNodeId,
            ticketId,
            analyticContextId,
            TICKET_RELATION_NAME,
            TICKET_RELATION_TYPE
          );
        }

        if (typeof ticketId === 'string') {
          const declaredTicketNode = SpinalGraphService.getRealNode(ticketId);
          await attributeService.updateAttribute(
            declaredTicketNode,
            'default',
            'Occurrence number',
            { value: '1' }
          );
          const endpoint = new InputDataEndpoint(
            'Occurence number',
            1,
            '',
            InputDataEndpointDataType.Integer,
            InputDataEndpointType.Alarm
          );

          const res = new SpinalBmsEndpoint(
            endpoint.name,
            endpoint.path,
            endpoint.currentValue,
            endpoint.unit,
            InputDataEndpointDataType[endpoint.dataType],
            InputDataEndpointType[endpoint.type],
            endpoint.id
          );

          const childId = SpinalGraphService.createNode(
            { type: SpinalBmsEndpoint.nodeTypeName, name: endpoint.name },
            res
          );
          SpinalGraphService.addChild(
            ticketId,
            childId,
            SpinalBmsEndpoint.relationName,
            SPINAL_RELATION_PTR_LST_TYPE
          );
          await serviceTimeseries.getOrCreateTimeSeries(childId);
          serviceTimeseries.pushFromEndpoint(childId, 1);
        }
      } catch (error) {
        console.log('Ticket creation failed');
      }
    }
  }
}

async function updateEndpointOccurenceNumber(
  ticketNode: SpinalNode<any>,
  newValue: number
) {
  const endpoints = await ticketNode.getChildren('hasBmsEndpoint');
  endpoints.map(async (endpoint) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    SpinalGraphService._addNode(endpoint);
    if (endpoint.info.name.get() == 'Occurence number') {
      serviceTimeseries.pushFromEndpoint(endpoint.info.id.get(), newValue);

      const element = await endpoint.element?.load();
      element.currentValue.set(newValue);
    }
  });
}

async function removeChild(
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

export async function safeDeleteNode(
  nodeId: string,
  shouldDeleteChildren = false
): Promise<void> {
  const realNode = SpinalGraphService.getRealNode(nodeId);
  const relations = realNode.getRelationNames();
  for (const relation of relations) {
    const children = await realNode.getChildren(relation);
    for (const child of children) {
      await removeChild(realNode, child, relation);
      if (shouldDeleteChildren) await child.removeFromGraph();
    }
  }
  await realNode.removeFromGraph();
}


export function getCronMissingExecutionTimes(cronSyntax: string, lastExecutedTime: number): number[] {
  const now = new Date();
    const lastExecutedDate = new Date(lastExecutedTime);
    const executionTimes: number[] = [];

    try {
        // Initialize options for cron-parser
        const options = {
            currentDate: lastExecutedDate,
            endDate: now,
        };

        // Parse the cron syntax with the provided options
        const interval = cronParser.parseExpression(cronSyntax, options);

        // Using a while loop to fetch the next valid date within the range
        let nextDate = interval.next();
        while (nextDate && nextDate.toDate() <= now) {
            executionTimes.push(nextDate.getTime());
            try {
                nextDate = interval.next();
            } catch (e) {
                // Break the loop if there are no more dates to process
                break;
            }
        }
    } catch (err) {
        console.error('Failed to parse cron syntax:', err);
    }
    executionTimes.pop(); // Remove the last date (current time ) as it is 
    return executionTimes;

}

export function getIntervalTimeMissingExecutionTimes(intervalTime: number, lastExecutedTime: number): number[] {
  const now = new Date();
    const lastExecutedDate = new Date(lastExecutedTime);
    const executionTimes: number[] = [];
    try {
        let nextDate = new Date(lastExecutedDate.getTime() + intervalTime);
        while (nextDate <= now) {
            executionTimes.push(nextDate.getTime());
            nextDate = new Date(nextDate.getTime() + intervalTime);
        }
    } catch (err) {
        console.error('Failed to parse interval time:', err);
    }

    return executionTimes;
}


export function timeseriesPreProcessing(
  start: number,
  end: number,
  timeseries : SpinalDateValue[]
) : SpinalDateValue[] {
  if(timeseries.length === 0) return []

  //shifting the first timeseries to start if it is before start
  if(timeseries[0].date < start ) {
    timeseries[0].date = start;
  }

  //copy last value to the end of the timeseries
  timeseries.push({ date: end, value: timeseries[timeseries.length - 1].value });
  return timeseries;
}

