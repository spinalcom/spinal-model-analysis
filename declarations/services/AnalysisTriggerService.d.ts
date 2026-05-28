import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { TRIGGER_TYPE } from '../constants/analysisTrigger';
import { ITriggerConfigJSON } from '../interfaces/IAnalysisConfigJSON';
import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import { AlgorithmRegistry } from '../algorithms/definitions/core';
/**
 * Represents a resolved trigger configuration ready for use by the orchestrator program.
 */
export interface IResolvedTrigger {
    type: TRIGGER_TYPE;
    /** For INTERVAL_TIME: ms value. For CRON: cron expression. For COV: undefined. */
    value?: string | number;
}
/**
 * Result of resolving COV bindings for an analysis.
 * Contains the resolved input register values (spinal models) that should be bound on.
 */
export interface ICOVBindingResult {
    /** The work node this binding set belongs to */
    workNode: SpinalNode<any>;
    /** Map of register name → resolved model value (to .bind() on) */
    inputRegisters: Map<string, unknown>;
}
/**
 * Service responsible for managing trigger configurations on analysis nodes.
 *
 * Trigger configs are stored as a JSON attribute on the analysis trigger node.
 * The orchestrator program uses this service to:
 * 1. Load trigger configurations for an analysis
 * 2. For COV triggers, resolve the input register models to bind on
 */
export default class AnalysisTriggerService {
    private readonly nodeManager;
    private readonly blockManager;
    private readonly executor;
    constructor(nodeManager: AnalyticNodeManagerService, registry: AlgorithmRegistry);
    /**
     * Stores trigger configurations on the analysis trigger node.
     * @param analysisNode - The analysis node
     * @param triggers - Array of trigger configurations
     */
    setTriggerConfig(analysisNode: SpinalNode<any>, triggers: ITriggerConfigJSON[]): Promise<void>;
    /**
     * Loads trigger configurations from the analysis trigger node.
     * @param analysisNode - The analysis node
     * @returns Array of resolved trigger configs
     */
    getTriggerConfig(analysisNode: SpinalNode<any>): Promise<IResolvedTrigger[]>;
    /**
     * Checks whether an analysis has a specific trigger type configured.
     */
    hasTriggerType(analysisNode: SpinalNode<any>, type: TRIGGER_TYPE): Promise<boolean>;
    /**
     * Resolves the input register models for COV binding.
     *
     * This runs the full pipeline up to (and including) the input workflow
     * for each work node, then returns the populated input registers.
     * The orchestrator can then .bind() on the returned model values.
     *
     * @param analysisNode - The analysis node
     * @returns Array of COV binding results (one per work node)
     */
    resolveInputRegistersForBinding(analysisNode: SpinalNode<any>): Promise<ICOVBindingResult[]>;
    private resolveWorkNodes;
    private executeInputWorkflow;
    private findLeafBlock;
}
