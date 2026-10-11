/**
 * An Overdrive minigame's result in the engine: the rider test of a Bushido and the hits a result removes (re-parity RC4 lane B;
 * **FFX only**). The rules are the game's (`../kernel/overdrive-result.ts`, proven against the machine code); this module turns the
 * engine's data into the kernel's inputs.
 */

import type { AbilityDef, FFXCombatant, StatusId } from '../../common/types.ts';
import { type BushidoMove, type RiderTarget, removeHits, ridersLanding } from '../kernel/overdrive-result.ts';
import { inActorOrder } from '../ai/script-random.ts';
import { nextHitTargets } from '../targeting.ts';
import type { Ctx } from '../state.ts';
import { FfxStream } from './streams.ts';
import { extraImmuneWord, recordOf } from './status.ts';

/** The four Breaks, in the order of the permanent word's bits 0x10 to 0x80 and of the resistance bytes 4 to 7. */
const BREAKS: readonly StatusId[] = ['power-break', 'magic-break', 'armor-break', 'mental-break'];

/**
 * Which Bushido a record is, from the rider it carries: Eject (Shooting Star), the weak Delay (Dragon Fang), the four Breaks (Banishing
 * Blade). A record with none of them (Tornado) has no rider and no Immune row.
 */
export function bushidoMoveOf(def: AbilityDef): BushidoMove | undefined {
  if (def.statusEffects.some((s) => s.status === 'eject')) return 'shooting-star';
  if (def.flags.includes('weak-delay')) return 'dragon-fang';
  if (def.statusEffects.some((s) => BREAKS.includes(s.status))) return 'banishing-blade';
  return undefined;
}

/** What the first pass reads of a target for the rider: the words and bytes the game keeps, from the engine's statuses and immunities. */
export function riderTargetOf(target: FFXCombatant, def: AbilityDef): RiderTarget {
  const rec = recordOf(target);
  return {
    perm: rec.perm,
    extra: rec.extra,
    extraImmune: extraImmuneWord(target, def),
    delayImmune: target.immunityFlags.includes('immune-to-delay') ? 1 : 0,
    breaks: BREAKS.map((b) => Math.min(255, target.immunities[b] ?? 0)),
  };
}

/**
 * Does the first pass newly inflict none of `def`'s riders on `target`, so that the Bushido takes its (Immune) row for this target?
 * (byte 0x16 of the target's first-pass record is 0). A move with no rider never does.
 */
export function ridersAllSpent(def: AbilityDef, target: FFXCombatant): boolean {
  const move = bushidoMoveOf(def);
  if (move === undefined) return false;
  return ridersLanding(move, riderTargetOf(target, def)) === 0;
}

/** One target and the hits that land on it. */
export interface HitPlan {
  target: FFXCombatant;
  hits: number;
}

/**
 * The hits of a random-target Overdrive, the game's way (`0x0078ba70` for the plan, `0x007afe00` for the result): the menu record's full
 * `spreadHits` are spread over the targets first, one pick each (the picker, stream 5, no draw under two candidates; the first pick is
 * `first`, which the caller has already made), then `spreadHits - hitCount` hits are removed one at a time from the targets holding the
 * most (stream 16, a draw each), and what is left lands target by target in ascending character order.
 */
export function planSpreadHits(ctx: Ctx, user: FFXCombatant, def: AbilityDef, first: FFXCombatant, spreadHits: number, hitCount: number): HitPlan[] {
  const picks: FFXCombatant[] = [first];
  for (let k = 1; k < spreadHits; k++) {
    const next = nextHitTargets(ctx, user, def)[0];
    if (next) picks.push(next);
  }
  const order = inActorOrder(ctx, [...new Set(picks)]);
  const pending = order.map((t) => picks.filter((p) => p === t).length);
  const n = picks.length - hitCount;
  const left = n > 0 ? removeHits(pending, { n, random: true }, (modulus) => ctx.rng.on(FfxStream.OverdriveRemoval).int(0, modulus - 1)) : pending;
  return order.map((target, i) => ({ target, hits: left[i] as number })).filter((p) => p.hits > 0);
}
