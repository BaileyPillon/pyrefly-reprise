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
import { setWarmGate } from '../audio/WarmGate.ts'; // release 73 (lane "r73-bytes"): on the phone the cues the first fight does not play wait for the entry
import { bytesHeld, noteBytesCut, whenBackgroundOpen } from '../engine/LoadHold.ts';
import { getChapter, type Chapter, type ChapterId } from '../data/encounters.ts';
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
  const wanted = [chapter.music.scene, opening, resultsCueFor(chapter, 'victory')?.cue, resultsCueFor(chapter, 'defeat')?.cue]; // the win's cue is the results screen's own (release 61: Chapter IV's is the quiet one)
  return [...new Set(wanted.filter((cue): cue is string => typeof cue === 'string' && cue.length > 0))];
}

/**
 * Release 73 (lane "r73-bytes", both games): the cues of {@link chapterWarmCues} that the first command does not need, the ones after the scene's bed and the first fight's theme: the victory and the defeat
 * cues. A phone whose pre-battle scene is short is still fetching them when the battle screen begins to enter (release 70, Chapter IV: 1.6 MB inside the entry), so they wait for the entry's hold.
 */
export function chapterLaterCues(chapter: Chapter): string[] {
  const first = new Set<string | null | undefined>([chapter.music.scene, cueForGroup(chapter, chapter.enemyGroupRef, 'first').track]);
  return chapterWarmCues(chapter).filter((cue) => !first.has(cue));
}

/**
 * Warm chapter `id`'s cues until the returned function runs (which also runs `release`). Mirrors `sfxChapter`
 * (`src/app/sfxGame.ts`): the run that starts the warm is the run that ends the hold.
 *
 * Release 73: the later cues ({@link chapterLaterCues}) wait while the phone's entry holds the line (`LoadHold.bytesHeld`) and are fetched, in the same order, once it opens; with no hold (every desktop,
 * `?phonebytes=off`, a chapter whose warm finished before the entry began) the gate answers nothing and the warm is exactly what it was.
 */
export function musicChapter(id: ChapterId, release: () => void): () => void {
  const chapter = getChapter(id);
  const later = new Set(chapter ? chapterLaterCues(chapter) : []);
  const ungate = setWarmGate((cue) => {
    if (!later.has(cue) || !bytesHeld()) return undefined;
    noteBytesCut('audioCues');
    return whenBackgroundOpen();
  });
  const end = chapter ? audio.warmMusic(chapterWarmCues(chapter)) : null;
  return () => {
    end?.();
    ungate();
    release();
  };
}
