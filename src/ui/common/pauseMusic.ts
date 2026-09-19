/**
 * The `pause` cue, and getting back to whatever it interrupted.
 *
 * `pause` is one of the twenty-one cues in `docs/audio/THEMES.md` — row 3,
 * "The game holding its breath", and by the same document one of the two cues
 * a player hears most. Critic round 02 #02 found it composed, rendered,
 * shipped in `public/audio/manifest.json` and **named by nothing in `src/`**:
 * opening the pause menu left the boss theme running at full volume behind it.
 *
 * It lives here rather than in `PauseScreen.ts` for two reasons: the pause menu
 * is pushed from several screens and each of them already owns an `onPause`
 * hook, and only the screen underneath knows what has to come back when the
 * menu closes. This module simply remembers that for them.
 *
 * Deliberately tolerant: a pause must never fail because a cue is missing or
 * the audio context is not running yet.
 */

/** The slice of `AudioManager` this needs. Structural, so a test can fake it. */
export interface PauseMusicPort {
  readonly currentMusic: string | null;
  playMusic(name: string, options?: { fade?: number }): Promise<void> | unknown;
}

/** The cue key, as `src/audio/tracks/pause.ts` composes it. */
export const PAUSE_CUE = 'pause';

/** Short, because the menu is already on screen by the time this is heard. */
const INTO_PAUSE_FADE = 0.45;
/** Slightly longer coming back, so the fight resumes under you rather than at you. */
const OUT_OF_PAUSE_FADE = 0.7;

/**
 * What was playing when the menu went up, per screen.
 *
 * A `WeakMap` keyed on the caller's own audio port rather than a module-level
 * variable, so two screens (a battle and the cutscene behind a skip) can never
 * hand each other the wrong cue to return to.
 */
const resumeTo = new WeakMap<PauseMusicPort, string | null>();

/**
 * Swap to the `pause` cue, or back to whatever was playing before it.
 *
 * Calling it twice with the same value is a no-op: `playMusic` already
 * short-circuits when the requested cue is the one playing, and the remembered
 * cue is only captured on the transition into the pause.
 */
export function setPauseMusic(audio: PauseMusicPort, paused: boolean): void {
  try {
    if (paused) {
      const playing = audio.currentMusic;
      if (playing === PAUSE_CUE) return;
      resumeTo.set(audio, playing);
      // Spelt out rather than passed as `PAUSE_CUE` so the cue-reachability
      // test's literal scan can see it (`tests/unit/audio-cue-reachability.test.ts`).
      void Promise.resolve(audio.playMusic('pause', { fade: INTO_PAUSE_FADE })).catch(() => {
        /* a missing cue costs the hush, never the menu */
      });
      return;
    }
    const previous = resumeTo.get(audio);
    resumeTo.delete(audio);
    if (!previous || previous === PAUSE_CUE) return;
    void Promise.resolve(audio.playMusic(previous, { fade: OUT_OF_PAUSE_FADE })).catch(() => {
      /* same */
    });
  } catch {
    /* audio is optional; never take a screen down for it */
  }
}
