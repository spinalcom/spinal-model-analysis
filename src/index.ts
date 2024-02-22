import { IAnalytic } from './interfaces/IAnalytic';
import { IEntity } from './interfaces/IEntity';
import { ITrackingMethod } from './interfaces/ITrackingMethod';
import { IConfig } from './interfaces/IConfig';
import { AnalyticModel } from './models/AnalyticModel';
import { TrackingMethodModel } from './models/TrackingMethodModel';
import {
  isResultSuccess,
  isGChatMessageResult,
  isGChatOrganCardResult,
  IResult,
} from './interfaces/IAnalyticResult';
import {
  ANALYTIC_RESULT_TYPE,
  ANALYTIC_TYPE,
  TRACK_METHOD,
  ENTITY_TYPES,
  CONTEXT_TYPE,
  ENTITY_TYPE,
  TRIGGER_TYPE,
  CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS,
  CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS,
  CATEGORY_ATTRIBUTE_RESULT_PARAMETERS,
  CATEGORY_ATTRIBUTE_TRACKING_METHOD_PARAMETERS,
  CATEGORY_ATTRIBUTE_TWILIO_PARAMETERS,
  CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS,
  CATEGORY_ATTRIBUTE_IO_DEPENDENCIES,
  CATEGORY_ATTRIBUTE_TRIGGER_PARAMETERS,
  CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING,
  CATEGORY_ATTRIBUTE_GCHAT_PARAMETERS,
  ATTRIBUTE_GCHAT_SPACE,
  ATTRIBUTE_GCHAT_MESSAGE,
  ATTRIBUTE_PHONE_NUMBER,
  ATTRIBUTE_PHONE_MESSAGE,
  ATTRIBUTE_TRACKING_METHOD,
  ATTRIBUTE_FILTER_VALUE,
  ATTRIBUTE_TIMESERIES,
  ATTRIBUTE_SEARCH_DEPTH,
  ATTRIBUTE_STRICT_DEPTH,
  ATTRIBUTE_SEARCH_RELATIONS,
  ATTRIBUTE_SEPARATOR,
  ATTRIBUTE_VALUE_SEPARATOR,
  ATTRIBUTE_RESULT_NAME,
  ATTRIBUTE_RESULT_TYPE,
  ATTRIBUTE_ANALYTIC_STATUS,
  ATTRIBUTE_ANALYTIC_DESCRIPTION,
  ATTRIBUTE_TRIGGER_AT_START,
  ATTRIBUTE_TICKET_CONTEXT_ID,
  ATTRIBUTE_TICKET_PROCESS_ID,
  ATTRIBUTE_ALARM_PRIORITY,
  ANALYTIC_STATUS,
} from './constants';

import * as algos from './algorithms/algorithms';
import { ALGORITHMS } from './algorithms/algorithms';
import { AnalyticService } from './services/AnalyticService';
import {
  getValueModelFromEntry,
  getChoiceRelationsWithDepth,
  getAvailableData,
} from './services/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalRoot: any = typeof window === 'undefined' ? global : window;

const spinalAnalyticService = new AnalyticService();

if (typeof globalRoot.spinal === 'undefined') globalRoot.spinal = {};

if (typeof globalRoot.spinal.spinalAnalyticService === 'undefined') {
  globalRoot.spinal.spinalAnalyticService = spinalAnalyticService;
}

if (typeof globalRoot.spinal.spinalAnalyticService === 'undefined') {
  globalRoot.spinal.spinalAnalyticService = spinalAnalyticService;
}

export {
  AnalyticService,
  spinalAnalyticService,
  IAnalytic,
  ITrackingMethod,
  IEntity,
  IConfig,
  IResult,
  AnalyticModel,
  TrackingMethodModel,
  ENTITY_TYPES,
  ANALYTIC_RESULT_TYPE,
  ANALYTIC_TYPE,
  TRACK_METHOD,
  TRIGGER_TYPE,
  CONTEXT_TYPE,
  ENTITY_TYPE,
  CATEGORY_ATTRIBUTE_TICKET_LOCALIZATION_PARAMETERS,
  CATEGORY_ATTRIBUTE_ALGORTHM_PARAMETERS,
  CATEGORY_ATTRIBUTE_RESULT_PARAMETERS,
  CATEGORY_ATTRIBUTE_TRACKING_METHOD_PARAMETERS,
  CATEGORY_ATTRIBUTE_TWILIO_PARAMETERS,
  CATEGORY_ATTRIBUTE_ANALYTIC_PARAMETERS,
  CATEGORY_ATTRIBUTE_IO_DEPENDENCIES,
  CATEGORY_ATTRIBUTE_TRIGGER_PARAMETERS,
  CATEGORY_ATTRIBUTE_ALGORITHM_INDEX_MAPPING,
  CATEGORY_ATTRIBUTE_GCHAT_PARAMETERS,
  ATTRIBUTE_GCHAT_MESSAGE,
  ATTRIBUTE_GCHAT_SPACE,
  ATTRIBUTE_PHONE_NUMBER,
  ATTRIBUTE_PHONE_MESSAGE,
  ATTRIBUTE_TRACKING_METHOD,
  ATTRIBUTE_FILTER_VALUE,
  ATTRIBUTE_TIMESERIES,
  ATTRIBUTE_SEARCH_DEPTH,
  ATTRIBUTE_STRICT_DEPTH,
  ATTRIBUTE_SEARCH_RELATIONS,
  ATTRIBUTE_SEPARATOR,
  ATTRIBUTE_RESULT_NAME,
  ATTRIBUTE_RESULT_TYPE,
  ATTRIBUTE_ANALYTIC_STATUS,
  ATTRIBUTE_ANALYTIC_DESCRIPTION,
  ATTRIBUTE_TRIGGER_AT_START,
  ATTRIBUTE_TICKET_CONTEXT_ID,
  ATTRIBUTE_TICKET_PROCESS_ID,
  ATTRIBUTE_ALARM_PRIORITY,
  ATTRIBUTE_VALUE_SEPARATOR,
  getValueModelFromEntry,
  getChoiceRelationsWithDepth,
  getAvailableData,
  isResultSuccess,
  isGChatMessageResult,
  isGChatOrganCardResult,
  algos,
  ALGORITHMS,
  ANALYTIC_STATUS,
};

export default spinalAnalyticService;
