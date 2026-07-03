/**
 * Cross-cutting search tags for algorithms, keyed by the stable algorithm name.
 *
 * The /algorithms API already groups blocks by category (NUMBER, TIMESERIES, …);
 * tags add finer, cross-cutting search terms (e.g. "aggregation" spans number +
 * timeseries + list; "io" spans http + endpoints + registers). They are injected
 * into each definition by createAlgorithm(), so every served algorithm carries its
 * tags. A block may also declare inline `tags` in its definition — those are merged
 * with (and de-duplicated against) the entries here.
 *
 * Keep names in sync with the algorithm definitions; an unknown name here is simply
 * ignored, and a missing entry just yields no tags (graceful).
 */
export declare const ALGORITHM_TAGS: Record<string, readonly string[]>;
