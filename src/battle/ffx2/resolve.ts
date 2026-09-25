/**
 * Action resolution — turning one `Command` into an ordered list of events.
 *
 * Draw order is fixed and must stay fixed: for each hit we roll **hit, then
 * crit, then the step-7 randomiser**, then the status riders in ability order.
 * Reordering a draw changes every replay at the same seed, so a new roll goes
 * at the *end* of its step (`docs/CONTRACTS.md`, engine agents).
 */

import type {
  AbilityDef,
  CombatantId,
  Rng,
  StatusId,
} from '../common/types.ts';
import type { AbilityRegistry, Emit, Ffx2Unit } from './internal.ts';
import { breakChain, cannotEvade, registerHit } from './chain.ts';
import { chainMultiplier } from './chain.ts';
import { computeDamage, critPercent, hitPercent, randomiserRoll } from './formulas.ts';
import { resolveSensor, sensorKind } from './sensor.ts';
import { applyStatus, removeStatus, statusChanceLinear } from './statuses.ts';
import { hpCostFor, resolveTargets } from './targeting.ts';
import { AUTO_LIFE_REVIVE_FRACTION } from './constants.ts';
import { applyMpFraction, resolveSetTo, setsPoolsTo } from './aeon-effects.ts';

export interface ResolveContext {
  units: Ffx2Unit[];
  abilities: AbilityRegistry;
  rng: Rng;
  emit: Emit;
  /** Per-girl Break Damage Limit, from an accessory or a Garment Grid gate. */
  breaksDamageLimit(unit: Ffx2Unit): boolean;
}

/**
 * Apply a signed HP delta. Positive damages, negative heals — the whole engine
 * speaks in one sign convention because X-2's own pipeline does.
 *
 * Emits `ko` (consuming Auto-Life when present) but never the `damage` event
 * itself; the caller owns that, so multi-hit actions keep `hitIndex` ordering.
 */
export function applyHpDelta(
  ctx: ResolveContext,
  target: Ffx2Unit,
  delta: number,
  sourceId?: CombatantId,
): void {
  if (delta === 0) return;
  const wasAlive = target.alive;
  target.hp = Math.max(0, Math.min(target.stats.maxHp, target.hp - delta));

  if (target.hp > 0) {
    if (!wasAlive) target.alive = true;
    return;
  }
  if (!wasAlive) return;

  if (target.statuses['auto-life']) {
    removeStatus(target, 'auto-life');
    ctx.emit({ type: 'status-remove', targetId: target.id, status: 'auto-life', reason: 'consumed' });
    target.hp = Math.max(1, Math.floor(target.stats.maxHp * AUTO_LIFE_REVIVE_FRACTION));
    target.alive = true;
    ctx.emit({ type: 'revive', targetId: target.id, hp: target.hp, cause: 'auto-life' });
    return;
  }

  target.alive = false;
  if (breakChain(target)) {
    ctx.emit({ type: 'chain', targetId: target.id, count: 0, multiplier: 1 });
  }
  applyStatus(target, { status: 'ko', chance: 255, duration: 0 }, sourceId);
  ctx.emit({ type: 'ko', targetId: target.id, ...(sourceId ? { sourceId } : {}) });
  if (target.flags.isPart) {
    ctx.emit({
      type: 'part-destroyed',
      partId: target.id,
      ...(target.flags.partOf ? { ownerId: target.flags.partOf } : {}),
    });
  }
}

/** Restore HP outside the damage chain (a Regen tick, a revival). */
export function heal(ctx: ResolveContext, target: Ffx2Unit, amount: number, cause: string): void {
  if (amount <= 0) return;
  const before = target.hp;
  target.hp = Math.min(target.stats.maxHp, target.hp + amount);
  const gained = target.hp - before;
  if (gained > 0) ctx.emit({ type: 'heal', targetId: target.id, amount: gained, cause });
}

/** Bring a KO'd unit back. `fraction` is of max HP: Phoenix Down 0.25, Full-Life 1.0. */
export function revive(ctx: ResolveContext, target: Ffx2Unit, fraction: number, cause: string): void {
  if (target.alive) return;
  removeStatus(target, 'ko');
  target.alive = true;
  target.removed = false;
  target.hp = Math.max(1, Math.floor(target.stats.maxHp * Math.max(0, Math.min(1, fraction))));
  ctx.emit({ type: 'revive', targetId: target.id, hp: target.hp, cause });
  if (target.flags.isPart) {
    ctx.emit({
      type: 'part-restored',
      partId: target.id,
      hp: target.hp,
      ...(target.flags.partOf ? { ownerId: target.flags.partOf } : {}),
    });
  }
}

/** Per-hit target selection; `random-*` re-rolls a fresh target each strike. §2.9 */
function targetForHit(
  ability: AbilityDef,
  pool: readonly Ffx2Unit[],
  hitIndex: number,
  rng: Rng,
): Ffx2Unit | undefined {
  const living = pool.filter((u) => u.alive || ability.flags.includes('can-target-dead'));
  if (living.length === 0) return undefined;
  if (ability.targeting === 'random-enemy' || ability.targeting === 'random-ally') {
    return rng.pick(living);
  }
  if (ability.targeting === 'all-enemies' || ability.targeting === 'all-allies' || ability.targeting === 'all') {
    return living[hitIndex % living.length];
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
function applyRiders(ctx: ResolveContext, user: Ffx2Unit, target: Ffx2Unit, ability: AbilityDef): void {
  const rollOneOf = ability.extra?.['statusRollOneOf'] === true && ability.statusEffects.length > 1;
  const applications = rollOneOf
    ? [ctx.rng.pick([...ability.statusEffects])]
    : ability.statusEffects;

  for (const application of applications) {
    const resist = target.immunities[application.status] ?? 0;
    if (resist >= 255) continue;
    const chance =
      application.chance >= 254
        ? 100
        : statusChanceLinear(user.level ?? 1, application.chance, target.level ?? 1, resist);
    if (chance < 100 && ctx.rng.int(0, 99) >= chance) continue;
    const instance = applyStatus(target, application, user.id, ability.id);
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
    for (const id of ability.removesStatuses as StatusId[]) {
      if (removeStatus(target, id)) {
        ctx.emit({ type: 'status-remove', targetId: target.id, status: id, reason: 'dispelled' });
      }
    }
  }
}

/**
 * Resolve one ability from `user` against `requested`, emitting every event it
 * produces. Returns the total HP delta dealt, so an AI script can log it.
 */
export function resolveAbility(
  ctx: ResolveContext,
  user: Ffx2Unit,
  ability: AbilityDef,
  requested: readonly CombatantId[],
  options: { multiTarget?: boolean; isCounter?: boolean; hitsOverride?: number; inSequence?: boolean } = {},
): number {
  const pool = resolveTargets(ctx.units, user, ability, requested, ctx.rng);
  if (pool.length === 0) return 0;

  const mpCost = user.statuses.spellspring ? 0 : ability.mpCost;
  if (mpCost > 0) user.mp = Math.max(0, user.mp - mpCost);

  // The Dark Knight pays in HP. Darkness is **12.5% of the user's own max HP**
  // per cast [ffx2-vegnagun-shuyin §6.4 `[verified: 2 sources]`], and that cost
  // is the ability's entire downside (§7.1). `targeting.ts` greys the row out
  // when she cannot pay, so the subtraction can never KO her — it is a cost,
  // not damage: it is not an attack, so it registers no chain and cannot crit.
  const hpCost = hpCostFor(user, ability);
  if (hpCost > 0) {
    user.hp = Math.max(1, user.hp - hpCost);
    ctx.emit({
      type: 'damage',
      targetId: user.id,
      amount: hpCost,
      element: 'none',
      crit: false,
      hitIndex: 0,
      hitCount: 1,
    });
  }

  // MP restoratives. `extra.restoresMp` is the whole effect of an Ether (100)
  // or a Turbo Ether (500); `extra.alsoRestoresMp` rides on top of the Elixir
  // and Megalixir's full HP heal — "up to 9999 HP **and 999 MP**"
  // [ffx2-combat-core §5.5 items table]. Both fields were written by the data
  // layer and read by nothing, so every MP restorative in X-2 was inert and the
  // Chapter 5 bag's six Turbo Ethers could not refill a single spell.
  const mpGain = ability.extra?.['restoresMp'] ?? ability.extra?.['alsoRestoresMp'];
  if (typeof mpGain === 'number' && mpGain > 0) {
    for (const target of pool) {
      if (!target.alive) continue;
      const before = target.mp;
      target.mp = Math.min(target.stats.maxMp, target.mp + mpGain);
      const gained = target.mp - before;
      if (gained > 0) {
        ctx.emit({ type: 'mp-heal', targetId: target.id, sourceId: user.id, amount: gained });
      }
    }
  }

  // Scan / Libra / Ma'at's Feather leave here: a reveal is pure information,
  // so it never rolls to hit, never registers a chain, and never touches the
  // seeded RNG. See `sensor.ts` for what counts as one. §3.7
  const reveals = sensorKind(ability);
  if (reveals) {
    resolveSensor(ctx.emit, user, pool, reveals);
    return 0;
  }

  // A minigame outcome (Trigger Happy's presses, a reel's hit total) replaces
  // the ability's own hit count. `docs/CONTRACTS.md`, "Minigame protocol".
  const strikes = Math.max(1, options.hitsOverride ?? ability.hits);
  const hitCount = strikes * (ability.targeting.startsWith('all') ? pool.length : 1);
  const perTarget = ability.targeting.startsWith('all') ? pool.length : 1;
  let total = 0;
  let index = 0;

  for (let strike = 0; strike < strikes; strike++) {
    for (let t = 0; t < perTarget; t++) {
      const target = targetForHit(ability, pool, ability.targeting.startsWith('all') ? t : strike, ctx.rng);
      if (!target) continue;

      // Revival effects: a `misses-if-target-alive` heal on a living target fails.
      if (ability.flags.includes('misses-if-target-alive')) {
        if (target.alive) {
          ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'wrong-state' });
        } else {
          revive(ctx, target, ability.power / 16, ability.id);
        }
        index += 1;
        continue;
      }

      // Step 0 — the hit check. A chained target cannot evade. §2.6
      const accuracy = cannotEvade(target) ? 100 : hitPercent(user, target, ability);
      if (accuracy < 100 && ctx.rng.int(0, 99) >= accuracy) {
        ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'evaded' });
        index += 1;
        continue;
      }

      const crit = ability.flags.includes('crit-eligible')
        ? ctx.rng.int(0, 99) < critPercent(user, target, ability)
        : false;
      const randomRoll = randomiserRoll(ctx.rng);

      if (setsPoolsTo(ability)) { // Delta Attack (XI, no riders), Looming Glacier + Stop (XV)
        total += resolveSetTo(ctx, user, target, ability, index, hitCount);
        applyRiders(ctx, user, target, ability);
        index += 1;
        continue;
      }

      if (ability.formula === 'none') {
        applyRiders(ctx, user, target, ability);
        index += 1;
        continue;
      }

      // A **restorative** action is not a hit, and must not touch the chain.
      //
      // The Chain is built by landed hits on a target and does three things to
      // it: raises the damage of the next hit, removes its evasion, and locks
      // it out of starting an action while the window is open
      // [ffx2-combat-core §1.7; ffx2-vegnagun-shuyin §1.1 step 13]. Registering
      // a Cure or a Pray as a "hit" therefore turned the party's own healer
      // into the boss's best weapon: measured on the Tail, seed 7, Yuna's Pray
      // opened a 2 s window on all three girls and the Noli Me Tangere 107
      // ticks later landed at x1.45 for **1,869 / 1,812 / 1,741** against the
      // sourced band of **1,171-1,323** (§1.2), one-shotting the White Mage;
      // the same window also froze whoever had just been healed. `heals` is
      // spelled exactly as `formulas.ts` spells it (`flags 'heals'` or the
      // `healing` formula), so the two cannot drift apart. Revives already
      // skipped this block above.
      const restorative = ability.flags.includes('heals') || ability.formula === 'healing';
      const chainCount = restorative ? 0 : registerHit(target, crit);
      if (!restorative) {
        ctx.emit({
          type: 'chain',
          targetId: target.id,
          count: chainCount,
          multiplier: chainMultiplier(chainCount),
        });
      }

      const result = computeDamage({
        user,
        target,
        ability,
        chainCount,
        crit,
        randomRoll,
        multiTarget: options.multiTarget === true,
        breaksDamageLimit: ctx.breaksDamageLimit(user),
      });

      if (result.immune) {
        ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'immune' });
        index += 1;
        continue;
      }

      const mpOnly = ability.extra?.['mpOnly'] === true;
      if (mpOnly) {
        const drained = Math.min(target.mp, Math.abs(result.amount));
        target.mp -= drained;
        ctx.emit({ type: 'mp-damage', targetId: target.id, sourceId: user.id, amount: drained });
        if (ability.flags.includes('drains-mp')) {
          user.mp = Math.min(user.stats.maxMp, user.mp + drained);
          ctx.emit({ type: 'mp-heal', targetId: user.id, sourceId: target.id, amount: drained });
        }
        index += 1;
        continue;
      }

      const element = ability.element.find((e) => e !== 'none') ?? 'none';
      ctx.emit({
        type: 'damage',
        targetId: target.id,
        sourceId: user.id,
        amount: result.amount,
        element,
        affinity: result.affinity,
        crit,
        hitIndex: index,
        hitCount,
        ...(result.capped ? { capped: true } : {}),
      });
      applyHpDelta(ctx, target, result.amount, user.id);
      total += result.amount;

      if (ability.flags.includes('drains') && result.amount > 0) {
        heal(ctx, user, result.amount, 'drain');
      }
      if (ability.flags.includes('drains-mp')) {
        const drained = Math.min(target.mp, Math.max(0, Math.floor(Math.abs(result.amount) / 4)));
        if (drained > 0) {
          target.mp -= drained;
          ctx.emit({ type: 'mp-damage', targetId: target.id, sourceId: user.id, amount: drained });
          user.mp = Math.min(user.stats.maxMp, user.mp + drained);
          ctx.emit({ type: 'mp-heal', targetId: user.id, sourceId: target.id, amount: drained });
        }
      }

      applyMpFraction(ctx, user, target, ability); // Heavenly Strike, Absorb (`aeon-effects.ts`)
      applyRiders(ctx, user, target, ability);
      index += 1;
    }
  }

  // **`destroys-user`** [ffx2-combat-core §2.3, §3.12 row "Charon"].
  //
  // "Charon (Dark Knight): `user max HP * 2`; **the user is removed from the
  // battle**." The flag had exactly one reader in the project — `abilities.ts`
  // in the *FFX* engine, for Kimahri's Self-Destruct — and none at all under
  // `src/battle/ffx2`, so X-2's only self-sacrifice ability had no cost.
  //
  // What that did to Chapter 4: `x2-dark-knight-charon` is `formula:
  // 'user-max-hp'` and `ignoresDefense`, so it is a free, repeatable,
  // defence-ignoring nuke. Measured, taking it whenever it was offered and
  // otherwise attacking: **15 wins in 15 seeds, 13.2 turns against the intended
  // line's 77**, with Rikku's HP unchanged after every cast
  // (1739 -> 1739 -> 1739) and `alive: true`. A blind sweep of all 28 rows the
  // chapter offers found it the only winner.
  //
  // The user is **KO'd**, not ejected: X-2 has no eject, a KO'd girl is still
  // on the party and still revivable, and that is what "removed from the
  // battle" means here. The removal runs through `applyHpDelta`, so Auto-Life,
  // the chain break and the `ko` event all behave exactly as they do for any
  // other death — the cost is a real death, with the real ways out of it.
  if (ability.flags.includes('destroys-user') && user.alive) {
    const cost = user.hp;
    if (cost > 0) {
      ctx.emit({
        type: 'damage',
        targetId: user.id,
        amount: cost,
        element: 'none',
        crit: false,
        hitIndex: 0,
        hitCount: 1,
      });
      applyHpDelta(ctx, user, cost, user.id);
    }
  }

  // **`extra.sequence`** — one action, several stages, one turn.
  //
  // A documented one-off key (`docs/CONTRACTS.md`, as for `statusRollOneOf`
  // above): the named abilities resolve in order from the same user,
  // immediately, as part of this action. Its only caller is the Leblanc
  // Syndicate's **No Love Lost**, which §4.5 of
  // `research/ffx2-leblanc-syndicate.md` describes as one loud, timed,
  // three-beat set piece — 8 constant hits, then a party-wide constant, then a
  // fraction of one character's remaining HP. Three formulas cannot be one
  // `AbilityDef`, and spreading them over three enemy turns would destroy the
  // set piece.
  //
  // `inSequence` is the recursion guard: a `sequence` on a sequenced ability is
  // ignored. `chain.ts::registerHit()` is target-keyed, so each stage's
  // chaining is already correct without further work. FFX-2 only — no FFX
  // ability sets the key and no FFX code path reads it.
  const sequence = options.inSequence ? undefined : ability.extra?.['sequence'];
  if (Array.isArray(sequence) && user.alive) {
    for (const nextId of sequence) {
      if (typeof nextId !== 'string') continue;
      const stage = ctx.abilities.get(nextId);
      if (!stage) continue;
      total += resolveAbility(ctx, user, stage, [], { ...options, inSequence: true });
    }
  }

  if (options.isCounter) {
    const first = pool[0];
    if (first) {
      ctx.emit({
        type: 'counter',
        actorId: user.id,
        targetId: first.id,
        abilityId: ability.id,
        cause: 'script',
      });
    }
  }
  return total;
}
