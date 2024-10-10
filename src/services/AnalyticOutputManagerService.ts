/* eslint-disable @typescript-eslint/no-explicit-any */
import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import { SingletonServiceTimeseries } from './SingletonTimeSeries';
import AnalyticInputManagerService from './AnalyticInputManagerService';
import AnalyticTwilioManagerService from './AnalyticTwilioManagerService';
import { attributeService } from 'spinal-env-viewer-plugin-documentation-service';
import { InputDataEndpoint } from '../models/InputData/InputDataModel/InputDataEndpoint';
import {
  InputDataEndpointDataType,
  InputDataEndpointType,
  SpinalBmsEndpoint,
} from 'spinal-model-bmsnetwork';
import {
  SpinalGraphService,
  SpinalNodeRef,
  SPINAL_RELATION_PTR_LST_TYPE,
  SpinalNode,
} from 'spinal-env-viewer-graph-service';
import {
  IGChatMessageResult,
  IResult,
  IGChatOrganCardResult,
  IGChatCard,
} from '../interfaces/IAnalyticResult';

import { logMessage } from './utils';
import * as CONSTANTS from '../constants';
import { SpinalServiceTimeseries } from 'spinal-model-timeseries';
import { ITwilioCredentials } from '../interfaces/ITwilioCredentials';
import {
  serviceTicketPersonalized,
  spinalServiceTicket,
  ALARM_RELATION_NAME,
  TICKET_RELATION_TYPE,
  TICKET_RELATION_NAME,
} from 'spinal-service-ticket';

export default class AnalyticOutputManagerService {
  private analyticNodeManagerService: AnalyticNodeManagerService;
  private analyticInputManagerService: AnalyticInputManagerService;
  private analyticTwilioManagerService:
    | AnalyticTwilioManagerService
    | undefined;
  private spinalServiceTimeseries: SpinalServiceTimeseries;
  constructor(
    analyticNodeManagerService: AnalyticNodeManagerService,
    analyticInputManagerService: AnalyticInputManagerService
  ) {
    this.analyticNodeManagerService = analyticNodeManagerService;
    this.analyticInputManagerService = analyticInputManagerService;
    this.spinalServiceTimeseries = SingletonServiceTimeseries.getInstance();
  }

  public initTwilioManagerService(twilioCredentials: ITwilioCredentials) {
    if (
      !twilioCredentials ||
      !twilioCredentials.accountSid ||
      !twilioCredentials.authToken ||
      !twilioCredentials.fromNumber
    ) {
      return;
    }
    console.log('Creating twilio manager service instance...');
    this.analyticTwilioManagerService = new AnalyticTwilioManagerService(
      twilioCredentials.accountSid,
      twilioCredentials.authToken,
      twilioCredentials.fromNumber
    );
  }
  /**
   * Handles the result of an algorithm that creates a ticket or an alarm.
   *
   * @private
   * @param {*} result
   * @param {string} analyticId
   * @param {SpinalNodeRef} configNode
   * @param {SpinalNodeRef} followedEntityNode
   * @param {*} params
   * @param {string} ticketType
   * @return {*}  {Promise<void>}
   * @memberof AnalyticService
   */
  public async handleTicketResult(
    result: any,
    analyticId: string,
    configAttributes: any,
    followedEntityNode: SpinalNodeRef,
    ticketType: string // Alarm or Ticket
  ): Promise<IResult> {
    if (result == false)
      return {
        success: true,
        error: '',
        resultValue: result,
        resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET,
      };

    const outputNode = await this.analyticNodeManagerService.getOutputsNode(
      analyticId
    );
    if (!outputNode) return { success: false, error: ' Output Node not found' };

    const analyticContextId =
      this.analyticNodeManagerService.getContextIdOfAnalytic(analyticId);
    if (!analyticContextId)
      return { success: false, error: ' Analytic context id not found' };

    const ticketInfo = {
      name: `${
        configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][
          CONSTANTS.ATTRIBUTE_RESULT_NAME
        ]
      } : ${followedEntityNode.name.get()}`,
    };

    this.addTicketAlarm(
      ticketInfo,
      configAttributes,
      analyticContextId,
      outputNode.id.get(),
      followedEntityNode.id.get(),
      ticketType
    );
    return {
      success: true,
      error: '',
      resultValue: result,
      resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.TICKET,
    };
  }

  /**
   * Handles the result of an algorithm that modifies a control point.
   *
   * @private
   * @param {*} result
   * @param {SpinalNodeRef} followedEntityNode
   * @param {*} params
   * @return {*}  {Promise<void>}
   * @memberof AnalyticService
   */
  public async handleControlEndpointResult(
    result: any,
    followedEntityNode: SpinalNodeRef,
    configAttributes: any,
    referenceEpochTime: number
  ): Promise<IResult> {
    const controlEndpointNode =
      await this.analyticInputManagerService.findEndpoint(
        followedEntityNode.id.get(),
        configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][
          CONSTANTS.ATTRIBUTE_RESULT_NAME
        ],
        0,
        true,
        [],
        CONSTANTS.CONTROL_ENDPOINT_RELATIONS,
        CONSTANTS.ENDPOINT_NODE_TYPE
      );
    if (!controlEndpointNode)
      return { success: false, error: ' Control endpoint node not found' };

    const controlEndpoint = await controlEndpointNode.element.load();
    controlEndpoint.currentValue.set(result);
    const bool = await this.spinalServiceTimeseries.insertFromEndpoint(
      controlEndpointNode.id.get(),
      result,
      referenceEpochTime
    );
    if (!bool) throw new Error('Failed to insert data in timeseries');
    logMessage(
      `CP ${controlEndpointNode.name.get()} updated with value : ${result} on ${followedEntityNode.name.get()} at ${referenceEpochTime}`
    );
    //console.log(`CP ${controlEndpointNode.name.get()} updated with value : , ${result},  on , ${followedEntityNode.name.get()}`)
    return {
      success: true,
      resultValue: result,
      error: '',
      resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.CONTROL_ENDPOINT,
    };
  }

  /**
   * Handles the result of an algorithm that modifies an Endpoint.
   *
   * @private
   * @param {*} result
   * @param {SpinalNodeRef} followedEntityNode
   * @param {*} params
   * @return {*}  {Promise<void>}
   * @memberof AnalyticService
   */
  public async handleEndpointResult(
    result: any,
    followedEntityNode: SpinalNodeRef,
    configAttributes: any,
    referenceEpochTime: number
  ): Promise<IResult> {
    let endpointNode = await this.analyticInputManagerService.findEndpoint(
      followedEntityNode.id.get(),
      configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][
        CONSTANTS.ATTRIBUTE_RESULT_NAME
      ],
      0,
      true,
      [],
      CONSTANTS.ENDPOINT_RELATIONS,
      CONSTANTS.ENDPOINT_NODE_TYPE
    );

    if (
      !endpointNode &&
      !configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][
        CONSTANTS.ATTRIBUTE_CREATE_ENDPOINT_IF_NOT_EXIST
      ]
    )
      return { success: false, error: 'Endpoint node not found' };

    if (!endpointNode) {
      endpointNode = await this.createEndpoint(
        referenceEpochTime,
        followedEntityNode.id.get(),
        configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS][
          CONSTANTS.ATTRIBUTE_RESULT_NAME
        ],
        result,
        configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ENDPOINT_PARAMETERS][
          CONSTANTS.ATTRIBUTE_CREATE_ENDPOINT_UNIT
        ],
        configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ENDPOINT_PARAMETERS][
          CONSTANTS.ATTRIBUTE_CREATE_ENDPOINT_MAX_DAYS
        ]
      );

      if (!endpointNode)
        return { success: false, error: 'Failed endpoint creation' };
    }
    const endpoint = await endpointNode.element.load();
    endpoint.currentValue.set(result);
    const bool = await this.spinalServiceTimeseries.insertFromEndpoint(
      endpointNode.id.get(),
      result,
      referenceEpochTime
    );
    if (!bool)
      return { success: false, error: 'Failed to insert data in timeseries' };
    logMessage(
      `EP ${endpointNode.name.get()} updated with value : ${result} on ${followedEntityNode.name.get()} at ${referenceEpochTime}`
    );
    return {
      success: true,
      resultValue: result,
      error: '',
      resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.ENDPOINT,
    };
  }

  /**
   * Handles the result of an algorithm that sends an SMS.
   *
   * @private
   * @param {*} result
   * @param {SpinalNodeRef} configNode
   * @param {SpinalNodeRef} followedEntityNode
   * @return {*}  {Promise<void>}
   * @memberof AnalyticService
   */
  public async handleSMSResult(
    result: any,
    analyticId: string,
    configAttributes: any,
    followedEntityNode: SpinalNodeRef
  ): Promise<IResult> {
    if (!this.analyticTwilioManagerService)
      return { success: false, error: 'Twilio parameters not found' };

    if (result == false)
      return {
        success: true,
        resultValue: result,
        error: '',
        resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.SMS,
      };
    console.log('SMS result');

    const twilioParams =
      configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_TWILIO_PARAMETERS];
    const toNumber: string = twilioParams[CONSTANTS.ATTRIBUTE_PHONE_NUMBER];
    let message = twilioParams[CONSTANTS.ATTRIBUTE_PHONE_MESSAGE];
    const variables = message.match(/[^{}]+(?=\})/g);
    if (variables) {
      for (const variable of variables) {
        const value =
          await this.analyticInputManagerService.getFormattedInputDataByIndex(
            analyticId,
            followedEntityNode,
            variable
          );
        message = message.replace(`{${variable}}`, '' + value);
      }
    }

    const entityName: string = followedEntityNode.name
      .get()
      .replace(/[0-9]/g, '*');

    const axiosResult = await this.analyticTwilioManagerService.sendMessage(
      message,
      toNumber,
      entityName
    );
    console.log({ status: axiosResult.status, data: axiosResult.data });
    return {
      success: true,
      resultValue: result,
      error: '',
      resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.SMS,
    };
  }

  public async handleGChatMessageResult(
    result: any,
    analyticId: string,
    configAttributes: any,
    followedEntityNode: SpinalNodeRef
  ): Promise<IResult> {
    console.log('Handling Google chat message result');
    if (result == false)
      return {
        success: true,
        resultValue: result,
        error: '',
        resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE,
      };

    const analyticParams =
      configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS];
    const gChatParams =
      configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_GCHAT_PARAMETERS];

    const spaceName = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_SPACE];
    let message: string = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_MESSAGE];
    const analyticDescription =
      analyticParams[CONSTANTS.ATTRIBUTE_ANALYTIC_DESCRIPTION];
    const variables = message.match(/[^{}]+(?=\})/g);
    if (variables) {
      for (const variable of variables) {
        const value =
          await this.analyticInputManagerService.getFormattedInputDataByIndex(
            analyticId,
            followedEntityNode,
            variable
          );
        message = message.replace(`{${variable}}`, '' + value);
      }
    }
    const resultInfo: IGChatMessageResult = {
      success: true,
      resultValue: result,
      error: '',
      spaceName: spaceName,
      message:
        'The following message has been triggered by an analytic.\n ' +
        '\nAnalysis on item : ' +
        followedEntityNode.name.get() +
        '\nDescription : ' +
        analyticDescription +
        '\nMessage : ' +
        message,
      resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE,
    };
    return resultInfo;
  }

  public async handleGChatOrganCardResult(
    result: any,
    analyticId: string,
    configAttributes: any,
    followedEntityNode: SpinalNodeRef
  ): Promise<IResult> {
    console.log('Handling Google chat organ message result');
    if (result == false)
      return {
        success: true,
        resultValue: result,
        error: '',
        resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE,
      };

    const gChatParams =
      configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_GCHAT_PARAMETERS];

    const spaceName = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_SPACE];
    let message: string = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_MESSAGE];



    const variables = message.match(/[^{}]+(?=\})/g);
    if (variables) {
      for (const variable of variables) {
        const value =
          await this.analyticInputManagerService.getFormattedInputDataByIndex(
            analyticId,
            followedEntityNode,
            variable
          );
        message = message.replace(`{${variable}}`, '' + value);
      }
    }


    const lastPing = await this.analyticInputManagerService.findEndpoint(
      followedEntityNode.id.get(),
      'last_ping',
      0,
      true,
      [],
      CONSTANTS.ENDPOINT_RELATIONS,
      CONSTANTS.ENDPOINT_NODE_TYPE
    ); 
    if (!lastPing)
      return {
        success: false,
        error: 'endpoint lastPing not found on organ node',
      };

      const organ_attributes = await this.analyticNodeManagerService.getAllCategoriesAndAttributesFromNode(followedEntityNode.id.get)
      const ipAddress = organ_attributes['info']['ip_adress'] as string || "Couldn't find the ip address";
      


    const lastPingValue =
      await this.analyticInputManagerService.getValueModelFromEntry(lastPing);
    const lastPingDate = new Date(lastPingValue.get()).toString();

    const parents = await SpinalGraphService.getParents(
      followedEntityNode.id.get(),
      'HasOrgan'
    );
    let platformName = "";
    let contact_email = "";
    for (const parent of parents) {
      if (parent.id.get() == followedEntityNode.platformId?.get()) {
        const platform_attributes = await this.analyticNodeManagerService.getAllCategoriesAndAttributesFromNode(parent.id.get);
        platformName = platform_attributes['info']['name'] as string || "Couldn't find the platform name";
        contact_email = platform_attributes['info']['contact_email'] as string || "Couldn't find the contact email";

      }
    }


    const resultInfo: IGChatMessageResult = {
      success: true,
      resultValue: result,
      error: '',
      spaceName: spaceName,
      message:
        'The following message has been triggered by an analytic.\n ' +
        '\nMessage : ' +
        message + '\n'+
        '\n Platform name : ' + platformName +
        '\n Organ name : ' + followedEntityNode.name.get() +
        '\n Organ type : ' + followedEntityNode.organType?.get() +
        '\n Contact email : ' + contact_email +
        '\n Ip Address : ' + ipAddress  +  
        '\n Last ping date : ' + lastPingDate 
        ,

      resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE,
    };
    return resultInfo;

  }

  /*public async handleGChatOrganCardResult(
    result: any,
    analyticId: string,
    configAttributes: any,
    followedEntityNode: SpinalNodeRef
  ): Promise<IResult> {
    console.log('Handling Google chat organ card result');

    if (result == false)
      return {
        success: true,
        resultValue: result,
        error: '',
        resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE,
      };

    const analyticParams =
      configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS];
    const resultParams =
      configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_RESULT_PARAMETERS];
    const gChatParams =
      configAttributes[CONSTANTS.CATEGORY_ATTRIBUTE_GCHAT_PARAMETERS];

    const title = resultParams[CONSTANTS.ATTRIBUTE_RESULT_NAME];
    const spaceName: string = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_SPACE];
    let message: string = gChatParams[CONSTANTS.ATTRIBUTE_GCHAT_MESSAGE];
    const variables = message.match(/[^{}]+(?=\})/g);
    if (variables) {
      for (const variable of variables) {
        const value =
          await this.analyticInputManagerService.getFormattedInputDataByIndex(
            analyticId,
            followedEntityNode,
            variable
          );
        message = message.replace(`{${variable}}`, '' + value);
      }
    }
    const analyticDescription: string =
      analyticParams[CONSTANTS.ATTRIBUTE_ANALYTIC_DESCRIPTION];

    const lastPing = await this.analyticInputManagerService.findEndpoint(
      followedEntityNode.id.get(),
      'last_ping',
      0,
      true,
      [],
      CONSTANTS.ENDPOINT_RELATIONS,
      CONSTANTS.ENDPOINT_NODE_TYPE
    );
    if (!lastPing)
      return {
        success: false,
        error: 'endpoint lastPing not found on organ node',
      };
    const lastPingValue =
      await this.analyticInputManagerService.getValueModelFromEntry(lastPing);
    const lastPingDate = new Date(lastPingValue.get()).toString();
    const parents = await SpinalGraphService.getParents(
      followedEntityNode.id.get(),
      'HasOrgan'
    );
    let platformName = "Couldn't find the platform name";
    let ipAddress = "Couldn't find the ip adress";
    for (const parent of parents) {
      if (parent.id.get() == followedEntityNode.platformId?.get()) {
        platformName = parent.name?.get();
        ipAddress = parent.ipAdress?.get();
      }
    }
    const card: IGChatCard = {
      header: {
        title: title,
        subtitle: new Date().toLocaleDateString(),
      },
      sections: [
        {
          header: 'Analytic details',
          widgets: [
            {
              keyValue: {
                topLabel: 'Analytic description',
                content: analyticDescription,
              },
            },
            {
              keyValue: {
                topLabel: 'Message',
                content: message,
              },
            },
          ],
        },
        {
          header: 'Organ details',
          widgets: [
            {
              keyValue: {
                topLabel: 'Organ name',
                content: followedEntityNode.name.get(),
              },
            },
            {
              keyValue: {
                topLabel: 'Organ type',
                content: followedEntityNode.organType?.get(),
              },
            },
            {
              keyValue: {
                topLabel: 'Last ping',
                content: lastPingDate,
              },
            },
          ],
        },
        {
          header: 'Platform details',
          widgets: [
            { 
              keyValue: {
                topLabel: 'Platform name',
                content: platformName,
              },
            },
            {
              keyValue: {
                topLabel: 'Platform id',
                content: followedEntityNode.platformId?.get(),
              },
            },
            {
              keyValue: {
                topLabel: 'Ip Address',
                content: ipAddress,
              },
            },
          ],
        },
      ],
    };
    const resultInfo: IGChatOrganCardResult = {
      success: true,
      resultValue: result,
      error: '',
      spaceName: spaceName,
      resultType: CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_ORGAN_CARD,
      card: card,
    };
    return resultInfo;
  }*/

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
    result: number | string | boolean,
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
        await this.handleTicketResult(
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
        await this.handleControlEndpointResult(
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
        await this.handleEndpointResult(
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
        return await this.handleTicketResult(
          result,
          analyticId,
          configAttributes,
          followedEntityNode,
          'Alarm'
        );

      case CONSTANTS.ANALYTIC_RESULT_TYPE.SMS:
        return await this.handleSMSResult(
          result,
          analyticId,
          configAttributes,
          followedEntityNode
        );

      case CONSTANTS.ANALYTIC_RESULT_TYPE.LOG:
        console.log(
          `LOG | ${followedEntityNode.name.get()}: ${
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
        return this.handleGChatMessageResult(
          result,
          analyticId,
          configAttributes,
          followedEntityNode
        );

      case CONSTANTS.ANALYTIC_RESULT_TYPE.GCHAT_ORGAN_CARD:
        return this.handleGChatOrganCardResult(
          result,
          analyticId,
          configAttributes,
          followedEntityNode
        );

      default:
        return { success: false, error: 'Result type not recognized' };
    }
  }

  
  // #region Private methods


  /**
   * Gets the ticket context that has the corresponding contextId
   *
   * @param {string} contextId
   * @return {*}
   */
  private getTicketContext(contextId: string) {
    const contexts = SpinalGraphService.getContextWithType(
      'SpinalSystemServiceTicket'
    );
    const context = contexts.find((ctx) => {
      return ctx.info.id.get() == contextId;
    });
    return context;
  }

  /**
   * Gets the ticket process that has the corresponding processId in the context that has the corresponding contextId
   *
   * @param {string} contextId
   * @param {string} processId
   * @return {*}
   */
  private async getTicketProcess(contextId: string, processId: string) {
    const processes = await SpinalGraphService.getChildrenInContext(
      contextId,
      contextId
    );
    const process = processes.find((process) => {
      return process.id.get() == processId;
    });
    return process;
  }

  /**
   * Checks if an alarm is already declared in the context and process.
   *
   * @param {string} nodeId
   * @param {string} contextId
   * @param {string} processId
   * @param {string} ticketName
   * @return {*}
   */
  private async alarmAlreadyDeclared(
    nodeId: string,
    contextId: string,
    processId: string,
    ticketName: string
  ) {
    //SpinalNode
    const tickets = await spinalServiceTicket.getAlarmsFromNode(nodeId);
    const found = tickets.find((ticket) => {
      return (
        contextId == ticket.contextId &&
        processId == ticket.processId &&
        ticket.name == ticketName
      );
    });

    return found;
  }

  private async addTicketAlarm(
    ticketInfos: any,
    configAttributes: any,
    analyticContextId: string,
    outputNodeId: string,
    entityNodeId: string,
    ticketType: string
  ) {
    const localizationInfo =
      configAttributes[
        CONSTANTS.CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS
      ];
    const contextId: string =
      localizationInfo[CONSTANTS.ATTRIBUTE_TICKET_CONTEXT_ID];
    const processId: string =
      localizationInfo[CONSTANTS.ATTRIBUTE_TICKET_PROCESS_ID];
    const context = this.getTicketContext(contextId);
    const process = await this.getTicketProcess(
      context.info.id.get(),
      processId
    );

    const alreadyDeclared = await this.alarmAlreadyDeclared(
      entityNodeId,
      contextId,
      processId,
      ticketInfos.name
    );

    if (alreadyDeclared) {
      //just update the ticket
      const firstStep = await serviceTicketPersonalized.getFirstStep(
        processId,
        contextId
      );
      console.log('update ticket ' + ticketInfos.name);
      const declaredTicketNode = SpinalGraphService.getRealNode(
        alreadyDeclared.id
      );
      if (declaredTicketNode.info.stepId.get() == firstStep) {
        const attr = await attributeService.findOneAttributeInCategory(
          declaredTicketNode,
          'default',
          'Occurrence number'
        );
        if (attr != -1) {
          // found the attribute
          const value = attr.value.get();
          const str = value.toString();
          const newValueInt = parseInt(str) + 1;
          await attributeService.updateAttribute(
            declaredTicketNode,
            'default',
            'Occurrence number',
            { value: newValueInt.toString() }
          );
          await this.updateEndpointOccurenceNumber(
            declaredTicketNode,
            newValueInt
          );
        }
      } else {
        // move the ticket to the first step and reset the occurrence number
        await serviceTicketPersonalized.moveTicket(
          declaredTicketNode.info.id.get(),
          declaredTicketNode.info.stepId.get(),
          firstStep,
          contextId
        );
        await attributeService.updateAttribute(
          declaredTicketNode,
          'default',
          'Occurrence number',
          { value: '1' }
        );
        await this.updateEndpointOccurenceNumber(declaredTicketNode, 1);
        console.log(
          `${ticketInfos.name} has been re-triggered and moved back to the first step`
        );
      }
    } else {
      console.log('create ticket ' + ticketInfos.name);
      if (process) {
        try {
          const ticketId = await spinalServiceTicket.addTicket(
            ticketInfos,
            process.id.get(),
            context.info.id.get(),
            entityNodeId,
            ticketType
          );
          if (ticketId instanceof Error) return;
          if (ticketType == 'Alarm') {
            SpinalGraphService.addChildInContext(
              outputNodeId,
              ticketId,
              analyticContextId,
              ALARM_RELATION_NAME,
              TICKET_RELATION_TYPE
            );
          } else {
            SpinalGraphService.addChildInContext(
              outputNodeId,
              ticketId,
              analyticContextId,
              TICKET_RELATION_NAME,
              TICKET_RELATION_TYPE
            );
          }

          if (typeof ticketId === 'string') {
            const declaredTicketNode = SpinalGraphService.getRealNode(ticketId);
            await attributeService.updateAttribute(
              declaredTicketNode,
              'default',
              'Occurrence number',
              { value: '1' }
            );
            const endpoint = new InputDataEndpoint(
              'Occurence number',
              1,
              '',
              InputDataEndpointDataType.Integer,
              InputDataEndpointType.Alarm
            );

            const res = new SpinalBmsEndpoint(
              endpoint.name,
              endpoint.path,
              endpoint.currentValue,
              endpoint.unit,
              InputDataEndpointDataType[endpoint.dataType],
              InputDataEndpointType[endpoint.type],
              endpoint.id
            );

            const childId = SpinalGraphService.createNode(
              { type: SpinalBmsEndpoint.nodeTypeName, name: endpoint.name },
              res
            );
            SpinalGraphService.addChild(
              ticketId,
              childId,
              SpinalBmsEndpoint.relationName,
              SPINAL_RELATION_PTR_LST_TYPE
            );
            await this.spinalServiceTimeseries.getOrCreateTimeSeries(childId);
            await this.spinalServiceTimeseries.pushFromEndpoint(childId, 1);
          }
        } catch (error) {
          console.log('Ticket creation failed');
        }
      }
    }
  }

  private async updateEndpointOccurenceNumber(
    ticketNode: SpinalNode<any>,
    newValue: number
  ) {
    const endpoints = await ticketNode.getChildren('hasBmsEndpoint');
    endpoints.map(async (endpoint) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      SpinalGraphService._addNode(endpoint);
      if (endpoint.info.name.get() == 'Occurence number') {
        this.spinalServiceTimeseries.pushFromEndpoint(
          endpoint.info.id.get(),
          newValue
        );

        const element = await endpoint.element?.load();
        element.currentValue.set(newValue);
      }
    });
  }

  private async createEndpoint(
    referenceEpochTime: number,
    parentId: string,
    endpointName: string,
    initialValue: number,
    unit: string,
    maxDays: string
  ): Promise<SpinalNodeRef> {
    const endpoint = new InputDataEndpoint(
      endpointName,
      initialValue,
      unit ?? '',
      InputDataEndpointDataType.Integer,
      InputDataEndpointType.Other
    );

    const res = new SpinalBmsEndpoint(
      endpoint.name,
      endpoint.path,
      endpoint.currentValue,
      endpoint.unit,
      InputDataEndpointDataType[endpoint.dataType],
      InputDataEndpointType[endpoint.type],
      endpoint.id
    );

    const childId = SpinalGraphService.createNode(
      { type: SpinalBmsEndpoint.nodeTypeName, name: endpoint.name },
      res
    );
    SpinalGraphService.addChild(
      parentId,
      childId,
      SpinalBmsEndpoint.relationName,
      SPINAL_RELATION_PTR_LST_TYPE
    );
    await this.spinalServiceTimeseries.getOrCreateTimeSeries(childId);
    await this.spinalServiceTimeseries.insertFromEndpoint(
      childId,
      initialValue,
      referenceEpochTime
    );
    const realNode = SpinalGraphService.getRealNode(childId);
    await attributeService.updateAttribute(
      realNode,
      'default',
      'timeSeries maxDay',
      { value: maxDays }
    );
    return SpinalGraphService.getInfo(childId);
  }
}
