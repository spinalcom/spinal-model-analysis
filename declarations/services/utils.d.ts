export declare function logMessage(message: string): void;
export declare function parseValue(value: any): any;
/**
 * Resolves a block parameter that is meant to be a boolean but may arrive as a
 * real boolean or as the string "true"/"false" (params are often stringified).
 * Anything else falls back to `defaultValue`.
 */
export declare function resolveBooleanFlag(value: any, defaultValue?: boolean): boolean;
/**
 * The text a node attribute stores for a value (attribute values are strings). Dates come from
 * Excel date cells, which have no time zone (they are read as UTC): they become the date and time
 * as written in the file — "2026-10-30", or "2026-10-30 14:30" (with ":ss" when the seconds are not
 * zero) — where String(date) would give locale-dependent text and an ISO "…Z" would claim a UTC
 * time the file never stated. Plain objects become JSON rather than "[object Object]".
 */
export declare function toAttributeText(value: unknown): string;
/**
 * Stamps `node.info.directModificationDate` with the current time so downstream
 * consumers (e.g. the other organs) can detect a direct modification of the
 * node. Creates the node info attribute if the node doesn't have it yet
 */
export declare function touchDirectModificationDate(node: any): void;
