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
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const spinal_models_documentation_1 = require("spinal-models-documentation");
const SingletonTimeSeries_1 = require("./SingletonTimeSeries");
const CONSTANTS = require("../constants");
class AnalyticInputManagerService {
    constructor(analyticNodeManagerService) {
        this.analyticNodeManagerService = analyticNodeManagerService;
        this.spinalServiceTimeseries = SingletonTimeSeries_1.SingletonServiceTimeseries.getInstance();
    }
    /**
     *
     * @async
     * @param {string} trackMethod - The type of filter.
     * @param {string} filterValue - The filter value to use.
     * @param {SpinalNodeRef} followedEntity - The SpinalNodeRef object representing the Followed Entity to which the Tracking Method should be applied.
     * @returns {*} {Promise<SpinalNodeRef[] | SpinalNodeRef | undefined>} - A Promise that resolves with the results of the applied Tracking Method.
     * @memberof AnalyticService
     */
    applyTrackingMethodWithParams(followedEntity, trackMethod, filterValue, depth, strictDepth, authorizedRelations, multipleModels = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (followedEntity) {
                switch (trackMethod) {
                    case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER: {
                        if (multipleModels) {
                            const endpoints = yield this.findEndpoints(followedEntity.id.get(), filterValue, depth, strictDepth, authorizedRelations, CONSTANTS.ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
                            return endpoints;
                        }
                        const endpoint = yield this.findEndpoint(followedEntity.id.get(), filterValue, depth, strictDepth, authorizedRelations, CONSTANTS.ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
                        return endpoint;
                    }
                    case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER: {
                        if (multipleModels) {
                            const controlEndpoints = yield this.findEndpoints(followedEntity.id.get(), filterValue, depth, strictDepth, authorizedRelations, CONSTANTS.CONTROL_ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
                            return controlEndpoints;
                        }
                        const controlEndpoint = yield this.findEndpoint(followedEntity.id.get(), filterValue, depth, strictDepth, authorizedRelations, CONSTANTS.CONTROL_ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
                        return controlEndpoint;
                    }
                    case CONSTANTS.TRACK_METHOD.ATTRIBUTE_NAME_FILTER: {
                        const [first, second] = filterValue.split(':');
                        const foundAttribute = yield this.findAttribute(followedEntity.id.get(), first, second, depth, strictDepth, authorizedRelations);
                        if (foundAttribute == -1)
                            return undefined;
                        return foundAttribute;
                        //}
                    }
                    default:
                        console.log('Track method not recognized');
                }
            }
        });
    }
    /**
     * Gets the targeted entities for an analytic.
     *
     * @param {string} analyticId The ID of the analytic.
     * @return {*}  {(Promise<SpinalNodeRef[]|undefined>)} An array of SpinalNodeRefs for the entities
     * @memberof AnalyticService
     */
    getWorkingFollowedEntities(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const followedEntity = yield this.analyticNodeManagerService.getFollowedEntity(analyticId);
            const trackingMethod = yield this.analyticNodeManagerService.getTrackingMethod(analyticId);
            const config = yield this.analyticNodeManagerService.getConfig(analyticId);
            const entityInfo = yield this.analyticNodeManagerService.getEntityFromAnalytic(analyticId);
            if (!entityInfo)
                return;
            const entityType = entityInfo.entityType.get();
            if (followedEntity && trackingMethod && config) {
                if (entityType == followedEntity.type.get()) {
                    // we can continue as planned
                    return [followedEntity];
                }
                if (followedEntity.type.get().includes('group') ||
                    followedEntity.type.get().includes('Group')) {
                    console.log('Anchor entity is a group, trying to find the correct entities with the relation name: ', CONSTANTS.GROUP_RELATION_PREFIX + entityType);
                    return yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(followedEntity.id.get(), [
                        CONSTANTS.GROUP_RELATION_PREFIX + entityType,
                    ]);
                }
                if (followedEntity.type.get().includes('context') ||
                    followedEntity.type.get().includes('Context')) {
                    console.log('Anchor entity is a context, trying to find the correct entities');
                    return yield spinal_env_viewer_graph_service_1.SpinalGraphService.findInContextByType(followedEntity.id.get(), followedEntity.id.get(), entityType);
                }
                console.log('Failed to deduct the correct entities from the anchor entity');
                return [];
            }
        });
    }
    getWorkingFollowedEntitiesWithParam(followedEntity, entityType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (entityType == followedEntity.type.get()) {
                // we can continue as planned
                return [followedEntity];
            }
            if (followedEntity.type.get().includes('group') ||
                followedEntity.type.get().includes('Group')) {
                console.log('Anchor entity is a group, trying to find the correct entities with the relation name: ', CONSTANTS.GROUP_RELATION_PREFIX + entityType);
                return yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(followedEntity.id.get(), [
                    CONSTANTS.GROUP_RELATION_PREFIX + entityType,
                ]);
            }
            if (followedEntity.type.get().includes('context') ||
                followedEntity.type.get().includes('Context')) {
                console.log('Anchor entity is a context, trying to find the correct entities');
                return yield spinal_env_viewer_graph_service_1.SpinalGraphService.findInContextByType(followedEntity.id.get(), followedEntity.id.get(), entityType);
            }
            console.log('Failed to deduct the correct entities from the anchor entity');
            return [];
        });
    }
    getEntryDataModelByInputIndex(analyticId, followedEntity, inputIndex, multipleModels = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackingMethod = yield this.analyticNodeManagerService.getTrackingMethod(analyticId);
            if (!trackingMethod)
                return undefined;
            const inputParams = yield this.analyticNodeManagerService.getAttributesFromNode(trackingMethod.id.get(), inputIndex);
            return yield this.applyTrackingMethodWithParams(followedEntity, inputParams[CONSTANTS.ATTRIBUTE_TRACKING_METHOD], inputParams[CONSTANTS.ATTRIBUTE_FILTER_VALUE], inputParams[CONSTANTS.ATTRIBUTE_SEARCH_DEPTH], inputParams[CONSTANTS.ATTRIBUTE_STRICT_DEPTH], inputParams[CONSTANTS.ATTRIBUTE_SEARCH_RELATIONS].split(CONSTANTS.ATTRIBUTE_VALUE_SEPARATOR), multipleModels);
        });
    }
    getRelationsWithDepth(nodeId, depth) {
        return __awaiter(this, void 0, void 0, function* () {
            const relations = spinal_env_viewer_graph_service_1.SpinalGraphService.getRelationNames(nodeId);
            if (depth <= 0)
                return relations;
            const children = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId);
            for (const child of children) {
                const childRelations = yield this.getRelationsWithDepth(child.id.get(), depth - 1);
                for (const childRelation of childRelations) {
                    if (!relations.includes(childRelation))
                        relations.push(childRelation);
                }
            }
            return relations;
        });
    }
    getChoiceRelationsWithDepth(nodeId, depth) {
        return __awaiter(this, void 0, void 0, function* () {
            const relations = yield this.getRelationsWithDepth(nodeId, depth);
            const usefullRelations = relations.filter((relation) => {
                return (!CONSTANTS.ENDPOINT_RELATIONS.includes(relation) &&
                    !CONSTANTS.CONTROL_ENDPOINT_RELATIONS.includes(relation));
            });
            return usefullRelations;
        });
    }
    getAvailableData(trackMethod, nodeId, filterValue, depth, stricDepth, authorizedRelations) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (trackMethod) {
                case CONSTANTS.TRACK_METHOD.ENDPOINT_NAME_FILTER: {
                    const data = yield this.findEndpoints(nodeId, filterValue, depth, stricDepth, authorizedRelations, CONSTANTS.ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
                    return data.map((endpoint) => endpoint.name.get());
                }
                case CONSTANTS.TRACK_METHOD.CONTROL_ENDPOINT_NAME_FILTER: {
                    const data = yield this.findEndpoints(nodeId, filterValue, depth, stricDepth, authorizedRelations, CONSTANTS.CONTROL_ENDPOINT_RELATIONS, CONSTANTS.ENDPOINT_NODE_TYPE);
                    return data.map((endpoint) => endpoint.name.get());
                }
                case CONSTANTS.TRACK_METHOD.ATTRIBUTE_NAME_FILTER: {
                    const [category, attribute] = filterValue.split(':');
                    const data = yield this.findAttributes(nodeId, category, attribute, depth, stricDepth, authorizedRelations);
                    return data;
                }
                default: {
                    console.log('Get available data not implemented yet for this tracking method');
                    return [];
                }
            }
        });
    }
    findNodes(nodeId, authorizedRelations, nodeType) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = [];
            const children = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, authorizedRelations);
            for (const child of children) {
                if (child.type.get() === nodeType) {
                    res.push(child);
                }
                else {
                    res = res.concat(yield this.findNodes(child.id.get(), authorizedRelations, nodeType));
                }
            }
            return res;
        });
    }
    findSpecificNode(nodeId, filterNameValue, trackedRelations, nodeType) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoints = yield this.findNodes(nodeId, trackedRelations, nodeType);
            return endpoints.find((endpoint) => endpoint.name.get() === filterNameValue);
        });
    }
    findMatchingNodes(nodeId, filterNameValue, trackedRelations, nodeType) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoints = yield this.findNodes(nodeId, trackedRelations, nodeType);
            return endpoints.filter((endpoint) => endpoint.name.get().includes(filterNameValue));
        });
    }
    findEndpoint(nodeId, filterNameValue, depth, strictDepth, authorizedRelations, trackedRelations, nodeType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (depth < 0)
                return undefined;
            // we dont look further
            if (depth == 0) {
                return yield this.findSpecificNode(nodeId, filterNameValue, trackedRelations, nodeType);
            }
            // depth > 0
            if (!strictDepth) {
                const foundEndpoint = yield this.findSpecificNode(nodeId, filterNameValue, trackedRelations, nodeType);
                if (foundEndpoint)
                    return foundEndpoint;
            }
            const allRelations = spinal_env_viewer_graph_service_1.SpinalGraphService.getRelationNames(nodeId);
            const checkedRelations = allRelations.filter((relation) => authorizedRelations.includes(relation));
            if (checkedRelations.length === 0)
                return undefined;
            const children = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, checkedRelations);
            for (const child of children) {
                const endpoint = yield this.findEndpoint(child.id.get(), filterNameValue, depth - 1, strictDepth, authorizedRelations, trackedRelations, nodeType);
                if (endpoint)
                    return endpoint;
            }
            return undefined;
        });
    }
    findEndpoints(nodeId, filterNameValue, depth, strictDepth, authorizedRelations, trackedRelations, nodeType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (depth == 0) {
                return yield this.findMatchingNodes(nodeId, filterNameValue, trackedRelations, nodeType);
            }
            let results = [];
            if (!strictDepth) {
                results = results.concat(yield this.findMatchingNodes(nodeId, filterNameValue, trackedRelations, nodeType));
            }
            if (depth <= 0)
                return results;
            const allRelations = spinal_env_viewer_graph_service_1.SpinalGraphService.getRelationNames(nodeId);
            const checkedRelations = allRelations.filter((relation) => authorizedRelations.includes(relation));
            if (checkedRelations.length === 0)
                return results;
            const children = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, checkedRelations);
            for (const child of children) {
                results = results.concat(yield this.findEndpoints(child.id.get(), filterNameValue, depth - 1, strictDepth, authorizedRelations, trackedRelations, nodeType));
            }
            return results;
        });
    }
    findAttribute(nodeId, categoryName, attributeName, depth, strictDepth, authorizedRelations) {
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
                const attribute = yield this.findAttribute(child.id.get(), categoryName, attributeName, depth - 1, strictDepth, authorizedRelations);
                if (attribute != -1)
                    return attribute;
            }
            return -1;
        });
    }
    findAttributes(nodeId, categoryName, attributeName, depth, strictDepth, authorizedRelations) {
        return __awaiter(this, void 0, void 0, function* () {
            if (depth == 0) {
                return yield this.findAllCategoriesAndAttributes(nodeId);
            }
            let results = [];
            if (!strictDepth) {
                results = results.concat(yield this.findAllCategoriesAndAttributes(nodeId));
            }
            if (depth <= 0)
                return results;
            const allRelations = spinal_env_viewer_graph_service_1.SpinalGraphService.getRelationNames(nodeId);
            const checkedRelations = allRelations.filter((relation) => authorizedRelations.includes(relation));
            if (checkedRelations.length === 0)
                return results;
            const children = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, checkedRelations);
            for (const child of children) {
                results = results.concat(yield this.findAttributes(child.id.get(), categoryName, attributeName, depth - 1, strictDepth, authorizedRelations));
            }
            return results;
        });
    }
    findAllCategoriesAndAttributes(followedEntityId) {
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
    getValueModelFromEntry(entryDataModel) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(entryDataModel instanceof spinal_models_documentation_1.SpinalAttribute)) {
                const element = yield entryDataModel.element.load();
                return element.currentValue;
            }
            return entryDataModel.value;
        });
    }
    formatTrackingMethodsToList(obj) {
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
    filterAlgorithmParametersAttributesByIndex(algoParams, indexName) {
        const result = {};
        for (const key in algoParams) {
            if (key.startsWith(indexName)) {
                const newKey = key.replace(indexName + CONSTANTS.ATTRIBUTE_SEPARATOR, '');
                result[newKey] = algoParams[key];
            }
        }
        return result;
    }
    getFormattedInputDataByIndex(analyticId, followedEntity, inputIndex, referenceEpochTime = Date.now()) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackingMethod = yield this.analyticNodeManagerService.getTrackingMethod(analyticId);
            if (!trackingMethod)
                return undefined;
            const trackingParams = yield this.analyticNodeManagerService.getAttributesFromNode(trackingMethod.id.get(), inputIndex);
            const entryDataModel = yield this.getEntryDataModelByInputIndex(analyticId, followedEntity, inputIndex, trackingParams[CONSTANTS.ATTRIBUTE_MULTIPLE_MODELS] || false);
            if (!entryDataModel)
                return undefined;
            if (!trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] ||
                trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] == 0) {
                //test if entryDataModel is array ( spinalNodeRed[] )
                if (Array.isArray(entryDataModel)) {
                    const res = [];
                    for (const entry of entryDataModel) {
                        const currentValue = yield this.getValueModelFromEntry(entry);
                        const assertedValue = currentValue.get();
                        res.push(assertedValue);
                    }
                    return res;
                }
                const currentValue = yield this.getValueModelFromEntry(entryDataModel);
                const assertedValue = currentValue.get();
                return assertedValue;
            }
            else {
                if (Array.isArray(entryDataModel)) {
                    throw new Error('Does not support multiple timeseries in 1 input');
                }
                const spinalTs = yield this.spinalServiceTimeseries.getOrCreateTimeSeries(entryDataModel.id.get());
                const end = referenceEpochTime;
                const start = end - trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES];
                const injectLastValueBeforeStart = trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES_VALUE_AT_START];
                let data = injectLastValueBeforeStart
                    ? yield spinalTs.getFromIntervalTime(start, end, true)
                    : yield spinalTs.getFromIntervalTime(start, end);
                if (injectLastValueBeforeStart) {
                    data = this.timeseriesPreProcessing(start, end, data); // tidy up the data mainly at start and end
                }
                return data;
            }
        });
    }
    getFormattedInputData(analyticId, followedEntity, inputIndex, executionTimes = [Date.now()]) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputData = {};
            const trackingMethod = yield this.analyticNodeManagerService.getTrackingMethod(analyticId);
            if (!trackingMethod)
                return undefined;
            const trackingParams = yield this.analyticNodeManagerService.getAttributesFromNode(trackingMethod.id.get(), inputIndex);
            const entryDataModel = yield this.getEntryDataModelByInputIndex(analyticId, followedEntity, inputIndex, trackingParams[CONSTANTS.ATTRIBUTE_MULTIPLE_MODELS] || false);
            if (!entryDataModel)
                return undefined;
            if (trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] < 0) {
                throw new Error('Timeseries intervalTime cannot be negative');
            }
            if (!trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] ||
                trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES] == 0) {
                //add the current value for each executionTime
                if (Array.isArray(entryDataModel)) {
                    const res = [];
                    for (const entry of entryDataModel) {
                        const currentValue = yield this.getValueModelFromEntry(entry);
                        const assertedValue = currentValue.get();
                        res.push(assertedValue);
                    }
                    for (const execTime of executionTimes) {
                        inputData[execTime] = res;
                    }
                }
                else {
                    const currentValue = yield this.getValueModelFromEntry(entryDataModel);
                    const assertedValue = currentValue.get();
                    for (const execTime of executionTimes) {
                        inputData[execTime] = assertedValue;
                    }
                }
            }
            else {
                if (Array.isArray(entryDataModel)) {
                    throw new Error('Timeseries and multiple input capture is not compatible');
                }
                // add the timeseries data for each executionTime
                const oldestTime = Math.min(...executionTimes);
                const closestTime = Math.max(...executionTimes);
                const spinalTs = yield this.spinalServiceTimeseries.getOrCreateTimeSeries(entryDataModel.id.get());
                const end = closestTime;
                const start = oldestTime - trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES];
                const injectLastValueBeforeStart = trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES_VALUE_AT_START];
                const data = yield spinalTs.getFromIntervalTime(start, end, injectLastValueBeforeStart);
                for (const execTime of executionTimes) {
                    const execTimeStart = execTime - trackingParams[CONSTANTS.ATTRIBUTE_TIMESERIES];
                    const processedData = this.timeseriesPreProcessingData(execTimeStart, execTime, data, injectLastValueBeforeStart);
                    inputData[execTime] = processedData;
                }
            }
            return inputData;
        });
    }
    getAllDataFromAnalyticConfiguration(analyticId, entity, ioDependencies, executionTimes) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const resultData = {};
            // Get all the inputs (I0, I1, I2, ...)
            const inputs = [];
            const keys = Object.keys(ioDependencies);
            for (const key of keys) {
                const myDependencies = (_b = (_a = ioDependencies[key]) === null || _a === void 0 ? void 0 : _a.split(CONSTANTS.ATTRIBUTE_VALUE_SEPARATOR)) !== null && _b !== void 0 ? _b : [];
                for (const dep of myDependencies) {
                    if (dep.startsWith('I') && !inputs.includes(dep)) {
                        inputs.push(dep);
                    }
                }
            } // end for
            for (const input of inputs) {
                const data = yield this.getFormattedInputData(analyticId, entity, input, executionTimes);
                if (data) {
                    resultData[input] = data;
                }
            }
            return resultData;
        });
    }
    timeseriesPreProcessing(start, end, timeseries) {
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
    timeseriesPreProcessingData(startTime, endTime, timeseries, injectLastValueBeforeStart) {
        let hasInjectedValue = false;
        const resultTimeseries = [];
        if (timeseries.length === 0)
            return [];
        for (const timeserie of timeseries) {
            if (timeserie.date == startTime) {
                hasInjectedValue = true;
                resultTimeseries.push(timeserie);
            }
            else if (timeserie.date > startTime && timeserie.date < endTime) {
                resultTimeseries.push(timeserie);
            }
        } // end for
        if (!hasInjectedValue && injectLastValueBeforeStart) {
            for (let i = timeseries.length - 1; i >= 0; i--) {
                if (timeseries[i].date < startTime) {
                    resultTimeseries.unshift({ date: startTime, value: timeseries[i].value });
                    break;
                }
            }
        }
        if (resultTimeseries.length != 0 && resultTimeseries[resultTimeseries.length - 1].date < endTime) {
            resultTimeseries.push({ date: endTime, value: resultTimeseries[resultTimeseries.length - 1].value });
        }
        return resultTimeseries;
    }
}
exports.default = AnalyticInputManagerService;
//# sourceMappingURL=AnalyticInputManagerService.js.map