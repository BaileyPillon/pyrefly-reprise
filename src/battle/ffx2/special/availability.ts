/**
 * When the menu offers a Special Dress Up, and the way out of one (FFX-2 only; behind the `specialDressUp` switch, OFF by default).
 *
 * **The offer** (`research/re-ffx2-special-dresspheres.md` section 2; exe 0x005f4800 and `kernel/spherechange.ts#specialDressUpAvailable`): every dressphere node of the girl's grid has been worn this
 * battle AND the party owns her Special. The nodes the girl walks are the real grid's (`garment-grids.ts`, the layouts of `data/ffx2/garment-grids/layouts.ts`, one link or one gate away), so the
 * walk is the ordinary Change rows; nothing here moves her. The engine reads "worn" as `wornThisBattle` against the dresspheres on the nodes (`garment-grids.ts#canSpecialDressUp`). A Cursed girl
 * is offered the row greyed, as every Change is.
 *
 * **The way out** (the kernel's mode 2): a girl in her Special has one Change row, back to the dress she stood on; she cannot walk the grid from inside the form. Which other nodes the game's grid
 * scene lets her pick while leaving a Special is not traced, so the engine offers the one it can source (the dress she left).
 */

import type { AvailableCommand } from '../../common/types.ts';
import type { Ffx2Unit, GarmentGridDef } from '../internal.ts';
import { canSpecialDressUp } from '../garment-grids.ts';
import { recordOf } from './enter.ts';
import { specialOfGirl } from './forms.ts';

export interface SpecialMenuContext {
  readonly grid?: GarmentGridDef | undefined;
  readonly gridNodes?: ReadonlyArray<string | null> | undefined;
}

/** The Special Dress Up row (or none) and the Return row (or none) of one girl. */
export function specialRows(actor: Ffx2Unit, ctx: SpecialMenuContext): AvailableCommand[] {
  const sphere = actor.dresspheres;
  if (sphere === undefined || !actor.alive || actor.removed) return [];
  const cursed = Boolean(actor.statuses.curse);
  const record = recordOf(actor);
  if (record !== undefined) {
    if (record.role !== 'main' || record.returnTo === undefined) return [];
    return [
      {
        command: { kind: 'spherechange', targets: [], extra: { toDressphere: record.returnTo, toNode: sphere.garmentGrid.nodePosition, gatesCrossed: [] } },
        label: record.returnTo,
        category: 'dressphere',
        mpCost: 0,
        enabled: !cursed,
        ...(cursed ? { disabledReason: 'Cursed' } : {}),
        validTargets: [],
        help: `Leave ${specialOfGirl(actor.id)?.name ?? 'the Special'}`,
      },
    ];
  }
  const form = specialOfGirl(actor.id);
  if (form === undefined || ctx.grid === undefined || ctx.gridNodes === undefined) return [];
  if (!sphere.owned.includes(form.id)) return [];
  const occupied = ctx.gridNodes.filter((d): d is string => d !== null && d !== undefined);
  if (!canSpecialDressUp(ctx.grid, occupied, sphere.garmentGrid.wornThisBattle)) return [];
  return [
    {
      command: { kind: 'spherechange', targets: [], extra: { toDressphere: form.id, toNode: sphere.garmentGrid.nodePosition, gatesCrossed: [], specialDressUp: true } },
      label: form.name,
      category: 'dressphere',
      mpCost: 0,
      enabled: !cursed,
      ...(cursed ? { disabledReason: 'Cursed' } : {}),
      validTargets: [],
      help: 'Special Dress Up',
    },
  ];
}

/** Does this change command name the Special Dress Up of a girl who is not in a form? */
export function isEntry(actor: Ffx2Unit, toDressphere: string, specialDressUp: boolean | undefined): boolean {
  return specialDressUp === true && recordOf(actor) === undefined && specialOfGirl(actor.id)?.id === toDressphere;
}
