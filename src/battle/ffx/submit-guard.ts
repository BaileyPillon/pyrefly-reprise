/**
 * **The engine's refusal of a greyed row** (re-parity RC11, lane "FFX Chapter III roster"; **FFX only**, plumbing, not a game rule: the HUD, the strategies, the advisor and the coach already refuse
 * a row the menu draws greyed, so no player is affected; handoff `docs/handoff/re-parity-rc11-ffx-ch3-roster.md`).
 *
 * The rc11 independent check found that `engine.submit` accepted a hand-submitted command whose row was `enabled: false` on the actor's current menu: a greyed Escape spent the turn, a knocked-out
 * aeon's Summon was taken. The game's confirm handler (0x0089C900) refuses any row the resolver answered with a negative code and the turn stays open (cue 3); this is that rule at the engine's
 * door, in the same place as the formation and script refusals (`./formation-commands.ts#commandRefused`).
 *
 * A submitted command is refused when the actor's menu holds at least one row for it and **every** such row is greyed **with no reason**. A command with no row at all (a scripted turn, a re-submit that
 * carries a minigame result, Defend where the formation switched it off) is not this guard's business and goes on as before. The rows are the very ones `nextDecision` handed the player
 * (`availableCommands`), so the guard can never disagree with the menu.
 *
 * **Why only the rows with no reason.** A row greyed *with* a reason is a refusal the engine already announces: the executor or the trigger's handler emits a message ("Tidus cannot give that order", "Mirror of Grothia",
 * "Taken by Yu Yevon", "Can't escape!" with its escape roll) and keeps the turn open, and existing tests pin those messages. The rows the game draws greyed with no word (`MENU_DRAW_PARITY`: a knocked-out aeon's
 * Summon, a blocked Escape, Flee or Switch, a Cursed actor's Overdrive; a formation's switched-off command) are the ones nothing announces and the executor took. So with every switch off no
 * menu holds such a row the engine did not already refuse (a formation's rows are refused by `commandRefused`), and this guard changes no play (192 of 192 plays identical, the goldens and pins unchanged); it
 * acts only on the rows the parity switch adds. The wider rule ("any greyed row, reason or not") was tried and moves six existing tests (the announced refusals above), so it is not shipped; it is in the handoff.
 *
 * Layering: pure, deterministic, no DOM [AGENTS.md hard rule 1].
 */

import type { Command, FFXCombatant } from '../common/types.ts';
import type { Ctx } from './state.ts';
import { availableCommands } from './commands.ts';

type Keyed = { kind: string; id?: string; extra?: { inId?: string; mode?: string } };

/** Does this menu row stand for the submitted command (same kind, same id, same switch target, same escape mode)? */
function stands(row: Command, submitted: Command): boolean {
  const a = row as Keyed;
  const b = submitted as Keyed;
  if (a.kind !== b.kind) return false;
  if (a.id !== undefined && b.id !== undefined && a.id !== b.id) return false;
  if (a.extra?.inId !== undefined && b.extra?.inId !== undefined && a.extra.inId !== b.extra.inId) return false;
  if (a.extra?.mode !== undefined && b.extra?.mode !== undefined && a.extra.mode !== b.extra.mode) return false;
  return true;
}

/** Is this submitted command one whose rows on the actor's current menu are all greyed with no reason? A player's actor only. */
export function submittedRowGreyed(ctx: Ctx, actor: FFXCombatant, command: Command): boolean {
  if (actor.side === 'enemy') return false;
  const rows = availableCommands(ctx, actor).filter((r) => stands(r.command, command));
  return rows.length > 0 && rows.every((r) => !r.enabled && r.disabledReason === undefined);
}
