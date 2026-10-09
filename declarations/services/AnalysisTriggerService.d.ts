import { SpinalNode } from 'spinal-env-viewer-graph-service';
import { TRIGGER_TYPE } from '../constants/analysisTrigger';
import { ITriggerConfigJSON } from '../interfaces/IAnalysisConfigJSON';
import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import { AlgorithmRegistry } from '../algorithms/definitions/core';
/**
 * Represents a resolved trigger configuration ready for use by the orchestrator program.
 */
export interface IResolvedTrigger {
    id?: string;
    type: TRIGGER_TYPE;
    intervalTimeMs?: number;
    cronExpression?: string;
    inputRegister?: string;
    threshold?: number;
}
/**
 * Result of resolving COV bindings for an analysis.
 * Contains the resolved input register values (spinal models) that should be bound on.
 */
export interface ICOVBindingResult {
    /** The work node this binding set belongs to */
    workNode: SpinalNode<any>;
    /** Trigger id if provided in config */
    triggerId?: string;
    /** Register name bound for this COV trigger */
    inputRegister: string;
    /** Optional deadband/threshold from trigger config */
    threshold?: number;
    /** Resolved model value to bind on */
    model: unknown;
}
/** A work node (or one of its COV triggers) that could not be bound, and why. */
export interface ICOVBindingSkip {
    workNode: SpinalNode<any>;
    triggerId?: string;
    /** The register of the trigger that could not be bound; absent when the whole input workflow failed. */
    inputRegister?: string;
    reason: string;
}
/** What resolveCOVBindings found: the models to bind, and the work nodes it had to skip. */
export interface ICOVBindingResolution {
    bindings: ICOVBindingResult[];
    skipped: ICOVBindingSkip[];
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
     * Resolves the input register models for COV binding, for every current work node, and
     * logs the work nodes it had to skip. Kept for callers that bind once; an organ that keeps
     * its binds in sync with new work nodes uses resolveCOVWorkNodes + resolveCOVBindings.
     *
     * @param analysisNode - The analysis node
     * @returns Array of COV binding results (one per work node and COV trigger)
     */
    resolveInputRegistersForBinding(analysisNode: SpinalNode<any>): Promise<ICOVBindingResult[]>;
    /**
     * The analysis's CURRENT work nodes: its anchor target run through the worknode resolver.
     * Cheap compared to resolveCOVBindings (no input workflow), so an organ can call it on every
     * sync to notice work nodes that appeared or disappeared since it bound them — e.g. tickets
     * created after the organ started.
     */
    resolveCOVWorkNodes(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>[]>;
    /**
     * Runs the input workflow on work nodes to get the models their COV triggers bind on: one
     * binding per (work node, COV trigger). A work node whose input workflow fails, or that does
     * not produce a trigger's register, is reported in `skipped` (not thrown) — the others still
     * bind. Nothing is logged: the caller decides how to report skips.
     *
     * @param workNodes - Only these work nodes (e.g. the new ones since the last pass); default:
     *                    all current work nodes (resolveCOVWorkNodes).
     */
    resolveCOVBindings(analysisNode: SpinalNode<any>, workNodes?: SpinalNode<any>[]): Promise<ICOVBindingResolution>;
    private resolveWorkNodes;
    private executeInputWorkflow;
    private findLeafBlock;
    private normalizeTriggerConfig;
    private getDefaultExecutionMetadata;
}
