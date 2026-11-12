"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAlgorithmCatalog = exports.getAlgorithmCategory = exports.ALGORITHM_CATEGORIES = void 0;
const algorithms_1 = require("./algorithms");
const localize_1 = require("../i18n/localize");
/** The categories, in the order a builder lists them: get data → compute → decide → act. */
exports.ALGORITHM_CATEGORIES = [
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
const OTHER_CATEGORY = {
    id: 'OTHER',
    label: 'Other',
    description: 'Blocks without a category.',
};
/** The category of each family's blocks, unless a block's definition names another one. */
const FAMILY_CATEGORIES = [
    [algorithms_1.NODE_ALGORITHMS, 'NODE'],
    [algorithms_1.NODE_ATTRIBUTES_ALGORITHMS, 'NODE_ATTRIBUTES'],
    [algorithms_1.TIMESERIES_ALGORITHMS, 'TIMESERIES'],
    [algorithms_1.NUMBER_ALGORITHMS, 'NUMBER'],
    [algorithms_1.BOOLEAN_ALGORITHMS, 'BOOLEAN'],
    [algorithms_1.STRING_ALGORITHMS, 'TEXT'],
    [algorithms_1.CONVERSION_ALGORITHMS, 'TEXT'],
    [algorithms_1.LIST_ALGORITHMS, 'LIST'],
    [algorithms_1.OBJECT_ALGORITHMS, 'OBJECT'],
    [algorithms_1.FLOW_CONTROL_ALGORITHMS, 'FLOW'],
    [algorithms_1.REGISTER_ALGORITHMS, 'FLOW'],
    [algorithms_1.TICKET_ALGORITHMS, 'TICKET'],
    [algorithms_1.EXCEL_ALGORITHMS, 'EXCEL'],
    [algorithms_1.MAIL_ALGORITHMS, 'COMMUNICATION'],
    [algorithms_1.HTTP_ALGORITHMS, 'COMMUNICATION'],
];
const KNOWN_CATEGORY_IDS = new Set(exports.ALGORITHM_CATEGORIES.map((category) => category.id));
const CATEGORY_BY_NAME = new Map();
for (const [family, categoryId] of FAMILY_CATEGORIES) {
    for (const algorithm of family)
        CATEGORY_BY_NAME.set(algorithm.name, categoryId);
}
/** The catalog category id of an algorithm ("OTHER" when it has none). */
function getAlgorithmCategory(algorithm) {
    var _a;
    const categoryId = (_a = algorithm.category) !== null && _a !== void 0 ? _a : CATEGORY_BY_NAME.get(algorithm.name);
    return categoryId && KNOWN_CATEGORY_IDS.has(categoryId) ? categoryId : OTHER_CATEGORY.id;
}
exports.getAlgorithmCategory = getAlgorithmCategory;
/**
 * The localized catalog (English by default), ready to serve: categories in display order and
 * the algorithms of each. Any missing translation falls back to English.
 */
function getAlgorithmCatalog(locale, definitions = algorithms_1.ALGORITHM_DEFINITIONS) {
    var _a;
    const translations = (0, localize_1.getCategoryTranslations)(locale);
    const algorithms = {};
    for (const definition of definitions) {
        const categoryId = getAlgorithmCategory(definition);
        ((_a = algorithms[categoryId]) !== null && _a !== void 0 ? _a : (algorithms[categoryId] = [])).push(Object.assign(Object.assign({}, (0, localize_1.localizeAlgorithm)(definition, locale)), { category: categoryId }));
    }
    const categories = [...exports.ALGORITHM_CATEGORIES, OTHER_CATEGORY]
        .filter((category) => { var _a; return (_a = algorithms[category.id]) === null || _a === void 0 ? void 0 : _a.length; })
        .map((category) => {
        var _a, _b, _c, _d;
        return ({
            id: category.id,
            label: (_b = (_a = translations[category.id]) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : category.label,
            description: (_d = (_c = translations[category.id]) === null || _c === void 0 ? void 0 : _c.description) !== null && _d !== void 0 ? _d : category.description,
            count: algorithms[category.id].length,
        });
    });
    // Keys in display order, so a client that only reads the map still lists them sensibly.
    const ordered = {};
    for (const category of categories)
        ordered[category.id] = algorithms[category.id];
    return { categories, algorithms: ordered, count: definitions.length };
}
exports.getAlgorithmCatalog = getAlgorithmCatalog;
//# sourceMappingURL=catalog.js.map