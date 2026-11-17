<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->
# Logic & comparison (BOOLEAN)

Compare values and combine conditions — the predicates of IF and FILTER.

## GREATER_THAN

Greater Than · French label in the builder: « Supérieur à »

`GREATER_THAN(value: number | string) → boolean`

Returns true if the numeric input is strictly greater than the threshold parameter.

Inputs, in this order:
1. `value` (number | string) — The value compared against the threshold.

Parameters:
- `threshold` (number, required) — The threshold value

## LESS_THAN

Less Than · French label in the builder: « Inférieur à »

`LESS_THAN(value: number | string) → boolean`

Returns true if the numeric input is strictly less than the threshold parameter.

Inputs, in this order:
1. `value` (number | string) — The value compared against the threshold.

Parameters:
- `threshold` (number, required) — The threshold value

## BETWEEN

Between · French label in the builder: « Entre »

`BETWEEN(value: number | string) → boolean`

Returns true if the numeric input is within [min, max] (inclusive).

Inputs, in this order:
1. `value` (number | string) — The value tested against the [min, max] range.

Parameters:
- `min` (number, required) — Lower bound (inclusive)
- `max` (number, required) — Upper bound (inclusive)

## NOT_BETWEEN

Not Between · French label in the builder: « Hors de »

`NOT_BETWEEN(value: number | string) → boolean`

Returns true if the numeric input is outside [min, max] (exclusive of the range).

Inputs, in this order:
1. `value` (number | string) — The value tested against the [min, max] range.

Parameters:
- `min` (number, required) — Lower bound
- `max` (number, required) — Upper bound

## DIFFERENCE_THRESHOLD

Difference Exceeds · French label in the builder: « Écart dépassé »

`DIFFERENCE_THRESHOLD(a: number | string, b: number | string) → boolean`

Takes two number inputs and returns true if the absolute difference exceeds the threshold.

Inputs, in this order:
1. `a` (number | string) — First value.
2. `b` (number | string) — Second value.

Parameters:
- `threshold` (number, required) — Maximum allowed absolute difference

## AND

And · French label in the builder: « ET »

`AND(...values: boolean) → boolean`

Logical AND: returns true only if all boolean inputs are true. Accepts a single boolean or boolean array.

Inputs, in this order:
1. `values` (boolean, one or more) — One or more booleans; true only if all are true.

Parameters: none.

## OR

Or · French label in the builder: « OU »

`OR(...values: boolean) → boolean`

Logical OR: returns true if any boolean input is true. Accepts a single boolean or boolean array.

Inputs, in this order:
1. `values` (boolean, one or more) — One or more booleans; true if any is true.

Parameters: none.

## NOT

Not · French label in the builder: « NON »

`NOT(value: boolean) → boolean`

Logical NOT: inverts a boolean input.

Inputs, in this order:
1. `value` (boolean) — The boolean to invert.

Parameters: none.

## EXISTS

Exists · French label in the builder: « Existe »

`EXISTS(value: any) → boolean`

Returns true when the input holds a value: false for null / undefined, an empty array or a blank string, true for anything else (including 0 and false). The predicate for "was something found?" — pair it with a lookup set to return null instead of failing (GET_NODE_PARENT / GET_NODE_CHILD / FIND_NODE with ifNotFound "null"), e.g. inside a FILTER to keep the rooms that have a parent group named "Bureaux".

Inputs, in this order:
1. `value` (any) — The value to test.

Parameters: none.

## EQUALS

Equals · French label in the builder: « Égal »

`EQUALS(a: any, b: any) → boolean`

Returns true if its two inputs are equal. Numbers and numeric strings compare numerically (5 equals "5"), nodes compare by id, everything else as text — set "ignoreCase" to ignore letter case; null / undefined only equal each other. To compare against a fixed value, use EQUALS_PARAM.

Inputs, in this order:
1. `a` (any) — First value.
2. `b` (any) — Second value.

Parameters:
- `ignoreCase` (boolean, optional, default false) — Compare text case-insensitively (default false).

## EQUALS_PARAM

Equals (value) · French label in the builder: « Égal à (valeur) »

`EQUALS_PARAM(value: any) → boolean`

Returns true if the input equals the "expected" parameter, with the EQUALS rules (numeric when both are numbers, nodes by id, else text; "ignoreCase" optional). The usual predicate after GET_NODE_INFO — e.g. type equals "geographicRoom".

Inputs, in this order:
1. `value` (any) — The value to compare.

Parameters:
- `expected` (string, required) — The value to compare against.
- `ignoreCase` (boolean, optional, default false) — Compare text case-insensitively (default false).

## MATCHES_REGEX

Matches Regex · French label in the builder: « Correspond à une regex »

`MATCHES_REGEX(text: string | number | boolean) → boolean`

Returns true if the input text matches the "pattern" regular expression ("flags" optional, e.g. "i" for case-insensitive). Numbers and booleans are tested as text; null / undefined never match. For a node, read the field to test first with GET_NODE_INFO.

Inputs, in this order:
1. `text` (string | number | boolean) — The text to test.

Parameters:
- `pattern` (string, required) — The regular expression, e.g. "^Bureau".
- `flags` (string, optional) — Optional regex flags, e.g. "i".
