/**
 * PR-0215: the words behind a withdrawal (Bailey's pick B, D-249, plan section 8 Q6).
 *
 * The FFX engine ends a fight that can no longer be won with `'escape'` and the system line
 * {@link STALEMATE_LINE} (`src/battle/ffx/engine.ts`, the stalemate watch). The results card prints
 * that line where a victory card puts its quip, under a caption that reads WITHDREW. A withdrawal
 * with no stalemate behind it (every member ejected) has no such line in the log, so the card
 * prints none: only the engine's own words are ever shown.
 *
 * The hidden Gauntlet chapter (FFX only, 2026-11-10) adds the one other engine line a withdrawal can end on: its Cactuar King's Run Away ends act 1 as an 'escape' with the line "The Cactuar King got away!"
 * (`src/battle/ffx/ai/gauntlet-end.ts`), which the card prints the same way; no other battle's log carries it.
 *
 * **Game case:** the stalemate rule is FFX only (the FFX-2 engine has no stalemate watch); reading
 * the log and the card are shared plumbing, so both.
 */
import type { BattleEvent } from '../../battle/common/types.ts';
import { GOT_AWAY_LINE } from '../../battle/ffx/ai/gauntlet-end.ts';

/** The FFX engine's own line, character for character (a test pins it to `engine.ts`). */
export const STALEMATE_LINE = 'The battle cannot be won from here.';

/** The engine's own lines a withdrawal can end on: the stalemate's, and the Gauntlet's Cactuar King leaving. */
const WITHDRAW_LINES: readonly string[] = [STALEMATE_LINE, GOT_AWAY_LINE];

/** The engine's stalemate line (or the Gauntlet's "got away" line) if this battle's log carries it, else null. */
export function withdrawLineFrom(log: readonly BattleEvent[] | undefined): string | null {
  if (!log) return null;
  for (let i = log.length - 1; i >= 0 && i >= log.length - 40; i--) {
    const e = log[i]!;
    if (e.type === 'message' && e.kind === 'system' && WITHDRAW_LINES.includes(e.text)) return e.text;
  }
  return null;
}
