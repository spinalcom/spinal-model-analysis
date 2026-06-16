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
exports.CONVERSION_ALGORITHMS = void 0;
const core_1 = require("./core");
exports.CONVERSION_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'PARSE_NUMBER',
        description: 'Parses a number from a string input. Throws if the string cannot be parsed into a valid number.',
        inputs: [
            { name: 'value', types: ['string'], description: 'The string to parse into a number.', required: true },
        ],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'string')
                throw new Error('PARSE_NUMBER expects a string input');
            const parsed = Number(input);
            if (isNaN(parsed)) {
                throw new Error(`PARSE_NUMBER: cannot parse "${input}" as a number`);
            }
            return parsed;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'BOOLEAN_TO_NUMBER',
        description: 'Converts a boolean to a number: true → 1, false → 0.',
        inputs: [
            { name: 'value', types: ['boolean'], description: 'The boolean to convert.', required: true },
        ],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'boolean')
                throw new Error('BOOLEAN_TO_NUMBER expects a boolean input');
            return input ? 1 : 0;
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'NUMBER_TO_BOOLEAN',
        description: 'Converts a number to a boolean: 0 → false, anything else → true.',
        inputs: [
            { name: 'value', types: ['number'], description: 'The number to convert.', required: true },
        ],
        outputType: 'boolean',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input !== 'number')
                throw new Error('NUMBER_TO_BOOLEAN expects a number input');
            return input !== 0;
        }),
    }),
];
//# sourceMappingURL=conversion.algorithms.js.map