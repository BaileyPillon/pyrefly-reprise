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
import { type MixOutcome, resolveMixAction } from './mix.ts';
import type { ResolveOptions } from './abilities.ts';
import { FURY_MAX_CASTS, furyCastsFor, timingBonusFrom } from './overdrive.ts';
import { resolveReelSpin } from './reels.ts';
import { ridersAllSpent } from './adapt/overdrive-result.ts';
import { isPerHitRandom } from './targeting.ts';

/** Keys that belong to the success row only: Blitz Ace's "Last Hit" finisher (row 274) [§5.3]. */
const SUCCESS_ONLY_KEYS = ['finisherPower', 'finisherHits', 'finisherAppliesOnSuccessOnly'] as const;

/**
 * The sourced **(Fail)** or **(Immune)** row a Swordplay / Bushido record
 * carries inline as `extra.failPower`/`failHits` or
 * `extra.immunePower`/`immuneHits` [ffx-combat-core §5.3, §5.5, both tables
 * `[verified: 2 sources]`]. Only DmgCon and hit count change; everything else, `canMiss: false` (hard rule 5) and the
 * `crit-eligible` flag included, stays the success record's. A fail row drops the
 * success-only finisher keys. **Both rows drop the rider** (no status, no Delay):
 * the Immune rows 270 to 273 (od5, research note Q2) and the Fail rows 266 to 269
 * and 235 to 238 (od6, research note Q3a `[verified: 5 sources]`: "Effects only are
 * applied when sequence is entered correctly"). The can-crit bit stays on both
 * (Q3b). `undefined` when the record carries no such row, so the caller keeps `def`.
 *
 * **The rank is the menu row's, whatever the grade** (re-parity RC9, lane FFX-B2; `FFX-G01` row 17, closed by `FFX-H01` section 3.5): the game stores the
 * rank of the command the player chose when it first calculates the action (`0x007892E0`, byte `Chr+0xDE8`), the result handler never writes it and
 * the action-done call pays it, so a failed Tornado or Blitz Ace costs 7 like a clean one. The replacement rows have ranks of their own in the
 * command table (the Fail rows 3, 4, 5, 6, the (Immune) rows 5, 5, 6, 6) and none of them ever reaches the user. A record's old `failRank: 6` was the
 * research note's "(fail 6)", which is the replacement row's rank, not the user's (`tests/unit/parity-ffx-engine-od-results.test.ts`).
 * **FFX only**: FFX-2 has no Swordplay/Bushido.
 */
export function rowFromExtra(def: AbilityDef, row: 'fail' | 'immune'): AbilityDef | undefined {
  const extra = def.extra ?? {};
  const power = extra[`${row}Power`];
  const hits = extra[`${row}Hits`];
  if (typeof power !== 'number' || typeof hits !== 'number') return undefined;
  const rest: Record<string, unknown> = { ...extra };
  if (row === 'fail') for (const k of SUCCESS_ONLY_KEYS) delete rest[k];
  // Neither the Fail rows (TRK 266 to 269, 235 to 238; Q3a) nor the Immune rows (270 to 273; Q2)
  // carry a status or a Delay; a chance-254 rider never drew, so dropping it adds and removes no draw.
  const flags = def.flags.filter((f) => !DELAY_FLAGS.includes(f));
  return { ...def, power, hits, extra: rest, statusEffects: [], flags };
}

const DELAY_FLAGS: readonly string[] = ['weak-delay', 'strong-delay'];

/**
 * Does the first pass newly inflict **none** of `def`'s riders on `target`, so that a clean Bushido takes its (Immune) row for it?
 * The game decides **per target** from the target's first-pass record (byte 0x16, a count of riders newly inflicted;
 * `kernel/overdrive-result.ts#ridersLanding`, `FFX-G01` section 4.3): Shooting Star's Eject is spent when the target is immune to Eject
 * **or already carries it**; Dragon Fang's weak Delay when the target is delay-immune; Banishing Blade's four Breaks when **every** Break
 * is either immune (resistance 255) or already carried (one immune Break is not enough). A record with no rider (Tornado) is never
 * immune. Reads only; no RNG draw. A Petrified target does not follow these rules in the game (unmapped) and is not special-cased here.
 * **FFX only.**
 */
export function immuneToRider(def: AbilityDef, target: FFXCombatant): boolean {
  return ridersAllSpent(def, target);
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
): { def: AbilityDef; options: ResolveOptions; finisher?: AbilityDef; mix?: MixOutcome } {
  const options: ResolveOptions = { timing: timingBonusFrom(result, def) };
  if (!result) return { def, options };

  if (result.kind === 'tidus-timing' || result.kind === 'auron-sequence') {
    // A random-target move (Slice and Dice) has its menu record's hits spread over the targets first; the result only takes some away
    // (`ResolveOptions.spreadHits`, `kernel/overdrive-result.ts`).
    if (isPerHitRandom(def.targeting)) options.spreadHits = def.hits;
    const success = result.kind === 'tidus-timing' ? result.timing.success : result.sequence.success;
    if (!success) {
      const failId = def.extra?.['failAbilityId'];
      const failDef = typeof failId === 'string' ? abilityOf(ctx, failId) : rowFromExtra(def, 'fail');
      if (failDef) return { def: failDef, options };
    } else if (result.kind === 'auron-sequence') {
      // A clean Bushido picks its (Immune) row **per target**, from that target's own immunities
      // (od5, `immuneToRider`); the others take the success row and its rider. The engine decides:
      // `sequence.targetImmuneToRider` is no longer read.
      const immuneId = def.extra?.['immuneAbilityId'];
      const immuneDef = typeof immuneId === 'string' ? abilityOf(ctx, immuneId) : rowFromExtra(def, 'immune');
      if (immuneDef) options.rowFor = (target) => (immuneToRider(def, target) ? immuneDef : undefined);
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
    // A Fury casts at least once: the game's casts start at 1 (`kernel/minigame-fury-tables.ts`), so no rotation at all still hits once.
    const casts = swept > 0 ? furyCastsFor(def, user.stats.mag, swept) : Math.max(1, result.fury.casts);
    // The game plans all sixteen hits over the targets and takes away the casts it was not given (`ResolveOptions.spreadHits`).
    return { def, options: { ...options, hits: Math.min(FURY_MAX_CASTS, casts), ...(isPerHitRandom(def.targeting) ? { spreadHits: def.hits } : {}) } };
  }

  if (result.kind === 'kimahri-rage') {
    const rage = abilityOf(ctx, result.rage.rageId);
    if (rage) return { def: rage, options };
  }

  if (result.kind === 'rikku-mix') {
    // The overlay reports the two **ingredients**; the game's resolver and its complete chart are the engine's to run (`./mix.ts`, `kernel/mix.ts`, re-parity RC7):
    // any two items make a result, both are consumed here, the result's targets are the game's auto-target's, and the result is learned only when it found one.
    const [a, b] = result.mix.ingredients;
    if (a && b) {
      const mix = resolveMixAction(ctx, user, a, b);
      if (mix) return { def: mix.def, options, mix };
    }
    // An overlay that already named the result (and an ingredient the chart does not know, a test rig's) is honoured as before: the registry's own table,
    // the ingredients that came spent one each.
    const id = result.mix.resultAbilityId ?? (a && b ? ctx.content.mixResult(a, b) : undefined);
    const mix = id ? abilityOf(ctx, id) : undefined;
    if (mix) {
      // Mix consumes both ingredients; the record says so (`extra.consumesTwoItems`).
      if (a) spendItem(ctx, a, user);
      if (b) spendItem(ctx, b, user);
      return { def: mix, options };
    }
  }

  return { def, options };
}
