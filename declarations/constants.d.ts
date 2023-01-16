export declare const CONTEXT_TYPE = "analysisContext";
export declare const ENTITY_TYPE = "entity";
export declare const CONTEXT_TO_ENTITY_RELATION = "hasEntity";
export declare const ANALYSIS_PROCESS_TYPE = "analysisProcess";
export declare const ENTITY_TO_ANALYSIS_PROCESS_RELATION = "hasAnalysisProcess";
export declare const ANALYTIC_TYPE = "analytic";
export declare const ANALYSIS_PROCESS_TO_FOLLOWED_ENTITY_RELATION = "hasFollowedEntity";
export declare const ANALYSIS_PROCESS_TO_ANALYTIC_RELATION = "hasAnalytic";
export declare const ANALYSIS_PROCESS_TO_FOLLOWED_VARIABLE_RELATION = "hasFollowedVariable";
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
/**
 * The different types of results that an analytic can lead to.
 *
 * If you add a new type, you must also add it to the ANALYTIC_RESULT_TYPE enum in the spinal-env-viewer-plugin-analytics/src/constants.ts file
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
    API_CALL = "apiCall"
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
