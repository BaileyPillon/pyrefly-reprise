/**
 * The audio pass's own record of what it did (conference demo sound pass, 2026-10-22): every layered blow, dip, delayed landing and ducked line, with the page's clock, so a captured fight can be
 * scored offline (`__pyrefly.audioPassLog()`). Captures and tests read it; nothing else does. Pure: no DOM, no Web Audio. Off the pass's switch nothing is written.
 */

export interface PassLogEntry {
  /** The page's clock, ms (a recorder's fake clock or the stepper's when one is set, else `performance.now()`). */
  at: number;
  kind: 'hit' | 'dip' | 'landing' | 'release' | 'voice-duck' | 'ui' | 'victory' | 'results' | 'motion-guard';
  [field: string]: unknown;
}

const LIMIT = 800;
const log: PassLogEntry[] = [];
let clock: (() => number) | null = null;

/** The stepper names its own clock so the log follows simulated time (`null` goes back to `performance.now()`). */
export function setPassClock(fn: (() => number) | null): void {
  clock = fn;
}

export function passNow(): number {
  return clock ? clock() : typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function passLogPush(entry: Omit<PassLogEntry, 'at'> & { at?: number }): void {
  log.push({ ...entry, at: Math.round((entry.at ?? passNow()) * 10) / 10 } as PassLogEntry);
  if (log.length > LIMIT) log.shift();
}

export function passLogGet(reset = false): PassLogEntry[] {
  const copy = log.slice();
  if (reset) log.length = 0;
  return copy;
}
