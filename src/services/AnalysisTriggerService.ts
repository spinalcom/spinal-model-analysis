/* eslint-disable @typescript-eslint/no-explicit-any */
import { SpinalNode } from 'spinal-env-viewer-graph-service';
import {
    attributeService,
} from 'spinal-env-viewer-plugin-documentation-service';
import { TRIGGER_TYPE } from '../constants/analysisTrigger';
import { ITriggerConfigJSON } from '../interfaces/IAnalysisConfigJSON';
import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import WorkflowBlockManagerService from './WorkflowBlockManagerService';
import WorkflowExecutionService, { WorkflowExecutionContext } from './WorkflowExecutionService';
import {
    AlgorithmRegistry,
    ExecutionMetadata,
} from '../algorithms/definitions/core';
import { ANCHOR_NODE_TO_LINKED_NODE_RELATION } from '../constants/analysisAnchor';

const TRIGGER_CATEGORY = 'triggerConfig';
const TRIGGER_ATTR_CONFIGS = 'triggers';

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
     * Resolves the input register models for COV binding.
     *
     * This runs the full pipeline up to (and including) the input workflow
     * for each work node, then returns the populated input registers.
     * The orchestrator can then .bind() on the returned model values.
     *
     * @param analysisNode - The analysis node
     * @returns Array of COV binding results (one per work node)
     */
    public async resolveInputRegistersForBinding(
        analysisNode: SpinalNode<any>
    ): Promise<ICOVBindingResult[]> {
        const triggers = await this.getTriggerConfig(analysisNode);
        const covTriggers = triggers.filter((t) => t.type === TRIGGER_TYPE.COV);
        if (covTriggers.length === 0) {
            return [];
        }

        // Step 1: Resolve anchor target
        const anchorNode = await this.nodeManager.getAnalysisAnchorNodeNode(analysisNode);
        const targets = await anchorNode.getChildren(ANCHOR_NODE_TO_LINKED_NODE_RELATION);
        if (targets.length === 0) {
            throw new Error(`Analysis "${analysisNode.getName().get()}" anchor has no linked target node`);
        }
        const targetNode = targets[0];

        // Step 2: Resolve work nodes
        const workNodes = await this.resolveWorkNodes(analysisNode, targetNode);

        // Step 3: For each work node, run input workflow to get register models
        const results: ICOVBindingResult[] = [];
        for (const workNode of workNodes) {
            const inputRegisters = await this.executeInputWorkflow(analysisNode, workNode);
            for (const trigger of covTriggers) {
                if (!trigger.inputRegister) {
                    throw new Error(
                        `COV trigger${trigger.id ? ` "${trigger.id}"` : ''} is missing inputRegister`
                    );
                }
                if (!inputRegisters.has(trigger.inputRegister)) {
                    throw new Error(
                        `COV trigger${trigger.id ? ` "${trigger.id}"` : ''} references unknown input register ` +
                        `"${trigger.inputRegister}". Available: [${[...inputRegisters.keys()].join(', ')}]`
                    );
                }

                results.push({
                    workNode,
                    triggerId: trigger.id,
                    inputRegister: trigger.inputRegister,
                    threshold: trigger.threshold,
                    model: inputRegisters.get(trigger.inputRegister),
                });
            }
        }

        return results;
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
            execution: this.getDefaultExecutionMetadata(),
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
            for (const depId of block.inputBlockIds) {
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
