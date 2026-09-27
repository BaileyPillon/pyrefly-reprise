/**
 * Per-hit targets and status riders for `resolve.ts`: which unit each strike lands on
 * (`targetForHit`, the IC-2 all-target rule) and the "Status 1" riders a landed hit carries
 * (`applyRiders`). Split out of `resolve.ts` as a pure move (critic PR-0083 / F3; house rule 7).
 * Draw order is unchanged: the riders roll after the hit, crit and randomiser. FFX-2 only.
 */

import type { AbilityDef, Rng, StatusId } from '../common/types.ts';
import type { Ffx2Unit } from './internal.ts';
import { applyStatus, removeStatus, statusChanceLinear } from './statuses.ts';

import { applyHpDelta, type ResolveContext } from './resolve-hp.ts';

/**
 * Per-hit target selection; `random-*` re-rolls a fresh target each strike. §2.9
 *
 * **All-target (IC-2, §9.1 `[verified: 3 sources]`):** the move is defined per character, so hit
 * `hitIndex` belongs to `pool[hitIndex]`, the targets taken once at the action's start. A target
 * KO'd partway takes nothing more and its hit is **not** handed on (the mid-move death case is
 * unsourced; this is the per-target definition's reading). It used to index a list re-filtered
 * after every hit, so a death wrapped later hits onto a girl already hit and the last went free.
 */
export function targetForHit(
  ability: AbilityDef,
  pool: readonly Ffx2Unit[],
  hitIndex: number,
  rng: Rng,
): Ffx2Unit | undefined {
  const standing = (u: Ffx2Unit) => u.alive || ability.flags.includes('can-target-dead');
  if (ability.targeting === 'all-enemies' || ability.targeting === 'all-allies' || ability.targeting === 'all') {
    const own = pool[hitIndex];
    return own && standing(own) ? own : undefined;
  }
  const living = pool.filter(standing);
  if (living.length === 0) return undefined;
  if (ability.targeting === 'random-enemy' || ability.targeting === 'random-ally') {
    return rng.pick(living);
  }
  return living[0];
}

/**
 * Apply an ability's status riders to one target. §2.6a "Status 1".
 *
 * **`extra.statusRollOneOf`** — a documented one-off key
 * (`docs/CONTRACTS.md`: "Genuinely one-off scripted rules … go in
 * `AbilityDef.extra`, with the keys documented in the data file that sets
 * them"). Set, the loop below rolls **exactly one** of the listed applications
 * instead of rolling each independently. Its only caller is Logos' Russian
 * Roulette, whose canon is one of six outcomes, not up to six at once
 * [`src/data/ffx2/enemies/leblanc-syndicate-abilities.ts`,
 * `research/ffx2-leblanc-syndicate.md` §4.3]. FFX-2 only: no FFX ability sets
 * the key and no FFX code path reads it.
 *
 * The draw is taken at the **end** of the step it belongs to — after the hit,
 * crit and randomiser rolls the caller already made — so no existing replay at
 * the same seed moves (`docs/CONTRACTS.md`, engine agents, rule 1).
 */
export function applyRiders(ctx: ResolveContext, user: Ffx2Unit, target: Ffx2Unit, ability: AbilityDef): void {
  const rollOneOf = ability.extra?.['statusRollOneOf'] === true && ability.statusEffects.length > 1;
  const applications = rollOneOf ? [ctx.rng.pick([...ability.statusEffects])] : ability.statusEffects;

  for (const application of applications) {
    const resist = target.immunities[application.status] ?? 0;
    if (resist >= 255) continue;
    const chance =
      application.chance >= 254
        ? 100
        : statusChanceLinear(user.level ?? 1, application.chance, target.level ?? 1, resist);
    if (chance < 100 && ctx.rng.int(0, 99) >= chance) continue;
    const instance = applyStatus(target, application, user.id, ability.id, ctx.timedAilmentDefaults === true);
    if (!instance) continue;
    ctx.emit({
      type: 'status-add',
      targetId: target.id,
      sourceId: user.id,
      status: application.status,
      instance,
    });
    if (application.status === 'ko') applyHpDelta(ctx, target, target.hp, user.id);
    // **Eject removes the character from the battle.** `eject` has always been
    // a live `FFX2StatusId`, has always been in `INFINITE_STATUSES` and has
    // always had a HUD chip (`statusChips.ts: eject: 'EJT'`) — but nothing ever
    // set `removed`, so an ejected girl kept an EJT badge and kept playing.
    // (`resolve.ts`'s own "X-2 has no eject" note below is true of *Charon*,
    // not of the status.) `targeting.ts::isTargetable`, `engine.ts`'s `party()`,
    // `gauges.ts` and `results.ts` all already test `!u.removed`, so removal,
    // untargetability, a frozen gauge and "all three gone = defeat" fall out
    // with no further work; `revive()` above already clears the flag. FFX-2
    // only: `eject` is settable by no FFX ability [§4.3, and the absence test].
    if (application.status === 'eject') target.removed = true;
  }

  if (ability.flags.includes('removes-statuses')) {
    // `EnemyDef.autoStatuses` (Trema's Spellspring) stay: "auto-status" read as undispellable, `[estimate]`.
    for (const id of (ability.removesStatuses as StatusId[]).filter((s) => !target.autoStatuses?.includes(s))) {
      if (removeStatus(target, id)) {
        ctx.emit({ type: 'status-remove', targetId: target.id, status: id, reason: 'dispelled' });
      }
    }
  }
}
