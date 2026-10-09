"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const analysisTrigger_1 = require("../constants/analysisTrigger");
const WorkflowBlockManagerService_1 = require("./WorkflowBlockManagerService");
const WorkflowExecutionService_1 = require("./WorkflowExecutionService");
const analysisAnchor_1 = require("../constants/analysisAnchor");
/**
 * Service responsible for managing trigger configurations on analysis nodes.
 *
 * Trigger configs are stored as a JSON attribute on the analysis trigger node.
 * The orchestrator program uses this service to:
 * 1. Load trigger configurations for an analysis
 * 2. For COV triggers, resolve the input register models to bind on
 */
class AnalysisTriggerService {
    constructor(nodeManager, registry) {
        this.nodeManager = nodeManager;
        this.blockManager = new WorkflowBlockManagerService_1.default();
        this.executor = new WorkflowExecutionService_1.default(registry);
    }
    // ─────────────────────────────────────────────────────
    //  TRIGGER CONFIGURATION STORAGE
    // ─────────────────────────────────────────────────────
    /**
     * Stores trigger configurations on the analysis trigger node.
     * @param analysisNode - The analysis node
     * @param triggers - Array of trigger configurations
     */
    setTriggerConfig(analysisNode, triggers) {
        return __awaiter(this, void 0, void 0, function* () {
            const triggerNode = yield this.nodeManager.getAnalysisTriggerNode(analysisNode);
            yield spinal_env_viewer_plugin_documentation_service_1.attributeService.createOrUpdateAttrsAndCategories(triggerNode, analysisTrigger_1.TRIGGER_CATEGORY, { [analysisTrigger_1.TRIGGER_ATTR_CONFIGS]: JSON.stringify(triggers) });
        });
    }
    /**
     * Loads trigger configurations from the analysis trigger node.
     * @param analysisNode - The analysis node
     * @returns Array of resolved trigger configs
     */
    getTriggerConfig(analysisNode) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const triggerNode = yield this.nodeManager.getAnalysisTriggerNode(analysisNode);
            const attrs = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(triggerNode, analysisTrigger_1.TRIGGER_CATEGORY);
            const configAttr = attrs.find((a) => { var _a; return ((_a = a.label) === null || _a === void 0 ? void 0 : _a.get()) === analysisTrigger_1.TRIGGER_ATTR_CONFIGS; });
            if (!configAttr)
                return [];
            const raw = (_a = configAttr.value) === null || _a === void 0 ? void 0 : _a.get();
            if (typeof raw !== 'string')
                return [];
            const parsed = JSON.parse(raw);
            return parsed.map((t) => this.normalizeTriggerConfig(t));
        });
    }
    /**
     * Checks whether an analysis has a specific trigger type configured.
     */
    hasTriggerType(analysisNode, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const triggers = yield this.getTriggerConfig(analysisNode);
            return triggers.some((t) => t.type === type);
        });
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
    resolveInputRegistersForBinding(analysisNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const { bindings, skipped } = yield this.resolveCOVBindings(analysisNode);
            for (const skip of skipped) {
                console.warn(`[AnalysisTrigger] Skipping work node "${skip.workNode.getName().get()}" for COV binding — ${skip.reason}`);
            }
            return bindings;
        });
    }
    /**
     * The analysis's CURRENT work nodes: its anchor target run through the worknode resolver.
     * Cheap compared to resolveCOVBindings (no input workflow), so an organ can call it on every
     * sync to notice work nodes that appeared or disappeared since it bound them — e.g. tickets
     * created after the organ started.
     */
    resolveCOVWorkNodes(analysisNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const anchorNode = yield this.nodeManager.getAnalysisAnchorNodeNode(analysisNode);
            const targets = yield anchorNode.getChildren(analysisAnchor_1.ANCHOR_NODE_TO_LINKED_NODE_RELATION);
            if (targets.length === 0) {
                throw new Error(`Analysis "${analysisNode.getName().get()}" anchor has no linked target node`);
            }
            return this.resolveWorkNodes(analysisNode, targets[0]);
        });
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
    resolveCOVBindings(analysisNode, workNodes) {
        return __awaiter(this, void 0, void 0, function* () {
            const triggers = yield this.getTriggerConfig(analysisNode);
            const covTriggers = triggers.filter((t) => t.type === analysisTrigger_1.TRIGGER_TYPE.COV);
            if (covTriggers.length === 0)
                return { bindings: [], skipped: [] };
            // A missing inputRegister is a config error, not work-node specific: fail loudly.
            for (const trigger of covTriggers) {
                if (!trigger.inputRegister) {
                    throw new Error(`COV trigger${trigger.id ? ` "${trigger.id}"` : ''} is missing inputRegister`);
                }
            }
            const nodes = workNodes !== null && workNodes !== void 0 ? workNodes : (yield this.resolveCOVWorkNodes(analysisNode));
            const bindings = [];
            const skipped = [];
            for (const workNode of nodes) {
                let inputRegisters;
                try {
                    inputRegisters = yield this.executeInputWorkflow(analysisNode, workNode);
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    skipped.push({ workNode, reason: `input workflow failed: ${message}` });
                    continue;
                }
                for (const trigger of covTriggers) {
                    const register = trigger.inputRegister;
                    if (!inputRegisters.has(register)) {
                        skipped.push({
                            workNode,
                            triggerId: trigger.id,
                            inputRegister: register,
                            reason: `input register "${register}" was not produced` +
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
        });
    }
    // ─────────────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ─────────────────────────────────────────────────────
    resolveWorkNodes(analysisNode, targetNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const resolverNode = yield this.nodeManager.getAnalysisWorknodeResolverNode(analysisNode);
            const dag = yield this.blockManager.loadWorkflowDAG(resolverNode);
            if (dag.blocks.length === 0) {
                return [targetNode];
            }
            const context = {
                workNode: targetNode,
                inputRegisters: new Map(),
                blockOutputs: new Map(),
                // The resolver decides WHAT gets bound — fail fast, like AnalysisExecutionService. Under
                // 'continue' a failing resolver left no output, and the fallback below bound the anchor
                // target instead of the real work nodes.
                execution: Object.assign(Object.assign({}, this.getDefaultExecutionMetadata()), { errorPolicy: 'stop' }),
            };
            yield this.executor.executeDAG(dag, context);
            // Find leaf block output
            const leafBlock = this.findLeafBlock(dag.blocks);
            const result = context.blockOutputs.get(leafBlock.id);
            if (Array.isArray(result))
                return result;
            if (result && typeof result === 'object')
                return [result];
            return [targetNode];
        });
    }
    executeInputWorkflow(analysisNode, workNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputNode = yield this.nodeManager.getAnalysisInputNode(analysisNode);
            const dag = yield this.blockManager.loadWorkflowDAG(inputNode);
            if (dag.blocks.length === 0) {
                return new Map();
            }
            const context = {
                workNode,
                inputRegisters: new Map(),
                blockOutputs: new Map(),
                execution: this.getDefaultExecutionMetadata(),
            };
            yield this.executor.executeDAG(dag, context);
            return context.inputRegisters;
        });
    }
    findLeafBlock(blocks) {
        var _a;
        const dependedOnIds = new Set();
        for (const block of blocks) {
            for (const depId of [...block.inputBlockIds, ...((_a = block.orderBlockIds) !== null && _a !== void 0 ? _a : [])]) {
                dependedOnIds.add(depId);
            }
        }
        const leaves = blocks.filter((b) => !dependedOnIds.has(b.id));
        if (leaves.length === 0)
            throw new Error('No leaf block found in workflow DAG');
        return leaves[leaves.length - 1];
    }
    normalizeTriggerConfig(trigger) {
        if (trigger.type === analysisTrigger_1.TRIGGER_TYPE.INTERVAL_TIME) {
            const interval = typeof trigger.intervalTimeMs === 'number'
                ? trigger.intervalTimeMs
                : typeof trigger.value === 'number'
                    ? trigger.value
                    : undefined;
            return {
                id: trigger.id,
                type: analysisTrigger_1.TRIGGER_TYPE.INTERVAL_TIME,
                intervalTimeMs: interval,
            };
        }
        if (trigger.type === analysisTrigger_1.TRIGGER_TYPE.CRON) {
            const cron = typeof trigger.cronExpression === 'string'
                ? trigger.cronExpression
                : typeof trigger.value === 'string'
                    ? trigger.value
                    : undefined;
            return {
                id: trigger.id,
                type: analysisTrigger_1.TRIGGER_TYPE.CRON,
                cronExpression: cron,
            };
        }
        return {
            id: trigger.id,
            type: analysisTrigger_1.TRIGGER_TYPE.COV,
            inputRegister: trigger.inputRegister,
            threshold: trigger.threshold,
        };
    }
    getDefaultExecutionMetadata() {
        return {
            referenceTime: Date.now(),
        };
    }
}
exports.default = AnalysisTriggerService;
//# sourceMappingURL=AnalysisTriggerService.js.map