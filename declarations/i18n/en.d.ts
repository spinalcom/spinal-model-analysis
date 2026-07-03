import { LocaleTranslations } from './localize';
/**
 * English display labels for algorithms, keyed by the stable algorithm name.
 *
 * This bundle intentionally provides ONLY `label` (a human-friendly title). The
 * English `description`, input and parameter texts are canonical in the algorithm
 * definitions themselves, so they are NOT duplicated here — localizeAlgorithm falls
 * back to the definition for those, which keeps them from drifting. Add other locale
 * bundles (fr.ts, …) with full text; only English gets to lean on the definitions.
 */
export declare const EN: LocaleTranslations;
