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

// Logging function
export function logMessage(message: string): void {
  if (process.env.ADVANCED_LOGGING === 'true') {
    console.log(message);
  }
}

export function parseValue(value: any): any {
  if (typeof value !== 'string') return value;

  const lower = value.trim().toLowerCase();

  if (lower === 'true') return true;
  if (lower === 'false') return false;
  if (lower === 'null') return null;

  // Try to parse numbers if it looks numeric
  if (!isNaN(Number(value)) && value !== '') return Number(value);

  return value;
}

/**
 * Resolves a block parameter that is meant to be a boolean but may arrive as a
 * real boolean or as the string "true"/"false" (params are often stringified).
 * Anything else falls back to `defaultValue`.
 */
export function resolveBooleanFlag(value: any, defaultValue = false): boolean {
  if (value === true || value === false) return value;
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
  }
  return defaultValue;
}

/**
 * The text a node attribute stores for a value (attribute values are strings). Dates come from
 * Excel date cells, which have no time zone (they are read as UTC): they become the date and time
 * as written in the file — "2026-10-30", or "2026-10-30 14:30" (with ":ss" when the seconds are not
 * zero) — where String(date) would give locale-dependent text and an ISO "…Z" would claim a UTC
 * time the file never stated. Plain objects become JSON rather than "[object Object]".
 */
export function toAttributeText(value: unknown): string {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return String(value);
    const [date, time] = value.toISOString().split('T');
    const clock = time.slice(0, 8);
    if (clock === '00:00:00') return date;
    return `${date} ${clock.endsWith(':00') ? clock.slice(0, 5) : clock}`;
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

/**
 * Stamps `node.info.directModificationDate` with the current time so downstream
 * consumers (e.g. the other organs) can detect a direct modification of the
 * node. Creates the node info attribute if the node doesn't have it yet
 */
export function touchDirectModificationDate(node: any): void {
  const now = Date.now();
  if (!node?.info) return;
  if (node.info.directModificationDate) {
    node.info.directModificationDate.set(now);
  } else {
    node.info.add_attr('directModificationDate', now);
  }
}


