import type { PoseReading, ModelRow } from './pose-model.mjs';

export const SHA_PREFIX: number;
export const STORED_TOLERANCE: Readonly<{ stature: number; headReal: number; lengthRatio: number; iou: number }>;
export function rowFieldsFromReading(reading: PoseReading, status: 'ok' | 'held' | 'waived' | 'blocked' | null): Partial<ModelRow>;
export function shaMatches(rowSha: string | undefined | null, fullSha: string): boolean;
export function diffStored(row: ModelRow | undefined, reading: PoseReading): { stale: string[]; missing: string[] };
export function recordStatureGap(reading: PoseReading, rec: { stature?: number } | undefined): number | null;
