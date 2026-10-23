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
import { audioNewOn, setPassChapter } from '../audio/pass/passSwitch.ts'; // the sound pass (decision 184): follows the chapter run, so its results are part of it
import { MAKEUP_DB } from '../audio/pass/passMix.ts';
import { setPassVictoryCue } from '../audio/pass/passResults.ts';

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
  setPassChapter(id); // Chapter I and Chapter IV only act on it (`audio/pass/passSwitch.ts`); the master makeup follows the run
  audio.setPassMakeup(audioNewOn() ? MAKEUP_DB : 0);
  setPassVictoryCue(game === 'ffx' ? (getChapter(id)?.music.victory ?? null) : null); // FFX: the pass starts this cue at the last blow in place of the sting (`audio/pass/passResults.ts`)
  if (game === 'ffx' || game === 'ffx2') audio.loadParityPacks(game, id);
  return () => {
    setSfxGame(null);
    setPassChapter(undefined);
    setPassVictoryCue(null);
    audio.setPassMakeup(0);
    audio.releaseParityPacks();
    release();
  };
}
