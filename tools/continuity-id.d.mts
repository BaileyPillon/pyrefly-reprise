/** Types for `tools/continuity-id.mjs` (print, check and embed the continuity harness identity). */
export declare function stampOf(json: unknown): unknown;
/** Returns the process exit code: 0 ok, 1 refused, 2 no stamp, 64 usage. */
export declare function main(argv: string[], out?: (line: string) => void): number;
