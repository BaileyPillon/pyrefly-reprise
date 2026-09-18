/**
 * A concert hall.
 *
 * The Freeverb in `reverb.ts` is eight combs into four allpasses. It is cheap
 * and it is fine for a send on a synth pad, but on a sustained string section
 * it rings: eight comb filters have eight resonant peaks, and an orchestra
 * holding a chord will find every one of them. That metallic edge is a large
 * part of why the runtime mix reads as "game synth" rather than "room".
 *
 * This is a Jot-style feedback delay network instead: sixteen delay lines with
 * mutually prime lengths, mixed every sample through a Hadamard matrix so
 * energy is spread across all of them rather than recirculating in one. The
 * modal density that gives is high enough that no individual mode is audible.
 * Three more things make it sound like a hall rather than a box:
 *
 *   - early reflections, a separate tap bank in front of the tail, which is
 *     what actually tells a listener how big the room is and where the player
 *     is standing in it;
 *   - frequency-dependent decay — a real hall's top octave dies several times
 *     faster than its low mids, because air and audience absorb it;
 *   - a few samples of slow modulation on each delay line, which breaks up the
 *     standing pattern that otherwise makes a long tail sound frozen.
 *
 * Used twice, from one implementation, so the music and the sound effects are
 * unmistakably in the same space: the offline renderer runs it over the reverb
 * send bus, and the browser runs it over an impulse to build the AudioBuffer
 * for its ConvolverNode. Platform-free — no DOM, no Node.
 */

import { makeStereo } from './buffer.ts';
import type { Stereo } from './buffer.ts';

export interface HallOptions {
  /** Reverberation time in seconds at low frequency. A concert hall is ~2.2. */
  rt60?: number;
  /** How much faster the top octave decays, 1 = not at all, 4 = very absorbent. */
  hfDamping?: number;
  /** Seconds before the first early reflection arrives. Sets apparent distance. */
  preDelay?: number;
  /** 0..1 stereo spread of the tail. */
  width?: number;
  /** Level of the early reflections relative to the tail, 0..1. */
  earlyLevel?: number;
  /** Overall wet gain. */
  wet?: number;
  /** Cut below this frequency so the tail does not muddy the bass, in Hz. */
  lowCutHz?: number;
}

const DEFAULTS: Required<HallOptions> = {
  rt60: 2.2,
  hfDamping: 2.6,
  preDelay: 0.018,
  width: 0.95,
  earlyLevel: 0.5,
  wet: 1,
  lowCutHz: 90,
};

/**
 * Delay-line lengths in samples at 44.1 kHz, all prime and spread over about
 * an octave and a half. Prime lengths mean no two lines share a period, which
 * is what stops the network developing an audible pitch.
 */
const FDN_PRIMES = [
  1123, 1367, 1621, 1901, 2179, 2437, 2707, 2999, 3299, 3593, 3889, 4177, 4493, 4801, 5087, 5399,
];

/**
 * Early reflection pattern for a shoebox hall: time in seconds, gain, and pan.
 * Times are deliberately irregular — an even spacing sounds like a corridor.
 */
const EARLY_TAPS: Array<[time: number, gain: number, pan: number]> = [
  [0.0113, 0.84, -0.62],
  [0.0147, 0.79, 0.58],
  [0.0191, 0.7, -0.34],
  [0.0233, 0.66, 0.41],
  [0.0287, 0.58, 0.73],
  [0.0331, 0.54, -0.78],
  [0.0397, 0.47, 0.12],
  [0.0443, 0.43, -0.21],
  [0.0519, 0.37, 0.66],
  [0.0587, 0.33, -0.55],
  [0.0661, 0.29, 0.28],
  [0.0743, 0.25, -0.44],
  [0.0829, 0.21, 0.83],
  [0.0937, 0.18, -0.87],
  [0.1051, 0.15, 0.36],
  [0.1187, 0.12, -0.31],
  [0.1319, 0.1, 0.55],
  [0.1483, 0.08, -0.6],
];

/** Modulation rates in Hz, one per delay line; irrational-ish so they never align. */
const MOD_RATES = [
  0.61, 0.73, 0.89, 1.03, 0.67, 0.79, 0.97, 1.11, 0.64, 0.83, 1.07, 0.71, 0.93, 1.17, 0.77, 1.01,
];

function panPair(pan: number): { l: number; r: number } {
  const angle = ((Math.max(-1, Math.min(1, pan)) + 1) * Math.PI) / 4;
  return { l: Math.cos(angle), r: Math.sin(angle) };
}

export class Hall {
  private options: Required<HallOptions>;

  private lines: Float32Array[] = [];
  private lineLengths: number[] = [];
  private writePos: number[] = [];
  private feedback: number[] = [];
  private damp: number[] = [];
  private dampState: number[] = [];
  private modPhase: number[] = [];
  private modInc: number[] = [];

  private preBuffer: Float32Array;
  private prePos = 0;
  private preSamples: number;

  private earlyTaps: Array<{ delay: number; gl: number; gr: number }> = [];
  private lowCutState = { l: 0, r: 0 };
  private lowCutCoeff: number;

  constructor(sampleRate: number, options: HallOptions = {}) {
    this.options = { ...DEFAULTS, ...options };
    const scale = sampleRate / 44100;

    const rt60 = Math.max(0.15, this.options.rt60);
    for (let i = 0; i < FDN_PRIMES.length; i++) {
      const length = Math.max(8, Math.round(FDN_PRIMES[i]! * scale));
      // Leave headroom for the modulation to read behind the write head.
      this.lines.push(new Float32Array(length + 8));
      this.lineLengths.push(length);
      this.writePos.push(0);
      // Per-line gain for the wanted RT60: -60 dB after rt60 seconds.
      this.feedback.push(Math.pow(10, (-3 * length) / (rt60 * sampleRate)));
      // Damping: the top octave decays `hfDamping` times faster. Expressed as
      // a one-pole coefficient inside each line's feedback path.
      const hf = Math.max(1, this.options.hfDamping);
      const target = Math.pow(this.feedback[i]!, hf) / Math.max(1e-6, this.feedback[i]!);
      this.damp.push(Math.max(0, Math.min(0.92, 1 - target)));
      this.dampState.push(0);
      this.modPhase.push(i / FDN_PRIMES.length);
      this.modInc.push(MOD_RATES[i]! / sampleRate);
    }

    this.preSamples = Math.max(1, Math.round(this.options.preDelay * sampleRate));
    const maxEarly = EARLY_TAPS[EARLY_TAPS.length - 1]![0];
    this.preBuffer = new Float32Array(this.preSamples + Math.ceil(maxEarly * sampleRate) + 8);
    for (const [time, gain, pan] of EARLY_TAPS) {
      const g = panPair(pan);
      this.earlyTaps.push({
        delay: this.preSamples + Math.round(time * sampleRate),
        gl: gain * g.l,
        gr: gain * g.r,
      });
    }

    this.lowCutCoeff = 1 - Math.exp((-2 * Math.PI * this.options.lowCutHz) / sampleRate);
  }

  /** Read a delay line `back` samples behind its write head, linearly interpolated. */
  private read(i: number, back: number): number {
    const line = this.lines[i]!;
    const size = line.length;
    let pos = this.writePos[i]! - back;
    while (pos < 0) pos += size;
    const base = Math.floor(pos);
    const frac = pos - base;
    const a = line[base % size]!;
    const b = line[(base + 1) % size]!;
    return a + (b - a) * frac;
  }

  /**
   * Render the wet signal for a stereo send bus into a fresh buffer of the
   * same length. The caller mixes it back into the dry mix, exactly like
   * `Reverb.render`, so the two are drop-in interchangeable.
   */
  render(input: Stereo): Stereo {
    const n = input.left.length;
    const out = makeStereo(n);
    const { width, earlyLevel, wet } = this.options;
    const count = this.lines.length;
    const norm = 1 / Math.sqrt(count);
    const buf = new Float64Array(count);
    const preSize = this.preBuffer.length;

    for (let s = 0; s < n; s++) {
      const mono = (input.left[s]! + input.right[s]!) * 0.5;

      // --- early reflections ------------------------------------------------
      this.preBuffer[this.prePos] = mono;
      let earlyL = 0;
      let earlyR = 0;
      for (let t = 0; t < this.earlyTaps.length; t++) {
        const tap = this.earlyTaps[t]!;
        let p = this.prePos - tap.delay;
        while (p < 0) p += preSize;
        const v = this.preBuffer[p]!;
        earlyL += v * tap.gl;
        earlyR += v * tap.gr;
      }
      this.prePos = (this.prePos + 1) % preSize;

      // --- late tail --------------------------------------------------------
      // Read every line, with a couple of samples of slow modulation so the
      // tail breathes instead of freezing into a standing pattern.
      for (let i = 0; i < count; i++) {
        let phase = this.modPhase[i]! + this.modInc[i]!;
        if (phase >= 1) phase -= 1;
        this.modPhase[i] = phase;
        const mod = Math.sin(phase * Math.PI * 2) * 2.2;
        buf[i] = this.read(i, this.lineLengths[i]! + mod);
      }

      let tailL = 0;
      let tailR = 0;
      for (let i = 0; i < count; i++) {
        // Alternating signs decorrelate the two outputs without a second network.
        const v = buf[i]!;
        if ((i & 1) === 0) tailL += v;
        else tailR += v;
        if ((i & 2) === 0) tailR += v * 0.5;
        else tailL += v * 0.5;
      }
      tailL *= norm * 0.6;
      tailR *= norm * 0.6;

      // Hadamard mix: energy from every line into every other line, in n log n
      // adds. This is what gives the network its density.
      hadamard(buf);

      const injection = mono * norm;
      for (let i = 0; i < count; i++) {
        let v = buf[i]! * norm + injection;
        // One-pole low-pass in the feedback path: the high end decays faster.
        const d = this.damp[i]!;
        const state = this.dampState[i]! + (v - this.dampState[i]!) * (1 - d);
        this.dampState[i] = state;
        v = state * this.feedback[i]!;
        const line = this.lines[i]!;
        line[this.writePos[i]!] = v;
        this.writePos[i] = (this.writePos[i]! + 1) % line.length;
      }

      // --- sum, width, low cut ---------------------------------------------
      let l = earlyL * earlyLevel + tailL;
      let r = earlyR * earlyLevel + tailR;
      const mid = (l + r) * 0.5;
      const side = (l - r) * 0.5 * width;
      l = mid + side;
      r = mid - side;
      this.lowCutState.l += (l - this.lowCutState.l) * this.lowCutCoeff;
      this.lowCutState.r += (r - this.lowCutState.r) * this.lowCutCoeff;
      out.left[s] = (l - this.lowCutState.l) * wet;
      out.right[s] = (r - this.lowCutState.r) * wet;
    }
    return out;
  }
}

/** In-place fast Walsh-Hadamard transform. `buf.length` must be a power of two. */
function hadamard(buf: Float64Array): void {
  const n = buf.length;
  for (let step = 1; step < n; step <<= 1) {
    for (let i = 0; i < n; i += step << 1) {
      for (let j = i; j < i + step; j++) {
        const a = buf[j]!;
        const b = buf[j + step]!;
        buf[j] = a + b;
        buf[j + step] = a - b;
      }
    }
  }
}

/**
 * Render the hall's impulse response, for a Web Audio ConvolverNode.
 *
 * The browser uses this so its SFX reverb is the same room the pre-rendered
 * music was mixed in — a sword hit and the strings behind it share a hall,
 * which is most of what "cinematic" means when you take the samples away.
 * Two seconds at 44.1 kHz costs about 700 kB of AudioBuffer and no download.
 */
export function renderHallImpulse(
  sampleRate: number,
  seconds = 2.2,
  options: HallOptions = {},
): Stereo {
  const n = Math.max(2, Math.ceil(seconds * sampleRate));
  const impulse = makeStereo(n);
  impulse.left[0] = 1;
  impulse.right[0] = 1;
  const wet = new Hall(sampleRate, options).render(impulse);
  // Fade the last 15% so the truncated tail does not click.
  const fade = Math.max(1, Math.round(n * 0.15));
  for (let i = 0; i < fade; i++) {
    const k = 1 - i / fade;
    const idx = n - fade + i;
    wet.left[idx]! *= k;
    wet.right[idx]! *= k;
  }
  return wet;
}

export { hadamard };
