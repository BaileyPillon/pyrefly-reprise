/**
 * What a sampled instrument preset is.
 *
 * A preset is PLAIN DATA — no samples, no Node APIs, no DSP. It says which
 * patch of which sample library to play and how to shape it; the offline
 * renderer in `tools/audio/` reads these files, loads the libraries from
 * D:/Tools/audio-libs and builds the actual voices.
 *
 * That split is deliberate. An arranger who wants the horns a touch darker,
 * or a new "bass clarinet" instrument, edits one of the small files next to
 * this one. Nobody has to open the sampler, the SoundFont reader or the mix.
 *
 * Nothing here ships to the browser as audio: the game loads the rendered
 * MP3s listed in `public/audio/manifest.json`, and falls back to the
 * synthesised voices in `../` when a cue has not been rendered.
 */

/** The sample libraries the renderer knows how to find. See docs/audio/CREDITS.md. */
export type SampleLib = 'salamander' | 'sonatina' | 'fluidr3';

/** One patch inside one library. Give bank+program, or a name fragment, or both. */
export interface PresetSource {
  lib: SampleLib;
  /** SoundFont bank (0 = melodic, 128 = percussion kits). */
  bank?: number;
  /** SoundFont program number within the bank. */
  program?: number;
  /** Case-insensitive name match, used when bank/program miss. */
  name?: string;
  /** Linear gain for this layer alone, before the preset's own `gain`. */
  gain?: number;
  /** Extra pan for this layer, -1..1, added to the library's own panning. */
  pan?: number;
  /** Detune in cents — a few cents across two layers thickens a section. */
  tuneCents?: number;
  /** Semitone transpose applied before sample lookup (octave fixes). */
  transpose?: number;
}

/**
 * Percussion mapping. A drum patch is keyed by the GM percussion note, not by
 * the pitch the score wrote, so these say which note to trigger.
 */
export interface DrumMap {
  /** GM percussion note this instrument always triggers. */
  key: number;
  /**
   * Score pitch that means "play the sample untransposed". Omit for a truly
   * fixed-pitch hit (a hi-hat); set it for a tuned drum (taiko, tom) so the
   * score's pitches still bend the sample.
   */
  pitchRef?: number;
  /** How far the score's pitch bends a tuned drum, 0..1. Default 1. */
  pitchFollow?: number;
  /** Swap to this note for notes at least `longSec` long (closed vs open hat). */
  longKey?: number;
  longSec?: number;
}

/** Amp-style post-processing, for the electric guitars. */
export interface AmpFx {
  /** tanh drive amount; 1 is clean, 6 is a cranked stack. */
  drive: number;
  /** Speaker-cabinet roll-off in Hz (a 4x12 dies around 5 kHz). */
  cabinetHz?: number;
  /** High-pass to clear the mud below the cabinet, in Hz. */
  bodyHz?: number;
  /** Dry/processed blend, 0..1. Default 1 (fully processed). */
  mix?: number;
}

export interface VoicePreset {
  /**
   * The instrument name a score's channel uses. Every name already used by
   * `src/audio/tracks/` must appear exactly once across the preset files;
   * new names here are free for arrangers to use straight away.
   */
  name: string;
  /** One line for the docs table and the render report. */
  about: string;
  /** Which seat in the hall (see seating.ts) — drives pan and reverb send. */
  seat: string;
  /** One or more library patches, stacked. Two layers make a section. */
  layers: PresetSource[];

  /** Overall linear gain for the finished voice. Default 1. */
  gain?: number;
  /** Pan offset applied on top of the seat, -1..1. */
  pan?: number;
  /** Global detune in cents. */
  tuneCents?: number;

  /**
   * How hard velocity drives loudness. 1 is linear and sounds like a volume
   * slider; 1.4 (the default) is roughly how a real player's dynamics read.
   */
  velocityCurve?: number;
  /**
   * Soft notes get darker as well as quieter. Set false for a library that
   * already ships proper velocity layers (Salamander's piano, for one).
   */
  velocityTilt?: boolean;

  /** Extra attack in seconds — a slow bow or a breathy entry. */
  attackSec?: number;
  /** Release tail in seconds past note-off. This is what makes legato legato. */
  releaseSec?: number;
  /** Minimum tail rendered past the note, in seconds. Default 0.6. */
  tailSec?: number;

  /**
   * Deterministic per-note start jitter, in milliseconds. A string section is
   * never perfectly together; without a few ms here a section reads as one
   * sampler trigger, which is the most machine-like thing a mock-up can do.
   */
  timingJitterMs?: number;

  /** Percussion note mapping, for drum-kit patches. */
  drum?: DrumMap;
  /** Amp-style post-processing. */
  amp?: AmpFx;

  /**
   * Honest note when the sampled result is a stand-in rather than the real
   * article (no library we ship has a true spiccato or a solo soprano).
   * Surfaced by `npm run audio:render -- --list`.
   */
  caveat?: string;
}

export type PresetGroup = Record<string, VoicePreset>;
