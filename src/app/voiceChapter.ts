/**
 * The recorded voice follows the chapter being played (the Echoes of Spira voice-over; Bailey, 2026-10-07).
 *
 * `BattleScreenFlow.runChapter` wraps every chapter run, from its prep and cutscenes through the battle, pause and results, in
 * {@link voiceChapter} beside `sfxChapter`: an FFX chapter fetches its voice manifest and warms its mid-battle and victory lines,
 * an FFX-2 or FF7 chapter asks for nothing at all, and when the run ends (back to the board or the title) the voice is cleared.
 *
 * Game case: FFX only today, because Bailey picked the FFX voices of Tidus, Yuna and Auron; FFX-2 Yuna and every other speaker
 * stay text-only until he picks (`story/voice/voiceManifest.ts#GAMES_WITH_VOICE` is the one list to extend).
 */

import { getChapter, type ChapterId } from '../data/encounters.ts';
import { voice } from '../audio/voice/index.ts';

/** Voice chapter `id` until the returned function runs (which also runs `release`). */
export function voiceChapter(id: ChapterId, release: () => void): () => void {
  const end = voice.beginChapter(id, getChapter(id)?.game);
  return () => {
    end();
    release();
  };
}
