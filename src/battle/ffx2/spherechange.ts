/**
 * The L1 spherechange [ffx2-combat-core §4.2] and Special Dress Up (§3.15).
 *
 * The rules that make it a *tactical* action rather than a menu:
 * - it **consumes the whole turn** — the ATB gauge is spent and refills from
 *   empty while the transformation plays. No MP cost, no charge bar;
 * - only to a dressphere **one link away**; gates on that link are passed
 *   *through*, not stepped on;
 * - gate effects last the rest of the battle and **survive KO and revival**,
 *   which is why `passedGates` lives on `GarmentGridState` and not on the
 *   girl's status map;
 * - **Curse** disables the L1 menu entirely, and **Itchy** seals every command
 *   except L1 and Escape until she changes.
 *
 * Because the change costs a full ATB cycle, the design intent is that passing
 * a gate *is* the buff action: roughly "one lost turn for one battle-long
 * buff". Her stats are re-derived from the new `(dressphere x level)` and the
 * accumulated gate bonuses are re-applied on top.
 */

import type { SpherechangeCommand, StatBlock } from '../common/types.ts';
import type { DressphereRegistry, Emit, Ffx2Unit, GarmentGridRegistry } from './internal.ts';
import { dressphereStats } from './dressphere-stats.ts';
import { withAccessories } from './accessories.ts';
import {
  activeGateBonuses,
  breaksDamageLimit,
  gateStatTotal,
  gatesBetween,
  waitDownPercent,
  withStatBonus,
} from './garment-grids.ts';
import { baseRequired, refreshGauge } from './gauges.ts';
import { removeStatus } from './statuses.ts';

export interface SpherechangeDeps {
  grids: GarmentGridRegistry;
  dresspheres: DressphereRegistry;
  gridNodes: Record<string, Array<string | null>>;
}

/**
 * Re-derive a girl's stats for her current dressphere plus every gate bonus
 * she has banked this battle, and cache the derived combat modifiers the
 * engine reads later (`waitDown`, `bdl`).
 */
export function refreshDerivedStats(unit: Ffx2Unit, deps: SpherechangeDeps): StatBlock {
  const sphere = unit.dresspheres;
  if (!sphere) return unit.stats;
  const derive = deps.dresspheres.stats ?? dressphereStats;
  const base = derive(sphere.current, unit.level);
  const grid = deps.grids.get(sphere.garmentGrid.id);
  const bonuses = grid ? activeGateBonuses(grid, sphere.garmentGrid.passedGates) : [];
  // Accessories belong to the girl, not the dressphere: layered as `setup.ts#buildMember` does
  // (grid, then accessories). Until 2026-09-25 this dropped them, so crossing a gate cost her the
  // Crystal Bangle's HP for the rest of the battle [combat-core §4.2, §5.4; method check E2].
  const stats = withAccessories(withStatBonus(base, gateStatTotal(bonuses)), unit.accessories);

  // Keep the HP/MP *ratio* across the change: X-2 swaps the pool, not the wound.
  const hpRatio = unit.stats.maxHp > 0 ? unit.hp / unit.stats.maxHp : 1;
  const mpRatio = unit.stats.maxMp > 0 ? unit.mp / unit.stats.maxMp : 1;
  unit.stats = stats;
  unit.hp = Math.max(unit.alive ? 1 : 0, Math.min(stats.maxHp, Math.round(stats.maxHp * hpRatio)));
  unit.mp = Math.max(0, Math.min(stats.maxMp, Math.round(stats.maxMp * mpRatio)));

  if (!unit.aiMemory) unit.aiMemory = {};
  unit.aiMemory['waitDown'] = waitDownPercent(bonuses);
  unit.aiMemory['bdl'] = breaksDamageLimit(bonuses);
  return stats;
}

/**
 * Perform one spherechange. Emits `spherechange`, then leaves the caller to
 * spend the turn (`beginRecovery`) — the ATB is reset here so the bar is
 * visibly empty the moment the animation starts.
 */
export function performSpherechange(
  unit: Ffx2Unit,
  command: SpherechangeCommand,
  deps: SpherechangeDeps,
  emit: Emit,
): boolean {
  const sphere = unit.dresspheres;
  if (!sphere) return false;
  if (unit.statuses.curse) {
    emit({ type: 'message', text: `${unit.name} is cursed`, kind: 'system' });
    return false;
  }

  const grid = deps.grids.get(sphere.garmentGrid.id);
  const from = sphere.current;
  const to = command.extra.toDressphere;
  const toNode = command.extra.toNode;

  // Adjacency: exactly one link. The gates on that link are what she passes.
  let gates = command.extra.gatesCrossed ?? [];
  if (grid) {
    const real = gatesBetween(grid, sphere.garmentGrid.nodePosition, toNode);
    if (real === null) {
      emit({ type: 'message', text: 'Not linked', kind: 'system' });
      return false;
    }
    gates = real;
  }

  sphere.current = to;
  sphere.garmentGrid.nodePosition = toNode;
  for (const gate of gates) {
    if (!sphere.garmentGrid.passedGates.includes(gate)) sphere.garmentGrid.passedGates.push(gate);
  }
  if (!sphere.garmentGrid.wornThisBattle.includes(to)) sphere.garmentGrid.wornThisBattle.push(to);

  // Spherechanging is one of the two ways to clear Itchy. §2.8
  if (removeStatus(unit, 'itchy')) {
    emit({ type: 'status-remove', targetId: unit.id, status: 'itchy', reason: 'cured' });
  }

  refreshDerivedStats(unit, deps);
  unit.atb.ticks = 0;
  unit.atb.required = baseRequired(unit.stats.agi);
  unit.atb.charging = null;
  refreshGauge(unit);

  emit({
    type: 'spherechange',
    who: unit.id,
    from,
    to,
    gatesCrossed: [...gates],
    ...(command.extra.specialDressUp ? { special: to as 'floral-fallal' } : {}),
  });
  return true;
}

/**
 * Special Dress Up (R1) — the girl leaves the field and fights as **three
 * independently-commanded parts**, each its own combatant with its own ATB
 * gauge and command menu, with `activeIds` swapped to the parts
 * (CONTRACT-CHANGES §4: the engine owns the swap; there is no dedicated state
 * field). Every accessory stops working, every part has Ribbon plus Auto-Life
 * and cannot be Ejected, and there is no Item and no Escape command. §3.15
 */
export function specialDressUpPartIds(specialId: string): [string, string, string] {
  switch (specialId) {
    case 'machina-maw':
      return ['machina-maw-main', 'machina-maw-smasher-r', 'machina-maw-crusher-l'];
    case 'full-throttle':
      return ['full-throttle-main', 'full-throttle-left', 'full-throttle-right'];
    case 'floral-fallal':
    default:
      return ['floral-fallal-main', 'floral-fallal-left-pistil', 'floral-fallal-right-pistil'];
  }
}
