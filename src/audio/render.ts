/**
 * The offline sequencer: Track (plain note data) → stereo Float32 samples.
 *
 * Identical in Node and in the browser. The browser path runs this inside a Web
 * Worker at load time and copies the result into an AudioBuffer; the Node path
 * writes it to a WAV. Nothing here touches Web Audio or the DOM.
 */

import {
  crossfadeLoopSeam,
  foldTail,
  makeStereo,
  mixStereoInto,
  normalizeStereo,
  peakOfStereo,
} from './dsp/buffer.ts';
import type { Stereo } from './dsp/buffer.ts';
import { hashSeed } from './dsp/oscillators.ts';
import { Reverb } from './dsp/reverb.ts';
import { applyDelayStereo } from './dsp/delay.ts';
import { applySoftClip, panGains } from './dsp/shaper.ts';
import { getInstrument } from './instruments.ts';
import type { Voice } from './instruments.ts';
import { midiToFreq, toMidi } from './score.ts';
import type { Channel, Track } from './score.ts';

export interface RenderedTrack {
  name: string;
  sampleRate: number;
  left: Float32Array;
  right: Float32Array;
  /** Loop points in samples; feed straight into AudioBufferSourceNode. */
  loopStartSample: number;
  loopEndSample: number;
  durationSec: number;
  loopDurationSec: number;
  /** Peak sample magnitude after mastering (always < 0.95). */
  peak: number;
  noteCount: number;
  renderMs: number;
}

/** What the offline renderer may override for one channel (see `spatialise`). */
export interface ChannelPlacement {
  /** Replaces the channel's own pan. */
  pan?: number;
  /** Replaces the channel's reverb send. */
  reverb?: number;
  /** Multiplies the channel's volume. */
  volumeScale?: number;
}

export interface RenderOptions {
  /** Peak the master is normalised to. Keep below 0.95. */
  targetPeak?: number;
  /** Gentle master saturation before the final normalise. Default true. */
  saturate?: boolean;
  /** Reuse identical note renders. Default true; turn off to measure cost. */
  cache?: boolean;
  /**
   * Resolve an instrument name to a voice. Defaults to the synthesised
   * registry in `instruments.ts`; the offline renderer passes sampled voices
   * here instead, which is the whole of how a cue becomes orchestral without
   * a single note of the score changing.
   */
  voiceFor?: (instrument: string) => Voice;
  /**
   * Override a channel's pan, reverb send and level — used offline to seat the
   * players on a platform instead of wherever the composer happened to pan them.
   */
  spatialise?: (channel: Channel, index: number) => ChannelPlacement | undefined;
  /**
   * Render the reverb send bus. Defaults to the built-in Freeverb; the offline
   * renderer passes a convolution hall.
   */
  reverbRender?: (bus: Stereo, sampleRate: number) => Stereo;
  /**
   * Final master stage, replacing the built-in saturate-and-normalise. Runs
   * after the loop tail is folded, so a limiter here sees the real programme.
   */
  master?: (mix: Stereo, sampleRate: number) => void;
}

const DEFAULT_TARGET_PEAK = 0.89;

function quantise(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Render one track. `sampleRate` of 22050 halves render time and file size and
 * is plenty for previews; the game uses the AudioContext's own rate.
 */
export function renderTrack(track: Track, sampleRate = 44100, options: RenderOptions = {}): RenderedTrack {
  const startedAt = Date.now();
  const targetPeak = options.targetPeak ?? DEFAULT_TARGET_PEAK;
  const useCache = options.cache ?? true;
  const secondsPerBeat = 60 / track.bpm;
  const tailSec = track.tailSec ?? 3;
  const totalSamples = Math.ceil((track.length * secondsPerBeat + tailSec) * sampleRate);

  const dry = makeStereo(totalSamples);
  // `spatialise` can add a send to a channel the composer left dry, so when the
  // offline renderer is seating the players we always allocate the bus.
  const hasReverb = !!options.spatialise || track.channels.some((c) => (c.fx?.reverb ?? 0) > 0);
  const hasDelay = track.channels.some((c) => (c.fx?.delay ?? 0) > 0) && !!track.fx?.delay;
  const reverbBus = hasReverb ? makeStereo(totalSamples) : null;
  const delayBus = hasDelay ? makeStereo(totalSamples) : null;

  const cache = new Map<string, Stereo>();
  let noteCount = 0;

  const resolveVoice = options.voiceFor ?? getInstrument;

  for (let ci = 0; ci < track.channels.length; ci++) {
    const channel = track.channels[ci]!;
    const voice = resolveVoice(channel.instrument);
    const placement = options.spatialise?.(channel, ci);
    const volume = (channel.volume ?? 1) * (placement?.volumeScale ?? 1);
    const pan = panGains(placement?.pan ?? channel.pan ?? 0);
    const transpose = channel.transpose ?? 0;
    const reverbSend = placement?.reverb ?? channel.fx?.reverb ?? 0;
    const delaySend = channel.fx?.delay ?? 0;
    for (const note of channel.notes) {
      const startBeat = note[0];
      const durBeats = note[1];
      if (durBeats <= 0) continue;
      const midi = toMidi(note[2]) + transpose;
      const velocity = Math.min(1, Math.max(0.01, quantise(note[3] ?? 0.8, 1 / 64)));
      const durSec = quantise(durBeats * secondsPerBeat, 0.005);
      const offset = Math.round(startBeat * secondsPerBeat * sampleRate);
      if (offset >= totalSamples) continue;
      const key = `${channel.instrument}|${midi}|${durSec.toFixed(3)}|${velocity.toFixed(3)}`;
      let rendered = useCache ? cache.get(key) : undefined;
      if (!rendered) {
        rendered = voice({
          sampleRate,
          freq: midiToFreq(midi),
          dur: durSec,
          velocity,
          seed: hashSeed(key),
        });
        if (useCache) cache.set(key, rendered);
      }
      noteCount++;
      mixStereoInto(dry, rendered, offset, volume * pan.left, volume * pan.right);
      if (reverbBus && reverbSend > 0) {
        mixStereoInto(reverbBus, rendered, offset, volume * reverbSend * pan.left, volume * reverbSend * pan.right);
      }
      if (delayBus && delaySend > 0) {
        mixStereoInto(delayBus, rendered, offset, volume * delaySend * pan.left, volume * delaySend * pan.right);
      }
    }
  }

  if (delayBus && track.fx?.delay) {
    const delay = track.fx.delay;
    applyDelayStereo(delayBus, sampleRate, {
      time: delay.timeBeats * secondsPerBeat,
      feedback: delay.feedback ?? 0.34,
      damp: delay.damp ?? 3200,
    });
    mixStereoInto(dry, delayBus, 0, 1, 1);
  }

  if (reverbBus) {
    const wet = options.reverbRender
      ? options.reverbRender(reverbBus, sampleRate)
      : new Reverb(sampleRate, track.fx?.reverb ?? { room: 0.78, damp: 0.35, width: 0.9 }).render(
          reverbBus,
        );
    mixStereoInto(dry, wet, 0, 1, 1);
  }

  const loopStartSample = Math.round(track.loop.start * secondsPerBeat * sampleRate);
  const loopEndSample = Math.min(
    totalSamples,
    Math.round(track.loop.end * secondsPerBeat * sampleRate),
  );
  foldTail(dry, loopStartSample, loopEndSample);

  if (track.gain && track.gain !== 1) {
    for (let i = 0; i < totalSamples; i++) {
      dry.left[i] = dry.left[i]! * track.gain;
      dry.right[i] = dry.right[i]! * track.gain;
    }
  }

  if (options.master) {
    // The offline path masters with a real bus compressor and limiter, and
    // normalises to a loudness target rather than to a peak.
    options.master(dry, sampleRate);
  } else {
    if (options.saturate ?? true) {
      normalizeStereo(dry, 0.6);
      applySoftClip(dry, 1);
    }
    normalizeStereo(dry, targetPeak);
  }

  // Last, deliberately. The seam has to be joined on the samples that actually
  // ship: a compressor or limiter ahead of it applies a different gain either
  // side of the wrap and would re-open the step this closes. ~18 ms is long
  // enough to bridge it and short enough that the duplicated run-up reads as a
  // transition rather than as repeated music.
  crossfadeLoopSeam(dry, loopStartSample, loopEndSample, Math.round(0.018 * sampleRate));

  return {
    name: track.name,
    sampleRate,
    left: dry.left,
    right: dry.right,
    loopStartSample,
    loopEndSample,
    durationSec: totalSamples / sampleRate,
    loopDurationSec: (loopEndSample - loopStartSample) / sampleRate,
    peak: peakOfStereo(dry),
    noteCount,
    renderMs: Date.now() - startedAt,
  };
}

/** Render a bare Note list with one instrument — used by tests and SFX previews. */
export function renderNotes(
  instrument: string,
  notes: Track['channels'][number]['notes'],
  bpm: number,
  lengthBeats: number,
  sampleRate = 44100,
): RenderedTrack {
  return renderTrack(
    {
      name: `${instrument}-preview`,
      bpm,
      timeSig: [4, 4],
      loop: { start: 0, end: lengthBeats },
      length: lengthBeats,
      channels: [{ instrument, notes }],
      tailSec: 1.5,
    },
    sampleRate,
  );
}
