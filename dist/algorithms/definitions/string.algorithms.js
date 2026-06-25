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
exports.STRING_ALGORITHMS = void 0;
const core_1 = require("./core");
/**
 * Renders a value for interpolation into a template:
 * strings as-is, objects/arrays as JSON, null/undefined as empty, others via String().
 */
function stringifyValue(v) {
    if (v === null || v === undefined)
        return '';
    if (typeof v === 'string')
        return v;
    if (typeof v === 'object')
        return JSON.stringify(v);
    return String(v);
}
exports.STRING_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'FORMAT_STRING',
        description: 'Builds a string from a template by substituting positional placeholders {0}, {1}, … ' +
            'with the wired inputs in order (input[0] → {0}, input[1] → {1}, …). Strings are inserted ' +
            'as-is, objects/arrays as JSON, other values via String(). Useful for building dynamic ' +
            'curl commands, URLs, request bodies or messages (e.g. injecting an auth token into a ' +
            'request). Only {<digits>} are treated as placeholders, so JSON braces like {"k":"v"} are ' +
            'left untouched.',
        inputs: [
            { name: 'values', types: ['any'], description: 'Values to substitute for {0}, {1}, … in template order.', required: false, variadic: true },
        ],
        outputType: 'string',
        parameters: [
            { name: 'template', type: 'string', description: 'The template string with positional placeholders, e.g. "Bearer {0}".', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const template = params === null || params === void 0 ? void 0 : params.template;
            if (typeof template !== 'string') {
                throw new Error('FORMAT_STRING requires a string "template" parameter');
            }
            const values = Array.isArray(input)
                ? input
                : input === undefined
                    ? []
                    : [input];
            return template.replace(/\{(\d+)\}/g, (_match, digits) => {
                const idx = Number(digits);
                if (idx >= values.length) {
                    throw new Error(`FORMAT_STRING: template references {${idx}} but only ${values.length} input(s) were provided`);
                }
                return stringifyValue(values[idx]);
            });
        }),
    }),
];
//# sourceMappingURL=string.algorithms.js.map