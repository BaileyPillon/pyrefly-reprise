/**
 * Who is who while a Special form is up, read from the live battle state (FFX-2 only: the three Special dresspheres exist only in FFX-2; with the switch `specialDressUp` OFF no
 * combatant carries `dresspheres.special`, so every answer here is `null`, `false` or `[]`).
 *
 * The always-visible surfaces (the pause screen, the pro KO marks, the tactics and the cut-in) need three questions the engine's contract types do not answer directly:
 *  - {@link formMainOf}: for a part, its main (the girl the figure belongs to); for anyone else, `null`;
 *  - {@link isFormPartId}: is this id one of the two parts of a form (a pod, never a girl);
 *  - {@link awayGirlIds}: the girls parked away by a form (Rikku and Paine while Yuna wears Floral Fallal), who are in no list, tab or count while it lasts.
 * A part keeps its `special` record after the form ends (the engine deletes only the main's, `special/enter.ts`), but a dormant pod is never in `activeIds` or a tab, so a reader
 * that walks the live lists never meets it.
 *
 * `dresspheres` is on `FFX2Combatant` only and `aiMemory` on the engine's own unit type, neither on the `AnyCombatant` union of `state.combatants`, so both are read through a narrowing
 * cast, the same pattern as `ui/ffx2/specialRows.ts`. Pure, deterministic: no DOM, no ports, no `three`; it imports only types (layering rule 1).
 */

import type { BattleState, CombatantId } from '../battle/common/types.ts';

type Members = Pick<BattleState, 'combatants'>;

/** The part of a combatant these readers look at. */
interface FormFields {
  side?: string;
  removed?: boolean;
  aiMemory?: Record<string, unknown>;
  dresspheres?: { special?: { parts: { main: CombatantId } } };
}

const fieldsOf = (state: Members, id: CombatantId): FormFields | undefined => state.combatants[id] as unknown as FormFields | undefined;

/** A part's main: the `parts.main` of its own record, when `id` is not that main. `null` for the main itself, for anyone without a form record and for an id with no record. */
export function formMainOf(state: Members, id: CombatantId): CombatantId | null {
  const main = fieldsOf(state, id)?.dresspheres?.special?.parts.main;
  return main !== undefined && main !== id ? main : null;
}

/** Is `id` one of the two parts of a form (never the main, never a girl outside a form)? */
export function isFormPartId(state: Members, id: CombatantId): boolean {
  return formMainOf(state, id) !== null;
}

/**
 * The girls a form has parked away: party-side combatants that are `removed` and carry the engine's own `sdspParked` mark. An Ejected girl (`removed` without `sdspParked`) is out for
 * another reason and is not away: her surfaces are the ordinary ones.
 */
export function awayGirlIds(state: Members): CombatantId[] {
  const out: CombatantId[] = [];
  for (const [id, c] of Object.entries(state.combatants)) {
    const f = c as unknown as FormFields;
    if (f.side === 'party' && f.removed === true && f.aiMemory?.['sdspParked'] === true) out.push(id);
  }
  return out;
}
