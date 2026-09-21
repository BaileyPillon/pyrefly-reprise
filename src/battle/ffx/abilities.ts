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
import { applyStatus, bouncesOffReflect, consumeNulCharges, removeStatus, removeStatuses, rollStatus } from './statuses.ts';
import { applyDelay } from './turnQueue.ts';
import { isPerHitRandom, redirectTarget, reflectBounceTarget, resolveTargets } from './targeting.ts';
import {
  onDamageDealt,
  onDamageTaken,
  onFlatTrigger,
  onHealDealt,
  onTargeted,
  TACTICIAN_STATUSES,
  VICTIM_STATUSES,
} from './overdrive.ts';
import { runScriptedExtra } from './scripted.ts';
import { revealTarget, sensorKind } from './sensor.ts';

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
  /**
   * Compute the **damage chain** with this combatant's stats instead of the
   * acting one's, while every other part of the action — the events, the
   * targeting, the Overdrive bookkeeping — stays with the actor whose turn it
   * is.
   *
   * Exists for one documented case: a two-actor rig where one actor owns the
   * turn slot and the animation and a *different* actor owns the stat block.
   * `research/ffx-seymour-flux.md` §5.4 settles that ambiguity for Cross Cleave
   * and Total Annihilation — both are rows in Seymour Flux's own decompiled
   * action list (`m142`, §3.1/§3.2) and are merely animated on the Mortiorchis,
   * so they must be computed with **his** Strength 30 / Magic 15 and not the
   * mount's 40/40. §4.4.2's "On attribution" paragraph states the shipping rule
   * in as many words: "the Mortiorchis actor owns the turn slot and the
   * animation; the Seymour actor owns the stats".
   *
   * Set from `AbilityDef.extra.statsFrom` in `execute.ts`; unset everywhere
   * else, so no other encounter changes. See `docs/CONTRACT-CHANGES.md`.
   */
  statsUser?: FFXCombatant;
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

  // An enemy whose Overdrive gauge fills on **being targeted** is paid here,
  // once per action, before any hit resolves — a heal or a debuff counts.
  // Inert unless `ActorRuntime.gaugePerTargeting` is set [overdrive.ts].
  for (const t of targets) onTargeted(ctx, t, user);

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
        // The damage chain alone may read another actor's stat block
        // [ffx-seymour-flux §5.4] — see `ResolveOptions.statsUser`.
        user: options.statsUser ?? user,
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
            // A physical hit WAKES a sleeper [ffx-combat-core §4.2; the shipped
            // status record says it in as many words —
            // `data/ffx/statuses/core.ts` sleep: "Physical damage wakes the
            // sleeper; magic damage does not", and its `curedBy` lists "any
            // physical hit"]. This is additive and it closes a soft-lock, not
            // just a fidelity gap: `state.ts canAct` drops a sleeper out of the
            // CTB queue entirely, and `ticks.ts onTurnEnd` is the only place
            // `tickDurationStatuses` runs — so a sleeping actor never reaches a
            // turn end and its 3-turn Sleep never counts down. Measured in
            // Chapter 3: one Yu Pagoda Curse put Tidus to sleep on turn 17 of a
            // 204-turn battle and he never acted again.
            if (def.damageType === 'physical' && has(target, 'sleep')) {
              removeStatus(ctx, target, 'sleep', 'expired');
            }
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
      } else if ((pool === 'hp' || pool === 'both') && def.formula !== 'none' && isAlive(target)) {
        // **A connecting hit that computes to zero is still a hit, and FFX puts
        // the number on the screen.** `immune_to_percentage_damage` enemies
        // "take 0 from Percentage Total / Percentage Current"
        // [ffx-combat-core §291], and a Fury spell whose damage constant is 0 —
        // Bio Fury, Death Fury — is authored `power: 0` on purpose
        // [§5.7]: the cast is the *carrier* for a rider, not a blank.
        //
        // Suppressing the event made three shipped Overdrive rows invisible:
        // Bio Fury, Death Fury and Demi Fury each spent a full gauge and
        // emitted nothing but `action-start` / `overdrive-gauge{spent}` /
        // `action-end`, which reads exactly like a broken button. `formula:
        // 'none'` is excluded because those actions never ran a damage chain at
        // all (Steal, Use, Cheer) and have no number to show.
        dealDamage(ctx, target, 0, {
          sourceId: user.id,
          element: primaryElement,
          affinity: result.affinity,
          crit,
          hitIndex,
          hitCount: totalHits,
        });
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

      // **A petrified MONSTER always shatters** — no roll, no `shatter` flag
      // needed on whatever petrified it [ffx-seymour-anima-macalania §2.2,
      // verified: 2 sources: grayfox96's status-chance note + the FF Wiki
      // strategy section]. The flagged path above is the *other* rule: a
      // chance to shatter something that was **already** petrified, which is
      // what Seymour's -ra spells carry at 10.
      //
      // Until this existed, Petrify was a dead end against an enemy. Rikku's
      // Petrify Grenade and Kimahri's Stone Breath both apply `petrify` at
      // chance 254 and neither carries the `shatter` flag, so a petrified
      // Guado Guardian simply stood there: out of the turn queue
      // (`predicates.ts#inTurnQueue` excludes Petrify) but still **alive**, so
      // it went on Covering every physical aimed at Seymour and went on firing
      // its 1,000 HP Auto-Potion counter. §7 row 2 — "Petrify the Guardians
      // for an instant kill, at the cost of the overkill AP" — was unreachable
      // and the tactic spent four turns finding that out.
      //
      // Draws no RNG, so a seeded run is unchanged wherever it does not fire,
      // and it cannot fire in any shipped chapter: every FFX enemy this
      // project ships outside Macalania carries `petrify: 255`. FFX-2 runs its
      // own engine and is untouched [AGENTS.md rule 14].
      if (target.side === 'enemy' && has(target, 'petrify') && onField(target)) {
        ejectActor(ctx, target, 'shatter');
      }

      runScriptedExtra(ctx, user, def, target, result.amount);
      hitIndex++;
    }
  }

  // Scan opens the info panel. It is emitted **after** the hits, so the whole
  // of it is pure information: a reveal rolls nothing and therefore cannot move
  // the seeded RNG by one draw [ffx-combat-core §9, `sensor.ts`]. The FFX data
  // marks Scan with the `scan` status, which until now nothing read.
  const reveals = sensorKind(def);
  if (reveals) {
    for (const target of targets) revealTarget(ctx, user.id, target, reveals);
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
