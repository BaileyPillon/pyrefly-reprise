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
import { resolveTargets } from './targeting.ts';
import { AUTO_LIFE_REVIVE_FRACTION } from './constants.ts';

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

/** Apply an ability's status riders to one target. §2.6a "Status 1". */
function applyRiders(ctx: ResolveContext, user: Ffx2Unit, target: Ffx2Unit, ability: AbilityDef): void {
  for (const application of ability.statusEffects) {
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
  options: { multiTarget?: boolean; isCounter?: boolean; hitsOverride?: number } = {},
): number {
  const pool = resolveTargets(ctx.units, user, ability, requested, ctx.rng);
  if (pool.length === 0) return 0;

  const mpCost = user.statuses.spellspring ? 0 : ability.mpCost;
  if (mpCost > 0) user.mp = Math.max(0, user.mp - mpCost);

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

      if (ability.formula === 'none') {
        applyRiders(ctx, user, target, ability);
        index += 1;
        continue;
      }

      const chainCount = registerHit(target, crit);
      ctx.emit({
        type: 'chain',
        targetId: target.id,
        count: chainCount,
        multiplier: chainMultiplier(chainCount),
      });

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

      applyRiders(ctx, user, target, ability);
      index += 1;
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
