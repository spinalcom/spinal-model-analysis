import { AlgorithmDefinition } from './definitions/core';
import { LocalizedAlgorithm } from '../i18n/localize';
/**
 * The block catalog: every algorithm, grouped the way someone building an analytic looks for a
 * block — by what it works on — rather than by the source file it is defined in.
 *
 * A block's category is the one of its family (the *_ALGORITHMS array it is declared in), unless
 * its definition names another one (`category`). So a block added to a family file is listed
 * with no further step, and a new family only needs a line in FAMILY_CATEGORIES.
 */
export interface IAlgorithmCategory {
    /** Stable identifier (the key of the catalog's `algorithms` map). */
    id: string;
    /** Display name. */
    label: string;
    /** One line on what the category's blocks are for. */
    description: string;
}
/** The categories, in the order a builder lists them: get data → compute → decide → act. */
export declare const ALGORITHM_CATEGORIES: readonly IAlgorithmCategory[];
/** The catalog category id of an algorithm ("OTHER" when it has none). */
export declare function getAlgorithmCategory(algorithm: Pick<AlgorithmDefinition, 'name' | 'category'>): string;
/** A catalog entry: the localized algorithm, plus the category it is listed under. */
export interface ICatalogAlgorithm extends LocalizedAlgorithm {
    category: string;
}
export interface IAlgorithmCatalog {
    /** The non-empty categories, in display order, each with its number of algorithms. */
    categories: (IAlgorithmCategory & {
        count: number;
    })[];
    /** category id → its algorithms, in declaration order. */
    algorithms: Record<string, ICatalogAlgorithm[]>;
    /** Total number of algorithms. */
    count: number;
}
/**
 * The localized catalog (English by default), ready to serve: categories in display order and
 * the algorithms of each. Any missing translation falls back to English.
 */
export declare function getAlgorithmCatalog(locale?: string, definitions?: readonly AlgorithmDefinition[]): IAlgorithmCatalog;
