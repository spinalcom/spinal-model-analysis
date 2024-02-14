import { ANALYTIC_RESULT_TYPE } from "../constants";
export declare function isResultSuccess(result: IResult): result is IResultSuccess;
export declare function isGChatMessageResult(result: IResultSuccess): result is IGChatMessageResult;
export declare function isGChatOrganCardResult(result: IResultSuccess): result is IGChatOrganCardResult;
export interface IResultResponse {
    success: boolean;
    error: string;
}
export interface IResultSuccess extends IResultResponse {
    success: true;
    resultType: ANALYTIC_RESULT_TYPE;
}
export interface IGChatMessageResult extends IResultSuccess {
    resultType: ANALYTIC_RESULT_TYPE.GCHAT_MESSAGE;
    spaceName: string;
    message: string;
}
export interface IGChatCardResult extends IResultSuccess {
    spaceName: string;
    card: IGChatCard;
}
export interface IGChatOrganCardResult extends IGChatCardResult {
    resultType: ANALYTIC_RESULT_TYPE.GCHAT_ORGAN_CARD;
}
export type IResult = IResultResponse | IResultSuccess | IGChatMessageResult | IGChatCardResult;
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
export {};