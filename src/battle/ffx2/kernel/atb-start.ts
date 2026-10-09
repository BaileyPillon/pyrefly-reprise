/**
 * FFX-2 ATB kernel, part 4: how a battle's gauges start: the random opening bar, the reset a preemptive
 * strike or an ambush applies, and the roll that decides which of the two happens.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69). Spec:
 * `research/re-ffx2-atb-status.md` section 4. Pure, deterministic; randomness comes from a `draw(stream)`
 * callback (`./rng.ts`). Not wired into the engine (`ffx2/setup.ts` seeds `floor(required * rand(0, 60) / 100)`).
 *
 * Exe addresses (live build):
 * - 0x00634700  MsChrAtbInit: the full gauge, the random start, the mode byte
 * - 0x00634870  MsChrAtbReset: the preemptive / ambush gauge
 * - 0x00618b60  MsCalcFirstAttack: the preemptive / ambush roll (fixed stream 1)
 *
 * Opening bars are a fraction of the character's own full gauge, `cost(0x302d) * 10000 / (AGI + 1)`. Command
 * 0x302d is Attack, whose ATB cost is 70 in the shipped command table, so the full gauge is the same
 * `10000 * 70 / (AGI + 1)` the engine calls `required`.
 *
 * Who calls what. At battle load every character in play gets `MsChrAtbInit(chr, 0, 0)`: the party's three from
 * the routine at 0x00626910 (called at 0x006272a4) and every monster from 0x00627820 (called at 0x0060a8d3). A
 * girl who joins mid-battle (the party exchange, 0x006318f0) gets `(chr, 0, -1)`, keeping her thinking base; a
 * character who has just been knocked out gets `(chr, 1, -1)`, whose opening bar is the full gauge (no random
 * start, and being dead rules out Initiative), so a revived character waits a whole recovery. Changing dress
 * (0x0061c650 calling 0x00626910 with its second argument 1) does not touch the gauge. The preemptive / ambush
 * roll comes later, from the battle state machine (0x00609e12), and its resets overwrite the opening bars.
 */

import { clampInt, sdiv } from './intops.ts';
import { Ffx2FixedStream, Ffx2RngKind, drawValue, rngStreamForChr, type Ffx2Draw } from './rng.ts';
import { FFX2_ATB_COUNTER_MAX } from './atb-clock.ts';
import { thinkingTime } from './atb-gauge.ts';

/** The command whose ATB cost sets every character's full gauge at battle start (Attack). */
export const FFX2_START_COMMAND_ID = 0x302d;

/** Inputs of {@link atbInit}. */
export interface Ffx2AtbInitInput {
  /** `Chr+0xc`, the character's own slot id (picks the purpose-0 stream). */
  chrId: number;
  /** The agility byte `Chr+0x39a`. */
  agi: number;
  /** `Cmd+0x22` of command 0x302d. */
  costAtb: number;
  /** `Chr+0x9e0`, consumed. */
  carry: number;
  /** Second argument of the call is 0: roll a random start. 0 at battle start; 1 when a KO resets the gauge. */
  randomStart: boolean;
  /** `FUN_00613360`: the character is dead or petrified. */
  deadOrStone: boolean;
  /** `Chr+0x650` bit 0 (Initiative, `ABILITY_LEAD`). */
  lead: boolean;
  /** Monster slot (15 to 30). */
  isMonster: boolean;
  /** `pp_is_aided_chr`: a monster that fights on the player's side. */
  aided: boolean;
  /** Third argument: the thinking base to store (0 at battle start), or a negative number to keep the old one. */
  thinkingBaseArg: number;
  /** `Chr+0x9f8` before the call, and the party counts the thinking time of a monster reads (see {@link thinkingTime}). */
  thinking: { baseBefore: number; partyCount: number; partyStanding: number };
}

/** What `MsChrAtbInit` writes. */
export interface Ffx2AtbInitResult {
  /** `Chr+0x9dc`: the full gauge, `clamp(carry + cost * 10000 / (AGI + 1), 0, 99999)`. */
  full: number;
  /** `Chr+0x9d8`: the opening recovery counter. */
  start: number;
  /** `Chr+0xe69`: 1 a girl, 2 a monster, 3 a player-side monster. */
  mode: number;
  /** `Chr+0x9f8` after the call. */
  thinkingBase: number;
  /** `Chr+0x9f4`: the thinking counter. */
  thinking: number;
  /** `Chr+0x9e0` after the call. */
  carry: number;
}

/**
 * `MsChrAtbInit` (exe 0x00634700). The state byte becomes IDLE (0); then, in this order:
 *
 *     r     = draw(purpose 0)                                  (always, even when the result is not used)
 *     full  = clamp(carry + costAtb * 10000 / (AGI + 1), 0, 99999)
 *     start = full
 *     if randomStart and not (dead or petrified):   start = ((r & 0x3f) + 0x20) * full / 128     25 to 74 percent
 *     if not (dead or petrified) and lead:           start = 0                                   ready at once
 *     thinking base T = thinkingBaseArg if it is >= 0, else unchanged;  thinking = thinkingTime(T)
 *
 * The thinking time may draw a second value (only when T > 0). Both gauges start from the character's own
 * full value, so a slower character has a longer opening wait in absolute terms.
 */
export function atbInit(i: Ffx2AtbInitInput, draw: Ffx2Draw): Ffx2AtbInitResult {
  const r = drawValue(draw, rngStreamForChr(i.chrId, Ffx2RngKind.Variance));
  const full = clampInt((i.carry + sdiv(Math.imul(i.costAtb & 0xffff, 10000), (i.agi & 0xff) + 1)) | 0, 0, FFX2_ATB_COUNTER_MAX);
  let start = full;
  if (i.randomStart && !i.deadOrStone) start = sdiv(Math.imul((r & 0x3f) + 0x20, full), 128);
  const mode = i.isMonster ? 2 : i.aided ? 3 : 1;
  const thinkingBase = i.thinkingBaseArg >= 0 ? i.thinkingBaseArg : i.thinking.baseBefore;
  if (!i.deadOrStone && i.lead) start = 0;
  const thinking = thinkingTime(
    { chrId: i.chrId, base: thinkingBase, isMonster: i.isMonster, partyCount: i.thinking.partyCount, partyStanding: i.thinking.partyStanding },
    draw,
  );
  return { full, start, mode, thinkingBase, thinking, carry: 0 };
}

/** Inputs of {@link atbReset}. */
export interface Ffx2AtbResetInput {
  chrId: number;
  /** 0: the side that struck first (a girl is ready at once, a monster waits 0 to 11 percent); non-zero: the surprised side. */
  kind: number;
  /** `Chr+0x9dc`, the full gauge. */
  full: number;
  isMonster: boolean;
  /** `Chr+0x650` bit 0 (Initiative): the reset leaves the counter alone. */
  lead: boolean;
  /** `FUN_00613360`: dead or petrified: the counter is left alone. */
  deadOrStone: boolean;
  /** `Chr+0x9d8` before. */
  recovery: number;
}

/**
 * `MsChrAtbReset` (exe 0x00634870), used after a preemptive strike or an ambush:
 *
 *     r = draw(purpose 0) & 15
 *     kind 0:  r = 0 for a girl;  v = r * full / 128                       (girl 0, monster 0 to 11.7 percent)
 *     kind 1:  v = (113 + r) * full / 128                                  (88.3 to 100 percent of a full wait)
 *     the counter becomes v unless the character has Initiative or is dead or petrified
 *
 * One draw per call, always. The return value is `v` even when it was not stored.
 */
export function atbReset(i: Ffx2AtbResetInput, draw: Ffx2Draw): { value: number; recovery: number; wrote: boolean } {
  let r = drawValue(draw, rngStreamForChr(i.chrId, Ffx2RngKind.Variance)) & 0xf;
  let base = 0;
  if (i.kind === 0) r = i.isMonster ? r : 0;
  else base = 0x71;
  const value = sdiv(Math.imul(base + r, i.full), 128);
  const wrote = !i.lead && !i.deadOrStone;
  return { value, recovery: wrote ? value : i.recovery, wrote };
}

/** Inputs of {@link firstAttackRoll}. */
export interface Ffx2FirstAttackInput {
  /** The byte at VA 0x00df84a5 before the call: non-zero means the battle's opening was decided elsewhere (1 preemptive, 2 ambush). */
  preset: number;
  /** Party members in battle holding the First Strike auto-ability (`Chr+0x650` bit 1), summed. */
  firstStrikeCount: number;
  /** Average agility byte of the party side in battle (integer division of the sum; 0 for an empty side). */
  partyAgi: number;
  /** Average agility byte of the monsters in battle. */
  monsterAgi: number;
}

/** Result of {@link firstAttackRoll}. */
export interface Ffx2FirstAttackResult {
  /** 0 normal, 1 the party strikes first (preemptive), 2 ambushed. */
  result: number;
  /** Which `kind` of {@link atbReset} each side then gets (`null`: no reset). */
  resets: { party: number | null; monsters: number | null };
}

/** Average of agility bytes the way `pp_btl_get_stat` computes it: sum over count, toward zero, 0 when empty. */
export function averageAgi(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v & 0xff;
  return sdiv(sum, values.length);
}

/**
 * `MsCalcFirstAttack` (exe 0x00618b60): the preemptive / ambush roll, two draws from fixed stream 1 (taken
 * up front, whether or not both are used), unless the opening is already decided.
 *
 *     P = partyAgi, after First Strike:  P = (n + 3) * P / 2  if n > 0           then P += 1
 *     M = monsterAgi + 1
 *     a = draw1 & 255,   b = draw2 & 255
 *     if a + (P * 100 / M) / 5  >= 255:                 preemptive (1)
 *     else if n == 0 and b + (M * 100 / P) / 5 >= 255:  ambush (2)
 *     else normal (0)
 *
 * A party that is much faster than the monsters is preemptive on almost every roll; an equal party only on
 * `a >= 235`, about 8 percent.
 */
export function firstAttackRoll(i: Ffx2FirstAttackInput, draw: Ffx2Draw): Ffx2FirstAttackResult {
  let result = (i.preset << 24) >> 24; // a signed char in the game
  if (result === 0) {
    let p = i.partyAgi | 0;
    if (i.firstStrikeCount !== 0) p = sdiv(Math.imul((i.firstStrikeCount + 3) | 0, p), 2);
    const m = (i.monsterAgi + 1) | 0;
    p = (p + 1) | 0;
    const a = drawValue(draw, Ffx2FixedStream.FirstStrike) & 0xff;
    const ratio = sdiv(Math.imul(p, 100), m);
    const b = drawValue(draw, Ffx2FixedStream.FirstStrike) & 0xff;
    if (a + sdiv(ratio, 5) < 0xff) {
      if (i.firstStrikeCount === 0 && 0xfe < b + sdiv(sdiv(Math.imul(m, 100), p), 5)) result = 2;
    } else {
      result = 1;
    }
  }
  if (result === 1) return { result, resets: { party: 0, monsters: 1 } };
  if (result === 2) return { result, resets: { party: 1, monsters: 0 } };
  return { result, resets: { party: null, monsters: null } };
}

/** A character as {@link applyFirstAttack} needs it. */
export interface Ffx2FirstAttackChr {
  /** `Chr+0x9dc`, the full gauge. */
  full: number;
  /** Initiative (`Chr+0x650` bit 0). */
  lead: boolean;
  /** Dead or petrified. */
  deadOrStone: boolean;
  /** `Chr+0x9d8` before. */
  recovery: number;
}

/**
 * The resets that follow a preemptive strike (result 1) or an ambush (result 2): `MsChrAtbReset` is called for ALL 31
 * slots in ascending order, whether or not a character stands in the slot, so it makes exactly 31 draws, one from
 * each slot's own purpose-0 stream. Slots 0 to 14 are the party side, 15 to 30 the monsters. Returns the new
 * recovery counters (a character with Initiative, or dead or petrified, keeps its old counter). Any other result
 * does nothing and draws nothing. `chrs` must hold 31 entries.
 */
export function applyFirstAttack(result: number, chrs: readonly Ffx2FirstAttackChr[], draw: Ffx2Draw): number[] {
  if (chrs.length !== 31) throw new RangeError('the first-attack resets need all 31 slots');
  const plan = result === 1 ? { party: 0, monsters: 1 } : result === 2 ? { party: 1, monsters: 0 } : null;
  return chrs.map((c, id) => {
    if (plan === null) return c.recovery;
    const monster = id >= 15;
    return atbReset(
      { chrId: id, kind: monster ? plan.monsters : plan.party, full: c.full, isMonster: monster, lead: c.lead, deadOrStone: c.deadOrStone, recovery: c.recovery },
      draw,
    ).recovery;
  });
}

/** A character as {@link openingTrim} needs it. */
export interface Ffx2TrimChr {
  /** `Chr+0x1789`. */
  atbEnabled: boolean;
  /** `Chr+0x1784`. */
  inBattle: boolean;
  /** `Chr+0x1787` non-zero. */
  dead: boolean;
  /** Status word 1 bit 1. */
  petrified: boolean;
  /** `Chr+0x9d8`. */
  recovery: number;
}

/**
 * The opening trim (exe 0x00634280, called once from the battle state machine at 0x00609e4d, right after the
 * preemptive / ambush roll and just before the battle enters its running state). It finds the SMALLEST recovery
 * counter among the characters that take part in the ATB, are in the battle and are not dead, and, if that
 * counter is above 0, subtracts two thirds of it (`floor(2 * min / 3)`) from the recovery counter of EVERY slot
 * that is not dead or petrified, in the battle or not, with no clamp. The first character to act therefore starts
 * with a third of its (already shortened) wait left. Returns the amount subtracted, or the smallest counter itself
 * when that was 0 or less (nothing is subtracted). `chrs` must hold 31 entries.
 */
export function openingTrim(chrs: readonly Ffx2TrimChr[]): { ret: number; recovery: number[] } {
  if (chrs.length !== 31) throw new RangeError('the opening trim needs all 31 slots');
  let best = 0;
  let found = false;
  for (const c of chrs) {
    if (!c.atbEnabled || !c.inBattle || c.dead) continue;
    if (!found || c.recovery < best) {
      best = c.recovery;
      found = true;
    }
  }
  if (best <= 0) return { ret: best, recovery: chrs.map((c) => c.recovery) };
  const cut = sdiv(Math.imul(2, best), 3);
  return { ret: cut, recovery: chrs.map((c) => (c.dead || c.petrified ? c.recovery : (c.recovery - cut) | 0)) };
}
