/**
 * Start one sound on the effects bus: a whole buffer, or one slice of a sprite, through a gain and a panner to the dry bus and
 * the shared hall send. Shared by `AudioManager.playSfx` (every effect) and `AudioManager.playParityOnly` (the flow sounds:
 * the encounter's opening and the results tally, `sfxV2/flowSlots.ts`); the nodes, connections and parameters are exactly what
 * `playSfx` always built. The nodes release themselves when the source ends.
 *
 * A source can loop inside its slice (the results tally's bed, which plays until the numbers land) and be stopped with a short
 * fade. Game case: both; no game logic lives here.
 */

import type { SpriteSlice } from './SfxSprites.ts';

/** A sound that is playing (a looped bed, a long sample): the owner can end it. */
export interface ParityVoice {
  /** Fade out over `fade` seconds (default 0.15) and release the nodes. */
  stop(fade?: number): void;
}

/** Where an effect goes: straight to the effects bus, and a send into the hall. */
export interface SfxOutputs {
  dry: AudioNode;
  send: AudioNode | null;
}

export interface SfxVoiceParams {
  /** -1 left .. 1 right. */
  pan?: number;
  /** Playback-rate multiplier. */
  pitch?: number;
  /**
   * Motion sounds (`sfxV2/motionCues.ts`): play only the first `trimMs` of the slice, in output time (after `pitch`). Absent: the whole slice, as every cue always played.
   * A trimmed cue should also name a `fadeMs`, or its cut can click.
   */
  trimMs?: number;
  /** Motion sounds: fade the sound to silence over its last `fadeMs` (of the slice, or of the trim). Absent: no fade. A looped source is never faded. */
  fadeMs?: number;
  /** The audio pass (`audio/pass/`): start this many ms into the slice (its own leading silence, or a layer's chosen part), in slice time. Absent: from its first sample, as every cue always played. */
  skipMs?: number;
}

/** A sound's length in output seconds, and the part of the buffer it plays (seconds of buffer), after a trim and the playback rate. */
export function shapedLength(sliceSeconds: number, rate: number, trimMs: number | undefined): { out: number; buffer: number } {
  const r = rate > 0 ? rate : 1;
  const natural = sliceSeconds / r;
  const out = typeof trimMs === 'number' && trimMs > 0 ? Math.min(natural, trimMs / 1000) : natural;
  return { out, buffer: out * r };
}

/**
 * Wall-clock slack past a cue's own length before a source that has not ended is cut, ms (r63-play, the overnight fix of the skeptic's m5; both games). The skeptic found, in 2 of 12 runs, sources of a 244 s sprite, a
 * 40 s pack and a 2.1 s voice buffer still "live" 60 to 375 s after cues of 0.3 to 3.6 s: the context's clock had stopped, so `ended` never came and nothing ever released them. A source that outlives its cue by
 * this much while the context says it is running is stopped and its nodes let go; while the context is suspended (the pause) the check waits.
 */
export const SOURCE_SLACK_MS = 1500;

/**
 * Cut `source` if it has not ended `lengthS` (its length in output seconds, from its start `delayS` from now) plus {@link SOURCE_SLACK_MS} after it began. Returns the disposer `ended` calls. A looped source is
 * not watched (its owner stops it).
 */
export function watchSourceEnd(ctx: Pick<AudioContext, 'state'>, source: Pick<AudioScheduledSourceNode, 'stop' | 'disconnect'>, release: () => void, lengthS: number, delayS = 0): () => void {
  if (typeof setTimeout !== 'function' || !Number.isFinite(lengthS)) return () => undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const check = (): void => {
    if (ctx.state !== 'running') {
      timer = setTimeout(check, SOURCE_SLACK_MS); // paused or not yet unlocked: the cue has not really been playing, look again later
      return;
    }
    try {
      source.stop();
    } catch {
      /* never started, or already stopped */
    }
    release();
  };
  timer = setTimeout(check, Math.max(0, (lengthS + delayS) * 1000) + SOURCE_SLACK_MS);
  return () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
}

export function startSfxSource(
  ctx: AudioContext,
  outputs: SfxOutputs,
  buffer: AudioBuffer,
  slice: SpriteSlice | null,
  level: number,
  params: SfxVoiceParams,
  delay: number,
  loop: boolean,
): ParityVoice {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const rate = params.pitch ?? 1;
  source.playbackRate.value = rate;
  const gain = ctx.createGain();
  gain.gain.value = level;
  const panner = ctx.createStereoPanner();
  panner.pan.value = Math.max(-1, Math.min(1, params.pan ?? 0));
  source.connect(gain);
  gain.connect(panner);
  // Dry to the bus, and a send into the shared hall so effects sit in the
  // same room the music was mixed in.
  panner.connect(outputs.dry);
  if (outputs.send) panner.connect(outputs.send);
  const when = ctx.currentTime + delay;
  if (loop && slice) {
    source.loop = true;
    source.loopStart = slice.cue.offset;
    source.loopEnd = slice.cue.offset + slice.cue.duration;
  }
  // The pass's skip: begin `skipMs` into the slice, and count the trim and the fade from there.
  const skip = !loop && slice && typeof params.skipMs === 'number' && params.skipMs > 0 ? Math.min(params.skipMs / 1000, Math.max(0, slice.cue.duration - 0.005)) : 0;
  const shaped = !loop && (params.trimMs !== undefined || params.fadeMs !== undefined) ? shapedLength(slice ? slice.cue.duration - skip : buffer.duration, rate, params.trimMs) : null;
  if (shaped && typeof params.fadeMs === 'number' && params.fadeMs > 0) {
    const fade = Math.min(params.fadeMs / 1000, shaped.out);
    gain.gain.setValueAtTime(level, when + shaped.out - fade);
    gain.gain.linearRampToValueAtTime(0, when + shaped.out);
  }
  if (slice) source.start(when, slice.cue.offset + skip, loop ? undefined : (shaped?.buffer ?? slice.cue.duration - skip));
  else if (shaped) source.start(when, 0, shaped.buffer); // the synthesised stand-in (the sprite has not decoded): the same shaping
  else source.start(when);
  const release = (): void => {
    try {
      source.disconnect();
      gain.disconnect();
      panner.disconnect();
    } catch {
      /* already let go */
    }
  };
  const cueS = shaped ? shaped.out : slice ? (slice.cue.duration - skip) / (rate > 0 ? rate : 1) : buffer.duration / (rate > 0 ? rate : 1);
  const unwatch = loop ? () => undefined : watchSourceEnd(ctx, source, release, cueS, delay);
  source.onended = () => {
    unwatch();
    release();
  };
  return {
    stop: (fade = 0.15) => {
      const now = ctx.currentTime;
      const ramp = Math.max(0.01, fade);
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + ramp);
        source.stop(now + ramp + 0.02);
        watchSourceEnd(ctx, source, release, ramp + 0.02); // the stop's own end, in case the clock never gets there
      } catch {
        /* already ended */
      }
    },
  };
}
