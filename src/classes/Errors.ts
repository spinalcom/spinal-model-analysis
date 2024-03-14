export class ExitAnalyticError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ExitAlgorithmError";
    }
}