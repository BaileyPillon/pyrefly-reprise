/**
 * FFX per-turn ticks: what the game does to a character's statuses when a turn starts and when it ends.
 *
 * **Game case: FFX only** (FFX-2 times its statuses with its own gauge in its own exe). Source: FFX.exe, Steam build
 * 25501027, SHA-256 0537B2A1...686D. Spec: `research/re-ffx-ctb-status.md` section 14. Pure and deterministic, no random
 * draw anywhere in these functions. Each function below is proven against the machine code run in the emulator
 * (`tests/unit/parity-ffx-turn-ticks.test.ts`, vectors in `tests/fixtures/parity/ffx/turn_ticks.json`); the engine runs
 * them through `src/battle/ffx/adapt/ticks.ts` (re-parity W2).
 *
 * Exe addresses (all FFX.exe):
 * - 0x007af390  end of a holder's own turn: the counters whose behaviour byte has bit 4 count down by one
 * - 0x007af4f0  start of ANY turn: Regen pays every holder, the actor's start-of-turn counters, its stances, the
 *               Threaten release
 * - 0x007afab0  Poison, after an action whose results were applied
 * - 0x00799cd0  Doom countdown at the doomed character's own turn start
 * - 0x0078e410 / 0x0078e460  the Threaten link: both ends carry the Threaten bit and name each other
 *               (`./turn-ticks-link.ts`; the shapes and constants are in `./turn-ticks-types.ts`)
 *
 * What these functions do NOT model is presentation: the animation requests (a wake-up pose, the Regen glow, the
 * damage numbers) and the Sin-style scripted hit-point floors (two special scenes). Death handling after the hit
 * points reach 0 (`pp_BtlDamageCheckDeath`), the SOS refresh (`FUN_007af260`) and the Auto-Life revival stay with the
 * engine's own KO path.
 */

import { ctbAfterAction, delayForRank } from './ctb.ts';
import { mul, udiv } from './int32.ts';
import { TEMPORAL_STATUS_FLAGS, TemporalSlot } from './status-types.ts';
import {
  EVENT_AT_END,
  EVENT_AT_START,
  EXTRA_BOOST,
  EXTRA_DEFEND,
  EXTRA_DOOM,
  EXTRA_GUARD,
  EXTRA_SENTINEL,
  EXTRA_SHIELD,
  PERM_POISON,
  PERM_ZOMBIE,
  TICK_AT_END,
  TICK_AT_START,
  TICK_SLOTS,
  type TickChr,
  byte,
  checkSlot,
  cloneTickChr,
  subHp,
} from './turn-ticks-types.ts';
import { releaseThreaten } from './turn-ticks-link.ts';

export * from './turn-ticks-types.ts';
export { releaseThreaten, threatProcess } from './turn-ticks-link.ts';

// ---------------------------------------------------------------------------------------------- end of turn (0x7af390)

/** What the end-of-turn tick did to one character. */
export interface EndTickResult {
  /** The thirteen counters afterwards. */
  counters: number[];
  /** The counter slots that counted down (a counter of 1..253 whose behaviour byte has bit 4). */
  ticked: number[];
  /** The counter slots whose "event at the end of the turn" bit fired, with the value they counted down to. */
  events: Array<{ slot: number; value: number }>;
  /**
   * The presentation reaction the tick requests: a sleeper whose Sleep reached 0 wakes (`wake`, which ends the
   * function at once); otherwise a Silence or a Darkness that reached 0 asks for a recovery pose (`ended`).
   */
  reaction: 'wake' | 'ended' | 'none';
}

/**
 * `pp_BtlEndTurnStatusTick` (0x007af390), called by the action-done function after the actor's recovery has been
 * added to its CTB counter, so the Haste or Slow that ends here still halved or doubled that recovery.
 *
 * Nothing happens to a character that is not on the field. Otherwise each of the thirteen counters, in order, counts
 * down by one when it is 1..253 and its behaviour byte has bit 4 (Sleep, Silence, Darkness, Shell, Protect, Reflect,
 * Haste, Slow); 254 ("until removed") and 255 (given by equipment) never move, and Regen (bit 1 only) and the four
 * Nul charges (no bits) are untouched. A counter whose byte also has bit 8 fires an event unless the silent flag is
 * on (Sleep, Silence, Darkness, Haste, Slow).
 */
export function endOfTurnTick(chr: Pick<TickChr, 'inBattle' | 'silent' | 'counters'>): EndTickResult {
  const counters = chr.counters.map(byte);
  const ticked: number[] = [];
  const events: Array<{ slot: number; value: number }> = [];
  if (!chr.inBattle) return { counters, ticked, events, reaction: 'none' };
  const before = counters.slice();
  for (let slot = 0; slot < counters.length; slot++) {
    const flags = TEMPORAL_STATUS_FLAGS[slot] as number;
    const next = (counters[slot] as number) - 1;
    if (next < 0 || next > 0xfc || (flags & TICK_AT_END) === 0) continue;
    counters[slot] = next;
    ticked.push(slot);
    if ((flags & EVENT_AT_END) !== 0 && !chr.silent) events.push({ slot, value: next });
  }
  let reaction: EndTickResult['reaction'] = 'none';
  if (before[TemporalSlot.Sleep] !== 0 && counters[TemporalSlot.Sleep] === 0) reaction = 'wake';
  else if (
    (before[TemporalSlot.Silence] !== 0 && counters[TemporalSlot.Silence] === 0) ||
    (before[TemporalSlot.Darkness] !== 0 && counters[TemporalSlot.Darkness] === 0)
  ) {
    reaction = 'ended';
  }
  return { counters, ticked, events, reaction };
}

// --------------------------------------------------------------------------------------------- start of turn (0x7af4f0)

/** One Regen payout. */
export interface RegenPayout {
  slot: number;
  /** `(tickCounter * maxHp >> 8) + 100`. */
  amount: number;
  /** True when the holder is a Zombie: the payout is damage. */
  damage: boolean;
  hpBefore: number;
  hpAfter: number;
}

/** What the start-of-turn tick did. */
export interface StartTickResult {
  /** All 31 characters afterwards. */
  chrs: TickChr[];
  /** The Regen payouts, in slot order. */
  payouts: RegenPayout[];
  /** The slots whose tick counter was reset to 0 (every holder that passed the Regen conditions). */
  resets: number[];
  /** The counter slots of the ACTOR that counted down at the start of its turn, and the events that fired. */
  ticked: number[];
  events: Array<{ slot: number; value: number }>;
  /** The extra-status stances the actor lost (Defend 0x800, Guard 0x1000, Sentinel 0x2000, Shield 0x40, Boost 0x80). */
  stancesCleared: number[];
}

/** `(tickCounter * maxHp >> 8) + 100`: the amount a Regen holder is paid (32-bit multiply, logical shift). */
export function regenAmount(tickCounter: number, maxHp: number): number {
  return ((mul(tickCounter & 0xff, maxHp | 0) >>> 8) + 100) | 0;
}

/** Does a holder get its Regen payout when somebody's turn starts? (Regen counter, on the field, HP above 0, not dead, not Petrified.) */
export function regenHolderReady(c: TickChr): boolean {
  return (c.counters[TemporalSlot.Regen] as number) !== 0 && c.inBattle && c.hp > 0 && !c.dead && !c.petrified;
}

/**
 * `pp_BtlStartTurnTick` (0x007af4f0) for the character `actor` whose turn is starting.
 *
 * 1. When the actor is on the field and its turn is not a re-entered one: every holder (slots 0..0x1e, in order) with
 *    a Regen counter, on the field, with HP above 0, neither dead nor Petrified, is paid `regenAmount` and has its
 *    tick counter reset to 0; a Zombie takes the payout as damage. A holder that meets the conditions has its tick
 *    counter reset even when nothing is paid. Then the actor's own counters whose behaviour byte has bit 1 (only
 *    Regen) count down when they are 1..253, firing the bit-2 event.
 * 2. Always, on the actor: Defend, Guard, Sentinel, Shield and Boost end unless the equipment gives them.
 * 3. Always, on the actor: the Threaten release ({@link releaseThreaten}).
 *
 * The hit-point change of a payout is `pp_BtlSubHp`: `HP = clamp(HP - amount, 0, maxHP)`.
 */
export function startOfTurnTick(chrs: readonly TickChr[], actor: number): StartTickResult {
  checkSlot(actor);
  let next = chrs.map(cloneTickChr);
  const payouts: RegenPayout[] = [];
  const resets: number[] = [];
  const ticked: number[] = [];
  const events: Array<{ slot: number; value: number }> = [];
  const stancesCleared: number[] = [];
  const me = (): TickChr => next[actor] as TickChr;

  if (me().inBattle && !me().reentered) {
    for (let slot = 0; slot < TICK_SLOTS; slot++) {
      const h = next[slot] as TickChr;
      if (!regenHolderReady(h)) continue;
      const amount = regenAmount(h.tickCounter, h.maxHp);
      if (amount > 0) {
        const damage = (h.perm & PERM_ZOMBIE) !== 0;
        const hpAfter = subHp(h.hp, damage ? amount : -amount, h.maxHp);
        payouts.push({ slot, amount, damage, hpBefore: h.hp, hpAfter });
        h.hp = hpAfter;
      }
      h.tickCounter = 0;
      resets.push(slot);
    }
    const a = me();
    for (let slot = 0; slot < a.counters.length; slot++) {
      const flags = TEMPORAL_STATUS_FLAGS[slot] as number;
      const value = (a.counters[slot] as number) - 1;
      if (value < 0 || value > 0xfc || (flags & TICK_AT_START) === 0) continue;
      a.counters[slot] = value;
      ticked.push(slot);
      if ((flags & EVENT_AT_START) !== 0) events.push({ slot, value });
    }
  }

  const a = me();
  for (const bit of [EXTRA_DEFEND, EXTRA_GUARD, EXTRA_SENTINEL, EXTRA_SHIELD, EXTRA_BOOST]) {
    if ((a.extra & bit) !== 0 && (a.autoExtra & bit) === 0) {
      a.extra = a.extra & ~bit & 0xffff;
      stancesCleared.push(bit);
    }
  }
  next = releaseThreaten(next, actor);
  return { chrs: next, payouts, resets, ticked, events, stancesCleared };
}

// ------------------------------------------------------------------------------------------ action done (0x7b20e0)

/** The character fields the action-done function reads and writes for the entry that ends a turn. */
export interface ActionDoneChr {
  /** 0x65c: the CTB counter. */
  ctb: number;
  /** 0xde8: the rank of the action that was just done (the last command's rank byte; 3 when it was 0 or absent). */
  rank: number;
  /** 0x5ac: Agility. */
  agi: number;
  /** 0x608..0x614: the thirteen temporal counters (Haste is slot 11, Slow slot 12). */
  counters: number[];
  inBattle: boolean;
  silent: boolean;
  /** 0x606. */
  perm: number;
  dead: boolean;
  /** 0xdf8: set while a character is leaving the field; keeps the Poison marker off. */
  skipPoison: boolean;
}

export interface ActionDoneResult {
  /** 0x65c afterwards: the old counter plus the recovery, as a byte (it wraps, nothing clamps it). */
  ctb: number;
  /** The recovery that was added: `HasteSlow(tickSpeed(AGI) * max(rank, 1))`. */
  recovery: number;
  /** The end-of-turn tick that followed it. */
  end: EndTickResult;
  /** True when the Poison marker was set to this character. */
  poisonMarked: boolean;
}

/**
 * The Poison marker of `pp_BtlActionDone` (0x007b20e0): set to the actor when the action's results were applied
 * (`resultsApplied`: a normal action; a passed turn, a sleeper's, calls the function with 0) and the actor is
 * Poisoned, on the field, not dead and not leaving the field (`skipPoison`, `Chr+0xdf8`).
 */
export function poisonMarked(
  c: Pick<ActionDoneChr, 'perm' | 'dead' | 'inBattle'> & { skipPoison?: boolean },
  resultsApplied: boolean,
): boolean {
  return resultsApplied && (c.perm & PERM_POISON) !== 0 && !c.dead && c.inBattle && c.skipPoison !== true;
}

/**
 * The turn-ending entry of `pp_BtlActionDone` (0x007b20e0), in the game's order: the recovery is added to the CTB
 * counter using the Haste and Slow counters AS THEY STAND (so the Haste that ends in the tick below still halved this
 * recovery), then the end-of-turn tick, then the costs (MP and Overdrive, not modelled), and last the Poison marker
 * ({@link poisonMarked}).
 */
export function actionDone(c: ActionDoneChr, resultsApplied: boolean): ActionDoneResult {
  const recovery = delayForRank(c.agi, c.rank, c.counters[TemporalSlot.Haste] as number, c.counters[TemporalSlot.Slow] as number);
  const end = endOfTurnTick(c);
  return { ctb: ctbAfterAction(c.ctb, recovery), recovery, end, poisonMarked: poisonMarked(c, resultsApplied) };
}

// ------------------------------------------------------------------------------------------------------- Poison (0x7afab0)

/** What the Poison tick did. */
export interface PoisonResult {
  /** The marker afterwards: always 0xff (VA 0x0112c9e4 is cleared by every call). */
  marker: number;
  /** True when this character was the marked one and was paid. */
  fired: boolean;
  /** `poisonPercent * maxHp / 100` (unsigned 32-bit), 0 when nothing fired. */
  amount: number;
  hpAfter: number;
}

/**
 * `pp_BtlPoisonTick` (0x007afab0) for the character `id`. If the marker names this character the damage is
 * `Chr+0x5ba * maxHP / 100`, an unsigned 32-bit product and divide, taken by `pp_BtlSubHp` (clamped at 0 and maxHP);
 * the marker is cleared whoever was named. The party's percentage is 25 (every player slot); a monster's is its
 * record's byte.
 */
export function poisonTick(c: Pick<TickChr, 'hp' | 'maxHp' | 'poisonPercent'>, id: number, marker: number): PoisonResult {
  const fired = (marker << 24 >> 24) === id;
  if (!fired) return { marker: 0xff, fired: false, amount: 0, hpAfter: c.hp | 0 };
  const amount = udiv(mul(c.poisonPercent & 0xff, c.maxHp | 0), 100) | 0;
  return { marker: 0xff, fired: true, amount, hpAfter: subHp(c.hp, amount, c.maxHp) };
}

// -------------------------------------------------------------------------------------------------------- Doom (0x799cd0)

/** What the Doom tick did. */
export interface DoomResult {
  /** `Chr+0x5c8` afterwards. */
  counter: number;
  /** True when the countdown ran out and the Doom kill (command 0x3120, aimed at the doomed character) was queued. */
  fires: boolean;
}

/**
 * `pp_BtlDoomTick` (0x00799cd0) at the start of the doomed character's own turn, after the start-of-turn tick. Needs
 * the Doom extra bit, a turn that is not re-entered, and an action buffer to fill (the turn dispatcher always has
 * one). A counter above 0 goes down by one; a counter that is then 0 queues the Doom kill, so a counter that already
 * stood at 0 kills at once. The kill is an action of the doomed character against itself.
 */
export function doomTick(c: Pick<TickChr, 'extra' | 'reentered' | 'doomCounter'>, hasActionBuffer = true): DoomResult {
  let counter = c.doomCounter & 0xff;
  if ((c.extra & EXTRA_DOOM) === 0 || c.reentered || !hasActionBuffer) return { counter, fires: false };
  if (counter !== 0) counter -= 1;
  return { counter, fires: counter === 0 };
}
