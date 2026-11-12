/**
 * Search keywords for algorithms, keyed by the stable algorithm name.
 *
 * A builder finds a block by searching its label, its name and its description; keywords add the
 * words a user may type that appear in none of them — synonyms, symbols, the usual English or
 * French term ("email", "seuil", "boucle", ">"). They are never shown and never used to filter,
 * so a block needs an entry only when such a word exists: no entry is fine.
 *
 * createAlgorithm() merges these into each definition's `keywords` (with any declared inline).
 * An unknown name here is simply ignored.
 */
export declare const ALGORITHM_KEYWORDS: Record<string, readonly string[]>;
