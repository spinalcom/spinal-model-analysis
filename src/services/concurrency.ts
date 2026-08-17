import { IConcurrencyConfig, ConcurrencyMode } from '../interfaces/IAnalysisConfigJSON';
import { DEFAULT_CONCURRENCY_LIMIT } from '../constants/analysisNode';

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
export async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: Required<IConcurrencyConfig>,
  task: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];

  if (concurrency.mode === 'SEQUENTIAL') {
    const out: R[] = [];
    for (let i = 0; i < items.length; i++) {
      out.push(await task(items[i], i));
    }
    return out;
  }

  // FULL = no cap (limit = item count); BOUNDED = clamp to [1, item count].
  const effectiveLimit =
    concurrency.mode === 'FULL'
      ? items.length
      : Math.max(1, Math.min(concurrency.limit, items.length));

  const results: R[] = new Array(items.length);
  let cursor = 0;

  const worker = async (): Promise<void> => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await task(items[index], index);
    }
  };

  await Promise.all(Array.from({ length: effectiveLimit }, () => worker()));
  return results;
}

/**
 * Normalizes a FOREACH block's (possibly absent / partial) concurrency config into a
 * complete `{ mode, limit }`. Unlike the analysis-level default (BOUNDED), a FOREACH with
 * no config runs **SEQUENTIAL** — preserving the historical one-at-a-time behavior, so a
 * FOREACH only parallelizes when its config explicitly opts in.
 */
export function normalizeForeachConcurrency(
  concurrency?: IConcurrencyConfig
): Required<IConcurrencyConfig> {
  const mode: ConcurrencyMode =
    concurrency?.mode === 'FULL' || concurrency?.mode === 'BOUNDED' || concurrency?.mode === 'SEQUENTIAL'
      ? concurrency.mode
      : 'SEQUENTIAL';

  let limit = DEFAULT_CONCURRENCY_LIMIT;
  if (mode === 'BOUNDED' && typeof concurrency?.limit === 'number' && Number.isFinite(concurrency.limit)) {
    limit = Math.max(1, Math.floor(concurrency.limit));
  }

  return { mode, limit };
}
