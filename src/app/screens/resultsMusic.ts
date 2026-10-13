/**
 * The music of the results screen: which cue plays on a win and on a loss, and how it ends (music batch 2, 2026-10-12).
 *
 * Bailey, 2026-10-10 23:05 EDT: "i'll go with all your recommendations even as to music and sound effects. you recommend an dchoose it please."; 2026-10-12: "I'll go with all of your
 * recommendations" (driver items 53d, 58e, 58f). Before this, `BattleScreenFlow.showResults` started the chapter's `victory` cue on a win and nothing on a loss (the battle theme had been
 * faded out by the battle screen's exit and the defeat panel sat in silence), and Chapter IV's results screen was silent.
 *
 * - **Victory.** The chapter's own `music.victory`: `victory-ffx` (FFX), `victory-ffx2` (FFX-2) and, for Chapter IV (FFX-2, Bahamut), `victory-bahamut`. Each is an intro plus a loop in one
 *   MP3: a fanfare opening of 6 to 9 s into a body that loops on the results screen, which is what the manifest's `loopStart` and `loopEnd` already say (the player always loops from
 *   `loopEnd` back to `loopStart`). Only the last link of an encounter reaches the results screen, so only the last link stings; the presenter's own sting is gated the same way
 *   (`BattlePresenterBeats.victory`, `moreLinks`), and a link that chains on starts its next theme instead.
 * - **Defeat.** `defeat-ffx` (FFX chapters) or `defeat-ffx2` (FFX-2 chapters), one cue per game, played once: the file holds a cue of 6 to 8 s and then 2 s of digital silence that the
 *   player loops (`oneShot` in the manifest). A withdrawal (`escape`, the FFX stalemate) is not a defeat and keeps today's behaviour. The battle theme is already fading out when the cue is
 *   asked for (the battle screen's exit, `BattleScreen.exit`, stops the music over 0.6 s), so the cue is started once the results screen has replaced the battle screen: asked for
 *   earlier, the exit would cut it. The cue ends when the player chooses: a RETRY (or any choice) fades a defeat cue that is still sounding, or still loading, out at once, so it never
 *   plays over the prep menu or the next fight; the next fight's own theme is a new request that would replace it anyway, but the prep menu comes first.
 *
 * Game case: both, each game with its own cue (FFX chapters 1 to 3 and 7 to 14, 17, 18 and the hidden Sinspawn Gui chapter; FFX-2 chapters 4 to 6, 11, 13, 15, 16 and the hidden Leblanc
 * preview and Experiment). FF7's hidden chapter has its own results windows and never comes here. Layering: no `three`, no DOM; the audio is a port.
 */

import type { Chapter } from '../../data/encounters.ts';
import { isSilentResultsChapter } from '../../ui/common/resultsMath.ts';

/** The defeat cue of each game. */
export const DEFEAT_CUES = { ffx: 'defeat-ffx', ffx2: 'defeat-ffx2' } as const;

/** Crossfade seconds for a victory cue: as before (0.4). */
export const VICTORY_FADE_S = 0.4;
/** Crossfade seconds for a defeat cue: short, so its first note is not lost under the fade-in while the battle theme goes. */
export const DEFEAT_FADE_S = 0.3;
/** Seconds a defeat cue that is still sounding or loading takes to go when the player chooses. */
export const DEFEAT_OUT_S = 0.5;

/** One cue the results screen plays, and how. */
export interface ResultsCue {
  cue: string;
  kind: 'victory' | 'defeat';
  /** Seconds, for `playMusic`. */
  fade: number;
}

/** What the results screen plays for `chapter` when the battle ended as `outcome`, or `null` for silence. */
export function resultsCueFor(chapter: Chapter, outcome: string): ResultsCue | null {
  if (outcome === 'victory') {
    return chapter.music.victory ? { cue: chapter.music.victory, kind: 'victory', fade: VICTORY_FADE_S } : null;
  }
  if (outcome === 'defeat') {
    const cue = chapter.game === 'ffx' ? DEFEAT_CUES.ffx : chapter.game === 'ffx2' ? DEFEAT_CUES.ffx2 : null;
    return cue ? { cue, kind: 'defeat', fade: DEFEAT_FADE_S } : null;
  }
  return null; // 'escape' (a withdrawal) is neither: the screen keeps what it had
}

/**
 * Whether the results screen is silent in the old sense: no pose, no tally flourish, no quips (`ResultsScreen`'s `silent`). A chapter with no victory cue is, and Chapter IV is whatever its
 * cue: since 2026-10-12 it has a victory cue (the quiet resolve under its silent screen), so the screen can no longer be called silent just because the cue is absent.
 */
export function resultsScreenSilent(chapter: Chapter): boolean {
  return chapter.music.victory === undefined || isSilentResultsChapter(chapter.id);
}

/** The slice of `AudioManager` this needs. Structural, so a test can fake it. */
export interface ResultsMusicPort {
  /** The cue the mixer is heading for, a still-decoding request included (`AudioManager.requestedMusic`). */
  readonly requestedMusic: string | null;
  playMusic(name: string, options?: { fade?: number }): Promise<void> | unknown;
  stopMusic(fade?: number): void;
}

/** A started results cue, ended by the player's choice. */
export interface ResultsMusicHandle {
  /** The player has chosen. A defeat cue still sounding or still loading goes; a victory cue is left to the scene that follows, as it always was. Safe to call twice. */
  end(): void;
}

const NOTHING: ResultsMusicHandle = { end: () => undefined };

/**
 * Ask for `cue` (the result of {@link resultsCueFor}) and return the handle that ends it. `null` asks for nothing.
 * A request the mixer cannot honour (a cue that will not load) is swallowed: the screen never waits on its music.
 */
export function startResultsMusic(audio: ResultsMusicPort, cue: ResultsCue | null): ResultsMusicHandle {
  if (!cue) return NOTHING;
  try {
    void Promise.resolve(audio.playMusic(cue.cue, { fade: cue.fade })).catch(() => undefined);
  } catch {
    return NOTHING;
  }
  let ended = false;
  return {
    end: () => {
      if (ended) return;
      ended = true;
      if (cue.kind !== 'defeat') return;
      try {
        // Only while it is still the cue the mixer is heading for. `stopMusic` also drops a request still decoding (it bumps the request id), which is what keeps a cue that
        // arrives late from starting over a retry; if something else has been asked for since (the next fight's theme), that request is not ours to stop.
        if (audio.requestedMusic === cue.cue) audio.stopMusic(DEFEAT_OUT_S);
      } catch {
        /* audio is optional; never take a screen down for it */
      }
    },
  };
}
