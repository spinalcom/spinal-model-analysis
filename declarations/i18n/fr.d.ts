import { CategoryTranslations, LocaleTranslations } from './localize';
/**
 * French translations for algorithm metadata, keyed by the stable algorithm name.
 *
 * Structure per entry: { label?, description?, inputs?: { <inputName>: fr },
 * parameters?: { <paramName>: fr } }. The algorithm `name` and the input/parameter
 * `name`s are stable identifiers and are NOT translated — only display text is.
 *
 * Any algorithm (or field) not listed here falls back to English via
 * localizeAlgorithm(), so the app never shows blanks. This bundle covers all
 * current algorithms; keep it in sync as algorithms are added or their English text
 * changes (translations lag the source until updated).
 */
/** French names of the catalog categories (see algorithms/catalog.ts), keyed by category id. */
export declare const FR_CATEGORIES: CategoryTranslations;
export declare const FR: LocaleTranslations;
