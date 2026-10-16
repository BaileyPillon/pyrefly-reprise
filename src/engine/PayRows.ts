/**
 * The Pay rows of the player's Yojimbo (**FFX only**; Mirror Aeons, Chapter XXVII, is the one chapter that fields him).
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
    help: `Pay Yojimbo ${gilText(amount)} gil. The more he is paid, the better the stroke he draws; the gil is the party's and what is left is carried on.`,
  });
  const rows: AvailableCommand[] = PAY_AMOUNTS.filter((a) => a < gil).map((a) => row(a, `Pay ${gilText(a)}`));
  rows.push(row(Math.trunc(gil), rows.length === 0 ? `Pay ${gilText(Math.trunc(gil))}` : `Pay all (${gilText(Math.trunc(gil))})`));
  return [...commands.slice(0, at), ...rows, ...commands.slice(at + 1)];
}
