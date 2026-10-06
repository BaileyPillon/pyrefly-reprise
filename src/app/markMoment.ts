/**
 * N1, "mark this moment" (release 39.1; Bailey, 2026-10-05, "I'll go with all of your recommendations"; **both games**: the battle screen is shared).
 *
 * A hidden key (the backtick, `Backquote`: bound to nothing in either game, the pause screen or the title) that, pressed in a battle, saves what is needed
 * to play that exact moment again: the chapter, the engine's seed, every input since the battle began with its time, the build, the window and the settings.
 * It shows NOTHING on screen. It stores the record in `localStorage`, copies a short code to the clipboard inside the key handler (a key press is a user
 * gesture; a refused copy is skipped without a word), and writes one console line. `tools/replay-mark.mjs` takes the code, the record, or an export of
 * `localStorage`, plays the battle again headlessly to that moment at a window size of your choice, and saves a frame.
 *
 * This file is the part with no DOM: the record, the compact code, the log hash and the storage helpers. `markRecorder.ts` listens for the inputs and the key.
 *
 * What the replay can and cannot promise (the sources of non-determinism, recorded here on purpose):
 * - The battle engines are deterministic under their seed (hard rule 1), so the same commands in the same order give the same battle. The record carries the
 *   engine's event count and a hash of its event log at the mark, so a replay says whether it reached the same engine state (`logHash`).
 * - Presentation is not seeded: the idle camera sway starts at a random phase, particles and sparks draw from `Math.random`, and the presenter paces itself
 *   by the wall clock. A replayed frame is therefore the same moment, not the same pixels, except under REDUCE MOTION where the sway is off.
 * - Every input is replayed at its time and no earlier than the engine event count it was pressed at (`seq`), so a slower machine waits for the fight to
 *   catch up instead of pressing into a menu that is not open yet.
 * - FFX-2 in Active mode ticks the ATB clock by real elapsed time, so a replay under load can drift; Wait mode (the default) does not.
 * - The party chosen in the prep screen and the pre-battle scene are not part of "since the battle began": the record keeps the party that stood on the
 *   field and whether the opening was hurried, and the tool says when the replayed party differs.
 */

/** The key: bound to nothing in either game, the pause screen or the title (checked against `Input.ts` and every raw `keydown` in `src/`). */
export const MARK_KEY_CODE = 'Backquote';

/** `localStorage`: `{ marks: MarkRecord[] }`, newest last, at most {@link MARK_HISTORY}. */
export const MARK_STORAGE_KEY = 'pyrefly-reprise:mark:v1';
export const MARK_HISTORY = 5;

/** The most inputs one record keeps; past it the recorder stops adding and says so (`truncated`), because a replay needs every input from the start. */
export const MARK_MAX_INPUTS = 6000;

/** The code's prefix and format version. */
export const MARK_CODE_PREFIX = 'PM1.';

export type PointerKind = 0 | 1 | 2; // mouse, touch, pen

/**
 * One input: its time (`t`, ms since the battle screen began), the engine's event count when it was made (`s`) and, when a command menu was waiting for the
 * player then, `m: 1`. A replay sends an `m` input only once the menu is up again, so a slower machine does not press into a menu that is still opening.
 */
export type MarkInput =
  | { k: 'kd' | 'ku'; c: string; t: number; s: number; m?: 1 }
  | { k: 'click'; x: number; y: number; p: PointerKind; t: number; s: number; m?: 1 }
  | { k: 'wheel'; x: number; y: number; dx: number; dy: number; t: number; s: number; m?: 1 }
  | { k: 'pad'; b: number; d: 0 | 1; t: number; s: number; m?: 1 };

export interface MarkRecord {
  /** The record's format version. */
  v: 1;
  chapter: string;
  game: string;
  /** The engine's seed for this attempt (a retry adds 1000 per attempt), or null when it was not known. */
  seed: number | null;
  /** The build: the short commit (`unknown` where the build had none) and the bundle file the page ran (`/src/...` under the dev server). */
  sha: string;
  bundle: string;
  /** The window at the mark (CSS px) and the device pixel ratio. */
  win: [number, number];
  dpr: number;
  /** The first opening ran hurried (the player skipped the pre-scene): the replay skips it too. */
  hurried: boolean;
  /** The combatants on the field at the start. */
  party: string[];
  /**
   * The profile as the battle BEGAN (what a replay's fresh profile starts with; whatever changes during the fight replays through its inputs): the settings
   * that differ from the shipped defaults, and the coaching already seen. Both change what a key does, and a coach card the player dismissed in the fight
   * must still be there for the replay to dismiss.
   */
  settings: Record<string, unknown>;
  seenCoach: string[];
  /**
   * The mark: milliseconds since the battle screen began, the engine's event count then, a hash of those events (`h`: exact) and a hash of the same fight with the
   * clock left out (`hs` over the first `n` fight events, {@link sequenceHash}), the presenter's phase, the wall time.
   */
  at: { t: number; s: number; h: string; hs: string; n: number; phase: string; wall: string };
  inputs: MarkInput[];
  truncated?: true;
}

/** FNV-1a (32 bits) over the first `upTo` events of a log, as JSON, in hex. Events are plain data, so this is stable across runs and machines. */
export function logHash(log: readonly unknown[], upTo = log.length): string {
  return fnv(log, upTo, (e) => JSON.stringify(e));
}

/** The engine's clock, in the places an event carries it: the ATB bars' snapshots (their own events), the turn clock, a status's remaining time. */
const CLOCK_KEYS = new Set(['seq', 'elapsedTicks', 'elapsedMs', 'ticksRemaining', 'remaining']);

/** The events of the fight itself: the log without the ATB bars' snapshots, which come as often as the clock ticks them. */
function fightEvents(log: readonly unknown[]): unknown[] {
  return log.filter((e) => (e as { type?: unknown } | null)?.type !== 'atb');
}

/** How many fight events a log holds ({@link sequenceHash}'s unit). */
export function fightEventCount(log: readonly unknown[]): number {
  return fightEvents(log).length;
}

/**
 * The same hash over the same fight with the clock left out: the first `count` events of the fight (no `atb` snapshot events, which a slower or faster run has more
 * or fewer of) and none of the clock fields ({@link CLOCK_KEYS}). FFX-2's ATB advances by real time, so a replay that presses every key within a few tens of ms
 * of the record plays the same fight (the same actions, targets, damage and statuses in the same order) on a clock that differs by that much: `h` differs,
 * `hs` does not. Measured on Chapter IV (the only differing fields were those).
 */
export function sequenceHash(log: readonly unknown[], count = Infinity): string {
  const kept = fightEvents(log).slice(0, count);
  return fnv(kept, kept.length, (e) => JSON.stringify(e, (k, v) => (CLOCK_KEYS.has(k) ? undefined : v)));
}

function fnv(log: readonly unknown[], upTo: number, text: (e: unknown) => string): string {
  let h = 0x811c9dc5;
  const n = Math.min(upTo, log.length);
  for (let i = 0; i < n; i++) {
    const s = text(log[i]);
    for (let k = 0; k < s.length; k++) {
      h ^= s.charCodeAt(k);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    h ^= 0x0a;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// ----------------------------------------------------------------------- the code

/** The keys a game uses, by number in the code (a key outside the list is written by name): this is what keeps a hundred inputs near a kilobyte and a half. */
const KEY_CODES = [
  'Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyX', 'KeyQ', 'KeyE', 'KeyC', 'KeyM', 'KeyV',
  'KeyR', 'KeyF', 'KeyG', 'KeyN', 'KeyJ', 'KeyI', 'KeyH', 'KeyP', 'Tab', 'ShiftLeft', 'ShiftRight', 'Backspace', 'NumpadEnter', 'PageUp', 'PageDown', 'Home', 'End',
  'BracketLeft', 'BracketRight',
] as const;

const KIND_NUM = { kd: 0, ku: 1, click: 2, wheel: 3, pad: 4 } as const;
const KIND_NAME = ['kd', 'ku', 'click', 'wheel', 'pad'] as const;

/** Inputs as compact arrays, times and event counts delta-coded: `[kind, ...fields, dt, ds]`; 8 is added to the kind number for an input made with a menu waiting. */
function packInputs(inputs: readonly MarkInput[]): unknown[][] {
  let t = 0;
  let s = 0;
  return inputs.map((i) => {
    const dt = i.t - t;
    const ds = i.s - s;
    t = i.t;
    s = i.s;
    const m = i.m ? 8 : 0;
    switch (i.k) {
      case 'kd':
      case 'ku':
        return [KIND_NUM[i.k] + m, KEY_CODES.indexOf(i.c as (typeof KEY_CODES)[number]) >= 0 ? KEY_CODES.indexOf(i.c as (typeof KEY_CODES)[number]) : i.c, dt, ds];
      case 'click':
        return [2 + m, i.x, i.y, i.p, dt, ds];
      case 'wheel':
        return [3 + m, i.x, i.y, i.dx, i.dy, dt, ds];
      case 'pad':
        return [4 + m, i.b, i.d, dt, ds];
    }
  });
}

function unpackInputs(packed: unknown[][]): MarkInput[] {
  let t = 0;
  let s = 0;
  const out: MarkInput[] = [];
  for (const a of packed) {
    const kind = KIND_NAME[(a[0] as number) & 7];
    const m = (a[0] as number) >= 8 ? ({ m: 1 } as const) : {};
    if (kind === 'kd' || kind === 'ku') {
      t += a[2] as number;
      s += a[3] as number;
      out.push({ k: kind, c: typeof a[1] === 'number' ? (KEY_CODES[a[1]] ?? String(a[1])) : (a[1] as string), t, s, ...m });
    } else if (kind === 'click') {
      t += a[4] as number;
      s += a[5] as number;
      out.push({ k: 'click', x: a[1] as number, y: a[2] as number, p: a[3] as PointerKind, t, s, ...m });
    } else if (kind === 'wheel') {
      t += a[5] as number;
      s += a[6] as number;
      out.push({ k: 'wheel', x: a[1] as number, y: a[2] as number, dx: a[3] as number, dy: a[4] as number, t, s, ...m });
    } else if (kind === 'pad') {
      t += a[3] as number;
      s += a[4] as number;
      out.push({ k: 'pad', b: a[1] as number, d: a[2] as 0 | 1, t, s, ...m });
    }
  }
  return out;
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): string {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** The record as one line of text that survives a paste: `PM1.` and base64url of a compact JSON. Synchronous, so the copy can happen in the key handler. */
export function encodeMark(r: MarkRecord): string {
  const body = [r.v, r.chapter, r.game, r.seed, r.sha, r.bundle, r.win, r.dpr, r.hurried ? 1 : 0, r.party, r.settings, r.seenCoach, [r.at.t, r.at.s, r.at.h, r.at.phase, r.at.wall, r.at.hs, r.at.n], packInputs(r.inputs), r.truncated ? 1 : 0];
  return MARK_CODE_PREFIX + toBase64Url(JSON.stringify(body));
}

/** The record a code stands for, or null when it is not one. Never throws. */
export function decodeMark(code: string): MarkRecord | null {
  try {
    const text = code.trim();
    if (!text.startsWith(MARK_CODE_PREFIX)) return null;
    const b = JSON.parse(fromBase64Url(text.slice(MARK_CODE_PREFIX.length))) as unknown[];
    if (!Array.isArray(b) || b[0] !== 1) return null;
    const at = b[12] as [number, number, string, string, string, string?, number?];
    const r: MarkRecord = {
      v: 1,
      chapter: b[1] as string,
      game: b[2] as string,
      seed: b[3] as number | null,
      sha: b[4] as string,
      bundle: b[5] as string,
      win: b[6] as [number, number],
      dpr: b[7] as number,
      hurried: b[8] === 1,
      party: b[9] as string[],
      settings: b[10] as Record<string, unknown>,
      seenCoach: b[11] as string[],
      at: { t: at[0], s: at[1], h: at[2], hs: at[5] ?? '', n: at[6] ?? 0, phase: at[3], wall: at[4] },
      inputs: unpackInputs(b[13] as unknown[][]),
    };
    if (b[14] === 1) r.truncated = true;
    return r;
  } catch {
    return null;
  }
}

/** Is this value a record (the shape the tool and the tests rely on)? */
export function isMarkRecord(x: unknown): x is MarkRecord {
  const r = x as Partial<MarkRecord> | null;
  return !!r && typeof r === 'object' && r.v === 1 && typeof r.chapter === 'string' && Array.isArray(r.inputs) && !!r.at && typeof r.at.t === 'number' && typeof r.at.s === 'number';
}

/**
 * Whatever a person might hand the tool: a code, a record's JSON, the `localStorage` value of {@link MARK_STORAGE_KEY}, an export of the whole of
 * `localStorage` (`{ key: value }`) or Playwright's storage state. The latest mark in it, or null.
 */
export function parseMarkInput(text: string): MarkRecord | null {
  const raw = text.trim();
  if (raw.startsWith(MARK_CODE_PREFIX)) return decodeMark(raw);
  let j: unknown;
  try {
    j = JSON.parse(raw);
  } catch {
    return null;
  }
  return fromJson(j);
}

function fromJson(j: unknown): MarkRecord | null {
  if (isMarkRecord(j)) return j;
  if (!j || typeof j !== 'object') return null;
  const o = j as Record<string, unknown>;
  if (Array.isArray(o['marks'])) return fromJson((o['marks'] as unknown[])[(o['marks'] as unknown[]).length - 1]);
  const stored = o[MARK_STORAGE_KEY];
  if (typeof stored === 'string') return parseMarkInput(stored);
  if (Array.isArray(o['origins'])) {
    for (const origin of o['origins'] as Array<{ localStorage?: Array<{ name: string; value: string }> }>) {
      const hit = origin.localStorage?.find((e) => e.name === MARK_STORAGE_KEY);
      if (hit) return parseMarkInput(hit.value);
    }
  }
  return null;
}

// ------------------------------------------------------------------- the storage

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

/** The marks kept, newest last. Never throws; a corrupt value reads as none. */
export function readMarks(storage: StorageLike | null): MarkRecord[] {
  try {
    const raw = storage?.getItem(MARK_STORAGE_KEY);
    const j = raw ? (JSON.parse(raw) as { marks?: unknown[] }) : null;
    return (j?.marks ?? []).filter(isMarkRecord);
  } catch {
    return [];
  }
}

/** Keep `record` as the newest mark. False when the storage refuses (quota, a locked-down profile): nothing else depends on it. */
export function writeMark(storage: StorageLike | null, record: MarkRecord): boolean {
  try {
    if (!storage) return false;
    const marks = [...readMarks(storage), record].slice(-MARK_HISTORY);
    storage.setItem(MARK_STORAGE_KEY, JSON.stringify({ marks }));
    return true;
  } catch {
    return false;
  }
}

/** The one console line a mark writes. */
export function markLine(r: MarkRecord, code: string): string {
  return `[pyrefly:mark] ${r.chapter} seed=${r.seed ?? '?'} t=${(r.at.t / 1000).toFixed(1)}s events=${r.at.s} inputs=${r.inputs.length}${r.truncated ? '+' : ''} win=${r.win[0]}x${r.win[1]} build=${r.sha} code=${code}`;
}
