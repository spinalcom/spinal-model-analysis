"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeExecutionResult = exports.serializeExecutionValue = void 0;
/**
 * Serialization for analysis execution results.
 *
 * Block outputs can be values that are NOT safe to hand to JSON.stringify: SpinalNodes and
 * spinal-core Models carry `_parents` back-references (cycles), and some blocks emit opaque
 * runtime handles (e.g. the Excel workbook from LOAD_EXCEL, which wraps a live
 * ExcelJS workbook + a Buffer). This module owns the block-output shapes, so it owns how they
 * serialize — both the api-server (execute route) and spinal-organ-analysis import these
 * instead of re-implementing the knowledge of what a "block output" can be.
 *
 * The result is a plain, JSON-safe structure. Non-primitive values become compact descriptors:
 *   - SpinalNode          → { id, name, type, server_id }
 *   - spinal Model        → its primitive value, or { _model: "<ClassName>" }
 *   - Excel workbook       → { _excelWorkbook: { source, variables } }
 *   - Buffer               → { _buffer: { bytes } }
 *   - cyclic reference     → { _circular: true }
 */
/** Duck-typed SpinalNode check (robust across package copies — avoids instanceof pitfalls). */
function isSpinalNode(value) {
    return (Boolean(value) &&
        typeof value === 'object' &&
        typeof value.getId === 'function' &&
        typeof value.getName === 'function' &&
        typeof value.getType === 'function');
}
function serializeNode(node) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return {
        id: (_c = (_b = (_a = node === null || node === void 0 ? void 0 : node.getId) === null || _a === void 0 ? void 0 : _a.call(node)) === null || _b === void 0 ? void 0 : _b.get) === null || _c === void 0 ? void 0 : _c.call(_b),
        name: (_f = (_e = (_d = node === null || node === void 0 ? void 0 : node.getName) === null || _d === void 0 ? void 0 : _d.call(node)) === null || _e === void 0 ? void 0 : _e.get) === null || _f === void 0 ? void 0 : _f.call(_e),
        type: (_j = (_h = (_g = node === null || node === void 0 ? void 0 : node.getType) === null || _g === void 0 ? void 0 : _g.call(node)) === null || _h === void 0 ? void 0 : _h.get) === null || _j === void 0 ? void 0 : _j.call(_h),
        server_id: node === null || node === void 0 ? void 0 : node._server_id,
    };
}
/** The workbook handle produced by the Excel blocks (see excel.algorithms.ts). */
function isExcelHandle(value) {
    return Boolean(value) && typeof value === 'object' && value.__excelHandle === true;
}
function serializeExcelHandle(handle) {
    var _a;
    let variables = [];
    try {
        if ((handle === null || handle === void 0 ? void 0 : handle.filler) && typeof handle.filler.getVariables === 'function') {
            variables = handle.filler.getVariables();
        }
    }
    catch (_b) {
        /* ignore — descriptor stays best-effort */
    }
    return {
        _excelWorkbook: {
            source: (_a = handle === null || handle === void 0 ? void 0 : handle.sourceName) !== null && _a !== void 0 ? _a : null,
            variables,
        },
    };
}
/**
 * Converts a single block-output value into a JSON-safe form. Recurses into arrays and plain
 * objects (cycle-guarded) so nested nodes/models/handles are handled wherever they appear.
 */
function serializeExecutionValue(value, seen) {
    var _a, _b;
    if (value === null || value === undefined)
        return value;
    if (typeof value !== 'object')
        return value; // string | number | boolean | bigint | symbol → as-is
    if (isSpinalNode(value))
        return serializeNode(value);
    if (isExcelHandle(value))
        return serializeExcelHandle(value);
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
        return { _buffer: { bytes: value.length } };
    }
    const visited = seen !== null && seen !== void 0 ? seen : new WeakSet();
    if (visited.has(value))
        return { _circular: true };
    visited.add(value);
    if (Array.isArray(value))
        return value.map((v) => serializeExecutionValue(v, visited));
    // spinal-core Model (Val / Str / Bool / SpinalBmsEndpoint / …): never emit the raw model —
    // its _parents form a cycle. Expose its primitive value, else a safe type descriptor.
    if (typeof value.get === 'function') {
        try {
            const got = value.get();
            const gt = typeof got;
            if (got === null || gt === 'string' || gt === 'number' || gt === 'boolean')
                return got;
        }
        catch (_c) {
            /* fall through to the descriptor */
        }
        return { _model: (_b = (_a = value.constructor) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'Model' };
    }
    // Plain object — rebuild it with serialized values (cycle-guarded).
    const out = {};
    for (const key of Object.keys(value)) {
        out[key] = serializeExecutionValue(value[key], visited);
    }
    return out;
}
exports.serializeExecutionValue = serializeExecutionValue;
function serializeRecord(record) {
    if (!record)
        return record;
    const out = {};
    for (const key of Object.keys(record)) {
        out[key] = serializeExecutionValue(record[key]);
    }
    return out;
}
/**
 * Serializes a full AnalysisExecutionResult into a JSON-safe object, ready for res.json().
 * Per work node, its inputRegisters and executionOutputs are passed through
 * serializeExecutionValue.
 */
function serializeExecutionResult(result) {
    return Object.assign(Object.assign({}, result), { results: result.results.map((r) => (Object.assign(Object.assign({}, r), { inputRegisters: serializeRecord(r.inputRegisters), executionOutputs: serializeRecord(r.executionOutputs) }))) });
}
exports.serializeExecutionResult = serializeExecutionResult;
//# sourceMappingURL=serialization.js.map