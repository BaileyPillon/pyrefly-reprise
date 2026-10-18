/** Types for `tools/rig/rig-format.mjs` (the rig program): read, check and fingerprint a rig file (formats v1 and v2). */
export const RIG_VERSION: number;
export const RIG_VERSIONS: readonly number[];
export const RIG_FILE: string;
export const GATE_BY: string;
export const GATE_RULES: string;
export const VARIANT_NAME: RegExp;
export function readRigFile(pathOrDir: string): { raw: Record<string, any>; dir: string; file: string };
export function costumeParts(painting: unknown): { subject: string; pose: string } | null;
export function normaliseRig(raw: unknown, o?: { dir?: string }): { problems: Array<{ code: string; message: string }>; rt: Record<string, any> | null };
export function partImages(raw: Record<string, any>): Array<{ part: string; variant: string | null; png: string; rim: string | null; box: number[] }>;
export function usesV2(raw: Record<string, any>): boolean;
export function rigDigest(raw: Record<string, any>, dir: string): string;
export function rigSize(raw: Record<string, any>, dir: string): { parts: number; bones: number; texels: number; bytes: number; verts: number; tris: number; variants: number };
