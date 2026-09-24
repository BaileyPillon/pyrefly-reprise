/**
 * Reshaping an Overdrive by its minigame outcome [ffx-combat-core §5.3, §5.6,
 * §5.7, §5.9].
 *
 * Moved verbatim out of `./execute.ts` (its only caller) for the house
 * 400-line rule (AGENTS.md hard rule 7); behaviour unchanged, which the
 * byte-identical event-log check in the yojimbo-core repair pass measured.
 * **Game case: FFX only** — the FFX CTB engine; FFX-2 never imports it.
 */

import type { AbilityDef, FFXCombatant, MinigameResult } from '../common/types.ts';
import { type Ctx, abilityOf, spendItem } from './state.ts';
import type { ResolveOptions } from './abilities.ts';
import { FURY_MAX_CASTS, furyCastsFor, timingBonusFrom } from './overdrive.ts';
import { resolveReelSpin } from './reels.ts';

/** Reshape an Overdrive by its minigame outcome [ffx-combat-core §5.3, §5.6, §5.7]. */
export function shapeOverdrive(
  ctx: Ctx,
  user: FFXCombatant,
  def: AbilityDef,
  result: MinigameResult | undefined,
): { def: AbilityDef; options: ResolveOptions } {
  const options: ResolveOptions = { timing: timingBonusFrom(result, def) };
  if (!result) return { def, options };

  if (result.kind === 'tidus-timing' || result.kind === 'auron-sequence') {
    const success = result.kind === 'tidus-timing' ? result.timing.success : result.sequence.success;
    if (!success) {
      const failId = def.extra?.['failAbilityId'];
      const failDef = typeof failId === 'string' ? abilityOf(ctx, failId) : undefined;
      if (failDef) return { def: failDef, options };
    } else if (result.kind === 'auron-sequence' && result.sequence.targetImmuneToRider === true) {
      const immuneId = def.extra?.['immuneAbilityId'];
      const immuneDef = typeof immuneId === 'string' ? abilityOf(ctx, immuneId) : undefined;
      if (immuneDef) return { def: immuneDef, options };
    }
    return { def, options };
  }

  if (result.kind === 'wakka-reels' || result.kind === 'ladyluck-reels') {
    // The reel-set command is a wrapper that deals nothing: `formula: 'none'`,
    // `power: 0`, `hits: 0`. Re-shaping *it* — which is all the old code did —
    // therefore produced a full-gauge Overdrive with no damage event at all.
    // The spin has to be resolved into one of the ten **shots**
    // [ffx-combat-core §5.6, `reels.ts`].
    const outcome = resolveReelSpin(def, result.reels);
    if (!outcome) return { def, options };
    const shot = abilityOf(ctx, outcome.shotId);
    if (!shot) return { def, options };
    // §5.6's match rule overrides the shot's own targeting; Aurochs Shot is
    // authored `all-enemies` because that is its three-of-a-kind payoff, and a
    // two-of-a-kind still means one random enemy.
    const shaped: AbilityDef = { ...shot, targeting: outcome.targeting };
    // The wrapper is where the 20 000 ms timer ran, so the shot inherits the
    // §5.2 bonus already computed above and never carries the flag itself.
    return { def: shaped, options: outcome.hits === undefined ? options : { ...options, hits: outcome.hits } };
  }

  if (result.kind === 'lulu-fury') {
    // The spell rode in on `OverdriveCommand.id`, so `def` is already the
    // right `<spell>-fury` record; the result only says how far the stick
    // swept. Recompute `casts` from the swept angle when the UI reported one,
    // so the rotation cost is the engine's call and not the overlay's
    // [CONTRACT-CHANGES decision 9, ffx-combat-core §5.7].
    const swept = result.fury.sweptDegrees;
    const casts = swept > 0 ? furyCastsFor(def, user.stats.mag, swept) : Math.max(0, result.fury.casts);
    return { def, options: { ...options, hits: Math.min(FURY_MAX_CASTS, casts) } };
  }

  if (result.kind === 'kimahri-rage') {
    const rage = abilityOf(ctx, result.rage.rageId);
    if (rage) return { def: rage, options };
  }

  if (result.kind === 'rikku-mix') {
    // The overlay reports the two **ingredients**; the recipe table is the
    // engine's to read [§5.9, `registry.ts addMixRecipes`]. An overlay that
    // already resolved the pair is honoured, and one that did not — every
    // caller until now, which is why Mix spent a full gauge for no event —
    // is resolved here.
    const [a, b] = result.mix.ingredients;
    const id = result.mix.resultAbilityId ?? (a && b ? ctx.content.mixResult(a, b) : undefined);
    const mix = id ? abilityOf(ctx, id) : undefined;
    if (mix) {
      // Mix consumes both ingredients; the record says so (`extra.consumesTwoItems`).
      if (a) spendItem(ctx, a);
      if (b) spendItem(ctx, b);
      return { def: mix, options };
    }
  }

  return { def, options };
}
