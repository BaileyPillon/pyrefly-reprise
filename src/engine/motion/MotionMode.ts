/**
 * `?motion=M1|M2|M3` (opt-motion prototype, 2026-10-03; NEVER merged to main).
 *
 * Options for Bailey's "animation beyond still keys" ask. With no flag every figure, camera and effect plays
 * exactly as today. Each option is a separate switch so a clip can show today against one option:
 *
 *   M1  travel: the figure runs key to key along an arc with a short smear, the camera trucks with it
 *   M2  enemy part motion: a light puppet-warp of the boss painting on its idle and on the hit
 *   M3  skill travel: a spell or shot visibly leaves the caster, crosses the field and lands with an impact frame
 *
 * `?motion=M1,M3` turns on several. `window.__pyreflyMotion.set('M1')` switches at run time (the capture
 * scripts use it to record today and the option in one session). No `three`, no DOM beyond `location.search`.
 */

export type MotionOption = 'M1' | 'M2' | 'M3';
export const MOTION_OPTIONS: readonly MotionOption[] = ['M1', 'M2', 'M3'];

let active: ReadonlySet<MotionOption> | null = null;
let flagged = false;

/** Parse `?motion=`: the options named, in any case, comma separated; `off` or nothing = none. */
export function motionFromSearch(search: string): MotionOption[] {
  let raw: string | null = null;
  try {
    raw = new URLSearchParams(search).get('motion');
  } catch {
    raw = null;
  }
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is MotionOption => (MOTION_OPTIONS as readonly string[]).includes(s));
}

function read(): ReadonlySet<MotionOption> {
  if (active === null) {
    let search = '';
    try {
      search = globalThis.location?.search ?? '';
    } catch {
      search = '';
    }
    flagged = /[?&]motion=/.test(search);
    active = new Set(motionFromSearch(search));
  }
  return active;
}

/** Is this option switched on right now? */
export function motionOn(option: MotionOption): boolean {
  return read().has(option);
}

/** Did the page ask for `?motion=` at all (even `off`)? The game builds its hooks only then. */
export function motionRequested(): boolean {
  read();
  return flagged;
}

/** Run-time switch: `set('M1')`, `set('M1,M3')`, `set('off')`. Answers the options now in force. */
export function setMotion(spec: string): MotionOption[] {
  read();
  active = new Set(motionFromSearch(`?motion=${spec}`));
  return [...active];
}

/** Install `window.__pyreflyMotion` (read and set), once, for the capture scripts. */
export function installMotionDebug(): void {
  const w = globalThis as { __pyreflyMotion?: unknown };
  if (w.__pyreflyMotion) return;
  w.__pyreflyMotion = { set: setMotion, get: () => [...read()], options: MOTION_OPTIONS };
}
