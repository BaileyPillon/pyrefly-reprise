/**
 * HP changes outside the damage pipeline's own step: `applyHpDelta` (the KO, Auto-Life and chain-break
 * rules every hit ends in), `heal` and `revive`, plus the `ResolveContext` every resolver takes. Split out of
 * `resolve.ts` as a pure move (critic PR-0083 / F3; house rule 7). FFX-2 only.
 */

import type { CombatantId, Rng } from '../common/types.ts';
import type { AbilityRegistry, Emit, Ffx2Unit } from './internal.ts';
import { breakChain } from './chain.ts';
import { applyStatus, removeStatus } from './statuses.ts';
import { AUTO_LIFE_REVIVE_FRACTION } from './constants.ts';

export interface ResolveContext {
  units: Ffx2Unit[];
  abilities: AbilityRegistry;
  rng: Rng;
  emit: Emit;
  breaksDamageLimit(unit: Ffx2Unit): boolean; // per girl: an accessory or a Garment Grid gate
  timedAilmentDefaults?: boolean; // `EnemyGroupDef.timedAilmentDefaults` (`statuses.ts`, Chapter XIII)
  immuneHitsSkipChain?: boolean; // IC-1's OFF switch; absent = `constants.ts` IMMUNE_HITS_SKIP_CHAIN
  namedTargetsOnly?: boolean; // `extra.namedTargetsOnly` rows; absent = `constants.ts` NAMED_TARGETS_ONLY
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
