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



export async function findControlPoint(parentId: string, filterName: string) {
    const controlPoints = await SpinalGraphService.getChildren(parentId, ["hasControlPoints"]);
    if (controlPoints.length != 0) {
        for (const cp of controlPoints) {
            const bmsEndpoints = await SpinalGraphService.getChildren(cp.id.get(), ["hasBmsEndpoint"]);
            if (bmsEndpoints.length != 0) {
                for (const bms of bmsEndpoints) {
                    if (bms.name.get().includes(filterName)) {
                        return bms;
                    }
                }
            }
        }
    }
    return undefined;
}


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

function ticketIsAlreadyDeclared(ticketTab: any[], ticketName: string, context: SpinalContext<any>) {
    for (const ticket of ticketTab) {
        const node = SpinalGraphService.getRealNode(ticket.id);
        (<any>SpinalGraphService)._addNode(node);
        if (node.belongsToContext(context) && ticket.name == ticketName) return node;
    }
    return false
}


function getAnalysisTicketContext(){
    const contexts = SpinalGraphService.getContextWithType("SpinalSystemServiceTicket")
    const context = contexts.find((ctx) => {
        return ctx.info.name.get() == "Analysis tickets context";
    });
    return context;
}

async function getAlarmProcess(contextId: string){
    const processes = await SpinalGraphService.getChildrenInContext(contextId, contextId);
    return processes[0];
}


async function  ticketAlreadyDeclared(nodeId:string) {
    //SpinalNode
    const tickets = await spinalServiceTicket.getTicketsFromNode(nodeId);
    if (tickets.length == 0) return undefined;
    return tickets[0];

}


export async function addTicketAlarm(ticketInfos :any , nodeId : string){
    const ticketType = "Alarm";
    const context = getAnalysisTicketContext();
    const process = await getAlarmProcess(context.info.id.get());
    const alreadyDeclared = await ticketAlreadyDeclared(nodeId);
    if (alreadyDeclared){
        //just update the ticket
          
    }
    else {
        console.log("create ticket");
        
        ticketInfos.occurence=1;
        console.log({ processId: process.id.get(),
                      contextId: context.info.id.get()
        });
        
        // this function should take another parameter ticketType ... ask question later
        //const ticketId = await spinalServiceTicket.addTicket(ticketInfos, process.id.get(), context.info.id.get(), nodeId);
    }

    



}



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