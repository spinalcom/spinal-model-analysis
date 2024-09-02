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
exports.AnalyticExecutionManagerService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const CONSTANTS = require("../constants");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const algorithms_1 = require("../algorithms/algorithms");
const Errors_1 = require("../classes/Errors");
const cronParser = require("cron-parser");
/**
 * This class handles the execution for analytics.
 * It also provides methods for applying tracking methods to followed entities and applying algorithms to inputs.
 *
 * @export
 * @class AnalyticService
 */
class AnalyticExecutionManagerService {
    constructor(analyticNodeManagerService, analyticInputManagerService, analyticOutputManagerService) {
        this.analyticNodeManagerService = analyticNodeManagerService;
        this.analyticInputManagerService = analyticInputManagerService;
        this.analyticOutputManagerService = analyticOutputManagerService;
    }
    initTwilioManagerService(twilioCredentials) {
        this.analyticOutputManagerService.initTwilioManagerService(twilioCredentials);
    }
    updateLastExecutionTime(analyticId) {
        return __awaiter(this, void 0, void 0, function* () {
            const configNode = yield this.analyticNodeManagerService.getConfig(analyticId);
            if (!configNode)
                throw Error('Config node not found');
            const realNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(configNode.id.get());
            yield spinal_env_viewer_plugin_documentation_service_1.attributeService.addAttributeByCategoryName(realNode, CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS, CONSTANTS.ATTRIBUTE_LAST_EXECUTION_TIME, Date.now().toString(), 'number');
        });
    }
    recExecuteAlgorithm(analyticId, entity, algoIndexName, ioDependencies, algoIndexMapping, algoParams, referenceEpochTime = Date.now()) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const inputs = [];
            const myDependencies = (_b = (_a = ioDependencies[algoIndexName]) === null || _a === void 0 ? void 0 : _a.split(CONSTANTS.ATTRIBUTE_VALUE_SEPARATOR)) !== null && _b !== void 0 ? _b : [];
            for (const dependency of myDependencies) {
                if (!dependency)
                    continue; // if the dependency is empty
                // if dependency is an algorithm then rec call with that algorithm
                if (dependency.startsWith('A')) {
                    // save the result of the algorithm in the inputs array
                    const res = yield this.recExecuteAlgorithm(analyticId, entity, dependency, ioDependencies, algoIndexMapping, algoParams);
                    inputs.push(res);
                }
                else {
                    // if dependency is an input then get the value of the input
                    const inputData = yield this.analyticInputManagerService.getFormattedInputDataByIndex(analyticId, entity, dependency, referenceEpochTime);
                    if (inputData == undefined) {
                        throw new Error(`Input data ${dependency} could not be retrieved`);
                    }
                    if (Array.isArray(inputData)) {
                        inputs.push(...inputData);
                    }
                    else {
                        inputs.push(inputData);
                    }
                }
            }
            // after the inputs are ready we can execute the algorithm
            const algorithm_name = algoIndexMapping[algoIndexName];
            const algorithmParameters = this.analyticInputManagerService.filterAlgorithmParametersAttributesByIndex(algoParams, algoIndexName);
            const result = algorithms_1.ALGORITHMS[algorithm_name].run(inputs, algorithmParameters);
            if (result == undefined)
                throw new Error(`Algorithm ${algorithm_name} returned undefined`);
            if (algorithm_name === 'EXIT' && result === true) {
                throw new Errors_1.ExitAnalyticError('EXIT algorithm triggered');
            }
            return result;
        });
    }
    optExecuteAlgorithm(analyticId, entity, algoIndexName, ioDependencies, algoIndexMapping, algoParams, referenceEpochTime = Date.now(), formattedData) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const inputs = [];
            const myDependencies = (_b = (_a = ioDependencies[algoIndexName]) === null || _a === void 0 ? void 0 : _a.split(CONSTANTS.ATTRIBUTE_VALUE_SEPARATOR)) !== null && _b !== void 0 ? _b : [];
            for (const dependency of myDependencies) {
                if (!dependency)
                    continue; // if the dependency is empty
                // if dependency is an algorithm then rec call with that algorithm
                if (dependency.startsWith('A')) {
                    // save the result of the algorithm in the inputs array
                    const res = yield this.optExecuteAlgorithm(analyticId, entity, dependency, ioDependencies, algoIndexMapping, algoParams, referenceEpochTime, formattedData);
                    inputs.push(res);
                }
                else {
                    // if dependency is an input then get the value of the input
                    const inputData = formattedData[dependency][referenceEpochTime];
                    if (inputData == undefined) {
                        throw new Error(`Input data ${dependency} could not be retrieved`);
                    }
                    inputs.push(inputData);
                }
            }
            // after the inputs are ready we can execute the algorithm
            const algorithm_name = algoIndexMapping[algoIndexName];
            const algorithmParameters = this.analyticInputManagerService.filterAlgorithmParametersAttributesByIndex(algoParams, algoIndexName);
            const result = algorithms_1.ALGORITHMS[algorithm_name].run(inputs, algorithmParameters);
            if (result == undefined)
                throw new Error(`Algorithm ${algorithm_name} returned undefined`);
            if (algorithm_name === 'EXIT' && result === true) {
                throw new Errors_1.ExitAnalyticError('EXIT algorithm triggered');
            }
            return result;
        });
    }
    /**
     * Performs an analysis on an entity for an analytic.
     * @param {string} analyticId The ID of the analytic.
     * @param {SpinalNodeRef} entity The SpinalNodeRef for the entity to analyze.
     * @returns {*} {Promise<void>}
     * @memberof AnalyticService
     */
    /*public async doAnalysisOnEntity(
      analyticId: string,
      entity: SpinalNodeRef,
      executionTime: number = Date.now(),
      configAttributes?: IAnalyticConfig,
    ): Promise<IResult> {
      try {
        // Get the io dependencies of the analytic
        if (!configAttributes) {
          const configNode = await this.analyticNodeManagerService.getConfig(
            analyticId
          );
          if (!configNode)
            return { success: false, error: 'No config node found' };
          configAttributes =
            await this.analyticNodeManagerService.getAllCategoriesAndAttributesFromNode(
              configNode.id.get()
            );
        }
  
        const ioDependencies =
          configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_IO_DEPENDENCIES];
  
        const algoIndexMapping =
          configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING];
  
        const algoParams =
          configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS];
  
        const R = ioDependencies['R'] as string;
  
        const result = await this.recExecuteAlgorithm(
          analyticId,
          entity,
          R,
          ioDependencies,
          algoIndexMapping,
          algoParams,
          executionTime
        );
  
        return await this.analyticOutputManagerService.applyResult(
          result,
          analyticId,
          configAttributes,
          entity,
          executionTime
        );
      } catch (error) {
        const analyticInfo = SpinalGraphService.getInfo(analyticId);
        const positionString =
          ' on ' +
          entity.name.get() +
          ' in analytic : ' +
          analyticInfo.name.get() +
          ' at ' +
          Date.now();
        if (error instanceof Error || error instanceof ExitAnalyticError) {
          return { success: false, error: error.message + positionString };
        } else {
          return {
            success: false,
            error: 'An unknown error occurred' + positionString,
          };
        }
      }
    }*/
    doAnalysisOnEntity(analyticId, entity, executionTimes = [Date.now()], configAttributes) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get the io dependencies of the analytic
                if (!configAttributes) {
                    const configNode = yield this.analyticNodeManagerService.getConfig(analyticId);
                    if (!configNode)
                        return [{ success: false, error: 'No config node found' }];
                    configAttributes =
                        yield this.analyticNodeManagerService.getAllCategoriesAndAttributesFromNode(configNode.id.get());
                }
                const ioDependencies = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_IO_DEPENDENCIES];
                const algoIndexMapping = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING];
                const algoParams = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS];
                const R = ioDependencies['R'];
                // Here we need to call a function that will get all the data required for the analysis to run
                const formattedData = yield this.analyticInputManagerService.
                    getAllDataFromAnalyticConfiguration(analyticId, entity, ioDependencies, executionTimes);
                const results = [];
                for (const execTime of executionTimes) {
                    const result = yield this.optExecuteAlgorithm(analyticId, entity, R, ioDependencies, algoIndexMapping, algoParams, execTime, formattedData);
                    results.push(yield this.analyticOutputManagerService.applyResult(result, analyticId, configAttributes, entity, execTime));
                }
                return results;
            }
            catch (error) {
                const analyticInfo = spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(analyticId);
                const positionString = ' on ' +
                    entity.name.get() +
                    ' in analytic : ' +
                    analyticInfo.name.get() +
                    ' at ' +
                    Date.now();
                if (error instanceof Error || error instanceof Errors_1.ExitAnalyticError) {
                    return [{ success: false, error: error.message + positionString }];
                }
                else {
                    return [{
                            success: false,
                            error: 'An unknown error occurred' + positionString,
                        }];
                }
            }
        });
    }
    doAnalysis(analyticId, triggerObject) {
        return __awaiter(this, void 0, void 0, function* () {
            const entities = yield this.analyticInputManagerService.getWorkingFollowedEntities(analyticId);
            if (!entities)
                return [{ success: false, error: 'No entities found' }];
            const configNode = yield this.analyticNodeManagerService.getConfig(analyticId);
            if (!configNode)
                return [{ success: false, error: 'No config node found' }];
            const configAttributes = yield this.analyticNodeManagerService.getAllCategoriesAndAttributesFromNode(configNode.id.get());
            const lastExecutionTime = parseInt(configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS][CONSTANTS.ATTRIBUTE_LAST_EXECUTION_TIME]);
            const aggregateExecutionTime = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS][CONSTANTS.ATTRIBUTE_AGGREGATE_EXECUTION_TIME] || undefined;
            if (aggregateExecutionTime && triggerObject.triggerType === CONSTANTS.TRIGGER_TYPE.CRON) {
                const executionTimes = this.getExecutionTimestamps(aggregateExecutionTime, triggerObject.triggerValue, lastExecutionTime);
                console.log(`executionTimes aggretegate feature : ${executionTimes}`);
                const analysisPromises = entities.map((entity) => this.doAnalysisOnEntity(analyticId, entity, executionTimes, configAttributes));
                const results = (yield Promise.all(analysisPromises)).flat();
                return results;
            }
            const executionsTimes = [];
            executionsTimes.push(Date.now());
            const analysisPromises = entities.map((entity) => this.doAnalysisOnEntity(analyticId, entity, executionsTimes, configAttributes));
            const results = (yield Promise.all(analysisPromises)).flat();
            return results;
        });
    }
    /**
     * Performs an analysis on all entities for an analytic.
     * @param {string} analyticId The ID of the analytic.
     * @return {*}  {Promise<void>}
     * @memberof AnalyticService
     */
    /*public async doAnalysis(
      analyticId: string,
      triggerObject: { triggerType: string; triggerValue: string }
    ): Promise<IResult[]> {
      const entities =
        await this.analyticInputManagerService.getWorkingFollowedEntities(
          analyticId
        );
      if (!entities) return [{ success: false, error: 'No entities found' }];
  
      const configNode = await this.analyticNodeManagerService.getConfig(
        analyticId
      );
      if (!configNode) return [{ success: false, error: 'No config node found' }];
  
      const configAttributes =
        await this.analyticNodeManagerService.getAllCategoriesAndAttributesFromNode(
          configNode.id.get()
        );
  
      const lastExecutionTime = parseInt(
        configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS][
          CONSTANTS.ATTRIBUTE_LAST_EXECUTION_TIME
        ] as string
      );
      const shouldCatchUpMissedExecutions: boolean =
        configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS][
          CONSTANTS.ATTRIBUTE_ANALYTIC_PAST_EXECUTIONS
        ] as boolean;
      let executionsTimes: number[] = [];
  
      if (shouldCatchUpMissedExecutions) {
        if (triggerObject.triggerType === CONSTANTS.TRIGGER_TYPE.CRON) {
          executionsTimes = this.getCronMissingExecutionTimes(
            triggerObject.triggerValue,
            lastExecutionTime
          );
        }
        if (triggerObject.triggerType === CONSTANTS.TRIGGER_TYPE.INTERVAL_TIME) {
          executionsTimes = this.getIntervalTimeMissingExecutionTimes(
            parseInt(triggerObject.triggerValue),
            lastExecutionTime
          );
        }
      }
      executionsTimes.push(Date.now());
  
      // Adjust the last execution time for cron triggers to match the exact time
      if (triggerObject.triggerType === CONSTANTS.TRIGGER_TYPE.CRON) {
        const interval = cronParser.parseExpression(triggerObject.triggerValue);
        const nextExecutionTime = interval.prev().getTime();
        executionsTimes[executionsTimes.length - 1] = nextExecutionTime;
      }
  
      logMessage(`executionsTimes : ${executionsTimes}`);
  
      const analysisPromises = entities.map((entity) =>
        executionsTimes.map((executionTime) =>
          this.doAnalysisOnEntity(
            analyticId,
            entity,
            executionTime,
            configAttributes
          )
        )
      );
      const results = await Promise.all(analysisPromises.flat());
      return results;
    }*/
    getCronMissingExecutionTimes(cronSyntax, lastExecutedTime) {
        const now = new Date();
        const lastExecutedDate = new Date(lastExecutedTime);
        const executionTimes = [];
        try {
            // Initialize options for cron-parser
            const options = {
                currentDate: lastExecutedDate,
                endDate: now,
            };
            // Parse the cron syntax with the provided options
            const interval = cronParser.parseExpression(cronSyntax, options);
            // Using a while loop to fetch the next valid date within the range
            let nextDate = interval.next();
            while (nextDate && nextDate.toDate() <= now) {
                executionTimes.push(nextDate.getTime());
                try {
                    nextDate = interval.next();
                }
                catch (e) {
                    // Break the loop if there are no more dates to process
                    break;
                }
            }
        }
        catch (err) {
            console.error('Failed to parse cron syntax:', err);
        }
        executionTimes.pop(); // Remove the last date (current time ) as it is
        return executionTimes;
    }
    getIntervalTimeMissingExecutionTimes(intervalTime, lastExecutedTime) {
        const now = new Date();
        const lastExecutedDate = new Date(lastExecutedTime);
        const executionTimes = [];
        try {
            let nextDate = new Date(lastExecutedDate.getTime() + intervalTime);
            while (nextDate <= now) {
                executionTimes.push(nextDate.getTime());
                nextDate = new Date(nextDate.getTime() + intervalTime);
            }
        }
        catch (err) {
            console.error('Failed to parse interval time:', err);
        }
        return executionTimes;
    }
    getExecutionTimestamps(aggregateExecutionTime, executionTime, lastExecutionTime) {
        // Parsing options with a current date set to the lastExecutionTime
        const options = {
            currentDate: new Date(lastExecutionTime),
            tz: 'Europe/Paris' // Set to UTC or the appropriate timezone
        };
        // Initialize the parser for the aggregate execution time
        const aggregateIterator = cronParser.parseExpression(aggregateExecutionTime, options);
        // Calculate the next aggregate execution time
        const nextAggregateExecTime = aggregateIterator.next().toDate().getTime();
        // Modify options for regular execution time parsing
        options.currentDate = new Date(lastExecutionTime); // Reset the currentDate
        const executionIterator = cronParser.parseExpression(executionTime, options);
        // Array to store the timestamps
        const timestamps = [];
        try {
            // Iterate over the scheduled execution times and collect them
            let nextExecTime = executionIterator.next().toDate().getTime();
            while (nextExecTime <= nextAggregateExecTime) {
                timestamps.push(nextExecTime);
                nextExecTime = executionIterator.next().toDate().getTime();
            }
        }
        catch (err) {
            if (!(err instanceof Error && err.message === 'Out of the timespan range')) {
                throw err; // Re-throw unexpected errors
            }
        }
        return timestamps;
    }
}
exports.default = AnalyticExecutionManagerService;
exports.AnalyticExecutionManagerService = AnalyticExecutionManagerService;
//# sourceMappingURL=AnalyticExecutionManagerService.js.map