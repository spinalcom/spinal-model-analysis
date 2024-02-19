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
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeDeleteNode = exports.addTicketAlarm = exports.formatTrackingMethodsToList = exports.getValueModelFromEntry = exports.findAllCategoriesAndAttributes = exports.findAttributes = exports.findAttribute = exports.findEndpoints = exports.findEndpoint = exports.findNodes = exports.getAvailableData = exports.getChoiceRelationsWithDepth = exports.getRelationsWithDepth = exports.getTicketLocalizationParameters = exports.getAlgorithmParameters = void 0;
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const spinal_service_ticket_1 = require("spinal-service-ticket");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const InputDataEndpoint_1 = require("../models/InputData/InputDataModel/InputDataEndpoint");
const CONSTANTS = require("../constants");
const spinal_models_documentation_1 = require("spinal-models-documentation");
const SingletonTimeSeries_1 = require("./SingletonTimeSeries");
const serviceTimeseries = SingletonTimeSeries_1.SingletonServiceTimeseries.getInstance();
/**
 * Uses the documentation service to get the attributes related to the algorithm parameters
 *
 * @export
 * @param {SpinalNodeRef} config
 * @return {*}
 */
async function getAlgorithmParameters(config) {
    const configNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(config.id.get());
    const res = {};
    const algorithmParameters = await spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(configNode, CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS);
    for (const param of algorithmParameters) {
        const obj = param.get();
        res[obj.label] = obj.value;
    }
    return res;
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
async function getTicketLocalizationParameters(config) {
    const configNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(config.id.get());
    const res = {};
    const localizationParameters = await spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(configNode, CONSTANTS.CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS);
    for (const param of localizationParameters) {
        const obj = param.get();
        res[obj.label] = obj.value;
    }
    return res;
}
exports.getTicketLocalizationParameters = getTicketLocalizationParameters;
async function getRelationsWithDepth(nodeId, depth) {
    const relations = spinal_env_viewer_graph_service_1.SpinalGraphService.getRelationNames(nodeId);
    if (depth <= 0)
        return relations;
    const children = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId);
    for (const child of children) {
        const childRelations = await getRelationsWithDepth(child.id.get(), depth - 1);
        for (const childRelation of childRelations) {
            if (!relations.includes(childRelation))
                relations.push(childRelation);
        }
    }
    return relations;
}
exports.getRelationsWithDepth = getRelationsWithDepth;
async function getChoiceRelationsWithDepth(nodeId, depth) {
    const relations = await getRelationsWithDepth(nodeId, depth);
    const usefullRelations = relations.filter(relation => {
        return !CONSTANTS.ENDPOINT_RELATIONS.includes(relation) &&
            !CONSTANTS.CONTROL_ENDPOINT_RELATIONS.includes(relation);
    });
    return usefullRelations;
}
exports.getChoiceRelationsWithDepth = getChoiceRelationsWithDepth;
async function getAvailableData(trackMethod, nodeId, filterValue, depth, stricDepth, authorizedRelations) {
    switch (trackMethod) {
        case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER: {
            const data = await findEndpoints(nodeId, filterValue, depth, stricDepth, authorizedRelations, CONSTANTS.ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
            return data.map(endpoint => endpoint.name.get());
        }
        case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER: {
            const data = await findEndpoints(nodeId, filterValue, depth, stricDepth, authorizedRelations, CONSTANTS.CONTROL_ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
            return data.map(endpoint => endpoint.name.get());
        }
        case CONSTANTS.TRACK_METHOD.ATTRIBUTE_NAME_FILTER: {
            const [category, attribute] = filterValue.split(':');
            const data = await findAttributes(nodeId, category, attribute, depth, stricDepth, authorizedRelations);
            return data;
        }
        default: {
            console.log("Get available data not implemented yet for this tracking method");
            return [];
        }
    }
}
exports.getAvailableData = getAvailableData;
async function findNodes(nodeId, authorizedRelations, nodeType) {
    let res = [];
    const children = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, authorizedRelations);
    for (const child of children) {
        if (child.type.get() === nodeType) {
            res.push(child);
        }
        else {
            res = res.concat(await findNodes(child.id.get(), authorizedRelations, nodeType));
        }
    }
    return res;
}
exports.findNodes = findNodes;
async function findSpecificNode(nodeId, filterNameValue, trackedRelations, nodeType) {
    const endpoints = await findNodes(nodeId, trackedRelations, nodeType);
    return endpoints.find(endpoint => endpoint.name.get() === filterNameValue);
}
async function findMatchingNodes(nodeId, filterNameValue, trackedRelations, nodeType) {
    const endpoints = await findNodes(nodeId, trackedRelations, nodeType);
    return endpoints.filter(endpoint => endpoint.name.get().includes(filterNameValue));
}
async function findEndpoint(nodeId, filterNameValue, depth, strictDepth, authorizedRelations, trackedRelations, nodeType) {
    if (depth < 0)
        return undefined;
    // we dont look further
    if (depth == 0) {
        return await findSpecificNode(nodeId, filterNameValue, trackedRelations, nodeType);
    }
    // depth > 0
    if (!strictDepth) {
        const foundEndpoint = await findSpecificNode(nodeId, filterNameValue, trackedRelations, nodeType);
        if (foundEndpoint)
            return foundEndpoint;
    }
    const allRelations = spinal_env_viewer_graph_service_1.SpinalGraphService.getRelationNames(nodeId);
    const checkedRelations = allRelations.filter(relation => authorizedRelations.includes(relation));
    if (checkedRelations.length === 0)
        return undefined;
    const children = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, checkedRelations);
    for (const child of children) {
        const endpoint = await findEndpoint(child.id.get(), filterNameValue, depth - 1, strictDepth, authorizedRelations, trackedRelations, nodeType);
        if (endpoint)
            return endpoint;
    }
    return undefined;
}
exports.findEndpoint = findEndpoint;
async function findEndpoints(nodeId, filterNameValue, depth, strictDepth, authorizedRelations, trackedRelations, nodeType) {
    if (depth == 0) {
        return await findMatchingNodes(nodeId, filterNameValue, trackedRelations, nodeType);
    }
    let results = [];
    if (!strictDepth) {
        results = results.concat(await findMatchingNodes(nodeId, filterNameValue, trackedRelations, nodeType));
    }
    if (depth <= 0)
        return results;
    const allRelations = spinal_env_viewer_graph_service_1.SpinalGraphService.getRelationNames(nodeId);
    const checkedRelations = allRelations.filter(relation => authorizedRelations.includes(relation));
    if (checkedRelations.length === 0)
        return results;
    const children = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, checkedRelations);
    for (const child of children) {
        results = results.concat(await findEndpoints(child.id.get(), filterNameValue, depth - 1, strictDepth, authorizedRelations, trackedRelations, nodeType));
    }
    return results;
}
exports.findEndpoints = findEndpoints;
async function findAttribute(nodeId, categoryName, attributeName, depth, strictDepth, authorizedRelations) {
    if (depth < 0)
        return -1;
    const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
    // we dont look further
    if (depth == 0) {
        return await spinal_env_viewer_plugin_documentation_service_1.attributeService.findOneAttributeInCategory(node, categoryName, attributeName);
    }
    // depth > 0
    if (!strictDepth) {
        const foundAttribute = await spinal_env_viewer_plugin_documentation_service_1.attributeService.findOneAttributeInCategory(node, categoryName, attributeName);
        if (foundAttribute != -1)
            return foundAttribute;
    }
    const allRelations = spinal_env_viewer_graph_service_1.SpinalGraphService.getRelationNames(nodeId);
    const checkedRelations = allRelations.filter(relation => authorizedRelations.includes(relation));
    if (checkedRelations.length === 0)
        return -1;
    const children = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, checkedRelations);
    for (const child of children) {
        const attribute = await findAttribute(child.id.get(), categoryName, attributeName, depth - 1, strictDepth, authorizedRelations);
        if (attribute != -1)
            return attribute;
    }
    return -1;
}
exports.findAttribute = findAttribute;
async function findAttributes(nodeId, categoryName, attributeName, depth, strictDepth, authorizedRelations) {
    if (depth == 0) {
        return await findAllCategoriesAndAttributes(nodeId);
    }
    let results = [];
    if (!strictDepth) {
        results = results.concat(await findAllCategoriesAndAttributes(nodeId));
    }
    if (depth <= 0)
        return results;
    const allRelations = spinal_env_viewer_graph_service_1.SpinalGraphService.getRelationNames(nodeId);
    const checkedRelations = allRelations.filter(relation => authorizedRelations.includes(relation));
    if (checkedRelations.length === 0)
        return results;
    const children = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, checkedRelations);
    for (const child of children) {
        results = results.concat(await findAttributes(child.id.get(), categoryName, attributeName, depth - 1, strictDepth, authorizedRelations));
    }
    return results;
}
exports.findAttributes = findAttributes;
async function findAllCategoriesAndAttributes(followedEntityId) {
    const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(followedEntityId);
    const res = [];
    const categories = await spinal_env_viewer_plugin_documentation_service_1.attributeService.getCategory(node);
    for (const category of categories) {
        const attributes = await spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(node, category);
        for (const attribute of attributes) {
            const obj = attribute.get();
            res.push(`${category.nameCat}:${obj.label}`);
        }
    }
    return res;
}
exports.findAllCategoriesAndAttributes = findAllCategoriesAndAttributes;
async function getValueModelFromEntry(entryDataModel) {
    if (!(entryDataModel instanceof spinal_models_documentation_1.SpinalAttribute)) {
        const element = await entryDataModel.element.load();
        return element.currentValue;
    }
    return entryDataModel.value;
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
            removeFromBinding: obj[`removeFromBinding${i}`],
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
    const contexts = spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType('SpinalSystemServiceTicket');
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
async function getTicketProcess(contextId, processId) {
    const processes = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildrenInContext(contextId, contextId);
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
async function alarmAlreadyDeclared(nodeId, contextId, processId, ticketName) {
    //SpinalNode
    const tickets = await spinal_service_ticket_1.spinalServiceTicket.getAlarmsFromNode(nodeId);
    const found = tickets.find((ticket) => {
        return (contextId == ticket.contextId &&
            processId == ticket.processId &&
            ticket.name == ticketName);
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
async function addTicketAlarm(ticketInfos, configInfo, analyticContextId, outputNodeId, entityNodeId, ticketType) {
    const localizationInfo = await getTicketLocalizationParameters(configInfo);
    const contextId = localizationInfo[CONSTANTS.ATTRIBUTE_TICKET_CONTEXT_ID];
    const processId = localizationInfo[CONSTANTS.ATTRIBUTE_TICKET_PROCESS_ID];
    const context = getTicketContext(contextId);
    const process = await getTicketProcess(context.info.id.get(), processId);
    const alreadyDeclared = await alarmAlreadyDeclared(entityNodeId, contextId, processId, ticketInfos.name);
    if (alreadyDeclared) {
        //just update the ticket
        const firstStep = await spinal_service_ticket_1.serviceTicketPersonalized.getFirstStep(processId, contextId);
        console.log('update ticket ' + ticketInfos.name);
        const declaredTicketNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(alreadyDeclared.id);
        if (declaredTicketNode.info.stepId.get() == firstStep) {
            const attr = await spinal_env_viewer_plugin_documentation_service_1.attributeService.findOneAttributeInCategory(declaredTicketNode, 'default', 'Occurrence number');
            if (attr != -1) {
                // found the attribute
                const value = attr.value.get();
                const str = value.toString();
                const newValueInt = parseInt(str) + 1;
                await spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(declaredTicketNode, 'default', 'Occurrence number', { value: newValueInt.toString() });
                await updateEndpointOccurenceNumber(declaredTicketNode, newValueInt);
            }
        }
        else {
            // move the ticket to the first step and reset the occurrence number
            await spinal_service_ticket_1.serviceTicketPersonalized.moveTicket(declaredTicketNode.info.id.get(), declaredTicketNode.info.stepId.get(), firstStep, contextId);
            await spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(declaredTicketNode, 'default', 'Occurrence number', { value: '1' });
            await updateEndpointOccurenceNumber(declaredTicketNode, 1);
            console.log(`${ticketInfos.name} has been re-triggered and moved back to the first step`);
        }
    }
    else {
        console.log('create ticket ' + ticketInfos.name);
        if (process) {
            try {
                const ticketId = await spinal_service_ticket_1.spinalServiceTicket.addTicket(ticketInfos, process.id.get(), context.info.id.get(), entityNodeId, ticketType);
                if (ticketId instanceof Error)
                    return;
                if (ticketType == 'Alarm') {
                    spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(outputNodeId, ticketId, analyticContextId, spinal_service_ticket_1.ALARM_RELATION_NAME, spinal_service_ticket_1.TICKET_RELATION_TYPE);
                }
                else {
                    spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(outputNodeId, ticketId, analyticContextId, spinal_service_ticket_1.TICKET_RELATION_NAME, spinal_service_ticket_1.TICKET_RELATION_TYPE);
                }
                if (typeof ticketId === 'string') {
                    const declaredTicketNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(ticketId);
                    await spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(declaredTicketNode, 'default', 'Occurrence number', { value: '1' });
                    const endpoint = new InputDataEndpoint_1.InputDataEndpoint('Occurence number', 1, '', spinal_model_bmsnetwork_1.InputDataEndpointDataType.Integer, spinal_model_bmsnetwork_1.InputDataEndpointType.Alarm);
                    const res = new spinal_model_bmsnetwork_1.SpinalBmsEndpoint(endpoint.name, endpoint.path, endpoint.currentValue, endpoint.unit, spinal_model_bmsnetwork_1.InputDataEndpointDataType[endpoint.dataType], spinal_model_bmsnetwork_1.InputDataEndpointType[endpoint.type], endpoint.id);
                    const childId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode({ type: spinal_model_bmsnetwork_1.SpinalBmsEndpoint.nodeTypeName, name: endpoint.name }, res);
                    spinal_env_viewer_graph_service_1.SpinalGraphService.addChild(ticketId, childId, spinal_model_bmsnetwork_1.SpinalBmsEndpoint.relationName, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
                    await serviceTimeseries.getOrCreateTimeSeries(childId);
                    serviceTimeseries.pushFromEndpoint(childId, 1);
                }
            }
            catch (error) {
                console.log('Ticket creation failed');
            }
        }
    }
}
exports.addTicketAlarm = addTicketAlarm;
async function updateEndpointOccurenceNumber(ticketNode, newValue) {
    const endpoints = await ticketNode.getChildren('hasBmsEndpoint');
    endpoints.map(async (endpoint) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(endpoint);
        if (endpoint.info.name.get() == 'Occurence number') {
            serviceTimeseries.pushFromEndpoint(endpoint.info.id.get(), newValue);
            const element = await endpoint.element?.load();
            element.currentValue.set(newValue);
        }
    });
}
async function removeChild(parentNode, childNode, relation) {
    try {
        await parentNode.removeChild(childNode, relation, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
    }
    catch (e) {
        try {
            await parentNode.removeChild(childNode, relation, spinal_env_viewer_graph_service_1.SPINAL_RELATION_LST_PTR_TYPE);
        }
        catch (e) {
            console.log(e);
        }
    }
}
async function safeDeleteNode(nodeId, shouldDeleteChildren = false) {
    const realNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
    const relations = realNode.getRelationNames();
    for (const relation of relations) {
        const children = await realNode.getChildren(relation);
        for (const child of children) {
            await removeChild(realNode, child, relation);
            if (shouldDeleteChildren)
                await child.removeFromGraph();
        }
    }
    await realNode.removeFromGraph();
}
exports.safeDeleteNode = safeDeleteNode;
//# sourceMappingURL=utils.js.map