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
exports.addTicketAlarm = exports.findControlEndpoints = exports.findEndpoints = exports.getTicketLocalizationParameters = exports.getAlgorithmParameters = void 0;
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const spinal_service_ticket_1 = require("spinal-service-ticket");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const InputDataEndpoint_1 = require("../models/InputData/InputDataModel/InputDataEndpoint");
const CONSTANTS = require("../constants");
/**
 * Uses the documentation service to get the attributes related to the algorithm parameters
 *
 * @export
 * @param {SpinalNodeRef} config
 * @return {*}
 */
function getAlgorithmParameters(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const configNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(config.id.get());
        const res = {};
        const algorithmParameters = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(configNode, CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS);
        for (const param of algorithmParameters) {
            const obj = param.get();
            res[obj.label] = obj.value;
        }
        return res;
    });
}
exports.getAlgorithmParameters = getAlgorithmParameters;
/**
 * Uses the documentation service to get the attributes related to the ticket localization
 * (context and process) parameters
 *
 * @export
 * @param {SpinalNodeRef} config
 * @return {*}
 */
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
/**
 * Applies a name filter to find the endpoints connected to the entity
 *
 * @export
 * @param {string} followedEntityId
 * @param {string} filterNameValue
 * @return {*}  {Promise<SpinalNodeRef[]>}
 */
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
/**
 * Applies a name filter to find the ControlEndpoints connected to the entity
 *
 * @export
 * @param {string} followedEntityId
 * @param {string} filterNameValue
 * @return {*}  {Promise<SpinalNodeRef[]>}
 */
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
/**
 * Finds the context of a node
 *
 * @param {string} contextType
 * @param {string} nodeId
 * @return {*}
 */
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
/**
 * Checks if a ticket is already declared in the context. If it is, returns the node, else returns false
 *
 * @param {any[]} ticketTab
 * @param {string} ticketName
 * @param {SpinalContext<any>} context
 * @return {*}
 */
function ticketIsAlreadyDeclared(ticketTab, ticketName, context) {
    for (const ticket of ticketTab) {
        const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(ticket.id);
        spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
        if (node.belongsToContext(context) && ticket.name == ticketName)
            return node;
    }
    return false;
}
/**
 * Gets the ticket context that has the corresponding contextId
 *
 * @param {string} contextId
 * @return {*}
 */
function getTicketContext(contextId) {
    const contexts = spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType("SpinalSystemServiceTicket");
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
function getTicketProcess(contextId, processId) {
    return __awaiter(this, void 0, void 0, function* () {
        const processes = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildrenInContext(contextId, contextId);
        const process = processes.find((process) => {
            return process.id.get() == processId;
        });
        return process;
    });
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
/**
 * Adds a ticket alarm to the context and process and link it with the node
 *
 * @export
 * @param {*} ticketInfos
 * @param {SpinalNodeRef} configInfo
 * @param {string} nodeId
 */
function addTicketAlarm(ticketInfos, configInfo, nodeId, ticketType) {
    return __awaiter(this, void 0, void 0, function* () {
        const localizationInfo = yield getTicketLocalizationParameters(configInfo);
        const contextId = localizationInfo["ticketContextId"];
        const processId = localizationInfo["ticketProcessId"];
        const context = getTicketContext(contextId);
        const process = yield getTicketProcess(context.info.id.get(), processId);
        const alreadyDeclared = yield alarmAlreadyDeclared(nodeId, contextId, processId, ticketInfos.name);
        if (alreadyDeclared) {
            //just update the ticket
            const firstStep = yield spinal_service_ticket_1.serviceTicketPersonalized.getFirstStep(processId, contextId);
            console.log("update ticket " + ticketInfos.name);
            let declaredTicketNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(alreadyDeclared.id);
            if (declaredTicketNode.info.stepId.get() == firstStep) {
                let attr = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.findOneAttributeInCategory(declaredTicketNode, "default", "Occurrence number");
                if (attr != -1) {
                    let value = attr.value.get();
                    let str = value.toString();
                    let newValueInt = parseInt(str) + 1;
                    yield spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(declaredTicketNode, "default", "Occurrence number", { value: newValueInt.toString() });
                    yield updateEndpointOccurenceNumber(declaredTicketNode, newValueInt);
                }
            }
            else {
                yield spinal_service_ticket_1.serviceTicketPersonalized.moveTicket(declaredTicketNode.info.id.get(), declaredTicketNode.info.stepId.get(), firstStep, contextId);
                yield spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(declaredTicketNode, "default", "Occurrence number", { value: "1" });
                yield updateEndpointOccurenceNumber(declaredTicketNode, 1);
                console.log(`${ticketInfos.name} has been re-triggered and moved back to the first step`);
            }
        }
        else {
            console.log("create ticket " + ticketInfos.name);
            if (process) {
                const ticketId = yield spinal_service_ticket_1.spinalServiceTicket.addTicket(ticketInfos, process.id.get(), context.info.id.get(), nodeId, ticketType);
                if (typeof ticketId === "string") {
                    let declaredTicketNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(ticketId);
                    yield spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(declaredTicketNode, "default", "Occurrence number", { value: "1" });
                    let endpoint = new InputDataEndpoint_1.InputDataEndpoint("Occurence number", 1, "", spinal_model_bmsnetwork_1.InputDataEndpointDataType.Integer, spinal_model_bmsnetwork_1.InputDataEndpointType.Alarm);
                    const res = new spinal_model_bmsnetwork_1.SpinalBmsEndpoint(endpoint.name, endpoint.path, endpoint.currentValue, endpoint.unit, spinal_model_bmsnetwork_1.InputDataEndpointDataType[endpoint.dataType], spinal_model_bmsnetwork_1.InputDataEndpointType[endpoint.type], endpoint.id);
                    const childId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode({ type: spinal_model_bmsnetwork_1.SpinalBmsEndpoint.nodeTypeName,
                        name: endpoint.name }, res);
                    spinal_env_viewer_graph_service_1.SpinalGraphService.addChild(ticketId, childId, spinal_model_bmsnetwork_1.SpinalBmsEndpoint.relationName, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
                }
            }
        }
    });
}
exports.addTicketAlarm = addTicketAlarm;
function updateEndpointOccurenceNumber(ticketNode, newValue) {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoints = yield ticketNode.getChildren("hasBmsEndpoint");
        endpoints.map((endpoint) => __awaiter(this, void 0, void 0, function* () {
            if (endpoint.info.name.get() == "Occurence number") {
                const element = yield endpoint.element.load();
                element.currentValue.set(newValue);
            }
        }));
    });
}
//# sourceMappingURL=utils.js.map