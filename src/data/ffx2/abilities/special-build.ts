/**
 * Builds the menu-facing `AbilityDef` of a Special dressphere's command from the game's own row (FFX-2 only).
 *
 * The three Special dresspheres' abilities (`special-floral-fallal.ts`, `special-machina-maw.ts`, `special-full-throttle.ts`) are each one call of {@link special}: the id, the name, the MP, the statuses it
 * carries, the flags, who it can target, its elements and its menu category are what the menu shows; every number the damage kernels run on (the power, the hits, the formula, the accuracy, the cast and
 * ATB costs, the target and misc flag words) is the game's row in `../command-records/special.ts`, looked up by the id here and attached again by `attachFfx2CommandRecords`. A row the table lacks throws at
 * load: an ability without its row would run on a derived one, which is not what the game has.
 *
 * Source: `research/re-ffx2-special-dresspheres.md` §4 (`kernel/command.bin` rows read from the Steam HD build 25501027, parts from `kernel/job.bin`) [verified: the game's own tables].
 */

import type { AbilityCategory, AbilityDef, ActionFlag, ElementId, FormulaKey, StatusApplication, Targeting } from '../../../battle/common/types.ts';
import { COMMAND_RECORDS_SPECIAL } from '../command-records/special.ts';

/** The damage formula key the menu and the previews read for a game formula number (the record itself is what runs). */
function formulaKeyOf(formula: number, flagsDamage: number, power: number): FormulaKey {
  switch (formula) {
    case 0:
      if (power === 0) return 'none';
      return (flagsDamage & 2) !== 0 ? 'magic' : 'strength';
    case 1:
      return (flagsDamage & 2) !== 0 ? 'piercing-magic' : 'piercing-strength';
    case 2:
      return 'magic';
    case 4:
      return 'percent-current';
    case 5:
      return 'fixed-no-variance';
    case 6:
      return 'healing';
    case 7:
      return 'percent-total';
    case 9:
      return 'special-magic';
    default:
      return power === 0 ? 'none' : 'strength';
  }
}

/** The game's charge cost over the menu's value scale (the tiers 16 / 26 / 39 are 50 / 80 / 120 of the row's cost). */
const chargeValueOf = (costCast: number): number => Math.round((costCast * 39) / 120);

export function special(
  id: string,
  name: string,
  mpCost: number,
  statusEffects: StatusApplication[],
  flags: ActionFlag[],
  targeting: Targeting,
  element: ElementId[],
  category: AbilityCategory,
): AbilityDef {
  const rec = COMMAND_RECORDS_SPECIAL[id];
  if (rec === undefined) throw new Error(`special-build: no command row for ${id}`);
  const damageType = (rec.flagsDamage & 2) !== 0 ? 'magical' : (rec.flagsDamage & 1) !== 0 ? 'physical' : 'other';
  return {
    id,
    name,
    game: 'ffx2',
    category,
    mpCost,
    chargeTicks: chargeValueOf(rec.costCast ?? 0),
    recoveryTicks: rec.costAtb ?? 70,
    power: rec.power,
    formula: formulaKeyOf(rec.formula, rec.flagsDamage, rec.power),
    damageType,
    element: element.length > 0 ? element : ['none'],
    targeting,
    hits: rec.hits,
    statusEffects,
    removesStatuses: [],
    flags,
    messageTemplate: category === 'attack' ? '{user} attacks {target}' : `{user} uses ${name}`,
  };
}
