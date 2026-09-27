/**
 * **The card for a girl whose menu offers only CHANGE** (FOC22-02).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Itchy "seals every command
 * except L1 and Escape until you spherechange", and a spherechange clears it
 * [research/ffx2-combat-core.md §2.8, Itchy row, `[verified: 2 sources]`];
 * `src/battle/ffx2/targeting.ts#buildCommands` offers exactly that. FFX has no
 * spherechange and no Itchy, so an FFX board never reaches this file.
 *
 * ## The defect
 *
 * A spherechange resolves to nothing the preview can price (it changes the
 * command set the next turns are chosen from, `./advisor-guard.ts`), so the
 * simulator returns no outcome and the ranking dropped every Change row. On a
 * board where Change is the whole menu that left the advisor with nothing: the
 * card went idle, and on Chapter XI the focused review's route read the last
 * card's move (Remedy, in Item) for 314 decisions while the menu offered only
 * CHANGE (critic/reviews/a44297ca-focused.json, FOC22-02; CHK-004: the card
 * names only rows the menu offers).
 *
 * ## The rule
 *
 * * **Locked to Change** ({@link lockedToChange}): the only enabled rows are
 *   spherechanges (and Escape, which never reaches the card). The card names a
 *   Change, priced rather than simulated, exactly as a party switch is.
 * * **The chapter's own line may name a Change** (Chapter XIII's knight changes
 *   out of Itchy and back home to Dark Knight, Chapter XI's girls go back to
 *   the dressphere their line is written for). {@link changeSuggestion} is the
 *   card row for it; `advisor.ts#tacticSuggestion` uses it when the tactic's
 *   command is a spherechange, which the simulator cannot price either.
 *
 * The label is what the Change submenu prints (`ui/ffx2/CommandMenu.ts`
 * `spherechangeLabel`: the dressphere's name, "(Special)" for a Special
 * dressphere), and the chip is `Change` (`./advisor-menu.ts`), so a player
 * following the card opens CHANGE and finds the row by its name.
 */

import type { AvailableCommand, BattleState, Command } from '../../battle/common/types.ts';
import { menuChipFor } from './advisor-menu.ts';
import type { MoveSuggestion } from './advisor.ts';

/** Kinds that never compete for the card: Escape is dropped before ranking. */
const NEVER_ON_THE_CARD = new Set<Command['kind']>(['escape']);

/** True when this decision's only pressable rows are spherechanges (Itchy, §2.8). */
export function lockedToChange(commands: readonly AvailableCommand[]): boolean {
  let change = false;
  for (const row of commands) {
    if (!row.enabled || NEVER_ON_THE_CARD.has(row.command.kind)) continue;
    if (row.command.kind !== 'spherechange') return false;
    change = true;
  }
  return change;
}

/** The destination as the Change submenu names it. Mirrors `CommandMenu.ts#spherechangeLabel`. */
export function changeLabel(command: Command): string {
  if (command.kind !== 'spherechange') return '';
  const name = command.extra.toDressphere
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return command.extra.specialDressUp ? `${name} (Special)` : name;
}

/** Same destination, same node: two spherechanges the player would press the same way. */
export function sameChange(a: Command, b: Command): boolean {
  if (a.kind !== 'spherechange' || b.kind !== 'spherechange') return false;
  return a.extra.toDressphere === b.extra.toDressphere && a.extra.toNode === b.extra.toNode;
}

/** Why the card names this Change. */
function reasonFor(state: Readonly<BattleState>, actorId: string, command: Command): string {
  const actor = state.combatants[actorId];
  const itchy = actor?.statuses['itchy'] !== undefined;
  const to = changeLabel(command);
  return itchy
    ? `Itchy seals every command but Change; changing to ${to} clears it`
    : `The chapter's line wants ${to} back`;
}

/**
 * One Change row as a card suggestion. `score` is 0: a locked board has nothing
 * to compare it with, and a tactic's pick is placed by the tactic, not scored.
 */
export function changeSuggestion(
  state: Readonly<BattleState>,
  actorId: string,
  commands: readonly AvailableCommand[],
  row: AvailableCommand,
): MoveSuggestion {
  const command = { ...row.command, targets: [] } as Command;
  return {
    command,
    label: changeLabel(command),
    menu: menuChipFor(state.game, commands, row),
    targetId: null,
    targetName: null,
    // The same line the menu's own help slab prints for this row
    // (`ui/ffx2/commandHelp.ts`), so the card and the menu say one thing.
    effect: 'Changes into another dressphere; the destination spends the turn',
    estimate: null,
    mpCost: 0,
    hitChance: null,
    critChance: 0,
    statuses: [],
    cures: state.combatants[actorId]?.statuses['itchy'] !== undefined ? ['Itchy'] : [],
    reason: reasonFor(state, actorId, command),
    cite: '',
    warning: '',
    score: 0,
    isSwitch: false,
    source: 'simulated',
  };
}

/** Every enabled Change row, in the menu's own order, as card suggestions. */
export function changeSuggestions(
  state: Readonly<BattleState>,
  actorId: string,
  commands: readonly AvailableCommand[],
): MoveSuggestion[] {
  return commands
    .filter((row) => row.enabled && row.command.kind === 'spherechange')
    .map((row) => changeSuggestion(state, actorId, commands, row));
}
