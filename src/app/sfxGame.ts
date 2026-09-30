/**
 * The effects' voice follows the chapter being played (D-302, the recorded SFX set).
 *
 * `BattleScreenFlow.runChapter` wraps every chapter run, from its prep and cutscenes through the
 * battle, pause and results, in {@link sfxChapter}: an FFX chapter's menus and effects speak FFX, an
 * FFX-2 chapter's FFX-2, and when the run ends (back to the board or the title) the voice is cleared,
 * so the title, chapter select and every FF7 screen keep the first sprite's cues exactly as before
 * (`src/audio/sfxV2/voicing.ts`). Game case: both, each its own voice; FF7 none.
 */

import { getChapter, type ChapterId } from '../data/encounters.ts';
import { setSfxGame } from '../audio/sfxV2/voicing.ts';

/** Voice the effects for chapter `id` until the returned function runs (which also runs `release`). */
export function sfxChapter(id: ChapterId, release: () => void): () => void {
  setSfxGame(getChapter(id)?.game ?? null);
  return () => {
    setSfxGame(null);
    release();
  };
}
