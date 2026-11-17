<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->
# Lists (LIST)

Build, read and transform lists.

## CREATE_LIST

Create List · French label in the builder: « Créer une liste »

`CREATE_LIST() → string`

Creates a new JSON array from an optional JSON string parameter, or an empty array if none provided.

Inputs: none.

Parameters:
- `json` (string, optional) — Optional JSON array string to initialize the list

## LIST_PUSH

List Push · French label in the builder: « Ajouter en fin de liste »

`LIST_PUSH(list: string, value: any) → string`

Appends a value to the end of a JSON array. Takes 2 inputs: [arrayJson, value].

Inputs, in this order:
1. `list` (string) — The JSON array (as a JSON string).
2. `value` (any) — The value to add.

Parameters: none.

## LIST_PUSH_PARAM

List Push (constant) · French label in the builder: « Ajouter en fin de liste (constante) »

`LIST_PUSH_PARAM(list: string) → string`

Appends a static parameter value to the end of a JSON array.

Inputs, in this order:
1. `list` (string) — The JSON array (as a JSON string) to operate on.

Parameters:
- `value` (string, required) — The value to push (will be parsed as JSON if possible)

## LIST_POP

List Pop · French label in the builder: « Retirer en fin de liste »

`LIST_POP(list: string) → string`

Removes and returns the last element of a JSON array. Returns the modified array.

Inputs, in this order:
1. `list` (string) — The JSON array (as a JSON string) to operate on.

Parameters: none.

## LIST_SHIFT

List Shift · French label in the builder: « Retirer en début de liste »

`LIST_SHIFT(list: string) → string`

Removes and returns the first element of a JSON array. Returns the modified array.

Inputs, in this order:
1. `list` (string) — The JSON array (as a JSON string) to operate on.

Parameters: none.

## LIST_UNSHIFT

List Unshift · French label in the builder: « Ajouter en début de liste »

`LIST_UNSHIFT(list: string, value: any) → string`

Prepends a value to the beginning of a JSON array. Takes 2 inputs: [arrayJson, value].

Inputs, in this order:
1. `list` (string) — The JSON array (as a JSON string).
2. `value` (any) — The value to add.

Parameters: none.

## LIST_CONCAT

List Concat · French label in the builder: « Concaténer des listes »

`LIST_CONCAT(list1: string, list2: string) → string`

Concatenates two JSON arrays. Takes 2 inputs: [array1, array2].

Inputs, in this order:
1. `list1` (string) — The first JSON array (as a JSON string).
2. `list2` (string) — The second JSON array (as a JSON string).

Parameters: none.

## LIST_GET

List Get · French label in the builder: « Élément de la liste »

`LIST_GET(list: any[] | string) → any`

Gets the element at an index of a list — a live array (e.g. a row of GET_EXCEL_RANGE), whose elements keep their type, or a JSON array string, whose elements come back as strings.

Inputs, in this order:
1. `list` (any[] | string) — The array, or a JSON array string, to read from.

Parameters:
- `index` (number, required) — The index of the element to get (supports negative indexing)

## LIST_LENGTH

List Length · French label in the builder: « Taille de la liste »

`LIST_LENGTH(list: string) → number`

Returns the length of a JSON array.

Inputs, in this order:
1. `list` (string) — The JSON array (as a JSON string) to operate on.

Parameters: none.

## LIST_INCLUDES

List Includes · French label in the builder: « La liste contient »

`LIST_INCLUDES(list: string) → boolean`

Checks if a JSON array contains a specific value.

Inputs, in this order:
1. `list` (string) — The JSON array (as a JSON string) to operate on.

Parameters:
- `value` (string, required) — The value to search for (will be parsed as JSON if possible)

## LIST_INDEX_OF

List Index Of · French label in the builder: « Indice dans la liste »

`LIST_INDEX_OF(list: string) → number`

Returns the first index of a value in a JSON array, or -1 if not found.

Inputs, in this order:
1. `list` (string) — The JSON array (as a JSON string) to operate on.

Parameters:
- `value` (string, required) — The value to search for (will be parsed as JSON if possible)

## LIST_SLICE

List Slice · French label in the builder: « Extraire une portion de liste »

`LIST_SLICE(list: string) → string`

Returns a slice of a JSON array.

Inputs, in this order:
1. `list` (string) — The JSON array (as a JSON string) to operate on.

Parameters:
- `start` (number, optional) — Start index (inclusive, supports negative)
- `end` (number, optional) — End index (exclusive, supports negative)

## LIST_REVERSE

List Reverse · French label in the builder: « Inverser la liste »

`LIST_REVERSE(list: string) → string`

Reverses a JSON array.

Inputs, in this order:
1. `list` (string) — The JSON array (as a JSON string) to operate on.

Parameters: none.

## LIST_FLATTEN

List Flatten · French label in the builder: « Aplatir la liste »

`LIST_FLATTEN(list: string) → string`

Flattens a nested JSON array by one level.

Inputs, in this order:
1. `list` (string) — The JSON array (as a JSON string) to operate on.

Parameters: none.

## LIST_UNIQUE

List Unique · French label in the builder: « Dédupliquer la liste »

`LIST_UNIQUE(list: string) → string`

Removes duplicate primitive values from a JSON array.

Inputs, in this order:
1. `list` (string) — The JSON array (as a JSON string) to operate on.

Parameters: none.

## COUNT

Count · French label in the builder: « Compter »

`COUNT(...values: any[] | any) → number`

Returns how many elements the input holds: the length of an array of any values (e.g. the nodes from GET_NODE_CHILDREN or FILTER_NODE) or of a JSON array string, 0 for null / undefined, 1 for any other single value; with several inputs wired, the number of inputs. Pair with GREATER_THAN for predicates like "has at least one child". Unlike LIST_LENGTH, it does not need a JSON string.

Inputs, in this order:
1. `values` (any[] | any, one or more) — The array (or value) to count.

Parameters: none.
