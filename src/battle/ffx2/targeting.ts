/**
 * Target resolution and the player command menu.
 *
 * `Decision.commands` hands the UI `AvailableCommand`s with `validTargets`
 * already resolved, `enabled` already computed and `disabledReason` already
 * written — the UI never re-derives legality (`docs/CONTRACTS.md`, UI agents).
 */

import type {
  AbilityDef,
  AvailableCommand,
  CombatantId,
  Rng,
  Side,
} from '../common/types.ts';
import type { AbilityRegistry, DressphereRegistry, Ffx2Unit, GarmentGridDef } from './internal.ts';
import { adjacentNodes } from './garment-grids.ts';

/** `aeon` never appears in X-2; party and enemy are the only two sides in play. */
function isFriendly(a: Side, b: Side): boolean {
  return (a === 'enemy') === (b === 'enemy');
}

/** On the field and selectable. `allowDead` opens KO'd allies to revival effects. */
export function isTargetable(unit: Ffx2Unit, allowDead = false): boolean {
  if (unit.removed || unit.flags.hidden || unit.flags.untargetable) return false;
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
 */
export function resolveTargets(
  units: readonly Ffx2Unit[],
  actor: Ffx2Unit,
  ability: Pick<AbilityDef, 'targeting' | 'flags'>,
  requested: readonly CombatantId[],
  rng: Rng,
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
      return pool.length > 0 ? [rng.pick(pool)] : [];
    }
    case 'single-ally': {
      if (named.length > 0) return [named[0] as Ffx2Unit];
      const pool = alliesOf(units, actor, allowDead);
      return pool.length > 0 ? [rng.pick(pool)] : [];
    }
    case 'single-any':
    default: {
      if (named.length > 0) return [named[0] as Ffx2Unit];
      const pool = units.filter((u) => isTargetable(u, allowDead));
      return pool.length > 0 ? [rng.pick(pool)] : [];
    }
  }
}

/** Ids the UI may offer for one ability. */
export function validTargetIds(
  units: readonly Ffx2Unit[],
  actor: Ffx2Unit,
  ability: Pick<AbilityDef, 'targeting' | 'flags'>,
): CombatantId[] {
  return resolveTargets(units, actor, ability, [], {
    // A deterministic stand-in: `validTargets` must not consume the battle RNG,
    // because the menu is rebuilt every time the player moves the cursor.
    next: () => 0,
    int: (min: number) => min,
    pick: <T,>(items: readonly T[]) => items[0] as T,
    seed: () => undefined,
    currentSeed: 0,
  } as Rng).map((u) => u.id);
}

/** Why a command row is greyed out, or `null` when it is offered. */
function disabledReason(actor: Ffx2Unit, ability: AbilityDef, mpCost: number): string | null {
  if (actor.statuses.itchy) return 'Itchy — spherechange first';
  if (actor.mp < mpCost && !actor.statuses.spellspring) return 'Not enough MP';
  const silenced = Boolean(actor.statuses.silence);
  if (silenced && (ability.category === 'blackmagic' || ability.category === 'whitemagic')) {
    return 'Silenced';
  }
  return null;
}

/** Spellspring zeroes every MP cost. [ffx2-combat-core §2.8] */
export function effectiveMpCost(actor: Ffx2Unit, ability: AbilityDef): number {
  return actor.statuses.spellspring ? 0 : ability.mpCost;
}

export interface MenuContext {
  units: Ffx2Unit[];
  abilities: AbilityRegistry;
  dresspheres: DressphereRegistry;
  grid?: GarmentGridDef;
  /** Dressphere id occupying each Garment Grid node, `null` for an empty node. */
  gridNodes?: Array<string | null>;
  canEscape: boolean;
}

/**
 * Build the command menu for one girl.
 *
 * Berserk leaves only Attack; Itchy leaves only the L1 spherechange and Escape
 * (§2.8); Curse disables the L1 menu entirely (§4.2).
 */
export function buildCommands(actor: Ffx2Unit, ctx: MenuContext): AvailableCommand[] {
  const out: AvailableCommand[] = [];
  const sphereId = actor.dresspheres?.current ?? '';
  const sphere = ctx.dresspheres.get(sphereId);
  const berserked = Boolean(actor.statuses.berserk);
  const itchy = Boolean(actor.statuses.itchy);

  const attack = ctx.abilities.get('attack');
  if (attack && (sphere?.hasAttack ?? true) && !itchy) {
    out.push({
      command: { kind: 'attack', targets: [] },
      label: 'Attack',
      category: 'attack',
      mpCost: 0,
      enabled: true,
      validTargets: validTargetIds(ctx.units, actor, attack),
    });
  }

  if (!berserked && !itchy) {
    const learned = actor.dresspheres?.abilitiesLearned?.[sphereId]?.learned ?? [];
    const offered = learned.length > 0 ? learned : (sphere?.abilityIds ?? []);
    for (const id of offered) {
      const ability = ctx.abilities.get(id);
      if (!ability) continue;
      const mpCost = effectiveMpCost(actor, ability);
      const reason = disabledReason(actor, ability, mpCost);
      out.push({
        command: { kind: 'ability', id, targets: [] },
        label: ability.name,
        category: ability.category,
        mpCost,
        enabled: reason === null,
        ...(reason ? { disabledReason: reason } : {}),
        validTargets: validTargetIds(ctx.units, actor, ability),
        ...(ability.minigame ? { opensMinigame: ability.minigame } : {}),
      });
    }
  }

  // L1 spherechange. One link only; gates on that link are passed through. §4.2
  if (!berserked && ctx.grid && actor.dresspheres) {
    const cursed = Boolean(actor.statuses.curse);
    const node = actor.dresspheres.garmentGrid.nodePosition;
    for (const step of adjacentNodes(ctx.grid, node)) {
      const to = ctx.gridNodes?.[step.node] ?? null;
      if (!to) continue;
      out.push({
        command: {
          kind: 'spherechange',
          targets: [],
          extra: { toDressphere: to, toNode: step.node, gatesCrossed: step.gates },
        },
        label: to,
        category: 'dressphere',
        mpCost: 0,
        enabled: !cursed,
        ...(cursed ? { disabledReason: 'Cursed' } : {}),
        validTargets: [],
        help: step.gates.length > 0 ? `Passes ${step.gates.join(' + ')}` : undefined,
      });
    }
  }

  if (ctx.canEscape) {
    out.push({
      command: { kind: 'escape', targets: [] },
      label: 'Escape',
      category: 'special',
      mpCost: 0,
      enabled: true,
      validTargets: [],
    });
  }

  return out;
}
