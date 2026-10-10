/**
 * The rolls and reads a game script makes, in our own words (re-parity AI-FFX2-b; **FFX-2 only**).
 *
 * The scripts of Shiva, the Magus Sisters, Anima, Paragon, the Oversoul Paragon and Trema roll with `random() mod n` and pick
 * their targets with the target searches (`research/re-ffx2-ai-bahamut-vegnagun.md` 1.3 and 1.4). This file is the one place
 * those two shapes live, so a decision table reads like the script:
 *
 * - **`random() mod n`** is the low 16 bits of one draw, taken modulo `n` ({@link scriptMod}). The engine keeps its one seeded
 *   stream (adopting each game's own streams is a separate batch), so a draw here is one `rng.int` and the *expression* is the
 *   script's. 65,536 is not a multiple of 3, 5 or 6, so those residues are not exactly even: the game's bias is kept, not
 *   smoothed (`mod 3` gives 21,846 / 21,845 / 21,845 of the 65,536 values).
 * - **A uniform target** (`searchr_nop`, and the `searchr` pick stood in for it where the engine has no battle geometry) keeps the
 *   living, targetable members in slot order and takes the `(value mod n)`-th; with one candidate **nothing is drawn**, with none
 *   there is no target ({@link pickUniform}). The value is a raw 31-bit draw, like the game's.
 * - **The reaction guard** (`getreaction`) is false when the actor is the one who caused the result, or is stopped, asleep,
 *   petrified, confused, berserk or ejected ({@link reactionGuard}).
 *
 * Nothing here is a number of the game's; every number is passed in by the script that owns it.
 */

import type { AbilityDef } from '../../common/types.ts';
import type { AiContext, Ffx2Unit } from '../internal.ts';
import { resolveCommand } from '../adapt/command.ts';

/** Raw value of one draw on the game's target-search stream (31 bits, the generator's width). */
const RAW_31 = 0x7fffffff;
/** `random()` returns the low 16 bits of a draw. */
const RAW_16 = 0xffff;

/** `random() mod n` (the script's `GetRandomValue` modulo `n`), one draw. */
export function scriptMod(ctx: AiContext, n: number): number {
  return ctx.rng.int(0, RAW_16) % n;
}

/** The party's living, targetable members in slot order (the order the target searches scan). */
export function girlsInSlotOrder(ctx: AiContext): Ffx2Unit[] {
  return [...ctx.party()].sort((a, b) => a.slot - b.slot);
}

/**
 * A uniform pick among `candidates` (already filtered and in slot order): the `(draw mod n)`-th, no draw below two candidates,
 * `undefined` for none. The target search of the scripts that use `searchr_nop`; the near-weighted `searchr` of Paragon's
 * single-target Attacks needs positions and facing the engine does not model, so it is this pick too (the rows P3, listed).
 */
export function pickUniform<T>(ctx: AiContext, candidates: readonly T[]): T | undefined {
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];
  return candidates[ctx.rng.int(0, RAW_31) % candidates.length];
}

/** A uniform living girl as a target list: one id, or no target. */
export function pickGirl(ctx: AiContext): string[] {
  const girl = pickUniform(ctx, girlsInSlotOrder(ctx));
  return girl === undefined ? [] : [girl.id];
}

/** One target search whose answer the script throws away: it still draws, with two or more candidates (Final Impact's macro). */
export function discardPick(ctx: AiContext, candidates: readonly unknown[]): void {
  pickUniform(ctx, candidates);
}

/** Statuses that switch the reaction entry off (`getreaction`): stopped, asleep, petrified, confused, berserk, ejected. */
const REACTION_OFF = ['stop', 'sleep', 'petrify', 'confuse', 'berserk', 'eject'] as const;

/**
 * `getreaction`: true unless the actor is the attacker itself, or is stopped, asleep, petrified, confused, berserk or ejected.
 * Shiva and Anima test it; the Sisters, both Paragon scripts and Trema do not (1.2).
 */
export function reactionGuard(self: Ffx2Unit, source: Ffx2Unit): boolean {
  if (self === source || self.id === source.id) return false;
  if (self.removed) return false;
  return !REACTION_OFF.some((s) => self.statuses[s] !== undefined);
}

/** A command row's damage flags masked with 3 (`getcominfo(cmd, 1)`): 1 physical only, 2 magical only, 0 neither. */
export function damageBits(ability: AbilityDef, user: Ffx2Unit): number {
  return resolveCommand(ability, user).record.flagsDamage & 3;
}

/** `floor(max / n)` of a unit's own maximum HP (the scripts' integer-division thresholds). */
export function maxHpDiv(unit: Ffx2Unit, n: number): number {
  return Math.floor(unit.stats.maxHp / n);
}
