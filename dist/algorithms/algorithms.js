"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALGORITHMS = exports.ALGORITHM_REGISTRY = exports.ALGORITHM_DEFINITIONS = exports.LEGACY_PARITY_ALGORITHMS = exports.FLOW_CONTROL_ALGORITHMS = exports.NODE_ALGORITHMS = exports.NUMBER_ALGORITHMS = exports.AlgorithmRegistry = exports.createAlgorithm = void 0;
var core_1 = require("./definitions/core");
Object.defineProperty(exports, "createAlgorithm", { enumerable: true, get: function () { return core_1.createAlgorithm; } });
Object.defineProperty(exports, "AlgorithmRegistry", { enumerable: true, get: function () { return core_1.AlgorithmRegistry; } });
const core_2 = require("./definitions/core");
const number_algorithms_1 = require("./definitions/number.algorithms");
Object.defineProperty(exports, "NUMBER_ALGORITHMS", { enumerable: true, get: function () { return number_algorithms_1.NUMBER_ALGORITHMS; } });
const node_algorithms_1 = require("./definitions/node.algorithms");
Object.defineProperty(exports, "NODE_ALGORITHMS", { enumerable: true, get: function () { return node_algorithms_1.NODE_ALGORITHMS; } });
const flow_control_algorithms_1 = require("./definitions/flow-control.algorithms");
Object.defineProperty(exports, "FLOW_CONTROL_ALGORITHMS", { enumerable: true, get: function () { return flow_control_algorithms_1.FLOW_CONTROL_ALGORITHMS; } });
const legacy_parity_algorithms_1 = require("./definitions/legacy-parity.algorithms");
Object.defineProperty(exports, "LEGACY_PARITY_ALGORITHMS", { enumerable: true, get: function () { return legacy_parity_algorithms_1.LEGACY_PARITY_ALGORITHMS; } });
exports.ALGORITHM_DEFINITIONS = [
    ...number_algorithms_1.NUMBER_ALGORITHMS,
    ...node_algorithms_1.NODE_ALGORITHMS,
    ...flow_control_algorithms_1.FLOW_CONTROL_ALGORITHMS,
    ...legacy_parity_algorithms_1.LEGACY_PARITY_ALGORITHMS,
];
exports.ALGORITHM_REGISTRY = new core_2.AlgorithmRegistry(exports.ALGORITHM_DEFINITIONS);
exports.ALGORITHMS = exports.ALGORITHM_REGISTRY.toObject();
//# sourceMappingURL=algorithms.js.map