"use strict";
/*
 * Copyright 2023 SpinalCom - www.spinalcom.com
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
exports.THRESHOLD_BETWEEN_OUT = exports.THRESHOLD_BETWEEN_IN = exports.THRESHOLD_BELOW = exports.THRESHOLD_ABOVE = void 0;
function THRESHOLD_ABOVE(value, thresholds) {
    return (value > thresholds[0]);
}
exports.THRESHOLD_ABOVE = THRESHOLD_ABOVE;
function THRESHOLD_BELOW(value, thresholds) {
    return (value < thresholds[0]);
}
exports.THRESHOLD_BELOW = THRESHOLD_BELOW;
function THRESHOLD_BETWEEN_IN(value, thresholds) {
    const min = Math.min(thresholds[0], thresholds[1]);
    const max = Math.max(thresholds[0], thresholds[1]);
    return (value >= min && value <= max);
}
exports.THRESHOLD_BETWEEN_IN = THRESHOLD_BETWEEN_IN;
function THRESHOLD_BETWEEN_OUT(value, thresholds) {
    const min = Math.min(thresholds[0], thresholds[1]);
    const max = Math.max(thresholds[0], thresholds[1]);
    return (value <= min && value >= max);
}
exports.THRESHOLD_BETWEEN_OUT = THRESHOLD_BETWEEN_OUT;
//# sourceMappingURL=THRESHOLDS.js.map