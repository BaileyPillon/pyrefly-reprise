/**
 * **Where a row lives on the command stack the player is actually looking at.**
 *
 * The advisor prints "Magic Break → Bahamut · in Skill" beside its pick, and
 * that chip is not decoration: it is the whole answer to the question Bailey
 * asked of the live build — *"I'm controlling Tidus but the advisor is telling
 * me to use Poison Fang? How does that make sense?"* — for a row that was in
 * Tidus's own Items list all along. A chip that names a menu is a promise, and
 * the promise has to be checkable against the stack painted three inches to its
 * right.
 *
 * Round 2 of this fix made that chip out of **one FFX-worded table used for
 * both games**, so on 49 of 67 FFX-2 suggestions it named a submenu FFX-2 does
 * not have: the card said `IN SPECIAL` and `IN ITEMS` while the stack beside it
 * read `ATTACK / SKILL / GUNNER / BLACK-MAGE / ITEM` [critic, fix-3 round 2,
 * F1]. The two games label and group their menus differently on purpose, and
 * the owner's standing rule is that a change true to one game is not applied to
 * the other unless it is true there as well. So this module models each game's
 * real grouping rule, separately, keyed off `state.game`.
 *
 * ## FFX — `src/ui/ffx/CommandMenuLogic.ts#buildTopRows`
 *
 * * `attack`, `escape`, `trigger` and `dismiss` are **top-level rows**. There
 *   is no submenu to open, so the chip is empty: "Attack · in Attack" told the
 *   player to open the row they were standing on [critic, round 2, F3].
 * * Every `switch` row collapses into one **Switch** group, and it opens its
 *   list even with a single member benched — a party swap has to show *who*.
 * * Everything else is grouped by `category`, and a one-entry group **stays a
 *   submenu**: FFX's stack reads `ATTACK / SPECIAL / WHITE MAGIC / ITEMS /
 *   SWITCH` whether Yuna knows one white spell or twelve.
 * * `defend` is **not on the FFX menu at all** — it is a base action, not a row
 *   [`ffx-combat-core` §1.3/§4.2] — which is why {@link onTheMenu} exists.
 *
 * ## FFX-2 — `src/ui/ffx2/CommandMenu.ts#groupRows`
 *
 * * Its category words are its own: `Skill`, not FFX's `Special`; `Item`,
 *   singular, not FFX's `Items`.
 * * **A category holding exactly one live row collapses to a top-level leaf**,
 *   which is how Trigger Happy and Gunplay sit directly on the stack
 *   [visual-bible §4.7]. So the same ability is "in Skill" on a board where the
 *   dressphere grants three skills and a bare top-level row on a board where it
 *   grants one, and only counting the decision's own command list can tell the
 *   two apart.
 * * **Spherechange is always `Change`**, never `Dressphere` and never the
 *   destination's name: in X-2 you press the Garment Grid open and pick the
 *   outfit *inside* it [visual-bible §4.5.2]. It is the one group that stays a
 *   submenu at a single destination.
 * * FFX-2 has no `switch`: the party is three and there is no bench.
 *
 * Both HUDs hand the advisor and their command menu the *same*
 * `AvailableCommand[]` (`FFXBattleHud.chooseCommand`, `FFX2BattleHud`'s
 * `showDecision` + `openCommandMenu` pair), so counting rows here counts the
 * rows that are about to be painted. `tests/unit/advisor-menu.test.ts` renders
 * both real menus — FFX-2's in jsdom, through `openCommandMenu` itself — and
 * asserts every chip against the labels that came out.
 */

import type { AvailableCommand, BattleState, Command } from '../../battle/common/types.ts';
import { refusedAirshipOrder } from './airship-orders.ts';

/** Mirrors `ui/ffx/CommandMenuLogic.ts`'s `CATEGORY_LABEL`. */
const FFX_CATEGORY_LABEL: Record<string, string> = {
  attack: 'Attack',
  skill: 'Skill',
  special: 'Special',
  blackmagic: 'Black Magic',
  whitemagic: 'White Magic',
  summon: 'Summon',
  overdrive: 'Overdrive',
  aeon: 'Aeon',
  item: 'Items',
};

/** Mirrors `ui/ffx2/CommandMenu.ts`'s `CATEGORY_LABELS`. Note `Skill` and `Item`. */
const FFX2_CATEGORY_LABEL: Record<string, string> = {
  attack: 'Attack',
  skill: 'Skill',
  special: 'Special',
  blackmagic: 'Black Magic',
  whitemagic: 'White Magic',
  summon: 'Summon',
  overdrive: 'Overdrive',
  aeon: 'Aeon',
  item: 'Item',
  dressphere: 'Dressphere',
  enemy: 'Enemy',
};

/** FFX rows that resolve on their own — `CommandMenuLogic.ts`'s `DIRECT_KINDS`. */
const FFX_DIRECT_KINDS = new Set<Command['kind']>(['attack', 'escape', 'trigger', 'dismiss']);

/** The synthetic FFX group every `switch` row collapses into. */
const FFX_SWITCH_LABEL = 'Switch';

/** FFX-2's Garment Grid row. Always a submenu; never the outfit's name. */
const FFX2_CHANGE_LABEL = 'Change';

function capitalize(s: string): string {
  return s.length > 0 ? s[0]!.toUpperCase() + s.slice(1) : s;
}

/**
 * Is this row reachable from the command window at all?
 *
 * One row is not: FFX's menu drops `defend` outright — it is an affordance on
 * the field, not an entry in the list — so a card that says "Defend" is naming
 * something the player cannot press however hard they read the stack. FFX-2
 * keeps it (`withTargets` has a `defend` branch and `groupRows` files it under
 * its category like anything else), so this is FFX-only, exactly as the two
 * menus are.
 */
export function onTheMenu(game: BattleState['game'], command: Command): boolean {
  return !(game !== 'ffx2' && command.kind === 'defend');
}

/**
 * {@link onTheMenu}, plus the rows a chapter's own widget greys out on this
 * board: Evrae's order widget refuses "Pull back" when the ship is already far
 * or already ordered far (and "Close in" likewise), though the engine keeps
 * them legal (`./airship-orders.ts`). A card that names a greyed row names
 * something the player cannot press. FFX only in effect; inert without the
 * airship flag.
 */
export function pressable(state: Readonly<BattleState>, command: Command): boolean {
  return onTheMenu(state.game, command) && !refusedAirshipOrder(state.flags, command);
}

/**
 * The submenu title the player opens to reach `row`, or `''` when the row is
 * already a top-level entry on the stack.
 *
 * `commands` must be the *whole* list for this decision — the one the HUD is
 * about to hand its command menu — because FFX-2's collapse rule is a property
 * of the category's population, not of the row.
 */
export function menuChipFor(
  game: BattleState['game'],
  commands: readonly AvailableCommand[],
  row: AvailableCommand,
): string {
  return game === 'ffx2' ? ffx2Chip(commands, row) : ffxChip(row);
}

function ffxChip(row: AvailableCommand): string {
  const kind = row.command.kind;
  if (kind === 'switch') return FFX_SWITCH_LABEL;
  // Dropped by `buildTopRows`; `onTheMenu` is the gate that keeps it off the
  // card, and there is no submenu to name either way.
  if (kind === 'defend') return '';
  // Evrae's two orders fold into one "Orders" row (`ui/ffx/AirshipOrders.ts`).
  if (kind === 'trigger' && (row.command.id === 'pull-back' || row.command.id === 'close-in')) return 'Orders';
  if (FFX_DIRECT_KINDS.has(kind)) return '';
  return FFX_CATEGORY_LABEL[row.category] ?? capitalize(row.category);
}

function ffx2Chip(commands: readonly AvailableCommand[], row: AvailableCommand): string {
  if (row.command.kind === 'spherechange') return FFX2_CHANGE_LABEL;
  // The collapse rule: a lone row in its category is painted at the top level,
  // with no group to open. Spherechange rows are counted out because they were
  // moved into the Change group before the count ran.
  let inCategory = 0;
  for (const c of commands) {
    if (c.command.kind === 'spherechange') continue;
    if (c.category === row.category) inCategory += 1;
  }
  if (inCategory <= 1) return '';
  return FFX2_CATEGORY_LABEL[row.category] ?? row.category;
}
