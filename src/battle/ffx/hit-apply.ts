/**
 * One hit of one action against one target: ask the game's kernels what it does, then carry it out in the engine.
 *
 * Split out of `abilities.ts` (re-parity W1; **FFX only**). `adapt/hit.ts#resolveHit` runs the game's per-hit
 * pipeline (the Nul check, the hit roll, the base damage of every class, the modifier chain, the critical roll,
 * the cap) with the draws in the game's order. This module wraps that in the engine's own business around a hit:
 * Reflect and Cover, the events, the HP / MP / CTB application, revival, the drain heal, the Overdrive gauges, the
 * status rolls and removals, Delay, shatter and the scripted extras. None of that is the kernels' job (the status
 * rolls and the turn queue are batch W2).
 */

import type { AbilityDef, ElementId, FFXCombatant, StatusId } from '../common/types.ts';
import { idiv } from './math.ts';
import { type Ctx, has, hasFlag, isAlive, onField, rtOf } from './state.ts';
import { type HitDraws } from './adapt/draws.ts';
import { engineDamageClass } from './adapt/command.ts';
import { resolveHit } from './adapt/hit.ts';
import { weaponStatusStrikes } from './equipment.ts';
import { applyMpDelta, dealDamage, ejectActor, healOutsideChain, koActor, reviveActor } from './hp.ts';
import { banishAeon } from './aeons.ts';
import { applyStatus, bouncesOffReflect, removeStatus, removeStatuses, rollStatus } from './statuses.ts';
import { applyDelay } from './turnQueue.ts';
import { redirectTarget, reflectBounceTarget } from './targeting.ts';
import {
  onDamageDealt,
  onDamageTaken,
  onFlatTrigger,
  onHealDealt,
  TACTICIAN_STATUSES,
  VICTIM_STATUSES,
} from './overdrive.ts';
import { runScriptedExtra } from './scripted.ts';
import type { ResolveOptions } from './abilities.ts';
import { percentRoll } from '../common/rng.ts';

/** Everything the hits of one action share, and the two running figures they add to. */
export interface HitScope {
  ctx: Ctx;
  user: FFXCombatant;
  def: AbilityDef;
  options: ResolveOptions;
  draws: HitDraws;
  /** The element the damage events name. */
  primaryElement: ElementId;
  /** How many hits the whole action makes in all (targets times hits), for the events. */
  totalHits: number;
  /** Index of the next hit, advanced once per hit whatever came of it. */
  hitIndex: number;
  /** Total HP damage dealt so far (positive only). */
  totalDealt: number;
}

/** Statuses this action tries to land, including weapon strikes. */
function statusApplications(
  user: FFXCombatant,
  def: AbilityDef,
): Array<{ status: StatusId; chance: number; duration: number; stacks?: number }> {
  const own = def.statusEffects.map((s) => ({ ...s }));
  if (!hasFlag(def, 'inherits-weapon-properties')) return own;
  for (const strike of weaponStatusStrikes(user)) {
    if (own.some((s) => s.status === strike.status)) continue;
    own.push({ status: strike.status, chance: strike.chance, duration: 254 });
  }
  return own;
}

/** Write the Nul counters the hit's Nul check ticked back onto the target's statuses, dropping a spent one. */
function writeBackNul(ctx: Ctx, target: FFXCombatant, nul: { tide: number; blaze: number; shock: number; frost: number }): void {
  const pairs: Array<[StatusId, number]> = [
    ['nultide', nul.tide],
    ['nulblaze', nul.blaze],
    ['nulshock', nul.shock],
    ['nulfrost', nul.frost],
  ];
  for (const [status, counter] of pairs) {
    const inst = target.statuses[status];
    if (!inst || inst.permanent) continue;
    if (counter <= 0) removeStatus(ctx, target, status, 'consumed');
    else inst.charges = counter;
  }
}

/** Resolve one hit on `rawTarget`. The engine's Reflect, Cover and Provoke come first, as they always did. */
export function resolveOneHit(scope: HitScope, rawTarget: FFXCombatant): void {
  const { ctx, user, def, options } = scope;
  let target = redirectTarget(ctx, user, rawTarget, def);

  // Reflect bounces a single-target reflectable spell to the other side.
  if (bouncesOffReflect(def, target)) {
    const bounced = reflectBounceTarget(ctx, target);
    if (!bounced) {
      ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'nullified' });
      scope.hitIndex++;
      return;
    }
    onFlatTrigger(ctx, target, 'rook', 'rook');
    target = bounced;
  }

  const row = options.rowFor?.(target) ?? def; // this target's row: DmgCon and rider (od5); draws nothing
  const targetRt = rtOf(ctx, target.id);
  const report = resolveHit(
    {
      // The damage chain alone may read another actor's stat block [ffx-seymour-flux §5.4] — see `ResolveOptions.statsUser`.
      actor: user,
      statsUser: options.statsUser ?? user,
      target,
      row,
      ...(options.power !== undefined ? { power: options.power } : {}),
      ...(options.timing ? { timing: options.timing } : {}),
      ...(options.gilSpent !== undefined ? { gilSpent: options.gilSpent } : {}),
      targetCtb: targetRt.ctb,
      targetTick: targetRt.base,
      isCounter: options.isCounter === true || hasFlag(def, 'is-counter'),
    },
    scope.draws,
  );

  // The Nul check: the game ticks the counters of a nullified hit, and only of that.
  if (report.outcome === 'nullified') {
    writeBackNul(ctx, target, report.nul);
    ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'nullified' });
    onFlatTrigger(ctx, target, 'rook', 'rook');
    scope.hitIndex++;
    return;
  }
  // `misses-if-target-alive` (Phoenix Down) whiffs on a living target — but a living **Zombie** is still
  // processed, and killed [ffx-combat-core §12.3]: the game's "no effect" answer, which draws nothing.
  if (report.outcome === 'noEffect') {
    ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'wrong-state' });
    scope.hitIndex++;
    return;
  }
  if (report.outcome === 'miss') {
    ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'evaded' });
    onFlatTrigger(ctx, target, 'dancer', 'dancer');
    scope.hitIndex++;
    return;
  }

  const [hpAmount, mpAmount, ctbAmount] = report.amounts;
  const crit = report.crit;
  const heals = hasFlag(def, 'heals');
  let resolvedAsRevival = false;

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
  if (heals && hasFlag(def, 'can-target-dead')) {
    if (!isAlive(target) && onField(target)) {
      resolvedAsRevival = true;
      const restore = Math.abs(hpAmount) || idiv(target.stats.maxHp, 2);
      if (reviveActor(ctx, target, restore, def.id)) {
        onHealDealt(ctx, user, target, restore);
      } else {
        ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'immune' });
      }
    } else if (has(target, 'zombie')) {
      resolvedAsRevival = true;
      const lethal = Math.max(target.hp, Math.abs(hpAmount));
      dealDamage(ctx, target, lethal, {
        sourceId: user.id,
        element: scope.primaryElement,
        crit: false,
        hitIndex: scope.hitIndex,
        hitCount: scope.totalHits,
      });
      scope.totalDealt += lethal;
    }
  }

  if (!resolvedAsRevival) {
    // The CTB class. Haste/Slow's own CTB shift is applied by the status path, so the formula result only moves
    // the counter for pure `ctb` actions.
    if ((report.classes & 4) !== 0) targetRt.ctb = Math.max(0, targetRt.ctb + ctbAmount);

    // The MP class: restores (Ether) or drains (Osmose, Lancet), and the drainer gains what was taken.
    if ((report.classes & 2) !== 0 && mpAmount !== 0) {
      const drained = applyMpDelta(ctx, target, mpAmount, user.id);
      if (hasFlag(def, 'drains-mp') || def.formula === 'lancet') applyMpDelta(ctx, user, -Math.abs(drained), user.id);
    }

    // The HP class.
    if ((report.classes & 1) !== 0 && hpAmount !== 0) {
      dealDamage(ctx, target, hpAmount, {
        sourceId: user.id,
        element: scope.primaryElement,
        affinity: report.affinity,
        crit,
        hitIndex: scope.hitIndex,
        hitCount: scope.totalHits,
        ...(report.capped ? { capped: true } : {}),
      });
      if (hpAmount > 0) {
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
        scope.totalDealt += hpAmount;
        onDamageTaken(ctx, target, hpAmount, user.side === 'enemy');
        onDamageDealt(ctx, user, def, hpAmount);
        if (hasFlag(def, 'drains')) {
          healOutsideChain(ctx, user, hpAmount, 'drain', user.id);
        }
      } else {
        onHealDealt(ctx, user, target, -hpAmount);
      }
    } else if (((report.classes | engineDamageClass(def)) & 1) !== 0 && def.formula !== 'none' && isAlive(target)) {
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
        element: scope.primaryElement,
        affinity: report.affinity,
        crit,
        hitIndex: scope.hitIndex,
        hitCount: scope.totalHits,
      });
    }
  }

  // Statuses, then removals, then delay — the decompile's order.
  for (const app of statusApplications(user, row)) {
    // Death is `ko` in this contract (there is no separate death status),
    // and landing it must *kill* — HP to 0, a `ko` event, Auto-Life
    // consulted — not merely attach a marker to a living combatant. The
    // roll still goes through `rollStatus`, which is where a living
    // Zombie's Death resistance is raised to 255: that is the whole of
    // Mega Death's Zombie exception [ffx-yunalesca §5.3, §7.1].
    if (app.status === 'ko') {
      if (!isAlive(target)) continue;
      if (rollStatus(ctx, target, 'ko', app.chance)) koActor(ctx, target, user.id);
      continue;
    }
    if (applyStatus(ctx, user, target, app, def.id, { skipCtbShift: (report.classes & 4) !== 0 })) {
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
  if (hasFlag(row, 'weak-delay')) applyDelay(ctx, target.id, 'weak');
  if (hasFlag(row, 'strong-delay')) applyDelay(ctx, target.id, 'strong');

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
  // Draws no RNG, so a seeded run is unchanged wherever it does not fire, and it cannot fire in
  // any shipped chapter: every FFX enemy this project ships outside Macalania carries
  // `petrify: 255`. FFX-2 runs its own engine and is untouched [AGENTS.md rule 14].
  if (target.side === 'enemy' && has(target, 'petrify') && onField(target)) {
    ejectActor(ctx, target, 'shatter');
  }

  runScriptedExtra(ctx, user, def, target, hpAmount);
  scope.hitIndex++;
}

