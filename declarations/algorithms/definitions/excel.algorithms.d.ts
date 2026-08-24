import { AlgorithmDefinition } from './core';
/**
 * Whether the installed documentation-service exposes the file-management API the file-backed
 * Excel blocks need. Lets a deployment run with the stable doc-service (Excel document read/write
 * dormant) or the newer one (fully enabled) from the same codebase — no branch fork, no
 * commented-out code. Reusable for any future doc-service-file-dependent feature.
 */
export declare function docServiceSupportsFileApi(): boolean;
export declare const EXCEL_ALGORITHMS: AlgorithmDefinition[];
