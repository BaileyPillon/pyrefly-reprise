import type { AbilityDef, AvailableCommand } from '../../battle/common/types.ts';
import { ABILITIES, ITEMS } from '../../data/ffx/index.ts';
import { describeAbility } from '../../engine/tactics/advisor.ts';

/**
 * What the highlighted command **does**, in one line, for the FFX command
 * slab.
 *
 * ## Why this file exists
 *
 * Round 02 #27: "the info slab is absent on the default-selected row when the
 * menu opens, absent for every leaf ability (CHEER / PROVOKE / DELAY ATTACK /
 * DELAY BUSTER / FLEE / TALK render with nothing but an MP chip), present only
 * for category rows". The cause is one line of the contract:
 * `AvailableCommand.help` is written by **exactly one** producer in the whole
 * repo — `src/battle/ffx/commands.ts:115`, for items, out of `ItemDef.description`
 * — so every ability row arrives at the menu with `help: undefined` and the slab
 * has nothing to print.
 *
 * ## Why it is derived rather than authored
 *
 * `AbilityDef` has no description field, and adding one would mean 200-odd
 * sentences in `src/data` that go stale the first time a data agent retunes a
 * spell. `src/engine/tactics/advisor.ts` already solved this for the advisor
 * card: {@link describeAbility} reads formula, damage type, hit count, element,
 * what it inflicts and what it cures straight off the record. The same sentence
 * on the same move is also the *point* — the card and the menu slab cannot
 * disagree about what Hastega does if they are the same function.
 *
 * All this file adds is the lookup the UI could not do: the menu is handed
 * `AvailableCommand`s, which carry a command id and no record, so the id is
 * resolved against the shipped FFX registries. `src/ui/common/resultsMath.ts`
 * already imports `ITEMS` from the same module, so the layering is the one the
 * UI already uses.
 *
 * An id this registry does not hold (a chapter-local ability) resolves to
 * `null` and the slab prints whatever the row itself carried, which is exactly
 * today's behaviour — never a guess.
 */

/** The record behind a menu row, or `null` when the row is not an ability. */
function defFor(cmd: AvailableCommand): AbilityDef | null {
  const c = cmd.command;
  switch (c.kind) {
    case 'attack':
      return ABILITIES['attack'] ?? null;
    case 'defend':
      return ABILITIES['defend'] ?? null;
    case 'ability':
    case 'overdrive':
      return ABILITIES[c.id] ?? null;
    case 'item': {
      // An item's effect is either the id of a shared ability or an inline
      // record for a one-off (`ItemDef.effect`). Only reached when the item had
      // no `description` of its own, because `describeAbility` prefers the row's
      // `help` and `commands.ts` writes that from the description.
      const item = ITEMS[c.id];
      if (!item) return null;
      return typeof item.effect === 'string' ? (ABILITIES[item.effect] ?? null) : item.effect;
    }
    default:
      return null;
  }
}

/**
 * One line on the row, or `''` when nothing can honestly be said.
 *
 * `describeAbility` already writes the four command kinds that resolve to no
 * record at all (Summon, Dismiss, Defend, Switch); the two below are the ones
 * it does not, and they are written here rather than there because Escape and
 * Trigger are the FFX menu's own rows.
 */
export function commandEffectText(cmd: AvailableCommand): string {
  const derived = describeAbility(defFor(cmd), cmd, cmd.command);
  if (derived) return derived;
  switch (cmd.command.kind) {
    case 'escape':
      return 'Leaves the battle, if this encounter allows it';
    case 'trigger':
      // The encounter writes these (Talk, Jecht's gauge, a pagoda's seal) and
      // the row's own `help` is where that copy belongs. With none, say what a
      // trigger is rather than invent what this one does.
      return 'A one-off action this encounter offers';
    default:
      return '';
  }
}

/**
 * What the slab prints for a row: the effect, with the reason it is greyed out
 * in front of it when it is.
 *
 * A disabled row used to print only "Not enough MP", which tells a player what
 * they cannot do and not what they were reaching for.
 */
export function commandHelpText(cmd: AvailableCommand): string {
  const effect = commandEffectText(cmd);
  if (cmd.enabled || !cmd.disabledReason) return effect;
  return effect ? `${cmd.disabledReason} — ${effect}` : cmd.disabledReason;
}
