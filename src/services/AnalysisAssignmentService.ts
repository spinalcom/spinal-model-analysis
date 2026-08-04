/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model, spinalCore, FileSystem } from 'spinal-core-connectorjs_type';

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
export const ANALYSIS_ASSIGNMENT_DIR = '/etc/Organs/Analysis';

/** model_type hint stored on the file entry (reconstruction still uses the registered class). */
const ASSIGNMENT_MODEL_TYPE = 'AnalysisAssignment';

/** The assignment record persisted per organ. */
export class AnalysisAssignmentModel extends Model {
  public enabled: any;
  public analytics: any;

  constructor(enabled = false, analytics: string[] = []) {
    super();
    // add_attr infers model types from the JS values: boolean → Bool, array → Lst<Str>.
    (this as any).add_attr({ enabled, analytics });
  }
}
// Register once, at import — needed for the connector to reconstruct loaded files by class.
(spinalCore as any).register_models(AnalysisAssignmentModel, 'AnalysisAssignmentModel');

/** Plain, JSON-friendly view of an assignment record. */
export interface IAssignmentState {
  enabled: boolean;
  analytics: string[];
}

/** Resolves the FileSystem connection to use (explicit, else the active singleton). */
function resolveConn(conn?: any): any {
  const fs = conn ?? (FileSystem as any).get_inst?.();
  if (!fs) {
    throw new Error('No active hub connection (pass a connection or ensure FileSystem.get_inst() is set)');
  }
  return fs;
}

const filePath = (organName: string): string => `${ANALYSIS_ASSIGNMENT_DIR}/${organName}`;

/**
 * Loads the organ's assignment file, creating it (enabled=false, empty list) if absent.
 * Use from the organ for its OWN file — a missing file means "not yet configured", which
 * defaults to running everything.
 */
export function loadOrCreateAssignmentFile(
  organName: string,
  conn?: any
): Promise<AnalysisAssignmentModel> {
  const fs = resolveConn(conn);
  return new Promise<AnalysisAssignmentModel>((resolve, reject) => {
    spinalCore.load(
      fs,
      filePath(organName),
      (file: any) => resolve(file),
      () => {
        try {
          fs.load_or_make_dir(ANALYSIS_ASSIGNMENT_DIR, (directory: any) => {
            const file = new AnalysisAssignmentModel();
            directory.force_add_file(organName, file, { model_type: ASSIGNMENT_MODEL_TYPE });
            resolve(file);
          });
        } catch (e) {
          reject(e as Error);
        }
      }
    );
  });
}

/**
 * Loads an organ's assignment file, or resolves `null` if it doesn't exist (no creation).
 * Use from the api-server to read/manage another organ's assignment.
 */
export function loadAssignmentFile(
  organName: string,
  conn?: any
): Promise<AnalysisAssignmentModel | null> {
  const fs = resolveConn(conn);
  return new Promise<AnalysisAssignmentModel | null>((resolve) => {
    spinalCore.load(
      fs,
      filePath(organName),
      (file: any) => resolve(file),
      () => resolve(null)
    );
  });
}

/** Lists the organ names that have an assignment file (best-effort; [] if the dir is empty). */
export function listAssignmentOrganNames(conn?: any): Promise<string[]> {
  const fs = resolveConn(conn);
  return new Promise<string[]>((resolve, reject) => {
    try {
      fs.load_or_make_dir(ANALYSIS_ASSIGNMENT_DIR, (directory: any) => {
        const names: string[] = [];
        const len = Number(directory?.length ?? 0);
        for (let i = 0; i < len; i++) {
          const name = directory[i]?.name?.get?.();
          if (typeof name === 'string' && name.length > 0) names.push(name);
        }
        resolve(names);
      });
    } catch (e) {
      reject(e as Error);
    }
  });
}

/** Reads a model into a plain { enabled, analytics } (safe on null/undefined). */
export function readAssignment(model: AnalysisAssignmentModel | null | undefined): IAssignmentState {
  if (!model) return { enabled: false, analytics: [] };
  const enabled = (model as any).enabled?.get?.() === true;
  let analytics: string[] = [];
  try {
    const raw = (model as any).analytics?.get?.();
    if (Array.isArray(raw)) analytics = raw.map((x: any) => String(x));
  } catch {
    /* ignore — treat as empty */
  }
  return { enabled, analytics };
}

/** Toggles filtered (assignment) mode for the organ owning this model. */
export function setAssignmentEnabled(model: AnalysisAssignmentModel, enabled: boolean): void {
  (model as any).enabled.set(!!enabled);
}

/** Replaces the whole assigned list (de-duplicated, order preserved). */
export function setAssignmentAnalytics(model: AnalysisAssignmentModel, ids: string[]): void {
  const lst = (model as any).analytics;
  lst.clear();
  const seen = new Set<string>();
  for (const id of ids ?? []) {
    const s = String(id);
    if (s.length > 0 && !seen.has(s)) {
      seen.add(s);
      lst.push(s);
    }
  }
}

/** Adds one analysis id to the list. Returns false if it was already present. */
export function addAssignedAnalytic(model: AnalysisAssignmentModel, analyticId: string): boolean {
  const lst = (model as any).analytics;
  const s = String(analyticId);
  if (lst.indexOf(s) !== -1) return false;
  lst.push(s);
  return true;
}

/** Removes one analysis id from the list. Returns false if it wasn't present. */
export function removeAssignedAnalytic(model: AnalysisAssignmentModel, analyticId: string): boolean {
  const lst = (model as any).analytics;
  const s = String(analyticId);
  if (lst.indexOf(s) === -1) return false;
  lst.remove(s);
  return true;
}

/** Whether this organ should handle the given analysis id, per its record. */
export function isAnalyticAssigned(
  model: AnalysisAssignmentModel | null | undefined,
  analyticId: string
): boolean {
  if (!model) return false;
  try {
    return (model as any).analytics?.indexOf?.(String(analyticId)) !== -1;
  } catch {
    return false;
  }
}
