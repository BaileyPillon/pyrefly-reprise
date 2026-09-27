/**
 * A-2 (iteration 2 B5): how the battle was reached, for `playBattleEntry`
 * (`src/ui/common/transitions/entry.ts`; approved tile "The pane breaks",
 * Bailey 2026-09-19, "canon by situation").
 *
 * - `'retry'`: any attempt after the first (a checkpoint retry included).
 * - `'scene'`: the first attempt, out of the chapter's pre-battle scene.
 * - `'skipped'`: scenes switched off, or a chapter with no pre-battle scene
 *   (the fight is reached from party prep, not out of a scene).
 *
 * A scene the player skipped with Enter still reads `'scene'`: the cutscene
 * screen does not report it (docs/handoff/iter2-b2.md).
 *
 * GAME-AWARE (AGENTS.md rule 14): **both**. The table in `entry.ts` decides
 * per game (FFX: blur out of a scene, its shatter otherwise; FFX-2: its
 * shatter in every situation).
 */
import type { EntrySituation } from '../../ui/common/transitions/entry.ts';

export function entrySituationFor(
  attempt: number,
  opts: { skipCutscenes?: boolean | undefined },
  chapter: { scriptsRef?: { pre?: readonly unknown[] | undefined } | undefined },
): EntrySituation {
  if (attempt > 0) return 'retry';
  if (opts.skipCutscenes || !chapter.scriptsRef?.pre?.length) return 'skipped';
  return 'scene';
}
