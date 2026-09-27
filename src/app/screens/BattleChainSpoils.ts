/**
 * The spoils of a chained FFX-2 encounter: every battle's EXP, AP, gil and drops, not only the
 * last link's (critic PR-0138).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. In FFX-2 each link of a chain is its own battle
 * with its own results in the source rows: Chapter V's Vegnagun Tail 5,000 EXP / 5 AP / 3,000 gil,
 * the Leg, the Body and the Head after it, Shuyin 0 / 20 / 0 (`research/ffx2-vegnagun-shuyin.md`
 * lines 203, 232, 261, 308, 435); Chapter XI's Shiva 8,000 / 15 / 2,000, the Sisters and Anima
 * 6,000 / 15 / 2,000 (`research/ffx2-fallen-aeons.md` §3.1 to §3.3). The results screen read the
 * last link's result alone, so V showed Shuyin's 0 EXP and XI Anima's row. FFX's chains grant their
 * rewards once, at the end (`research/ffx-yunalesca.md` line 94; Braska's Final Aeon pays 0 AP), so
 * an FFX chain keeps its last result exactly as before.
 *
 * The Sisters' AP is a recorded source conflict (8 each in the wiki, GamerGuides and
 * Split_Infinity; 15 in SinirothX; `research/ffx2-fallen-aeons.md` §9 F-4): this sums whatever the
 * data row carries and settles nothing. AP is summed as the screen shows it, "per dressphere".
 * Only the links fought in this attempt count: a checkpoint retry (Chapter XI) starts its ledger at
 * the checkpoint, and carrying the earlier attempt's spoils belongs to the flow (open, B5).
 *
 * Every other field (turns, time, levels) stays the last link's, so the flow's timing is untouched.
 * Layering: pure data, no DOM, no `three`.
 */

import type { BattleResult, GameId, ItemDrop } from '../../battle/common/types.ts';

/** The result the results screen should show for a chain that ended in `last`, having won `won` first. */
export function chainSpoils(game: GameId, won: readonly BattleResult[], last: BattleResult): BattleResult {
  if (game !== 'ffx2' || won.length === 0) return last;
  const all = [...won, last];
  const sum = (pick: (r: BattleResult) => number | undefined): number => all.reduce((t, r) => t + (pick(r) ?? 0), 0);
  const drops: ItemDrop[] = all.flatMap((r) => r.drops ?? []);
  return { ...last, exp: sum((r) => r.exp), ap: sum((r) => r.ap), gil: sum((r) => r.gil), drops };
}
