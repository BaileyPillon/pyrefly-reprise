import type { PoseReading } from './pose-model.mjs';

export const SLACK: number;
export const LOW_STATURE_MIN: Readonly<Record<string, number>>;
export const BANDS: Readonly<{
  standing: { stature: number[]; head: number[] };
  low: { stature: number[]; head: number[] };
  ko: { head: number[]; length: number[] };
  heldHead: number[];
  feet: number;
  feetRowGap: number;
  ghost: { fail: number; watch: number };
  mass: number[];
}>;
export const EXEMPT_CLASSES: readonly string[];
export type PoseFlag = 'unregistered' | 'stature-low' | 'stature-high' | 'head-small' | 'head-big' | 'feet-x' | 'feet-y' | 'feet-sunk';
export type PoseReport = 'ko-short' | 'ko-long' | 'ghost-fail' | 'ghost-watch' | 'mass';
export function isExempt(reading: Pick<PoseReading, 'class' | 'kind'>): boolean;
export function bandVerdict(reading: PoseReading): { exempt: boolean; flags: PoseFlag[]; report: PoseReport[]; judged: string[] };
export function proposeStatus(reading: PoseReading, o?: { waived?: boolean }): 'ok' | 'held' | 'waived' | 'blocked' | null;
