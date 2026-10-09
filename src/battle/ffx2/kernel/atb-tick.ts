/**
 * FFX-2 ATB kernel, part 3: all characters in one logic step (`MsChrATBprocess`), the order the ready ones are
 * served in, and what happens to a character once the action request has been made.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), function
 * 0x006343a0 (`MsChrATBprocess`) and the code it runs per character, `./atb-gauge.ts` (0x00634b10) and
 * `./atb-clock.ts` (0x006349f0). Spec: `research/re-ffx2-atb-status.md` section 3. Pure, deterministic, no DOM;
 * not wired into the engine.
 *
 * What the function does, in order, once per logic step:
 *
 * 1. Every character slot (0 to 30) gets its four speeds ({@link atbSpeeds}) and its thinking tick, or all zero
 *    when ATB is disabled for it.
 * 2. If the clock gate is open ({@link atbProcessGate}): every slot takes {@link atbChrStep}; the ones that became
 *    READY form the ready list (31 entries at most).
 * 3. The ready list is served lowest recovery counter first ({@link readyOrder}): the hand-off request is made
 *    (`MsActionRequest(id, 0xff, 1, 1)`); a command produced means state 9, otherwise {@link readyHandoff} picks
 *    the state from the character's mode and its Confusion / Berserk bits.
 * 4. Every slot whose state is now 5, 6, 7 or 8 is asked again, once per step, in slot order: a script request, an
 *    AI request, a Confusion pick, a Berserk attack. The answer is the new state byte: 9 when a command was produced
 *    or queued, 0 (IDLE) otherwise, so a monster whose script declines to act starts a fresh (instant) recovery and
 *    asks again on the next step. A monster that became ready this step is therefore asked twice.
 */

import {
  FFX2_NO_SPEEDS,
  atbProcessGate,
  atbSpeeds,
  type Ffx2AtbSpeeds,
  type Ffx2ClockFlags,
  type Ffx2SpeedInput,
} from './atb-clock.ts';
import { Ffx2AtbState, atbChrStep, type Ffx2AtbStepChr } from './atb-gauge.ts';

/** One character as {@link atbTick} sees it. */
export interface Ffx2AtbUnit {
  id: number;
  chr: Ffx2AtbStepChr;
  /** The speed inputs; `base` is overwritten with the battle's base speed. Omit to give the character no speed. */
  speed?: Omit<Ffx2SpeedInput, 'base'>;
  /** `Chr+0xe69`: 1 a girl (the menu), 2 a monster (its script), 3 a player-side monster (its AI). */
  mode: number;
  /** Confusion (group 1 index 6, status word 1 bit 0x40) is on. */
  confused: boolean;
  /** Berserk (group 1 index 7, bit 0x80) is on. */
  berserk: boolean;
}

/** The answers of the action-request code, supplied by the caller (the menu, the scripts). */
export interface Ffx2AtbRequests {
  /** The hand-off request `MsActionRequest(id, 0xff, 1, 1)` for a character just served from the ready list; true when it produced a command (the game's 9). */
  ready(id: number): boolean;
  /**
   * The per-step request of a character in state 5 (script), 6 (AI of a player-side monster), 7 (Confusion) or 8
   * (Berserk). Returns the state byte to store: {@link requestState} of "a command was produced" for 5, 7 and 8; the
   * AI request of state 6 chooses its own (2 when it declines, with a thinking time of its candidate count plus 10).
   */
  poll(id: number, state: number): number;
}

/** What a script / Confusion / Berserk request stores as the new state: 9 when it produced (or already had) a command, else IDLE. */
export function requestState(produced: boolean): number {
  return produced ? Ffx2AtbState.Executing : Ffx2AtbState.Idle;
}

/** Battle-wide inputs of {@link atbTick}. */
export interface Ffx2AtbTickContext {
  /** `ATB_speed[config]` (VA 0x00df7818). */
  baseSpeed: number;
  /** The thinking tick (VA 0x00df781c): 1. */
  thinkingTick: number;
  /** VA 0x00e12434: when non-zero a Confused or Berserk character is not moved to state 7 or 8. 0 in play (nothing sets it). */
  confuseOverride?: boolean;
}

/** Result of {@link atbTick}. */
export interface Ffx2AtbTickResult {
  units: Ffx2AtbUnit[];
  /** Per unit, in ascending id order (the order of `units` in this result): the speeds computed this step. */
  speeds: Ffx2AtbSpeeds[];
  /** Ids that became ready this step, in the order the game hands them to the action request. */
  readyOrder: number[];
  /** Ids that finished recovery this step (Defense cleared), in slot order. */
  recoveryEnded: number[];
  /** Girls whose command menu opened (state 4) this step, in service order. */
  menuOpened: number[];
}

/**
 * The order the game serves a list of ready characters: repeatedly the one with the lowest recovery counter
 * (the most negative, i.e. the one whose last subtraction overshot most); a tie keeps list order.
 */
export function readyOrder(ready: ReadonlyArray<{ id: number; recovery: number }>): number[] {
  const pool = ready.map((r) => ({ ...r }));
  const out: number[] = [];
  while (pool.length > 0) {
    let best = 0;
    for (let k = 1; k < pool.length; k++) {
      const a = pool[k];
      const b = pool[best];
      if (a !== undefined && b !== undefined && a.recovery < b.recovery) best = k;
    }
    const picked = pool.splice(best, 1)[0];
    if (picked !== undefined) out.push(picked.id);
  }
  return out;
}

/** Inputs of {@link readyHandoff}. */
export interface Ffx2HandoffInput {
  /** `Chr+0xe69`: 1 a girl (the menu), 2 a monster (its script), 3 a player-side monster (its AI). */
  mode: number;
  /** Confusion (group 1 index 6, bit 0x40) is on. */
  confused: boolean;
  /** Berserk (group 1 index 7, bit 0x80) is on. */
  berserk: boolean;
  /** {@link Ffx2AtbTickContext.confuseOverride}. */
  confuseOverride?: boolean;
}

/**
 * What `MsChrATBprocess` does with a ready character whose request produced NO command: the new `Chr+0xe68`.
 *
 * - Confusion or Berserk: the character acts on its own, state 7 (Confusion) or 8 (Berserk, which wins when both are
 *   on). Neither opens a menu. (With the override flag set, which only a wrapper at 0x006340e0 that nothing calls ever sets, the state would stay
 *   READY and the character would never act.)
 * - otherwise by mode: 1 opens the command menu (state 4), 2 asks the script every step (5), 3 asks the AI (6);
 * - any other mode leaves the state at READY (3).
 *
 * (A debug switch for each side forces mode 1; it is off in play and not modelled.)
 */
export function readyHandoff(i: Ffx2HandoffInput): number {
  let state: number = Ffx2AtbState.Ready;
  let mode = i.mode << 24 >> 24;
  if (i.confused) {
    mode = 4;
    if (i.confuseOverride !== true) state = Ffx2AtbState.Confused;
  }
  if (i.berserk) {
    mode = 4;
    if (i.confuseOverride !== true) state = Ffx2AtbState.Berserk;
  }
  if (mode === 1) state = Ffx2AtbState.WaitCommand;
  else if (mode === 2) state = Ffx2AtbState.ScriptRequest;
  else if (mode === 3) state = Ffx2AtbState.AiRequest;
  return state;
}

/**
 * `MsChrATBprocess` (exe 0x006343a0) for the characters you list. Units are processed in ascending id order, as the
 * game walks its slots; a slot you do not list behaves like a character with ATB disabled (zero speeds, no step).
 * A closed gate changes nothing but the speeds and the thinking tick.
 */
export function atbTick(
  units: readonly Ffx2AtbUnit[],
  flags: Ffx2ClockFlags,
  ctx: Ffx2AtbTickContext,
  requests: Ffx2AtbRequests,
  opts: { skipThinking?: (id: number) => boolean } = {},
): Ffx2AtbTickResult {
  const order = [...units].sort((a, b) => a.id - b.id);
  const speeds: Ffx2AtbSpeeds[] = [];
  let next: Ffx2AtbUnit[] = order.map((u) => {
    const sp = u.chr.atbEnabled ? u.speed : undefined;
    const s = sp !== undefined ? atbSpeeds({ ...sp, base: ctx.baseSpeed }) : FFX2_NO_SPEEDS;
    speeds.push(s);
    return { ...u, chr: { ...u.chr, tick: s.tick, thinkingTick: sp !== undefined ? ctx.thinkingTick : 0 } };
  });
  const result: Ffx2AtbTickResult = { units: next, speeds, readyOrder: [], recoveryEnded: [], menuOpened: [] };
  if (!atbProcessGate(flags)) return result;

  // step 2: every slot takes its step, the ready ones are collected
  const ready: Array<{ id: number; recovery: number }> = [];
  next = next.map((u) => {
    const r = atbChrStep(u.chr, {
      flags,
      readyCount: ready.length,
      ...(opts.skipThinking?.(u.id) === true ? { skipThinking: true } : {}),
    });
    if (r.recoveryEnded) result.recoveryEnded.push(u.id);
    if (r.ready) ready.push({ id: u.id, recovery: r.recovery });
    return { ...u, chr: { ...u.chr, state: r.state, recovery: r.recovery, thinking: r.thinking, pendingAnimation: r.pendingAnimation } };
  });

  // step 3: serve the ready list, lowest recovery counter first
  result.readyOrder = readyOrder(ready);
  for (const id of result.readyOrder) {
    const at = next.findIndex((u) => u.id === id);
    const u = next[at];
    if (u === undefined) continue;
    let state: number;
    if (requests.ready(id)) {
      state = Ffx2AtbState.Executing;
    } else {
      state = readyHandoff({
        mode: u.mode,
        confused: u.confused,
        berserk: u.berserk,
        ...(ctx.confuseOverride === true ? { confuseOverride: true } : {}),
      });
      if (state === Ffx2AtbState.WaitCommand) result.menuOpened.push(id);
    }
    next[at] = { ...u, chr: { ...u.chr, state } };
  }

  // step 4: one request per step for every character in a polling state
  next = next.map((u) => {
    const s = u.chr.state;
    if (s < Ffx2AtbState.ScriptRequest || s > Ffx2AtbState.Berserk) return u;
    return { ...u, chr: { ...u.chr, state: requests.poll(u.id, s) & 0xff } };
  });
  result.units = next;
  return result;
}
