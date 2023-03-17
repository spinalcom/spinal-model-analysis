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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALGO_DOC_DESCRIPTION = exports.ALGO_DOC = exports.ALGORITHMS = exports.ENTITY_TYPES = exports.TRACK_METHOD = exports.ANALYTIC_RESULT_TYPE = exports.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS = exports.TARGET_NODE_TYPES = exports.GROUP_RELATION_PREFIX = exports.ANALYTIC_INPUTS_TO_TRACKING_METHOD_RELATION = exports.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION = exports.ANALYTIC_TO_CONFIG_RELATION = exports.ANALYTIC_TO_OUTPUTS_RELATION = exports.ANALYTIC_TO_INPUTS_RELATION = exports.ENTITY_TO_ANALYTIC_RELATION = exports.CONTEXT_TO_ENTITY_RELATION = exports.CONFIG_TYPE = exports.OUTPUTS_TYPE = exports.INPUTS_TYPE = exports.TRACKING_METHOD_TYPE = exports.ANALYTIC_TYPE = exports.ENTITY_TYPE = exports.CONTEXT_TYPE = void 0;
exports.CONTEXT_TYPE = "analysisContext";
exports.ENTITY_TYPE = "entity";
exports.ANALYTIC_TYPE = "analytic";
exports.TRACKING_METHOD_TYPE = "trackingMethod";
exports.INPUTS_TYPE = "analyticInputs";
exports.OUTPUTS_TYPE = "analyticOutputs";
exports.CONFIG_TYPE = "analyticConfig";
exports.CONTEXT_TO_ENTITY_RELATION = "hasEntity";
exports.ENTITY_TO_ANALYTIC_RELATION = "hasAnalytics";
exports.ANALYTIC_TO_INPUTS_RELATION = "hasInputs";
exports.ANALYTIC_TO_OUTPUTS_RELATION = "hasOutputs";
exports.ANALYTIC_TO_CONFIG_RELATION = "hasConfig";
exports.ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION = "hasEntity";
exports.ANALYTIC_INPUTS_TO_TRACKING_METHOD_RELATION = "hasTrackingMethod";
exports.GROUP_RELATION_PREFIX = "groupHas";
exports.TARGET_NODE_TYPES = Object.freeze({
    "Building": "geographicBuilding",
    "Floor": "geographicFloor",
    "Room": "geographicRoom",
    "Equipment": "BIMObject",
    "Floor Group": "geographicFloorGroup",
    "Room Group": "geographicRoomGroup",
    "Equipment Group": "BIMObjectGroup",
    "Other": undefined
});
exports.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS = "Algorithm parameters";
/**
 * The different types of results that an analytic can lead to.
 *
 * If you add a new type, you must also add it to the ANALYTIC_RESULT_TYPE enum in the spinal-model-analysis/src/constants.ts file
 *
 * A ticket result type will lead to a ticket being created (with the resultName as the title of the ticket or occurence  of already existing ticket incremented by 1)
 * This type of result works well with Change Of Value triggers since we usually want event based tickets
 *
 * A controlEndpoint result type will lead to a controlEndpoint being updated
 * (with the resultName as the name of the controlEndpoint and it has to be linked to the followed entity)
 *
 *
 */
var ANALYTIC_RESULT_TYPE;
(function (ANALYTIC_RESULT_TYPE) {
    ANALYTIC_RESULT_TYPE["TICKET"] = "ticket";
    ANALYTIC_RESULT_TYPE["CONTROL_ENDPOINT"] = "controlEndpoint";
    ANALYTIC_RESULT_TYPE["MODIFY_CONTROL_ENDPOINT"] = "modifyControlEndpoint";
    ANALYTIC_RESULT_TYPE["API_CALL"] = "apiCall";
})(ANALYTIC_RESULT_TYPE = exports.ANALYTIC_RESULT_TYPE || (exports.ANALYTIC_RESULT_TYPE = {}));
var TRACK_METHOD;
(function (TRACK_METHOD) {
    TRACK_METHOD["ENDPOINT_NAME_FILTER"] = "endpointFilter";
    TRACK_METHOD["CONTROL_ENDPOINT_NAME_FILTER"] = "controlEndpointFilter";
    TRACK_METHOD["TICKET_NAME_FILTER"] = "ticketFilter";
})(TRACK_METHOD = exports.TRACK_METHOD || (exports.TRACK_METHOD = {}));
var ENTITY_TYPES;
(function (ENTITY_TYPES) {
    ENTITY_TYPES["BUILDING"] = "geographicBuilding";
    ENTITY_TYPES["FLOOR"] = "geographicFloor";
    ENTITY_TYPES["ROOM"] = "geographicRoom";
    ENTITY_TYPES["EQUIPMENT"] = "BIMObject";
    ENTITY_TYPES["FLOOR_GROUP"] = "geographicFloorGroup";
    ENTITY_TYPES["ROOM_GROUP"] = "geographicRoomGroup";
    ENTITY_TYPES["EQUIPMENT_GROUP"] = "BIMObjectGroup";
    ENTITY_TYPES["OTHER"] = "other";
})(ENTITY_TYPES = exports.ENTITY_TYPES || (exports.ENTITY_TYPES = {}));
var ALGORITHMS;
(function (ALGORITHMS) {
    //AVERAGE = "AVERAGE",
    //WEIGHTED_AVERAGE = "WEIGHTED_AVERAGE",
    //MEDIAN = "MEDIAN",
    //ANALYTIC_AND = "ANALYTIC_AND",
    //ANALYTIC_OR = "ANALYTIC_OR",
    //ANALYTIC_XOR = "ANALYTIC_XOR",
    //ANALYTIC_XAND = "ANALYTIC_XAND",
    ALGORITHMS["THRESHOLD_ABOVE"] = "THRESHOLD_ABOVE";
    ALGORITHMS["THRESHOLD_BELOW"] = "THRESHOLD_BELOW";
    ALGORITHMS["THRESHOLD_BETWEEN_IN"] = "THRESHOLD_BETWEEN_IN";
    ALGORITHMS["THRESHOLD_BETWEEN_OUT"] = "THRESHOLD_BETWEEN_OUT";
    ALGORITHMS["PUTVALUE"] = "PUTVALUE";
})(ALGORITHMS = exports.ALGORITHMS || (exports.ALGORITHMS = {}));
exports.ALGO_DOC = {
    "THRESHOLD_ABOVE": [{ name: "p1", type: "number", description: "the threshold value" }],
    "THRESHOLD_BELOW": [{ name: "p1", type: "number", description: "the threshold value" }],
    "THRESHOLD_BETWEEN_IN": [{ name: "p1", type: "number", description: "the first threshold value" },
        { name: "p2", type: "number", description: "the second threshold value" }],
    "THRESHOLD_BETWEEN_OUT": [{ name: "p1", type: "number", description: "the first threshold value" },
        { name: "p2", type: "number", description: "the second threshold value" }],
    "PUTVALUE": [{ name: "p1", type: "number", description: "the value to inject" }],
};
exports.ALGO_DOC_DESCRIPTION = {
    "THRESHOLD_ABOVE": "This algorithm returns true if the input is above the threshold set by the user",
    "THRESHOLD_BELOW": "This algorithm returns true true if the input is below the threshold set by the user",
    "THRESHOLD_BETWEEN_IN": "This algorithm returns true if the input is between the two thresholds set by the user",
    "THRESHOLD_BETWEEN_OUT": "This algorithm returns true if the input is outside the two thresholds set by the user",
    "PUTVALUE": "This algorithm injects the value set by the user",
};
//# sourceMappingURL=constants.js.map