"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localizeAlgorithm = exports.getLocaleTranslations = exports.SUPPORTED_LOCALES = void 0;
const en_1 = require("./en");
const fr_1 = require("./fr");
exports.SUPPORTED_LOCALES = ['en', 'fr'];
const TRANSLATIONS = {
    en: en_1.EN,
    fr: fr_1.FR,
};
/** Returns the translation bundle for a locale (empty for unknown locales). */
function getLocaleTranslations(locale) {
    var _a;
    if (!locale)
        return {};
    return (_a = TRANSLATIONS[locale.toLowerCase()]) !== null && _a !== void 0 ? _a : {};
}
exports.getLocaleTranslations = getLocaleTranslations;
/**
 * Produces the client-facing, localized view of an algorithm definition for the
 * given locale (English by default). Every translatable field falls back to the
 * English text (and the label to the raw name) when a translation is missing, so a
 * partially-translated locale degrades gracefully instead of showing blanks. The
 * `en` bundle only carries display labels — descriptions/inputs/parameters stay
 * canonical in the definitions and are used as-is.
 */
function localizeAlgorithm(def, locale = 'en') {
    var _a, _b, _c;
    const t = getLocaleTranslations(locale)[def.name];
    return {
        name: def.name,
        label: (_a = t === null || t === void 0 ? void 0 : t.label) !== null && _a !== void 0 ? _a : def.name,
        description: (_b = t === null || t === void 0 ? void 0 : t.description) !== null && _b !== void 0 ? _b : def.description,
        inputs: def.inputs.map((i) => { var _a, _b; return (Object.assign(Object.assign({}, i), { description: (_b = (_a = t === null || t === void 0 ? void 0 : t.inputs) === null || _a === void 0 ? void 0 : _a[i.name]) !== null && _b !== void 0 ? _b : i.description })); }),
        outputType: def.outputType,
        parameters: def.parameters.map((p) => { var _a, _b; return (Object.assign(Object.assign({}, p), { description: (_b = (_a = t === null || t === void 0 ? void 0 : t.parameters) === null || _a === void 0 ? void 0 : _a[p.name]) !== null && _b !== void 0 ? _b : p.description })); }),
        tags: (_c = def.tags) !== null && _c !== void 0 ? _c : [],
    };
}
exports.localizeAlgorithm = localizeAlgorithm;
//# sourceMappingURL=localize.js.map