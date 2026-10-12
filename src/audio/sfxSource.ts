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
  source.playbackRate.value = params.pitch ?? 1;
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
  if (slice) source.start(when, slice.cue.offset, loop ? undefined : slice.cue.duration);
  else source.start(when);
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
    panner.disconnect();
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
      } catch {
        /* already ended */
      }
    },
  };
}
