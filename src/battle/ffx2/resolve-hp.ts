/**
 * HP changes outside the damage pipeline's own step: `applyHpDelta` (the KO, Auto-Life and chain-break
 * rules every hit ends in), `heal` and `revive`, plus the `ResolveContext` every resolver takes. Split out of
 * `resolve.ts` as a pure move (critic PR-0083 / F3; house rule 7). FFX-2 only.
 */

import type { AbilityDef, BattleState, CombatantId } from '../common/types.ts';
import type { BattleRng } from '../common/streams.ts';
import type { AbilityRegistry, Emit, Ffx2Unit, ItemRegistry } from './internal.ts';
import { breakChain } from './chain.ts';
import { applyStatus, removeStatus } from './statuses.ts';
import { AUTO_LIFE_REVIVE_FRACTION } from './constants.ts';
import { statusWord1 } from './adapt/words.ts';
import { modDraw } from './adapt/draws.ts';
import { resetGaugeOnKo } from './atb-engine.ts';
import { hasAutoLife } from './kernel/status-timers-set.ts';
import { leavesOnDeath } from './adapt/death-patterns.ts';

export interface ResolveContext {
  units: Ffx2Unit[];
  abilities: AbilityRegistry;
  rng: BattleRng;
  emit: Emit;
  /** A result was applied to `target` by `source`'s command `ability` (AI-FFX2-b): the engine hands it to the target's script `onResult`. Absent in unit fixtures. */
  onResult?(target: Ffx2Unit, source: Ffx2Unit, ability: AbilityDef): void;
  breaksDamageLimit(unit: Ffx2Unit): boolean; // per girl: an accessory or a Garment Grid gate
  immuneHitsSkipChain?: boolean; // IC-1's switch: no longer read (the game's chain counter rises only on a positive HP hit)
  namedTargetsOnly?: boolean; // `extra.namedTargetsOnly` rows; absent = `constants.ts` NAMED_TARGETS_ONLY
  state?: BattleState; // the battle's flags: a stolen item goes to `inventory:<id>`, stolen gil to `stolenGil` (`steal.ts`)
  items?: ItemRegistry; // item names for the steal message
  /** A hit's Delay damage closed this unit's open command menu (`apply_atb_damage`, re-parity W4); the engine drops the menu. */
  onMenuClosed?(unit: Ffx2Unit): void;
  /** A unit was knocked out (`pp_ko_resolve` marked it dead): the engine REQUESTS its script's death entry (kind 4), which runs after the action in flight (re-parity RC9, lane X2-E). Absent in unit fixtures. */
  onKo?(target: Ffx2Unit, killer: CombatantId | undefined): void;
  /**
   * The engine's queue of counters (re-parity X2-D, `applied.ts`): a result applied to a girl who holds Counterattack, Evade & Counter
   * or Magic Counter may set one off; the engine plays it after the action. `pending` is how many she already has waiting. Absent in
   * unit fixtures: then no counter is ever queued.
   */
  counters?: {
    pending(target: Ffx2Unit): number;
    queue(target: Ffx2Unit, source: Ffx2Unit, cause: 'counterattack' | 'evade-and-counter' | 'magic-counter'): void;
  };
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

  // The knock-out routine runs first (`pp_ko_resolve`): the command in flight is dropped and the gauge is the whole standard
  // wait, which a revived unit then pays (`MsChrAtbInit(chr, 1, -1)`, one draw).
  resetGaugeOnKo(target, ctx.units, modDraw(ctx.rng, 64)); // `& 0x3f` of a draw of the unit's own purpose-0 stream, as the kernel names it

  // Auto-Life (`pp_has_auto_life`): dead, not a character that leaves on death (a monster whose script wrote a death pattern other than 0), Auto-Life on, and not ejected.
  if (hasAutoLife(true, leavesOnDeath(target), statusWord1(target))) {
    removeStatus(target, 'auto-life');
    removeStatus(target, 'ko'); // a Death status that landed in the same hit is undone with the life it was spent on
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
  ctx.onKo?.(target, sourceId); // requests the monster's death entry, which runs after the action (`engineHooks.ts#markDeathEntry`)
}

/** Restore HP outside the damage chain (a Regen tick, a revival). */
export function heal(ctx: ResolveContext, target: Ffx2Unit, amount: number, cause: string): void {
  if (amount <= 0) return;
  const before = target.hp;
  target.hp = Math.min(target.stats.maxHp, target.hp + amount);
  const gained = target.hp - before;
  if (gained > 0) ctx.emit({ type: 'heal', targetId: target.id, amount: gained, cause });
}

/**
 * What a revival leaves behind once a heal has already put HP back on a KO'd unit (the command-row path: the heal and
 * the cleansed Death status are the kernels' result): the KO status goes, the unit is back on the field, and the
 * `revive` (and, for a part, `part-restored`) event says so. FFX-2 only.
 */
export function afterRevive(ctx: ResolveContext, target: Ffx2Unit, cause: string): void {
  removeStatus(target, 'ko');
  target.alive = true;
  target.removed = false;
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
