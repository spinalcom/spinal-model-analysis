/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  AnalysisExecutionResult,
  WorkNodeExecutionResult,
} from './AnalysisExecutionService';

/**
 * Serialization for analysis execution results.
 *
 * Block outputs can be values that are NOT safe to hand to JSON.stringify: SpinalNodes and
 * spinal-core Models carry `_parents` back-references (cycles), and some blocks emit opaque
 * runtime handles (e.g. the Excel workbook from LOAD_EXCEL_TEMPLATE, which wraps a live
 * ExcelJS workbook + a Buffer). This module owns the block-output shapes, so it owns how they
 * serialize — both the api-server (execute route) and spinal-organ-analysis import these
 * instead of re-implementing the knowledge of what a "block output" can be.
 *
 * The result is a plain, JSON-safe structure. Non-primitive values become compact descriptors:
 *   - SpinalNode          → { id, name, type, server_id }
 *   - spinal Model        → its primitive value, or { _model: "<ClassName>" }
 *   - Excel workbook       → { _excelWorkbook: { source, variables } }
 *   - Buffer               → { _buffer: { bytes } }
 *   - cyclic reference     → { _circular: true }
 */

/** Duck-typed SpinalNode check (robust across package copies — avoids instanceof pitfalls). */
function isSpinalNode(value: any): boolean {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof value.getId === 'function' &&
    typeof value.getName === 'function' &&
    typeof value.getType === 'function'
  );
}

function serializeNode(node: any) {
  return {
    id: node?.getId?.()?.get?.(),
    name: node?.getName?.()?.get?.(),
    type: node?.getType?.()?.get?.(),
    server_id: node?._server_id,
  };
}

/** The workbook handle produced by the Excel blocks (see excel.algorithms.ts). */
function isExcelHandle(value: any): boolean {
  return Boolean(value) && typeof value === 'object' && value.__excelHandle === true;
}

function serializeExcelHandle(handle: any) {
  let variables: string[] = [];
  try {
    if (handle?.filler && typeof handle.filler.getVariables === 'function') {
      variables = handle.filler.getVariables();
    }
  } catch {
    /* ignore — descriptor stays best-effort */
  }
  return {
    _excelWorkbook: {
      source: handle?.sourceName ?? null,
      variables,
    },
  };
}

/**
 * Converts a single block-output value into a JSON-safe form. Recurses into arrays and plain
 * objects (cycle-guarded) so nested nodes/models/handles are handled wherever they appear.
 */
export function serializeExecutionValue(value: unknown, seen?: WeakSet<object>): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value; // string | number | boolean | bigint | symbol → as-is

  if (isSpinalNode(value)) return serializeNode(value);
  if (isExcelHandle(value)) return serializeExcelHandle(value);
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return { _buffer: { bytes: (value as Buffer).length } };
  }

  const visited = seen ?? new WeakSet<object>();
  if (visited.has(value as object)) return { _circular: true };
  visited.add(value as object);

  if (Array.isArray(value)) return value.map((v) => serializeExecutionValue(v, visited));

  // spinal-core Model (Val / Str / Bool / SpinalBmsEndpoint / …): never emit the raw model —
  // its _parents form a cycle. Expose its primitive value, else a safe type descriptor.
  if (typeof (value as any).get === 'function') {
    try {
      const got = (value as any).get();
      const gt = typeof got;
      if (got === null || gt === 'string' || gt === 'number' || gt === 'boolean') return got;
    } catch {
      /* fall through to the descriptor */
    }
    return { _model: (value as any).constructor?.name ?? 'Model' };
  }

  // Plain object — rebuild it with serialized values (cycle-guarded).
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    out[key] = serializeExecutionValue((value as any)[key], visited);
  }
  return out;
}

function serializeRecord(
  record: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!record) return record;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(record)) {
    out[key] = serializeExecutionValue(record[key]);
  }
  return out;
}

/**
 * Serializes a full AnalysisExecutionResult into a JSON-safe object, ready for res.json().
 * Per work node, its inputRegisters and executionOutputs are passed through
 * serializeExecutionValue.
 */
export function serializeExecutionResult(result: AnalysisExecutionResult) {
  return {
    ...result,
    results: result.results.map((r: WorkNodeExecutionResult) => ({
      ...r,
      inputRegisters: serializeRecord(r.inputRegisters),
      executionOutputs: serializeRecord(r.executionOutputs),
    })),
  };
}
