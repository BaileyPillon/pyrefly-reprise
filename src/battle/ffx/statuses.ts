/**
 * Status application, removal and the FFX-specific semantics around them
 * [ffx-combat-core §4].
 *
 * Two rules drive everything here and are the easiest to get wrong:
 *
 * 1. `chance` is a **raw 0-255 byte**, never a percentage.
 * 2. **Resistance subtracts, it does not multiply** — a Ward at 50 completely
 *    blocks a chance-50 application.
 *
 * The branch order is transcribed from `FFXStatusId`'s doc comment and
 * §4.1 and must not be reordered.
 */

import type {
  AbilityDef,
  CombatantId,
  ElementId,
  FFXCombatant,
  StatusApplication,
  StatusId,
  StatusInstance,
} from '../common/types.ts';
import { percentRoll } from '../common/rng.ts';
import { type Ctx, has, rtOf, statusOf } from './state.ts';
import { onHasteApplied, onSlowApplied } from './turnQueue.ts';

/** Statuses that tick down by 1 at the end of the victim's own action [§4.1]. */
export const DURATION_STATUSES: readonly StatusId[] = ['sleep', 'silence', 'darkness', 'slow', 'regen'];

/** Stacking buffs: 0-5, cleared by KO but surviving Petrification [§2.9]. */
export const STACKING_BUFFS: readonly StatusId[] = ['cheer', 'focus', 'aim', 'reflex', 'luck', 'jinx'];

/** Mix / tonic flags: battle-long, removed by KO, **not** by Petrification [§4.2]. */
export const MIX_FLAGS: readonly StatusId[] = [
  'max-hp-x2',
  'max-mp-x2',
  'mp-cost-zero',
  'damage-9999',
  'guaranteed-critical',
  'overdrive-x1_5',
  'overdrive-x2',
];

/** The four Nul charges, by the element each nullifies. */
export const NUL_BY_ELEMENT: Readonly<Partial<Record<ElementId, StatusId>>> = {
  fire: 'nulblaze',
  ice: 'nulfrost',
  lightning: 'nulshock',
  water: 'nultide',
};

/**
 * Statuses a KO does **not** clear.
 *
 * `zombie` is here deliberately: `ffx-combat-core §4.2`'s summary column reads
 * "cleared by KO: yes", but `ffx-yunalesca §15.2 #29` states from the decompiled
 * AI that "a KO'd but still zombified active member still contributes its full
 * 30" — the Form II/III Hellbiter weighting reads Zombie on KO'd slots, which
 * would be dead code otherwise. We follow the encounter document, which is the
 * more specific source, and keep the list in one place so it can be flipped.
 */
export const SURVIVES_KO: readonly StatusId[] = ['ko', 'scan', 'zombie', 'eject'];

/** What Esuna removes. Notably **not** Zombie [§4.2]. */
export const ESUNA_CURES: readonly StatusId[] = [
  'petrify',
  'poison',
  'confuse',
  'berserk',
  'sleep',
  'silence',
  'darkness',
  'slow',
];

/** What Dispel removes. */
export const DISPEL_REMOVES: readonly StatusId[] = [
  'power-break',
  'magic-break',
  'armor-break',
  'mental-break',
  'shell',
  'protect',
  'reflect',
  'nulblaze',
  'nulfrost',
  'nulshock',
  'nultide',
  'regen',
  'haste',
  'curse',
];

/** A blank instance for a status id. */
function makeInstance(app: StatusApplication, sourceId?: CombatantId, abilityId?: string): StatusInstance {
  const isNul =
    app.status === 'nulblaze' || app.status === 'nulfrost' || app.status === 'nulshock' || app.status === 'nultide';
  const inst: StatusInstance = {
    id: app.status,
    turnsRemaining: app.duration >= 254 ? app.duration : app.duration,
    ticksRemaining: null,
    charges: isNul ? Math.max(1, app.duration) : null,
    stacks: app.stacks ?? 0,
    permanent: app.duration >= 255,
  };
  if (sourceId !== undefined) inst.sourceId = sourceId;
  if (abilityId !== undefined) inst.sourceAbilityId = abilityId;
  return inst;
}

/**
 * The roll [ffx-combat-core §4.1]:
 *
 * ```
 * if chance === 255            -> applied (ignores immunity entirely)
 * else if resistance === 255   -> blocked
 * else if chance === 254       -> applied (guaranteed, immunity still blocks)
 * else if chance - resistance > (rng % 101) -> applied
 * ```
 *
 * The `rng % 101` draw is skipped entirely for the no-RNG branches, which keeps
 * the seeded stream tight for replays.
 */
export function rollStatus(ctx: Ctx, target: FFXCombatant, status: StatusId, chance: number): boolean {
  if (chance >= 255) return true;
  let resistance = target.immunities[status] ?? 0;
  // A living Zombie's resistance to ordinary instant death is raised so far
  // that chance-100 Death — Mega Death included — simply fails; only a
  // chance-255 "always inflicts death" gets through, and that returned above
  // [ffx-combat-core §4.2, ffx-yunalesca §7.1].
  if (status === 'ko' && has(target, 'zombie') && target.alive) resistance = 255;
  if (resistance >= 255) return false;
  if (chance === 254) return true;
  return chance - resistance > percentRoll(ctx.rng);
}

/**
 * Threaten's own probability model [ffx-combat-core §4.4]. Only a **success**
 * decays the chance, by `x0.7` floored with a floor of 1.
 */
export function rollThreaten(ctx: Ctx, target: FFXCombatant): boolean {
  if (target.immunityFlags.includes('immune-to-threaten')) return false;
  if ((target.immunities['threaten'] ?? 0) >= 255) return false;
  const rt = rtOf(ctx, target.id);
  const roll = ctx.rng.int(0, 99);
  if (roll < rt.threatenChance) {
    rt.threatenChance = Math.max(1, Math.floor(rt.threatenChance * 0.7));
    return true;
  }
  return false;
}

/** Wipe a combatant's statuses, keeping the ones in `keep`. */
function wipeStatuses(ctx: Ctx, target: FFXCombatant, keep: readonly StatusId[], reason: 'ko' | 'overwritten'): void {
  for (const key of Object.keys(target.statuses) as StatusId[]) {
    if (keep.includes(key)) continue;
    delete target.statuses[key];
    // The two pool flags are a stat change while they are on, so dropping one
    // has to put the ceiling back — see {@link applyPoolDoubler}.
    if (key === 'max-hp-x2' || key === 'max-mp-x2') applyPoolDoubler(target, key, false);
    ctx.emit({ type: 'status-remove', targetId: target.id, status: key, reason });
  }
}

/**
 * Try to land one status.
 *
 * Returns true when it was applied. Emits `status-add` and, for Haste/Slow, the
 * immediate CTB shift they carry [ffx-combat-core §1.4].
 */
export function applyStatus(
  ctx: Ctx,
  source: FFXCombatant | undefined,
  target: FFXCombatant,
  app: StatusApplication,
  abilityId?: string,
  opts?: { skipCtbShift?: boolean },
): boolean {
  const { status } = app;

  // FFX does not refresh or stack a status that is already present, except for
  // the six stacking buffs, which add one level up to five.
  if (has(target, status)) {
    if (STACKING_BUFFS.includes(status)) {
      const inst = statusOf(target, status);
      if (inst && inst.stacks < 5) {
        inst.stacks = Math.min(5, inst.stacks + Math.max(1, app.stacks ?? 1));
        ctx.emit({ type: 'status-add', targetId: target.id, status, instance: { ...inst } });
        return true;
      }
    }
    return false;
  }

  // Haste and Slow are mutually exclusive; a permanent one cannot be displaced.
  if (status === 'haste' && (statusOf(target, 'slow')?.permanent ?? false)) return false;
  if (status === 'slow' && (statusOf(target, 'haste')?.permanent ?? false)) return false;

  const landed = status === 'threaten' ? rollThreaten(ctx, target) : rollStatus(ctx, target, status, app.chance);
  if (!landed) return false;

  if (status === 'haste') removeStatus(ctx, target, 'slow', 'overwritten');
  if (status === 'slow') removeStatus(ctx, target, 'haste', 'overwritten');
  if (status === 'provoke' || status === 'threaten') {
    removeStatus(ctx, target, 'berserk', 'overwritten');
    removeStatus(ctx, target, 'confuse', 'overwritten');
  }

  const instance = makeInstance(app, source?.id, abilityId);
  // **Doom runs on the victim's own clock** [ffx-bfa-yu-yevon §3.1, §3.5].
  //
  // Yu Yevon declares `doomTurns: 3`, and the research it is cited to is
  // explicit about what that number is: *"Doom counter kills Yu Yevon in
  // exactly 3 turns (e.g., Candle of Life)"* `[verified: 2 sources]`. The field
  // had no reader anywhere, and the Candle of Life's own record carries a
  // `duration: 254` its comment calls a **placeholder** ("the actual Doom
  // countdown is per-target; see EnemyFields.doomTurns"), so the one item the
  // chapter ships for the Doom route set a 254-turn timer and killed nobody:
  // measured on the shipped board, the Candle landed and the battle ran out to
  // the stalemate guard with him on 6,001.
  if (status === 'doom' && target.enemy?.doomTurns !== undefined) {
    instance.turnsRemaining = target.enemy.doomTurns;
  }
  target.statuses[status] = instance;
  ctx.emit({ type: 'status-add', targetId: target.id, status, instance: { ...instance } });

  // Petrification wipes every other status; the stacking buffs survive it.
  if (status === 'petrify') wipeStatuses(ctx, target, ['petrify', ...STACKING_BUFFS, ...MIX_FLAGS], 'overwritten');
  if (status === 'max-hp-x2' || status === 'max-mp-x2') applyPoolDoubler(target, status, true);
  // Haste halves the target's current counter and Slow doubles it. When the
  // action already used the `ctb` formula the shift has been applied there, so
  // the caller suppresses it rather than paying twice [ffx-combat-core §1.4].
  if (!opts?.skipCtbShift) {
    if (status === 'haste') onHasteApplied(ctx, target.id);
    if (status === 'slow') onSlowApplied(ctx, target.id);
  }
  return true;
}

/** Remove a status if present. */
export function removeStatus(
  ctx: Ctx,
  target: FFXCombatant,
  status: StatusId,
  reason: 'expired' | 'cured' | 'dispelled' | 'consumed' | 'ko' | 'overwritten',
): boolean {
  if (!has(target, status)) return false;
  // Auto-Regen and other stack-255 statuses are not dispellable.
  if (reason === 'dispelled' && (statusOf(target, status)?.permanent ?? false)) return false;
  delete target.statuses[status];
  if (status === 'max-hp-x2' || status === 'max-mp-x2') applyPoolDoubler(target, status, false);
  ctx.emit({ type: 'status-remove', targetId: target.id, status, reason });
  return true;
}

/**
 * `max-hp-x2` / `max-mp-x2`, the two Mix/tonic flags that are a **pool change**
 * rather than a damage-chain step [ffx-combat-core §8.2].
 *
 * Both were listed in {@link MIX_FLAGS}, both were applied by items the builds
 * ship — Stamina Tablet, Stamina Tonic, Mana Tablet, Mana Tonic and four Mixes
 * — and **neither did anything**: nothing in the engine read the status, so the
 * two Stamina Tablets `ffx-bfa-yu-yevon §4.4` puts in the Dream's End bag were
 * inert. That is load-bearing for Chapter 3, where Ultimate Jecht Shot lands
 * for ~3,000 on a Yuna whose maximum is 2,700, so the party's healer cannot
 * survive it **at full HP** and the fight ends on the first one that is not
 * answered by a Talk or an aeon.
 *
 * The status record is explicit about the shape: *"Doubles the carrier's
 * effective max HP. **No immediate healing** — existing current HP is
 * unchanged, only the ceiling rises"* (`data/ffx/statuses/stacks-and-flags.ts`).
 * So this moves the ceiling and nothing else; on removal the ceiling comes back
 * down and current HP is clamped under it. The pool caps are §9's.
 */
function applyPoolDoubler(target: FFXCombatant, status: 'max-hp-x2' | 'max-mp-x2', on: boolean): void {
  const hp = status === 'max-hp-x2';
  const cap = hp ? 99999 : 9999;
  const stats = target.stats;
  if (hp) {
    stats.maxHp = on ? Math.min(cap, stats.maxHp * 2) : Math.max(1, Math.ceil(stats.maxHp / 2));
    target.hp = Math.min(target.hp, stats.maxHp);
  } else {
    stats.maxMp = on ? Math.min(cap, stats.maxMp * 2) : Math.max(0, Math.ceil(stats.maxMp / 2));
    target.mp = Math.min(target.mp, stats.maxMp);
  }
}

/** Remove every status in a list (Esuna, Remedy, Dispel, `removes-statuses`). */
export function removeStatuses(
  ctx: Ctx,
  target: FFXCombatant,
  list: readonly StatusId[],
  reason: 'cured' | 'dispelled',
): number {
  let count = 0;
  for (const s of list) if (removeStatus(ctx, target, s, reason)) count++;
  return count;
}

/** Everything a KO clears [ffx-combat-core §4.2]. */
export function clearStatusesOnKo(ctx: Ctx, target: FFXCombatant): void {
  wipeStatuses(ctx, target, SURVIVES_KO, 'ko');
}

/**
 * Nul statuses beat everything: if the attack's element set is fully covered by
 * Nul charges on the target, the attack misses entirely (0 damage, no status)
 * and one charge of each relevant Nul is consumed. This happens **before**
 * affinity is consulted [ffx-combat-core §3].
 */
export function consumeNulCharges(ctx: Ctx, target: FFXCombatant, elements: readonly ElementId[]): boolean {
  const real = elements.filter((e) => e !== 'none');
  if (real.length === 0) return false;
  const nuls: StatusId[] = [];
  for (const e of real) {
    const nul = NUL_BY_ELEMENT[e];
    if (!nul || !has(target, nul)) return false;
    nuls.push(nul);
  }
  for (const nul of nuls) {
    const inst = statusOf(target, nul);
    if (!inst) continue;
    if (inst.permanent) continue; // SOS-Nul nullifies every attack of that element.
    inst.charges = (inst.charges ?? 1) - 1;
    if (inst.charges <= 0) removeStatus(ctx, target, nul, 'consumed');
  }
  return true;
}

/**
 * Tick the five duration statuses down by 1 at the end of the victim's own
 * action [ffx-combat-core §4.1].
 *
 * Regen's *payout* fires at the start of any unit's turn (§4.3), but its
 * *duration* is counted here in the carrier's own turns, which is what makes
 * the published "10 turns" figure mean what players observe.
 */
export function tickDurationStatuses(ctx: Ctx, target: FFXCombatant): void {
  for (const status of DURATION_STATUSES) {
    const inst = statusOf(target, status);
    if (!inst || inst.permanent) continue;
    const turns = inst.turnsRemaining;
    if (turns === null || turns >= 254) continue;
    inst.turnsRemaining = turns - 1;
    ctx.emit({ type: 'status-tick', targetId: target.id, status, remaining: inst.turnsRemaining });
    if (inst.turnsRemaining <= 0) removeStatus(ctx, target, status, 'expired');
  }
}

/**
 * Guard / Sentinel / Defend and the two aeon stances last until the user's next
 * turn, so they are dropped at the *start* of it.
 */
export function clearUntilNextTurnStatuses(ctx: Ctx, target: FFXCombatant): void {
  for (const status of ['defend', 'guard', 'sentinel', 'shield', 'boost'] as const) {
    removeStatus(ctx, target, status, 'expired');
  }
}

/**
 * Keep the dynamic `critical` (SOS) status in sync: automatic while HP is below
 * 50% of max [ffx-combat-core §4.2].
 */
export function refreshCriticalStatus(ctx: Ctx, target: FFXCombatant): void {
  const shouldHave = target.alive && target.hp > 0 && target.hp * 2 < target.stats.maxHp;
  const hasIt = has(target, 'critical');
  if (shouldHave && !hasIt) {
    const instance: StatusInstance = {
      id: 'critical',
      turnsRemaining: null,
      ticksRemaining: null,
      charges: null,
      stacks: 0,
      permanent: false,
    };
    target.statuses['critical'] = instance;
    ctx.emit({ type: 'status-add', targetId: target.id, status: 'critical', instance: { ...instance } });
  } else if (!shouldHave && hasIt) {
    removeStatus(ctx, target, 'critical', 'expired');
  }
}

/** Does this action bounce off the target's Reflect? [ffx-combat-core §4.2] */
export function bouncesOffReflect(def: AbilityDef, target: FFXCombatant): boolean {
  if (!has(target, 'reflect')) return false;
  if (!def.flags.includes('reflectable')) return false;
  // Party-wide spells, Dispel, items, Overdrives and Mixes never bounce.
  if (def.targeting === 'all-enemies' || def.targeting === 'all-allies' || def.targeting === 'all') return false;
  if (def.category === 'item' || def.category === 'overdrive') return false;
  return true;
}
