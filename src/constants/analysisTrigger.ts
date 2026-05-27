import { ANALYSIS_NODE_TYPE } from "./analysisNode";

export const TRIGGER_NODE_NAME = 'Trigger';
export const TRIGGER_NODE_TYPE = 'analysisTriggerNode';
export const ANALYSIS_NODE_TO_TRIGGER_NODE_RELATION = ANALYSIS_NODE_TYPE + 'Has' + TRIGGER_NODE_TYPE;

/**
 * Types of triggers that can start an analysis execution.
 */
export enum TRIGGER_TYPE {
    /** Periodic execution based on a fixed interval in milliseconds */
    INTERVAL_TIME = 'INTERVAL_TIME',
    /** Periodic execution based on a cron expression */
    CRON = 'CRON',
    /** Change-of-value: bind on input register models and execute on change */
    COV = 'COV',
}
