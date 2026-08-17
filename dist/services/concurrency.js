"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeForeachConcurrency = exports.runWithConcurrency = void 0;
const analysisNode_1 = require("../constants/analysisNode");
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
function runWithConcurrency(items, concurrency, task) {
    return __awaiter(this, void 0, void 0, function* () {
        if (items.length === 0)
            return [];
        if (concurrency.mode === 'SEQUENTIAL') {
            const out = [];
            for (let i = 0; i < items.length; i++) {
                out.push(yield task(items[i], i));
            }
            return out;
        }
        // FULL = no cap (limit = item count); BOUNDED = clamp to [1, item count].
        const effectiveLimit = concurrency.mode === 'FULL'
            ? items.length
            : Math.max(1, Math.min(concurrency.limit, items.length));
        const results = new Array(items.length);
        let cursor = 0;
        const worker = () => __awaiter(this, void 0, void 0, function* () {
            for (;;) {
                const index = cursor++;
                if (index >= items.length)
                    return;
                results[index] = yield task(items[index], index);
            }
        });
        yield Promise.all(Array.from({ length: effectiveLimit }, () => worker()));
        return results;
    });
}
exports.runWithConcurrency = runWithConcurrency;
/**
 * Normalizes a FOREACH block's (possibly absent / partial) concurrency config into a
 * complete `{ mode, limit }`. Unlike the analysis-level default (BOUNDED), a FOREACH with
 * no config runs **SEQUENTIAL** — preserving the historical one-at-a-time behavior, so a
 * FOREACH only parallelizes when its config explicitly opts in.
 */
function normalizeForeachConcurrency(concurrency) {
    const mode = (concurrency === null || concurrency === void 0 ? void 0 : concurrency.mode) === 'FULL' || (concurrency === null || concurrency === void 0 ? void 0 : concurrency.mode) === 'BOUNDED' || (concurrency === null || concurrency === void 0 ? void 0 : concurrency.mode) === 'SEQUENTIAL'
        ? concurrency.mode
        : 'SEQUENTIAL';
    let limit = analysisNode_1.DEFAULT_CONCURRENCY_LIMIT;
    if (mode === 'BOUNDED' && typeof (concurrency === null || concurrency === void 0 ? void 0 : concurrency.limit) === 'number' && Number.isFinite(concurrency.limit)) {
        limit = Math.max(1, Math.floor(concurrency.limit));
    }
    return { mode, limit };
}
exports.normalizeForeachConcurrency = normalizeForeachConcurrency;
//# sourceMappingURL=concurrency.js.map