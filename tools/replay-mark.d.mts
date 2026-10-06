import type { MarkRecord } from '../src/app/markMoment.ts';

export function keyForPlaywright(code: string): string;
export function parseArgs(argv: string[]): { input: string | null; flags: Record<string, string | true> };
export function windowFromSize(text: unknown): [number, number] | null;
export function isDue(want: { t: number; s: number; m?: number }, now: { elapsed: number; seq: number; menu?: boolean }, slackMs?: number): boolean;
export function orderedInputs(record: Pick<MarkRecord, 'inputs'>): MarkRecord['inputs'];
