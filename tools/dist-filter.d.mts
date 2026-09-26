/** Types for `tools/dist-filter.mjs` (PR-0100, PR-0173). */
export function isUnshippedPublicFile(rel: string): boolean;
export function findUnshipped(root: string): string[];
export function pruneUnshipped(root: string): string[];
