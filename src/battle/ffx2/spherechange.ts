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

import type { GateColour, SpherechangeCommand, StatBlock } from '../common/types.ts';
import type { DressphereRegistry, Emit, Ffx2Unit, GarmentGridRegistry } from './internal.ts';
import { dressphereStats } from './dressphere-stats.ts';
import { withAccessories } from './accessories.ts';
import { withPoolStatuses } from './kit.ts';
import {
  activeGateBonuses,
  breaksDamageLimit,
  gateAutoTags,
  gateStatTotal,
  gatesBetween,
  waitDownPercent,
  withStatBonus,
} from './garment-grids.ts';
import { autoAbilityRows, poolHolds } from './adapt/auto-layer.ts';
import { autoWordsOf } from './adapt/menu.ts';
import { baseRequired, refreshGauge } from './gauges.ts';
import { removeStatus } from './statuses.ts';
import { isSpecialDress } from './special/forms.ts';

export interface SpherechangeDeps {
  grids: GarmentGridRegistry;
  dresspheres: DressphereRegistry;
  gridNodes: Record<string, Array<string | null>>;
}

/**
 * **The gate on an ordinary Change** (2026-11-10, the Special Dress Up review, fix pass 3; FFX-2 only, in force with the `specialDressUp` switch on or off).
 *
 * G1: an ordinary Change puts a girl in the dressphere that sits on the node she moves to, on HER OWN grid in this battle (`deps.gridNodes[her id]`, the array the menu reads its rows from, `menu.ts`).
 * Every menu row is that pair by construction; a command that names any other dress for the node (another girl's Special, a dress she does not own, an id that does not exist, an empty node) is a command no
 * menu builds, only the debug console can, and it is refused. The sources say a girl changes into the dressphere on the node the cursor is on (`research/ffx2-combat-core.md` 2161, 3253 to 3256) and the
 * game's pending-change record carries the dress with the node (`research/re-ffx2-dressphere.md` 3.3); they do not say the game re-checks the pair, so this is plumbing, not a game rule.
 * G2: a Special is worn through the Special path only (`special/change.ts`, behind the switch and the rule the menu offers the row by), never through this one, and a command that asks for the Special path
 * (`specialDressUp`) but did not take it is not an ordinary Change. With the switch off the Special path answers false at once, so this is what refuses it there.
 */
export function ordinaryChangeAllowed(unit: Ffx2Unit, command: SpherechangeCommand, deps: SpherechangeDeps): boolean {
  const { toDressphere, toNode, specialDressUp } = command.extra;
  if (specialDressUp === true || isSpecialDress(toDressphere)) return false; // G2
  const onNode = Number.isInteger(toNode) ? deps.gridNodes[unit.id]?.[toNode] : undefined; // G1 (a node is a whole index)
  return typeof onNode === 'string' && onNode.length > 0 && onNode === toDressphere;
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
  // A Stamina Tonic she drank stays doubled on the new pool (`kit.ts`).
  // Double HP and Double MP a grid's crossed gates keep (re-parity RC10 lane XD1b): the game's rebuild merges the new layer into the status word before it recomputes the maxima,
  // so the maximum doubles in the very change that crosses the gate and the pool rule below scales HP and MP to it.
  const held = poolHolds(autoAbilityRows(unit, deps.grids));
  const stats = withPoolStatuses(withAccessories(withStatBonus(base, gateStatTotal(bonuses)), unit.accessories), unit.statuses, held);

  // Keep the HP/MP *ratio* across the change: X-2 swaps the pool, not the wound.
  const hpRatio = unit.stats.maxHp > 0 ? unit.hp / unit.stats.maxHp : 1;
  const mpRatio = unit.stats.maxMp > 0 ? unit.mp / unit.stats.maxMp : 1;
  unit.stats = stats;
  unit.hp = Math.max(unit.alive ? 1 : 0, Math.min(stats.maxHp, Math.round(stats.maxHp * hpRatio)));
  unit.mp = Math.max(0, Math.min(stats.maxMp, Math.round(stats.maxMp * mpRatio)));

  if (!unit.aiMemory) unit.aiMemory = {};
  unit.aiMemory['waitDown'] = waitDownPercent(bonuses);
  unit.aiMemory['bdl'] = breaksDamageLimit(bonuses);
  // The auto-ability words follow the dressphere she wears and the gates she has passed (re-parity RC7 lane X2-B).
  unit.autoWords = autoWordsOf(unit, gateAutoTags(bonuses), deps.dresspheres.get(sphere.current)?.abilityIds ?? []);
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
  let gates: GateColour[] = [];
  if (grid) {
    const real = gatesBetween(grid, sphere.garmentGrid.nodePosition, toNode);
    if (real === null) {
      emit({ type: 'message', text: 'Not linked', kind: 'system' });
      return false;
    }
    gates = real;
  }
  // The gate (`ordinaryChangeAllowed`): refused exactly as an unlinked node is, before anything changes.
  if (!ordinaryChangeAllowed(unit, command, deps)) {
    emit({ type: 'message', text: 'Not linked', kind: 'system' });
    return false;
  }
  // A grid the registry does not know has no link to read the gates from, so the command's own are taken: copied ONCE, here (after the gate, before anything changes), so a value that is not iterable fails with the state untouched and the gates banked are the gates reported (fix pass 5).
  if (!grid) gates = [...(command.extra.gatesCrossed ?? [])];

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
  // The change ends the command (`finishAction` sets the recovery); the new dressphere's Agility sets the standard gauge the HUD draws.
  unit.atb.required = baseRequired(unit.stats.agi);
  unit.atb.charging = null;
  refreshGauge(unit);

  emit({
    type: 'spherechange',
    who: unit.id,
    from,
    to,
    gatesCrossed: [...gates],
  });
  return true;
}

/**
 * Special Dress Up (R1): the part ids of the original sketch (a pinned test reads them). **The engine's form is `special/`** (2026-11-09, the `specialDressUp` switch, OFF by default): the main body is the
 * girl's own unit and the two pods are `special/forms.ts#FORMS[..].pods`, which is what `activeIds` is swapped to; `special/enter.ts` has the rules (`research/re-ffx2-special-dresspheres.md`). §3.15
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
