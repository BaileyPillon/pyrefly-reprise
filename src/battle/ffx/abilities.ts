/**
 * Generic resolution of one {@link AbilityDef}.
 *
 * Everything a combatant can do — Attack, a spell, an item, an aeon special, an
 * enemy action, an Overdrive — is an `AbilityDef` with a {@link FormulaKey},
 * some {@link ActionFlag}s and a list of {@link StatusApplication}s, and it all
 * resolves through here. Genuinely one-off rules hang off `AbilityDef.extra`
 * and are dispatched in `scripted.ts`.
 */

import type {
  AbilityDef,
  AbilityId,
  CombatantId,
  ElementId,
  FFXCombatant,
  StatusId,
} from '../common/types.ts';
import { damageRng, percentRoll } from '../common/rng.ts';
import { idiv } from './math.ts';
import { type Ctx, has, hasFlag, isAlive, onField, rtOf, stacks } from './state.ts';
import { computeDamage, critChance, hitChance, poolOf, resolveElements } from './formulas.ts';
import type { TimingBonus } from './formulas.ts';
import { equipmentCrit, hasAuto, weaponElements, weaponStatusStrikes } from './equipment.ts';
import { applyMpDelta, dealDamage, ejectActor, healOutsideChain, koActor, reviveActor } from './hp.ts';
import { banishAeon } from './aeons.ts';
import { applyStatus, bouncesOffReflect, consumeNulCharges, removeStatuses, rollStatus } from './statuses.ts';
import { applyDelay } from './turnQueue.ts';
import { isPerHitRandom, redirectTarget, reflectBounceTarget, resolveTargets } from './targeting.ts';
import {
  onDamageDealt,
  onDamageTaken,
  onFlatTrigger,
  onHealDealt,
  TACTICIAN_STATUSES,
  VICTIM_STATUSES,
} from './overdrive.ts';
import { runScriptedExtra } from './scripted.ts';

/** Knobs the caller can override per resolution. */
export interface ResolveOptions {
  /** Overrides `def.hits` (reels, Fury casts). */
  hits?: number;
  /** Overrides `def.power` (a resolved reel shot, a Bushido success/fail row). */
  power?: number;
  /** The §5.2 timed-input bonus. */
  timing?: TimingBonus | null;
  gilSpent?: number;
  /** Counters cost no turn and never chain further counters. */
  isCounter?: boolean;
}

/** MP cost after Magic Booster, One MP Cost and Half MP Cost [ffx-combat-core §9]. */
export function mpCostFor(user: FFXCombatant, def: AbilityDef): number {
  if (has(user, 'mp-cost-zero')) return 0;
  if (user.side === 'enemy') return 0;
  let cost = def.mpCost;
  if (hasAuto(user, 'magic-booster') && (def.category === 'blackmagic' || def.category === 'whitemagic')) {
    cost *= 2;
  }
  if (hasAuto(user, 'one-mp-cost')) return cost > 0 ? 1 : 0;
  if (hasAuto(user, 'half-mp-cost')) cost = idiv(cost, 2);
  return cost;
}

/** Silence blocks Wht/Blk Magic and Summon — never an Overdrive [ffx-combat-core §4.2]. */
export function blockedBySilence(user: FFXCombatant, def: AbilityDef): boolean {
  if (!has(user, 'silence')) return false;
  return def.category === 'blackmagic' || def.category === 'whitemagic' || def.category === 'summon';
}

/** Statuses this action tries to land, including weapon strikes. */
function statusApplications(user: FFXCombatant, def: AbilityDef): Array<{ status: StatusId; chance: number; duration: number; stacks?: number }> {
  const own = def.statusEffects.map((s) => ({ ...s }));
  if (!hasFlag(def, 'inherits-weapon-properties')) return own;
  for (const strike of weaponStatusStrikes(user)) {
    if (own.some((s) => s.status === strike.status)) continue;
    own.push({ status: strike.status, chance: strike.chance, duration: 254 });
  }
  return own;
}

function elementFor(elements: readonly ElementId[]): ElementId {
  return elements.length > 0 ? (elements[0] as ElementId) : 'none';
}

/**
 * Resolve one action end to end.
 *
 * Returns the total HP damage dealt (positive) so callers can drive Overdrive
 * gauges, the BFA Talk counter and mid-battle triggers.
 */
export function resolveAbility(
  ctx: Ctx,
  user: FFXCombatant,
  def: AbilityDef,
  chosenTargets: readonly CombatantId[],
  options: ResolveOptions = {},
): number {
  const hitCount = Math.max(0, options.hits ?? def.hits);
  const perHitRandom = isPerHitRandom(def.targeting);
  const elements = resolveElements(user, def, weaponElements(user));
  const primaryElement = elementFor(def.element.length > 0 ? def.element : elements);
  const pool = poolOf(def);
  const heals = hasFlag(def, 'heals');
  let totalDealt = 0;
  let landedAnyStatus = false;

  let targets = resolveTargets(ctx, user, def, chosenTargets);
  if (targets.length === 0 && def.targeting !== 'self') return 0;

  const totalHits = perHitRandom ? hitCount : hitCount * Math.max(1, targets.length);
  let hitIndex = 0;

  for (let h = 0; h < hitCount; h++) {
    if (perHitRandom) targets = resolveTargets(ctx, user, def, []);
    for (const rawTarget of targets) {
      let target = redirectTarget(ctx, user, rawTarget, def);

      // Reflect bounces a single-target reflectable spell to the other side.
      if (bouncesOffReflect(def, target)) {
        const bounced = reflectBounceTarget(ctx, target);
        if (!bounced) {
          ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'nullified' });
          hitIndex++;
          continue;
        }
        onFlatTrigger(ctx, target, 'rook', 'rook');
        target = bounced;
      }

      // Nul statuses beat everything, including Absorb.
      if (consumeNulCharges(ctx, target, elements)) {
        ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'nullified' });
        onFlatTrigger(ctx, target, 'rook', 'rook');
        hitIndex++;
        continue;
      }

      // `misses-if-target-alive` whiffs on a living target — but a living
      // **Zombie** is still processed, and killed [ffx-combat-core §12.3].
      if (hasFlag(def, 'misses-if-target-alive') && isAlive(target) && !has(target, 'zombie')) {
        ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'wrong-state' });
        hitIndex++;
        continue;
      }

      // Hit roll.
      const chance = hitChance(user, target, def);
      if (chance !== null && !(chance > percentRoll(ctx.rng))) {
        ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'evaded' });
        onFlatTrigger(ctx, target, 'dancer', 'dancer');
        hitIndex++;
        continue;
      }

      // Critical roll.
      let crit = false;
      if (hasFlag(def, 'crit-eligible')) {
        if (has(user, 'guaranteed-critical')) crit = true;
        else crit = percentRoll(ctx.rng) < critChance(user, target, def, equipmentCrit(user));
      }

      const varianceRoll = damageRng(ctx.rng);
      const input = {
        user,
        target,
        def,
        crit,
        varianceRoll,
        elements,
        targetCtb: rtOf(ctx, target.id).ctb,
        ...(options.power !== undefined ? { power: options.power } : {}),
        ...(options.timing ? { timing: options.timing } : {}),
        ...(options.gilSpent !== undefined ? { gilSpent: options.gilSpent } : {}),
      };
      const result = def.formula === 'none' ? { amount: 0, affinity: 'normal' as const, capped: false } : computeDamage(input);

      // Revival effects (`heals` + `can-target-dead`: Life, Full-Life, Phoenix
      // Down, Mega Phoenix) resolve here, never through the HP path below.
      //
      // - On a **KO'd** target they revive it. That includes a KO'd Zombie: the
      //   reversal applies only to a *living* Zombie, and Zombie survives KO,
      //   so the target comes back still Zombie [ffx-combat-core §4.2,
      //   ffx-yunalesca §7.1, §15.2 #29]. Refusing to revive a KO'd Zombie —
      //   what this code used to do — makes every zombified member who dies
      //   permanently lost, which is exactly how Chapter 2 bled out in Form II.
      // - On a **living Zombie** they kill it outright ("revival effects
      //   instantly kill a living Zombie" — the `zombie` status contract).
      let resolvedAsRevival = false;
      if (heals && hasFlag(def, 'can-target-dead')) {
        if (!isAlive(target) && onField(target)) {
          resolvedAsRevival = true;
          const restore = Math.abs(result.amount) || idiv(target.stats.maxHp, 2);
          if (reviveActor(ctx, target, restore, def.id)) {
            onHealDealt(ctx, user, target, restore);
          } else {
            ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'immune' });
          }
        } else if (has(target, 'zombie')) {
          resolvedAsRevival = true;
          const lethal = Math.max(target.hp, Math.abs(result.amount));
          dealDamage(ctx, target, lethal, {
            sourceId: user.id,
            element: primaryElement,
            crit: false,
            hitIndex,
            hitCount: totalHits,
          });
          totalDealt += lethal;
        }
      }

      if (resolvedAsRevival) {
        // Handled above; skip the ordinary HP application.
      } else if (pool === 'ctb') {
        // Haste/Slow's own CTB shift is applied by the status path, so the
        // formula result only moves the counter for pure `ctb` actions.
        rtOf(ctx, target.id).ctb = Math.max(0, rtOf(ctx, target.id).ctb + result.amount);
      } else if (result.amount !== 0) {
        if (pool === 'mp' || pool === 'both') {
          const drained = applyMpDelta(ctx, target, result.amount, user.id);
          if (hasFlag(def, 'drains-mp') || def.formula === 'lancet') {
            applyMpDelta(ctx, user, -Math.abs(drained), user.id);
          }
        }
        if (pool === 'hp' || pool === 'both') {
          dealDamage(ctx, target, result.amount, {
            sourceId: user.id,
            element: primaryElement,
            affinity: result.affinity,
            crit,
            hitIndex,
            hitCount: totalHits,
            ...(result.capped ? { capped: true } : {}),
          });
          if (result.amount > 0) {
            totalDealt += result.amount;
            onDamageTaken(ctx, target, result.amount, user.side === 'enemy');
            onDamageDealt(ctx, user, def, result.amount);
            if (hasFlag(def, 'drains')) {
              healOutsideChain(ctx, user, result.amount, 'drain', user.id);
            }
          } else if (result.amount < 0) {
            onHealDealt(ctx, user, target, -result.amount);
          }
        }
      }

      // Statuses, then removals, then delay — the decompile's order.
      for (const app of statusApplications(user, def)) {
        // Death is `ko` in this contract (there is no separate death status),
        // and landing it must *kill* — HP to 0, a `ko` event, Auto-Life
        // consulted — not merely attach a marker to a living combatant. The
        // roll still goes through `rollStatus`, which is where a living
        // Zombie's Death resistance is raised to 255: that is the whole of
        // Mega Death's Zombie exception [ffx-yunalesca §5.3, §7.1].
        if (app.status === 'ko') {
          if (!isAlive(target)) continue;
          if (rollStatus(ctx, target, 'ko', app.chance)) {
            landedAnyStatus = true;
            koActor(ctx, target, user.id);
          }
          continue;
        }
        if (applyStatus(ctx, user, target, app, def.id, { skipCtbShift: pool === 'ctb' })) {
          landedAnyStatus = true;
          // Eject is not just a marker: it takes the target off the field, and
          // it counts as defeated [ffx-combat-core §4.2].
          if (app.status === 'eject') {
            if (target.side === 'aeon') banishAeon(ctx, target.id);
            else ejectActor(ctx, target, 'eject');
          }
          if (TACTICIAN_STATUSES.includes(app.status) && target.side === 'enemy') {
            onFlatTrigger(ctx, user, 'tactician', 'tactician');
          }
          if (VICTIM_STATUSES.includes(app.status) && user.side === 'enemy') {
            onFlatTrigger(ctx, target, 'victim', 'victim');
          }
        }
      }
      if (hasFlag(def, 'removes-statuses') && def.removesStatuses.length > 0) {
        removeStatuses(ctx, target, def.removesStatuses, def.category === 'item' ? 'cured' : 'dispelled');
      }
      if (hasFlag(def, 'weak-delay')) applyDelay(ctx, target.id, 'weak');
      if (hasFlag(def, 'strong-delay')) applyDelay(ctx, target.id, 'strong');

      // Shatter a petrified target.
      if (hasFlag(def, 'shatter') && has(target, 'petrify')) {
        const shatterChance = def.shatterChance ?? 0;
        if (shatterChance > 0 && percentRoll(ctx.rng) < shatterChance) {
          ejectActor(ctx, target, 'shatter');
        }
      }

      runScriptedExtra(ctx, user, def, target, result.amount);
      hitIndex++;
    }
  }

  // Self-Destruct removes the user once the hits have landed.
  if (hasFlag(def, 'destroys-user')) ejectActor(ctx, user, 'eject');
  void landedAnyStatus;
  void options.isCounter;
  return totalDealt;
}

/** The ability an item resolves to, with the item's own targeting applied. */
export function itemAbility(ctx: Ctx, itemId: AbilityId): AbilityDef | undefined {
  const item = ctx.content.item(itemId);
  const effect = ctx.content.itemEffect(itemId);
  if (!effect) return undefined;
  if (!item) return effect;
  return { ...effect, targeting: item.targeting, name: item.name, category: 'item' };
}

/** Cheer / Focus / Aim / Reflex / Luck / Jinx already at five stacks are inert. */
export function stackBuffMaxed(target: FFXCombatant, status: StatusId): boolean {
  return stacks(target, status) >= 5;
}
