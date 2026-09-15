/**
 * Freeverb-lite: eight damped comb filters into four allpass filters per
 * channel (Schroeder topology). Cheap enough to run over a whole 90 second
 * track offline in well under a second, and it is what gives the title piano
 * and the boss choir their room.
 */

import { makeStereo } from './buffer.ts';
import type { Stereo } from './buffer.ts';

export interface ReverbOptions {
  /** 0..1, bigger = longer tail. */
  room?: number;
  /** 0..1, bigger = darker tail. */
  damp?: number;
  /** 0..1 stereo spread of the wet signal. */
  width?: number;
  /** Wet gain applied to the output (the input is assumed to be a send bus). */
  wet?: number;
  /** Seconds of pre-delay before the tail starts. */
  preDelay?: number;
}

const COMB_TUNING = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
const ALLPASS_TUNING = [556, 441, 341, 225];
const STEREO_SPREAD = 23;

class Comb {
  private buffer: Float32Array;
  private index = 0;
  private store = 0;
  private feedback: number;
  private damp: number;

  constructor(size: number, feedback: number, damp: number) {
    this.buffer = new Float32Array(Math.max(1, size));
    this.feedback = feedback;
    this.damp = damp;
  }

  process(x: number): number {
    const out = this.buffer[this.index]!;
    this.store = out * (1 - this.damp) + this.store * this.damp;
    this.buffer[this.index] = x + this.store * this.feedback;
    this.index = (this.index + 1) % this.buffer.length;
    return out;
  }
}

class Allpass {
  private buffer: Float32Array;
  private index = 0;

  constructor(size: number) {
    this.buffer = new Float32Array(Math.max(1, size));
  }

  process(x: number): number {
    const bufout = this.buffer[this.index]!;
    const out = -x + bufout;
    this.buffer[this.index] = x + bufout * 0.5;
    this.index = (this.index + 1) % this.buffer.length;
    return out;
  }
}

class ReverbChannel {
  private combs: Comb[];
  private allpasses: Allpass[];

  constructor(sampleRate: number, offset: number, feedback: number, damp: number) {
    const scale = sampleRate / 44100;
    this.combs = COMB_TUNING.map((t) => new Comb(Math.round((t + offset) * scale), feedback, damp));
    this.allpasses = ALLPASS_TUNING.map((t) => new Allpass(Math.round((t + offset) * scale)));
  }

  process(x: number): number {
    let out = 0;
    for (const comb of this.combs) out += comb.process(x);
    out *= 0.22;
    for (const ap of this.allpasses) out = ap.process(out);
    return out;
  }
}

export class Reverb {
  private left: ReverbChannel;
  private right: ReverbChannel;
  private width: number;
  private wet: number;
  private preDelaySamples: number;

  constructor(sampleRate: number, options: ReverbOptions = {}) {
    const room = Math.min(0.98, Math.max(0, options.room ?? 0.75));
    const damp = Math.min(0.95, Math.max(0, options.damp ?? 0.4));
    const feedback = 0.7 + room * 0.28;
    this.left = new ReverbChannel(sampleRate, 0, feedback, damp);
    this.right = new ReverbChannel(sampleRate, STEREO_SPREAD, feedback, damp);
    this.width = Math.min(1, Math.max(0, options.width ?? 0.9));
    this.wet = options.wet ?? 1;
    this.preDelaySamples = Math.max(0, Math.round((options.preDelay ?? 0.012) * sampleRate));
  }

  /**
   * Render the wet signal for a stereo send bus into a fresh buffer of the same
   * length. The caller mixes it back into the dry mix.
   */
  render(input: Stereo): Stereo {
    const n = input.left.length;
    const out = makeStereo(n);
    const pre = this.preDelaySamples;
    const wet1 = this.wet * (this.width * 0.5 + 0.5);
    const wet2 = this.wet * ((1 - this.width) * 0.5);
    for (let i = 0; i < n; i++) {
      const src = i - pre;
      const inL = src >= 0 ? input.left[src]! : 0;
      const inR = src >= 0 ? input.right[src]! : 0;
      const mono = (inL + inR) * 0.5;
      const l = this.left.process(mono);
      const r = this.right.process(mono);
      out.left[i] = l * wet1 + r * wet2;
      out.right[i] = r * wet1 + l * wet2;
    }
    return out;
  }
}

/** One-shot helper: wet-only reverb render of a send bus. */
export function reverbStereo(input: Stereo, sampleRate: number, options: ReverbOptions = {}): Stereo {
  return new Reverb(sampleRate, options).render(input);
}
