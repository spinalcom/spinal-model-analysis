/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SpinalGraphService,
  SpinalNodeRef,
} from 'spinal-env-viewer-graph-service';
import * as CONSTANTS from '../constants';
import { ITwilioCredentials } from '../interfaces/ITwilioCredentials';
import { IResult } from '../interfaces/IAnalyticResult';
import { attributeService } from 'spinal-env-viewer-plugin-documentation-service';

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

  /**
   * Performs an analysis on an entity for an analytic.
   * @param {string} analyticId The ID of the analytic.
   * @param {SpinalNodeRef} entity The SpinalNodeRef for the entity to analyze.
   * @returns {*} {Promise<void>}
   * @memberof AnalyticService
   */
  public async doAnalysisOnEntity(
    analyticId: string,
    entity: SpinalNodeRef,
    configAttributes?: any,
    executionTime: number = Date.now()
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

      // const ioDependencies = await this.getAttributesFromNode(
      //   configNode.id.get(),
      //   CONSTANTS.CATEGORY_ATTRIBUTE_IO_DEPENDENCIES
      // );
      // const algoIndexMapping = await this.getAttributesFromNode(
      //   configNode.id.get(),
      //   CONSTANTS.CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING
      // );
      // const algoParams = await this.getAttributesFromNode(
      //   configNode.id.get(),
      //   CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS
      // );
      const ioDependencies =
        configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_IO_DEPENDENCIES];

      const algoIndexMapping =
        configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING];

      const algoParams =
        configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS];

      const R = ioDependencies['R'];

      const result = await this.recExecuteAlgorithm(
        analyticId,
        entity,
        R,
        ioDependencies,
        algoIndexMapping,
        algoParams,
        executionTime
      );

      return await this.applyResult(
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
  }

  /**
   * Performs an analysis on all entities for an analytic.
   * @param {string} analyticId The ID of the analytic.
   * @return {*}  {Promise<void>}
   * @memberof AnalyticService
   */
  public async doAnalysis(
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
      ]
    );
    const shouldCatchUpMissedExecutions: boolean =
      configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS][
        CONSTANTS.ATTRIBUTE_ANALYTIC_PAST_EXECUTIONS
      ];
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
          configAttributes,
          executionTime
        )
      )
    );
    const results = await Promise.all(analysisPromises.flat());
    return results;
  }

  /**
   * Applies the result of an algorithm.
   *
   * @param {*} result The result of the algorithm used.
   * @param {string} analyticId The ID of the analytic.
   * @param {SpinalNodeRef} configNode The SpinalNodeRef of the configuration of the analytic.
   * @param {SpinalNodeRef} followedEntityNode The SpinalNodeRef of the entity.
   * @return {*}
   * @memberof AnalyticService
   */
  public async applyResult(
    result: any,
    analyticId: string,
    configAttributes: any,
    followedEntityNode: SpinalNodeRef,
    referenceEpochTime: number = Date.now()
  ): Promise<IResult> {
    if (result === undefined)
      return { success: false, error: 'Result is undefined' };

    //const params = configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS];
    switch (
      configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][
        CONSTANTS.ATTRIBUTE_RESULT_TYPE
      ]
    ) {
      case CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET:
        await this.analyticOutputManagerService.handleTicketResult(
          result,
          analyticId,
          configAttributes,
          followedEntityNode,
          'Ticket'
        );
        return {
          success: true,
          resultValue: result,
          error: '',
          resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET,
        };

      case CONSTANTS.ANALYTIC_RESULT_TYPE.CONTROL_ENDPOINT:
        await this.analyticOutputManagerService.handleControlEndpointResult(
          result,
          followedEntityNode,
          configAttributes,
          referenceEpochTime
        );
        return {
          success: true,
          resultValue: result,
          error: '',
          resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.CONTROL_ENDPOINT,
        };
      case CONSTANTS.ANALYTIC_RESULT_TYPE.ENDPOINT:
        await this.analyticOutputManagerService.handleEndpointResult(
          result,
          followedEntityNode,
          configAttributes,
          referenceEpochTime
        );
        return {
          success: true,
          resultValue: result,
          error: '',
          resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.ENDPOINT,
        };
      case CONSTANTS.ANALYTIC_RESULT_TYPE.ALARM:
        return await this.analyticOutputManagerService.handleTicketResult(
          result,
          analyticId,
          configAttributes,
          followedEntityNode,
          'Alarm'
        );

      case CONSTANTS.ANALYTIC_RESULT_TYPE.SMS:
        return await this.analyticOutputManagerService.handleSMSResult(
          result,
          analyticId,
          configAttributes,
          followedEntityNode
        );

      case CONSTANTS.ANALYTIC_RESULT_TYPE.LOG:
        console.log(
          `LOG : ${
            configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][
              CONSTANTS.ATTRIBUTE_RESULT_NAME
            ]
          } \t|\t Result : ${result}`
        );
        return {
          success: true,
          resultValue: result,
          error: '',
          resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.LOG,
        };

      case CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE:
        return this.analyticOutputManagerService.handleGChatMessageResult(
          result,
          analyticId,
          configAttributes,
          followedEntityNode
        );

      case CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_ORGAN_CARD:
        return this.analyticOutputManagerService.handleGChatOrganCardResult(
          result,
          analyticId,
          configAttributes,
          followedEntityNode
        );

      default:
        return { success: false, error: 'Result type not recognized' };
    }
  }

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
}

export { AnalyticExecutionManagerService };
