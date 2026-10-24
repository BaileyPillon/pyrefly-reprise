/**
 * The MOTION SOUNDS (motion program, lane "feel", step 2; Bailey, 2026-10-22: "Subtle synced sounds": a whoosh on a lunge and on a smear, a landing thud matched to the squash,
 * a cloth rustle on a cast, "from the existing sound library", mixed under the music). Which cue of the shipped sprites stands in for each beat, and how it is shaped.
 *
 * Nothing here is new audio: each entry names a cue that already ships (`public/audio/manifest.json`) and shapes it with the mixer's own parameters (`PlaySfxOptions`: `pitch`,
 * `volume`, and the `trimMs` / `fadeMs` this step added to `sfxSource.ts`: a cue cut short must fade, or the cut clicks). The choice was made from what the cues are, measured
 * (`D:/Tools/pyrefly-scratch/2026-10-22/motion/feel/sfx/analysis.txt`: duration, attack, spectral centroid and flatness per slice), because an agent cannot hear (AGENTS.md rule 13):
 *
 * | beat | cue (first bank) | why it is the closest the library has |
 * |---|---|---|
 * | `lunge` | `whiff` | the library's own description of it is "cloth and air" (`sfx/weapons.ts` `about`; written, not heard, by us): band-passed noise (flatness 0.06 to 0.15, centroid 1.7 to 3.8 kHz) swelling over 20 to 60 ms and fading by 280 ms. Played 20 percent lower (a deeper pitch: the guess is that lower reads as heavier; nobody on the team has heard it, so that is Bailey's call by ear). |
 * | `dash` | `whiff` | the same air, 28 percent lower and longer: the FFX-2 run-in (0.32 to 0.47 s). |
 * | `smear` | `whiff` | the same air, 45 percent higher and cut to 130 ms: a quick zip on the cut, not a second whoosh. |
 * | `land` | `footstep` | "one boot on stone": a 110 Hz thump that is 20 dB down by 45 ms (the whole 338 ms slice is thump plus grit; trimmed to 110 ms). |
 * | `cast` | `steal-success` | the library's own description of the steal is "a quick grab of cloth and a bright little jingle" (`sfx/support.ts` `about`); measured, its first 105 ms are a soft noise burst (centroid 2.7 to 4.2 kHz, 28 to 39 dB under the jingle that follows at 120 ms); trimmed before the jingle. |
 *
 * Game case (AGENTS.md rule 14): **both, one neutral set.** The library does not separate these sounds by game: the only game-tagged families it has are the weapon swings (`sfxV2/cues.ts`:
 * FFX's sword, katana, spear..., FFX-2's gun, daggers, greatsword), which already play on the attack, and the `-x2` twins of the spells (`magic-charge-x2`), which already play on the cast; a
 * body's whoosh, thud and cloth are neither. `research/*.md` and `ffx-vs-ffx2-presentation.md` describe no motion sound for either game (searched: whoosh, thud, rustle, footstep, cloth,
 * foley), so no per-game difference is sourced. The two games therefore share every number; {@link MOTION_GAME_OVERRIDES} is where a per-game choice would go (empty today), and the
 * question is listed in `docs/handoff/motion-feel.md`.
 *
 * Levels (every number `[ours]`): chosen so each cue sits well under the hit sounds and inside the music, measured at the game's mix (SFX bus 0.7 x master 0.9) with ffmpeg EBU R128 and
 * peak (`motion/feel/sfx/render-cues.mjs`; the table below repeats the result). The hits at their play volume (0.8) have a momentary loudness of -20 to -23 LUFS and peaks of -7 to -14 dBFS; the
 * music's loudest 43 ms is -14 to -15 dBFS and its average -22. Pure: no DOM, no Web Audio.
 */

import { V2_CUES } from './cues.ts';

export type MotionBeatKind = 'lunge' | 'dash' | 'smear' | 'land' | 'cast';

export interface MotionCue {
  /** The key the mixer is asked for: a first-bank cue (`whiff`, `footstep`), or a `v2:` name. */
  key: string;
  /** Playback-rate multiplier (`PlaySfxOptions.pitch`). */
  pitch: number;
  /** The call's volume, before the bus (`PlaySfxOptions.volume`). */
  volume: number;
  /** Play only this much of the cue, ms of output (`PlaySfxOptions.trimMs`). */
  trimMs: number;
  /** Fade to silence over the last of it, ms (`PlaySfxOptions.fadeMs`). */
  fadeMs: number;
  /** ms from the cue's first sample to its loudest moment, at this pitch: the planner starts it that much before the beat it belongs on (measured on the slice). */
  peakMs: number;
  /** Which game's set the cue belongs to (rule 14): `both` = neutral. The planner never plays a cue of the other game. */
  game: 'ffx' | 'ffx2' | 'both';
}

/**
 * Measured at the game's mix (SFX bus 0.7 x master 0.9, dry) with the volumes below at strength 1 and heft 0, per beat: sample peak in dBFS and EBU momentary max in LUFS (400 ms
 * window, so a 100 ms cue reads low). The references at the same mix: hit-sword at 0.8 peaks -7.1 and reads -20.1 (loudest 43 ms -14.8); the FFX-2 greatsword hit -11.6 and
 * -19.9; the boss themes' loudest 43 ms is -14.3 and -15.0, their average -22.5 and -21.7. A boss's lunge peaks -12.8 and its landing -14.2.
 */
export const MOTION_MEASURED: Readonly<Record<MotionBeatKind, { peakDb: number; momentaryLufs: number }>> = {
  lunge: { peakDb: -13.3, momentaryLufs: -28.9 },
  dash: { peakDb: -14.1, momentaryLufs: -29 },
  smear: { peakDb: -17.2, momentaryLufs: -34.7 },
  land: { peakDb: -15.2, momentaryLufs: -32.6 },
  cast: { peakDb: -19.5, momentaryLufs: -36.3 },
};

/** The neutral set (both games). Volumes are the measured ones above; they are the base the planner scales by strength and heft. */
export const MOTION_CUES: Readonly<Record<MotionBeatKind, MotionCue>> = {
  lunge: { key: 'whiff', pitch: 0.8, volume: 0.42, trimMs: 360, fadeMs: 120, peakMs: 80, game: 'both' },
  dash: { key: 'whiff', pitch: 0.72, volume: 0.4, trimMs: 440, fadeMs: 160, peakMs: 90, game: 'both' },
  smear: { key: 'whiff', pitch: 1.45, volume: 0.28, trimMs: 130, fadeMs: 55, peakMs: 45, game: 'both' },
  land: { key: 'footstep', pitch: 1, volume: 0.33, trimMs: 110, fadeMs: 50, peakMs: 5, game: 'both' },
  cast: { key: 'steal-success', pitch: 1, volume: 1.5, trimMs: 105, fadeMs: 40, peakMs: 45, game: 'both' },
};

/** Where a per-game choice goes (rule 14): a partial cue per game and beat. Empty: the sources are silent, so both games take the neutral set. */
export const MOTION_GAME_OVERRIDES: Readonly<Record<'ffx' | 'ffx2', Partial<Record<MotionBeatKind, Partial<MotionCue>>>>> = { ffx: {}, ffx2: {} };

/** May `game` play this cue (rule 14)? Not when the cue is marked for the other game, nor when it is a v2 cue the set tags for the other game. */
export function cueAllowedFor(cue: MotionCue, game: 'ffx' | 'ffx2'): boolean {
  if (cue.game !== 'both' && cue.game !== game) return false;
  if (cue.key.startsWith('v2:')) {
    const tag = V2_CUES[cue.key.slice(3)]?.game;
    if (tag !== undefined && tag !== 'both' && tag !== game) return false;
  }
  return true;
}

/** The cue a game plays for a beat: the neutral cue with the game's override on top. `null` when the cue belongs to the other game. */
export function motionCue(kind: MotionBeatKind, game: 'ffx' | 'ffx2'): MotionCue | null {
  const cue: MotionCue = { ...MOTION_CUES[kind], ...MOTION_GAME_OVERRIDES[game][kind] };
  return cueAllowedFor(cue, game) ? cue : null;
}

/** Every beat, in the order the audition page lists them. */
export const MOTION_BEATS: readonly MotionBeatKind[] = ['lunge', 'dash', 'smear', 'land', 'cast'];
