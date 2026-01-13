import { IAnalytic } from './interfaces/IAnalytic';
import { IEntity } from './interfaces/IEntity';
import { ITrackingMethod } from './interfaces/ITrackingMethod';
import { IConfig } from './interfaces/IConfig';
import { AnalyticModel } from './models/AnalyticModel';
import { TrackingMethodModel } from './models/TrackingMethodModel';
import pkg from '../package.json';



import {
  isResultSuccess,
  isGChatMessageResult,
  isGChatOrganCardResult,
  IResult,
} from './interfaces/IAnalyticResult';
import * as CONSTANTS from './constants';

import * as algos from './algorithms/algorithms';
import { ALGORITHMS } from './algorithms/algorithms';

import AnalyticExecutionManagerService from './services/AnalyticExecutionManagerService';
import AnalyticNodeManagerService from './services/AnalyticNodeManagerService';
import AnalyticInputManagerService from './services/AnalyticInputManagerService';
import AnalyticOutputManagerService from './services/AnalyticOutputManagerService';


const VERSION = pkg.version;
const spinalAnalyticNodeManagerService = new AnalyticNodeManagerService();
const spinalAnalyticInputManagerService = new AnalyticInputManagerService(
  spinalAnalyticNodeManagerService
);
const spinalAnalyticOutputManagerService = new AnalyticOutputManagerService(
  spinalAnalyticNodeManagerService,
  spinalAnalyticInputManagerService
);
const spinalAnalyticExecutionService = new AnalyticExecutionManagerService(
  spinalAnalyticNodeManagerService,
  spinalAnalyticInputManagerService,
  spinalAnalyticOutputManagerService
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// const globalRoot: any = typeof window === 'undefined' ? global : window;
// if (typeof globalRoot.spinal === 'undefined') globalRoot.spinal = {};

// if (typeof globalRoot.spinal.spinalAnalyticNodeManagerService === 'undefined') {
//   globalRoot.spinal.spinalAnalyticNodeManagerService = spinalAnalyticNodeManagerService;
// }

// if (typeof globalRoot.spinal.spinalAnalyticService === 'undefined') {
//   globalRoot.spinal.spinalAnalyticService = spinalAnalyticService;
// }

export {
  spinalAnalyticExecutionService,
  spinalAnalyticNodeManagerService,
  spinalAnalyticInputManagerService,
  spinalAnalyticOutputManagerService,
  IAnalytic,
  ITrackingMethod,
  IEntity,
  IConfig,
  IResult,
  AnalyticModel,
  TrackingMethodModel,
  CONSTANTS,
  isResultSuccess,
  isGChatMessageResult,
  isGChatOrganCardResult,
  algos,
  ALGORITHMS,
  VERSION
};

export default spinalAnalyticExecutionService;
