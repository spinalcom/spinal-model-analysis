import { AlgorithmDefinition } from '../algorithms/definitions/core';
/** Locales for which the module can serve translated algorithm metadata. */
export type Locale = 'en' | 'fr';
export declare const SUPPORTED_LOCALES: readonly Locale[];
/**
 * Translation entry for one algorithm, keyed by the stable algorithm name.
 * The `name` itself is never translated — it is the identifier. Everything else is
 * display text. Partial entries are fine; any missing field falls back to English.
 */
export interface IAlgorithmTranslation {
    /** Human-friendly display label (falls back to the raw name). */
    label?: string;
    /** Translated algorithm description. */
    description?: string;
    /** input name -> translated description */
    inputs?: Record<string, string>;
    /** parameter name -> translated description */
    parameters?: Record<string, string>;
}
/** A full locale bundle: algorithm name -> its translation. */
export type LocaleTranslations = Record<string, IAlgorithmTranslation>;
/** The localized, serialized shape of an algorithm returned to clients. */
export interface LocalizedAlgorithm {
    name: string;
    label: string;
    description: string;
    inputs: Array<Record<string, unknown>>;
    outputType: string;
    parameters: Array<Record<string, unknown>>;
    tags: readonly string[];
}
/** Returns the translation bundle for a locale (empty for unknown locales). */
export declare function getLocaleTranslations(locale?: string): LocaleTranslations;
/**
 * Produces the client-facing, localized view of an algorithm definition for the
 * given locale (English by default). Every translatable field falls back to the
 * English text (and the label to the raw name) when a translation is missing, so a
 * partially-translated locale degrades gracefully instead of showing blanks. The
 * `en` bundle only carries display labels — descriptions/inputs/parameters stay
 * canonical in the definitions and are used as-is.
 */
export declare function localizeAlgorithm(def: AlgorithmDefinition, locale?: string): LocalizedAlgorithm;
