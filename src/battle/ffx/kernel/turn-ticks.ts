/**
 * FFX per-turn ticks: what the game does to a character's statuses when a turn starts and when it ends.
 *
 * **Game case: FFX only** (FFX-2 times its statuses with its own gauge in its own exe). Source: FFX.exe, Steam build
 * 25501027, SHA-256 0537B2A1...686D. Spec: `research/re-ffx-ctb-status.md` section 14. Pure and deterministic, no random
 * draw anywhere in these functions. Each function below is proven against the machine code run in the emulator
 * (`tests/unit/parity-ffx-turn-ticks.test.ts`, vectors in `tests/fixtures/parity/ffx/turn_ticks.json`).
 *
 * Exe addresses (all FFX.exe):
 * - 0x007af390  end of a holder's own turn: the counters whose behaviour byte has bit 4 count down by one
 * - 0x007af4f0  start of ANY turn: Regen pays every holder, the actor's start-of-turn counters, its stances, the
 *               Threaten release
 * - 0x007afab0  Poison, after an action whose results were applied
 * - 0x00799cd0  Doom countdown at the doomed character's own turn start
 * - 0x0078e410 / 0x0078e460  the Threaten link: both ends carry the Threaten bit and name each other
 *
 * Notation: `Chr+0xNNN` is an offset into the battle character structure (stride 0xF90, ids 0..0x1e). A slot is a
 * character id. The thirteen temporal counters are `Chr+0x608..0x614` in the order of `TemporalSlot`.
 *
 * What these functions do NOT model is presentation: the animation requests (a wake-up pose, the Regen glow, the
 * damage numbers) and the Sin-style scripted hit-point floors (two special scenes). Death handling after the hit
 * points reach 0 (`pp_BtlDamageCheckDeath`), the SOS refresh (`FUN_007af260`) and the Auto-Life revival stay with the
 * engine's own KO path.
 */

import { ctbAfterAction, delayForRank } from './ctb.ts';
import { mul, udiv } from './int32.ts';
import { TEMPORAL_STATUS_FLAGS, TemporalSlot } from './status-types.ts';

/** Behaviour bits of the temporal table (byte 3 of each 4-byte record, VA 0x00c42464). */
const TICK_AT_START = 0x01;
const EVENT_AT_START = 0x02;
const TICK_AT_END = 0x04;
const EVENT_AT_END = 0x08;

/** Permanent-word bits this file reads. */
const PERM_ZOMBIE = 0x0002;
const PERM_POISON = 0x0008;
const PERM_THREATEN = 0x0800;

/** Extra-word bits the stance clears and Doom read. */
const EXTRA_SHIELD = 0x0040;
const EXTRA_BOOST = 0x0080;
const EXTRA_DEFEND = 0x0800;
const EXTRA_GUARD = 0x1000;
const EXTRA_SENTINEL = 0x2000;
const EXTRA_DOOM = 0x4000;

/** The number of character slots the exe walks (ids 0..0x1e) and the "no partner" byte of a Threaten link. */
export const TICK_SLOTS = 31;
export const NO_PARTNER = 0xff;

/** The command the Doom countdown queues when it runs out: the Doom kill, record 0x3120 (VA 0x00ff3120). */
export const DOOM_KILL_COMMAND = 0x3120;

/** One character as the tick functions read and write it. Offsets are `Chr+...`. */
export interface TickChr {
  /** 0xdc8: on the field. */
  inBattle: boolean;
  /** 0xdcc: dead (the death handler has run). */
  dead: boolean;
  /** 0xdce: Petrified, as of the last time a hit record was copied back (`perm >> 2 & 1`). */
  petrified: boolean;
  /** 0xdcb: the silent flag that stops the status-tick event (set while a character is leaving or arriving). */
  silent: boolean;
  /** 0x716: the turn is being re-entered (a refused command or a hand-off); the start-of-turn tick is skipped. */
  reentered: boolean;
  /** 0x5d0 (s32) and 0x594 (s32). */
  hp: number;
  maxHp: number;
  /** 0x606 (u16): permanent statuses. */
  perm: number;
  /** 0x608..0x614: the thirteen temporal counters. */
  counters: number[];
  /** 0x616 (u16): extra statuses; 0x62e (u16): the extra statuses given by equipment. */
  extra: number;
  autoExtra: number;
  /** 0x6d2: ticks since the last Regen payout (saturates at 255). */
  tickCounter: number;
  /** 0x5c5: who threatened this character (0xff none); 0x5c6: whom this character threatened (0xff none). */
  threatenedBy: number;
  threatening: number;
  /** 0x5c8: the Doom countdown. */
  doomCounter: number;
  /** 0x5ba: the Poison tick percentage of maximum HP. */
  poisonPercent: number;
}

export function cloneTickChr(c: TickChr): TickChr {
  return { ...c, counters: c.counters.slice() };
}

const byte = (v: number): number => v & 0xff;

/** `pp_Clamp(v, 0, hi)` as the exe writes it: raise to 0 first, then lower to `hi` (so `hi` wins when it is below 0). */
function clampHp(v: number, hi: number): number {
  let x = v | 0;
  if (x < 0) x = 0;
  if (hi < x) x = hi;
  return x;
}

/** `pp_BtlSubHp`'s hit-point part: `HP = clamp(HP - amount, 0, maxHP)` in 32-bit arithmetic. */
export function subHp(hp: number, amount: number, maxHp: number): number {
  return clampHp((hp - amount) | 0, maxHp | 0);
}

function checkSlot(slot: number): void {
  if (!Number.isInteger(slot) || slot < 0 || slot >= TICK_SLOTS) throw new RangeError(`FFX tick kernel: slot ${slot} is outside 0..${TICK_SLOTS - 1}`);
}

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

// -------------------------------------------------------------------------------------------- Threaten link (0x78e460)

/**
 * `fh_MsThreatProcess` (0x0078e460, Fahrenheit's name) for the character `id`, called with the link already changed.
 *
 * - With the character's Threaten bit SET (a Threaten has just landed on it): `Chr+0x5c5` names the user. The user
 *   gets the Threaten bit as well and `Chr+0x5c6` := this character, so both ends of the pair carry the bit and name
 *   each other. A user byte of 0xff makes no link.
 * - With the bit CLEAR (it has been cleared): the partner is `Chr+0x5c5`, or `Chr+0x5c6` when that is 0xff. This
 *   character's two link bytes become 0xff; the partner, when there is one, loses its Threaten bit and its two link
 *   bytes as well.
 *
 * The id bytes are character ids 0..0x1e or 0xff; the exe would index memory outside the character array for any
 * other byte, which the game never writes, so a byte outside that range is refused. The input is not modified.
 */
export function threatProcess(chrs: readonly TickChr[], id: number): TickChr[] {
  checkSlot(id);
  const out = chrs.map(cloneTickChr);
  const me = out[id] as TickChr;
  let partnerId = me.threatenedBy & 0xff;
  if ((me.perm & PERM_THREATEN) !== 0) {
    if (partnerId !== NO_PARTNER) {
      checkSlot(partnerId);
      const partner = out[partnerId] as TickChr;
      partner.perm = (partner.perm | PERM_THREATEN) & 0xffff;
      partner.threatening = id;
    }
    return out;
  }
  if (partnerId === NO_PARTNER) partnerId = me.threatening & 0xff;
  me.threatenedBy = NO_PARTNER;
  me.threatening = NO_PARTNER;
  if (partnerId !== NO_PARTNER) {
    checkSlot(partnerId);
    const partner = out[partnerId] as TickChr;
    partner.perm = partner.perm & ~PERM_THREATEN & 0xffff;
    partner.threatenedBy = NO_PARTNER;
    partner.threatening = NO_PARTNER;
  }
  return out;
}

/**
 * `FUN_0078e410` (0x0078e410): release the Threaten link a character is part of. A character with the Threaten bit
 * and a recorded "I threatened" partner (`Chr+0x5c6`) is the USER of a pair; one with the bit and no such partner is
 * the TARGET. In both cases the bit leaves BOTH ends and both link bytes are reset; a character without the bit
 * changes nothing. It runs at the end of every start-of-turn tick, so a pair is dissolved at the start of whichever
 * end's turn comes first, and the death handler and the leave-the-field function run it for the character that dies
 * or leaves.
 */
export function releaseThreaten(chrs: readonly TickChr[], id: number): TickChr[] {
  checkSlot(id);
  const me = chrs[id] as TickChr;
  if ((me.perm & PERM_THREATEN) === 0) return chrs.map(cloneTickChr);
  const partnerId = me.threatening & 0xff;
  const at = partnerId !== NO_PARTNER ? partnerId : id;
  checkSlot(at);
  const next = chrs.map(cloneTickChr);
  const cleared = next[at] as TickChr;
  cleared.perm = cleared.perm & ~PERM_THREATEN & 0xffff;
  return threatProcess(next, at);
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
 * The turn-ending entry of `pp_BtlActionDone` (0x007b20e0), in the game's order: the recovery is added to the CTB
 * counter using the Haste and Slow counters AS THEY STAND (so the Haste that ends in the tick below still halved this
 * recovery), then the end-of-turn tick, then the costs (MP and Overdrive, not modelled), and last the Poison marker:
 * set when the action's results were applied (`resultsApplied`: a normal action; a passed turn, a sleeper's, calls
 * the function with 0) and the actor is Poisoned, on the field, not dead and not leaving.
 */
export function actionDone(c: ActionDoneChr, resultsApplied: boolean): ActionDoneResult {
  const recovery = delayForRank(c.agi, c.rank, c.counters[TemporalSlot.Haste] as number, c.counters[TemporalSlot.Slow] as number);
  const end = endOfTurnTick(c);
  const poisonMarked = resultsApplied && (c.perm & PERM_POISON) !== 0 && !c.dead && c.inBattle && !c.skipPoison;
  return { ctb: ctbAfterAction(c.ctb, recovery), recovery, end, poisonMarked };
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
