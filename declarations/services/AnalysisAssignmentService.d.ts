import { Model } from 'spinal-core-connectorjs_type';
/**
 * Organ-analysis assignment: which analyses each deployed organ manages.
 *
 * To split load across several spinal-organ-analysis instances, each organ owns a small
 * file in the hub drive at `/etc/Organs/Analysis/<ORGAN_NAME>` holding an assignment record:
 *
 *   { enabled: Bool,  analytics: Lst<Str> }
 *
 * - `enabled = false` (default) → the organ runs ALL Active analyses (the original behavior).
 *   The feature is fully opt-in; an organ with no file, or a file with enabled=false, is
 *   unchanged from before.
 * - `enabled = true` → the organ runs ONLY the Active analyses whose id is in `analytics`.
 *   Analyses not in any organ's list are run by nobody (explicit — the api-server surfaces them).
 *
 * This module owns the record shape so both spinal-organ-analysis (reads its own file to
 * filter) and the api-server (reads/writes any organ's file by path to manage assignments)
 * share one definition. The model is registered with the connector at import time, so any
 * process that imports spinal-model-analysis can load these files.
 */
/** Hub-drive directory holding one assignment file per organ (file name = ORGAN_NAME). */
export declare const ANALYSIS_ASSIGNMENT_DIR = "/etc/Organs/Analysis";
/** The assignment record persisted per organ. */
export declare class AnalysisAssignmentModel extends Model {
    enabled: any;
    analytics: any;
    constructor(enabled?: boolean, analytics?: string[]);
}
/** Plain, JSON-friendly view of an assignment record. */
export interface IAssignmentState {
    enabled: boolean;
    analytics: string[];
}
/**
 * Loads the organ's assignment file, creating it (enabled=false, empty list) if absent.
 * Use from the organ for its OWN file — a missing file means "not yet configured", which
 * defaults to running everything.
 */
export declare function loadOrCreateAssignmentFile(organName: string, conn?: any): Promise<AnalysisAssignmentModel>;
/**
 * Loads an organ's assignment file, or resolves `null` if it doesn't exist (no creation).
 * Use from the api-server to read/manage another organ's assignment.
 */
export declare function loadAssignmentFile(organName: string, conn?: any): Promise<AnalysisAssignmentModel | null>;
/** Lists the organ names that have an assignment file (best-effort; [] if the dir is empty). */
export declare function listAssignmentOrganNames(conn?: any): Promise<string[]>;
/** Reads a model into a plain { enabled, analytics } (safe on null/undefined). */
export declare function readAssignment(model: AnalysisAssignmentModel | null | undefined): IAssignmentState;
/** Toggles filtered (assignment) mode for the organ owning this model. */
export declare function setAssignmentEnabled(model: AnalysisAssignmentModel, enabled: boolean): void;
/** Replaces the whole assigned list (de-duplicated, order preserved). */
export declare function setAssignmentAnalytics(model: AnalysisAssignmentModel, ids: string[]): void;
/** Adds one analysis id to the list. Returns false if it was already present. */
export declare function addAssignedAnalytic(model: AnalysisAssignmentModel, analyticId: string): boolean;
/** Removes one analysis id from the list. Returns false if it wasn't present. */
export declare function removeAssignedAnalytic(model: AnalysisAssignmentModel, analyticId: string): boolean;
/** Whether this organ should handle the given analysis id, per its record. */
export declare function isAnalyticAssigned(model: AnalysisAssignmentModel | null | undefined, analyticId: string): boolean;
