/**
 * One FF7 ability landing on its targets: the hit roll, the critical, the damage
 * chain, HP, KO, revival and the Limit gauge.
 *
 * Pure (AGENTS.md rule 1). Game case: **FF7 only.**
 *
 * **Draw order per target, fixed** (determinism): the hit draws (`hit.ts`: none
 * for an automatic hit or `canMiss === false`; Lucky then the hit roll for a
 * physical action; MD% then the hit roll for a magical one), then on a physical
 * hit the critical `Rnd(0..65535)`, then Random Variation's `Rnd(0..255)` for a
 * formula that takes it [core §3, §4.5]. Targets are rolled in the order given.
 * A formula with no variance (Fixed, `none`) draws nothing.
 */

import type { Affinity, CombatantId, ElementId, Ff7Combatant } from '../common/types.ts';
import type { Ff7AbilityDef, Ff7Affinity } from './defs.ts';
import {
  applyHpChange,
  damageAtRoll,
  HP_DAMAGE_CAP,
  rollVariance,
  rowHalves,
  splits,
  affinityForcesHit,
} from './formulas.ts';
import { critPct, rollCritical, rollMagicHit, rollPhysicalHit } from './hit.ts';
import { fillLimitGauge, limitReady } from './limit.ts';
import { defensesOf, elementsFor, isParty, levelOf, longRangeFor, type Ff7Env } from './internal.ts';
import { trunc } from './stats.ts';

/** What happened to one target. */
export interface Ff7TargetOutcome {
  targetId: CombatantId;
  /** The action connected (always true for `canMiss === false`). */
  hit: boolean;
  /** This action KO'd the target. */
  killed: boolean;
}

/** The shared event's element for an FF7 element list (the shared `ElementId` has no physical ones). */
function eventElement(elements: readonly string[]): ElementId {
  for (const e of elements) {
    if (e === 'fire' || e === 'ice' || e === 'lightning' || e === 'water' || e === 'holy' || e === 'gravity') return e;
  }
  return 'none';
}

/** The shared event's affinity word for an FF7 affinity level. */
function eventAffinity(levels: ReadonlyArray<Ff7Affinity | undefined>): Affinity | undefined {
  if (levels.includes('void')) return 'immune';
  if (levels.includes('absorb')) return 'absorb';
  const weak = levels.includes('weak');
  const half = levels.includes('half');
  if (weak && !half) return 'weak';
  if (half && !weak) return 'resist';
  return undefined;
}

/** Emit the Limit gauge when it changed [core §7]. */
export function emitLimit(env: Ff7Env, c: Ff7Combatant, before: number): void {
  const lim = c.ff7.limit;
  if (!lim || lim.gauge === before) return;
  env.emit({ type: 'limit-gauge', actorId: c.id, value: lim.gauge, level: lim.level, ready: limitReady(lim.gauge) });
}

/**
 * A KO: HP 0, the gauge emptied (core §7.2, single source: wiki Limit page), the
 * Turn Timer at 0 and every queued command or waiting menu of theirs dropped
 * [core §2.6, our estimate], Defend gone.
 */
export function knockOut(env: Ff7Env, c: Ff7Combatant, sourceId: CombatantId | undefined): void {
  c.hp = 0;
  c.alive = false;
  c.ff7.atb.turnTimer = 0;
  c.ff7.atb.ready = false;
  c.ff7.defending = false;
  env.rt.inputQueue = env.rt.inputQueue.filter((id) => id !== c.id);
  env.rt.actions = env.rt.actions.filter((a) => a.actorId !== c.id);
  env.emit(sourceId ? { type: 'ko', targetId: c.id, sourceId } : { type: 'ko', targetId: c.id });
  const lim = c.ff7.limit;
  if (lim && lim.gauge > 0) {
    const before = lim.gauge;
    lim.gauge = 0;
    emitLimit(env, c, before);
  }
}

/** Roll the hit for one target [core §3.1, §3.2]; no draw for `canMiss === false` or a hit-less action. */
function rollHit(env: Ff7Env, user: Ff7Combatant, target: Ff7Combatant, ability: Ff7AbilityDef, forced: boolean): boolean {
  if (ability.canMiss === false || !ability.hit) return true;
  const u = defensesOf(user);
  const t = defensesOf(target);
  if (ability.hit.kind === 'physical') {
    const atPct = ability.hit.atPct === 'weapon' ? user.ff7.derived.atPct : ability.hit.atPct;
    return rollPhysicalHit(
      {
        attackerDex: u.dex,
        atPct,
        attackerDfPct: u.dfPct,
        targetDfPct: t.dfPct,
        attackerLck: u.lck,
        targetLck: t.lck,
        attackerIsParty: isParty(user),
        targetIsParty: isParty(target),
        autoHit: forced,
      },
      env.rng,
    ).hit;
  }
  return rollMagicHit(
    { matPct: ability.hit.matPct, attackerLevel: levelOf(user), targetLevel: levelOf(target), targetMdPct: t.mdPct, autoHit: forced },
    env.rng,
  ).hit;
}

/** Revive a KO'd target with `[MaxHP / divisor]` HP; the Turn Timer starts from 0 [our estimate]. */
function revive(env: Ff7Env, target: Ff7Combatant, divisor: number): void {
  target.hp = Math.max(1, trunc(target.stats.maxHp / divisor));
  target.alive = true;
  target.ff7.atb.turnTimer = 0;
  target.ff7.atb.ready = false;
  env.emit({ type: 'revive', targetId: target.id, hp: target.hp, cause: 'phoenix-down' });
}

/**
 * Resolve `ability` from `user` on `targets` (already chosen and legal). Emits
 * `miss`, `damage` (negative = healing), `revive`, `ko` and `limit-gauge`.
 */
export function performAbility(env: Ff7Env, user: Ff7Combatant, ability: Ff7AbilityDef, targets: readonly Ff7Combatant[]): Ff7TargetOutcome[] {
  const out: Ff7TargetOutcome[] = [];
  const elements = elementsFor(env, user, ability);
  const longRange = longRangeFor(env, user, ability);
  const split = splits(ability.formula, targets.length, ability.canToggleAll === true);
  const healing = ability.heals === true || elements.includes('restorative');

  for (const target of targets) {
    // Revival (Phoenix Down) works only on the KO'd; everything else only on the living.
    if (ability.revive) {
      const wasKo = !target.alive;
      if (wasKo) revive(env, target, ability.revive.hpDivisor);
      else env.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'wrong-state' });
      out.push({ targetId: target.id, hit: wasKo, killed: false });
      continue;
    }
    if (!target.alive) {
      env.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'wrong-state' });
      out.push({ targetId: target.id, hit: false, killed: false });
      continue;
    }
    if (ability.formula === 'none') {
      out.push({ targetId: target.id, hit: true, killed: false });
      continue;
    }
    const affinities = target.ff7.enemy?.elements ?? {};
    const forced = affinityForcesHit(elements, affinities);
    if (!rollHit(env, user, target, ability, forced)) {
      env.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'evaded' });
      out.push({ targetId: target.id, hit: false, killed: false });
      continue;
    }

    let critical = false;
    if (ability.formula === 'physical') {
      // Party members add their weapon's crit bonus; neither weapon here has one [core §3.3].
      critical = rollCritical(critPct(defensesOf(user).lck, levelOf(user), levelOf(target)), env.rng);
    }
    const takesVariance = ability.formula === 'physical' || ability.formula === 'magical' || ability.formula === 'cure' || ability.formula === 'item';
    const roll = takesVariance ? rollVariance(env.rng) : 0;
    const t = defensesOf(target);
    const result = damageAtRoll(
      {
        formula: ability.formula,
        power: ability.power,
        user: { level: levelOf(user), att: user.ff7.derived.att, mat: user.ff7.derived.mat },
        target: { def: t.def, mdf: t.mdf, hp: target.hp, maxHp: target.stats.maxHp },
        elements,
        affinities,
        heals: healing,
        modifiers: {
          critical,
          rowHalves: rowHalves({ side: user.side, row: user.ff7.row }, { side: target.side, row: target.ff7.row }, longRange),
          targetDefending: target.ff7.defending === true,
          split,
        },
        final: { attackerHp: user.hp },
      },
      roll,
    );

    const levels = elements.map((e) => affinities[e]);
    if (result.kind !== 'damage') {
      // Death Weakness / Recovery are unreachable in the slice [core §6.2]; Immune is damage 0 or a miss.
      if (result.kind === 'immune' && result.countsAsMiss) {
        env.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'immune' });
        out.push({ targetId: target.id, hit: false, killed: false });
      } else {
        env.emit({
          type: 'damage', targetId: target.id, sourceId: user.id, amount: 0, element: eventElement(elements),
          affinity: 'immune', crit: false, hitIndex: 0, hitCount: 1,
        });
        out.push({ targetId: target.id, hit: true, killed: false });
      }
      continue;
    }

    const before = target.hp;
    target.hp = applyHpChange(target.hp, target.stats.maxHp, result.amount, result.restorative);
    const delta = before - target.hp;
    const affinity = eventAffinity(levels);
    env.emit({
      type: 'damage',
      targetId: target.id,
      sourceId: user.id,
      amount: result.restorative ? before - target.hp : result.amount, // healing is negative; a full target reads 0, never -0
      element: eventElement(elements),
      ...(affinity ? { affinity } : {}),
      crit: critical,
      hitIndex: 0,
      hitCount: 1,
      ...(result.amount >= HP_DAMAGE_CAP ? { capped: true } : {}),
    });

    // The Limit gauge fills only from HP an enemy took away [core §7.1].
    const lim = target.ff7.limit;
    if (!result.restorative && lim && !isParty(user) && delta > 0) {
      const lnum = env.reg.limits[target.id]?.lnum[lim.level - 1];
      if (lnum) {
        const was = lim.gauge;
        lim.gauge = fillLimitGauge(lim.gauge, delta, target.stats.maxHp, lnum, true);
        emitLimit(env, target, was);
      }
    }

    const killed = !result.restorative && target.hp <= 0;
    if (killed) knockOut(env, target, user.id);
    out.push({ targetId: target.id, hit: true, killed });
  }
  return out;
}
