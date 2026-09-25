/**
 * Two documented `AbilityDef.extra` keys for the fallen aeons of the Road to
 * the Farplane (Chapter XI). **FFX-2 only** [AGENTS.md rule 14]: no FFX ability
 * sets either key and no FFX code path reads them.
 *
 * Plan: `docs/plans/chapter-fallen-aeons-review.md` §4.2, gaps FA-G1 and FA-G2.
 * Research: `research/ffx2-fallen-aeons.md` §4.1 (Heavenly Strike), §4.2
 * (Absorb, Delta Attack).
 *
 * - **`extra.setHpTo`** (number) and **`extra.setMpTo`** (number): the hit
 *   leaves the target at exactly that HP / MP, never more than it had. Delta
 *   Attack is `setHpTo: 1, setMpTo: 0` ("remaining HP − 1" per SinirothX;
 *   HP to 1 and MP to 0 per the wiki — the MP half is `[single source]`, F-9).
 *   It is not a percentage hit, so the `immune-to-percentage-damage` check in
 *   `formulas.ts` step 20 never sees it (the plan's Review note on FA-G1), and
 *   it cannot kill: a target already at 1 HP takes 0.
 * - **`extra.mpFractionOfCurrent`** (sixteenths): after the HP hit lands, the
 *   target also loses `floor(currentMp × n / 16)` MP. Heavenly Strike is 8
 *   (half of current HP **and** MP, `[verified: 4 sources]`); Cindy's Absorb is
 *   3 (3/16 of current HP and MP). With the `drains` flag the MP goes to the
 *   user. `percent-current` bases on HP only (`formulas.ts`), hence the key.
 *
 * Both run after the hit, crit and randomiser draws the caller already made and
 * take no draw of their own, so no replay at the same seed moves
 * (`docs/CONTRACTS.md`, engine agents, rule 1).
 */

import type { AbilityDef } from '../common/types.ts';
import type { Ffx2Unit } from './internal.ts';
import { applyHpDelta, type ResolveContext } from './resolve.ts';

/** True when the ability carries either "set to" key. */
export function setsPoolsTo(ability: AbilityDef): boolean {
  return typeof ability.extra?.['setHpTo'] === 'number' || typeof ability.extra?.['setMpTo'] === 'number';
}

/**
 * Resolve one "set to" hit (Delta Attack). Returns the HP taken, for the
 * caller's running total. Emits `damage` and `mp-damage` like any other hit.
 */
export function resolveSetTo(
  ctx: ResolveContext,
  user: Ffx2Unit,
  target: Ffx2Unit,
  ability: AbilityDef,
  hitIndex: number,
  hitCount: number,
): number {
  let taken = 0;
  const hpTo = ability.extra?.['setHpTo'];
  if (typeof hpTo === 'number' && target.alive) {
    taken = Math.max(0, target.hp - Math.max(1, hpTo));
    ctx.emit({
      type: 'damage',
      targetId: target.id,
      sourceId: user.id,
      amount: taken,
      element: 'none',
      crit: false,
      hitIndex,
      hitCount,
    });
    applyHpDelta(ctx, target, taken, user.id);
  }
  const mpTo = ability.extra?.['setMpTo'];
  if (typeof mpTo === 'number') {
    const drained = Math.max(0, target.mp - Math.max(0, mpTo));
    if (drained > 0) {
      target.mp -= drained;
      ctx.emit({ type: 'mp-damage', targetId: target.id, sourceId: user.id, amount: drained });
    }
  }
  return taken;
}

/**
 * The MP half of Heavenly Strike and Absorb, after the HP hit has landed; and of the **Soul
 * Spring** item, `extra.mpDrainMatchesHp`: "absorbs 937–1058 HP **and up to 1058 MP**"
 * (ffx2-combat-core §5.5), read as the same amount of MP as the HP hit took, capped by what the
 * target has (Chapter XIII's kit option; no shipped row sets the key, so no replay moves).
 */
export function applyMpFraction(ctx: ResolveContext, user: Ffx2Unit, target: Ffx2Unit, ability: AbilityDef, hpTaken = 0): void {
  const n = ability.extra?.['mpFractionOfCurrent'];
  const matched = ability.extra?.['mpDrainMatchesHp'] === true;
  if (!matched && (typeof n !== 'number' || n <= 0)) return;
  const drained = Math.min(target.mp, matched ? Math.max(0, hpTaken) : Math.floor((target.mp * (n as number)) / 16));
  if (drained <= 0) return;
  target.mp -= drained;
  ctx.emit({ type: 'mp-damage', targetId: target.id, sourceId: user.id, amount: drained });
  if (ability.flags.includes('drains')) {
    const before = user.mp;
    user.mp = Math.min(user.stats.maxMp, user.mp + drained);
    if (user.mp > before) ctx.emit({ type: 'mp-heal', targetId: user.id, sourceId: target.id, amount: user.mp - before });
  }
}

/**
 * What an `mpOnly` hit takes from the target's MP. By default the computed amount (Leblanc's
 * and the Vegnagun rows); with `extra.mpFractionOfCurrent` as well, that many sixteenths of the
 * target's **current** MP and no HP: Chapter XIII's Waning Moon, 5/16 a hit [ffx2-trema §4.2].
 * No shipped ability set both keys before Chapter XIII, so every other replay is unchanged.
 */
export function mpOnlyTaken(ability: AbilityDef, target: Ffx2Unit, amount: number): number {
  const sixteenths = ability.extra?.['mpFractionOfCurrent'];
  return typeof sixteenths === 'number' ? Math.floor((target.mp * sixteenths) / 16) : Math.abs(amount);
}
