"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAnalyticAssigned = exports.removeAssignedAnalytic = exports.addAssignedAnalytic = exports.setAssignmentAnalytics = exports.setAssignmentEnabled = exports.readAssignment = exports.listAssignmentOrganNames = exports.loadAssignmentFile = exports.loadOrCreateAssignmentFile = exports.AnalysisAssignmentModel = exports.ANALYSIS_ASSIGNMENT_DIR = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
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
exports.ANALYSIS_ASSIGNMENT_DIR = '/etc/Organs/Analysis';
/** model_type hint stored on the file entry (reconstruction still uses the registered class). */
const ASSIGNMENT_MODEL_TYPE = 'AnalysisAssignment';
/** The assignment record persisted per organ. */
class AnalysisAssignmentModel extends spinal_core_connectorjs_type_1.Model {
    constructor(enabled = false, analytics = []) {
        super();
        // add_attr infers model types from the JS values: boolean → Bool, array → Lst<Str>.
        this.add_attr({ enabled, analytics });
    }
}
exports.AnalysisAssignmentModel = AnalysisAssignmentModel;
// Register once, at import — needed for the connector to reconstruct loaded files by class.
spinal_core_connectorjs_type_1.spinalCore.register_models(AnalysisAssignmentModel, 'AnalysisAssignmentModel');
/** Resolves the FileSystem connection to use (explicit, else the active singleton). */
function resolveConn(conn) {
    var _a, _b;
    const fs = conn !== null && conn !== void 0 ? conn : (_b = (_a = spinal_core_connectorjs_type_1.FileSystem).get_inst) === null || _b === void 0 ? void 0 : _b.call(_a);
    if (!fs) {
        throw new Error('No active hub connection (pass a connection or ensure FileSystem.get_inst() is set)');
    }
    return fs;
}
const filePath = (organName) => `${exports.ANALYSIS_ASSIGNMENT_DIR}/${organName}`;
/**
 * Loads the organ's assignment file, creating it (enabled=false, empty list) if absent.
 * Use from the organ for its OWN file — a missing file means "not yet configured", which
 * defaults to running everything.
 */
function loadOrCreateAssignmentFile(organName, conn) {
    const fs = resolveConn(conn);
    return new Promise((resolve, reject) => {
        spinal_core_connectorjs_type_1.spinalCore.load(fs, filePath(organName), (file) => resolve(file), () => {
            try {
                fs.load_or_make_dir(exports.ANALYSIS_ASSIGNMENT_DIR, (directory) => {
                    const file = new AnalysisAssignmentModel();
                    directory.force_add_file(organName, file, { model_type: ASSIGNMENT_MODEL_TYPE });
                    resolve(file);
                });
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
exports.loadOrCreateAssignmentFile = loadOrCreateAssignmentFile;
/**
 * Loads an organ's assignment file, or resolves `null` if it doesn't exist (no creation).
 * Use from the api-server to read/manage another organ's assignment.
 */
function loadAssignmentFile(organName, conn) {
    const fs = resolveConn(conn);
    return new Promise((resolve) => {
        spinal_core_connectorjs_type_1.spinalCore.load(fs, filePath(organName), (file) => resolve(file), () => resolve(null));
    });
}
exports.loadAssignmentFile = loadAssignmentFile;
/** Lists the organ names that have an assignment file (best-effort; [] if the dir is empty). */
function listAssignmentOrganNames(conn) {
    const fs = resolveConn(conn);
    return new Promise((resolve, reject) => {
        try {
            fs.load_or_make_dir(exports.ANALYSIS_ASSIGNMENT_DIR, (directory) => {
                var _a, _b, _c, _d;
                const names = [];
                const len = Number((_a = directory === null || directory === void 0 ? void 0 : directory.length) !== null && _a !== void 0 ? _a : 0);
                for (let i = 0; i < len; i++) {
                    const name = (_d = (_c = (_b = directory[i]) === null || _b === void 0 ? void 0 : _b.name) === null || _c === void 0 ? void 0 : _c.get) === null || _d === void 0 ? void 0 : _d.call(_c);
                    if (typeof name === 'string' && name.length > 0)
                        names.push(name);
                }
                resolve(names);
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
exports.listAssignmentOrganNames = listAssignmentOrganNames;
/** Reads a model into a plain { enabled, analytics } (safe on null/undefined). */
function readAssignment(model) {
    var _a, _b, _c, _d;
    if (!model)
        return { enabled: false, analytics: [] };
    const enabled = ((_b = (_a = model.enabled) === null || _a === void 0 ? void 0 : _a.get) === null || _b === void 0 ? void 0 : _b.call(_a)) === true;
    let analytics = [];
    try {
        const raw = (_d = (_c = model.analytics) === null || _c === void 0 ? void 0 : _c.get) === null || _d === void 0 ? void 0 : _d.call(_c);
        if (Array.isArray(raw))
            analytics = raw.map((x) => String(x));
    }
    catch (_e) {
        /* ignore — treat as empty */
    }
    return { enabled, analytics };
}
exports.readAssignment = readAssignment;
/** Toggles filtered (assignment) mode for the organ owning this model. */
function setAssignmentEnabled(model, enabled) {
    model.enabled.set(!!enabled);
}
exports.setAssignmentEnabled = setAssignmentEnabled;
/** Replaces the whole assigned list (de-duplicated, order preserved). */
function setAssignmentAnalytics(model, ids) {
    const lst = model.analytics;
    lst.clear();
    const seen = new Set();
    for (const id of ids !== null && ids !== void 0 ? ids : []) {
        const s = String(id);
        if (s.length > 0 && !seen.has(s)) {
            seen.add(s);
            lst.push(s);
        }
    }
}
exports.setAssignmentAnalytics = setAssignmentAnalytics;
/** Adds one analysis id to the list. Returns false if it was already present. */
function addAssignedAnalytic(model, analyticId) {
    const lst = model.analytics;
    const s = String(analyticId);
    if (lst.indexOf(s) !== -1)
        return false;
    lst.push(s);
    return true;
}
exports.addAssignedAnalytic = addAssignedAnalytic;
/** Removes one analysis id from the list. Returns false if it wasn't present. */
function removeAssignedAnalytic(model, analyticId) {
    const lst = model.analytics;
    const s = String(analyticId);
    if (lst.indexOf(s) === -1)
        return false;
    lst.remove(s);
    return true;
}
exports.removeAssignedAnalytic = removeAssignedAnalytic;
/** Whether this organ should handle the given analysis id, per its record. */
function isAnalyticAssigned(model, analyticId) {
    var _a, _b;
    if (!model)
        return false;
    try {
        return ((_b = (_a = model.analytics) === null || _a === void 0 ? void 0 : _a.indexOf) === null || _b === void 0 ? void 0 : _b.call(_a, String(analyticId))) !== -1;
    }
    catch (_c) {
        return false;
    }
}
exports.isAnalyticAssigned = isAnalyticAssigned;
//# sourceMappingURL=AnalysisAssignmentService.js.map