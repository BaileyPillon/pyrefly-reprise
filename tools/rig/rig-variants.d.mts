/** Types for `tools/rig/rig-variants.mjs` (the rig program): the gate's rules for format v2 parts and variants. */
export const HIDDEN_SHARE_MAX: number;
export function variantRules(rt: Record<string, any>): Array<{ code: string; message: string }>;
export function hiddenShare(rt: Record<string, any>, frame: Record<string, any>, key: unknown, restArea: number): number;
export function variantPalettes(rt: Record<string, any>, dir: string): Promise<Array<{ part: string; variant: string; distance: number }>>;
