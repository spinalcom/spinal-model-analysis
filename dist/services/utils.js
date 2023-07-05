"use strict";
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
exports.addTicketAlarm = exports.formatTrackingMethodsToList = exports.getValueModelFromEntry = exports.findAllCategoriesAndAttributes = exports.findControlEndpoint = exports.findEndpoint = exports.findControlEndpoints = exports.findEndpoints = exports.getTicketLocalizationParameters = exports.getAlgorithmParameters = void 0;
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const spinal_service_ticket_1 = require("spinal-service-ticket");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const InputDataEndpoint_1 = require("../models/InputData/InputDataModel/InputDataEndpoint");
const CONSTANTS = require("../constants");
const spinal_models_documentation_1 = require("spinal-models-documentation");
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
function findEndpoints(followedEntityId, acc) {
    return __awaiter(this, void 0, void 0, function* () {
        const children = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(followedEntityId, ["hasBmsEndpoint", "hasBmsDevice", "hasBmsEndpointGroup", "hasEndPoint"]);
        if (children.length == 0)
            return acc;
        for (const child of children) {
            if (child.type.get() === 'BmsEndpoint') {
                acc.push(child);
            }
            else {
                acc = acc.concat(yield findEndpoints(child.id.get(), acc));
            }
        }
        return acc;
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
/**
 * Applies a name filter to find the endpoint connected to the entity
 *
 * @export
 * @param {string} followedEntityId
 * @param {string} filterNameValue
 * @return {*}  {Promise<SpinalNodeRef|undefined>}
 */
function findEndpoint(followedEntityId, filterNameValue) {
    return __awaiter(this, void 0, void 0, function* () {
        const children = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(followedEntityId, ["hasBmsEndpoint", "hasBmsDevice", "hasBmsEndpointGroup", "hasEndPoint"]);
        if (children.length == 0)
            return undefined;
        for (const child of children) {
            if (child.type.get() === 'BmsEndpoint' && child.name.get() === filterNameValue) {
                return child;
            }
            else {
                return yield findEndpoint(child.id.get(), filterNameValue);
            }
        }
        return undefined;
    });
}
exports.findEndpoint = findEndpoint;
/**
 * Applies a name filter to find the ControlEndpoint connected to the entity
 *
 * @export
 * @param {string} followedEntityId
 * @param {string} filterNameValue
 * @return {*}  {Promise<SpinalNodeRef|undefined>}
 */
function findControlEndpoint(followedEntityId, filterNameValue) {
    return __awaiter(this, void 0, void 0, function* () {
        const bmsEndpointGroups = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(followedEntityId, ["hasControlPoints"]);
        for (const bmsEndpointGroup of bmsEndpointGroups) {
            const bmsEndpoints = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(bmsEndpointGroup.id.get(), ["hasBmsEndpoint"]);
            const foundBmsEndpoint = bmsEndpoints.find((endpoint) => {
                return endpoint.name.get() === filterNameValue;
            });
            if (foundBmsEndpoint)
                return foundBmsEndpoint;
        }
        return undefined;
    });
}
exports.findControlEndpoint = findControlEndpoint;
function findAllCategoriesAndAttributes(followedEntityId) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(followedEntityId);
        const res = [];
        const categories = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getCategory(node);
        for (const category of categories) {
            const attributes = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(node, category);
            for (const attribute of attributes) {
                const obj = attribute.get();
                res.push(`${category.nameCat}:${obj.label}`);
            }
        }
        return res;
    });
}
exports.findAllCategoriesAndAttributes = findAllCategoriesAndAttributes;
function getValueModelFromEntry(entryDataModel) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(entryDataModel instanceof spinal_models_documentation_1.SpinalAttribute)) {
            const element = yield entryDataModel.element.load();
            return element.currentValue;
        }
        return entryDataModel.value;
    });
}
exports.getValueModelFromEntry = getValueModelFromEntry;
function formatTrackingMethodsToList(obj) {
    const result = [];
    const keys = Object.keys(obj);
    const length = (keys.length - 1) / 4;
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
exports.formatTrackingMethodsToList = formatTrackingMethodsToList;
// ticket creation
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
            const declaredTicketNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(alreadyDeclared.id);
            if (declaredTicketNode.info.stepId.get() == firstStep) {
                const attr = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.findOneAttributeInCategory(declaredTicketNode, "default", "Occurrence number");
                if (attr != -1) {
                    const value = attr.value.get();
                    const str = value.toString();
                    const newValueInt = parseInt(str) + 1;
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
                    const declaredTicketNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(ticketId);
                    yield spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(declaredTicketNode, "default", "Occurrence number", { value: "1" });
                    const endpoint = new InputDataEndpoint_1.InputDataEndpoint("Occurence number", 1, "", spinal_model_bmsnetwork_1.InputDataEndpointDataType.Integer, spinal_model_bmsnetwork_1.InputDataEndpointType.Alarm);
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