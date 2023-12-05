export declare const CONTEXT_TYPE = "analysisContext";
export declare const ENTITY_TYPE = "entity";
export declare const ANALYTIC_TYPE = "analytic";
export declare const TRACKING_METHOD_TYPE = "trackingMethod";
export declare const INPUTS_TYPE = "analyticInputs";
export declare const OUTPUTS_TYPE = "analyticOutputs";
export declare const CONFIG_TYPE = "analyticConfig";
export declare const CONTEXT_TO_ENTITY_RELATION = "hasEntity";
export declare const ENTITY_TO_ANALYTIC_RELATION = "hasAnalytics";
export declare const ANALYTIC_TO_INPUTS_RELATION = "hasInputs";
export declare const ANALYTIC_TO_OUTPUTS_RELATION = "hasOutputs";
export declare const ANALYTIC_TO_CONFIG_RELATION = "hasConfig";
export declare const ANALYTIC_INPUTS_TO_FOLLOWED_ENTITY_RELATION = "hasEntity";
export declare const ANALYTIC_INPUTS_TO_TRACKING_METHOD_RELATION = "hasTrackingMethod";
export declare const GROUP_RELATION_PREFIX = "groupHas";
export declare const TARGET_NODE_TYPES: Readonly<{
    Building: "geographicBuilding";
    Floor: "geographicFloor";
    Room: "geographicRoom";
    Equipment: "BIMObject";
    "Floor Group": "geographicFloorGroup";
    "Room Group": "geographicRoomGroup";
    "Equipment Group": "BIMObjectGroup";
    Other: undefined;
}>;
export declare const CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS = "Algorithm parameters";
export declare const CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS = "Ticket localization parameters";
export declare const CATEGORY_ATTRIBUTE_RESULT_PARAMETERS = "Result parameters";
export declare const CATEGORY_ATTRIBUTE_TRACKING_METHOD_PARAMETERS = "Tracking parameters";
export declare const CATEGORY_ATTRIBUTE_TWILIO_PARAMETERS = "Twilio parameters";
export declare const CATEGORY_ATTRIBUTE_TRIGGER_PARAMETERS = "Trigger parameters";
export declare const CATEGORY_ATTRIBUTE_IO_DEPENDENCIES = "IO dependencies";
export declare const CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS = "Analytic parameters";
export declare const CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING = "Algorithm index mapping";
export declare const ATTRIBUTE_SEPARATOR = "_";
export declare const ATTRIBUTE_VALUE_SEPARATOR = ",";
export declare const ATTRIBUTE_TRACKING_METHOD = "Tracking method";
export declare const ATTRIBUTE_FILTER_VALUE = "Filter value";
export declare const ATTRIBUTE_TIMESERIES = "Timeseries intervalTime";
export declare const ATTRIBUTE_SEARCH_DEPTH = "Search depth";
export declare const ATTRIBUTE_STRICT_DEPTH = "Strict depth";
export declare const ATTRIBUTE_SEARCH_RELATIONS = "Search relations";
export declare const ATTRIBUTE_RESULT_TYPE = "Result type";
export declare const ATTRIBUTE_RESULT_NAME = "Result name";
export declare const ATTRIBUTE_PHONE_NUMBER = "Phone number";
export declare const ATTRIBUTE_PHONE_MESSAGE = "Phone message";
export declare const ATTRIBUTE_TICKET_CONTEXT_ID = "Ticket context id";
export declare const ATTRIBUTE_TICKET_PROCESS_ID = "Ticket category id";
export declare const ATTRIBUTE_ALARM_PRIORITY = "Alarm priority";
export declare const ATTRIBUTE_ANALYTIC_STATUS = "Status";
export declare const ATTRIBUTE_ANALYTIC_DESCRIPTION = "Description";
export declare const ATTRIBUTE_TRIGGER_AT_START = "Trigger at start";
export declare const ENDPOINT_RELATIONS: string[];
export declare const CONTROL_ENDPOINT_RELATIONS: string[];
export declare const ENDPOINT_NODE_TYPE = "BmsEndpoint";
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
export declare enum ANALYTIC_RESULT_TYPE {
    TICKET = "ticket",
    CONTROL_ENDPOINT = "controlEndpoint",
    ALARM = "alarm",
    SMS = "sms",
    LOG = "log"
}
export declare enum TRACK_METHOD {
    ENDPOINT_NAME_FILTER = "endpointFilter",
    CONTROL_ENDPOINT_NAME_FILTER = "controlEndpointFilter",
    ATTRIBUTE_NAME_FILTER = "attributeFilter"
}
export declare enum TRIGGER_TYPE {
    CHANGE_OF_VALUE = "changeOfValue",
    CHANGE_OF_VALUE_WITH_THRESHOLD = "changeOfValueWithThreshold",
    INTERVAL_TIME = "intervalTime",
    CRON = "cron"
}
export declare enum ANALYTIC_STATUS {
    ACTIVE = "Active",
    INACTIVE = "Inactive"
}
export declare enum ENTITY_TYPES {
    BUILDING = "geographicBuilding",
    FLOOR = "geographicFloor",
    ROOM = "geographicRoom",
    EQUIPMENT = "BIMObject",
    FLOOR_GROUP = "geographicFloorGroup",
    ROOM_GROUP = "geographicRoomGroup",
    EQUIPMENT_GROUP = "BIMObjectGroup",
    ORGAN = "MonitoringServiceOrgan",
    OTHER = "other"
}
