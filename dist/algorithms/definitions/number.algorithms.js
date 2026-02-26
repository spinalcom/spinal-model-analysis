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
exports.NUMBER_ALGORITHMS = void 0;
const core_1 = require("./core");
const isNumberArray = (value) => {
    return Array.isArray(value) && value.every((item) => typeof item === 'number');
};
exports.NUMBER_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'COPY_FIRST_NUMBER',
        description: 'Returns the number input, or first value of a number array.',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (typeof input === 'number')
                return input;
            if (isNumberArray(input)) {
                if (input.length === 0)
                    throw new Error('No numeric input provided');
                return input[0];
            }
            throw new Error('Expected number or number[] input');
        }),
    }),
    (0, core_1.createAlgorithm)({
        name: 'SUM_NUMBERS',
        description: 'Sums all numbers from a number array input.',
        inputTypes: ['number'],
        outputType: 'number',
        parameters: [],
        run: (input) => __awaiter(void 0, void 0, void 0, function* () {
            if (!isNumberArray(input))
                throw new Error('Expected number[] input');
            if (input.length === 0)
                throw new Error('No numeric input provided');
            return input.reduce((acc, current) => acc + current, 0);
        }),
    }),
];
//# sourceMappingURL=number.algorithms.js.map