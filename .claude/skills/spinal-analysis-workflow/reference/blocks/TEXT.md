<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->
# Text & conversion (TEXT)

Build text from values and convert between types.

## PARSE_NUMBER

Parse Number · French label in the builder: « Convertir en nombre »

`PARSE_NUMBER(value: string) → number`

Parses a number from a string input. Throws if the string cannot be parsed into a valid number.

Inputs, in this order:
1. `value` (string) — The string to parse into a number.

Parameters: none.

## BOOLEAN_TO_NUMBER

Boolean to Number · French label in the builder: « Booléen vers nombre »

`BOOLEAN_TO_NUMBER(value: boolean) → number`

Converts a boolean to a number: true → 1, false → 0.

Inputs, in this order:
1. `value` (boolean) — The boolean to convert.

Parameters: none.

## NUMBER_TO_BOOLEAN

Number to Boolean · French label in the builder: « Nombre vers booléen »

`NUMBER_TO_BOOLEAN(value: number) → boolean`

Converts a number to a boolean: 0 → false, anything else → true.

Inputs, in this order:
1. `value` (number) — The number to convert.

Parameters: none.

## FORMAT_STRING

Format String · French label in the builder: « Formater une chaîne »

`FORMAT_STRING(...values?: any) → string`

Builds a string from a template by substituting positional placeholders {0}, {1}, … with the wired inputs in order (input[0] → {0}, input[1] → {1}, …). Strings are inserted as-is, objects/arrays as JSON, other values via String(). Useful for building dynamic curl commands, URLs, request bodies or messages (e.g. injecting an auth token into a request). Only {<digits>} are treated as placeholders, so JSON braces like {"k":"v"} are left untouched.

Inputs, in this order:
1. `values` (any, optional, one or more) — Values to substitute for {0}, {1}, … in template order.

Parameters:
- `template` (string, required) — The template string with positional placeholders, e.g. "Bearer {0}".
