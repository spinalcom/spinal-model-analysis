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
    Building: string;
    Floor: string;
    Room: string;
    Equipment: string;
    "Floor Group": string;
    "Room Group": string;
    "Equipment Group": string;
    Other: undefined;
}>;
export declare const CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS = "Algorithm parameters";
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
    MODIFY_CONTROL_ENDPOINT = "modifyControlEndpoint",
    API_CALL = "apiCall"
}
export declare enum TRACK_METHOD {
    ENDPOINT_NAME_FILTER = "endpointFilter",
    CONTROL_ENDPOINT_NAME_FILTER = "controlEndpointFilter",
    TICKET_NAME_FILTER = "ticketFilter"
}
export declare enum ENTITY_TYPES {
    BUILDING = "geographicBuilding",
    FLOOR = "geographicFloor",
    ROOM = "geographicRoom",
    EQUIPMENT = "BIMObject",
    FLOOR_GROUP = "geographicFloorGroup",
    ROOM_GROUP = "geographicRoomGroup",
    EQUIPMENT_GROUP = "BIMObjectGroup",
    OTHER = "other"
}
export declare enum ALGORITHMS {
    THRESHOLD_ABOVE = "THRESHOLD_ABOVE",
    THRESHOLD_BELOW = "THRESHOLD_BELOW",
    THRESHOLD_BETWEEN_IN = "THRESHOLD_BETWEEN_IN",
    THRESHOLD_BETWEEN_OUT = "THRESHOLD_BETWEEN_OUT",
    PUTVALUE = "PUTVALUE"
}
export declare const ALGO_DOC: {
    THRESHOLD_ABOVE: {
        name: string;
        type: string;
        description: string;
    }[];
    THRESHOLD_BELOW: {
        name: string;
        type: string;
        description: string;
    }[];
    THRESHOLD_BETWEEN_IN: {
        name: string;
        type: string;
        description: string;
    }[];
    THRESHOLD_BETWEEN_OUT: {
        name: string;
        type: string;
        description: string;
    }[];
    PUTVALUE: {
        name: string;
        type: string;
        description: string;
    }[];
};
export declare const ALGO_DOC_DESCRIPTION: {
    THRESHOLD_ABOVE: string;
    THRESHOLD_BELOW: string;
    THRESHOLD_BETWEEN_IN: string;
    THRESHOLD_BETWEEN_OUT: string;
    PUTVALUE: string;
};
