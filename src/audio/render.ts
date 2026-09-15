/**
 * The offline sequencer: Track (plain note data) → stereo Float32 samples.
 *
 * Identical in Node and in the browser. The browser path runs this inside a Web
 * Worker at load time and copies the result into an AudioBuffer; the Node path
 * writes it to a WAV. Nothing here touches Web Audio or the DOM.
 */

import { foldTail, makeStereo, mixStereoInto, normalizeStereo, peakOfStereo } from './dsp/buffer.ts';
import type { Stereo } from './dsp/buffer.ts';
import { hashSeed } from './dsp/oscillators.ts';
import { Reverb } from './dsp/reverb.ts';
import { applyDelayStereo } from './dsp/delay.ts';
import { applySoftClip, panGains } from './dsp/shaper.ts';
import { getInstrument } from './instruments.ts';
import { midiToFreq, toMidi } from './score.ts';
import type { Track } from './score.ts';

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

export interface RenderOptions {
  /** Peak the master is normalised to. Keep below 0.95. */
  targetPeak?: number;
  /** Gentle master saturation before the final normalise. Default true. */
  saturate?: boolean;
  /** Reuse identical note renders. Default true; turn off to measure cost. */
  cache?: boolean;
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
  const hasReverb = track.channels.some((c) => (c.fx?.reverb ?? 0) > 0);
  const hasDelay = track.channels.some((c) => (c.fx?.delay ?? 0) > 0) && !!track.fx?.delay;
  const reverbBus = hasReverb ? makeStereo(totalSamples) : null;
  const delayBus = hasDelay ? makeStereo(totalSamples) : null;

  const cache = new Map<string, Stereo>();
  let noteCount = 0;

  for (let ci = 0; ci < track.channels.length; ci++) {
    const channel = track.channels[ci]!;
    const voice = getInstrument(channel.instrument);
    const volume = channel.volume ?? 1;
    const pan = panGains(channel.pan ?? 0);
    const transpose = channel.transpose ?? 0;
    const reverbSend = channel.fx?.reverb ?? 0;
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
    const wet = new Reverb(sampleRate, track.fx?.reverb ?? { room: 0.78, damp: 0.35, width: 0.9 }).render(
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

  if (options.saturate ?? true) {
    normalizeStereo(dry, 0.6);
    applySoftClip(dry, 1);
  }
  normalizeStereo(dry, targetPeak);

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
