/**
 * SFX parity, phase 2: where a recorded original's own timing puts its START, so that its PEAK sits on the animation
 * beat (`docs/handoff/sfx-parity.md`, spec 5.1 item 6).
 *
 * A parity cue carries `onsetMs` (first sample to first audible sample) and `peakMs` (first sample to the loudest
 * moment) in the manifest. The presenter knows how far ahead of its beat it asks for a sound: the swing is asked for at
 * the action's start and the strike lands about a quarter of a second later. The mixer therefore starts the cue
 * `beatMs - peakMs` after the ask, never before it: a sound whose swell is longer than the wait starts at once and
 * its peak lands late by the difference, which is the honest limit of asking for it when the beat is this near.
 *
 * With no recorded original there is nothing to align: the shipped v2 and first-bank cues are asked for exactly where
 * they always were, and a cue with no `peakMs` and no `onsetMs` (a pack written before phase 2) starts on the ask.
 * Nothing in this module runs unless a parity pack supplied the sound, so with `sfxParity.packs` empty the mixer's
 * timing is untouched.
 *
 * Pure: no DOM, no Web Audio. Game case: both (the same rule for either game; each game's packs carry their own
 * measured `peakMs`).
 */

/** The timing fields of a parity cue (`SfxCue.onsetMs`, `SfxCue.peakMs`). */
export interface CueTiming {
  onsetMs?: number | undefined;
  peakMs?: number | undefined;
}

/** The longest lead the mixer will honour, ms: a beat further out than this is a presenter mistake, not a beat. */
export const MAX_BEAT_MS = 1500;

/**
 * Ms from the cue's first sample to the moment that belongs on the beat: its peak, else (a cue measured only for
 * its onset) its first audible sample; `null` for a cue with no timing at all (a pack written before phase 2).
 */
export function leadMs(cue: CueTiming): number | null {
  const peak = cue.peakMs;
  if (typeof peak === 'number' && Number.isFinite(peak) && peak >= 0) return peak;
  const onset = cue.onsetMs;
  if (typeof onset === 'number' && Number.isFinite(onset) && onset >= 0) return onset;
  return null;
}

/**
 * Seconds to wait before starting `cue` so that its peak lands `beatMs` after now. 0 when no beat is ahead
 * (`undefined`, 0, negative or not a number: the cue starts on the ask, which is where phase 1 always put it) and for
 * a cue with no measured timing (nothing says where its peak is, so it is not moved).
 */
export function beatDelaySeconds(cue: CueTiming, beatMs: number | undefined): number {
  if (typeof beatMs !== 'number' || !Number.isFinite(beatMs) || beatMs <= 0) return 0;
  const lead = leadMs(cue);
  if (lead === null) return 0;
  return Math.max(0, Math.min(beatMs, MAX_BEAT_MS) - lead) / 1000;
}

/**
 * How late the cue's peak lands against the beat, ms: 0 when it lands on it, the shortfall when the swell is longer
 * than the wait (it starts at once and its peak comes `lead - beat` after the beat). With no beat ahead the beat is
 * now, so the peak lands `lead` late. `null` for a cue with no measured timing.
 */
export function peakLateMs(cue: CueTiming, beatMs: number | undefined): number | null {
  const lead = leadMs(cue);
  if (lead === null) return null;
  const ahead = typeof beatMs === 'number' && Number.isFinite(beatMs) && beatMs > 0 ? Math.min(beatMs, MAX_BEAT_MS) : 0;
  return Math.max(0, lead - ahead);
}
