/**
 * PR-0215: the words behind a withdrawal (Bailey's pick B, D-249, plan section 8 Q6).
 *
 * The FFX engine ends a fight that can no longer be won with `'escape'` and the system line
 * {@link STALEMATE_LINE} (`src/battle/ffx/engine.ts`, the stalemate watch). The results card prints
 * that line where a victory card puts its quip, under a caption that reads WITHDREW. A withdrawal
 * with no stalemate behind it (every member ejected) has no such line in the log, so the card
 * prints none: only the engine's own words are ever shown.
 *
 * **Game case:** the stalemate rule is FFX only (the FFX-2 engine has no stalemate watch); reading
 * the log and the card are shared plumbing, so both.
 */
import type { BattleEvent } from '../../battle/common/types.ts';

/** The FFX engine's own line, character for character (a test pins it to `engine.ts`). */
export const STALEMATE_LINE = 'The battle cannot be won from here.';

/** The engine's stalemate line if this battle's log carries it, else null. */
export function withdrawLineFrom(log: readonly BattleEvent[] | undefined): string | null {
  if (!log) return null;
  for (let i = log.length - 1; i >= 0 && i >= log.length - 40; i--) {
    const e = log[i]!;
    if (e.type === 'message' && e.kind === 'system' && e.text === STALEMATE_LINE) return e.text;
  }
  return null;
}
