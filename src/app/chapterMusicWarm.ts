/**
 * The confirmed chapter's own music, fetched while the player is still in party prep (PR-0373; both games, shared plumbing).
 *
 * Round 25 (PR-0373): at the first spoken lines of a chapter's opening scene the scene cue was not yet playing in 10 of 30
 * non-Ch-I runs (still on the board's cue in 6, on no music in 4), because nothing asked for the cue until the scene opened.
 * `BattleScreenFlow.runChapter` now calls {@link musicChapter} the moment the board hands it the confirmed card, next to
 * the art preload (`preloadBattle`) and the effects' voice (`sfxChapter`), and the mixer fetches and decodes the cues in the
 * order the run needs them: the scene's bed (the first line), the first fight's theme, the victory sting.
 *
 * Only that chapter's cues, and only its own game's: the list comes from the chapter's own record (`Chapter.music`, and the
 * rule `cueForGroup` already uses to score its first formation). An FFX chapter names FFX cues and an FFX-2 chapter FFX-2
 * ones (the two scores share no cue; `tests/unit/flow-encounter-chain.test.ts` pins it), so a chapter warms nothing of the
 * other game's. A chapter the fight plays in several parts (Chapter III's Yu Yevon, Chapter V's Shuyin) warms the first
 * theme only; the later ones are fetched when their part opens, as before.
 *
 * Nothing here plays anything or changes when anything plays, and nothing waits for it: the mixer never awaits a warm and a
 * cue it cannot fetch is left for the play to handle as it always did.
 */

import { audio } from '../audio/index.ts';
import { getChapter, type Chapter, type ChapterId } from '../data/encounters.ts';
import { openingSceneCue } from './openingSceneCue.ts';
import type { SceneCueGate } from './sceneCueGate.ts';
import { cueForGroup } from './screens/BattleEncounterChain.ts';
import { resultsCueFor } from './screens/resultsMusic.ts';

/**
 * The cues a run of `chapter` needs, in the order it needs them: the scene's bed, the first formation's theme, the victory
 * sting, and last the defeat cue of the chapter's game (music batch 2, 2026-10-12; about 0.12 MB, and it must start when the
 * party falls rather than a fetch later). No duplicates (Trema's opening fight is scored with the scene's own bed), nothing
 * silent (a chapter with no cue for an outcome has none to warm).
 */
export function chapterWarmCues(chapter: Chapter): string[] {
  const opening = cueForGroup(chapter, chapter.enemyGroupRef, 'first').track;
  // r46-scenecue: the cue the opening scene plays at its first line leads. It is `Chapter.music.scene` for every shipped chapter
  // (pinned by tests/unit/scene-cue-gate.test.ts), so this adds nothing; a script that named another bed would still get it first.
  const wanted = [openingSceneCue(chapter), chapter.music.scene, opening, chapter.music.victory, resultsCueFor(chapter, 'defeat')?.cue];
  return [...new Set(wanted.filter((cue): cue is string => typeof cue === 'string' && cue.length > 0))];
}

/**
 * Warm chapter `id`'s cues until the returned function runs (which also runs `release`). Mirrors `sfxChapter`
 * (`src/app/sfxGame.ts`): the run that starts the warm is the run that ends the hold.
 *
 * With a `gate` (r46-scenecue, `sceneCueGate.ts`) the opening cue, which leads the list, is fetched alone and the gate is
 * settled by it; the end of the run also cancels the gate, so a deferred start that never ran never will. With no gate the
 * mixer is called exactly as before (one argument).
 */
export function musicChapter(id: ChapterId, release: () => void, gate?: SceneCueGate | null): () => void {
  const chapter = getChapter(id);
  const cues = chapter ? chapterWarmCues(chapter) : null;
  const end = cues ? (gate ? audio.warmMusic(cues, gate) : audio.warmMusic(cues)) : null;
  return () => {
    end?.();
    gate?.cancel();
    release();
  };
}
