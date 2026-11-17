<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->
# Numbers (NUMBER)

Arithmetic and aggregation on numbers.

## COPY_FIRST_NUMBER

First Number · French label in the builder: « Premier nombre »

`COPY_FIRST_NUMBER(...numbers: number | string) → number`

Returns the number input, or first value of a number array. Numeric strings are accepted.

Inputs, in this order:
1. `numbers` (number | string, one or more) — One or more numbers (or numeric strings); the first one is returned.

Parameters: none.

## SUM_NUMBERS

Sum · French label in the builder: « Somme »

`SUM_NUMBERS(...numbers: number | string) → number`

Sums all numbers from a number array input. Numeric strings are accepted.

Inputs, in this order:
1. `numbers` (number | string, one or more) — One or more numbers (or numeric strings) to sum.

Parameters: none.

## COMPACT_NUMBERS

Compact Numbers · French label in the builder: « Compacter les nombres »

`COMPACT_NUMBERS(...numbers: number | string) → any`

Removes null, undefined and non-numeric entries from a number array, returning only the valid numbers. Place it between a FOREACH (whose items may be missing — e.g. floors without a timeseries, giving [0,2,4,null,3]) and SUM_NUMBERS / AVERAGE_NUMBERS / MIN_NUMBERS / MAX_NUMBERS so aggregation proceeds over the values that exist instead of failing on the gaps. Numeric strings are kept and converted to numbers.

Inputs, in this order:
1. `numbers` (number | string, one or more) — One or more values; null / undefined / non-numeric entries are dropped.

Parameters: none.

## SUBTRACT

Subtract · French label in the builder: « Soustraction »

`SUBTRACT(...numbers: number | string) → number`

Subtracts numbers in order from a number array input: input[0] − input[1] − … Requires at least two numbers (e.g. two block inputs [a, b] → a − b). Numeric strings are accepted.

Inputs, in this order:
1. `numbers` (number | string, one or more) — Two or more numbers (or numeric strings); subsequent values are subtracted from the first.

Parameters: none.

## RANDOM_NUMBER

Random Number · French label in the builder: « Nombre aléatoire »

`RANDOM_NUMBER() → number`

Generates a random number between min and max. No input required. By default a float in [min, max). Set "integer" to true for a random integer in [min, max] inclusive.

Inputs: none.

Parameters:
- `min` (number, required) — Lower bound (inclusive)
- `max` (number, required) — Upper bound (float: exclusive; integer: inclusive)
- `integer` (boolean, optional, default false) — When true, return an integer in [min, max] inclusive instead of a float. Defaults to false.

## CONSTANT_NUMBER

Constant Number · French label in the builder: « Nombre constant »

`CONSTANT_NUMBER() → number`

Produces a constant number from the "value" parameter. Takes no input — useful as a numeric source to feed math or comparison blocks.

Inputs: none.

Parameters:
- `value` (number, required) — The constant number to produce.

## ADD_PARAM

Add · French label in the builder: « Additionner »

`ADD_PARAM(number: number | string) → number`

Adds the "value" parameter to the input number (input + value).

Inputs, in this order:
1. `number` (number | string) — The input number (or numeric string).

Parameters:
- `value` (number, required) — The number to add to the input.

## SUBTRACT_PARAM

Subtract (by value) · French label in the builder: « Soustraire (par valeur) »

`SUBTRACT_PARAM(number: number | string) → number`

Subtracts the "value" parameter from the input number (input − value).

Inputs, in this order:
1. `number` (number | string) — The input number (or numeric string).

Parameters:
- `value` (number, required) — The number to subtract from the input.

## MULTIPLY_PARAM

Multiply · French label in the builder: « Multiplier »

`MULTIPLY_PARAM(number: number | string) → number`

Multiplies the input number by the "value" parameter (input × value).

Inputs, in this order:
1. `number` (number | string) — The input number (or numeric string).

Parameters:
- `value` (number, required) — The number to multiply the input by.

## DIVIDE_PARAM

Divide · French label in the builder: « Diviser »

`DIVIDE_PARAM(number: number | string) → number`

Divides the input number by the "value" parameter (input ÷ value). Throws if value is 0.

Inputs, in this order:
1. `number` (number | string) — The input number (or numeric string).

Parameters:
- `value` (number, required) — The number to divide the input by (must not be 0).

## POLYNOMIAL

Polynomial · French label in the builder: « Polynôme »

`POLYNOMIAL(x: number | string) → number`

Evaluates a polynomial at the input value x. Coefficients are given via the "coefficients" parameter as a JSON array in ascending power order: [c0, c1, c2, ...] → c0 + c1·x + c2·x² + … Numeric strings are accepted for x.

Inputs, in this order:
1. `x` (number | string) — The value of x to evaluate the polynomial at.

Parameters:
- `coefficients` (string, required) — JSON array of coefficients in ascending power order: [c0, c1, c2, ...] for c0 + c1·x + c2·x² + …

## AVERAGE_NUMBERS

Average · French label in the builder: « Moyenne »

`AVERAGE_NUMBERS(...numbers: number | string) → number`

Returns the arithmetic mean of a number array input. Numeric strings are accepted.

Inputs, in this order:
1. `numbers` (number | string, one or more) — One or more numbers (or numeric strings) to average.

Parameters: none.

## MIN_NUMBERS

Minimum · French label in the builder: « Minimum »

`MIN_NUMBERS(...numbers: number | string) → number`

Returns the smallest of a number array input. Numeric strings are accepted.

Inputs, in this order:
1. `numbers` (number | string, one or more) — One or more numbers (or numeric strings).

Parameters: none.

## MAX_NUMBERS

Maximum · French label in the builder: « Maximum »

`MAX_NUMBERS(...numbers: number | string) → number`

Returns the largest of a number array input. Numeric strings are accepted.

Inputs, in this order:
1. `numbers` (number | string, one or more) — One or more numbers (or numeric strings).

Parameters: none.

## ROUND

Round · French label in the builder: « Arrondir »

`ROUND(number: number | string) → number`

Rounds the input number to "decimals" decimal places (default 0). Numeric strings are accepted.

Inputs, in this order:
1. `number` (number | string) — The input number (or numeric string).

Parameters:
- `decimals` (number, optional, default 0) — Number of decimal places to round to (default 0).

## ABS

Absolute Value · French label in the builder: « Valeur absolue »

`ABS(number: number | string) → number`

Returns the absolute value of the input number. Numeric strings are accepted.

Inputs, in this order:
1. `number` (number | string) — The input number (or numeric string).

Parameters: none.

## CLAMP

Clamp · French label in the builder: « Borner »

`CLAMP(number: number | string) → number`

Constrains the input number to the [min, max] range. Numeric strings are accepted.

Inputs, in this order:
1. `number` (number | string) — The input number (or numeric string).

Parameters:
- `min` (number, required) — Lower bound (inclusive).
- `max` (number, required) — Upper bound (inclusive).
