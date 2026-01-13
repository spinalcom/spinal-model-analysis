export interface IAnalyticConfig {
    [categoryName: string]: {
        [attributeName: string]: string | boolean;
    };
}
