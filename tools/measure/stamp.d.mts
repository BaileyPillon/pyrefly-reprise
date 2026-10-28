/** Types for `tools/measure/stamp.mjs`. */
export declare const TOOL_STAMP_SCHEMA: string;
export interface ToolStamp {
  schema: string; tool: string; toolId: string; toolFiles: Record<string, string>;
  harness: { id: string; files: number; policy: string | null; probeVersion: number | null };
  tree: { root: string | null; head: string | null; dirty: string[] | null }; node: string; at: string;
  thresholds?: Record<string, unknown>; thresholdsSha?: string;
}
export declare function toolDigest(files: Record<string, string>, thresholdsSha?: string): string;
export declare function thresholdsDigest(thresholds: Record<string, unknown> | null | undefined): string;
export declare function toolStamp(tool: string, entry: string, root: string, o?: { identity?: object; extraFiles?: string[]; thresholds?: Record<string, unknown> | null }): ToolStamp;
export declare function describeStamp(s: ToolStamp): string;
export declare function incomparable(a: ToolStamp | null | undefined, b: ToolStamp | null | undefined): string[];
