/* eslint-disable @typescript-eslint/no-explicit-any */
import { SpinalNode } from 'spinal-env-viewer-graph-service';
import {
    attributeService,
} from 'spinal-env-viewer-plugin-documentation-service';
import { TRIGGER_TYPE, TRIGGER_CATEGORY, TRIGGER_ATTR_CONFIGS } from '../constants/analysisTrigger';
import { ITriggerConfigJSON } from '../interfaces/IAnalysisConfigJSON';
import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import WorkflowBlockManagerService from './WorkflowBlockManagerService';
import WorkflowExecutionService, { WorkflowExecutionContext } from './WorkflowExecutionService';
import {
    AlgorithmRegistry,
    ExecutionMetadata,
} from '../algorithms/definitions/core';
import { ANCHOR_NODE_TO_LINKED_NODE_RELATION } from '../constants/analysisAnchor';

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
    private readonly nodeManager: AnalyticNodeManagerService;
    private readonly blockManager: WorkflowBlockManagerService;
    private readonly executor: WorkflowExecutionService;

    constructor(
        nodeManager: AnalyticNodeManagerService,
        registry: AlgorithmRegistry
    ) {
        this.nodeManager = nodeManager;
        this.blockManager = new WorkflowBlockManagerService();
        this.executor = new WorkflowExecutionService(registry);
    }

    // ─────────────────────────────────────────────────────
    //  TRIGGER CONFIGURATION STORAGE
    // ─────────────────────────────────────────────────────

    /**
     * Stores trigger configurations on the analysis trigger node.
     * @param analysisNode - The analysis node
     * @param triggers - Array of trigger configurations
     */
    public async setTriggerConfig(
        analysisNode: SpinalNode<any>,
        triggers: ITriggerConfigJSON[]
    ): Promise<void> {
        const triggerNode = await this.nodeManager.getAnalysisTriggerNode(analysisNode);
        await attributeService.createOrUpdateAttrsAndCategories(
            triggerNode,
            TRIGGER_CATEGORY,
            { [TRIGGER_ATTR_CONFIGS]: JSON.stringify(triggers) }
        );
    }

    /**
     * Loads trigger configurations from the analysis trigger node.
     * @param analysisNode - The analysis node
     * @returns Array of resolved trigger configs
     */
    public async getTriggerConfig(
        analysisNode: SpinalNode<any>
    ): Promise<IResolvedTrigger[]> {
        const triggerNode = await this.nodeManager.getAnalysisTriggerNode(analysisNode);
        const attrs = await attributeService.getAttributesByCategory(triggerNode, TRIGGER_CATEGORY);
        const configAttr = attrs.find((a: any) => a.label?.get() === TRIGGER_ATTR_CONFIGS);

        if (!configAttr) return [];

        const raw = configAttr.value?.get();
        if (typeof raw !== 'string') return [];

        const parsed: ITriggerConfigJSON[] = JSON.parse(raw);
        return parsed.map((t) => this.normalizeTriggerConfig(t));
    }

    /**
     * Checks whether an analysis has a specific trigger type configured.
     */
    public async hasTriggerType(
        analysisNode: SpinalNode<any>,
        type: TRIGGER_TYPE
    ): Promise<boolean> {
        const triggers = await this.getTriggerConfig(analysisNode);
        return triggers.some((t) => t.type === type);
    }

    // ─────────────────────────────────────────────────────
    //  COV BINDING RESOLUTION
    // ─────────────────────────────────────────────────────

    /**
     * Resolves the input register models for COV binding, for every current work node, and
     * logs the work nodes it had to skip. Kept for callers that bind once; an organ that keeps
     * its binds in sync with new work nodes uses resolveCOVWorkNodes + resolveCOVBindings.
     *
     * @param analysisNode - The analysis node
     * @returns Array of COV binding results (one per work node and COV trigger)
     */
    public async resolveInputRegistersForBinding(
        analysisNode: SpinalNode<any>
    ): Promise<ICOVBindingResult[]> {
        const { bindings, skipped } = await this.resolveCOVBindings(analysisNode);
        for (const skip of skipped) {
            console.warn(`[AnalysisTrigger] Skipping work node "${skip.workNode.getName().get()}" for COV binding — ${skip.reason}`);
        }
        return bindings;
    }

    /**
     * The analysis's CURRENT work nodes: its anchor target run through the worknode resolver.
     * Cheap compared to resolveCOVBindings (no input workflow), so an organ can call it on every
     * sync to notice work nodes that appeared or disappeared since it bound them — e.g. tickets
     * created after the organ started.
     */
    public async resolveCOVWorkNodes(analysisNode: SpinalNode<any>): Promise<SpinalNode<any>[]> {
        const anchorNode = await this.nodeManager.getAnalysisAnchorNodeNode(analysisNode);
        const targets = await anchorNode.getChildren(ANCHOR_NODE_TO_LINKED_NODE_RELATION);
        if (targets.length === 0) {
            throw new Error(`Analysis "${analysisNode.getName().get()}" anchor has no linked target node`);
        }
        return this.resolveWorkNodes(analysisNode, targets[0]);
    }

    /**
     * Runs the input workflow on work nodes to get the models their COV triggers bind on: one
     * binding per (work node, COV trigger). A work node whose input workflow fails, or that does
     * not produce a trigger's register, is reported in `skipped` (not thrown) — the others still
     * bind. Nothing is logged: the caller decides how to report skips.
     *
     * @param workNodes - Only these work nodes (e.g. the new ones since the last pass); default:
     *                    all current work nodes (resolveCOVWorkNodes).
     */
    public async resolveCOVBindings(
        analysisNode: SpinalNode<any>,
        workNodes?: SpinalNode<any>[]
    ): Promise<ICOVBindingResolution> {
        const triggers = await this.getTriggerConfig(analysisNode);
        const covTriggers = triggers.filter((t) => t.type === TRIGGER_TYPE.COV);
        if (covTriggers.length === 0) return { bindings: [], skipped: [] };

        // A missing inputRegister is a config error, not work-node specific: fail loudly.
        for (const trigger of covTriggers) {
            if (!trigger.inputRegister) {
                throw new Error(
                    `COV trigger${trigger.id ? ` "${trigger.id}"` : ''} is missing inputRegister`
                );
            }
        }

        const nodes = workNodes ?? (await this.resolveCOVWorkNodes(analysisNode));
        const bindings: ICOVBindingResult[] = [];
        const skipped: ICOVBindingSkip[] = [];
        for (const workNode of nodes) {
            let inputRegisters: Map<string, unknown>;
            try {
                inputRegisters = await this.executeInputWorkflow(analysisNode, workNode);
            } catch (error: any) {
                const message = error instanceof Error ? error.message : String(error);
                skipped.push({ workNode, reason: `input workflow failed: ${message}` });
                continue;
            }

            for (const trigger of covTriggers) {
                const register = trigger.inputRegister!;
                if (!inputRegisters.has(register)) {
                    skipped.push({
                        workNode,
                        triggerId: trigger.id,
                        inputRegister: register,
                        reason:
                            `input register "${register}" was not produced` +
                            `${trigger.id ? ` (trigger "${trigger.id}")` : ''}. ` +
                            `Available: [${[...inputRegisters.keys()].join(', ')}]`,
                    });
                    continue;
                }
                bindings.push({
                    workNode,
                    triggerId: trigger.id,
                    inputRegister: register,
                    threshold: trigger.threshold,
                    model: inputRegisters.get(register),
                });
            }
        }
        return { bindings, skipped };
    }

    // ─────────────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ─────────────────────────────────────────────────────

    private async resolveWorkNodes(
        analysisNode: SpinalNode<any>,
        targetNode: SpinalNode<any>
    ): Promise<SpinalNode<any>[]> {
        const resolverNode = await this.nodeManager.getAnalysisWorknodeResolverNode(analysisNode);
        const dag = await this.blockManager.loadWorkflowDAG(resolverNode);

        if (dag.blocks.length === 0) {
            return [targetNode];
        }

        const context: WorkflowExecutionContext = {
            workNode: targetNode,
            inputRegisters: new Map(),
            blockOutputs: new Map(),
            // The resolver decides WHAT gets bound — fail fast, like AnalysisExecutionService. Under
            // 'continue' a failing resolver left no output, and the fallback below bound the anchor
            // target instead of the real work nodes.
            execution: { ...this.getDefaultExecutionMetadata(), errorPolicy: 'stop' },
        };

        await this.executor.executeDAG(dag, context);

        // Find leaf block output
        const leafBlock = this.findLeafBlock(dag.blocks);
        const result = context.blockOutputs.get(leafBlock.id);

        if (Array.isArray(result)) return result as SpinalNode<any>[];
        if (result && typeof result === 'object') return [result as SpinalNode<any>];
        return [targetNode];
    }

    private async executeInputWorkflow(
        analysisNode: SpinalNode<any>,
        workNode: SpinalNode<any>
    ): Promise<Map<string, unknown>> {
        const inputNode = await this.nodeManager.getAnalysisInputNode(analysisNode);
        const dag = await this.blockManager.loadWorkflowDAG(inputNode);

        if (dag.blocks.length === 0) {
            return new Map();
        }

        const context: WorkflowExecutionContext = {
            workNode,
            inputRegisters: new Map(),
            blockOutputs: new Map(),
            execution: this.getDefaultExecutionMetadata(),
        };

        await this.executor.executeDAG(dag, context);
        return context.inputRegisters;
    }

    private findLeafBlock(blocks: any[]): any {
        const dependedOnIds = new Set<string>();
        for (const block of blocks) {
            for (const depId of [...block.inputBlockIds, ...(block.orderBlockIds ?? [])]) {
                dependedOnIds.add(depId);
            }
        }
        const leaves = blocks.filter((b) => !dependedOnIds.has(b.id));
        if (leaves.length === 0) throw new Error('No leaf block found in workflow DAG');
        return leaves[leaves.length - 1];
    }

    private normalizeTriggerConfig(trigger: ITriggerConfigJSON): IResolvedTrigger {
        if (trigger.type === TRIGGER_TYPE.INTERVAL_TIME) {
            const interval =
                typeof trigger.intervalTimeMs === 'number'
                    ? trigger.intervalTimeMs
                    : typeof (trigger as any).value === 'number'
                        ? (trigger as any).value
                        : undefined;
            return {
                id: trigger.id,
                type: TRIGGER_TYPE.INTERVAL_TIME,
                intervalTimeMs: interval,
            };
        }

        if (trigger.type === TRIGGER_TYPE.CRON) {
            const cron =
                typeof trigger.cronExpression === 'string'
                    ? trigger.cronExpression
                    : typeof (trigger as any).value === 'string'
                        ? (trigger as any).value
                        : undefined;
            return {
                id: trigger.id,
                type: TRIGGER_TYPE.CRON,
                cronExpression: cron,
            };
        }

        return {
            id: trigger.id,
            type: TRIGGER_TYPE.COV,
            inputRegister: trigger.inputRegister,
            threshold: trigger.threshold,
        };
    }

    private getDefaultExecutionMetadata(): ExecutionMetadata {
        return {
            referenceTime: Date.now(),
        };
    }
}
