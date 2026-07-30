import type { AnalysisExecutionResult } from './AnalysisExecutionService';
/**
 * Converts a single block-output value into a JSON-safe form. Recurses into arrays and plain
 * objects (cycle-guarded) so nested nodes/models/handles are handled wherever they appear.
 */
export declare function serializeExecutionValue(value: unknown, seen?: WeakSet<object>): unknown;
/**
 * Serializes a full AnalysisExecutionResult into a JSON-safe object, ready for res.json().
 * Per work node, its inputRegisters and executionOutputs are passed through
 * serializeExecutionValue.
 */
export declare function serializeExecutionResult(result: AnalysisExecutionResult): {
    results: {
        inputRegisters: Record<string, unknown> | undefined;
        executionOutputs: Record<string, unknown> | undefined;
        workNodeId: string;
        workNodeName: string;
        success: boolean;
        error?: string | undefined;
    }[];
    analysisName: string;
    referenceTime: number;
    trigger?: {
        id?: string | undefined;
        type?: string | undefined;
        inputRegister?: string | undefined;
        threshold?: number | undefined;
    } | undefined;
    totalWorkNodes: number;
};
