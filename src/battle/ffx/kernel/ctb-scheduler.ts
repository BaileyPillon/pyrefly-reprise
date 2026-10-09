/**
 * FFX CTB kernels, part 3: who acts next and how the clock runs (`pp_BtlCtbScheduler`, VA 0x00790fb0).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D. Spec:
 * `research/re-ffx-ctb-status.md` section 4. Pure, deterministic, not wired into the engine.
 *
 * The game calls this once per battle frame (`pp_BtlFrame`, VA 0x00790c10). One call:
 *
 * 1. Does nothing when the pause flag (VA 0x0112a8e1) is set or an action is already queued (VA 0x0112bde0 not 0).
 * 2. Clears the ready list, then walks the 31 character slots in id order. A character is READY when it has no
 *    queued action (`Chr+0xde6` = 0), is in the battle (`Chr+0xdc8`), is not dead (`Chr+0xdcc`), is not Petrified
 *    (`Chr+0x606` bit 2), has CTB 0 (`Chr+0x65c`) and gets turns (`Chr+0xdd6`). If the script-hold condition
 *    ({@link scriptHoldActive}) is on when the first ready character is found, the call ends there: no sort, no turn,
 *    no tick.
 * 3. Sorts the ready list ({@link sortReady}); if it is not empty, the first character's turn is queued and the call
 *    ends. Nobody else's counter moves on a call that found someone ready.
 * 4. If nobody is ready, a frame counter (VA 0x0112bde2, a byte) goes up by one; when it reaches the period (VA
 *    0x0112bde3, 1 at battle start, signed byte compare) it is reset and the CLOCK TICKS: every character that has no
 *    queued action, is in the battle, is not dead and is not Petrified
 *    - gets its Regen tick counter (`Chr+0x6d2`) plus one, saturating at 255;
 *    - loses 1 from its CTB; when that makes it 0 (or it was 0) its rank (`Chr+0xde8`) is reset to 3 and, if it does
 *      not get turns, its CTB is set back to its base ICV (`Chr+0x65d`). The debug switch at VA 0x0112a8fb makes a
 *      counter that would stay above 0 become 1 instead.
 *    So CTB is counted down one point per tick per character; there is no "subtract the minimum" step after the
 *    opening (that exists only in {@link initialCtb}).
 */

import { sortReady } from './ctb.ts';

/** `Chr+0x606` bit 2: Petrify. */
export const PERM_PETRIFY = 0x04;

/** One character slot as the scheduler reads and writes it. */
export interface SchedChr {
  /** `Chr+0xdc8`: in the battle. */
  inBattle: boolean;
  /** `Chr+0xdcc`: dead. */
  dead: boolean;
  /** `Chr+0x606` (u16): permanent statuses; only bit 2 (Petrify) is read. */
  perm: number;
  /** `Chr+0xde6`: queued actions (a character with any is skipped everywhere). */
  queued: number;
  /** `Chr+0x65c`: the CTB counter. */
  ctb: number;
  /** `Chr+0x65d`: the base ICV, used to reset a character that does not get turns. */
  baseCtb: number;
  /** `Chr+0xdd6`: the character gets turns. */
  getsTurns: boolean;
  /** `Chr+0x6d2`: ticks since the last Regen payout (saturates at 255). */
  tickCounter: number;
  /** `Chr+0xde8`: the rank of the last action; reset to 3 when the counter reaches 0 by ticking. */
  rank: number;
  /** `Chr+0x5ac`: Agility, read by the tie-break key. */
  agi: number;
}

export interface SchedGlobals {
  /** VA 0x0112a8e1: when set the scheduler does nothing. */
  paused: boolean;
  /** VA 0x0112bde0: queued actions; when not 0 the scheduler does nothing. */
  actionQueueCount: number;
  /** VA 0x0112bde2 (byte): calls since the last tick. */
  frameCounter: number;
  /** VA 0x0112bde3 (signed byte): calls per tick; the game sets 1 at battle start. */
  framesPerTick: number;
  /** VA 0x0112a8fb: debug switch, a counter that would stay above 0 becomes 1. */
  debugFastCtb: boolean;
  /** {@link scriptHoldActive} for this call. */
  scriptHold: boolean;
}

export interface SchedResult {
  /** False when the call did nothing at all (paused or an action queued); the exe returns 0 then, else -1. */
  ran: boolean;
  /** True when the script hold ended the call at the first ready character. */
  held: boolean;
  /** The ready list: sorted when the call got that far, otherwise the (unsorted) ids found before it stopped. */
  ready: number[];
  /** The character whose turn was queued this call, or null. */
  actor: number | null;
  /** True when the clock ticked on this call. */
  ticked: boolean;
  /** VA 0x0112bde2 after the call. */
  frameCounter: number;
  /** All 31 slots after the call (inputs untouched; a queued actor has `queued` + 1). */
  chrs: SchedChr[];
}

const toInt8 = (v: number): number => (v << 24) >> 24;

/** Is this character a candidate for the ready list? */
export function isReady(c: SchedChr): boolean {
  return (
    c.queued === 0 &&
    c.inBattle &&
    !c.dead &&
    (c.perm & PERM_PETRIFY) === 0 &&
    c.ctb === 0 &&
    c.getsTurns
  );
}

/** Does the clock tick this character (the same test without the CTB and turns conditions)? */
export function isTicked(c: SchedChr): boolean {
  return c.queued === 0 && c.inBattle && !c.dead && (c.perm & PERM_PETRIFY) === 0;
}

/** One call of `pp_BtlCtbScheduler`. `chrs` has 31 entries (index = chr id); the input is not modified. */
export function schedulerFrame(chrs: readonly SchedChr[], g: SchedGlobals): SchedResult {
  const out = chrs.map((c) => ({ ...c }));
  const idle = (): SchedResult => ({
    ran: false,
    held: false,
    ready: [],
    actor: null,
    ticked: false,
    frameCounter: g.frameCounter,
    chrs: out,
  });
  if (g.paused || (g.actionQueueCount | 0) !== 0) return idle();

  const found: number[] = [];
  for (let i = 0; i < out.length; i++) {
    if (!isReady(out[i] as SchedChr)) continue;
    if (g.scriptHold) {
      return { ran: true, held: true, ready: found, actor: null, ticked: false, frameCounter: g.frameCounter, chrs: out };
    }
    found.push(i);
  }
  const ready = sortReady(found, (id) => (out[id] as SchedChr).agi);
  if (ready.length > 0) {
    const actor = ready[0] as number;
    (out[actor] as SchedChr).queued = ((out[actor] as SchedChr).queued + 1) & 0xff;
    return { ran: true, held: false, ready, actor, ticked: false, frameCounter: g.frameCounter, chrs: out };
  }

  const counter = (g.frameCounter + 1) & 0xff;
  if (toInt8(counter) < toInt8(g.framesPerTick)) {
    return { ran: true, held: false, ready, actor: null, ticked: false, frameCounter: counter, chrs: out };
  }
  for (const c of out) {
    if (!isTicked(c)) continue;
    if (c.tickCounter < 0xff) c.tickCounter += 1;
    const next = c.ctb - 1;
    if (next > 0) {
      c.ctb = g.debugFastCtb ? 1 : next;
    } else {
      c.rank = 3;
      c.ctb = c.getsTurns ? 0 : c.baseCtb;
    }
  }
  return { ran: true, held: false, ready, actor: null, ticked: true, frameCounter: 0, chrs: out };
}
