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
exports.AlgorithmRegistry = exports.createAlgorithm = void 0;
const createAlgorithm = (definition) => {
    return Object.freeze(Object.assign(Object.assign({}, definition), { inputTypes: [...definition.inputTypes], parameters: [...definition.parameters] }));
};
exports.createAlgorithm = createAlgorithm;
class AlgorithmRegistry {
    constructor(initialAlgorithms = []) {
        this.registry = new Map();
        for (const algorithm of initialAlgorithms) {
            this.register(algorithm);
        }
    }
    register(algorithm) {
        this.registry.set(algorithm.name, (0, exports.createAlgorithm)(algorithm));
        return this;
    }
    get(name) {
        const algorithm = this.registry.get(name);
        if (!algorithm)
            throw new Error(`Algorithm "${name}" not found`);
        return algorithm;
    }
    has(name) {
        return this.registry.has(name);
    }
    execute(name, input, params, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const algorithm = this.get(name);
            return yield algorithm.run(input, params, context);
        });
    }
    list() {
        return [...this.registry.values()];
    }
    toObject() {
        const result = {};
        for (const [name, algorithm] of this.registry.entries()) {
            result[name] = algorithm;
        }
        return result;
    }
}
exports.AlgorithmRegistry = AlgorithmRegistry;
//# sourceMappingURL=core.js.map