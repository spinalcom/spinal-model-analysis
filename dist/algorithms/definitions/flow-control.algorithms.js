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
exports.FLOW_CONTROL_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'IF',
        description: 'Conditional branching block. Takes a boolean predicate as inputs[0] and an optional ' +
            'payload as inputs[1]. Executes thenWorkflow if true, elseWorkflow if false. ' +
            'The payload is injected as $item in the chosen branch. ' +
            'Handled by the DAG executor — this run() is never called directly.',
        inputTypes: ['boolean'],
        outputType: 'any',
        parameters: [],
        run: () => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('IF is handled by the DAG executor, not called directly');
        }),
    }),
];
//# sourceMappingURL=flow-control.algorithms.js.map