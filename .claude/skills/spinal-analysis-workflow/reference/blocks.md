<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->
# Blocks — index

135 blocks, from spinal-model-analysis 3.3.0. One line each: `NAME(inputs) → output` · parameters (`*` = required) — what it does.
An input marked `?` is optional, `...` takes one or more. Read `blocks/<CATEGORY>.md` for the full description,
the parameter choices and defaults of the blocks you use — block and parameter names must match exactly.

## Nodes & graph — `blocks/NODE.md`

Find nodes through the graph, read their info, create and link them.

- `FIRST_NODE(nodes: SpinalNode | SpinalNode[]) → SpinalNode` — Returns the node input, or first node of a node array.
- `MERGE_NODES(...nodes: SpinalNode | SpinalNode[]) → SpinalNode[]` · deduplicate — Merges several node inputs into a single SpinalNode array.
- `GET_CONTEXT() → SpinalNode` · name* — Returns the context (SpinalContext) with the given name from the graph.
- `GET_NODE_SERVER_ID(node: SpinalNode) → number` — Returns the ID of a SpinalNode.
- `SET_NODE_INFO(node: SpinalNode, value: any) → SpinalNode` · property* — Sets a property on a node's info to a dynamic value input.
- `SET_NODE_INFO_PARAM(node: SpinalNode) → SpinalNode` · property*, value* — Sets a property on a node's info to a static parameter value.
- `GET_NODE_CHILDREN(node: SpinalNode | SpinalNode[]) → SpinalNode[]` · regex — Returns the children of a node — or of every node of a list, merged without duplicates.
- `GET_NODE_PARENTS(node: SpinalNode | SpinalNode[]) → SpinalNode[]` · regex — Returns the parents of a node — or of every node of a list, merged without duplicates.
- `FIND_IN_CONTEXT(start: SpinalNode | SpinalNode[]) → SpinalNode[]` · type, filterProperty, regexFilter, contextName — Finds every node of a given "type" — and/or whose property matches "regexFilter" — under a start node, at any depth, following only the relations registered in a context (like SpinalNode.findInCont…
- `GET_NODE_INFO(node: SpinalNode) → any` · property — Reads one field of a node's info: "name" (default), "type", "id", "server_id" or any other info key.
- `GET_NODE_CHILD(node: SpinalNode) → SpinalNode` · regex, filterProperty, regexFilter*, ifNotFound — Shortcut for GET_NODE_CHILDREN + FIND_NODE: returns the first child of the input node whose property matches a regex.
- `GET_NODE_PARENT(node: SpinalNode) → SpinalNode` · regex, filterProperty, regexFilter*, ifNotFound — Shortcut for GET_NODE_PARENTS + FIND_NODE: returns the first parent of the input node whose property matches a regex.
- `FILTER_NODE(nodes: SpinalNode | SpinalNode[]) → SpinalNode[]` · filterProperty*, regexFilter* — Filter Nodes based on specified criteria.
- `FIND_NODE(nodes: SpinalNode | SpinalNode[]) → SpinalNode` · filterProperty*, regexFilter*, ifNotFound — Returns the first node matching the specified criteria (like FILTER_NODE but returns a single node).
- `CREATE_NODE(parent: SpinalNode, name?: string | number) → SpinalNode` · name, type*, relationName*, relationType, contextName, ifExists — Creates a node and links it under a parent node — a node that is not linked into the graph is never saved, so creation always attaches it.
- `LINK_NODES(parent: SpinalNode, child: SpinalNode | SpinalNode[]) → any` · relationName*, relationType, contextName — Links a child node — or every node of a list — under a parent node through the "relationName" relation (e.g.
- `SHARE_VALUE(source: SpinalNode, target: SpinalNode) → SpinalNode` · sourceProperty*, targetProperty — Makes two nodes hold the SAME value instead of two copies: the target's property becomes the source's, so a write on either node — by an analytic, the BOS, or a connector — shows on both at once, w…
- `CURRENT_NODE() → SpinalNode` — Returns the current work node from the execution context.

## Attributes — `blocks/NODE_ATTRIBUTES.md`

Read and write the attributes of a node.

- `GET_ATTRIBUTE(node: SpinalNode) → any` · categoryName*, label* — Gets the value of an attribute from a node by category and label.
- `SET_ATTRIBUTE(node: SpinalNode, value: any) → any` · categoryName*, label*, createIfNotExist, updateDirectModificationDate — Sets an attribute on a node by category and label.
- `SET_ATTRIBUTE_PARAM(node: SpinalNode) → any` · categoryName*, label*, value*, createIfNotExist, updateDirectModificationDate — Sets an attribute on a node using a static parameter value.
- `GET_ALL_ATTRIBUTES(node: SpinalNode) → string` · categoryName — Gets all attributes of a node within a specific category.
- `GET_ATTRIBUTE_MODEL(node: SpinalNode) → SpinalAttribute` · categoryName*, label* — Gets the SpinalAttribute model from a node by category and label.
- `GET_ALL_ATTRIBUTE_MODELS(node: SpinalNode) → SpinalAttribute[]` · categoryName — Gets all SpinalAttribute models of a node within a specific category.

## Endpoints — `blocks/ENDPOINT.md`

Read and write the current value of an endpoint.

- `ENDPOINT_NODE_CURRENT_VALUE(endpoint: SpinalNode) → any` — For a node representing an endpoint, returns the current value.
- `ENDPOINT_NODE_CURRENT_VALUE_MODEL(endpoint: SpinalNode) → any` — For a node representing an endpoint, returns the bindable currentValue MODEL (not the primitive value).
- `SET_ENDPOINT_VALUE(endpoint: SpinalNode, value: any) → any` · updateDirectModificationDate — Sets the current value of an endpoint node.
- `SET_ENDPOINT_VALUE_PARAM(endpoint: SpinalNode) → any` · value*, updateDirectModificationDate — Sets the current value of an endpoint node to a static parameter value.
- `PUSH_ENDPOINT_VALUE(endpoint: SpinalNode, value: any) → any` · date, updateDirectModificationDate — Records a value on an endpoint: updates the node element's currentValue (like SET_ENDPOINT_VALUE) AND appends a point to the endpoint's timeseries (creating the timeseries if it does not exist yet).

## Timeseries — `blocks/TIMESERIES.md`

Fetch, clean, aggregate and inject timeseries.

- `GENERATE_TIMESTAMPS(reference?: any[]) → any` · mode, interval, start, count, dayOffset, timezone — Builds an array of epoch-ms timestamps for the analytic's run day — pair it with a static value column via COLUMNS_TO_TIMESERIES to inject a daily timeseries whose dates always follow "today" with …
- `GET_ENDPOINT_TIMESERIES(endpoint: SpinalNode) → SpinalDateValue[]` · start, end, windowMs, lastHours, lastDays, includeValueAtBegin, extendToEnd — Fetches the timeseries of a BmsEndpoint node as an array of { date, value } points (date in epoch ms, value numeric), ordered by date.
- `TIMESERIES_FIRST(series: SpinalDateValue[]) → number` · defaultOnEmpty — Returns the value of the first (earliest) point of a timeseries ({ date, value }[]).
- `TIMESERIES_LAST(series: SpinalDateValue[]) → number` · defaultOnEmpty — Returns the value of the last (latest) point of a timeseries ({ date, value }[]).
- `TIMESERIES_DELTA(series: SpinalDateValue[]) → number` · defaultOnEmpty — Returns the difference between the last and first values of a timeseries (last − first).
- `TIMESERIES_DESPIKE(series: SpinalDateValue[]) → SpinalDateValue[]` · action, maxDelta, factor, cleanEdges — Removes transient spikes/dropouts from a timeseries ({ date, value }[]) — e.g.
- `TIMESERIES_TIME_WEIGHTED_AVERAGE(series: SpinalDateValue[]) → number` · defaultOnEmpty — Computes the time-weighted average of a timeseries ({ date, value }[]) with a zero-order hold: each value is weighted by the time until the next point (a flat-line/step model, the right model for s…
- `TIMESERIES_MIN(series: SpinalDateValue[]) → number` · defaultOnEmpty — Returns the minimum value of a timeseries ({ date, value }[]).
- `TIMESERIES_MAX(series: SpinalDateValue[]) → number` · defaultOnEmpty — Returns the maximum value of a timeseries ({ date, value }[]).
- `TIMESERIES_AVERAGE(series: SpinalDateValue[]) → number` · defaultOnEmpty — Returns the plain arithmetic mean of a timeseries' values ({ date, value }[]) — every point counts equally, regardless of spacing.
- `TIMESERIES_SUM(series: SpinalDateValue[]) → number` · defaultOnEmpty — Returns the sum of a timeseries' values ({ date, value }[]).
- `TIMESERIES_COUNT(series: SpinalDateValue[]) → number` — Returns the number of points in a timeseries ({ date, value }[]).
- `INSERT_TIMESERIES(endpoint: SpinalNode, series: SpinalDateValue[]) → number` · updateCurrentValue, updateDirectModificationDate — Bulk-inserts a timeseries ({ date, value }[]) into an endpoint's timeseries, each point at its own timestamp (creating the timeseries if missing) — e.g.

## Numbers — `blocks/NUMBER.md`

Arithmetic and aggregation on numbers.

- `COPY_FIRST_NUMBER(...numbers: number | string) → number` — Returns the number input, or first value of a number array.
- `SUM_NUMBERS(...numbers: number | string) → number` — Sums all numbers from a number array input.
- `COMPACT_NUMBERS(...numbers: number | string) → any` — Removes null, undefined and non-numeric entries from a number array, returning only the valid numbers.
- `SUBTRACT(...numbers: number | string) → number` — Subtracts numbers in order from a number array input: input[0] − input[1] − … Requires at least two numbers (e.g.
- `RANDOM_NUMBER() → number` · min*, max*, integer — Generates a random number between min and max.
- `CONSTANT_NUMBER() → number` · value* — Produces a constant number from the "value" parameter.
- `ADD_PARAM(number: number | string) → number` · value* — Adds the "value" parameter to the input number (input + value).
- `SUBTRACT_PARAM(number: number | string) → number` · value* — Subtracts the "value" parameter from the input number (input − value).
- `MULTIPLY_PARAM(number: number | string) → number` · value* — Multiplies the input number by the "value" parameter (input × value).
- `DIVIDE_PARAM(number: number | string) → number` · value* — Divides the input number by the "value" parameter (input ÷ value).
- `POLYNOMIAL(x: number | string) → number` · coefficients* — Evaluates a polynomial at the input value x.
- `AVERAGE_NUMBERS(...numbers: number | string) → number` — Returns the arithmetic mean of a number array input.
- `MIN_NUMBERS(...numbers: number | string) → number` — Returns the smallest of a number array input.
- `MAX_NUMBERS(...numbers: number | string) → number` — Returns the largest of a number array input.
- `ROUND(number: number | string) → number` · decimals — Rounds the input number to "decimals" decimal places (default 0).
- `ABS(number: number | string) → number` — Returns the absolute value of the input number.
- `CLAMP(number: number | string) → number` · min*, max* — Constrains the input number to the [min, max] range.

## Logic & comparison — `blocks/BOOLEAN.md`

Compare values and combine conditions — the predicates of IF and FILTER.

- `GREATER_THAN(value: number | string) → boolean` · threshold* — Returns true if the numeric input is strictly greater than the threshold parameter.
- `LESS_THAN(value: number | string) → boolean` · threshold* — Returns true if the numeric input is strictly less than the threshold parameter.
- `BETWEEN(value: number | string) → boolean` · min*, max* — Returns true if the numeric input is within [min, max] (inclusive).
- `NOT_BETWEEN(value: number | string) → boolean` · min*, max* — Returns true if the numeric input is outside [min, max] (exclusive of the range).
- `DIFFERENCE_THRESHOLD(a: number | string, b: number | string) → boolean` · threshold* — Takes two number inputs and returns true if the absolute difference exceeds the threshold.
- `AND(...values: boolean) → boolean` — Logical AND: returns true only if all boolean inputs are true.
- `OR(...values: boolean) → boolean` — Logical OR: returns true if any boolean input is true.
- `NOT(value: boolean) → boolean` — Logical NOT: inverts a boolean input.
- `EXISTS(value: any) → boolean` — Returns true when the input holds a value: false for null / undefined, an empty array or a blank string, true for anything else (including 0 and false).
- `EQUALS(a: any, b: any) → boolean` · ignoreCase — Returns true if its two inputs are equal.
- `EQUALS_PARAM(value: any) → boolean` · expected*, ignoreCase — Returns true if the input equals the "expected" parameter, with the EQUALS rules (numeric when both are numbers, nodes by id, else text; "ignoreCase" optional).
- `MATCHES_REGEX(text: string | number | boolean) → boolean` · pattern*, flags — Returns true if the input text matches the "pattern" regular expression ("flags" optional, e.g.

## Text & conversion — `blocks/TEXT.md`

Build text from values and convert between types.

- `PARSE_NUMBER(value: string) → number` — Parses a number from a string input.
- `BOOLEAN_TO_NUMBER(value: boolean) → number` — Converts a boolean to a number: true → 1, false → 0.
- `NUMBER_TO_BOOLEAN(value: number) → boolean` — Converts a number to a boolean: 0 → false, anything else → true.
- `FORMAT_STRING(...values?: any) → string` · template* — Builds a string from a template by substituting positional placeholders {0}, {1}, … with the wired inputs in order (input[0] → {0}, input[1] → {1}, …).

## Lists — `blocks/LIST.md`

Build, read and transform lists.

- `CREATE_LIST() → string` · json — Creates a new JSON array from an optional JSON string parameter, or an empty array if none provided.
- `LIST_PUSH(list: string, value: any) → string` — Appends a value to the end of a JSON array.
- `LIST_PUSH_PARAM(list: string) → string` · value* — Appends a static parameter value to the end of a JSON array.
- `LIST_POP(list: string) → string` — Removes and returns the last element of a JSON array.
- `LIST_SHIFT(list: string) → string` — Removes and returns the first element of a JSON array.
- `LIST_UNSHIFT(list: string, value: any) → string` — Prepends a value to the beginning of a JSON array.
- `LIST_CONCAT(list1: string, list2: string) → string` — Concatenates two JSON arrays.
- `LIST_GET(list: any[] | string) → any` · index* — Gets the element at an index of a list — a live array (e.g.
- `LIST_LENGTH(list: string) → number` — Returns the length of a JSON array.
- `LIST_INCLUDES(list: string) → boolean` · value* — Checks if a JSON array contains a specific value.
- `LIST_INDEX_OF(list: string) → number` · value* — Returns the first index of a value in a JSON array, or -1 if not found.
- `LIST_SLICE(list: string) → string` · start, end — Returns a slice of a JSON array.
- `LIST_REVERSE(list: string) → string` — Reverses a JSON array.
- `LIST_FLATTEN(list: string) → string` — Flattens a nested JSON array by one level.
- `LIST_UNIQUE(list: string) → string` — Removes duplicate primitive values from a JSON array.
- `COUNT(...values: any[] | any) → number` — Returns how many elements the input holds: the length of an array of any values (e.g.

## Objects (JSON) — `blocks/OBJECT.md`

Build and read objects — e.g. a JSON response or an Excel row.

- `CREATE_OBJECT() → string` · json — Creates a new object from a JSON string parameter, or an empty object if none provided.
- `GET_PROPERTY(object: object | string) → any` · key* — Gets a property value by key from an object — a live object (e.g.
- `SET_PROPERTY(object: string) → string` · key*, value* — Sets a property on a JSON object string.
- `SET_PROPERTY_DYNAMIC(object: string, value: any) → string` · key* — Sets a property on a JSON object string using a dynamic value input.
- `DELETE_PROPERTY(object: string) → string` · key* — Deletes a property from a JSON object string by key.
- `MERGE_OBJECTS(object1: string, object2: string) → string` — Merges two JSON object strings into one (shallow merge, second overrides first).
- `HAS_PROPERTY(object: string) → boolean` · key* — Checks if a property exists in a JSON object string.
- `GET_KEYS(object: string) → string` — Returns the keys of a JSON object as a JSON array string.

## Flow & execution — `blocks/FLOW.md`

Loops and conditions, registers, and what triggered the execution.

- `DELAY(value: any) → any` · durationMs* — Waits for the given duration, then returns its input unchanged.
- `IF(predicate: boolean, payload?: any) → any` — Conditional branching block.
- `LOG(value: any) → any` · prefix — Logs its input to the console (always, regardless of ADVANCED_LOGGING) and returns it unchanged — a transparent tap you can insert anywhere in a workflow to inspect a value.
- `GET_EXECUTION_REFERENCE_TIME() → number` — Returns the execution reference time (epoch ms) from execution context.
- `GET_CURRENT_DATE() → number` — Returns the current date and time (epoch ms).
- `GET_EXECUTION_TRIGGER_TYPE() → string` — Returns the trigger type that initiated this execution (e.g., INTERVAL_TIME, CRON, COV).
- `GET_EXECUTION_TRIGGER_ID() → string` — Returns the optional trigger identifier (e.g., Trigger1) that initiated this execution.
- `GET_EXECUTION_TRIGGER_INPUT_REGISTER() → string` — For COV executions, returns the input register name that was bound (e.g., I0).
- `GET_EXECUTION_TRIGGER_THRESHOLD() → number` — For COV executions with deadband, returns the threshold value.
- `SET_INPUT_REGISTER(value: any) → any` — Passes through the input value unchanged.
- `FETCH_INPUT_REGISTER() → any` · registerName* — Fetches a named input variable (e.g., I0, I1) that was set during the input workflow.
- `ELEMENT() → any` — Source block for FOREACH sub-workflows.
- `FOREACH(items: any[]) → any[]` — Higher-order block that takes an array input and runs its sub-workflow once per element, with the current element available to sub-blocks under the block's "itemRef" name.
- `FILTER(items: any[]) → any[]` — Keeps the elements of an array input for which a predicate sub-workflow returns true.

## Tickets — `blocks/TICKET.md`

Create tickets and move them through their process.

- `CREATE_TICKET(node: SpinalNode, ticket?: string | number | object) → SpinalNode` · contextName*, processName*, name, priority, description, ticketType, attributesCategory, ifExists — Creates a ticket attached to the input node, under a ticket context (a.k.a.
- `GET_TICKETS_FROM_NODE(node: SpinalNode) → SpinalNode[]` — Returns the ticket nodes attached to the input node as a SpinalNode array (empty if none).
- `MOVE_TICKET_TO_NEXT_STEP(ticket: SpinalNode) → SpinalNode` · contextName* — Advances a ticket to the next step of its process.

## Excel — `blocks/EXCEL.md`

Read an Excel document, or fill one into a report.

- `LOAD_EXCEL(node: SpinalNode) → ExcelWorkbook` · filename, defaultColor — Loads an .xlsx document stored on a node and returns an Excel workbook handle.
- `GET_EXCEL_VARIABLES(workbook: ExcelWorkbook) → string[]` — Returns the list of {{token}} variable names found in the loaded template.
- `GET_EXCEL_SHEETS(workbook: ExcelWorkbook) → string[]` — Returns the names of every worksheet in the loaded workbook, in tab order — handy to discover sheet names before reading cells/columns/ranges.
- `GET_EXCEL_CELL(workbook: ExcelWorkbook) → any` · ref* — Reads a single cell value.
- `GET_EXCEL_COLUMN(workbook: ExcelWorkbook) → any[]` · sheet*, column*, startRow, endRow, skipHeader — Reads a whole column top-to-bottom as an array of values.
- `GET_EXCEL_RANGE(workbook: ExcelWorkbook) → any[][]` · ref* — Reads a rectangular range as a row-major 2D array.
- `GET_EXCEL_ROWS(workbook: ExcelWorkbook) → object[]` · sheet, headerRow, columns — Reads a table as a list of rows, one object per row keyed by the header row — e.g.
- `COLUMNS_TO_TIMESERIES(timestamps: any[], values: any[]) → SpinalDateValue[]` · dateIsExcelSerial, dropInvalid — Pairs a timestamps column with a values column into a timeseries ({ date, value }[]) ready to inject with INSERT_TIMESERIES.
- `SET_EXCEL_VARIABLES(workbook: ExcelWorkbook, variables: object | string) → ExcelWorkbook` — Fills the template's {{token}} placeholders from an object mapping variable name → value.
- `SET_EXCEL_CELLS(workbook: ExcelWorkbook, cells: object | string) → ExcelWorkbook` — Writes values to specific cells from an object whose keys are "SheetName!CellRef" (e.g.
- `SET_EXCEL_RANGE(workbook: ExcelWorkbook, values: any[] | string) → ExcelWorkbook` · anchor*, direction — Fills a range from an array starting at an anchor cell.
- `SET_EXCEL_COMMENTS(workbook: ExcelWorkbook, comments: object | string) → ExcelWorkbook` — Attaches comments (Excel "notes") to cells without changing their values, from an object mapping "SheetName!CellRef" → comment text.
- `ADD_EXCEL_SHEET(workbook: ExcelWorkbook) → ExcelWorkbook` · name*, copyFrom — Adds a sheet to the workbook.
- `RENAME_EXCEL_SHEET(workbook: ExcelWorkbook) → ExcelWorkbook` · oldName*, newName* — Renames a sheet.
- `DELETE_EXCEL_SHEET(workbook: ExcelWorkbook) → ExcelWorkbook` · name* — Removes a sheet from the workbook by name.
- `SAVE_EXCEL_TO_NODE(workbook: ExcelWorkbook, node: SpinalNode) → SpinalNode` · filename*, ifExists, preserveCharts — Renders the filled workbook and saves it as a document on a node (via the documentation service).
- `EXCEL_TO_BASE64(workbook: ExcelWorkbook) → string` · preserveCharts — Renders the filled workbook and returns it as a base64 string — handy to send the report elsewhere (e.g.

## Mail & HTTP — `blocks/COMMUNICATION.md`

Send a mail, call an external service.

- `CURL_REQUEST(curl?: string) → string` · curl, timeoutMs — Parses a curl command and performs the HTTP request, returning the response body as a string (JSON responses are stringified so they can be fed to GET_PROPERTY / PARSE_NUMBER).
- `SEND_MAIL(to: string | string[], ...values?: any) → any` · subject*, body*, format, cc, bcc, dryRun — Sends an email from the organ's mail account — the company no-reply address, configured on the organ, never in the analytic.
