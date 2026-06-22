"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALGORITHMS = exports.ALGORITHM_REGISTRY = exports.ALGORITHM_DEFINITIONS = exports.HTTP_ALGORITHMS = exports.TIMESERIES_ALGORITHMS = exports.LIST_ALGORITHMS = exports.OBJECT_ALGORITHMS = exports.CONVERSION_ALGORITHMS = exports.BOOLEAN_ALGORITHMS = exports.REGISTER_ALGORITHMS = exports.FLOW_CONTROL_ALGORITHMS = exports.NODE_ATTRIBUTES_ALGORITHMS = exports.NODE_ALGORITHMS = exports.NUMBER_ALGORITHMS = exports.AlgorithmRegistry = exports.createAlgorithm = void 0;
var core_1 = require("./definitions/core");
Object.defineProperty(exports, "createAlgorithm", { enumerable: true, get: function () { return core_1.createAlgorithm; } });
Object.defineProperty(exports, "AlgorithmRegistry", { enumerable: true, get: function () { return core_1.AlgorithmRegistry; } });
const core_2 = require("./definitions/core");
const number_algorithms_1 = require("./definitions/number.algorithms");
Object.defineProperty(exports, "NUMBER_ALGORITHMS", { enumerable: true, get: function () { return number_algorithms_1.NUMBER_ALGORITHMS; } });
const node_algorithms_1 = require("./definitions/node.algorithms");
Object.defineProperty(exports, "NODE_ALGORITHMS", { enumerable: true, get: function () { return node_algorithms_1.NODE_ALGORITHMS; } });
const node_attributes_algorithms_1 = require("./definitions/node.attributes.algorithms");
Object.defineProperty(exports, "NODE_ATTRIBUTES_ALGORITHMS", { enumerable: true, get: function () { return node_attributes_algorithms_1.NODE_ATTRIBUTES_ALGORITHMS; } });
const flow_control_algorithms_1 = require("./definitions/flow-control.algorithms");
Object.defineProperty(exports, "FLOW_CONTROL_ALGORITHMS", { enumerable: true, get: function () { return flow_control_algorithms_1.FLOW_CONTROL_ALGORITHMS; } });
const register_algorithms_1 = require("./definitions/register.algorithms");
Object.defineProperty(exports, "REGISTER_ALGORITHMS", { enumerable: true, get: function () { return register_algorithms_1.REGISTER_ALGORITHMS; } });
const boolean_algorithms_1 = require("./definitions/boolean.algorithms");
Object.defineProperty(exports, "BOOLEAN_ALGORITHMS", { enumerable: true, get: function () { return boolean_algorithms_1.BOOLEAN_ALGORITHMS; } });
const conversion_algorithms_1 = require("./definitions/conversion.algorithms");
Object.defineProperty(exports, "CONVERSION_ALGORITHMS", { enumerable: true, get: function () { return conversion_algorithms_1.CONVERSION_ALGORITHMS; } });
const object_algorithms_1 = require("./definitions/object.algorithms");
Object.defineProperty(exports, "OBJECT_ALGORITHMS", { enumerable: true, get: function () { return object_algorithms_1.OBJECT_ALGORITHMS; } });
const list_algorithms_1 = require("./definitions/list.algorithms");
Object.defineProperty(exports, "LIST_ALGORITHMS", { enumerable: true, get: function () { return list_algorithms_1.LIST_ALGORITHMS; } });
const timeseries_algorithms_1 = require("./definitions/timeseries.algorithms");
Object.defineProperty(exports, "TIMESERIES_ALGORITHMS", { enumerable: true, get: function () { return timeseries_algorithms_1.TIMESERIES_ALGORITHMS; } });
const http_algorithms_1 = require("./definitions/http.algorithms");
Object.defineProperty(exports, "HTTP_ALGORITHMS", { enumerable: true, get: function () { return http_algorithms_1.HTTP_ALGORITHMS; } });
exports.ALGORITHM_DEFINITIONS = [
    ...number_algorithms_1.NUMBER_ALGORITHMS,
    ...node_algorithms_1.NODE_ALGORITHMS,
    ...node_attributes_algorithms_1.NODE_ATTRIBUTES_ALGORITHMS,
    ...flow_control_algorithms_1.FLOW_CONTROL_ALGORITHMS,
    ...register_algorithms_1.REGISTER_ALGORITHMS,
    ...boolean_algorithms_1.BOOLEAN_ALGORITHMS,
    ...conversion_algorithms_1.CONVERSION_ALGORITHMS,
    ...object_algorithms_1.OBJECT_ALGORITHMS,
    ...list_algorithms_1.LIST_ALGORITHMS,
    ...timeseries_algorithms_1.TIMESERIES_ALGORITHMS,
    ...http_algorithms_1.HTTP_ALGORITHMS,
];
exports.ALGORITHM_REGISTRY = new core_2.AlgorithmRegistry(exports.ALGORITHM_DEFINITIONS);
exports.ALGORITHMS = exports.ALGORITHM_REGISTRY.toObject();
//# sourceMappingURL=algorithms.js.map