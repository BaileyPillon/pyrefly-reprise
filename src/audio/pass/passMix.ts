/**
 * THE AUDIO PASS MIX (conference demo sound pass, 2026-10-22; decision 184). Each number is read off a measurement (the run recordings in `measure/`, the tools in `tools/audio/`); nothing was listened to
 * (AGENTS.md rule 13), and Bailey overturns any of them by ear on `docs/audio/audition.html`.
 *
 *  - **Makeup.** A Chapter I fight read, at the master after the limiter, -18.6 LUFS integrated with a short-term median of -19.2 and a 90th percentile of -16.9 (a Chapter IV fight is in
 *    `measure/`). The pass lifts the master by {@link MAKEUP_DB} before the limiter, which puts the short-term median at -15.6 and the 90th percentile at -13.3 with the true peak under -1 dBTP. The limiter
 *    (threshold -2 dBFS, 20:1, 3 ms) was already the ceiling: the loudest 100 ms of a fight sits at -2.0 dBFS.
 *  - **Voice over music.** A voice line must sit well over the music beneath it in the speech band, not only by K-weighted loudness (the boss loops carry 62 percent of their energy under 250 Hz, which
 *    K-weighting discounts and the ear does not mask with). The measure is the band's TRUE mean-square (300 to 3400 Hz, Parseval over the whole line and the whole slice of music it landed on; the first
 *    figures, a Hann-windowed FFT divided by N squared, favoured a tonal voice over noise-like music by about 6 dB: audio-pass review minor 5), with every line of the recorded Chapter I fight at the track
 *    position it fell on. At today's 3.5 dB duck the quietest lines are -2.9 dB (the Yuna Talk line over a loud passage of `boss-seymour`) and -2.4 dB (Tidus's victory quip over the `victory-ffx` fanfare):
 *    below the music. At -9 dB they were +2.6 and +3.1, and four lines were under +6. The criterion is that EVERY line of the fight reads at least +6 dB over the music beneath it in the speech band
 *    (the usual rule of thumb for speech in noise), in every recording of the fight: the track position a line falls on moves a little from run to run (the quip over the fanfare read 2.4 to 3.1 dB at -9 dB in two
 *    recordings), so {@link VOICE_DUCK_DB} leaves a dB over it. The pause menu's own duck is -9.1 dB.
 *  - **Attract reel.** Music at the same share as in a fight, and the whole mix {@link ATTRACT_TRIM_DB} down on the master, so the reel's balance of music to hits is a fight's (it was effects-forward:
 *    the music 8 dB down and the effects at full level).
 *
 * Pure constants; no DOM, no Web Audio.
 */

/** Master makeup the pass adds before the limiter, dB. */
export const MAKEUP_DB = 4;

/** The music's gain while a voice line sounds, dB (today: -3.5; the pass's first pick was -9, which left two lines under +3.2 dB in the speech band: see above). */
export const VOICE_DUCK_DB = -14;
export const VOICE_DUCK_GAIN = 10 ** (VOICE_DUCK_DB / 20);

/** The attract reel's whole-mix trim, dB, and the music's share of its usual volume (today: 0.4). */
export const ATTRACT_TRIM_DB = -6;
export const ATTRACT_MUSIC_SHARE = 1;

/** dB taken off every landing of a multi-hit spell after its first (Fire lands five times, 0.23 s apart, on 1.64 s samples that pile up). */
export const SPELL_STACK_DB = -3;

/**
 * The master's safety ceiling while the pass's makeup is on, dBFS (applied as a soft saturation, 4x oversampled so it bounds the true peak, after the limiter), and where it starts to bend, dBFS.
 * Measured: the master limiter (a DynamicsCompressor, threshold -2) let a fight with +3.5 dB of makeup reach -0.1 dBFS on the Fire stacks; lowering its threshold did not help because the node
 * adds make-up gain of its own (the fight got 1.1 LU LOUDER). The shaper leaves everything under {@link SAFETY_KNEE_DB} alone and bends what the limiter missed to under the ceiling.
 */
export const SAFETY_CEILING_DB = -1.5;
export const SAFETY_KNEE_DB = -3;

/** The shaper's curve over the input range -1..1: linear to the knee, then tanh toward the ceiling. */
export function safetyCurve(points = 2049): Float32Array<ArrayBuffer> {
  const a = 10 ** (SAFETY_KNEE_DB / 20);
  const c = 10 ** (SAFETY_CEILING_DB / 20);
  const out = new Float32Array(points);
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * 2 - 1;
    const m = Math.abs(x);
    out[i] = m <= a ? x : Math.sign(x) * (a + (c - a) * Math.tanh((m - a) / (c - a)));
  }
  return out;
}

/** The short-term loudness window the fight is held to, LUFS, and the true-peak ceiling, dBTP. */
export const FIGHT_SHORT_TERM_LUFS = { low: -16, high: -14 } as const;
export const TRUE_PEAK_CEILING_DBTP = -1;

/** Linear gain of a dB value. */
export const dbToGain = (d: number): number => 10 ** (d / 20);
