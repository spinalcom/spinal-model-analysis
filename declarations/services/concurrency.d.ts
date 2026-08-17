import { IConcurrencyConfig } from '../interfaces/IAnalysisConfigJSON';
/**
 * Shared concurrency primitives, used both for dispatching an analysis across its work
 * nodes and for dispatching a FOREACH block across its iteration elements.
 */
/**
 * Dispatches a task over a list of items according to the resolved concurrency strategy,
 * preserving input order in the returned results array (results are index-aligned with
 * `items`, regardless of completion order).
 *
 * - `SEQUENTIAL` — one at a time (awaits each before starting the next). A rejecting task
 *   aborts immediately, exactly like a plain `for … await` loop.
 * - `FULL`       — all at once (`limit` effectively = item count).
 * - `BOUNDED`    — a worker pool of at most `limit` in flight at any time.
 *
 * In the parallel modes a rejecting task propagates (the batch fails), but tasks already
 * in flight are not cancelled — inherent to running them concurrently.
 */
export declare function runWithConcurrency<T, R>(items: T[], concurrency: Required<IConcurrencyConfig>, task: (item: T, index: number) => Promise<R>): Promise<R[]>;
/**
 * Normalizes a FOREACH block's (possibly absent / partial) concurrency config into a
 * complete `{ mode, limit }`. Unlike the analysis-level default (BOUNDED), a FOREACH with
 * no config runs **SEQUENTIAL** — preserving the historical one-at-a-time behavior, so a
 * FOREACH only parallelizes when its config explicitly opts in.
 */
export declare function normalizeForeachConcurrency(concurrency?: IConcurrencyConfig): Required<IConcurrencyConfig>;
