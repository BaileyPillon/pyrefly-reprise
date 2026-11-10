/**
 * The row helpers of a Special form in the FFX-2 party list (step D1 of the Special look; FFX-2 only in what is seen: the three Special dresspheres exist only in FFX-2).
 *
 * Pure functions, no DOM: which plate a combatant is (main, right part, left part), whose head the main's tile shows, the badge on the main's plate and the plates' order for the
 * target cursor. Every one of them answers "not a form" (`null`, the combatant's own dress, `''`) for a unit with no `dresspheres.special`, which is every unit while the
 * `specialDressUp` switch is OFF, so a row with no form is drawn exactly as it was.
 *
 * The engine names the parts by where it parks them: `parts.podLeft` is the RIGHT part (the right Pistil, plate 2) and `parts.podRight` the LEFT part (plate 3). That reading is kept
 * here and never re-derived from a screen position.
 */

import type { BattleState, CombatantId, FFX2Combatant, SpecialDressphereState } from '../../battle/common/types.ts';
import type { FormRole } from '../../engine/SpecialFormTracker.ts';
import { dressphereAbbr, dressphereColour, dressphereLabel } from './dressphereIcons.ts';

export interface PlateRole {
  role: FormRole;
  special: SpecialDressphereState['id'];
  mainId: CombatantId;
}

/** The plate a combatant is in a form, or `null` for a unit that is in no form (every unit while the switch is OFF). */
export function formRoleOf(c: FFX2Combatant): PlateRole | null {
  const s = c.dresspheres?.special;
  if (!s) return null;
  const role: FormRole = c.id === s.parts.main ? 'main' : c.id === s.parts.podLeft ? 'right' : 'left';
  return { role, special: s.id, mainId: s.parts.main };
}

/**
 * The dress whose head a unit's face tile shows. The main of a form shows the girl she is under the figure (the dress she stood on, `returnTo` on the engine's own `sdsp`, in no
 * contract type), not the figure's crown; any other unit shows `current`.
 */
export function faceDressOf(c: FFX2Combatant, current: string): string {
  if (formRoleOf(c)?.role !== 'main') return current;
  return (c as { sdsp?: { returnTo?: string } }).sdsp?.returnTo ?? current;
}

/** The badge on the main's plate: its own element (the job chip is 5.5 px and hidden on the phone), the Special's colour and abbreviation (FF, MW, FT). */
export function badgeHtml(special: string): string {
  return `<i class="ffx2stat__badge" style="--ffx2-special:${dressphereColour(special)}" title="${dressphereLabel(special)}">${dressphereAbbr(special)}</i>`;
}

/**
 * The order the target cursor cycles the plates of a form in: the ids of `state.activeIds` that are in `ids`, in `activeIds` order (main, right part, left part), whenever `ids` holds
 * at least one part. Otherwise `null` (every ordinary pick, every enemy pick, and every pick with the switch OFF, where no combatant has a `special`). The cursor's own rule sorts by
 * projected x, and the three plates' rectangles do not tie to the pixel, so the hint is passed in both look modes. An id with no record is not a part.
 */
export function formTargetOrder(state: Pick<BattleState, 'activeIds' | 'combatants'> | null, ids: readonly CombatantId[]): CombatantId[] | null {
  if (!state) return null;
  const hasPart = ids.some((id) => {
    const c = state.combatants[id] as FFX2Combatant | undefined;
    const role = c ? formRoleOf(c) : null;
    return role !== null && role.role !== 'main';
  });
  if (!hasPart) return null;
  return state.activeIds.filter((id) => ids.includes(id));
}
