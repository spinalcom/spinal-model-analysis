import {
  AlgorithmDefinition,
} from './definitions/core';
import {
  ALGORITHM_DEFINITIONS,
  NUMBER_ALGORITHMS,
  NODE_ALGORITHMS,
  NODE_ATTRIBUTES_ALGORITHMS,
  FLOW_CONTROL_ALGORITHMS,
  REGISTER_ALGORITHMS,
  BOOLEAN_ALGORITHMS,
  CONVERSION_ALGORITHMS,
  OBJECT_ALGORITHMS,
  LIST_ALGORITHMS,
  TIMESERIES_ALGORITHMS,
  HTTP_ALGORITHMS,
  STRING_ALGORITHMS,
  TICKET_ALGORITHMS,
  EXCEL_ALGORITHMS,
  MAIL_ALGORITHMS,
} from './algorithms';
import { LocalizedAlgorithm, getCategoryTranslations, localizeAlgorithm } from '../i18n/localize';

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
export const ALGORITHM_CATEGORIES: readonly IAlgorithmCategory[] = [
  { id: 'NODE', label: 'Nodes & graph', description: 'Find nodes through the graph, read their info, create and link them.' },
  { id: 'NODE_ATTRIBUTES', label: 'Attributes', description: 'Read and write the attributes of a node.' },
  { id: 'ENDPOINT', label: 'Endpoints', description: 'Read and write the current value of an endpoint.' },
  { id: 'TIMESERIES', label: 'Timeseries', description: 'Fetch, clean, aggregate and inject timeseries.' },
  { id: 'NUMBER', label: 'Numbers', description: 'Arithmetic and aggregation on numbers.' },
  { id: 'BOOLEAN', label: 'Logic & comparison', description: 'Compare values and combine conditions — the predicates of IF and FILTER.' },
  { id: 'TEXT', label: 'Text & conversion', description: 'Build text from values and convert between types.' },
  { id: 'LIST', label: 'Lists', description: 'Build, read and transform lists.' },
  { id: 'OBJECT', label: 'Objects (JSON)', description: 'Build and read objects — e.g. a JSON response or an Excel row.' },
  { id: 'FLOW', label: 'Flow & execution', description: 'Loops and conditions, registers, and what triggered the execution.' },
  { id: 'TICKET', label: 'Tickets', description: 'Create tickets and move them through their process.' },
  { id: 'EXCEL', label: 'Excel', description: 'Read an Excel document, or fill one into a report.' },
  { id: 'COMMUNICATION', label: 'Mail & HTTP', description: 'Send a mail, call an external service.' },
];

/** Listed last, only when a block's category is none of the above (an inline `category` typo). */
const OTHER_CATEGORY: IAlgorithmCategory = {
  id: 'OTHER',
  label: 'Other',
  description: 'Blocks without a category.',
};

/** The category of each family's blocks, unless a block's definition names another one. */
const FAMILY_CATEGORIES: readonly [readonly AlgorithmDefinition[], string][] = [
  [NODE_ALGORITHMS, 'NODE'],
  [NODE_ATTRIBUTES_ALGORITHMS, 'NODE_ATTRIBUTES'],
  [TIMESERIES_ALGORITHMS, 'TIMESERIES'],
  [NUMBER_ALGORITHMS, 'NUMBER'],
  [BOOLEAN_ALGORITHMS, 'BOOLEAN'],
  [STRING_ALGORITHMS, 'TEXT'],
  [CONVERSION_ALGORITHMS, 'TEXT'],
  [LIST_ALGORITHMS, 'LIST'],
  [OBJECT_ALGORITHMS, 'OBJECT'],
  [FLOW_CONTROL_ALGORITHMS, 'FLOW'],
  [REGISTER_ALGORITHMS, 'FLOW'],
  [TICKET_ALGORITHMS, 'TICKET'],
  [EXCEL_ALGORITHMS, 'EXCEL'],
  [MAIL_ALGORITHMS, 'COMMUNICATION'],
  [HTTP_ALGORITHMS, 'COMMUNICATION'],
];

const KNOWN_CATEGORY_IDS = new Set(ALGORITHM_CATEGORIES.map((category) => category.id));
const CATEGORY_BY_NAME = new Map<string, string>();
for (const [family, categoryId] of FAMILY_CATEGORIES) {
  for (const algorithm of family) CATEGORY_BY_NAME.set(algorithm.name, categoryId);
}

/** The catalog category id of an algorithm ("OTHER" when it has none). */
export function getAlgorithmCategory(algorithm: Pick<AlgorithmDefinition, 'name' | 'category'>): string {
  const categoryId = algorithm.category ?? CATEGORY_BY_NAME.get(algorithm.name);
  return categoryId && KNOWN_CATEGORY_IDS.has(categoryId) ? categoryId : OTHER_CATEGORY.id;
}

/** A catalog entry: the localized algorithm, plus the category it is listed under. */
export interface ICatalogAlgorithm extends LocalizedAlgorithm {
  category: string;
}

export interface IAlgorithmCatalog {
  /** The non-empty categories, in display order, each with its number of algorithms. */
  categories: (IAlgorithmCategory & { count: number })[];
  /** category id → its algorithms, in declaration order. */
  algorithms: Record<string, ICatalogAlgorithm[]>;
  /** Total number of algorithms. */
  count: number;
}

/**
 * The localized catalog (English by default), ready to serve: categories in display order and
 * the algorithms of each. Any missing translation falls back to English.
 */
export function getAlgorithmCatalog(
  locale?: string,
  definitions: readonly AlgorithmDefinition[] = ALGORITHM_DEFINITIONS
): IAlgorithmCatalog {
  const translations = getCategoryTranslations(locale);
  const algorithms: Record<string, ICatalogAlgorithm[]> = {};
  for (const definition of definitions) {
    const categoryId = getAlgorithmCategory(definition);
    (algorithms[categoryId] ??= []).push({ ...localizeAlgorithm(definition, locale), category: categoryId });
  }

  const categories = [...ALGORITHM_CATEGORIES, OTHER_CATEGORY]
    .filter((category) => algorithms[category.id]?.length)
    .map((category) => ({
      id: category.id,
      label: translations[category.id]?.label ?? category.label,
      description: translations[category.id]?.description ?? category.description,
      count: algorithms[category.id].length,
    }));

  // Keys in display order, so a client that only reads the map still lists them sensibly.
  const ordered: Record<string, ICatalogAlgorithm[]> = {};
  for (const category of categories) ordered[category.id] = algorithms[category.id];
  return { categories, algorithms: ordered, count: definitions.length };
}
