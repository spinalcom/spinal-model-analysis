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
export const ANALYTIC_TYPE = "analytic";
export const TRACKING_METHOD_TYPE = "trackingMethod";
export const INPUTS_TYPE = "analyticInputs";
export const OUTPUTS_TYPE = "analyticOutputs";
export const CONFIG_TYPE = "analyticConfig";


export const CONTEXT_TO_ENTITY_RELATION = "hasEntity";
export const ENTITY_TO_ANALYTIC_RELATION = "hasAnalytics";

export const ANALYTIC_TO_INPUTS_RELATION = "hasInputs";
export const ANALYTIC_TO_OUTPUTS_RELATION = "hasOutputs";
export const ANALYTIC_TO_CONFIG_RELATION = "hasConfig";


export const ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION = "hasEntity";
export const ANALYTIC_INPUTS_TO_TRACKING_METHOD_RELATION= "hasTrackingMethod";



export const GROUP_RELATION_PREFIX = "groupHas";

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


// *** Categories ***
export const CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS = "Algorithm parameters";
export const CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS = "Ticket localization parameters";
export const CATEGORY_ATTRIBUTE_RESULT_PARAMETERS = "Result parameters";
export const CATEGORY_ATTRIBUTE_TRACKING_METHOD_PARAMETERS = "Tracking parameters";
export const CATEGORY_ATTRIBUTE_TWILIO_PARAMETERS = "Twilio parameters";
export const CATEGORY_ATTRIBUTE_TRIGGER_PARAMETERS = "Trigger parameters";  
export const CATEGORY_ATTRIBUTE_IO_DEPENDENCIES = "IO dependencies";
export const CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS = "Analytic parameters";
export const CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING = "Algorithm index mapping";


export const ATTRIBUTE_PHONE_NUMBER = "Phone number";
export const ATTRIBUTE_PHONE_MESSAGE = "Phone message";
export const ATTRIBUTE_TRACKING_METHOD= "Tracking method"
export const ATTRIBUTE_FILTER_VALUE = "Filter value";
export const ATTRIBUTE_TIMESERIES= "Timeseries intervalTime"

export const ATTRIBUTE_SEPARATOR="_"
export const ATTRIBUTE_VALUE_SEPARATOR=","

export const ATTRIBUTE_RESULT_TYPE = "Result type";
export const ATTRIBUTE_RESULT_NAME = "Result name";

export const ATTRIBUTE_ANALYTIC_STATUS = "Status";
export const ATTRIBUTE_ANALYTIC_DESCRIPTION = "Description";

export const ATTRIBUTE_TRIGGER_AT_START = "Trigger at start";
export const ATTRIBUTE_TICKET_CONTEXT_ID = "Ticket context id";
export const ATTRIBUTE_TICKET_PROCESS_ID = "Ticket category id";
export const ATTRIBUTE_ALARM_PRIORITY = "Alarm priority";





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
    ALARM = "alarm",
    SMS = "sms"

}

export enum TRACK_METHOD {
    ENDPOINT_NAME_FILTER = "endpointFilter",
    CONTROL_ENDPOINT_NAME_FILTER = "controlEndpointFilter",
    ATTRIBUTE_NAME_FILTER = "attributeFilter",
}

export enum TRIGGER_TYPE {
    CHANGE_OF_VALUE = "changeOfValue",
    CHANGE_OF_VALUE_WITH_THRESHOLD = "changeOfValueWithThreshold",
    INTERVAL_TIME = "intervalTime"
}

export enum ANALYTIC_STATUS {
    ACTIVE = "Active",
    INACTIVE = "Inactive"
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

