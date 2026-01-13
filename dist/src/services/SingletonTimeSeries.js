"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SingletonServiceTimeseries = void 0;
const spinal_model_timeseries_1 = require("spinal-model-timeseries");
class SingletonServiceTimeseries {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }
    static getInstance() {
        if (!SingletonServiceTimeseries.instance) {
            SingletonServiceTimeseries.instance = new spinal_model_timeseries_1.SpinalServiceTimeseries();
        }
        return SingletonServiceTimeseries.instance;
    }
}
exports.SingletonServiceTimeseries = SingletonServiceTimeseries;
SingletonServiceTimeseries.instance = new spinal_model_timeseries_1.SpinalServiceTimeseries();
//# sourceMappingURL=SingletonTimeSeries.js.map