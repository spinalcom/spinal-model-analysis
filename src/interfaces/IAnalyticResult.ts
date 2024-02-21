import { ANALYTIC_RESULT_TYPE } from '../constants';

export function isResultSuccess(result: IResult): result is IResultSuccess {
  return (result.success = true);
}

export function isGChatMessageResult(
  result: IResultSuccess
): result is IGChatMessageResult {
  return result.resultType === ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE;
}

export function isGChatOrganCardResult(
  result: IResultSuccess
): result is IGChatOrganCardResult {
  return result.resultType === ANALYTIC_RESULT_TYPE.GCHAT_ORGAN_CARD;
}

export interface IResultResponse {
  success: boolean;
  error: string;
}

export interface IResultSuccess extends IResultResponse {
  success: true;
  resultValue: number | string | boolean;
  resultType: ANALYTIC_RESULT_TYPE;
}

export interface IGChatMessageResult extends IResultSuccess {
  resultValue: boolean;
  resultType: ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE;
  spaceName: string;
  message: string;
}

export interface IGChatCardResult extends IResultSuccess {
  resultValue: boolean;
  spaceName: string;
  card: IGChatCard;
}

export interface IGChatOrganCardResult extends IGChatCardResult {
  resultType: ANALYTIC_RESULT_TYPE.GCHAT_ORGAN_CARD;
}

export type IResult =
  | IResultResponse
  | IResultSuccess
  | IGChatMessageResult
  | IGChatCardResult;

export interface IGChatCard {
  header: IGChatCardHeader;
  sections: IGChatCardSection[];
}

interface IGChatCardHeader {
  title: string;
  subtitle: string;
}

interface IGChatCardSection {
  header: string;
  widgets: IGChatCardWidget[];
}

interface IGChatCardWidget {
  keyValue: IGChatCardKeyValue;
}

interface IGChatCardKeyValue {
  topLabel: string;
  content: string;
}
