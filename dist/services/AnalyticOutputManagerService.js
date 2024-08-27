"use strict";
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
const SingletonTimeSeries_1 = require("./SingletonTimeSeries");
const AnalyticTwilioManagerService_1 = require("./AnalyticTwilioManagerService");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const InputDataEndpoint_1 = require("../models/InputData/InputDataModel/InputDataEndpoint");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const utils_1 = require("./utils");
const CONSTANTS = require("../constants");
const spinal_service_ticket_1 = require("spinal-service-ticket");
class AnalyticOutputManagerService {
    constructor(analyticNodeManagerService, analyticInputManagerService) {
        this.analyticNodeManagerService = analyticNodeManagerService;
        this.analyticInputManagerService = analyticInputManagerService;
        this.spinalServiceTimeseries = SingletonTimeSeries_1.SingletonServiceTimeseries.getInstance();
    }
    initTwilioManagerService(twilioCredentials) {
        if (!twilioCredentials ||
            !twilioCredentials.accountSid ||
            !twilioCredentials.authToken ||
            !twilioCredentials.fromNumber) {
            return;
        }
        console.log('Creating twilio manager service instance...');
        this.analyticTwilioManagerService = new AnalyticTwilioManagerService_1.default(twilioCredentials.accountSid, twilioCredentials.authToken, twilioCredentials.fromNumber);
    }
    /**
     * Handles the result of an algorithm that creates a ticket or an alarm.
     *
     * @private
     * @param {*} result
     * @param {string} analyticId
     * @param {SpinalNodeRef} configNode
     * @param {SpinalNodeRef} followedEntityNode
     * @param {*} params
     * @param {string} ticketType
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    handleTicketResult(result, analyticId, configAttributes, followedEntityNode, ticketType // Alarm or Ticket
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            if (result == false)
                return {
                    success: true,
                    error: '',
                    resultValue: result,
                    resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET,
                };
            const outputNode = yield this.analyticNodeManagerService.getOutputsNode(analyticId);
            if (!outputNode)
                return { success: false, error: ' Output Node not found' };
            const analyticContextId = this.analyticNodeManagerService.getContextIdOfAnalytic(analyticId);
            if (!analyticContextId)
                return { success: false, error: ' Analytic context id not found' };
            const ticketInfo = {
                name: `${configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_NAME]} : ${followedEntityNode.name.get()}`,
            };
            this.addTicketAlarm(ticketInfo, configAttributes, analyticContextId, outputNode.id.get(), followedEntityNode.id.get(), ticketType);
            return {
                success: true,
                error: '',
                resultValue: result,
                resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET,
            };
        });
    }
    /**
     * Handles the result of an algorithm that modifies a control point.
     *
     * @private
     * @param {*} result
     * @param {SpinalNodeRef} followedEntityNode
     * @param {*} params
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    handleControlEndpointResult(result, followedEntityNode, configAttributes, referenceEpochTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const controlEndpointNode = yield this.analyticInputManagerService.findEndpoint(followedEntityNode.id.get(), configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_NAME], 0, true, [], CONSTANTS.CONTROL_ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
            if (!controlEndpointNode)
                return { success: false, error: ' Control endpoint node not found' };
            const controlEndpoint = yield controlEndpointNode.element.load();
            controlEndpoint.currentValue.set(result);
            const bool = yield this.spinalServiceTimeseries.insertFromEndpoint(controlEndpointNode.id.get(), result, referenceEpochTime);
            if (!bool)
                throw new Error('Failed to insert data in timeseries');
            (0, utils_1.logMessage)(`CP ${controlEndpointNode.name.get()} updated with value : ${result} on ${followedEntityNode.name.get()} at ${referenceEpochTime}`);
            //console.log(`CP ${controlEndpointNode.name.get()} updated with value : , ${result},  on , ${followedEntityNode.name.get()}`)
            return {
                success: true,
                resultValue: result,
                error: '',
                resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.CONTROL_ENDPOINT,
            };
        });
    }
    /**
     * Handles the result of an algorithm that modifies an Endpoint.
     *
     * @private
     * @param {*} result
     * @param {SpinalNodeRef} followedEntityNode
     * @param {*} params
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    handleEndpointResult(result, followedEntityNode, configAttributes, referenceEpochTime) {
        return __awaiter(this, void 0, void 0, function* () {
            let endpointNode = yield this.analyticInputManagerService.findEndpoint(followedEntityNode.id.get(), configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_NAME], 0, true, [], CONSTANTS.ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
            if (!endpointNode &&
                !configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_CREATE_ENDPOINT_IF_NOT_EXIST])
                return { success: false, error: 'Endpoint node not found' };
            if (!endpointNode) {
                endpointNode = yield this.createEndpoint(referenceEpochTime, followedEntityNode.id.get(), configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][CONSTANTS.ATTRIBUTE_RESULT_NAME], result, configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ENDPOINT_PARAMETERS][CONSTANTS.ATTRIBUTE_CREATE_ENDPOINT_UNIT], configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ENDPOINT_PARAMETERS][CONSTANTS.ATTRIBUTE_CREATE_ENDPOINT_MAX_DAYS]);
                if (!endpointNode)
                    return { success: false, error: 'Failed endpoint creation' };
            }
            const endpoint = yield endpointNode.element.load();
            endpoint.currentValue.set(result);
            const bool = yield this.spinalServiceTimeseries.insertFromEndpoint(endpointNode.id.get(), result, referenceEpochTime);
            if (!bool)
                return { success: false, error: 'Failed to insert data in timeseries' };
            (0, utils_1.logMessage)(`EP ${endpointNode.name.get()} updated with value : ${result} on ${followedEntityNode.name.get()} at ${referenceEpochTime}`);
            return {
                success: true,
                resultValue: result,
                error: '',
                resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.ENDPOINT,
            };
        });
    }
    /**
     * Handles the result of an algorithm that sends an SMS.
     *
     * @private
     * @param {*} result
     * @param {SpinalNodeRef} configNode
     * @param {SpinalNodeRef} followedEntityNode
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    handleSMSResult(result, analyticId, configAttributes, followedEntityNode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.analyticTwilioManagerService)
                return { success: false, error: 'Twilio parameters not found' };
            if (result == false)
                return {
                    success: true,
                    resultValue: result,
                    error: '',
                    resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.SMS,
                };
            console.log('SMS result');
            const twilioParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_TWILIO_PARAMETERS];
            const toNumber = twilioParams[CONSTANTS.ATTRIBUTE_PHONE_NUMBER];
            let message = twilioParams[CONSTANTS.ATTRIBUTE_PHONE_MESSAGE];
            const variables = message.match(/[^{}]+(?=\})/g);
            if (variables) {
                for (const variable of variables) {
                    const value = yield this.analyticInputManagerService.getFormattedInputDataByIndex(analyticId, followedEntityNode, variable);
                    message = message.replace(`{${variable}}`, '' + value);
                }
            }
            const entityName = followedEntityNode.name
                .get()
                .replace(/[0-9]/g, '*');
            const axiosResult = yield this.analyticTwilioManagerService.sendMessage(message, toNumber, entityName);
            console.log({ status: axiosResult.status, data: axiosResult.data });
            return {
                success: true,
                resultValue: result,
                error: '',
                resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.SMS,
            };
        });
    }
    handleGChatMessageResult(result, analyticId, configAttributes, followedEntityNode) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Handling Google chat message result');
            if (result == false)
                return {
                    success: true,
                    resultValue: result,
                    error: '',
                    resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE,
                };
            const analyticParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS];
            const gChatParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_GCHAT_PARAMETERS];
            const spaceName = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_SPACE];
            let message = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_MESSAGE];
            const analyticDescription = analyticParams[CONSTANTS.ATTRIBUTE_ANALYTIC_DESCRIPTION];
            const variables = message.match(/[^{}]+(?=\})/g);
            if (variables) {
                for (const variable of variables) {
                    const value = yield this.analyticInputManagerService.getFormattedInputDataByIndex(analyticId, followedEntityNode, variable);
                    message = message.replace(`{${variable}}`, '' + value);
                }
            }
            const resultInfo = {
                success: true,
                resultValue: result,
                error: '',
                spaceName: spaceName,
                message: 'The following message has been triggered by an analytic.\n ' +
                    '\nAnalysis on item : ' +
                    followedEntityNode.name.get() +
                    '\nDescription : ' +
                    analyticDescription +
                    '\nMessage : ' +
                    message,
                resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE,
            };
            return resultInfo;
        });
    }
    handleGChatOrganCardResult(result, analyticId, configAttributes, followedEntityNode) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Handling Google chat organ card result');
            if (result == false)
                return {
                    success: true,
                    resultValue: result,
                    error: '',
                    resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE,
                };
            const analyticParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS];
            const resultParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS];
            const gChatParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_GCHAT_PARAMETERS];
            const title = resultParams[CONSTANTS.ATTRIBUTE_RESULT_NAME];
            const spaceName = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_SPACE];
            let message = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_MESSAGE];
            const variables = message.match(/[^{}]+(?=\})/g);
            if (variables) {
                for (const variable of variables) {
                    const value = yield this.analyticInputManagerService.getFormattedInputDataByIndex(analyticId, followedEntityNode, variable);
                    message = message.replace(`{${variable}}`, '' + value);
                }
            }
            const analyticDescription = analyticParams[CONSTANTS.ATTRIBUTE_ANALYTIC_DESCRIPTION];
            const lastPing = yield this.analyticInputManagerService.findEndpoint(followedEntityNode.id.get(), 'last_ping', 0, true, [], CONSTANTS.ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
            if (!lastPing)
                return {
                    success: false,
                    error: 'endpoint lastPing not found on organ node',
                };
            const lastPingValue = yield this.analyticInputManagerService.getValueModelFromEntry(lastPing);
            const lastPingDate = new Date(lastPingValue.get()).toString();
            const parents = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getParents(followedEntityNode.id.get(), 'HasOrgan');
            let platformName = "Couldn't find the platform name";
            let ipAddress = "Couldn't find the ip adress";
            for (const parent of parents) {
                if (parent.id.get() == ((_a = followedEntityNode.platformId) === null || _a === void 0 ? void 0 : _a.get())) {
                    platformName = (_b = parent.name) === null || _b === void 0 ? void 0 : _b.get();
                    ipAddress = (_c = parent.ipAdress) === null || _c === void 0 ? void 0 : _c.get();
                }
            }
            const card = {
                header: {
                    title: title,
                    subtitle: new Date().toLocaleDateString(),
                },
                sections: [
                    {
                        header: 'Analytic details',
                        widgets: [
                            {
                                keyValue: {
                                    topLabel: 'Analytic description',
                                    content: analyticDescription,
                                },
                            },
                            {
                                keyValue: {
                                    topLabel: 'Message',
                                    content: message,
                                },
                            },
                        ],
                    },
                    {
                        header: 'Organ details',
                        widgets: [
                            {
                                keyValue: {
                                    topLabel: 'Organ name',
                                    content: followedEntityNode.name.get(),
                                },
                            },
                            {
                                keyValue: {
                                    topLabel: 'Organ type',
                                    content: (_d = followedEntityNode.organType) === null || _d === void 0 ? void 0 : _d.get(),
                                },
                            },
                            {
                                keyValue: {
                                    topLabel: 'Last ping',
                                    content: lastPingDate,
                                },
                            },
                        ],
                    },
                    {
                        header: 'Platform details',
                        widgets: [
                            {
                                keyValue: {
                                    topLabel: 'Platform name',
                                    content: platformName,
                                },
                            },
                            {
                                keyValue: {
                                    topLabel: 'Platform id',
                                    content: (_e = followedEntityNode.platformId) === null || _e === void 0 ? void 0 : _e.get(),
                                },
                            },
                            {
                                keyValue: {
                                    topLabel: 'Ip Address',
                                    content: ipAddress,
                                },
                            },
                        ],
                    },
                ],
            };
            const resultInfo = {
                success: true,
                resultValue: result,
                error: '',
                spaceName: spaceName,
                resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_ORGAN_CARD,
                card: card,
            };
            return resultInfo;
        });
    }
    // ticket creation
    /**
     * Gets the ticket context that has the corresponding contextId
     *
     * @param {string} contextId
     * @return {*}
     */
    getTicketContext(contextId) {
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
    getTicketProcess(contextId, processId) {
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
    alarmAlreadyDeclared(nodeId, contextId, processId, ticketName) {
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
    addTicketAlarm(ticketInfos, configAttributes, analyticContextId, outputNodeId, entityNodeId, ticketType) {
        return __awaiter(this, void 0, void 0, function* () {
            const localizationInfo = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS];
            const contextId = localizationInfo[CONSTANTS.ATTRIBUTE_TICKET_CONTEXT_ID];
            const processId = localizationInfo[CONSTANTS.ATTRIBUTE_TICKET_PROCESS_ID];
            const context = this.getTicketContext(contextId);
            const process = yield this.getTicketProcess(context.info.id.get(), processId);
            const alreadyDeclared = yield this.alarmAlreadyDeclared(entityNodeId, contextId, processId, ticketInfos.name);
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
                        yield this.updateEndpointOccurenceNumber(declaredTicketNode, newValueInt);
                    }
                }
                else {
                    // move the ticket to the first step and reset the occurrence number
                    yield spinal_service_ticket_1.serviceTicketPersonalized.moveTicket(declaredTicketNode.info.id.get(), declaredTicketNode.info.stepId.get(), firstStep, contextId);
                    yield spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(declaredTicketNode, 'default', 'Occurrence number', { value: '1' });
                    yield this.updateEndpointOccurenceNumber(declaredTicketNode, 1);
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
                            yield this.spinalServiceTimeseries.getOrCreateTimeSeries(childId);
                            yield this.spinalServiceTimeseries.pushFromEndpoint(childId, 1);
                        }
                    }
                    catch (error) {
                        console.log('Ticket creation failed');
                    }
                }
            }
        });
    }
    updateEndpointOccurenceNumber(ticketNode, newValue) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoints = yield ticketNode.getChildren('hasBmsEndpoint');
            endpoints.map((endpoint) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(endpoint);
                if (endpoint.info.name.get() == 'Occurence number') {
                    this.spinalServiceTimeseries.pushFromEndpoint(endpoint.info.id.get(), newValue);
                    const element = yield ((_a = endpoint.element) === null || _a === void 0 ? void 0 : _a.load());
                    element.currentValue.set(newValue);
                }
            }));
        });
    }
    createEndpoint(referenceEpochTime, parentId, endpointName, initialValue, unit, maxDays) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = new InputDataEndpoint_1.InputDataEndpoint(endpointName, initialValue, unit !== null && unit !== void 0 ? unit : '', spinal_model_bmsnetwork_1.InputDataEndpointDataType.Integer, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
            const res = new spinal_model_bmsnetwork_1.SpinalBmsEndpoint(endpoint.name, endpoint.path, endpoint.currentValue, endpoint.unit, spinal_model_bmsnetwork_1.InputDataEndpointDataType[endpoint.dataType], spinal_model_bmsnetwork_1.InputDataEndpointType[endpoint.type], endpoint.id);
            const childId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode({ type: spinal_model_bmsnetwork_1.SpinalBmsEndpoint.nodeTypeName, name: endpoint.name }, res);
            spinal_env_viewer_graph_service_1.SpinalGraphService.addChild(parentId, childId, spinal_model_bmsnetwork_1.SpinalBmsEndpoint.relationName, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
            yield this.spinalServiceTimeseries.getOrCreateTimeSeries(childId);
            yield this.spinalServiceTimeseries.insertFromEndpoint(childId, initialValue, referenceEpochTime);
            const realNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(childId);
            yield spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(realNode, 'default', 'timeSeries maxDay', { value: maxDays });
            return spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(childId);
        });
    }
}
exports.default = AnalyticOutputManagerService;
//# sourceMappingURL=AnalyticOutputManagerService.js.map