export declare function logMessage(message: string): void;
export declare function parseValue(value: any): any;
/**
 * Resolves a block parameter that is meant to be a boolean but may arrive as a
 * real boolean or as the string "true"/"false" (params are often stringified).
 * Anything else falls back to `defaultValue`.
 */
export declare function resolveBooleanFlag(value: any, defaultValue?: boolean): boolean;
/**
 * Stamps `node.info.directModificationDate` with the current time so downstream
 * consumers (e.g. the BOS) can detect a direct, out-of-band modification of the
 * node. Creates the attribute if the node doesn't have it yet, mirroring the
 * documentation service's behaviour but without assuming it already exists.
 */
export declare function touchDirectModificationDate(node: any): void;
