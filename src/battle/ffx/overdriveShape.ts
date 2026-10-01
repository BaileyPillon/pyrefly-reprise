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

/** Keys that belong to the success row only: Blitz Ace's "Last Hit" finisher (row 274) [§5.3]. */
const SUCCESS_ONLY_KEYS = ['finisherPower', 'finisherHits', 'finisherAppliesOnSuccessOnly'] as const;

/**
 * The sourced **(Fail)** or **(Immune)** row a Swordplay / Bushido record
 * carries inline as `extra.failPower`/`failHits`(/`failRank`) or
 * `extra.immunePower`/`immuneHits` [ffx-combat-core §5.3, §5.5, both tables
 * `[verified: 2 sources]`]. Only DmgCon, hit count and (where the table gives
 * one) rank change; everything else, `canMiss: false` included (hard rule 5),
 * stays the success record's. A fail row drops the success-only finisher keys.
 * `undefined` when the record carries no such row, so the caller keeps `def`.
 * **FFX only**: FFX-2 has no Swordplay/Bushido.
 */
export function rowFromExtra(def: AbilityDef, row: 'fail' | 'immune'): AbilityDef | undefined {
  const extra = def.extra ?? {};
  const power = extra[`${row}Power`];
  const hits = extra[`${row}Hits`];
  if (typeof power !== 'number' || typeof hits !== 'number') return undefined;
  const rank = extra[`${row}Rank`];
  const rest: Record<string, unknown> = { ...extra };
  if (row === 'fail') for (const k of SUCCESS_ONLY_KEYS) delete rest[k];
  return { ...def, power, hits, rank: typeof rank === 'number' ? rank : def.rank, extra: rest };
}

/**
 * Blitz Ace's **"Last Hit"**, row 274: `research/ffx-combat-core.md` §5.3 gives
 * the success as "4 × 8, then a final 24 × 1 (row 274 "Last Hit")" and the fail
 * as "4 × 8" (table `[verified: 2 sources]`; the 8 + 1 hit count is
 * `[single source]`, §11 C14). Built from `extra.finisherPower`/`finisherHits`
 * on the success record; `undefined` for every record without them. Everything
 * else, `canMiss: false` included (hard rule 5), is the success record's.
 * **FFX only.**
 */
export function finisherRow(def: AbilityDef): AbilityDef | undefined {
  const extra = def.extra ?? {};
  const power = extra['finisherPower'];
  const hits = extra['finisherHits'];
  if (typeof power !== 'number' || typeof hits !== 'number') return undefined;
  const rest: Record<string, unknown> = { ...extra };
  for (const k of SUCCESS_ONLY_KEYS) delete rest[k];
  return { ...def, power, hits, extra: rest };
}

/** Reshape an Overdrive by its minigame outcome [ffx-combat-core §5.3, §5.6, §5.7]; `finisher` = a success-only follow-up row. */
export function shapeOverdrive(
  ctx: Ctx,
  user: FFXCombatant,
  def: AbilityDef,
  result: MinigameResult | undefined,
): { def: AbilityDef; options: ResolveOptions; finisher?: AbilityDef } {
  const options: ResolveOptions = { timing: timingBonusFrom(result, def) };
  if (!result) return { def, options };

  if (result.kind === 'tidus-timing' || result.kind === 'auron-sequence') {
    const success = result.kind === 'tidus-timing' ? result.timing.success : result.sequence.success;
    if (!success) {
      const failId = def.extra?.['failAbilityId'];
      const failDef = typeof failId === 'string' ? abilityOf(ctx, failId) : rowFromExtra(def, 'fail');
      if (failDef) return { def: failDef, options };
    } else if (result.kind === 'auron-sequence' && result.sequence.targetImmuneToRider === true) {
      const immuneId = def.extra?.['immuneAbilityId'];
      const immuneDef = typeof immuneId === 'string' ? abilityOf(ctx, immuneId) : rowFromExtra(def, 'immune');
      if (immuneDef) return { def: immuneDef, options };
    }
    // Only a success reaches here with the success row, so only a success gets the finisher.
    const finisher = success ? finisherRow(def) : undefined;
    return finisher ? { def, options, finisher } : { def, options };
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
