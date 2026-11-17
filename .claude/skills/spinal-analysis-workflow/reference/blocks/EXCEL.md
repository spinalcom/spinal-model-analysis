<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->
# Excel (EXCEL)

Read an Excel document, or fill one into a report.

## LOAD_EXCEL

Load Excel · French label in the builder: « Charger un Excel »

`LOAD_EXCEL(node: SpinalNode) → ExcelWorkbook`

Loads an .xlsx document stored on a node and returns an Excel workbook handle. From it you can READ (GET_EXCEL_CELL / GET_EXCEL_COLUMN / GET_EXCEL_RANGE / GET_EXCEL_ROWS / GET_EXCEL_SHEETS) and/or FILL (SET_EXCEL_* blocks) then save with SAVE_EXCEL_TO_NODE / EXCEL_TO_BASE64. By default it picks the first .xlsx document on the node; set the "filename" parameter to choose a specific one. An optional "defaultColor" (hex, no #) is applied as the background of every filled cell.

Inputs, in this order:
1. `node` (SpinalNode) — The node holding the .xlsx document as an attachment.

Parameters:
- `filename` (string, optional) — Name of the document to load (e.g. "report.xlsx"). If omitted, the first .xlsx attached to the node is used.
- `defaultColor` (string, optional) — Optional default cell background color as a hex string without "#" (e.g. "E3F2FD"), applied to every filled cell.

## GET_EXCEL_VARIABLES

Get Excel Variables · French label in the builder: « Lire les variables Excel »

`GET_EXCEL_VARIABLES(workbook: ExcelWorkbook) → string[]`

Returns the list of {{token}} variable names found in the loaded template. Useful to discover what a template expects before filling it (feed it to LOG or FOREACH).

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The workbook from LOAD_EXCEL.

Parameters: none.

## GET_EXCEL_SHEETS

Get Excel Sheets · French label in the builder: « Lire les feuilles Excel »

`GET_EXCEL_SHEETS(workbook: ExcelWorkbook) → string[]`

Returns the names of every worksheet in the loaded workbook, in tab order — handy to discover sheet names before reading cells/columns/ranges.

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The workbook from LOAD_EXCEL.

Parameters: none.

## GET_EXCEL_CELL

Get Excel Cell · French label in the builder: « Lire une cellule Excel »

`GET_EXCEL_CELL(workbook: ExcelWorkbook) → any`

Reads a single cell value. Give the cell as a "ref" parameter in "SheetName!CellRef" form (e.g. "Sheet1!B3"). Formula cells return their computed result; empty cells return null.

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The workbook from LOAD_EXCEL.

Parameters:
- `ref` (string, required) — Cell reference in "SheetName!CellRef" form, e.g. "Sheet1!B3".

## GET_EXCEL_COLUMN

Get Excel Column · French label in the builder: « Lire une colonne Excel »

`GET_EXCEL_COLUMN(workbook: ExcelWorkbook) → any[]`

Reads a whole column top-to-bottom as an array of values. Params: "sheet" (name), "column" (letter like "B" or 1-based index), plus optional "startRow"/"endRow" (1-based, inclusive; endRow defaults to the last used row) and "skipHeader" to drop the first row. Pair two columns (timestamps + values) with COLUMNS_TO_TIMESERIES to build an injectable series.

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The workbook from LOAD_EXCEL.

Parameters:
- `sheet` (string, required) — Worksheet name to read from.
- `column` (string, required) — Column letter (e.g. "B") or 1-based index (e.g. 2).
- `startRow` (number, optional, default 1) — First row to read (1-based). Default 1.
- `endRow` (number, optional) — Last row to read (1-based, inclusive). Default: the sheet's last used row.
- `skipHeader` (boolean, optional, default false) — Skip the first row in range as a header (default false).

## GET_EXCEL_RANGE

Get Excel Range · French label in the builder: « Lire une plage Excel »

`GET_EXCEL_RANGE(workbook: ExcelWorkbook) → any[][]`

Reads a rectangular range as a row-major 2D array. Give the range as a "ref" parameter in "SheetName!A1:C100" form (a single-cell ref returns a 1×1 array). Empty cells read as null; formula cells return their computed result.

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The workbook from LOAD_EXCEL.

Parameters:
- `ref` (string, required) — Range reference in "SheetName!A1:C100" form.

## GET_EXCEL_ROWS

Get Excel Rows · French label in the builder: « Lire les lignes Excel »

`GET_EXCEL_ROWS(workbook: ExcelWorkbook) → object[]`

Reads a table as a list of rows, one object per row keyed by the header row — e.g. [{ "Nom": "Fuite", "Priorité": 2 }, …] — to process each line with a FOREACH (read a cell with GET_PROPERTY, or give the whole row to CREATE_TICKET). Reads down to the last used row, so lines added to the file later are picked up; empty rows are skipped, and so are columns without a name. "columns" keeps only some columns and can rename them: "Nom=name, Priorité=priority, Local". Values keep their type (numbers, dates, …); empty cells read as null; formula cells return their computed result.

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The workbook from LOAD_EXCEL.

Parameters:
- `sheet` (string, optional) — Worksheet to read. Default: the first sheet.
- `headerRow` (number, optional, default 1) — Row holding the column names (1-based, default 1). The data starts on the next row.
- `columns` (string, optional) — Optional comma-separated columns to keep, as "Header" or "Header=key" to rename one (e.g. "Nom=name, Priorité=priority, Local"). Default: every named column, keyed by its header.

## COLUMNS_TO_TIMESERIES

Columns to Timeseries · French label in the builder: « Colonnes vers série temporelle »

`COLUMNS_TO_TIMESERIES(timestamps: any[], values: any[]) → SpinalDateValue[]`

Pairs a timestamps column with a values column into a timeseries ({ date, value }[]) ready to inject with INSERT_TIMESERIES. Takes 2 inputs: [timestamps, values] (e.g. two GET_EXCEL_COLUMN outputs). Date-formatted cells parse automatically; set "dateIsExcelSerial" if the timestamp column holds raw Excel serial numbers. Rows whose date or value can't be parsed are dropped by default (set "dropInvalid" false to throw). Output is sorted by date ascending.

Inputs, in this order:
1. `timestamps` (any[]) — Column of timestamps (Date cells, epoch-ms numbers, Excel serials, or date strings).
2. `values` (any[]) — Column of numeric values, aligned row-for-row with timestamps.

Parameters:
- `dateIsExcelSerial` (boolean, optional, default false) — Interpret numeric timestamps as Excel serial day numbers instead of epoch ms (default false).
- `dropInvalid` (boolean, optional, default true) — Drop rows whose date or value can't be parsed (default true). Set false to throw on the first bad row.

## SET_EXCEL_VARIABLES

Fill Excel Variables · French label in the builder: « Remplir les variables Excel »

`SET_EXCEL_VARIABLES(workbook: ExcelWorkbook, variables: object | string) → ExcelWorkbook`

Fills the template's {{token}} placeholders from an object mapping variable name → value. Scalars replace the token (sole-token cells keep the value's type; embedded tokens are substituted as text). An array value fills downward from its cell. Returns the same workbook so you can chain more blocks.

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The workbook from LOAD_EXCEL.
2. `variables` (object | string) — Object (or JSON string) mapping variable name → value (scalar or array).

Parameters: none.

## SET_EXCEL_CELLS

Set Excel Cells · French label in the builder: « Définir des cellules Excel »

`SET_EXCEL_CELLS(workbook: ExcelWorkbook, cells: object | string) → ExcelWorkbook`

Writes values to specific cells from an object whose keys are "SheetName!CellRef" (e.g. "Sheet1!B3") and whose values are the cell values. A value may also be an object { "value": <v>, "color": "4CAF50", "comment": "note" } to color the cell / attach a note. Returns the same workbook.

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The workbook from LOAD_EXCEL.
2. `cells` (object | string) — Object (or JSON string) mapping "Sheet!Cell" → value or { value, color, comment }.

Parameters: none.

## SET_EXCEL_RANGE

Fill Excel Range · French label in the builder: « Remplir une plage Excel »

`SET_EXCEL_RANGE(workbook: ExcelWorkbook, values: any[] | string) → ExcelWorkbook`

Fills a range from an array starting at an anchor cell. A 1D array fills a column (default) or a row (set "direction" to "row"); a 2D array fills a row-major block — ideal for tables. Each value may be a { value, color, comment } object too. Returns the same workbook.

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The workbook from LOAD_EXCEL.
2. `values` (any[] | string) — A 1D or 2D array (or JSON string) of values to write from the anchor.

Parameters:
- `anchor` (string, required) — Anchor cell to start from, "SheetName!CellRef" (e.g. "Sheet1!B3").
- `direction` (string, optional, one of "column", "row", default "column") — For 1D arrays: "column" (default, downward) or "row" (rightward). Ignored for 2D arrays.

## SET_EXCEL_COMMENTS

Set Excel Comments · French label in the builder: « Définir des commentaires Excel »

`SET_EXCEL_COMMENTS(workbook: ExcelWorkbook, comments: object | string) → ExcelWorkbook`

Attaches comments (Excel "notes") to cells without changing their values, from an object mapping "SheetName!CellRef" → comment text. Returns the same workbook.

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The workbook from LOAD_EXCEL.
2. `comments` (object | string) — Object (or JSON string) mapping "Sheet!Cell" → comment text.

Parameters: none.

## ADD_EXCEL_SHEET

Add Excel Sheet · French label in the builder: « Ajouter une feuille Excel »

`ADD_EXCEL_SHEET(workbook: ExcelWorkbook) → ExcelWorkbook`

Adds a sheet to the workbook. With "copyFrom" it duplicates an existing sheet (values, styles, column widths, row heights, merged ranges — a common "one sheet per client" pattern; images are not copied). {{tokens}} on the copied sheet become fillable too. Returns the same workbook.

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The workbook from LOAD_EXCEL.

Parameters:
- `name` (string, required) — Name of the new sheet.
- `copyFrom` (string, optional) — Optional name of an existing sheet to duplicate.

## RENAME_EXCEL_SHEET

Rename Excel Sheet · French label in the builder: « Renommer une feuille Excel »

`RENAME_EXCEL_SHEET(workbook: ExcelWorkbook) → ExcelWorkbook`

Renames a sheet. Throws if the source sheet is missing or the new name is already taken. Returns the same workbook.

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The workbook from LOAD_EXCEL.

Parameters:
- `oldName` (string, required) — Current sheet name.
- `newName` (string, required) — New sheet name.

## DELETE_EXCEL_SHEET

Delete Excel Sheet · French label in the builder: « Supprimer une feuille Excel »

`DELETE_EXCEL_SHEET(workbook: ExcelWorkbook) → ExcelWorkbook`

Removes a sheet from the workbook by name. Throws if it does not exist. Returns the same workbook.

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The workbook from LOAD_EXCEL.

Parameters:
- `name` (string, required) — Name of the sheet to delete.

## SAVE_EXCEL_TO_NODE

Save Excel to Node · French label in the builder: « Enregistrer l'Excel sur un nœud »

`SAVE_EXCEL_TO_NODE(workbook: ExcelWorkbook, node: SpinalNode) → SpinalNode`

Renders the filled workbook and saves it as a document on a node (via the documentation service). Takes 2 inputs: [workbook, targetNode] and a "filename" parameter. "ifExists" controls same-name conflicts (replace by default). Set "preserveCharts" to keep charts embedded in the original template. Returns the target node.

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The filled workbook.
2. `node` (SpinalNode) — The node to attach the produced .xlsx document to.

Parameters:
- `filename` (string, required) — File name for the saved document (e.g. "report.xlsx"). ".xlsx" is appended if missing.
- `ifExists` (string, optional, one of "replace", "error", "allow", default "replace") — What to do if the node already has a document with the same name: "replace" (default — overwrite it), "error" (fail without writing), or "allow" (keep both, may create duplicates).
- `preserveCharts` (boolean, optional, default false) — If true, restores charts from the original template that ExcelJS would otherwise drop (default: false).

## EXCEL_TO_BASE64

Excel to Base64 · French label in the builder: « Excel vers Base64 »

`EXCEL_TO_BASE64(workbook: ExcelWorkbook) → string`

Renders the filled workbook and returns it as a base64 string — handy to send the report elsewhere (e.g. POST it via CURL_REQUEST, email it, push to external storage). Set "preserveCharts" to keep charts from the original template.

Inputs, in this order:
1. `workbook` (ExcelWorkbook) — The filled workbook.

Parameters:
- `preserveCharts` (boolean, optional, default false) — If true, restores charts from the original template that ExcelJS would otherwise drop (default: false).
