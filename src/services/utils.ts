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

import { SpinalGraphService, SpinalNodeRef, SPINAL_RELATION_PTR_LST_TYPE, SpinalNode } from "spinal-env-viewer-graph-service";
import { attributeService } from "spinal-env-viewer-plugin-documentation-service";
import { serviceTicketPersonalized, spinalServiceTicket } from "spinal-service-ticket";
import { InputDataEndpointDataType, InputDataEndpointType, SpinalBmsEndpoint} from "spinal-model-bmsnetwork";
import { InputDataEndpoint } from "../models/InputData/InputDataModel/InputDataEndpoint";
import * as CONSTANTS from "../constants";



/**
 * Uses the documentation service to get the attributes related to the algorithm parameters
 * 
 * @export
 * @param {SpinalNodeRef} config
 * @return {*} 
 */
export async function getAlgorithmParameters(config: SpinalNodeRef) : Promise<any> {
    const configNode = SpinalGraphService.getRealNode(config.id.get());
    const res = {}
    const algorithmParameters = await attributeService.getAttributesByCategory(configNode, CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS);
    for (const param of algorithmParameters) {
        const obj = param.get();
        res[obj.label] = obj.value;
    } 
    return res
}



/**
 * Uses the documentation service to get the attributes related to the ticket localization 
 * (context and process) parameters
 *
 * @export
 * @param {SpinalNodeRef} config
 * @return {*} 
 */
export async function getTicketLocalizationParameters(config : SpinalNodeRef) : Promise<any> {
    const configNode = SpinalGraphService.getRealNode(config.id.get());
    const res = {}
    const localizationParameters = await attributeService.getAttributesByCategory(configNode, CONSTANTS.CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS);
    for (const param of localizationParameters) {
        const obj = param.get();
        res[obj.label] = obj.value;
    }
    return res
}

/**
 * Applies a name filter to find the endpoints connected to the entity
 *
 * @export
 * @param {string} followedEntityId
 * @param {string} filterNameValue
 * @return {*}  {Promise<SpinalNodeRef[]>}
 */
export async function findEndpoints(followedEntityId: string, filterNameValue: string) : Promise<SpinalNodeRef[]> {
    const endpoints = await SpinalGraphService.getChildren(followedEntityId, ["hasBmsEndpoint"]);
    const filteredEndpoints : SpinalNodeRef[] = [];
    for (const endpoint of endpoints) {
        if (endpoint.name.get().includes(filterNameValue)) {
            filteredEndpoints.push(endpoint);
        }
    }
    return filteredEndpoints;
}

/**
 * Applies a name filter to find the ControlEndpoints connected to the entity
 *
 * @export
 * @param {string} followedEntityId
 * @param {string} filterNameValue
 * @return {*}  {Promise<SpinalNodeRef[]>}
 */
export async function findControlEndpoints(followedEntityId: string, filterNameValue: string) : Promise<SpinalNodeRef[]> {
    const bmsEndpointGroups = await SpinalGraphService.getChildren(followedEntityId, ["hasControlPoints"]);
    const filteredEndpoints : SpinalNodeRef[] = [];
    for (const bmsEndpointGroup of bmsEndpointGroups) {
        const bmsEndpoints = await SpinalGraphService.getChildren(bmsEndpointGroup.id.get(), ["hasBmsEndpoint"]);
        for (const bmsEndpoint of bmsEndpoints) {
            if (bmsEndpoint.name.get().includes(filterNameValue)) {
                filteredEndpoints.push(bmsEndpoint);
            }
        }
    }
    return filteredEndpoints;
}

/**
 * Applies a name filter to find the endpoint connected to the entity
 *
 * @export
 * @param {string} followedEntityId
 * @param {string} filterNameValue
 * @return {*}  {Promise<SpinalNodeRef|undefined>}
 */
export async function findEndpoint(followedEntityId: string, filterNameValue: string) : Promise<SpinalNodeRef|undefined> {
    const endpoints = await SpinalGraphService.getChildren(followedEntityId, ["hasBmsEndpoint"]);
    const endpoint = endpoints.find((endpoint) => {
        return endpoint.name.get()===filterNameValue;
    });
    return endpoint;
}

/**
 * Applies a name filter to find the ControlEndpoint connected to the entity
 *
 * @export
 * @param {string} followedEntityId
 * @param {string} filterNameValue
 * @return {*}  {Promise<SpinalNodeRef|undefined>}
 */
export async function findControlEndpoint(followedEntityId: string, filterNameValue: string) : Promise<SpinalNodeRef|undefined> {
    const bmsEndpointGroups = await SpinalGraphService.getChildren(followedEntityId, ["hasControlPoints"]);
    for (const bmsEndpointGroup of bmsEndpointGroups) {
        const bmsEndpoints = await SpinalGraphService.getChildren(bmsEndpointGroup.id.get(), ["hasBmsEndpoint"]);
        const foundBmsEndpoint = bmsEndpoints.find((endpoint) => {
            return endpoint.name.get()===filterNameValue;
        });
        if (foundBmsEndpoint) return foundBmsEndpoint;
    }
    return undefined;
}



export function formatTrackingMethodsToList(obj) : any[]{
    const result:any = [];
    const keys = Object.keys(obj);
    const length = (keys.length-1) / 4;

    for (let i = 0; i < length; i++) {
        const item = {
            trackingMethod: obj[`trackingMethod${i}`],
            filterValue: obj[`filterValue${i}`],
            removeFromAnalysis: obj[`removeFromAnalysis${i}`],
            removeFromBinding: obj[`removeFromBinding${i}`]
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
function getTicketContext(contextId : string ) {
    const contexts = SpinalGraphService.getContextWithType("SpinalSystemServiceTicket")
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
async function getTicketProcess(contextId: string, processId: string){
    const processes = await SpinalGraphService.getChildrenInContext(contextId, contextId);
    const process = processes.find((process) => {
        return process.id.get() == processId;
    })
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
async function  alarmAlreadyDeclared(nodeId:string,contextId: string, processId: string, ticketName:string) {
    //SpinalNode
    const tickets = await spinalServiceTicket.getAlarmsFromNode(nodeId);
    console.log(tickets);
    const found = tickets.find((ticket) => {
        return contextId == ticket.contextId && processId == ticket.processId && ticket.name == ticketName;
    })

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
export async function addTicketAlarm(ticketInfos :any ,configInfo : SpinalNodeRef, nodeId : string, ticketType: string){
    const localizationInfo = await getTicketLocalizationParameters(configInfo);
    const contextId : string = localizationInfo["ticketContextId"];
    const processId : string = localizationInfo["ticketProcessId"];
    const context = getTicketContext(contextId);
    const process = await getTicketProcess(context.info.id.get(), processId);

    const alreadyDeclared = await alarmAlreadyDeclared(nodeId,contextId,processId,ticketInfos.name);

    
    if (alreadyDeclared){
        //just update the ticket
        const firstStep = await serviceTicketPersonalized.getFirstStep(processId, contextId);
        console.log("update ticket "  + ticketInfos.name);
        const declaredTicketNode = SpinalGraphService.getRealNode(alreadyDeclared.id);
        if (declaredTicketNode.info.stepId.get() == firstStep) {
            const attr = await attributeService.findOneAttributeInCategory(declaredTicketNode, "default", "Occurrence number");
            if (attr != -1) {
                const value = attr.value.get();
                const str = value.toString();
                const newValueInt = parseInt(str) + 1;
                await attributeService.updateAttribute(declaredTicketNode, "default", "Occurrence number", { value: newValueInt.toString() });
                await updateEndpointOccurenceNumber(declaredTicketNode, newValueInt);
            }   
        }
        else {
            await serviceTicketPersonalized.moveTicket(declaredTicketNode.info.id.get(), declaredTicketNode.info.stepId.get(), firstStep, contextId);
            await attributeService.updateAttribute(declaredTicketNode, "default", "Occurrence number", { value: "1" });
            await updateEndpointOccurenceNumber(declaredTicketNode, 1);
            console.log(`${ticketInfos.name} has been re-triggered and moved back to the first step`);
        }
        
    }
    else {
        console.log("create ticket "  + ticketInfos.name);        
        if (process) {
            const ticketId = await spinalServiceTicket.addTicket(ticketInfos, process.id.get(), context.info.id.get(), nodeId, ticketType);
            if (typeof ticketId === "string"){
                const declaredTicketNode = SpinalGraphService.getRealNode(ticketId);
                await attributeService.updateAttribute(declaredTicketNode, "default", "Occurrence number", { value: "1" });
                const endpoint = new InputDataEndpoint("Occurence number",
                                                    1,
                                                    "",
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
                    endpoint.id,
                  );

                const childId = SpinalGraphService.createNode({type: SpinalBmsEndpoint.nodeTypeName,
                    name: endpoint.name}, res);
                SpinalGraphService.addChild(ticketId,childId,SpinalBmsEndpoint.relationName,SPINAL_RELATION_PTR_LST_TYPE)
                
            }

        }
    }
    

}

async function updateEndpointOccurenceNumber(ticketNode :SpinalNode<any>, newValue : number){
    const endpoints = await ticketNode.getChildren(
        "hasBmsEndpoint"
      );

    endpoints.map(async (endpoint) => {
        if(endpoint.info.name.get() == "Occurence number"){
            const element = await endpoint.element.load();
            element.currentValue.set(newValue);
        }
    })
}

