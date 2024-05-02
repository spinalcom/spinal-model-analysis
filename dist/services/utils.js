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
exports.createEndpoint = exports.timeseriesPreProcessing = exports.getIntervalTimeMissingExecutionTimes = exports.getCronMissingExecutionTimes = exports.safeDeleteNode = exports.addTicketAlarm = exports.formatTrackingMethodsToList = exports.getValueModelFromEntry = exports.findAllCategoriesAndAttributes = exports.findAttributes = exports.findAttribute = exports.findEndpoints = exports.findEndpoint = exports.findNodes = exports.getAvailableData = exports.getChoiceRelationsWithDepth = exports.getRelationsWithDepth = exports.getTicketLocalizationParameters = exports.getAlgorithmParameters = void 0;
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const spinal_service_ticket_1 = require("spinal-service-ticket");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const InputDataEndpoint_1 = require("../models/InputData/InputDataModel/InputDataEndpoint");
const CONSTANTS = require("../constants");
const spinal_models_documentation_1 = require("spinal-models-documentation");
const SingletonTimeSeries_1 = require("./SingletonTimeSeries");
const cronParser = require("cron-parser");
const serviceTimeseries = SingletonTimeSeries_1.SingletonServiceTimeseries.getInstance();
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
function getRelationsWithDepth(nodeId, depth) {
    return __awaiter(this, void 0, void 0, function* () {
        const relations = spinal_env_viewer_graph_service_1.SpinalGraphService.getRelationNames(nodeId);
        if (depth <= 0)
            return relations;
        const children = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId);
        for (const child of children) {
            const childRelations = yield getRelationsWithDepth(child.id.get(), depth - 1);
            for (const childRelation of childRelations) {
                if (!relations.includes(childRelation))
                    relations.push(childRelation);
            }
        }
        return relations;
    });
}
exports.getRelationsWithDepth = getRelationsWithDepth;
function getChoiceRelationsWithDepth(nodeId, depth) {
    return __awaiter(this, void 0, void 0, function* () {
        const relations = yield getRelationsWithDepth(nodeId, depth);
        const usefullRelations = relations.filter((relation) => {
            return (!CONSTANTS.ENDPOINT_RELATIONS.includes(relation) &&
                !CONSTANTS.CONTROL_ENDPOINT_RELATIONS.includes(relation));
        });
        return usefullRelations;
    });
}
exports.getChoiceRelationsWithDepth = getChoiceRelationsWithDepth;
function getAvailableData(trackMethod, nodeId, filterValue, depth, stricDepth, authorizedRelations) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (trackMethod) {
            case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER: {
                const data = yield findEndpoints(nodeId, filterValue, depth, stricDepth, authorizedRelations, CONSTANTS.ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
                return data.map((endpoint) => endpoint.name.get());
            }
            case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER: {
                const data = yield findEndpoints(nodeId, filterValue, depth, stricDepth, authorizedRelations, CONSTANTS.CONTROL_ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
                return data.map((endpoint) => endpoint.name.get());
            }
            case CONSTANTS.TRACK_METHOD.ATTRIBUTE_NAME_FILTER: {
                const [category, attribute] = filterValue.split(':');
                const data = yield findAttributes(nodeId, category, attribute, depth, stricDepth, authorizedRelations);
                return data;
            }
            default: {
                console.log('Get available data not implemented yet for this tracking method');
                return [];
            }
        }
    });
}
exports.getAvailableData = getAvailableData;
function findNodes(nodeId, authorizedRelations, nodeType) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = [];
        const children = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, authorizedRelations);
        for (const child of children) {
            if (child.type.get() === nodeType) {
                res.push(child);
            }
            else {
                res = res.concat(yield findNodes(child.id.get(), authorizedRelations, nodeType));
            }
        }
        return res;
    });
}
exports.findNodes = findNodes;
function findSpecificNode(nodeId, filterNameValue, trackedRelations, nodeType) {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoints = yield findNodes(nodeId, trackedRelations, nodeType);
        return endpoints.find((endpoint) => endpoint.name.get() === filterNameValue);
    });
}
function findMatchingNodes(nodeId, filterNameValue, trackedRelations, nodeType) {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoints = yield findNodes(nodeId, trackedRelations, nodeType);
        return endpoints.filter((endpoint) => endpoint.name.get().includes(filterNameValue));
    });
}
function findEndpoint(nodeId, filterNameValue, depth, strictDepth, authorizedRelations, trackedRelations, nodeType) {
    return __awaiter(this, void 0, void 0, function* () {
        if (depth < 0)
            return undefined;
        // we dont look further
        if (depth == 0) {
            return yield findSpecificNode(nodeId, filterNameValue, trackedRelations, nodeType);
        }
        // depth > 0
        if (!strictDepth) {
            const foundEndpoint = yield findSpecificNode(nodeId, filterNameValue, trackedRelations, nodeType);
            if (foundEndpoint)
                return foundEndpoint;
        }
        const allRelations = spinal_env_viewer_graph_service_1.SpinalGraphService.getRelationNames(nodeId);
        const checkedRelations = allRelations.filter((relation) => authorizedRelations.includes(relation));
        if (checkedRelations.length === 0)
            return undefined;
        const children = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, checkedRelations);
        for (const child of children) {
            const endpoint = yield findEndpoint(child.id.get(), filterNameValue, depth - 1, strictDepth, authorizedRelations, trackedRelations, nodeType);
            if (endpoint)
                return endpoint;
        }
        return undefined;
    });
}
exports.findEndpoint = findEndpoint;
function findEndpoints(nodeId, filterNameValue, depth, strictDepth, authorizedRelations, trackedRelations, nodeType) {
    return __awaiter(this, void 0, void 0, function* () {
        if (depth == 0) {
            return yield findMatchingNodes(nodeId, filterNameValue, trackedRelations, nodeType);
        }
        let results = [];
        if (!strictDepth) {
            results = results.concat(yield findMatchingNodes(nodeId, filterNameValue, trackedRelations, nodeType));
        }
        if (depth <= 0)
            return results;
        const allRelations = spinal_env_viewer_graph_service_1.SpinalGraphService.getRelationNames(nodeId);
        const checkedRelations = allRelations.filter((relation) => authorizedRelations.includes(relation));
        if (checkedRelations.length === 0)
            return results;
        const children = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, checkedRelations);
        for (const child of children) {
            results = results.concat(yield findEndpoints(child.id.get(), filterNameValue, depth - 1, strictDepth, authorizedRelations, trackedRelations, nodeType));
        }
        return results;
    });
}
exports.findEndpoints = findEndpoints;
function findAttribute(nodeId, categoryName, attributeName, depth, strictDepth, authorizedRelations) {
    return __awaiter(this, void 0, void 0, function* () {
        if (depth < 0)
            return -1;
        const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
        // we dont look further
        if (depth == 0) {
            return yield spinal_env_viewer_plugin_documentation_service_1.attributeService.findOneAttributeInCategory(node, categoryName, attributeName);
        }
        // depth > 0
        if (!strictDepth) {
            const foundAttribute = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.findOneAttributeInCategory(node, categoryName, attributeName);
            if (foundAttribute != -1)
                return foundAttribute;
        }
        const allRelations = spinal_env_viewer_graph_service_1.SpinalGraphService.getRelationNames(nodeId);
        const checkedRelations = allRelations.filter((relation) => authorizedRelations.includes(relation));
        if (checkedRelations.length === 0)
            return -1;
        const children = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, checkedRelations);
        for (const child of children) {
            const attribute = yield findAttribute(child.id.get(), categoryName, attributeName, depth - 1, strictDepth, authorizedRelations);
            if (attribute != -1)
                return attribute;
        }
        return -1;
    });
}
exports.findAttribute = findAttribute;
function findAttributes(nodeId, categoryName, attributeName, depth, strictDepth, authorizedRelations) {
    return __awaiter(this, void 0, void 0, function* () {
        if (depth == 0) {
            return yield findAllCategoriesAndAttributes(nodeId);
        }
        let results = [];
        if (!strictDepth) {
            results = results.concat(yield findAllCategoriesAndAttributes(nodeId));
        }
        if (depth <= 0)
            return results;
        const allRelations = spinal_env_viewer_graph_service_1.SpinalGraphService.getRelationNames(nodeId);
        const checkedRelations = allRelations.filter((relation) => authorizedRelations.includes(relation));
        if (checkedRelations.length === 0)
            return results;
        const children = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, checkedRelations);
        for (const child of children) {
            results = results.concat(yield findAttributes(child.id.get(), categoryName, attributeName, depth - 1, strictDepth, authorizedRelations));
        }
        return results;
    });
}
exports.findAttributes = findAttributes;
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
        const found = tickets.find((ticket) => {
            return (contextId == ticket.contextId &&
                processId == ticket.processId &&
                ticket.name == ticketName);
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
function addTicketAlarm(ticketInfos, configAttributes, analyticContextId, outputNodeId, entityNodeId, ticketType) {
    return __awaiter(this, void 0, void 0, function* () {
        const localizationInfo = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS];
        const contextId = localizationInfo[CONSTANTS.ATTRIBUTE_TICKET_CONTEXT_ID];
        const processId = localizationInfo[CONSTANTS.ATTRIBUTE_TICKET_PROCESS_ID];
        const context = getTicketContext(contextId);
        const process = yield getTicketProcess(context.info.id.get(), processId);
        const alreadyDeclared = yield alarmAlreadyDeclared(entityNodeId, contextId, processId, ticketInfos.name);
        if (alreadyDeclared) {
            //just update the ticket
            const firstStep = yield spinal_service_ticket_1.serviceTicketPersonalized.getFirstStep(processId, contextId);
            console.log('update ticket ' + ticketInfos.name);
            const declaredTicketNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(alreadyDeclared.id);
            if (declaredTicketNode.info.stepId.get() == firstStep) {
                const attr = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.findOneAttributeInCategory(declaredTicketNode, 'default', 'Occurrence number');
                if (attr != -1) {
                    // found the attribute
                    const value = attr.value.get();
                    const str = value.toString();
                    const newValueInt = parseInt(str) + 1;
                    yield spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(declaredTicketNode, 'default', 'Occurrence number', { value: newValueInt.toString() });
                    yield updateEndpointOccurenceNumber(declaredTicketNode, newValueInt);
                }
            }
            else {
                // move the ticket to the first step and reset the occurrence number
                yield spinal_service_ticket_1.serviceTicketPersonalized.moveTicket(declaredTicketNode.info.id.get(), declaredTicketNode.info.stepId.get(), firstStep, contextId);
                yield spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(declaredTicketNode, 'default', 'Occurrence number', { value: '1' });
                yield updateEndpointOccurenceNumber(declaredTicketNode, 1);
                console.log(`${ticketInfos.name} has been re-triggered and moved back to the first step`);
            }
        }
        else {
            console.log('create ticket ' + ticketInfos.name);
            if (process) {
                try {
                    const ticketId = yield spinal_service_ticket_1.spinalServiceTicket.addTicket(ticketInfos, process.id.get(), context.info.id.get(), entityNodeId, ticketType);
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
                        yield spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(declaredTicketNode, 'default', 'Occurrence number', { value: '1' });
                        const endpoint = new InputDataEndpoint_1.InputDataEndpoint('Occurence number', 1, '', spinal_model_bmsnetwork_1.InputDataEndpointDataType.Integer, spinal_model_bmsnetwork_1.InputDataEndpointType.Alarm);
                        const res = new spinal_model_bmsnetwork_1.SpinalBmsEndpoint(endpoint.name, endpoint.path, endpoint.currentValue, endpoint.unit, spinal_model_bmsnetwork_1.InputDataEndpointDataType[endpoint.dataType], spinal_model_bmsnetwork_1.InputDataEndpointType[endpoint.type], endpoint.id);
                        const childId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode({ type: spinal_model_bmsnetwork_1.SpinalBmsEndpoint.nodeTypeName, name: endpoint.name }, res);
                        spinal_env_viewer_graph_service_1.SpinalGraphService.addChild(ticketId, childId, spinal_model_bmsnetwork_1.SpinalBmsEndpoint.relationName, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
                        yield serviceTimeseries.getOrCreateTimeSeries(childId);
                        serviceTimeseries.pushFromEndpoint(childId, 1);
                    }
                }
                catch (error) {
                    console.log('Ticket creation failed');
                }
            }
        }
    });
}
exports.addTicketAlarm = addTicketAlarm;
function updateEndpointOccurenceNumber(ticketNode, newValue) {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoints = yield ticketNode.getChildren('hasBmsEndpoint');
        endpoints.map((endpoint) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(endpoint);
            if (endpoint.info.name.get() == 'Occurence number') {
                serviceTimeseries.pushFromEndpoint(endpoint.info.id.get(), newValue);
                const element = yield ((_a = endpoint.element) === null || _a === void 0 ? void 0 : _a.load());
                element.currentValue.set(newValue);
            }
        }));
    });
}
function removeChild(parentNode, childNode, relation) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield parentNode.removeChild(childNode, relation, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
        }
        catch (e) {
            try {
                yield parentNode.removeChild(childNode, relation, spinal_env_viewer_graph_service_1.SPINAL_RELATION_LST_PTR_TYPE);
            }
            catch (e) {
                console.log(e);
            }
        }
    });
}
function safeDeleteNode(nodeId, shouldDeleteChildren = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const realNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
        const relations = realNode.getRelationNames();
        for (const relation of relations) {
            const children = yield realNode.getChildren(relation);
            for (const child of children) {
                yield removeChild(realNode, child, relation);
                if (shouldDeleteChildren)
                    yield child.removeFromGraph();
            }
        }
        yield realNode.removeFromGraph();
    });
}
exports.safeDeleteNode = safeDeleteNode;
function getCronMissingExecutionTimes(cronSyntax, lastExecutedTime) {
    const now = new Date();
    const lastExecutedDate = new Date(lastExecutedTime);
    const executionTimes = [];
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
            }
            catch (e) {
                // Break the loop if there are no more dates to process
                break;
            }
        }
    }
    catch (err) {
        console.error('Failed to parse cron syntax:', err);
    }
    executionTimes.pop(); // Remove the last date (current time ) as it is
    return executionTimes;
}
exports.getCronMissingExecutionTimes = getCronMissingExecutionTimes;
function getIntervalTimeMissingExecutionTimes(intervalTime, lastExecutedTime) {
    const now = new Date();
    const lastExecutedDate = new Date(lastExecutedTime);
    const executionTimes = [];
    try {
        let nextDate = new Date(lastExecutedDate.getTime() + intervalTime);
        while (nextDate <= now) {
            executionTimes.push(nextDate.getTime());
            nextDate = new Date(nextDate.getTime() + intervalTime);
        }
    }
    catch (err) {
        console.error('Failed to parse interval time:', err);
    }
    return executionTimes;
}
exports.getIntervalTimeMissingExecutionTimes = getIntervalTimeMissingExecutionTimes;
function timeseriesPreProcessing(start, end, timeseries) {
    if (timeseries.length === 0)
        return [];
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
exports.timeseriesPreProcessing = timeseriesPreProcessing;
function createEndpoint(referenceEpochTime, parentId, endpointName, initialValue, unit, maxDays) {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoint = new InputDataEndpoint_1.InputDataEndpoint(endpointName, initialValue, unit !== null && unit !== void 0 ? unit : '', spinal_model_bmsnetwork_1.InputDataEndpointDataType.Integer, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
        const res = new spinal_model_bmsnetwork_1.SpinalBmsEndpoint(endpoint.name, endpoint.path, endpoint.currentValue, endpoint.unit, spinal_model_bmsnetwork_1.InputDataEndpointDataType[endpoint.dataType], spinal_model_bmsnetwork_1.InputDataEndpointType[endpoint.type], endpoint.id);
        const childId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode({ type: spinal_model_bmsnetwork_1.SpinalBmsEndpoint.nodeTypeName, name: endpoint.name }, res);
        spinal_env_viewer_graph_service_1.SpinalGraphService.addChild(parentId, childId, spinal_model_bmsnetwork_1.SpinalBmsEndpoint.relationName, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
        yield serviceTimeseries.getOrCreateTimeSeries(childId);
        serviceTimeseries.insertFromEndpoint(childId, initialValue, referenceEpochTime);
        const realNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(childId);
        yield spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(realNode, 'default', 'timeSeries maxDay', { value: maxDays });
        return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(childId);
    });
}
exports.createEndpoint = createEndpoint;
//# sourceMappingURL=utils.js.map