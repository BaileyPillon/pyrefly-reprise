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
import { audio } from '../audio/index.ts';
import { setSfxGame } from '../audio/sfxV2/voicing.ts';

/**
 * Voice the effects for chapter `id` until the returned function runs (which also runs `release`).
 *
 * SFX parity: an FFX or FFX-2 chapter also asks the mixer for its parity packs (the game's core pack and the
 * chapter's boss packs, `audio/sfxV2/packs.ts`) and gives them back at the end; the request is never awaited and
 * a pack the manifest does not list is never fetched, so with no pack shipped this changes nothing.
 */
export function sfxChapter(id: ChapterId, release: () => void): () => void {
  const game = getChapter(id)?.game ?? null;
  setSfxGame(game);
  if (game === 'ffx' || game === 'ffx2') audio.loadParityPacks(game, id);
  return () => {
    setSfxGame(null);
    audio.releaseParityPacks();
    release();
  };
}
