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
exports.ALGORITHMS = exports.ENTITY_TYPES = exports.TRACK_METHOD = exports.ANALYTIC_RESULT_TYPE = exports.TARGET_NODE_TYPES = exports.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION = exports.TRACKED_VARIABLE_METHOD_TYPE = exports.ANALYSIS_PROCESS_TO_ANALYTIC_RELATION = exports.ANALYSIS_PROCESS_TO_FOLLOWED_ENTITY_RELATION = exports.ANALYTIC_TYPE = exports.ENTITY_TO_ANALYSIS_PROCESS_RELATION = exports.ANALYSIS_PROCESS_TYPE = exports.CONTEXT_TO_ENTITY_RELATION = exports.ENTITY_TYPE = exports.CONTEXT_TYPE = void 0;
exports.CONTEXT_TYPE = "analysisContext";
exports.ENTITY_TYPE = "entity";
exports.CONTEXT_TO_ENTITY_RELATION = "hasEntity";
exports.ANALYSIS_PROCESS_TYPE = "analysisProcess";
exports.ENTITY_TO_ANALYSIS_PROCESS_RELATION = "hasAnalysisProcess";
exports.ANALYTIC_TYPE = "analytic";
exports.ANALYSIS_PROCESS_TO_FOLLOWED_ENTITY_RELATION = "hasFollowedEntity";
exports.ANALYSIS_PROCESS_TO_ANALYTIC_RELATION = "hasAnalytic";
exports.TRACKED_VARIABLE_METHOD_TYPE = "trackedVariableMethod";
exports.ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION = "hasFollowedVariable";
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
    ALGORITHMS["AVERAGE"] = "AVERAGE";
    ALGORITHMS["WEIGHTED_AVERAGE"] = "WEIGHTED_AVERAGE";
    ALGORITHMS["MEDIAN"] = "MEDIAN";
    ALGORITHMS["ANALYTIC_AND"] = "ANALYTIC_AND";
    ALGORITHMS["ANALYTIC_OR"] = "ANALYTIC_OR";
    ALGORITHMS["ANALYTIC_XOR"] = "ANALYTIC_XOR";
    ALGORITHMS["ANALYTIC_XAND"] = "ANALYTIC_XAND";
    ALGORITHMS["THRESHOLD_ABOVE"] = "THRESHOLD_ABOVE";
    ALGORITHMS["THRESHOLD_BELOW"] = "THRESHOLD_BELOW";
    ALGORITHMS["THRESHOLD_BETWEEN_IN"] = "THRESHOLD_BETWEEN_IN";
    ALGORITHMS["THRESHOLD_BETWEEN_OUT"] = "THRESHOLD_BETWEEN_OUT";
})(ALGORITHMS = exports.ALGORITHMS || (exports.ALGORITHMS = {}));
//# sourceMappingURL=constants.js.map