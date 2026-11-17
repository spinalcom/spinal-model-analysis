<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->
# Timeseries (TIMESERIES)

Fetch, clean, aggregate and inject timeseries.

## GENERATE_TIMESTAMPS

Generate Timestamps · French label in the builder: « Générer des horodatages »

`GENERATE_TIMESTAMPS(reference?: any[]) → any`

Builds an array of epoch-ms timestamps for the analytic's run day — pair it with a static value column via COLUMNS_TO_TIMESERIES to inject a daily timeseries whose dates always follow "today" with no Excel date formula. The day comes from the execution's referenceTime (deterministic for backfill/simulation), shifted by "dayOffset". Two modes: GRID (default) generates "count" timestamps from "start" spaced by "interval"; STAMP takes an input array of time-of-day values ("HH:mm", Excel time fractions, or Date cells) and stamps each onto the run day. In GRID mode "count" defaults to the length of the (optional) input array — so wiring the value column makes the axis match it automatically.

Inputs, in this order:
1. `reference` (any[], optional) — Optional. GRID mode: any array whose length sets "count" (e.g. the value column, so the axis auto-matches it). STAMP mode: the time-of-day values to stamp onto the run day.

Parameters:
- `mode` (string, optional, one of "grid", "stamp", default "grid") — GRID (generate from start+interval) or STAMP (stamp the input time-of-day values onto the run day). Default GRID.
- `interval` (string, optional) — GRID spacing: minutes as a number, or "15m"/"1h"/"30s"/"1d". Required in GRID mode.
- `start` (string, optional) — GRID first timestamp's time-of-day ("HH:mm" or "HH:mm:ss"). Default "00:00".
- `count` (number, optional) — GRID number of timestamps. Defaults to the length of the wired input array.
- `dayOffset` (number, optional, default 0) — Days to shift from the run day (referenceTime): 0 = today, -1 = yesterday. Default 0.
- `timezone` (string, optional, one of "local", "utc", default "local") — "local" (server-local midnight, default) or "utc" (UTC midnight) for the start of the day.

## GET_ENDPOINT_TIMESERIES

Endpoint Timeseries · French label in the builder: « Série temporelle d'un endpoint »

`GET_ENDPOINT_TIMESERIES(endpoint: SpinalNode) → SpinalDateValue[]`

Fetches the timeseries of a BmsEndpoint node as an array of { date, value } points (date in epoch ms, value numeric), ordered by date. The time window can be given as an absolute range (start/end) or relative to the execution reference time (windowMs/lastHours/lastDays back from end). Use includeValueAtBegin / extendToEnd to seed the value at the window edges so a downstream span calc (e.g. TIMESERIES_TIME_WEIGHTED_AVERAGE) covers the whole window. If the endpoint has no timeseries, an empty array is returned.

Inputs, in this order:
1. `endpoint` (SpinalNode) — The BmsEndpoint node whose timeseries to fetch.

Parameters:
- `start` (string, optional) — Absolute window start, epoch ms or a parseable date string. Takes precedence over the relative window params. Defaults to the start of the data (0).
- `end` (string, optional) — Absolute window end, epoch ms or a parseable date string. Defaults to the execution reference time (or now if unavailable).
- `windowMs` (number, optional) — Relative window length in milliseconds, counted back from "end". Ignored if "start" is set.
- `lastHours` (number, optional) — Relative window length in hours, counted back from "end". Ignored if "start" or "windowMs" is set.
- `lastDays` (number, optional) — Relative window length in days, counted back from "end". Ignored if "start", "windowMs" or "lastHours" is set.
- `includeValueAtBegin` (boolean, optional, default false) — If true, include the last recorded value before "start" so the series has a value at the window opening. Default false.
- `extendToEnd` (boolean, optional, default false) — If true, append a point at "end" holding the last recorded value, so the last reading is carried to the window close. Symmetric to includeValueAtBegin (which seeds the window opening); together they make the series span the full window, so a downstream TIMESERIES_TIME_WEIGHTED_AVERAGE is window-correct. Default false.

## TIMESERIES_FIRST

Timeseries First · French label in the builder: « Première valeur (série) »

`TIMESERIES_FIRST(series: SpinalDateValue[]) → number`

Returns the value of the first (earliest) point of a timeseries ({ date, value }[]). Throws if the series is empty, unless defaultOnEmpty is provided.

Inputs, in this order:
1. `series` (SpinalDateValue[]) — The timeseries ({ date, value }[]) to reduce.

Parameters:
- `defaultOnEmpty` (number, optional) — Value to return when the series is empty (e.g. a dysfunctional endpoint with no data, so it contributes this value to a downstream sum). If omitted, the block throws on an empty series.

## TIMESERIES_LAST

Timeseries Last · French label in the builder: « Dernière valeur (série) »

`TIMESERIES_LAST(series: SpinalDateValue[]) → number`

Returns the value of the last (latest) point of a timeseries ({ date, value }[]). Throws if the series is empty, unless defaultOnEmpty is provided.

Inputs, in this order:
1. `series` (SpinalDateValue[]) — The timeseries ({ date, value }[]) to reduce.

Parameters:
- `defaultOnEmpty` (number, optional) — Value to return when the series is empty (e.g. a dysfunctional endpoint with no data, so it contributes this value to a downstream sum). If omitted, the block throws on an empty series.

## TIMESERIES_DELTA

Timeseries Delta · French label in the builder: « Delta (série) »

`TIMESERIES_DELTA(series: SpinalDateValue[]) → number`

Returns the difference between the last and first values of a timeseries (last − first). For a cumulative meter fetched over a window, this is the consumption over that window. Pair with GET_ENDPOINT_TIMESERIES's includeValueAtBegin=true so the baseline at the window start is used as "first". A single point yields 0. Throws if the series is empty, unless defaultOnEmpty is provided (e.g. 0 for a dysfunctional endpoint that should contribute nothing to a sum).

Inputs, in this order:
1. `series` (SpinalDateValue[]) — The timeseries ({ date, value }[]) to reduce.

Parameters:
- `defaultOnEmpty` (number, optional) — Value to return when the series is empty (e.g. a dysfunctional endpoint with no data, so it contributes this value to a downstream sum). If omitted, the block throws on an empty series.

## TIMESERIES_DESPIKE

Despike Timeseries · French label in the builder: « Nettoyer les pics »

`TIMESERIES_DESPIKE(series: SpinalDateValue[]) → SpinalDateValue[]`

Removes transient spikes/dropouts from a timeseries ({ date, value }[]) — e.g. a cumulative energy counter that momentarily reads 0 (…958, 0, 959…) and injects huge false deltas into consumption. A point is treated as a spike only when it deviates sharply from the local trend AND the series recovers right after (the next reading returns to the neighbours' level) — so isolated dropouts are removed while genuine meter resets/rollovers (…958, 0, 1, 2…) are kept. The detection scale is the "maxDelta" parameter (the largest plausible change between two samples); if omitted it is "factor" × the median absolute step of the series (robust to the spikes themselves). Targets isolated single-sample spikes. Output is sorted by date; a series shorter than 3 points is returned unchanged.

Inputs, in this order:
1. `series` (SpinalDateValue[]) — The timeseries ({ date, value }[]) to clean.

Parameters:
- `action` (string, optional, one of "drop", "interpolate", default "drop") — What to do with a detected spike: "drop" (default — remove the point, so the delta bridges its good neighbours) or "interpolate" (replace its value with the neighbours' trend, keeping the timestamp and point count).
- `maxDelta` (number, optional) — Largest plausible change between two consecutive samples. A point deviating from the local trend by more than this (while the series recovers around it) is a spike. If omitted, an automatic threshold is used.
- `factor` (number, optional, default 6) — Multiplier for the automatic threshold (factor × median absolute step) when "maxDelta" is not given. Default 6.
- `cleanEdges` (boolean, optional, default true) — Whether to also clean the first and last points (default true). At an edge there is no "recovery" reading to confirm a spike, so the preceding/following trend is extrapolated instead. Set false to leave the latest (and earliest) point untouched — useful when the last sample is the current, not-yet-confirmed value and you would rather wait for the next reading to decide.

## TIMESERIES_TIME_WEIGHTED_AVERAGE

Time-Weighted Average · French label in the builder: « Moyenne temporelle pondérée »

`TIMESERIES_TIME_WEIGHTED_AVERAGE(series: SpinalDateValue[]) → number`

Computes the time-weighted average of a timeseries ({ date, value }[]) with a zero-order hold: each value is weighted by the time until the next point (a flat-line/step model, the right model for sensor readings), averaged over the span [first point, last point]. To make it window-correct, shape the series at fetch time with GET_ENDPOINT_TIMESERIES includeValueAtBegin=true (a value at the window open) and extendToEnd=true (the last value carried to the window close) — then the span IS the window. A single point — or a series spanning no time — yields the plain mean of the values. Throws if the series is empty, unless defaultOnEmpty is provided.

Inputs, in this order:
1. `series` (SpinalDateValue[]) — The timeseries ({ date, value }[]) to average.

Parameters:
- `defaultOnEmpty` (number, optional) — Value to return when the series is empty (e.g. a dysfunctional endpoint with no data, so it contributes this value to a downstream sum). If omitted, the block throws on an empty series.

## TIMESERIES_MIN

Timeseries Min · French label in the builder: « Minimum (série) »

`TIMESERIES_MIN(series: SpinalDateValue[]) → number`

Returns the minimum value of a timeseries ({ date, value }[]). Throws if the series is empty, unless defaultOnEmpty is provided.

Inputs, in this order:
1. `series` (SpinalDateValue[]) — The timeseries ({ date, value }[]) to reduce.

Parameters:
- `defaultOnEmpty` (number, optional) — Value to return when the series is empty (e.g. a dysfunctional endpoint with no data, so it contributes this value to a downstream sum). If omitted, the block throws on an empty series.

## TIMESERIES_MAX

Timeseries Max · French label in the builder: « Maximum (série) »

`TIMESERIES_MAX(series: SpinalDateValue[]) → number`

Returns the maximum value of a timeseries ({ date, value }[]). Throws if the series is empty, unless defaultOnEmpty is provided.

Inputs, in this order:
1. `series` (SpinalDateValue[]) — The timeseries ({ date, value }[]) to reduce.

Parameters:
- `defaultOnEmpty` (number, optional) — Value to return when the series is empty (e.g. a dysfunctional endpoint with no data, so it contributes this value to a downstream sum). If omitted, the block throws on an empty series.

## TIMESERIES_AVERAGE

Timeseries Average · French label in the builder: « Moyenne (série) »

`TIMESERIES_AVERAGE(series: SpinalDateValue[]) → number`

Returns the plain arithmetic mean of a timeseries' values ({ date, value }[]) — every point counts equally, regardless of spacing. For an average that accounts for the time between samples (the right choice for irregular sensor data), use TIMESERIES_TIME_WEIGHTED_AVERAGE. Throws if the series is empty, unless defaultOnEmpty is provided.

Inputs, in this order:
1. `series` (SpinalDateValue[]) — The timeseries ({ date, value }[]) to average.

Parameters:
- `defaultOnEmpty` (number, optional) — Value to return when the series is empty (e.g. a dysfunctional endpoint with no data, so it contributes this value to a downstream sum). If omitted, the block throws on an empty series.

## TIMESERIES_SUM

Timeseries Sum · French label in the builder: « Somme (série) »

`TIMESERIES_SUM(series: SpinalDateValue[]) → number`

Returns the sum of a timeseries' values ({ date, value }[]). Throws if the series is empty, unless defaultOnEmpty is provided (e.g. 0).

Inputs, in this order:
1. `series` (SpinalDateValue[]) — The timeseries ({ date, value }[]) to sum.

Parameters:
- `defaultOnEmpty` (number, optional) — Value to return when the series is empty (e.g. a dysfunctional endpoint with no data, so it contributes this value to a downstream sum). If omitted, the block throws on an empty series.

## TIMESERIES_COUNT

Timeseries Count · French label in the builder: « Nombre de points (série) »

`TIMESERIES_COUNT(series: SpinalDateValue[]) → number`

Returns the number of points in a timeseries ({ date, value }[]). Returns 0 for an empty series — a count is always well-defined, so this never throws.

Inputs, in this order:
1. `series` (SpinalDateValue[]) — The timeseries ({ date, value }[]) to count.

Parameters: none.

## INSERT_TIMESERIES

Insert Timeseries · French label in the builder: « Injecter une série temporelle »

`INSERT_TIMESERIES(endpoint: SpinalNode, series: SpinalDateValue[]) → number`

Bulk-inserts a timeseries ({ date, value }[]) into an endpoint's timeseries, each point at its own timestamp (creating the timeseries if missing) — e.g. to backfill history imported from Excel via COLUMNS_TO_TIMESERIES. Takes 2 inputs: [endpointNode, series]. By default it does NOT touch the node's currentValue (backfilling old data shouldn't change "current"); set "updateCurrentValue" to also set it to the latest point. Returns the number of points inserted.

Inputs, in this order:
1. `endpoint` (SpinalNode) — The endpoint node to insert the timeseries into.
2. `series` (SpinalDateValue[]) — The timeseries ({ date, value }[]) to insert (e.g. from COLUMNS_TO_TIMESERIES).

Parameters:
- `updateCurrentValue` (boolean, optional, default false) — If true, set the endpoint node's currentValue to the value of the latest (max-date) point after inserting. Default false.
- `updateDirectModificationDate` (boolean, optional, default false) — If true, also stamps node.info.directModificationDate with the current time after inserting, so the BOS can detect the direct modification (default: false).
