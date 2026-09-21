/**
 * Turning a {@link Targeting} value into actual combatants.
 *
 * The UI never re-derives legality — `AvailableCommand.validTargets` comes from
 * here already resolved [docs/CONTRACTS.md].
 */

import type { AbilityDef, CombatantId, FFXCombatant, Targeting } from '../common/types.ts';
import {
  type Ctx,
  alliesOf,
  enemies,
  friendlies,
  has,
  isAlive,
  livingEnemies,
  livingFriendlies,
  onField,
  targetable,
  tryActor,
} from './state.ts';

/** Candidates a command may legally be pointed at. */
export function validTargets(ctx: Ctx, user: FFXCombatant, def: AbilityDef): CombatantId[] {
  const canTargetDead = def.flags.includes('can-target-dead');
  const alive = (c: FFXCombatant): boolean => (canTargetDead ? onField(c) : isAlive(c));
  const foes = (user.side === 'enemy' ? friendlies(ctx) : enemies(ctx)).filter((c) => targetable(c) && alive(c));
  const mates = alliesOf(ctx, user).filter((c) => targetable(c) && alive(c));

  switch (def.targeting) {
    case 'single-enemy':
    case 'all-enemies':
    case 'random-enemy':
      return foes.map((c) => c.id);
    case 'single-ally':
    case 'all-allies':
    case 'random-ally':
      return mates.map((c) => c.id);
    case 'single-any':
    case 'all':
      return [...mates, ...foes].map((c) => c.id);
    case 'self':
      return [user.id];
    default:
      return [];
  }
}

/** True when a targeting value picks a fresh target for every hit. */
export function isPerHitRandom(targeting: Targeting): boolean {
  return targeting === 'random-enemy' || targeting === 'random-ally';
}

/**
 * The combatants one hit of this action lands on.
 *
 * `chosen` is what the command carried; an empty list falls back to the
 * targeting rule so an AI script can submit `targets: []` and get sane
 * behaviour.
 */
export function resolveTargets(
  ctx: Ctx,
  user: FFXCombatant,
  def: AbilityDef,
  chosen: readonly CombatantId[],
): FFXCombatant[] {
  const pickAll = (list: FFXCombatant[]): FFXCombatant[] => list;
  const foes = user.side === 'enemy' ? livingFriendlies(ctx) : livingEnemies(ctx);
  const mates = alliesOf(ctx, user).filter((c) => targetable(c) && (def.flags.includes('can-target-dead') || isAlive(c)));

  switch (def.targeting) {
    case 'self':
      return [user];
    case 'all-enemies':
      return pickAll(foes);
    case 'all-allies':
      return pickAll(mates);
    case 'all':
      return [...mates, ...foes];
    case 'random-enemy':
      return foes.length > 0 ? [ctx.rng.pick(foes)] : [];
    case 'random-ally':
      return mates.length > 0 ? [ctx.rng.pick(mates)] : [];
    default:
      break;
  }

  const explicit = chosen
    .map((id) => tryActor(ctx, id))
    .filter((c): c is FFXCombatant => c !== undefined && onField(c));
  if (explicit.length > 0) return explicit.slice(0, 1);

  const fallback =
    def.targeting === 'single-ally' ? mates : def.targeting === 'single-any' ? [...foes, ...mates] : foes;
  return fallback.length > 0 ? [ctx.rng.pick(fallback)] : [];
}

/** True for the action class that either side's Cover intercepts. */
function coverable(def: AbilityDef): boolean {
  return def.damageType === 'physical' && def.targeting === 'single-enemy';
}

/**
 * **Enemy Cover** — the mirror image of Guard/Sentinel, and until the Macalania
 * encounter it simply did not exist: `redirectTarget` opened with
 * `if (attacker.side !== 'enemy') return target`, so a party-side action was
 * never redirected at all.
 *
 * "While at least one Guardian lives, **physical** attacks targeted at Seymour
 * are intercepted by a Guardian. **Magic is never covered.**"
 * [ffx-seymour-anima-macalania §2.3, verified: 2 sources]
 *
 * The relationship lives on {@link ActorRuntime.coversAllyId}, which the
 * encounter's own script sets at setup — no contract field, and no shipped
 * enemy outside that encounter sets it, so nothing else changes behaviour.
 * A dead coverer stops covering for free, because only living enemies are
 * considered.
 */
function coverOf(ctx: Ctx, target: FFXCombatant, def: AbilityDef): FFXCombatant {
  if (!coverable(def) || target.side !== 'enemy') return target;
  for (const c of livingEnemies(ctx)) {
    if (c.id === target.id || !targetable(c)) continue;
    if (ctx.rt.actors.get(c.id)?.coversAllyId === target.id) return c;
  }
  return target;
}

/**
 * Guard / Sentinel interception, enemy Cover, and Provoke redirection.
 *
 * A Guard user intercepts **all single-target physical attacks** aimed at the
 * other two members [ffx-combat-core §4.2]. Provoke forces an enemy to target
 * the provoker. Going the other way, an enemy may cover an ally — see
 * {@link coverOf}.
 */
export function redirectTarget(
  ctx: Ctx,
  attacker: FFXCombatant,
  target: FFXCombatant,
  def: AbilityDef,
): FFXCombatant {
  if (attacker.side !== 'enemy') return coverOf(ctx, target, def);

  if (coverable(def)) {
    for (const c of livingFriendlies(ctx)) {
      if (c.id === target.id) continue;
      if (has(c, 'guard') || has(c, 'sentinel')) return c;
    }
  }
  if (has(attacker, 'provoke')) {
    const inst = attacker.statuses['provoke'];
    const provoker = inst?.sourceId ? tryActor(ctx, inst.sourceId) : undefined;
    if (provoker && isAlive(provoker) && targetable(provoker)) return provoker;
  }
  return target;
}

/**
 * Where a reflected spell lands: a random living member of the side opposite
 * the reflector [ffx-combat-core §4.2].
 */
export function reflectBounceTarget(ctx: Ctx, reflector: FFXCombatant): FFXCombatant | undefined {
  const other = reflector.side === 'enemy' ? livingFriendlies(ctx) : livingEnemies(ctx);
  return other.length > 0 ? ctx.rng.pick(other) : undefined;
}
