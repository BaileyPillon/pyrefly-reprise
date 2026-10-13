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
import type { SceneCueGate } from './sceneCueGate.ts';

/**
 * Voice the effects for chapter `id` until the returned function runs (which also runs `release`).
 *
 * SFX parity: an FFX or FFX-2 chapter also asks the mixer for its parity packs (the game's core pack and the
 * chapter's boss packs, `audio/sfxV2/packs.ts`) and gives them back at the end; the request is never awaited and
 * a pack the manifest does not list is never fetched, so with no pack shipped this changes nothing. With a `gate`
 * (the opening scene's cue goes first, `sceneCueGate.ts`) the request waits for it; the voice itself does not.
 */
export function sfxChapter(id: ChapterId, release: () => void, gate?: Pick<SceneCueGate, 'after'> | null): () => void {
  const game = getChapter(id)?.game ?? null;
  setSfxGame(game);
  let ended = false;
  if (game === 'ffx' || game === 'ffx2') {
    // r46-scenecue: with a gate, the packs are asked for once the opening scene's cue has arrived (or its cap passed); a run
    // that ends first never asks. Without one, at once, as before. The voice above is never deferred.
    const load = (): void => {
      if (!ended) audio.loadParityPacks(game, id);
    };
    if (gate) gate.after(load);
    else load();
  }
  return () => {
    ended = true;
    setSfxGame(null);
    audio.releaseParityPacks();
    release();
  };
}
