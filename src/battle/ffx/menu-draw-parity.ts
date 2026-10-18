/**
 * **Menu draw parity** (re-parity RC11, lane "FFX menu parity"; **FFX only**; handoff `docs/handoff/re-parity-rc11-ffx-menu-parity.md`, plan `docs/plans/re-parity-rc11-ffx-menu-parity-review.md`).
 *
 * One switch, {@link MENU_DRAW_PARITY}, **off**: while it is off the FFX command menu is exactly what it was. While it is on, the menu is *drawn* the way the original draws it. Nothing here
 * changes what a player may do, what a battle rolls or what its event log says; it changes which rows are shown, which are greyed, and where the cursor may rest.
 *
 * The original (`FFX.exe`, Steam build 25501027; research notes `FFX-G11` and `FFX-G11b`): the draw loop (0x008A49B0) resolves **every** row of a list (resolver 0x0089ACA0) and skips a row only for -4 (an
 * empty type-8 opener); any other refusal is drawn with a flag read as the grey flag. The list-input handler (0x0089C900) moves the cursor with no look at the resolver and refuses the row under the
 * cursor only on a confirm (cue 3). The items, each a letter in the plan, each switchable on its own through {@link MenuParityItem}:
 *
 * | Item | Name | Rule |
 * |---|---|---|
 * | a | `openers` | Black Magic, White Magic, Skill, Special, Doublecast (and Summon) carry no Silence bit and no MP cost: the row is never greyed by Silence or MP, it opens, and the entries inside are greyed |
 * | b | `overdrive` | Curse with a full gauge: the Overdrive rows are drawn greyed, not left out (the Overdrive key counts the gauge, not Curse) |
 * | c | `summon` | the Summon list holds every aeon in the battle; a KO'd or recovering aeon is a greyed row, not a missing one; an aeon the field event removed (the hidden Last Summoning's taken aeons, `lockedAeons[].removed`) has no row at all |
 * | d | `blocked` | a blocked Escape, Flee or Switch row (a formation's disabled bit) is drawn greyed with no reason |
 * | e | `talk` | Talk (0x3105) exists only in the four formations whose scripts add it; elsewhere there is no row |
 * | f | `cursor` | the cursor rests on greyed rows, and a confirm on one is refused (the shake, and the menu set's `error` cue) |
 * | g | `help` | the help slab under a greyed row prints the row's plain description and no reason (the original prints none; re-parity RC11, lane "FFX Chapter III roster") |
 *
 * Layering: pure, deterministic, no DOM [AGENTS.md hard rule 1]. The HUD (`src/ui/ffx`) reads {@link menuParity} for items a and f.
 */

import type { AvailableCommand, FFXCombatant } from '../common/types.ts';

/** The six items of the plan, by name. */
export type MenuParityItem = 'openers' | 'overdrive' | 'summon' | 'blocked' | 'talk' | 'cursor' | 'help';

/**
 * The one switch. `on: false` and every FFX menu is as before. `skip` lists items to leave off while the switch is on, so Bailey can take the rows of the decision table one at a time without a
 * second switch. A test or a bench flips it with {@link setMenuDrawParity} and puts it back with the function that returns.
 */
export const MENU_DRAW_PARITY: { on: boolean; skip: MenuParityItem[] } = { on: false, skip: [] };

/** Is this item's parity rule in force right now? */
export function menuParity(item: MenuParityItem): boolean {
  return MENU_DRAW_PARITY.on && !MENU_DRAW_PARITY.skip.includes(item);
}

/** Set the switch (and, optionally, the items to leave off); the returned function puts both back as they were. */
export function setMenuDrawParity(on: boolean, skip: readonly MenuParityItem[] = []): () => void {
  const before = { on: MENU_DRAW_PARITY.on, skip: [...MENU_DRAW_PARITY.skip] };
  MENU_DRAW_PARITY.on = on;
  MENU_DRAW_PARITY.skip = [...skip];
  return () => {
    MENU_DRAW_PARITY.on = before.on;
    MENU_DRAW_PARITY.skip = before.skip;
  };
}

/** A copy of the row, greyed with no reason (the original prints none); the input is never changed. */
export function greyRow(row: AvailableCommand): AvailableCommand {
  const grey: AvailableCommand = { ...row, enabled: false };
  delete grey.disabledReason;
  return grey;
}

/** Is the actor's Overdrive gauge full (its own, or the temporary one a Grand Summon grants)? Unlike `overdriveReady`, Curse does not matter: the game's Overdrive key counts the gauge only (0x0078F700). */
export function overdriveGaugeFull(c: FFXCombatant): boolean {
  const temp = c.aeon?.temporaryOverdrive;
  if (temp !== null && temp !== undefined && temp >= 100) return true;
  return (c.overdrive?.gauge ?? 0) >= 100;
}
