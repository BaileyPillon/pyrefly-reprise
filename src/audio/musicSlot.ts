/**
 * The music slot's one rule: a single track, and a crossfade that ends with the old source
 * stopped (hotfix-music-overlap, 2026-09-29).
 *
 * `AudioManager` used to fade a superseded track out from `gain.value`. Until the audio thread
 * has rendered a node, Chrome reports that value as the param's default, 1.0, and a context that
 * is not running (created without user activation: a pad press the browser does not count, a
 * first touch on iOS) never renders at all. So a cue replaced before it was ever heard was
 * re-armed at full volume, and on a context that started late every cue requested meanwhile
 * (the title, then the chapter-select waltz, then the chapter's own) sounded together at the
 * first audible moment. The level is therefore tracked here from the ramps this module itself
 * schedules, never read back from the param.
 *
 * Game case: both (shared audio routing; CHK-020).
 */

export interface MusicSlot {
  name: string;
  source: AudioBufferSourceNode;
  gain: GainNode;
  /** The exponential ramp last scheduled on `gain`: `from` at `t0` to `to` at `t1` (context seconds). */
  ramp: { from: number; to: number; t0: number; t1: number };
}

/** Below this a slot has not been heard (or no longer is): it is cut rather than faded. */
const INAUDIBLE = 0.001;
/** How quickly an already-fading slot is cleared when a third cue arrives. */
const CUT = 0.06;

/** The slot's gain at context time `now`, from its own schedule. */
export function slotLevel(slot: Pick<MusicSlot, 'ramp'>, now: number): number {
  const { from, to, t0, t1 } = slot.ramp;
  if (now <= t0) return from;
  if (now >= t1 || t1 <= t0) return to;
  return from * Math.pow(to / from, (now - t0) / (t1 - t0));
}

/** A new slot: silent at `now`, at `volume` after `fade` seconds. */
export function startSlotRamp(gain: GainNode, now: number, fade: number, volume: number): MusicSlot['ramp'] {
  const to = Math.max(0.0001, volume);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(to, now + fade);
  return { from: 0.0001, to, t0: now, t1: now + fade };
}

function stopAt(slot: MusicSlot, when: number): void {
  try {
    slot.source.stop(when);
  } catch {
    /* already stopped: an older browser refuses a second stop() */
  }
}

/**
 * Take `slot` out of the music slot. On a running context a slot that is being heard fades out
 * over `fade` from the level it is actually at, and its source is stopped when the fade ends.
 * A slot that was never heard (the context is not running, or it was replaced before its fade-in
 * got anywhere) is stopped now: there is nothing to fade, and fading it would first make it heard.
 */
export function retireSlot(ctx: BaseAudioContext, slot: MusicSlot, fade: number): void {
  const now = ctx.currentTime;
  const level = slotLevel(slot, now);
  const param = slot.gain.gain;
  param.cancelScheduledValues(now);
  if (ctx.state !== 'running' || level <= INAUDIBLE) {
    param.setValueAtTime(0.0001, now);
    slot.ramp = { from: 0.0001, to: 0.0001, t0: now, t1: now };
    stopAt(slot, now);
    return;
  }
  const f = Number.isFinite(fade) && fade > 0 ? fade : 0.01;
  param.setValueAtTime(level, now);
  param.exponentialRampToValueAtTime(0.0001, now + f);
  slot.ramp = { from: level, to: 0.0001, t0: now, t1: now + f };
  stopAt(slot, now + f + 0.05);
}

/** Clear slots already fading out, quickly, so a third cue never makes three tracks at once. */
export function cutFading(ctx: BaseAudioContext, fading: readonly MusicSlot[]): void {
  for (const slot of fading) retireSlot(ctx, slot, Math.min(CUT, Math.max(0.01, slot.ramp.t1 - ctx.currentTime)));
}
