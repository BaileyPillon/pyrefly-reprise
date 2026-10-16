/**
 * The Pay rows of the player's Yojimbo and the short words of the Sisters' order rows (**FFX only**; Mirror Aeons, Chapter XXVII, is the one chapter that fields them).
 *
 * The engine offers ONE Pay row, a template whose `gilSpent` is 0 ("the screen fills the payment": `battle/ffx/aeon-commands.ts`), and a payment of nothing is
 * the game's "he leaves, compatibility -20" branch. The HUD has no amount screen, so a human who chose that row paid nothing and lost him. This is the cheapest
 * screen the player can read and the keys already drive: the one Pay row becomes a short ladder of Pay rows in the same Aeon group, one per round amount, each
 * with its `gilSpent` filled, and a last row that spends everything the party has left. The amounts are capped by that gil.
 *
 * **Provisional.** Whether Bailey wants these rows, a stepper like the Overdrive picker or a fixed payment per chapter is his pick (AGENTS.md rule 9; the
 * handoff names the options). Nothing here is the engine's: the engine reads `gilSpent` and refuses anything above the party's gil, exactly as before, and
 * the advisor and the bench build their own Pay command (`engine/tactics/mirror-aeons.ts`), so a swap of this ladder moves no number.
 *
 * The amounts are our choice, set by the roll (`battle/ffx/kernel/yojimbo.ts`): the gil adds four points of the command roll for each doubling from 8 gil, so
 * each tenfold step here is worth about thirteen points.
 *
 * **The Sisters' orders** keep the engine's rows and ids; only their labels are shortened, because the command column cuts a label at about sixteen letters and the engine's own words ("Combine for the Delta Attack",
 * "Revive and support (Cindy)") read "COMBINE FOR THE ..." and "REVIVE AND SUPPOR..." on the one order that matters, and a phone's half-width tile cuts anything over about thirteen letters ("COMBINE POWE..."). The game's own
 * name for the order is Combine powers: the row says Combine and its help line says the rest.
 *
 * Imports no DOM and no `three` (layering, AGENTS.md rule 1): a pure function of the rows and the gil.
 */

import type { AbilityCommand, AvailableCommand } from '../battle/common/types.ts';

/** The id of Yojimbo's Pay (`battle/ffx/aeon-commands.ts` owns it; a literal here so this file imports no engine module). */
const PAY_ABILITY_ID = 'yojimbo-pay';

/** The round payments offered, smallest first; one that is more than the party has is left out. */
export const PAY_AMOUNTS: readonly number[] = [1_000, 10_000, 100_000, 1_000_000];

const gilText = (n: number): string => n.toLocaleString('en-US');

const isPayRow = (c: AvailableCommand): boolean => c.command.kind === 'ability' && c.command.id === PAY_ABILITY_ID;

/**
 * The commands with Yojimbo's one Pay row replaced by one row per round amount the party can pay and a last row for all of it. Anything else comes back
 * unchanged (the same array), so every other menu is untouched. `gil` is what the party has left (`state.flags['yojimbo:gil']`); with none the Pay row is
 * kept, greyed, with the reason.
 */
export function payRows(commands: AvailableCommand[], gil: number | undefined): AvailableCommand[] {
  const at = commands.findIndex(isPayRow);
  if (at < 0 || gil === undefined || !Number.isFinite(gil)) return commands;
  const template = commands[at]!;
  if (gil < 1) return commands.map((c, i) => (i === at ? { ...c, label: 'Pay', enabled: false, disabledReason: 'The party has no gil' } : c));
  const row = (amount: number, label: string): AvailableCommand => ({
    ...template,
    command: { ...(template.command as AbilityCommand), gilSpent: amount },
    label,
    enabled: true,
    help: `Pay him ${gilText(amount)} gil. A bigger payment buys a better stroke.`,
  });
  const rows: AvailableCommand[] = PAY_AMOUNTS.filter((a) => a < gil).map((a) => row(a, `Pay ${gilText(a)}`));
  rows.push(row(Math.trunc(gil), rows.length === 0 ? `Pay ${gilText(Math.trunc(gil))}` : 'Pay all')); // the amount is in the help line under the menu (a phone's half-width tile cuts "Pay all (1,500,000)")
  return [...commands.slice(0, at), ...rows, ...commands.slice(at + 1)];
}

/** The Sisters' orders, by ability id (`battle/ffx/aeon-commands.ts` ORDERS), in words that fit the command column. */
const ORDER_LABELS: Readonly<Record<string, string>> = {
  'sister-order-free': 'Free choice',
  'sister-order-repeat': 'Repeat last',
  'sister-order-attack': 'Attack order',
  'sister-order-cindy-spells': 'Cindy: spells',
  'sister-order-cindy-support': 'Cindy: support',
  'sister-order-combine': 'Combine',
  'sister-order-sandy-support': 'Sandy: support',
  'sister-order-mindy-drain': 'Mindy: drain',
};

/** The commands with every order row of a Sister relabelled in short words (nothing else about a row changes); any other menu comes back as the same array. */
export function shortOrderLabels(commands: AvailableCommand[]): AvailableCommand[] {
  const HELP: Readonly<Record<string, string>> = { 'sister-order-combine': 'Combine powers: the three Sisters strike together with the Delta Attack.' };
  const named = (c: AvailableCommand): string | undefined => (c.command.kind === 'ability' ? ORDER_LABELS[c.command.id] : undefined);
  if (!commands.some((c) => named(c) !== undefined)) return commands;
  return commands.map((c) => {
    const label = named(c);
    if (label === undefined) return c;
    const help = c.help ?? (c.command.kind === 'ability' ? HELP[c.command.id] : undefined);
    return { ...c, label, ...(help === undefined ? {} : { help }) };
  });
}

/** What a person's menu is handed in place of the engine's rows: the Pay ladder and the Sisters' short order words. */
export function aeonMenuRows(commands: AvailableCommand[], gil: number | undefined): AvailableCommand[] {
  return shortOrderLabels(payRows(commands, gil));
}
