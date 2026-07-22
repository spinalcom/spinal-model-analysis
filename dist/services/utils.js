"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.touchDirectModificationDate = exports.resolveBooleanFlag = exports.parseValue = exports.logMessage = void 0;
// Logging function
function logMessage(message) {
    if (process.env.ADVANCED_LOGGING === 'true') {
        console.log(message);
    }
}
exports.logMessage = logMessage;
function parseValue(value) {
    if (typeof value !== 'string')
        return value;
    const lower = value.trim().toLowerCase();
    if (lower === 'true')
        return true;
    if (lower === 'false')
        return false;
    if (lower === 'null')
        return null;
    // Try to parse numbers if it looks numeric
    if (!isNaN(Number(value)) && value !== '')
        return Number(value);
    return value;
}
exports.parseValue = parseValue;
/**
 * Resolves a block parameter that is meant to be a boolean but may arrive as a
 * real boolean or as the string "true"/"false" (params are often stringified).
 * Anything else falls back to `defaultValue`.
 */
function resolveBooleanFlag(value, defaultValue = false) {
    if (value === true || value === false)
        return value;
    if (typeof value === 'string') {
        const lower = value.trim().toLowerCase();
        if (lower === 'true')
            return true;
        if (lower === 'false')
            return false;
    }
    return defaultValue;
}
exports.resolveBooleanFlag = resolveBooleanFlag;
/**
 * Stamps `node.info.directModificationDate` with the current time so downstream
 * consumers (e.g. the BOS) can detect a direct, out-of-band modification of the
 * node. Creates the attribute if the node doesn't have it yet, mirroring the
 * documentation service's behaviour but without assuming it already exists.
 */
function touchDirectModificationDate(node) {
    const now = Date.now();
    if (!(node === null || node === void 0 ? void 0 : node.info))
        return;
    if (node.info.directModificationDate) {
        node.info.directModificationDate.set(now);
    }
    else {
        node.info.add_attr('directModificationDate', now);
    }
}
exports.touchDirectModificationDate = touchDirectModificationDate;
//# sourceMappingURL=utils.js.map