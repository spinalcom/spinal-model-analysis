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
const ensureIfInput = (input) => {
    if (!Array.isArray(input) || input.length < 2) {
        throw new Error('IF expects 2 inputs: [payload, predicate]');
    }
    const payload = input[0];
    const predicate = input[1];
    if (typeof predicate !== 'boolean') {
        throw new Error('IF second input (predicate) must be a boolean');
    }
    return { payload, predicate };
};
const routeIfBranch = (predicate, context) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(context === null || context === void 0 ? void 0 : context.getChildren) || !(context === null || context === void 0 ? void 0 : context.setNextNodes))
        return;
    const children = yield context.getChildren();
    const thenNode = children[0];
    const elseNode = children[1];
    if (!thenNode || !elseNode) {
        throw new Error('IF requires 2 child nodes: [then, else]');
    }
    context.setNextNodes([predicate ? thenNode : elseNode]);
});
exports.FLOW_CONTROL_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'IF',
        description: 'Routes execution to the first child (then) or second child (else) based on the boolean predicate, and returns the payload unchanged.',
        inputTypes: ['any', 'boolean'],
        outputType: 'any',
        parameters: [],
        run: (input, _params, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { payload, predicate } = ensureIfInput(input);
            yield routeIfBranch(predicate, context);
            return payload;
        }),
    }),
];
//# sourceMappingURL=flow-control.algorithms.js.map