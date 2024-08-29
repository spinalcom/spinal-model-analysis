/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SpinalGraphService,
  SpinalNodeRef,
} from 'spinal-env-viewer-graph-service';
import * as CONSTANTS from '../constants';
import { ITwilioCredentials } from '../interfaces/ITwilioCredentials';
import { IResult } from '../interfaces/IAnalyticResult';
import { attributeService } from 'spinal-env-viewer-plugin-documentation-service';
import { IAnalyticConfig } from '../interfaces/IAnalyticConfig';
import { logMessage } from './utils';
import { ALGORITHMS } from '../algorithms/algorithms';
import { ExitAnalyticError } from '../classes/Errors';
import * as cronParser from 'cron-parser';
import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import AnalyticInputManagerService from './AnalyticInputManagerService';
import AnalyticOutputManagerService from './AnalyticOutputManagerService';

/**
 * This class handles the execution for analytics.
 * It also provides methods for applying tracking methods to followed entities and applying algorithms to inputs.
 *
 * @export
 * @class AnalyticService
 */
export default class AnalyticExecutionManagerService {
  private analyticNodeManagerService: AnalyticNodeManagerService;
  private analyticInputManagerService: AnalyticInputManagerService;
  private analyticOutputManagerService: AnalyticOutputManagerService;
  constructor(
    analyticNodeManagerService: AnalyticNodeManagerService,
    analyticInputManagerService: AnalyticInputManagerService,
    analyticOutputManagerService: AnalyticOutputManagerService
  ) {
    this.analyticNodeManagerService = analyticNodeManagerService;
    this.analyticInputManagerService = analyticInputManagerService;
    this.analyticOutputManagerService = analyticOutputManagerService;
  }

  public initTwilioManagerService(twilioCredentials: ITwilioCredentials): void {
    this.analyticOutputManagerService.initTwilioManagerService(
      twilioCredentials
    );
  }

  public async updateLastExecutionTime(analyticId: string): Promise<void> {
    const configNode = await this.analyticNodeManagerService.getConfig(
      analyticId
    );
    if (!configNode) throw Error('Config node not found');
    const realNode = SpinalGraphService.getRealNode(configNode.id.get());
    await attributeService.addAttributeByCategoryName(
      realNode,
      CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS,
      CONSTANTS.ATTRIBUTE_LAST_EXECUTION_TIME,
      Date.now().toString(),
      'number'
    );
  }

  private async recExecuteAlgorithm(
    analyticId: string,
    entity: SpinalNodeRef,
    algoIndexName: string,
    ioDependencies: any,
    algoIndexMapping: any,
    algoParams: any,
    referenceEpochTime: number = Date.now()
  ): Promise<any> {
    const inputs: any[] = [];
    const myDependencies =
      ioDependencies[algoIndexName]?.split(
        CONSTANTS.ATTRIBUTE_VALUE_SEPARATOR
      ) ?? [];
    for (const dependency of myDependencies) {
      if (!dependency) continue; // if the dependency is empty

      // if dependency is an algorithm then rec call with that algorithm
      if (dependency.startsWith('A')) {
        // save the result of the algorithm in the inputs array
        const res = await this.recExecuteAlgorithm(
          analyticId,
          entity,
          dependency,
          ioDependencies,
          algoIndexMapping,
          algoParams
        );
        inputs.push(res);
      } else {
        // if dependency is an input then get the value of the input
        const inputData =
          await this.analyticInputManagerService.getFormattedInputDataByIndex(
            analyticId,
            entity,
            dependency,
            referenceEpochTime
          );
        if (inputData == undefined) {
          throw new Error(`Input data ${dependency} could not be retrieved`);
        }
        if (Array.isArray(inputData)) {
          inputs.push(...inputData);
        } else {
          inputs.push(inputData);
        }
      }
    }
    // after the inputs are ready we can execute the algorithm
    const algorithm_name = algoIndexMapping[algoIndexName];
    const algorithmParameters =
      this.analyticInputManagerService.filterAlgorithmParametersAttributesByIndex(
        algoParams,
        algoIndexName
      );
    const result = ALGORITHMS[algorithm_name].run(inputs, algorithmParameters);
    if (result == undefined)
      throw new Error(`Algorithm ${algorithm_name} returned undefined`);
    if (algorithm_name === 'EXIT' && result === true) {
      throw new ExitAnalyticError('EXIT algorithm triggered');
    }
    return result;
  }


  private async optExecuteAlgorithm(
    analyticId: string,
    entity: SpinalNodeRef,
    algoIndexName: string,
    ioDependencies: any,
    algoIndexMapping: any,
    algoParams: any,
    referenceEpochTime: number = Date.now(),
    formattedData: any
  ): Promise<any> {
    const inputs: any[] = [];
    
    const myDependencies =
      ioDependencies[algoIndexName]?.split(
        CONSTANTS.ATTRIBUTE_VALUE_SEPARATOR
      ) ?? [];
    for (const dependency of myDependencies) {
      if (!dependency) continue; // if the dependency is empty

      // if dependency is an algorithm then rec call with that algorithm
      if (dependency.startsWith('A')) {
        // save the result of the algorithm in the inputs array
        const res = await this.optExecuteAlgorithm(
          analyticId,
          entity,
          dependency,
          ioDependencies,
          algoIndexMapping,
          algoParams,
          referenceEpochTime,
          formattedData
        );
        inputs.push(res);
      } else {
        // if dependency is an input then get the value of the input
        const inputData = formattedData[dependency][referenceEpochTime];
        if (inputData == undefined) {
          throw new Error(`Input data ${dependency} could not be retrieved`);
        }
        if (Array.isArray(inputData)) {
          inputs.push(...inputData);
        } else {
          inputs.push(inputData);
        }
      }
    }
    // after the inputs are ready we can execute the algorithm
    const algorithm_name = algoIndexMapping[algoIndexName];
    const algorithmParameters =
      this.analyticInputManagerService.filterAlgorithmParametersAttributesByIndex(
        algoParams,
        algoIndexName
      );
    const result = ALGORITHMS[algorithm_name].run(inputs, algorithmParameters);
    if (result == undefined)
      throw new Error(`Algorithm ${algorithm_name} returned undefined`);
    if (algorithm_name === 'EXIT' && result === true) {
      throw new ExitAnalyticError('EXIT algorithm triggered');
    }
    return result;
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

  public async doAnalysisOnEntity(
    analyticId: string,
    entity: SpinalNodeRef,
    executionTimes: number[] = [Date.now()],
    configAttributes?: IAnalyticConfig,
  ): Promise<IResult[]> {
    try {
      // Get the io dependencies of the analytic
      if (!configAttributes) {
        const configNode = await this.analyticNodeManagerService.getConfig(
          analyticId
        );
        if (!configNode)
          return [{ success: false, error: 'No config node found' }];
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
      // Here we need to call a function that will get all the data required for the analysis to run
      const formattedData = 
      await this.analyticInputManagerService.
      getAllDataFromAnalyticConfiguration(analyticId,
        entity,  ioDependencies, executionTimes
      )
      console.log(`FORMATED DATA on ${entity.name.get()}`, formattedData);
      const results: IResult[] = [];
      for(const execTime of executionTimes){
        const result = await this.optExecuteAlgorithm(
          analyticId,
          entity,
          R,
          ioDependencies,
          algoIndexMapping,
          algoParams,
          execTime,
          formattedData
        );
        results.push(await this.analyticOutputManagerService.applyResult(
          result,
          analyticId,
          configAttributes,
          entity,
          execTime
        ));
      }
      return results;

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
        return [{ success: false, error: error.message + positionString }];
      } else {
        return [{
          success: false,
          error: 'An unknown error occurred' + positionString,
        }];
      }
    }
  }

  public async doAnalysis(
    analyticId: string,
    triggerObject: { triggerType: string; triggerValue: string }
  ): Promise<IResult[]>{
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

  const aggregateExecutionTime = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS][
    CONSTANTS.ATTRIBUTE_AGGREGATE_EXECUTION_TIME
  ] as string || undefined;
  if (aggregateExecutionTime && triggerObject.triggerType === CONSTANTS.TRIGGER_TYPE.CRON) {
    const executionTimes =this.getExecutionTimestamps(aggregateExecutionTime, triggerObject.triggerValue, lastExecutionTime);
    const analysisPromises = entities.map((entity) =>
       this.doAnalysisOnEntity(
          analyticId,
          entity,
          executionTimes,
          configAttributes
      )
    );
    const results = (await Promise.all(analysisPromises)).flat();
    return results;
  }
  const executionsTimes: number[] = [];
  executionsTimes.push(Date.now());

  const analysisPromises = entities.map((entity) =>
      this.doAnalysisOnEntity(
        analyticId,
        entity,
        executionsTimes,
        configAttributes
    )
  );
  const results = (await Promise.all(analysisPromises)).flat();
  return results;
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

  

  public getCronMissingExecutionTimes(
    cronSyntax: string,
    lastExecutedTime: number
  ): number[] {
    const now = new Date();
    const lastExecutedDate = new Date(lastExecutedTime);
    const executionTimes: number[] = [];

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
        } catch (e) {
          // Break the loop if there are no more dates to process
          break;
        }
      }
    } catch (err) {
      console.error('Failed to parse cron syntax:', err);
    }
    executionTimes.pop(); // Remove the last date (current time ) as it is
    return executionTimes;
  }

  public getIntervalTimeMissingExecutionTimes(
    intervalTime: number,
    lastExecutedTime: number
  ): number[] {
    const now = new Date();
    const lastExecutedDate = new Date(lastExecutedTime);
    const executionTimes: number[] = [];
    try {
      let nextDate = new Date(lastExecutedDate.getTime() + intervalTime);
      while (nextDate <= now) {
        executionTimes.push(nextDate.getTime());
        nextDate = new Date(nextDate.getTime() + intervalTime);
      }
    } catch (err) {
      console.error('Failed to parse interval time:', err);
    }

    return executionTimes;
  }

  public getExecutionTimestamps(
    aggregateExecutionTime: string,
    executionTime: string,
    lastExecutionTime: number
): number[] {
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
    const timestamps: number[] = [];
    try {
      // Iterate over the scheduled execution times and collect them
      let nextExecTime = executionIterator.next().toDate().getTime();
      while (nextExecTime <= nextAggregateExecTime) {
          timestamps.push(nextExecTime);
          nextExecTime = executionIterator.next().toDate().getTime(); 
      }
  } catch (err) {
      if (!(err instanceof Error && err.message === 'Out of the timespan range')) {
          throw err;  // Re-throw unexpected errors
      }
  }
    return timestamps;
}
}

export { AnalyticExecutionManagerService };
