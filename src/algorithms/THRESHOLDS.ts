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

export function THRESHOLD_ABOVE(value: number, thresholds:[number]){
    return (value > thresholds[0]);
}

export function THRESHOLD_BELOW(value: number, thresholds:[number]){
    return (value < thresholds[0]);
}

export function THRESHOLD_BETWEEN_IN(value: number, thresholds:[number,number]){
    const min = Math.min(thresholds[0], thresholds[1]);
    const max = Math.max(thresholds[0], thresholds[1]);
    return (value >= min && value <= max);

}

export function THRESHOLD_BETWEEN_OUT(value: number, thresholds:[number,number]){
    const min = Math.min(thresholds[0], thresholds[1]);
    const max = Math.max(thresholds[0], thresholds[1]);
    return (value <= min && value >= max);
}