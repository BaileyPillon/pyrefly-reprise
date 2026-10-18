/** Types for `tools/rig/subjects/lulu-v2-from-v1.mjs`: Lulu's front views as format v2. */
export const FRONTS: Array<{ key: string; part: string; chain: string[]; variant: string | null }>;
export const HIDES: string[];
export const HACK_BONES: string[];
export function dropBones<T extends Record<string, any>>(raw: T, names: string[]): T;
export function convert(rawIn: Record<string, any>, dir: string): Record<string, any>;
