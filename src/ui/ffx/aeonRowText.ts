import type { AvailableCommand } from '../../battle/common/types.ts';
import { PAY_ABILITY_ID } from '../../battle/ffx/aeon-commands.ts';

/**
 * **The player's Yojimbo and Magus Sisters rows, in the menu's own words** (the hidden Last Summoning; FFX only; AGENTS.md rule 14). The engine's rows (`battle/ffx/aeon-commands.ts`, the RE lane FFX-K's file,
 * which this lane leaves exactly as that lane wrote it) carry names a long banner can hold and, for Pay, a developer's note where the slab's help line goes. The command menu and the advisor's card are narrow
 * (a phone's menu most of all), and the help line is read by the player, so the HUD passes the rows through {@link aeonRowText} before either sees them:
 *
 * - a Sister's order gets the short label of {@link SISTER_ORDER_SHORT} (Combine for the Delta Attack becomes "Combine"; the engine's longer name stays the action banner's, so the events a presenter sees are the RE lane's);
 * - Pay and Combine get a line that says what they do ({@link PAY_HELP}, {@link COMBINE_HELP});
 * - an order the engine lists but cannot carry out yet (RE open item 1: only Combine has a handler) says "Not available yet" instead of the engine's note on its target search.
 *
 * Nothing else about a row changes: not its command, its targets, its rank, its cost or whether it is enabled. Every other row, and every menu with none of these rows, comes back as the same array.
 */

/** The short label of each order, keyed by the engine's ability id. Every id of the engine's `ORDERS` has one (`tests/unit/last-summoning-presentation.test.ts`). */
export const SISTER_ORDER_SHORT: Readonly<Record<string, string>> = {
  'sister-order-free': 'Free choice',
  'sister-order-repeat': 'Repeat last',
  'sister-order-attack': 'Attack',
  'sister-order-cindy-spells': 'Spells',
  'sister-order-cindy-support': 'Support',
  'sister-order-combine': 'Combine',
  'sister-order-sandy-support': 'Support',
  'sister-order-mindy-drain': 'Drain',
};

/** The ability id of the order that has a handler today: the Delta Attack. */
export const COMBINE_ORDER_ID = 'sister-order-combine';

/** The line the command slab and the advisor's card print for Pay. The payment itself is asked for by `./YojimboPay.ts`. */
export const PAY_HELP = 'Pay him, and he strikes for you. The more gil, the better the blow.';

/** The line for Combine: the Delta Attack, six hits on one foe (the player's `delta-attack` is a single-enemy move; the possessed Cindy's own is the one that hits the front line). */
export const COMBINE_HELP = 'All three Sisters strike together: the Delta Attack, six hits on one foe.';

/** What a listed order that cannot be carried out yet says. */
export const ORDER_NOT_YET = 'Not available yet';

/** The engine's own note on such an order (`battle/ffx/aeon-commands.ts#aeonMenuRows`): its target search is not decoded. */
const NOT_BUILT = /^Not built/;

/** The rows for the menu and the card: the same array when none of them is Yojimbo's Pay or a Sister's order. */
export function aeonRowText(commands: AvailableCommand[]): AvailableCommand[] {
  let changed = false;
  const out = commands.map((row) => {
    if (row.command.kind !== 'ability') return row;
    const id = row.command.id;
    if (id === PAY_ABILITY_ID) {
      changed = true;
      return { ...row, help: PAY_HELP };
    }
    const short = SISTER_ORDER_SHORT[id];
    if (short === undefined) return row;
    changed = true;
    const next: AvailableCommand = { ...row, label: short };
    if (id === COMBINE_ORDER_ID) next.help = COMBINE_HELP;
    if (!row.enabled && NOT_BUILT.test(row.disabledReason ?? '')) next.disabledReason = ORDER_NOT_YET;
    return next;
  });
  return changed ? out : commands;
}
