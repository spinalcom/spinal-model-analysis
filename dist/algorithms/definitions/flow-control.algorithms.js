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
exports.FLOW_CONTROL_ALGORITHMS = void 0;
const core_1 = require("./core");
/** Upper bound on DELAY so a stray duration can't block a work node indefinitely. */
const MAX_DELAY_MS = 5 * 60 * 1000;
/** Renders a value for logging: strings as-is, objects as JSON (safe on cycles), else String(). */
function describeForLog(value) {
    if (typeof value === 'string')
        return value;
    if (value === null || value === undefined)
        return String(value);
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        }
        catch (_a) {
            return String(value);
        }
    }
    return String(value);
}
exports.FLOW_CONTROL_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'DELAY',
        description: 'Waits for the given duration, then returns its input unchanged. Useful to pace a ' +
            'workflow, rate-limit calls, or sequence a downstream block to run after a delay ' +
            '(the downstream block depends on this block\'s output). ' +
            `Duration is capped at ${MAX_DELAY_MS} ms to avoid blocking the engine.`,
        inputs: [
            { name: 'value', types: ['any'], description: 'Any value; returned unchanged after the delay.', required: true },
        ],
        outputType: 'any',
        parameters: [
            { name: 'durationMs', type: 'number', description: 'How long to wait before returning, in milliseconds (capped at 300000).', required: true },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const raw = Number(params === null || params === void 0 ? void 0 : params.durationMs);
            if (isNaN(raw) || raw < 0) {
                throw new Error('DELAY requires a non-negative "durationMs" parameter');
            }
            const ms = Math.min(raw, MAX_DELAY_MS);
            yield new Promise((resolve) => setTimeout(resolve, ms));
            return input;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'IF',
        description: 'Conditional branching block. Takes a boolean predicate as inputs[0] and an optional ' +
            'payload as inputs[1]. Executes thenWorkflow if true, elseWorkflow if false. ' +
            'The payload is injected as $item in the chosen branch. ' +
            'Handled by the DAG executor — this run() is never called directly.',
        inputs: [
            { name: 'predicate', types: ['boolean'], description: 'Boolean deciding which branch runs (then/else).', required: true },
            { name: 'payload', types: ['any'], description: 'Optional value injected as $item into the chosen branch.', required: false },
        ],
        outputType: 'any',
        parameters: [],
        run: () => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('IF is handled by the DAG executor, not called directly');
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'LOG',
        description: 'Logs its input to the console (always, regardless of ADVANCED_LOGGING) and returns it ' +
            'unchanged — a transparent tap you can insert anywhere in a workflow to inspect a value. ' +
            'Strings are logged as-is; other values are stringified (objects as JSON). An optional ' +
            '"prefix" parameter labels the line so you can tell which LOG block produced it.',
        inputs: [
            { name: 'value', types: ['any'], description: 'The value to log (typically a string); returned unchanged.', required: true },
        ],
        outputType: 'any',
        parameters: [
            { name: 'prefix', type: 'string', description: 'Optional label prepended to the log line (default "[LOG]").', required: false },
        ],
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            const prefix = typeof (params === null || params === void 0 ? void 0 : params.prefix) === 'string' && params.prefix.length > 0 ? params.prefix : '[LOG]';
            console.log(`${prefix} ${describeForLog(input)}`);
            return input;
        }),
    }),
];
//# sourceMappingURL=flow-control.algorithms.js.map