import { VERSION } from './version';

import AnalyticNodeManagerService from './services/AnalyticNodeManagerService';

const spinalAnalyticNodeManagerService = new AnalyticNodeManagerService();


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
  spinalAnalyticNodeManagerService,
  VERSION
};

export default spinalAnalyticNodeManagerService;
