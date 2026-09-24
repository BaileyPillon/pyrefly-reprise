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

/**
 * **Reach — the airship range gate.** FFX only.
 *
 * `research/ffx-evrae-airship.md` §4.3 `[verified: 2 sources]`: while the
 * *Fahrenheit* is pulled back, the only player actions that cross the gap are
 * **Blk Magic, Wakka's physical attacks and Lancet**. Tidus, Auron, Rikku and
 * Kimahri's ordinary attacks, Steal and offensive items do not.
 *
 * Three things about the shape of this function matter:
 *
 * 1. **It returns `true` unconditionally when `state.flags['airship.range']` is
 *    unset**, which is every other battle in the project, so nothing outside
 *    this one encounter changes behaviour. The FFX-2 ATB engine never reaches
 *    it at all.
 * 2. **Allies always reach.** Items, Wht Magic, Cheer, Focus and Rikku's party
 *    Mixes target your own side, so "reach" is meaningless for them. §4.3 is
 *    explicit that this asymmetry must not be smoothed: FAR is the *setup*
 *    zone, not a dead zone, and that is the mechanical seed of the whole
 *    chapter. C-2's recommended default — offensive items and Steal do **not**
 *    reach — falls straight out of the same rule.
 * 3. **Wakka's reach is a property of the character, not of the action**
 *    (`ActorRuntime.rangedWeapon`, set by the encounter's setup hook). An
 *    `AutoAbilityId` was considered and rejected: auto-abilities are
 *    customisation slots the player can move, and the blitzball is not
 *    customisable.
 *
 * The `'long-range'` ActionFlag is honoured too, so the enemy rows that carry
 * it (Swooping Scythe, Photon Spray, Guided Missiles, Evrae's own Haste) are
 * unaffected. Note the flag keeps its **FFX-2** meaning wherever FFX-2 reads it
 * — no approach time, never breaks a chain — and nothing here touches that.
 *
 * **Reach is a property of the gap, not of the row.** It is asked per *side*,
 * because several rows point at both: Phoenix Down is `single-any` (it doubles
 * as the anti-undead item), and a whitelist of targeting tokens refused the
 * party's only revive while the ship stood off — the state the chapter's whole
 * tactic asks the player to sit in. {@link reachesFoesAtRange} answers "does
 * this cross the gap", {@link reachesAtRange} answers "is there anything at all
 * this can be pointed at", and {@link validTargets} drops the far side rather
 * than the whole row.
 */
export function reachesFoesAtRange(ctx: Ctx, user: FFXCombatant, def: AbilityDef): boolean {
  if (ctx.state.flags['airship.range'] !== 'far') return true;
  // The enemy side has its own range rules, enforced by its AI script rather
  // than by menu legality: Evrae simply does not select a melee row at FAR.
  if (user.side === 'enemy') return true;

  if (def.flags.includes('long-range')) return true;
  // "only magic, Lancet, and Wakka's physical attacks can reach Evrae" — the
  // categories are the sourced sentence, not a guess about individual rows.
  if (def.category === 'blackmagic' || def.category === 'whitemagic') return true;
  if (def.formula === 'lancet') return true;
  if (def.damageType === 'physical' && ctx.rt.actors.get(user.id)?.rangedWeapon === true) return true;
  return false;
}

/** True when a targeting value can legally land on one of the user's own side. */
function canPointAtAllies(def: AbilityDef): boolean {
  switch (def.targeting) {
    case 'self':
    case 'single-ally':
    case 'all-allies':
    case 'random-ally':
    case 'single-any':
    case 'all':
      return true;
    default:
      return false;
  }
}

/**
 * True when *something* is still in reach of this row — the predicate
 * `commands.ts` turns into "Out of reach".
 *
 * §4.3: "Items and Wht Magic are irrelevant to reach **because they target your
 * own party**." So any row that can point at an ally stays legal at FAR; only
 * its enemy-side candidates are taken away.
 */
export function reachesAtRange(ctx: Ctx, user: FFXCombatant, def: AbilityDef): boolean {
  if (ctx.state.flags['airship.range'] !== 'far') return true;
  if (user.side === 'enemy') return true;
  return canPointAtAllies(def) || reachesFoesAtRange(ctx, user, def);
}

/** Candidates a command may legally be pointed at. */
export function validTargets(ctx: Ctx, user: FFXCombatant, def: AbilityDef): CombatantId[] {
  const canTargetDead = def.flags.includes('can-target-dead');
  const alive = (c: FFXCombatant): boolean => (canTargetDead ? onField(c) : isAlive(c));
  // The far side simply is not on the list. A foe-only row therefore comes back
  // empty exactly as it used to, and a `single-any` row keeps its allies.
  const reachable = reachesFoesAtRange(ctx, user, def) ? (user.side === 'enemy' ? friendlies(ctx) : enemies(ctx)) : [];
  const foes = reachable.filter((c) => targetable(c) && alive(c));
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
  // Resolution honours the same gap the menu does, so an explicitly submitted
  // target cannot cross a gap the menu refused to offer — nor land on a foe the
  // menu never offers (`targetable`: untargetable or hidden, like Macalania's
  // Seymour or Yojimbo's Ginnem and Daigoro). A same-side pick is unchanged.
  const crosses = reachesFoesAtRange(ctx, user, def);
  const foes = crosses ? (user.side === 'enemy' ? livingFriendlies(ctx) : livingEnemies(ctx)) : [];
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
    .filter(
      (c): c is FFXCombatant =>
        c !== undefined && onField(c) && (c.side === user.side || (crosses && targetable(c))),
    );
  if (explicit.length > 0) return explicit.slice(0, 1);

  const fallback =
    def.targeting === 'single-ally' ? mates : def.targeting === 'single-any' ? [...foes, ...mates] : foes;
  return fallback.length > 0 ? [ctx.rng.pick(fallback)] : [];
}

/**
 * The target of hit `h` of a per-hit-random action.
 *
 * Identical to `resolveTargets(ctx, user, def, [])` — the same single RNG pick
 * from the same pool — for every record **without** `extra.distinctTargetsPerHit`.
 * With it, a hit after the first avoids the member the previous hit picked
 * when anyone else is standing, and falls back to the full pool when nobody
 * is: Seymour Natus's Multi-ra "targeting two different party members if
 * possible" [ffx-seymour-natus-highbridge §3.1, the preflight review's
 * correction, single source: wiki]. FFX only; Chapter VII's Multi-ra has no
 * such key and keeps its two independent picks (Macalania C-3).
 */
export function nextHitTargets(
  ctx: Ctx,
  user: FFXCombatant,
  def: AbilityDef,
  hit: number,
  previous: readonly FFXCombatant[],
): FFXCombatant[] {
  if (hit > 0 && def.extra?.['distinctTargetsPerHit'] === true && def.targeting === 'random-enemy') {
    const crosses = reachesFoesAtRange(ctx, user, def);
    const foes = crosses ? (user.side === 'enemy' ? livingFriendlies(ctx) : livingEnemies(ctx)) : [];
    const fresh = foes.filter((c) => !previous.some((p) => p.id === c.id));
    if (fresh.length > 0) return [ctx.rng.pick(fresh)];
  }
  return resolveTargets(ctx, user, def, []);
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
  // Provoke forces the enemy to target the provoker [ffx-combat-core §4.2]; an
  // action it aims at **itself** targets no one on the other side, so it stays
  // put. Sourced for Seymour Natus, whose 24,000 Protect counter is decompiled
  // as "Counter Self" [ffx-seymour-natus-highbridge §2.1, verified: 3 sources];
  // the general reading is ours. Every other Provoke-landable FFX enemy in our
  // data is Braska's Final Aeon, whose only self action is the form-change cue.
  if (has(attacker, 'provoke') && target.id !== attacker.id) {
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
