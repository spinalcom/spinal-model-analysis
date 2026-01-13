import { SpinalNodeRef } from 'spinal-env-viewer-graph-service';
import { INodeDocumentation } from './IAttribute';
export interface IAnalyticDetails {
    entityNodeInfo: SpinalNodeRef;
    analyticName: string;
    config: INodeDocumentation;
    trackingMethod: INodeDocumentation;
    followedEntityId: string;
}
