import { SpinalNode } from 'spinal-env-viewer-graph-service';
import AnalyticNodeManagerService from './AnalyticNodeManagerService';
import WorkflowBlockManagerService from './WorkflowBlockManagerService';
import { IAnalysisConfigJSON } from '../interfaces/IAnalysisConfigJSON';
/**
 * Factory service for creating complete analysis configurations from a JSON descriptor.
 *
 * Takes an IAnalysisConfigJSON object and creates:
 * - The analysis context (if it doesn't exist)
 * - The analysis node with all mandatory sub-nodes
 * - Links the anchor to a target node
 * - Creates all workflow blocks (worknode resolver, input, execution) with proper DAG wiring
 *
 * Usage:
 * ```typescript
 * const factory = new AnalysisFactoryService(nodeManager, blockManager);
 * const analysisNode = await factory.createFromJSON(config);
 * ```
 */
export default class AnalysisFactoryService {
    private readonly nodeManager;
    private readonly blockManager;
    constructor(nodeManager: AnalyticNodeManagerService, blockManager: WorkflowBlockManagerService);
    /**
     * Creates a complete analysis from a JSON configuration.
     *
     * @param config - The JSON analysis descriptor
     * @returns The created analysis SpinalNode
     */
    createFromJSON(config: IAnalysisConfigJSON): Promise<SpinalNode<any>>;
    /**
     * Links the analysis anchor node to the target node in the database.
     */
    private linkAnchorTarget;
    /**
     * Builds a complete workflow DAG from the JSON block definitions.
     *
     * Strategy:
     * 1. Determine which blocks are roots (no inputs, or only '$node') vs dependents
     * 2. Create root blocks as children of the workflow node
     * 3. Create dependent blocks as orphans
     * 4. Wire dependencies — dependent blocks become children of their source blocks
     *
     * The special ref '$node' maps to WORK_NODE_RESERVED_ID and does NOT require
     * a SpinalNode — it's automatically available at execution time.
     *
     * @param workflowNode - The parent workflow SpinalNode (resolver, input, or execution)
     * @param contextNode - The analysis context
     * @param workflowConfig - The JSON workflow descriptor with block definitions
     */
    private buildWorkflow;
    /**
     * Builds the sub-workflow for a FOREACH block.
     */
    private buildForeachSubWorkflow;
}
