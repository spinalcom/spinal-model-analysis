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

import { SpinalGraphService, SpinalContext, SpinalNodeRef } from "spinal-env-viewer-graph-service";
import { attributeService } from "spinal-env-viewer-plugin-documentation-service";
import { serviceTicketPersonalized, spinalServiceTicket } from "spinal-service-ticket";
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
    //console.log("ALGORITHM PARAMETERS : ",res);
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

// ticket creation


/**
 * Finds the context of a node
 *
 * @param {string} contextType
 * @param {string} nodeId
 * @return {*} 
 */
function findContextOfNode(contextType: string, nodeId: string) {
    const contexts = SpinalGraphService.getContextWithType(contextType);
    const node = SpinalGraphService.getRealNode(nodeId);
    (<any>SpinalGraphService)._addNode(node);
    const ids = Object.keys(node.contextIds);
    // utiliser belongsToContext plutot
    for (const ctx of contexts) {
        if (ids.includes(ctx.info.id.get()) == true) return ctx
    }
    return undefined;
}

/**
 * Checks if a ticket is already declared in the context. If it is, returns the node, else returns false
 *
 * @param {any[]} ticketTab
 * @param {string} ticketName
 * @param {SpinalContext<any>} context
 * @return {*} 
 */
function ticketIsAlreadyDeclared(ticketTab: any[], ticketName: string, context: SpinalContext<any>) {
    for (const ticket of ticketTab) {
        const node = SpinalGraphService.getRealNode(ticket.id);
        (<any>SpinalGraphService)._addNode(node);
        if (node.belongsToContext(context) && ticket.name == ticketName) return node;
    }
    return false
}

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
export async function addTicketAlarm(ticketInfos :any ,configInfo : SpinalNodeRef, nodeId : string){
    const ticketType = "Alarm";
    const localizationInfo = await getTicketLocalizationParameters(configInfo);
    const contextId = localizationInfo["ticketContextId"];
    const processId = localizationInfo["ticketProcessId"];

    const context = getTicketContext(contextId);
    const process = await getTicketProcess(context.info.id.get(), processId);

    const alreadyDeclared = await alarmAlreadyDeclared(nodeId,contextId,processId,ticketInfos.name);

    
    if (alreadyDeclared){
        //just update the ticket
        console.log("update ticket "  + ticketInfos.name);
        let declaredTicketNode = SpinalGraphService.getRealNode(alreadyDeclared.id);
        let attr = await attributeService.findOneAttributeInCategory(declaredTicketNode, "default", "Occurrence number");
        if (attr != -1) {
            let value = attr.value.get();
            let str = value.toString();
            let newValueInt = parseInt(str) + 1;
            console.log(newValueInt);
            await attributeService.updateAttribute(declaredTicketNode, "default", "Occurrence number", { value: newValueInt.toString() });
        }   
    }
    else {
        console.log("create ticket "  + ticketInfos.name);        
        // this function should take another parameter ticketType ... ask question later
        if (process) {
            const ticketId = await spinalServiceTicket.addTicket(ticketInfos, process.id.get(), context.info.id.get(), nodeId, ticketType);
        }
    }
    
    



}

// not used for now
export async function addTicketPersonalized(ticketInfos:any, processId: string, parentId: string) {
    const context = findContextOfNode("SpinalSystemServiceTicket", processId);
    if (context != undefined) {
        const tickets = await serviceTicketPersonalized.getTicketsFromNode(parentId);
        const declaredTicket = await ticketIsAlreadyDeclared(tickets, ticketInfos.name, context);
        if (declaredTicket != false) {
            const firstStep = await serviceTicketPersonalized.getFirstStep(processId, context.info.id.get());
            const declaredTicketNode = SpinalGraphService.getRealNode(declaredTicket.info.id.get());
            (<any>SpinalGraphService)._addNode(declaredTicketNode);
            if (declaredTicket.info.stepId.get() == firstStep) {

                const attr = await attributeService.findOneAttributeInCategory(declaredTicketNode, "default", "Occurrence number");
                if (attr != -1) {
                    const value = attr.value.get();
                    const str = value.toString();
                    const newValueInt = parseInt(str) + 1;
                    console.log(newValueInt);
                    await attributeService.updateAttribute(declaredTicketNode, "default", "Occurrence number", { value: newValueInt.toString() });
                }
            }
            else {
                await serviceTicketPersonalized.moveTicket(declaredTicket.info.id.get(), declaredTicket.info.stepId.get(), firstStep, context.info.id.get());
                await attributeService.updateAttribute(declaredTicketNode, "default", "Occurrence number", { value: "0" });
                console.log("moved");
            }
        }
        else{
            const tick = await serviceTicketPersonalized.addTicket(ticketInfos, processId, context.info.id.get(), parentId);
            console.log("Nouveau ticket [" + ticketInfos.name + "]");
        }
    }


    // console.log(processNode);
    // console.log(contexts);
    // let ticket = await serviceTicketPersonalized.addTicket(ticketInfos, processId, process.contextId, parentId);
    // return ticket;
}

