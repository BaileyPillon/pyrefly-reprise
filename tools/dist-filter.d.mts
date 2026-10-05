/** Types for `tools/dist-filter.mjs` (PR-0100, PR-0173; source maps: PR-0328, D-335). */
export const SOURCEMAP_DIR_ENV: 'PYREFLY_SOURCEMAP_DIR';
export function isUnshippedPublicFile(rel: string): boolean;
export function isSourceMapFile(rel: string): boolean;
export function hasSourceMapReference(text: string): boolean;
export function findUnshipped(root: string): string[];
export function findSourceMapReferences(root: string): string[];
export function keepSourceMaps(root: string, dest: string): string[];
export function pruneUnshipped(root: string): string[];
