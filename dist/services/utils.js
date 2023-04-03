"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTicketPersonalized = exports.addTicketAlarm = exports.findControlEndpoints = exports.findEndpoints = exports.getTicketLocalizationParameters = exports.getAlgorithmParameters = exports.findControlPoint = void 0;
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const spinal_service_ticket_1 = require("spinal-service-ticket");
const CONSTANTS = require("../constants");
function findControlPoint(parentId, filterName) {
    return __awaiter(this, void 0, void 0, function* () {
        const controlPoints = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(parentId, ["hasControlPoints"]);
        if (controlPoints.length != 0) {
            for (const cp of controlPoints) {
                const bmsEndpoints = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(cp.id.get(), ["hasBmsEndpoint"]);
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
    });
}
exports.findControlPoint = findControlPoint;
function getAlgorithmParameters(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const configNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(config.id.get());
        const res = {};
        const algorithmParameters = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(configNode, CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS);
        for (const param of algorithmParameters) {
            const obj = param.get();
            res[obj.label] = obj.value;
        }
        //console.log("ALGORITHM PARAMETERS : ",res);
        return res;
    });
}
exports.getAlgorithmParameters = getAlgorithmParameters;
function getTicketLocalizationParameters(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const configNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(config.id.get());
        const res = {};
        const localizationParameters = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(configNode, CONSTANTS.CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS);
        for (const param of localizationParameters) {
            const obj = param.get();
            res[obj.label] = obj.value;
        }
        return res;
    });
}
exports.getTicketLocalizationParameters = getTicketLocalizationParameters;
function findEndpoints(followedEntityId, filterNameValue) {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoints = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(followedEntityId, ["hasBmsEndpoint"]);
        const filteredEndpoints = [];
        for (const endpoint of endpoints) {
            if (endpoint.name.get().includes(filterNameValue)) {
                filteredEndpoints.push(endpoint);
            }
        }
        return filteredEndpoints;
    });
}
exports.findEndpoints = findEndpoints;
function findControlEndpoints(followedEntityId, filterNameValue) {
    return __awaiter(this, void 0, void 0, function* () {
        const bmsEndpointGroups = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(followedEntityId, ["hasControlPoints"]);
        const filteredEndpoints = [];
        for (const bmsEndpointGroup of bmsEndpointGroups) {
            const bmsEndpoints = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(bmsEndpointGroup.id.get(), ["hasBmsEndpoint"]);
            for (const bmsEndpoint of bmsEndpoints) {
                if (bmsEndpoint.name.get().includes(filterNameValue)) {
                    filteredEndpoints.push(bmsEndpoint);
                }
            }
        }
        return filteredEndpoints;
    });
}
exports.findControlEndpoints = findControlEndpoints;
// ticket creation
function findContextOfNode(contextType, nodeId) {
    const contexts = spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType(contextType);
    const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
    spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
    const ids = Object.keys(node.contextIds);
    // utiliser belongsToContext plutot
    for (const ctx of contexts) {
        if (ids.includes(ctx.info.id.get()) == true)
            return ctx;
    }
    return undefined;
}
function ticketIsAlreadyDeclared(ticketTab, ticketName, context) {
    for (const ticket of ticketTab) {
        const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(ticket.id);
        spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
        if (node.belongsToContext(context) && ticket.name == ticketName)
            return node;
    }
    return false;
}
function getAnalysisTicketContext() {
    const contexts = spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType("SpinalSystemServiceTicket");
    const context = contexts.find((ctx) => {
        return ctx.info.name.get() == "Analysis tickets context";
    });
    return context;
}
function getAlarmProcess(contextId) {
    return __awaiter(this, void 0, void 0, function* () {
        const processes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildrenInContext(contextId, contextId);
        return processes[0];
    });
}
function getTicketContext(contextId) {
    const contexts = spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType("SpinalSystemServiceTicket");
    const context = contexts.find((ctx) => {
        return ctx.info.id.get() == contextId;
    });
    return context;
}
function getTicketProcess(contextId, processId) {
    return __awaiter(this, void 0, void 0, function* () {
        const processes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildrenInContext(contextId, contextId);
        const process = processes.find((process) => {
            return process.id.get() == processId;
        });
        return process;
    });
}
function alarmAlreadyDeclared(nodeId, contextId, processId, ticketName) {
    return __awaiter(this, void 0, void 0, function* () {
        //SpinalNode
        const tickets = yield spinal_service_ticket_1.spinalServiceTicket.getAlarmsFromNode(nodeId);
        console.log(tickets);
        const found = tickets.find((ticket) => {
            return contextId == ticket.contextId && processId == ticket.processId && ticket.name == ticketName;
        });
        return found;
    });
}
function addTicketAlarm(ticketInfos, configInfo, nodeId) {
    return __awaiter(this, void 0, void 0, function* () {
        const ticketType = "Alarm";
        const localizationInfo = yield getTicketLocalizationParameters(configInfo);
        const contextId = localizationInfo["ticketContextId"];
        const processId = localizationInfo["ticketProcessId"];
        const context = getTicketContext(contextId);
        const process = yield getTicketProcess(context.info.id.get(), processId);
        const alreadyDeclared = yield alarmAlreadyDeclared(nodeId, contextId, processId, ticketInfos.name);
        if (alreadyDeclared) {
            //just update the ticket
            console.log("update ticket " + ticketInfos.name);
            let declaredTicketNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(alreadyDeclared.id);
            let attr = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.findOneAttributeInCategory(declaredTicketNode, "default", "Occurrence number");
            if (attr != -1) {
                let value = attr.value.get();
                let str = value.toString();
                let newValueInt = parseInt(str) + 1;
                console.log(newValueInt);
                yield spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(declaredTicketNode, "default", "Occurrence number", { value: newValueInt.toString() });
            }
        }
        else {
            console.log("create ticket " + ticketInfos.name);
            // this function should take another parameter ticketType ... ask question later
            if (process) {
                const ticketId = yield spinal_service_ticket_1.spinalServiceTicket.addTicket(ticketInfos, process.id.get(), context.info.id.get(), nodeId, ticketType);
            }
        }
    });
}
exports.addTicketAlarm = addTicketAlarm;
function addTicketPersonalized(ticketInfos, processId, parentId) {
    return __awaiter(this, void 0, void 0, function* () {
        const context = findContextOfNode("SpinalSystemServiceTicket", processId);
        if (context != undefined) {
            const tickets = yield spinal_service_ticket_1.serviceTicketPersonalized.getTicketsFromNode(parentId);
            const declaredTicket = yield ticketIsAlreadyDeclared(tickets, ticketInfos.name, context);
            if (declaredTicket != false) {
                const firstStep = yield spinal_service_ticket_1.serviceTicketPersonalized.getFirstStep(processId, context.info.id.get());
                const declaredTicketNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(declaredTicket.info.id.get());
                spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(declaredTicketNode);
                if (declaredTicket.info.stepId.get() == firstStep) {
                    const attr = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.findOneAttributeInCategory(declaredTicketNode, "default", "Occurrence number");
                    if (attr != -1) {
                        const value = attr.value.get();
                        const str = value.toString();
                        const newValueInt = parseInt(str) + 1;
                        console.log(newValueInt);
                        yield spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(declaredTicketNode, "default", "Occurrence number", { value: newValueInt.toString() });
                    }
                }
                else {
                    yield spinal_service_ticket_1.serviceTicketPersonalized.moveTicket(declaredTicket.info.id.get(), declaredTicket.info.stepId.get(), firstStep, context.info.id.get());
                    yield spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(declaredTicketNode, "default", "Occurrence number", { value: "0" });
                    console.log("moved");
                }
            }
            else {
                const tick = yield spinal_service_ticket_1.serviceTicketPersonalized.addTicket(ticketInfos, processId, context.info.id.get(), parentId);
                console.log("Nouveau ticket [" + ticketInfos.name + "]");
            }
        }
        // console.log(processNode);
        // console.log(contexts);
        // let ticket = await serviceTicketPersonalized.addTicket(ticketInfos, processId, process.contextId, parentId);
        // return ticket;
    });
}
exports.addTicketPersonalized = addTicketPersonalized;
//# sourceMappingURL=utils.js.map