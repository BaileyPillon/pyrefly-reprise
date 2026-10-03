/** Types for `critic/runner/lib/route-pure.mjs`, so the unit test can import it. */
export function letterTagMap(enemyIds: readonly string[], nameOf: (id: string) => string | undefined | null): Map<string, string>;
export function slugOf(name: unknown): string;
export interface Roster { enemyIds: readonly string[]; names: Record<string, string> }
export function resolveTargetId(name: unknown, roster: Roster | null | undefined, domIds: readonly string[]): string | null;
export function isAllDisabledOverlay(rows: readonly { disabled?: boolean }[]): boolean;
export interface DboxSample { speaker: string; role: string; text: string; portrait: string | null; narrate: boolean }
export interface DboxLine extends DboxSample { ms: number; lastMs: number; endMs?: number; screen: string | null; show: number }
export interface DboxMem { lines: DboxLine[]; seen: { speaker: string; text: string } | null }
export function dboxStep(mem: DboxMem, cur: DboxSample | null, now: number, screen: string | null): DboxLine | null;
export const BUSHIDO_KEYS: Readonly<Record<string, string>>;
export function minigameKindOf(subtitle: unknown): 'bushido' | 'swordplay' | null;
export function keysForChips(chips: readonly string[]): { keys: string[]; unknown: string[] };
export function swordplayPressNow(pos: number, prev: number, dtMs: number, zoneStart: number, zoneWidth: number, leadMs: number, inner?: number): boolean;
export interface RouteEnd { screenAtEnd: string | null; resultsText?: string | null; final?: boolean; log?: readonly { type: string }[]; seen?: { links?: number; chainLength?: number; phase?: string } }
export interface RouteOutcome { outcome: 'victory' | 'defeat' | 'stalled' | 'undecided'; from: string; stalledAt?: { link: number; phase: string }; detail?: string }
export function deriveOutcome(end: RouteEnd): RouteOutcome;
