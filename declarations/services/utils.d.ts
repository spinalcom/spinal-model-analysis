import { SpinalNodeRef } from "spinal-env-viewer-graph-service";
export declare function findControlPoint(parentId: string, filterName: string): Promise<SpinalNodeRef | undefined>;
export declare function getAlgorithmParameters(config: SpinalNodeRef): Promise<{}>;
export declare function findEndpoints(followedEntityId: string, filterNameValue: string): Promise<SpinalNodeRef[]>;
export declare function findControlEndpoints(followedEntityId: string, filterNameValue: string): Promise<SpinalNodeRef[]>;
export declare function addTicketAlarm(ticketInfos: any, nodeId: string): Promise<void>;
export declare function addTicketPersonalized(ticketInfos: any, processId: string, parentId: string): Promise<void>;
