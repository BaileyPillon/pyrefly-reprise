/**
 * Target resolution. The player command menu, which used to live here, is `menu.ts` (re-parity RC7 lane X2-B: this file was at 397 of the 400 lines).
 */

import type { AbilityDef, CombatantId, Side } from '../common/types.ts';
import type { BattleRng } from '../common/streams.ts';
import { NO_DRAWS } from './menu-rng.ts';
import type { Ffx2Unit } from './internal.ts';
import { leavesOnDeath } from './adapt/death-patterns.ts';

/** `aeon` never appears in X-2; party and enemy are the only two sides in play. */
function isFriendly(a: Side, b: Side): boolean {
  return (a === 'enemy') === (b === 'enemy');
}

/** On the field and selectable. `allowDead` opens KO'd allies to revival effects. */
export function isTargetable(unit: Ffx2Unit, allowDead = false): boolean {
  if (unit.removed || unit.flags.hidden || unit.flags.untargetable) return false;
  if (!unit.alive && leavesOnDeath(unit)) return false; // a monster that fell with a death pattern other than 0 left the battle: nothing finds it, a Raise included ([I]: G05 section 8 says that a Raise cannot find it is inferred; the pattern itself is G05 3.10)
  return allowDead || unit.alive;
}

/** Everyone on the opposite side of `actor` who can be hit. */
export function opponentsOf(units: readonly Ffx2Unit[], actor: Ffx2Unit, allowDead = false): Ffx2Unit[] {
  return units.filter((u) => !isFriendly(u.side, actor.side) && isTargetable(u, allowDead));
}

/** Everyone on `actor`'s own side who can be hit, `actor` included. */
export function alliesOf(units: readonly Ffx2Unit[], actor: Ffx2Unit, allowDead = false): Ffx2Unit[] {
  return units.filter((u) => isFriendly(u.side, actor.side) && isTargetable(u, allowDead));
}

/**
 * Resolve an ability's targets.
 *
 * `requested` is honoured when it names legal targets; otherwise the targeting
 * mode picks for us, which is what lets an AI script submit a command with an
 * empty target list. `random-enemy` / `random-ally` return the *pool* — the
 * resolver re-rolls per hit, because X-2 picks a fresh target each strike.
 *
 * A single-target row with no target named (a script's empty list, a placeholder) has no draw in the game, whose scripts and menu always
 * name one; it is an engine stand-in on the engine-side stream (`BattleRng.aux`), which cannot move one of the game's.
 */
export function resolveTargets(
  units: readonly Ffx2Unit[],
  actor: Ffx2Unit,
  ability: Pick<AbilityDef, 'targeting' | 'flags'>,
  requested: readonly CombatantId[],
  rng: BattleRng,
): Ffx2Unit[] {
  const allowDead = ability.flags.includes('can-target-dead');
  const byId = (id: CombatantId): Ffx2Unit | undefined =>
    units.find((u) => u.id === id && isTargetable(u, allowDead));

  const named = requested.map(byId).filter((u): u is Ffx2Unit => u !== undefined);

  switch (ability.targeting) {
    case 'self':
      return [actor];
    case 'all-enemies':
    case 'random-enemy':
      return opponentsOf(units, actor, allowDead);
    case 'all-allies':
    case 'random-ally':
      return alliesOf(units, actor, allowDead);
    case 'all':
      return units.filter((u) => isTargetable(u, allowDead));
    case 'single-enemy': {
      if (named.length > 0) return [named[0] as Ffx2Unit];
      const pool = opponentsOf(units, actor, allowDead);
      return pool.length > 0 ? [rng.aux.pick(pool)] : [];
    }
    case 'single-ally': {
      if (named.length > 0) return [named[0] as Ffx2Unit];
      const pool = alliesOf(units, actor, allowDead);
      return pool.length > 0 ? [rng.aux.pick(pool)] : [];
    }
    case 'single-any':
    default: {
      if (named.length > 0) return [named[0] as Ffx2Unit];
      // A target that was named and is gone (a skill queued before the last blow, the boss down when it lands) re-aims inside that target's own side, like the two
      // rows above; with that side empty it falls to nothing, never onto the other side (re-parity x2-retarget: Armor Break aimed at Bahamut hit a girl after he fell).
      // The game rebuilds the mask from the caster's opposing side and, with nobody left there, leaves it alone and plays the action with hits that do nothing
      // (`research/re-ffx2-ai-leblanc-den-ixion.md` 1.12, [H] run on the live exe; `docs/handoff/re-parity-x2-retarget-fix.md`). An empty list stays the engine stand-in below.
      const gone = requested.length > 0 ? units.find((u) => u.id === requested[0]) : undefined;
      const pool = units.filter((u) => isTargetable(u, allowDead) && (gone === undefined || isFriendly(u.side, gone.side)));
      return pool.length > 0 ? [rng.aux.pick(pool)] : [];
    }
  }
}

/**
 * Ids the UI may offer for one ability.
 *
 * **This is the legal *pool*, not a pick.** `src/ui/ffx2/CommandMenu.ts:238`
 * and `src/ui/ffx/CommandMenuLogic.ts:153` both read `validTargets` as the
 * cursor's candidate list — one entry means "auto-target", several mean "let
 * the player choose" — and `src/battle/ffx/commands.ts` fills it that way
 * (Cure is offered as all three actives, not as one).
 *
 * It used to be computed by running {@link resolveTargets} with a stub RNG,
 * which is right for `self` / `all-*` but **collapses every `single-*` mode to
 * a single id**, because that is what `resolveTargets` is for: it *chooses*.
 * The consequence in play was that a White Mage's Cure, Cura and Life could
 * only ever be aimed at whichever ally sorted first — she could not heal the
 * other two at all — and a single-enemy row on a multi-part boss could only
 * name the first part. Both the UI cursor and every tactic read this list, so
 * both were blocked. Fixed by returning the pool for the `single-*` modes and
 * leaving the rest to `resolveTargets` [docs/CONTRACT-CHANGES.md, 2026-09-17 `ffx2-bahamut`].
 */
export function validTargetIds(
  units: readonly Ffx2Unit[],
  actor: Ffx2Unit,
  ability: Pick<AbilityDef, 'targeting' | 'flags'>,
): CombatantId[] {
  const allowDead = ability.flags.includes('can-target-dead');
  switch (ability.targeting) {
    case 'single-enemy':
      return opponentsOf(units, actor, allowDead).map((u) => u.id);
    case 'single-ally':
      return alliesOf(units, actor, allowDead).map((u) => u.id);
    case 'single-any':
      return units.filter((u) => isTargetable(u, allowDead)).map((u) => u.id);
    default:
      break;
  }
  // A deterministic stand-in: `validTargets` must not consume the battle RNG,
  // because the menu is rebuilt every time the player moves the cursor.
  return resolveTargets(units, actor, ability, [], NO_DRAWS).map((u) => u.id);
}
