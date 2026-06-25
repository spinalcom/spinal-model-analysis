import {
    AlgorithmDefinition,
    AlgorithmRunResult,
    createAlgorithm,
} from './core';

/**
 * Renders a value for interpolation into a template:
 * strings as-is, objects/arrays as JSON, null/undefined as empty, others via String().
 */
function stringifyValue(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
}

export const STRING_ALGORITHMS: AlgorithmDefinition[] = [
    createAlgorithm({
        name: 'FORMAT_STRING',
        description:
            'Builds a string from a template by substituting positional placeholders {0}, {1}, … ' +
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
        run: async (input, params): AlgorithmRunResult => {
            const template = params?.template;
            if (typeof template !== 'string') {
                throw new Error('FORMAT_STRING requires a string "template" parameter');
            }

            const values: unknown[] = Array.isArray(input)
                ? input
                : input === undefined
                    ? []
                    : [input];

            return template.replace(/\{(\d+)\}/g, (_match, digits) => {
                const idx = Number(digits);
                if (idx >= values.length) {
                    throw new Error(
                        `FORMAT_STRING: template references {${idx}} but only ${values.length} input(s) were provided`
                    );
                }
                return stringifyValue(values[idx]);
            });
        },
    }),
];
