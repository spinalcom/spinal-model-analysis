"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXCEL_ALGORITHMS = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const core_1 = require("./core");
const utils_1 = require("../../services/utils");
/**
 * Excel report blocks.
 *
 * These wrap `spinal-service-excel-filler` (ExcelJS under the hood) so a workflow can
 * load an .xlsx template stored as a document on a node, fill its `{{tokens}}` / cells /
 * ranges, manage sheets, then save the result back onto a node or export it as base64.
 *
 * Pipeline model: LOAD_EXCEL returns an **Excel workbook handle** — a live,
 * stateful object that flows between blocks as an ordinary block output. Each SET_* /
 * *_SHEET block mutates that handle in place and returns it, so you chain them linearly:
 *
 *   LOAD_EXCEL(node) → SET_EXCEL_VARIABLES([wb, vars]) → SAVE_EXCEL_TO_NODE([wb, node])
 *
 * Because the handle is mutated in place, treat it as a single linear pipeline (don't fan
 * the same handle into parallel mutating branches and expect independent copies).
 */
// ── ESM interop ──────────────────────────────────────────────────────────────
// spinal-service-excel-filler ships as ESM ("type":"module") while this module is
// CommonJS. A static import would be downleveled to require() by tsc and can throw
// ERR_REQUIRE_ESM depending on the Node version. Wrapping import() in `new Function`
// keeps it a *native* dynamic import at runtime (tsc won't rewrite it), so it loads the
// ESM package cleanly on any Node. Loaded lazily & once — exceljs is only pulled in when
// an Excel block actually runs.
const _importESM = new Function('specifier', 'return import(specifier);');
let _fillerModulePromise = null;
function loadFillerClass() {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        if (!_fillerModulePromise) {
            _fillerModulePromise = _importESM('spinal-service-excel-filler');
        }
        const mod = yield _fillerModulePromise;
        const ctor = (_c = (_a = mod === null || mod === void 0 ? void 0 : mod.SpinalExcelFiller) !== null && _a !== void 0 ? _a : (_b = mod === null || mod === void 0 ? void 0 : mod.default) === null || _b === void 0 ? void 0 : _b.SpinalExcelFiller) !== null && _c !== void 0 ? _c : mod === null || mod === void 0 ? void 0 : mod.default;
        if (typeof ctor !== 'function') {
            throw new Error('Could not load SpinalExcelFiller from "spinal-service-excel-filler" (unexpected module shape)');
        }
        return ctor;
    });
}
// ── helpers ──────────────────────────────────────────────────────────────────
const isSpinalNode = (value) => Boolean(value) &&
    typeof value === 'object' &&
    typeof value.getId === 'function';
/** Accepts a node, or a node array (takes the first), like the other node-consuming blocks. */
const resolveNode = (value) => {
    if (isSpinalNode(value))
        return value;
    if (Array.isArray(value) && value.length > 0 && isSpinalNode(value[0]))
        return value[0];
    return undefined;
};
const isExcelHandle = (value) => Boolean(value) && typeof value === 'object' && value.__excelHandle === true;
/** Extracts the workbook handle for single-input blocks. */
function requireHandle(input, blockName) {
    if (isExcelHandle(input))
        return input;
    throw new Error(`${blockName}: expected an Excel workbook (wire it from LOAD_EXCEL)`);
}
/** Extracts [handle, payload] for the two-input SET_* blocks. */
function requireHandleAndPayload(input, blockName) {
    if (!Array.isArray(input) || input.length < 2) {
        throw new Error(`${blockName} expects 2 inputs: [workbook, payload]`);
    }
    return [requireHandle(input[0], blockName), input[1]];
}
/** Parses a "map" payload that may arrive as a JSON string (object family) or a live object. */
function asPlainObject(value, blockName) {
    let obj = value;
    if (typeof value === 'string') {
        try {
            obj = JSON.parse(value);
        }
        catch (_a) {
            throw new Error(`${blockName}: input must be a JSON object string or an object`);
        }
    }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        throw new Error(`${blockName}: expected an object (got ${Array.isArray(obj) ? 'array' : typeof obj})`);
    }
    return obj;
}
/** Parses a values payload that may arrive as a JSON string or a live array (1D or 2D). */
function asArray(value, blockName) {
    let v = value;
    if (typeof value === 'string') {
        try {
            v = JSON.parse(value);
        }
        catch (_a) {
            throw new Error(`${blockName}: values must be a JSON array or an array`);
        }
    }
    if (!Array.isArray(v))
        throw new Error(`${blockName}: expected an array of values`);
    return v;
}
/**
 * Builds the absolute Spinalhub base URL (e.g. "http://127.0.0.1:8888") from the live
 * connection. The documentation service's getCurrentVersionAsBuffer(hubUrl) needs an
 * absolute URL server-side (its default "" only works in a browser).
 */
function getHubUrl() {
    var _a, _b;
    const fs = (_b = (_a = spinal_core_connectorjs_type_1.FileSystem).get_inst) === null || _b === void 0 ? void 0 : _b.call(_a);
    if (!fs) {
        throw new Error('No active Spinalhub connection (FileSystem.get_inst() is empty)');
    }
    const protocol = fs._protocol || 'http:'; // includes the colon, e.g. "http:"
    const host = fs._url;
    const port = fs._port;
    if (!host) {
        throw new Error('Cannot resolve the Spinalhub URL from the active connection');
    }
    let url = `${protocol}//${host}`;
    if (port)
        url += `:${port}`;
    return url;
}
const safeFileName = (file) => {
    var _a, _b;
    const n = (_b = (_a = file === null || file === void 0 ? void 0 : file.name) === null || _a === void 0 ? void 0 : _a.get) === null || _b === void 0 ? void 0 : _b.call(_a);
    return typeof n === 'string' ? n : '';
};
/** Renders the filled workbook to a Buffer, optionally preserving embedded charts. */
function produceBuffer(handle, preserveCharts) {
    return __awaiter(this, void 0, void 0, function* () {
        if (preserveCharts && handle.originalBuffer) {
            return handle.filler.toBufferWithCharts(handle.originalBuffer);
        }
        return handle.filler.toBuffer();
    });
}
/** Resolves the ifExists parameter (default 'replace'); accepts a few friendly aliases. */
function resolveIfExists(value) {
    if (typeof value === 'string') {
        const v = value.trim().toLowerCase();
        if (v === '')
            return 'replace';
        if (v === 'replace' || v === 'overwrite')
            return 'replace';
        if (v === 'error' || v === 'deny' || v === 'fail')
            return 'error';
        if (v === 'allow' || v === 'keep' || v === 'both')
            return 'allow';
        throw new Error(`SAVE_EXCEL_TO_NODE: invalid "ifExists" value "${value}" (use "replace", "error", or "allow")`);
    }
    return 'replace';
}
/**
 * Saves a buffer as a document on a node, honoring the same-name conflict policy:
 *  - 'replace' (default): remove every existing document with that name, then add the new one.
 *  - 'error': throw if a document with that name already exists (nothing is written).
 *  - 'allow': just add it (the previous behavior — may create duplicates).
 */
function saveBufferAsDocument(node, filename, buffer, ifExists) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (ifExists !== 'allow') {
            const existing = (_a = (yield spinal_env_viewer_plugin_documentation_service_1.FileExplorer.getFilesLinkedToNode(node))) !== null && _a !== void 0 ? _a : [];
            const matches = existing.filter((f) => safeFileName(f) === filename);
            if (matches.length > 0) {
                if (ifExists === 'error') {
                    throw new Error(`SAVE_EXCEL_TO_NODE: a document named "${filename}" already exists on the node ` +
                        `(ifExists="error"). Use ifExists="replace" to overwrite, or "allow" to keep both.`);
                }
                // 'replace' — drop all existing documents with that name before adding the new one.
                for (const f of matches) {
                    yield spinal_env_viewer_plugin_documentation_service_1.FileExplorer.removeFileLinked(node, f);
                }
            }
        }
        yield spinal_env_viewer_plugin_documentation_service_1.FileExplorer.uploadFiles(node, [{ name: filename, buffer }]);
    });
}
/**
 * Loads the .xlsx document attached to a node into a live Excel workbook handle that supports
 * both reading (GET_EXCEL_*) and filling (SET_EXCEL_*).
 */
function loadWorkbookHandle(input, params, blockName) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = resolveNode(input);
        if (!node)
            throw new Error(`${blockName}: input must be a SpinalNode`);
        const files = yield spinal_env_viewer_plugin_documentation_service_1.FileExplorer.getFilesLinkedToNode(node);
        if (!files || files.length === 0) {
            throw new Error(`${blockName}: the node has no attached document`);
        }
        const requested = typeof (params === null || params === void 0 ? void 0 : params.filename) === 'string' ? params.filename.trim() : '';
        let chosen;
        if (requested) {
            chosen =
                files.find((f) => safeFileName(f) === requested) ||
                    files.find((f) => safeFileName(f).toLowerCase() === requested.toLowerCase());
            if (!chosen) {
                const available = files.map((f) => safeFileName(f)).filter(Boolean).join(', ');
                throw new Error(`${blockName}: no document named "${requested}" on the node (found: ${available || 'none'})`);
            }
        }
        else {
            chosen = files.find((f) => /\.xlsx?$/i.test(safeFileName(f))) || files[0];
        }
        if (typeof chosen.getCurrentVersionAsBuffer !== 'function') {
            throw new Error(`${blockName}: document "${safeFileName(chosen)}" cannot be read as a buffer`);
        }
        const buffer = yield chosen.getCurrentVersionAsBuffer(getHubUrl());
        const Filler = yield loadFillerClass();
        const defaultColor = typeof (params === null || params === void 0 ? void 0 : params.defaultColor) === 'string' && params.defaultColor.trim().length > 0
            ? params.defaultColor.trim()
            : undefined;
        const filler = new Filler(defaultColor ? { defaultColor } : {});
        yield filler.loadTemplateFromBuffer(buffer);
        return {
            __excelHandle: true,
            filler,
            originalBuffer: buffer,
            sourceName: safeFileName(chosen) || null,
        };
    });
}
// ── read/extraction value shaping ─────────────────────────────────────────────
// Days between Excel's epoch (1899-12-30, incl. the 1900 leap-year bug) and 1970-01-01.
const EXCEL_EPOCH_OFFSET_DAYS = 25569;
const MS_PER_DAY = 86400000;
/**
 * Coerces a read cell value to an epoch-ms timestamp, or null if it can't be parsed.
 * Date cells arrive as JS Dates (the common case). Numbers are epoch ms by default, or
 * Excel serial days when `excelSerial` is true. Strings are parsed as a number then a date.
 */
function toEpochMs(value, excelSerial) {
    if (value === null || value === undefined || value === '')
        return null;
    if (value instanceof Date) {
        const t = value.getTime();
        return isNaN(t) ? null : t;
    }
    if (typeof value === 'number') {
        if (isNaN(value))
            return null;
        return excelSerial ? Math.round((value - EXCEL_EPOCH_OFFSET_DAYS) * MS_PER_DAY) : value;
    }
    if (typeof value === 'string') {
        const s = value.trim();
        if (!s)
            return null;
        const n = Number(s);
        if (!isNaN(n))
            return excelSerial ? Math.round((n - EXCEL_EPOCH_OFFSET_DAYS) * MS_PER_DAY) : n;
        const d = Date.parse(s);
        return isNaN(d) ? null : d;
    }
    return null;
}
/** Coerces a read cell value to a number (booleans → 1/0), or null if it isn't numeric. */
function toNumericValue(value) {
    if (typeof value === 'boolean')
        return value ? 1 : 0;
    if (typeof value === 'number')
        return isNaN(value) ? null : value;
    if (typeof value === 'string') {
        const s = value.trim();
        if (!s)
            return null;
        const n = Number(s);
        return isNaN(n) ? null : n;
    }
    return null;
}
// ── blocks ───────────────────────────────────────────────────────────────────
exports.EXCEL_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'LOAD_EXCEL',
        description: 'Loads an .xlsx document stored on a node and returns an Excel workbook handle. From it ' +
            'you can READ (GET_EXCEL_CELL / GET_EXCEL_COLUMN / GET_EXCEL_RANGE / GET_EXCEL_SHEETS) ' +
            'and/or FILL (SET_EXCEL_* blocks) then save with SAVE_EXCEL_TO_NODE / EXCEL_TO_BASE64. ' +
            'By default it picks the first .xlsx document on the node; set the "filename" parameter ' +
            'to choose a specific one. An optional "defaultColor" (hex, no #) is applied as the ' +
            'background of every filled cell.',
        inputs: [
            { name: 'node', types: ['SpinalNode'], description: 'The node holding the .xlsx document as an attachment.', required: true },
        ],
        outputType: 'ExcelWorkbook',
        parameters: [
            { name: 'filename', type: 'string', description: 'Name of the document to load (e.g. "report.xlsx"). If omitted, the first .xlsx attached to the node is used.', required: false },
            { name: 'defaultColor', type: 'string', description: 'Optional default cell background color as a hex string without "#" (e.g. "E3F2FD"), applied to every filled cell.', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            return (yield loadWorkbookHandle(input, params, 'LOAD_EXCEL'));
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_EXCEL_VARIABLES',
        description: 'Returns the list of {{token}} variable names found in the loaded template. Useful to ' +
            'discover what a template expects before filling it (feed it to LOG or FOREACH).',
        inputs: [
            { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
        ],
        outputType: 'string[]',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const handle = requireHandle(input, 'GET_EXCEL_VARIABLES');
            return handle.filler.getVariables();
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_EXCEL_SHEETS',
        description: 'Returns the names of every worksheet in the loaded workbook, in tab order — handy to ' +
            'discover sheet names before reading cells/columns/ranges.',
        inputs: [
            { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
        ],
        outputType: 'string[]',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const handle = requireHandle(input, 'GET_EXCEL_SHEETS');
            return handle.filler.getSheetNames();
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_EXCEL_CELL',
        description: 'Reads a single cell value. Give the cell as a "ref" parameter in "SheetName!CellRef" ' +
            'form (e.g. "Sheet1!B3"). Formula cells return their computed result; empty cells return null.',
        inputs: [
            { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
        ],
        outputType: 'any',
        parameters: [
            { name: 'ref', type: 'string', description: 'Cell reference in "SheetName!CellRef" form, e.g. "Sheet1!B3".', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const handle = requireHandle(input, 'GET_EXCEL_CELL');
            const ref = typeof (params === null || params === void 0 ? void 0 : params.ref) === 'string' ? params.ref.trim() : '';
            if (!ref)
                throw new Error('GET_EXCEL_CELL requires a "ref" parameter (e.g. "Sheet1!B3")');
            return handle.filler.getCell(ref);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_EXCEL_COLUMN',
        description: 'Reads a whole column top-to-bottom as an array of values. Params: "sheet" (name), ' +
            '"column" (letter like "B" or 1-based index), plus optional "startRow"/"endRow" ' +
            '(1-based, inclusive; endRow defaults to the last used row) and "skipHeader" to drop the ' +
            'first row. Pair two columns (timestamps + values) with COLUMNS_TO_TIMESERIES to build ' +
            'an injectable series.',
        inputs: [
            { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
        ],
        outputType: 'any[]',
        parameters: [
            { name: 'sheet', type: 'string', description: 'Worksheet name to read from.', required: true },
            { name: 'column', type: 'string', description: 'Column letter (e.g. "B") or 1-based index (e.g. 2).', required: true },
            { name: 'startRow', type: 'number', description: 'First row to read (1-based). Default 1.', required: false },
            { name: 'endRow', type: 'number', description: 'Last row to read (1-based, inclusive). Default: the sheet\'s last used row.', required: false },
            { name: 'skipHeader', type: 'boolean', description: 'Skip the first row in range as a header (default false).', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const handle = requireHandle(input, 'GET_EXCEL_COLUMN');
            const sheet = typeof (params === null || params === void 0 ? void 0 : params.sheet) === 'string' ? params.sheet.trim() : '';
            if (!sheet)
                throw new Error('GET_EXCEL_COLUMN requires a "sheet" parameter');
            if ((params === null || params === void 0 ? void 0 : params.column) === undefined || (params === null || params === void 0 ? void 0 : params.column) === null || (params === null || params === void 0 ? void 0 : params.column) === '') {
                throw new Error('GET_EXCEL_COLUMN requires a "column" parameter (letter or 1-based index)');
            }
            // Accept a letter ("B"), a number (2), or a numeric string ("2").
            let column = params.column;
            if (typeof column === 'string') {
                const s = column.trim();
                column = /^\d+$/.test(s) ? Number(s) : s;
            }
            const options = {
                startRow: (params === null || params === void 0 ? void 0 : params.startRow) !== undefined ? Number(params.startRow) : undefined,
                endRow: (params === null || params === void 0 ? void 0 : params.endRow) !== undefined ? Number(params.endRow) : undefined,
                skipHeader: (0, utils_1.resolveBooleanFlag)(params === null || params === void 0 ? void 0 : params.skipHeader, false),
            };
            return handle.filler.getColumn(sheet, column, options);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'GET_EXCEL_RANGE',
        description: 'Reads a rectangular range as a row-major 2D array. Give the range as a "ref" parameter ' +
            'in "SheetName!A1:C100" form (a single-cell ref returns a 1×1 array). Empty cells read ' +
            'as null; formula cells return their computed result.',
        inputs: [
            { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
        ],
        outputType: 'any[][]',
        parameters: [
            { name: 'ref', type: 'string', description: 'Range reference in "SheetName!A1:C100" form.', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const handle = requireHandle(input, 'GET_EXCEL_RANGE');
            const ref = typeof (params === null || params === void 0 ? void 0 : params.ref) === 'string' ? params.ref.trim() : '';
            if (!ref)
                throw new Error('GET_EXCEL_RANGE requires a "ref" parameter (e.g. "Sheet1!A1:C100")');
            return handle.filler.getRange(ref);
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'COLUMNS_TO_TIMESERIES',
        description: 'Pairs a timestamps column with a values column into a timeseries ({ date, value }[]) ' +
            'ready to inject with INSERT_TIMESERIES. Takes 2 inputs: [timestamps, values] (e.g. two ' +
            'GET_EXCEL_COLUMN outputs). Date-formatted cells parse automatically; set ' +
            '"dateIsExcelSerial" if the timestamp column holds raw Excel serial numbers. Rows whose ' +
            'date or value can\'t be parsed are dropped by default (set "dropInvalid" false to throw). ' +
            'Output is sorted by date ascending.',
        inputs: [
            { name: 'timestamps', types: ['any[]'], description: 'Column of timestamps (Date cells, epoch-ms numbers, Excel serials, or date strings).', required: true },
            { name: 'values', types: ['any[]'], description: 'Column of numeric values, aligned row-for-row with timestamps.', required: true },
        ],
        outputType: 'SpinalDateValue[]',
        parameters: [
            { name: 'dateIsExcelSerial', type: 'boolean', description: 'Interpret numeric timestamps as Excel serial day numbers instead of epoch ms (default false).', required: false },
            { name: 'dropInvalid', type: 'boolean', description: 'Drop rows whose date or value can\'t be parsed (default true). Set false to throw on the first bad row.', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            if (!Array.isArray(input) || input.length < 2) {
                throw new Error('COLUMNS_TO_TIMESERIES expects 2 inputs: [timestamps, values]');
            }
            const dates = asArray(input[0], 'COLUMNS_TO_TIMESERIES');
            const values = asArray(input[1], 'COLUMNS_TO_TIMESERIES');
            const excelSerial = (0, utils_1.resolveBooleanFlag)(params === null || params === void 0 ? void 0 : params.dateIsExcelSerial, false);
            const dropInvalid = (0, utils_1.resolveBooleanFlag)(params === null || params === void 0 ? void 0 : params.dropInvalid, true);
            const n = Math.min(dates.length, values.length);
            const out = [];
            for (let i = 0; i < n; i++) {
                const date = toEpochMs(dates[i], excelSerial);
                const value = toNumericValue(values[i]);
                if (date === null || value === null) {
                    if (dropInvalid)
                        continue;
                    throw new Error(`COLUMNS_TO_TIMESERIES: unparseable pair at row ${i} ` +
                        `(date=${JSON.stringify(dates[i])}, value=${JSON.stringify(values[i])})`);
                }
                out.push({ date, value });
            }
            out.sort((a, b) => a.date - b.date);
            return out;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SET_EXCEL_VARIABLES',
        description: 'Fills the template\'s {{token}} placeholders from an object mapping variable name → ' +
            'value. Scalars replace the token (sole-token cells keep the value\'s type; embedded ' +
            'tokens are substituted as text). An array value fills downward from its cell. Returns ' +
            'the same workbook so you can chain more blocks.',
        inputs: [
            { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
            { name: 'variables', types: ['object', 'string'], description: 'Object (or JSON string) mapping variable name → value (scalar or array).', required: true },
        ],
        outputType: 'ExcelWorkbook',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const [handle, payload] = requireHandleAndPayload(input, 'SET_EXCEL_VARIABLES');
            handle.filler.setVariables(asPlainObject(payload, 'SET_EXCEL_VARIABLES'));
            return handle;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SET_EXCEL_CELLS',
        description: 'Writes values to specific cells from an object whose keys are "SheetName!CellRef" ' +
            '(e.g. "Sheet1!B3") and whose values are the cell values. A value may also be an object ' +
            '{ "value": <v>, "color": "4CAF50", "comment": "note" } to color the cell / attach a ' +
            'note. Returns the same workbook.',
        inputs: [
            { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
            { name: 'cells', types: ['object', 'string'], description: 'Object (or JSON string) mapping "Sheet!Cell" → value or { value, color, comment }.', required: true },
        ],
        outputType: 'ExcelWorkbook',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const [handle, payload] = requireHandleAndPayload(input, 'SET_EXCEL_CELLS');
            handle.filler.setCells(asPlainObject(payload, 'SET_EXCEL_CELLS'));
            return handle;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SET_EXCEL_RANGE',
        description: 'Fills a range from an array starting at an anchor cell. A 1D array fills a column ' +
            '(default) or a row (set "direction" to "row"); a 2D array fills a row-major block — ' +
            'ideal for tables. Each value may be a { value, color, comment } object too. Returns ' +
            'the same workbook.',
        inputs: [
            { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
            { name: 'values', types: ['array', 'string'], description: 'A 1D or 2D array (or JSON string) of values to write from the anchor.', required: true },
        ],
        outputType: 'ExcelWorkbook',
        parameters: [
            { name: 'anchor', type: 'string', description: 'Anchor cell to start from, "SheetName!CellRef" (e.g. "Sheet1!B3").', required: true },
            { name: 'direction', type: 'string', description: 'For 1D arrays: "column" (default, downward) or "row" (rightward). Ignored for 2D arrays.', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const [handle, payload] = requireHandleAndPayload(input, 'SET_EXCEL_RANGE');
            const anchor = params === null || params === void 0 ? void 0 : params.anchor;
            if (typeof anchor !== 'string' || anchor.trim().length === 0) {
                throw new Error('SET_EXCEL_RANGE requires an "anchor" parameter like "Sheet1!B3"');
            }
            const direction = (params === null || params === void 0 ? void 0 : params.direction) === 'row' ? 'row' : 'column';
            const values = asArray(payload, 'SET_EXCEL_RANGE');
            handle.filler.setRange(anchor, values, { direction });
            return handle;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SET_EXCEL_COMMENTS',
        description: 'Attaches comments (Excel "notes") to cells without changing their values, from an ' +
            'object mapping "SheetName!CellRef" → comment text. Returns the same workbook.',
        inputs: [
            { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
            { name: 'comments', types: ['object', 'string'], description: 'Object (or JSON string) mapping "Sheet!Cell" → comment text.', required: true },
        ],
        outputType: 'ExcelWorkbook',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const [handle, payload] = requireHandleAndPayload(input, 'SET_EXCEL_COMMENTS');
            handle.filler.setComments(asPlainObject(payload, 'SET_EXCEL_COMMENTS'));
            return handle;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'ADD_EXCEL_SHEET',
        description: 'Adds a sheet to the workbook. With "copyFrom" it duplicates an existing sheet (values, ' +
            'styles, column widths, row heights, merged ranges — a common "one sheet per client" ' +
            'pattern; images are not copied). {{tokens}} on the copied sheet become fillable too. ' +
            'Returns the same workbook.',
        inputs: [
            { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
        ],
        outputType: 'ExcelWorkbook',
        parameters: [
            { name: 'name', type: 'string', description: 'Name of the new sheet.', required: true },
            { name: 'copyFrom', type: 'string', description: 'Optional name of an existing sheet to duplicate.', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const handle = requireHandle(input, 'ADD_EXCEL_SHEET');
            const name = params === null || params === void 0 ? void 0 : params.name;
            if (typeof name !== 'string' || name.trim().length === 0) {
                throw new Error('ADD_EXCEL_SHEET requires a non-empty "name" parameter');
            }
            const copyFrom = typeof (params === null || params === void 0 ? void 0 : params.copyFrom) === 'string' && params.copyFrom.trim().length > 0
                ? params.copyFrom.trim()
                : undefined;
            handle.filler.addSheet(name, copyFrom ? { copyFrom } : {});
            return handle;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'RENAME_EXCEL_SHEET',
        description: 'Renames a sheet. Throws if the source sheet is missing or the new name is already taken. ' +
            'Returns the same workbook.',
        inputs: [
            { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
        ],
        outputType: 'ExcelWorkbook',
        parameters: [
            { name: 'oldName', type: 'string', description: 'Current sheet name.', required: true },
            { name: 'newName', type: 'string', description: 'New sheet name.', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const handle = requireHandle(input, 'RENAME_EXCEL_SHEET');
            const oldName = params === null || params === void 0 ? void 0 : params.oldName;
            const newName = params === null || params === void 0 ? void 0 : params.newName;
            if (typeof oldName !== 'string' || oldName.trim().length === 0) {
                throw new Error('RENAME_EXCEL_SHEET requires an "oldName" parameter');
            }
            if (typeof newName !== 'string' || newName.trim().length === 0) {
                throw new Error('RENAME_EXCEL_SHEET requires a "newName" parameter');
            }
            handle.filler.renameSheet(oldName, newName);
            return handle;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'DELETE_EXCEL_SHEET',
        description: 'Removes a sheet from the workbook by name. Throws if it does not exist. Returns the same workbook.',
        inputs: [
            { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
        ],
        outputType: 'ExcelWorkbook',
        parameters: [
            { name: 'name', type: 'string', description: 'Name of the sheet to delete.', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const handle = requireHandle(input, 'DELETE_EXCEL_SHEET');
            const name = params === null || params === void 0 ? void 0 : params.name;
            if (typeof name !== 'string' || name.trim().length === 0) {
                throw new Error('DELETE_EXCEL_SHEET requires a "name" parameter');
            }
            handle.filler.deleteSheet(name);
            return handle;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SAVE_EXCEL_TO_NODE',
        description: 'Renders the filled workbook and saves it as a document on a node (via the documentation ' +
            'service). Takes 2 inputs: [workbook, targetNode] and a "filename" parameter. "ifExists" ' +
            'controls same-name conflicts (replace by default). Set "preserveCharts" to keep charts ' +
            'embedded in the original template. Returns the target node.',
        inputs: [
            { name: 'workbook', types: ['ExcelWorkbook'], description: 'The filled workbook.', required: true },
            { name: 'node', types: ['SpinalNode'], description: 'The node to attach the produced .xlsx document to.', required: true },
        ],
        outputType: 'SpinalNode',
        parameters: [
            { name: 'filename', type: 'string', description: 'File name for the saved document (e.g. "report.xlsx"). ".xlsx" is appended if missing.', required: true },
            { name: 'ifExists', type: 'string', description: 'What to do if the node already has a document with the same name: "replace" (default — overwrite it), "error" (fail without writing), or "allow" (keep both, may create duplicates).', required: false },
            { name: 'preserveCharts', type: 'boolean', description: 'If true, restores charts from the original template that ExcelJS would otherwise drop (default: false).', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const [handle, nodeRaw] = requireHandleAndPayload(input, 'SAVE_EXCEL_TO_NODE');
            const node = resolveNode(nodeRaw);
            if (!node)
                throw new Error('SAVE_EXCEL_TO_NODE: second input must be a SpinalNode');
            let filename = params === null || params === void 0 ? void 0 : params.filename;
            if (typeof filename !== 'string' || filename.trim().length === 0) {
                throw new Error('SAVE_EXCEL_TO_NODE requires a "filename" parameter');
            }
            filename = filename.trim();
            if (!/\.xlsx?$/i.test(filename))
                filename += '.xlsx';
            const ifExists = resolveIfExists(params === null || params === void 0 ? void 0 : params.ifExists);
            const preserveCharts = (0, utils_1.resolveBooleanFlag)(params === null || params === void 0 ? void 0 : params.preserveCharts, false);
            const buffer = yield produceBuffer(handle, preserveCharts);
            yield saveBufferAsDocument(node, filename, buffer, ifExists);
            return node;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'EXCEL_TO_BASE64',
        description: 'Renders the filled workbook and returns it as a base64 string — handy to send the ' +
            'report elsewhere (e.g. POST it via CURL_REQUEST, email it, push to external storage). ' +
            'Set "preserveCharts" to keep charts from the original template.',
        inputs: [
            { name: 'workbook', types: ['ExcelWorkbook'], description: 'The filled workbook.', required: true },
        ],
        outputType: 'string',
        parameters: [
            { name: 'preserveCharts', type: 'boolean', description: 'If true, restores charts from the original template that ExcelJS would otherwise drop (default: false).', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const handle = requireHandle(input, 'EXCEL_TO_BASE64');
            const preserveCharts = (0, utils_1.resolveBooleanFlag)(params === null || params === void 0 ? void 0 : params.preserveCharts, false);
            const buffer = yield produceBuffer(handle, preserveCharts);
            return buffer.toString('base64');
        }),
    }),
];
//# sourceMappingURL=excel.algorithms.js.map