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

export const CONTEXT_TYPE = "analysisContext";
export const ENTITY_TYPE = "entity";
export const CONTEXT_TO_ENTITY_RELATION = "hasEntity";
export const ANALYSIS_PROCESS_TYPE = "analysisProcess";
export const ENTITY_TO_ANALYSIS_PROCESS_RELATION = "hasAnalysisProcess";
export const ANALYTIC_TYPE = "analytic";
export const ANALYSIS_PROCESS_TO_FOLLOWED_ENTITY_RELATION = "hasFollowedEntity";
export const ANALYSIS_PROCESS_TO_ANALYTIC_RELATION = "hasAnalytic";
export const TRACKED_VARIABLE_METHOD_TYPE = "trackedVariableMethod";
export const ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION= "hasFollowedVariable";

export const TARGET_NODE_TYPES = Object.freeze({
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
export enum ANALYTIC_RESULT_TYPE {
    TICKET = "ticket",
    CONTROL_ENDPOINT = "controlEndpoint",
    API_CALL = "apiCall"
}

export enum TRACK_METHOD {
    ENDPOINT_NAME_FILTER = "endpointFilter",
    CONTROL_ENDPOINT_NAME_FILTER = "controlEndpointFilter",
    TICKET_NAME_FILTER = "ticketFilter"
}

export enum ENTITY_TYPES {
    BUILDING = "geographicBuilding",
    FLOOR = "geographicFloor",
    ROOM = "geographicRoom",
    EQUIPMENT = "BIMObject",
    FLOOR_GROUP = "geographicFloorGroup",
    ROOM_GROUP = "geographicRoomGroup",
    EQUIPMENT_GROUP = "BIMObjectGroup",
    OTHER = "other"
}

export enum ALGORITHMS {
    AVERAGE = "AVERAGE",
    WEIGHTED_AVERAGE = "WEIGHTED_AVERAGE",
    MEDIAN = "MEDIAN",
    ANALYTIC_AND = "ANALYTIC_AND",
    ANALYTIC_OR = "ANALYTIC_OR",
    ANALYTIC_XOR = "ANALYTIC_XOR",
    ANALYTIC_XAND = "ANALYTIC_XAND",
    THRESHOLD_ABOVE = "THRESHOLD_ABOVE",
    THRESHOLD_BELOW = "THRESHOLD_BELOW",
    THRESHOLD_BETWEEN_IN = "THRESHOLD_BETWEEN_IN",
    THRESHOLD_BETWEEN_OUT = "THRESHOLD_BETWEEN_OUT"
}