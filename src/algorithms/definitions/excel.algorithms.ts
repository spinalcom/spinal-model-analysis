/* eslint-disable @typescript-eslint/no-explicit-any */
import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { FileSystem } from 'spinal-core-connectorjs_type';
// The file-management APIs used by LOAD_EXCEL / SAVE_EXCEL_TO_NODE
// (getFilesLinkedToNode / uploadFiles / removeFileLinked / getCurrentVersionAsBuffer) exist
// only on the newer documentation-service. Access FileExplorer through `any` so this module
// compiles against ANY doc-service version, and detect availability at runtime
// (see docServiceSupportsFileApi) so on an older doc-service those two blocks fail with a clear
// message instead of "not a function". Every other Excel block operates purely on the in-memory
// workbook handle and needs none of this.
import * as documentationService from 'spinal-env-viewer-plugin-documentation-service';
const FileExplorer: any = (documentationService as any)?.FileExplorer;
import {
  AlgorithmDefinition,
  AlgorithmRunResult,
  createAlgorithm,
} from './core';
import { resolveBooleanFlag } from '../../services/utils';

/**
 * Whether the installed documentation-service exposes the file-management API the file-backed
 * Excel blocks need. Lets a deployment run with the stable doc-service (Excel document read/write
 * dormant) or the newer one (fully enabled) from the same codebase — no branch fork, no
 * commented-out code. Reusable for any future doc-service-file-dependent feature.
 */
export function docServiceSupportsFileApi(): boolean {
  return Boolean(
    FileExplorer &&
    typeof FileExplorer.getFilesLinkedToNode === 'function' &&
    typeof FileExplorer.uploadFiles === 'function' &&
    typeof FileExplorer.removeFileLinked === 'function'
  );
}

/** Throws a clear, actionable error when the doc-service file API is missing. */
function requireDocServiceFileApi(blockName: string): void {
  if (docServiceSupportsFileApi()) return;
  throw new Error(
    `${blockName}: requires the documentation-service file API ` +
    `(getFilesLinkedToNode / uploadFiles / removeFileLinked). This deployment's ` +
    `spinal-env-viewer-plugin-documentation-service does not provide it — update it to enable ` +
    `Excel document read/write. (All non-file Excel blocks still work.)`
  );
}

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
const _importESM = new Function('specifier', 'return import(specifier);') as (
  specifier: string
) => Promise<any>;
let _fillerModulePromise: Promise<any> | null = null;
async function loadFillerClass(): Promise<any> {
  if (!_fillerModulePromise) {
    _fillerModulePromise = _importESM('spinal-service-excel-filler');
  }
  const mod = await _fillerModulePromise;
  const ctor = mod?.SpinalExcelFiller ?? mod?.default?.SpinalExcelFiller ?? mod?.default;
  if (typeof ctor !== 'function') {
    throw new Error(
      'Could not load SpinalExcelFiller from "spinal-service-excel-filler" (unexpected module shape)'
    );
  }
  return ctor;
}

/**
 * The subset of the SpinalExcelFiller surface these blocks use. Declared locally so we
 * stay decoupled from the ESM package's types (which we can't statically import here).
 */
/** A value read out of a cell (formula → result, rich text → string, empty → null). */
type ExcelCellValue = string | number | boolean | Date | null;

interface IExcelFiller {
  loadTemplateFromBuffer(buffer: Buffer): Promise<void>;
  getVariables(): string[];
  getVariableLocations(): Record<string, string[]>;
  setVariables(vars: Record<string, unknown>): void;
  setCells(cells: Record<string, unknown>): void;
  setRange(
    anchor: string,
    values: unknown[] | unknown[][],
    options?: { direction?: 'row' | 'column' }
  ): void;
  setComments(comments: Record<string, unknown>): void;
  addSheet(name: string, options?: { copyFrom?: string }): unknown;
  renameSheet(oldName: string, newName: string): void;
  deleteSheet(name: string): void;
  toBuffer(): Promise<Buffer>;
  toBufferWithCharts(originalBuffer: Buffer): Promise<Buffer>;
  // ── read side ──
  getSheetNames(): string[];
  getCell(ref: string): ExcelCellValue;
  getColumn(
    sheet: string,
    column: string | number,
    options?: { startRow?: number; endRow?: number; skipHeader?: boolean }
  ): ExcelCellValue[];
  getRange(ref: string): ExcelCellValue[][];
}

/** Live workbook passed between Excel blocks. `__excelHandle` brands it for detection. */
interface ExcelWorkbookHandle {
  __excelHandle: true;
  filler: IExcelFiller;
  /** Original template bytes, kept so SAVE/EXPORT can preserve embedded charts. */
  originalBuffer: Buffer | null;
  /** Name of the template document it was loaded from (for defaults/debugging). */
  sourceName: string | null;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const isSpinalNode = (value: unknown): value is SpinalNode<any> =>
  Boolean(value) &&
  typeof value === 'object' &&
  typeof (value as SpinalNode<any>).getId === 'function';

/** Accepts a node, or a node array (takes the first), like the other node-consuming blocks. */
const resolveNode = (value: unknown): SpinalNode<any> | undefined => {
  if (isSpinalNode(value)) return value;
  if (Array.isArray(value) && value.length > 0 && isSpinalNode(value[0])) return value[0];
  return undefined;
};

const isExcelHandle = (value: unknown): value is ExcelWorkbookHandle =>
  Boolean(value) && typeof value === 'object' && (value as any).__excelHandle === true;

/** Extracts the workbook handle for single-input blocks. */
function requireHandle(input: unknown, blockName: string): ExcelWorkbookHandle {
  if (isExcelHandle(input)) return input;
  throw new Error(
    `${blockName}: expected an Excel workbook (wire it from LOAD_EXCEL)`
  );
}

/** Extracts [handle, payload] for the two-input SET_* blocks. */
function requireHandleAndPayload(
  input: unknown,
  blockName: string
): [ExcelWorkbookHandle, unknown] {
  if (!Array.isArray(input) || input.length < 2) {
    throw new Error(`${blockName} expects 2 inputs: [workbook, payload]`);
  }
  return [requireHandle(input[0], blockName), input[1]];
}

/** Parses a "map" payload that may arrive as a JSON string (object family) or a live object. */
function asPlainObject(value: unknown, blockName: string): Record<string, unknown> {
  let obj: unknown = value;
  if (typeof value === 'string') {
    try {
      obj = JSON.parse(value);
    } catch {
      throw new Error(`${blockName}: input must be a JSON object string or an object`);
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error(
      `${blockName}: expected an object (got ${Array.isArray(obj) ? 'array' : typeof obj})`
    );
  }
  return obj as Record<string, unknown>;
}

/** Parses a values payload that may arrive as a JSON string or a live array (1D or 2D). */
function asArray(value: unknown, blockName: string): unknown[] {
  let v: unknown = value;
  if (typeof value === 'string') {
    try {
      v = JSON.parse(value);
    } catch {
      throw new Error(`${blockName}: values must be a JSON array or an array`);
    }
  }
  if (!Array.isArray(v)) throw new Error(`${blockName}: expected an array of values`);
  return v;
}

/**
 * Builds the absolute Spinalhub base URL (e.g. "http://127.0.0.1:8888") from the live
 * connection. The documentation service's getCurrentVersionAsBuffer(hubUrl) needs an
 * absolute URL server-side (its default "" only works in a browser).
 */
function getHubUrl(): string {
  const fs: any = (FileSystem as any).get_inst?.();
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
  if (port) url += `:${port}`;
  return url;
}

const safeFileName = (file: any): string => {
  const n = file?.name?.get?.();
  return typeof n === 'string' ? n : '';
};

/** Renders the filled workbook to a Buffer, optionally preserving embedded charts. */
async function produceBuffer(
  handle: ExcelWorkbookHandle,
  preserveCharts: boolean
): Promise<Buffer> {
  if (preserveCharts && handle.originalBuffer) {
    return handle.filler.toBufferWithCharts(handle.originalBuffer);
  }
  return handle.filler.toBuffer();
}

/** What SAVE_EXCEL_TO_NODE does when the node already has a document with the same name. */
type IfExists = 'replace' | 'error' | 'allow';

/** Resolves the ifExists parameter (default 'replace'); accepts a few friendly aliases. */
function resolveIfExists(value: unknown): IfExists {
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === '' ) return 'replace';
    if (v === 'replace' || v === 'overwrite') return 'replace';
    if (v === 'error' || v === 'deny' || v === 'fail') return 'error';
    if (v === 'allow' || v === 'keep' || v === 'both') return 'allow';
    throw new Error(
      `SAVE_EXCEL_TO_NODE: invalid "ifExists" value "${value}" (use "replace", "error", or "allow")`
    );
  }
  return 'replace';
}

/**
 * Saves a buffer as a document on a node, honoring the same-name conflict policy:
 *  - 'replace' (default): remove every existing document with that name, then add the new one.
 *  - 'error': throw if a document with that name already exists (nothing is written).
 *  - 'allow': just add it (the previous behavior — may create duplicates).
 */
async function saveBufferAsDocument(
  node: SpinalNode<any>,
  filename: string,
  buffer: Buffer,
  ifExists: IfExists
): Promise<void> {
  requireDocServiceFileApi('SAVE_EXCEL_TO_NODE');
  if (ifExists !== 'allow') {
    const existing = (await FileExplorer.getFilesLinkedToNode(node)) ?? [];
    const matches = existing.filter((f: any) => safeFileName(f) === filename);
    if (matches.length > 0) {
      if (ifExists === 'error') {
        throw new Error(
          `SAVE_EXCEL_TO_NODE: a document named "${filename}" already exists on the node ` +
          `(ifExists="error"). Use ifExists="replace" to overwrite, or "allow" to keep both.`
        );
      }
      // 'replace' — drop all existing documents with that name before adding the new one.
      for (const f of matches) {
        await FileExplorer.removeFileLinked(node, f as any);
      }
    }
  }
  await FileExplorer.uploadFiles(node, [{ name: filename, buffer }]);
}

/**
 * Loads the .xlsx document attached to a node into a live Excel workbook handle that supports
 * both reading (GET_EXCEL_*) and filling (SET_EXCEL_*).
 */
async function loadWorkbookHandle(
  input: unknown,
  params: Record<string, unknown> | undefined,
  blockName: string
): Promise<ExcelWorkbookHandle> {
  requireDocServiceFileApi(blockName);
  const node = resolveNode(input);
  if (!node) throw new Error(`${blockName}: input must be a SpinalNode`);

  const files = await FileExplorer.getFilesLinkedToNode(node);
  if (!files || files.length === 0) {
    throw new Error(`${blockName}: the node has no attached document`);
  }

  const requested = typeof params?.filename === 'string' ? params.filename.trim() : '';
  let chosen: any;
  if (requested) {
    chosen =
      files.find((f) => safeFileName(f) === requested) ||
      files.find((f) => safeFileName(f).toLowerCase() === requested.toLowerCase());
    if (!chosen) {
      const available = files.map((f) => safeFileName(f)).filter(Boolean).join(', ');
      throw new Error(
        `${blockName}: no document named "${requested}" on the node (found: ${available || 'none'})`
      );
    }
  } else {
    chosen = files.find((f) => /\.xlsx?$/i.test(safeFileName(f))) || files[0];
  }

  if (typeof chosen.getCurrentVersionAsBuffer !== 'function') {
    throw new Error(`${blockName}: document "${safeFileName(chosen)}" cannot be read as a buffer`);
  }
  const buffer: Buffer = await chosen.getCurrentVersionAsBuffer(getHubUrl());

  const Filler = await loadFillerClass();
  const defaultColor =
    typeof params?.defaultColor === 'string' && (params.defaultColor as string).trim().length > 0
      ? (params.defaultColor as string).trim()
      : undefined;
  const filler: IExcelFiller = new Filler(defaultColor ? { defaultColor } : {});
  await filler.loadTemplateFromBuffer(buffer);

  return {
    __excelHandle: true,
    filler,
    originalBuffer: buffer,
    sourceName: safeFileName(chosen) || null,
  };
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
function toEpochMs(value: unknown, excelSerial: boolean): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return isNaN(t) ? null : t;
  }
  if (typeof value === 'number') {
    if (isNaN(value)) return null;
    return excelSerial ? Math.round((value - EXCEL_EPOCH_OFFSET_DAYS) * MS_PER_DAY) : value;
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return null;
    const n = Number(s);
    if (!isNaN(n)) return excelSerial ? Math.round((n - EXCEL_EPOCH_OFFSET_DAYS) * MS_PER_DAY) : n;
    const d = Date.parse(s);
    return isNaN(d) ? null : d;
  }
  return null;
}

/** Coerces a read cell value to a number (booleans → 1/0), or null if it isn't numeric. */
function toNumericValue(value: unknown): number | null {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return null;
    const n = Number(s);
    return isNaN(n) ? null : n;
  }
  return null;
}

// ── blocks ───────────────────────────────────────────────────────────────────

export const EXCEL_ALGORITHMS: AlgorithmDefinition[] = [
  createAlgorithm({
    name: 'LOAD_EXCEL',
    description:
      'Loads an .xlsx document stored on a node and returns an Excel workbook handle. From it ' +
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
    run: async (input, params): AlgorithmRunResult => {
      return (await loadWorkbookHandle(input, params, 'LOAD_EXCEL')) as any;
    },
  }),

  createAlgorithm({
    name: 'GET_EXCEL_VARIABLES',
    description:
      'Returns the list of {{token}} variable names found in the loaded template. Useful to ' +
      'discover what a template expects before filling it (feed it to LOG or FOREACH).',
    inputs: [
      { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
    ],
    outputType: 'string[]',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      const handle = requireHandle(input, 'GET_EXCEL_VARIABLES');
      return handle.filler.getVariables() as any;
    },
  }),

  createAlgorithm({
    name: 'GET_EXCEL_SHEETS',
    description:
      'Returns the names of every worksheet in the loaded workbook, in tab order — handy to ' +
      'discover sheet names before reading cells/columns/ranges.',
    inputs: [
      { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
    ],
    outputType: 'string[]',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      const handle = requireHandle(input, 'GET_EXCEL_SHEETS');
      return handle.filler.getSheetNames() as any;
    },
  }),

  createAlgorithm({
    name: 'GET_EXCEL_CELL',
    description:
      'Reads a single cell value. Give the cell as a "ref" parameter in "SheetName!CellRef" ' +
      'form (e.g. "Sheet1!B3"). Formula cells return their computed result; empty cells return null.',
    inputs: [
      { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
    ],
    outputType: 'any',
    parameters: [
      { name: 'ref', type: 'string', description: 'Cell reference in "SheetName!CellRef" form, e.g. "Sheet1!B3".', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      const handle = requireHandle(input, 'GET_EXCEL_CELL');
      const ref = typeof params?.ref === 'string' ? params.ref.trim() : '';
      if (!ref) throw new Error('GET_EXCEL_CELL requires a "ref" parameter (e.g. "Sheet1!B3")');
      return handle.filler.getCell(ref) as any;
    },
  }),

  createAlgorithm({
    name: 'GET_EXCEL_COLUMN',
    description:
      'Reads a whole column top-to-bottom as an array of values. Params: "sheet" (name), ' +
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
    run: async (input, params): AlgorithmRunResult => {
      const handle = requireHandle(input, 'GET_EXCEL_COLUMN');
      const sheet = typeof params?.sheet === 'string' ? params.sheet.trim() : '';
      if (!sheet) throw new Error('GET_EXCEL_COLUMN requires a "sheet" parameter');
      if (params?.column === undefined || params?.column === null || params?.column === '') {
        throw new Error('GET_EXCEL_COLUMN requires a "column" parameter (letter or 1-based index)');
      }
      // Accept a letter ("B"), a number (2), or a numeric string ("2").
      let column: string | number = params.column as string | number;
      if (typeof column === 'string') {
        const s = column.trim();
        column = /^\d+$/.test(s) ? Number(s) : s;
      }
      const options = {
        startRow: params?.startRow !== undefined ? Number(params.startRow) : undefined,
        endRow: params?.endRow !== undefined ? Number(params.endRow) : undefined,
        skipHeader: resolveBooleanFlag(params?.skipHeader, false),
      };
      return handle.filler.getColumn(sheet, column, options) as any;
    },
  }),

  createAlgorithm({
    name: 'GET_EXCEL_RANGE',
    description:
      'Reads a rectangular range as a row-major 2D array. Give the range as a "ref" parameter ' +
      'in "SheetName!A1:C100" form (a single-cell ref returns a 1×1 array). Empty cells read ' +
      'as null; formula cells return their computed result.',
    inputs: [
      { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
    ],
    outputType: 'any[][]',
    parameters: [
      { name: 'ref', type: 'string', description: 'Range reference in "SheetName!A1:C100" form.', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      const handle = requireHandle(input, 'GET_EXCEL_RANGE');
      const ref = typeof params?.ref === 'string' ? params.ref.trim() : '';
      if (!ref) throw new Error('GET_EXCEL_RANGE requires a "ref" parameter (e.g. "Sheet1!A1:C100")');
      return handle.filler.getRange(ref) as any;
    },
  }),

  createAlgorithm({
    name: 'COLUMNS_TO_TIMESERIES',
    description:
      'Pairs a timestamps column with a values column into a timeseries ({ date, value }[]) ' +
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
    run: async (input, params): AlgorithmRunResult => {
      if (!Array.isArray(input) || input.length < 2) {
        throw new Error('COLUMNS_TO_TIMESERIES expects 2 inputs: [timestamps, values]');
      }
      const dates = asArray(input[0], 'COLUMNS_TO_TIMESERIES');
      const values = asArray(input[1], 'COLUMNS_TO_TIMESERIES');
      const excelSerial = resolveBooleanFlag(params?.dateIsExcelSerial, false);
      const dropInvalid = resolveBooleanFlag(params?.dropInvalid, true);

      const n = Math.min(dates.length, values.length);
      const out: { date: number; value: number }[] = [];
      for (let i = 0; i < n; i++) {
        const date = toEpochMs(dates[i], excelSerial);
        const value = toNumericValue(values[i]);
        if (date === null || value === null) {
          if (dropInvalid) continue;
          throw new Error(
            `COLUMNS_TO_TIMESERIES: unparseable pair at row ${i} ` +
            `(date=${JSON.stringify(dates[i])}, value=${JSON.stringify(values[i])})`
          );
        }
        out.push({ date, value });
      }
      out.sort((a, b) => a.date - b.date);
      return out as any;
    },
  }),

  createAlgorithm({
    name: 'SET_EXCEL_VARIABLES',
    description:
      'Fills the template\'s {{token}} placeholders from an object mapping variable name → ' +
      'value. Scalars replace the token (sole-token cells keep the value\'s type; embedded ' +
      'tokens are substituted as text). An array value fills downward from its cell. Returns ' +
      'the same workbook so you can chain more blocks.',
    inputs: [
      { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
      { name: 'variables', types: ['object', 'string'], description: 'Object (or JSON string) mapping variable name → value (scalar or array).', required: true },
    ],
    outputType: 'ExcelWorkbook',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      const [handle, payload] = requireHandleAndPayload(input, 'SET_EXCEL_VARIABLES');
      handle.filler.setVariables(asPlainObject(payload, 'SET_EXCEL_VARIABLES'));
      return handle as any;
    },
  }),

  createAlgorithm({
    name: 'SET_EXCEL_CELLS',
    description:
      'Writes values to specific cells from an object whose keys are "SheetName!CellRef" ' +
      '(e.g. "Sheet1!B3") and whose values are the cell values. A value may also be an object ' +
      '{ "value": <v>, "color": "4CAF50", "comment": "note" } to color the cell / attach a ' +
      'note. Returns the same workbook.',
    inputs: [
      { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
      { name: 'cells', types: ['object', 'string'], description: 'Object (or JSON string) mapping "Sheet!Cell" → value or { value, color, comment }.', required: true },
    ],
    outputType: 'ExcelWorkbook',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      const [handle, payload] = requireHandleAndPayload(input, 'SET_EXCEL_CELLS');
      handle.filler.setCells(asPlainObject(payload, 'SET_EXCEL_CELLS'));
      return handle as any;
    },
  }),

  createAlgorithm({
    name: 'SET_EXCEL_RANGE',
    description:
      'Fills a range from an array starting at an anchor cell. A 1D array fills a column ' +
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
    run: async (input, params): AlgorithmRunResult => {
      const [handle, payload] = requireHandleAndPayload(input, 'SET_EXCEL_RANGE');
      const anchor = params?.anchor;
      if (typeof anchor !== 'string' || anchor.trim().length === 0) {
        throw new Error('SET_EXCEL_RANGE requires an "anchor" parameter like "Sheet1!B3"');
      }
      const direction = params?.direction === 'row' ? 'row' : 'column';
      const values = asArray(payload, 'SET_EXCEL_RANGE');
      handle.filler.setRange(anchor, values as any, { direction });
      return handle as any;
    },
  }),

  createAlgorithm({
    name: 'SET_EXCEL_COMMENTS',
    description:
      'Attaches comments (Excel "notes") to cells without changing their values, from an ' +
      'object mapping "SheetName!CellRef" → comment text. Returns the same workbook.',
    inputs: [
      { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
      { name: 'comments', types: ['object', 'string'], description: 'Object (or JSON string) mapping "Sheet!Cell" → comment text.', required: true },
    ],
    outputType: 'ExcelWorkbook',
    parameters: [],
    run: async (input): AlgorithmRunResult => {
      const [handle, payload] = requireHandleAndPayload(input, 'SET_EXCEL_COMMENTS');
      handle.filler.setComments(asPlainObject(payload, 'SET_EXCEL_COMMENTS'));
      return handle as any;
    },
  }),

  createAlgorithm({
    name: 'ADD_EXCEL_SHEET',
    description:
      'Adds a sheet to the workbook. With "copyFrom" it duplicates an existing sheet (values, ' +
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
    run: async (input, params): AlgorithmRunResult => {
      const handle = requireHandle(input, 'ADD_EXCEL_SHEET');
      const name = params?.name;
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('ADD_EXCEL_SHEET requires a non-empty "name" parameter');
      }
      const copyFrom =
        typeof params?.copyFrom === 'string' && params.copyFrom.trim().length > 0
          ? params.copyFrom.trim()
          : undefined;
      handle.filler.addSheet(name, copyFrom ? { copyFrom } : {});
      return handle as any;
    },
  }),

  createAlgorithm({
    name: 'RENAME_EXCEL_SHEET',
    description:
      'Renames a sheet. Throws if the source sheet is missing or the new name is already taken. ' +
      'Returns the same workbook.',
    inputs: [
      { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
    ],
    outputType: 'ExcelWorkbook',
    parameters: [
      { name: 'oldName', type: 'string', description: 'Current sheet name.', required: true },
      { name: 'newName', type: 'string', description: 'New sheet name.', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      const handle = requireHandle(input, 'RENAME_EXCEL_SHEET');
      const oldName = params?.oldName;
      const newName = params?.newName;
      if (typeof oldName !== 'string' || oldName.trim().length === 0) {
        throw new Error('RENAME_EXCEL_SHEET requires an "oldName" parameter');
      }
      if (typeof newName !== 'string' || newName.trim().length === 0) {
        throw new Error('RENAME_EXCEL_SHEET requires a "newName" parameter');
      }
      handle.filler.renameSheet(oldName, newName);
      return handle as any;
    },
  }),

  createAlgorithm({
    name: 'DELETE_EXCEL_SHEET',
    description: 'Removes a sheet from the workbook by name. Throws if it does not exist. Returns the same workbook.',
    inputs: [
      { name: 'workbook', types: ['ExcelWorkbook'], description: 'The workbook from LOAD_EXCEL.', required: true },
    ],
    outputType: 'ExcelWorkbook',
    parameters: [
      { name: 'name', type: 'string', description: 'Name of the sheet to delete.', required: true },
    ],
    run: async (input, params): AlgorithmRunResult => {
      const handle = requireHandle(input, 'DELETE_EXCEL_SHEET');
      const name = params?.name;
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('DELETE_EXCEL_SHEET requires a "name" parameter');
      }
      handle.filler.deleteSheet(name);
      return handle as any;
    },
  }),

  createAlgorithm({
    name: 'SAVE_EXCEL_TO_NODE',
    description:
      'Renders the filled workbook and saves it as a document on a node (via the documentation ' +
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
    run: async (input, params): AlgorithmRunResult => {
      const [handle, nodeRaw] = requireHandleAndPayload(input, 'SAVE_EXCEL_TO_NODE');
      const node = resolveNode(nodeRaw);
      if (!node) throw new Error('SAVE_EXCEL_TO_NODE: second input must be a SpinalNode');

      let filename = params?.filename;
      if (typeof filename !== 'string' || filename.trim().length === 0) {
        throw new Error('SAVE_EXCEL_TO_NODE requires a "filename" parameter');
      }
      filename = filename.trim();
      if (!/\.xlsx?$/i.test(filename)) filename += '.xlsx';

      const ifExists = resolveIfExists(params?.ifExists);
      const preserveCharts = resolveBooleanFlag(params?.preserveCharts, false);
      const buffer = await produceBuffer(handle, preserveCharts);

      await saveBufferAsDocument(node, filename, buffer, ifExists);
      return node as any;
    },
  }),

  createAlgorithm({
    name: 'EXCEL_TO_BASE64',
    description:
      'Renders the filled workbook and returns it as a base64 string — handy to send the ' +
      'report elsewhere (e.g. POST it via CURL_REQUEST, email it, push to external storage). ' +
      'Set "preserveCharts" to keep charts from the original template.',
    inputs: [
      { name: 'workbook', types: ['ExcelWorkbook'], description: 'The filled workbook.', required: true },
    ],
    outputType: 'string',
    parameters: [
      { name: 'preserveCharts', type: 'boolean', description: 'If true, restores charts from the original template that ExcelJS would otherwise drop (default: false).', required: false },
    ],
    run: async (input, params): AlgorithmRunResult => {
      const handle = requireHandle(input, 'EXCEL_TO_BASE64');
      const preserveCharts = resolveBooleanFlag(params?.preserveCharts, false);
      const buffer = await produceBuffer(handle, preserveCharts);
      return buffer.toString('base64');
    },
  }),
];
