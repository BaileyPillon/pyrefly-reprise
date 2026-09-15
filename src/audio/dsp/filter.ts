/**
 * Filters. Two flavours:
 *
 *  - `Biquad` (RBJ cookbook) for fixed-cutoff work: low/high/band pass, peaking.
 *  - `Svf` (Chamberlin state variable) when the cutoff moves every sample,
 *    which is what filter envelopes and wah-ish sweeps need.
 */

export type BiquadKind = 'lowpass' | 'highpass' | 'bandpass' | 'peak' | 'notch';

export class Biquad {
  b0 = 1;
  b1 = 0;
  b2 = 0;
  a1 = 0;
  a2 = 0;
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;

  set(kind: BiquadKind, sampleRate: number, freq: number, q: number, gainDb = 0): this {
    const nyq = sampleRate * 0.5;
    const f = Math.min(Math.max(freq, 10), nyq * 0.98);
    const w0 = (2 * Math.PI * f) / sampleRate;
    const cos = Math.cos(w0);
    const sin = Math.sin(w0);
    const qq = Math.max(0.05, q);
    const alpha = sin / (2 * qq);
    const A = Math.pow(10, gainDb / 40);
    let b0 = 1;
    let b1 = 0;
    let b2 = 0;
    let a0 = 1;
    let a1 = 0;
    let a2 = 0;
    if (kind === 'lowpass') {
      b0 = (1 - cos) / 2;
      b1 = 1 - cos;
      b2 = b0;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
    } else if (kind === 'highpass') {
      b0 = (1 + cos) / 2;
      b1 = -(1 + cos);
      b2 = b0;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
    } else if (kind === 'bandpass') {
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
    } else if (kind === 'notch') {
      b0 = 1;
      b1 = -2 * cos;
      b2 = 1;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
    } else {
      b0 = 1 + alpha * A;
      b1 = -2 * cos;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * cos;
      a2 = 1 - alpha / A;
    }
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
    return this;
  }

  reset(): void {
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
  }

  process(x: number): number {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }

  processBuffer(buf: Float32Array): void {
    for (let i = 0; i < buf.length; i++) buf[i] = this.process(buf[i]!);
  }
}

export function biquad(
  kind: BiquadKind,
  sampleRate: number,
  freq: number,
  q = 0.707,
  gainDb = 0,
): Biquad {
  return new Biquad().set(kind, sampleRate, freq, q, gainDb);
}

/**
 * Chamberlin state variable filter: cheap, stable up to ~sampleRate/6 and happy
 * with per-sample cutoff changes. `process(x)` returns the low-pass output;
 * `bp` / `hp` / `notch` hold the other outputs from the same sample.
 */
export class Svf {
  lp = 0;
  bp = 0;
  hp = 0;
  notch = 0;
  private f = 0.1;
  private q = 1;
  private sampleRate: number;

  constructor(sampleRate: number, cutoff = 1000, resonance = 0.7) {
    this.sampleRate = sampleRate;
    this.setCutoff(cutoff, resonance);
  }

  setCutoff(cutoff: number, resonance = 0.7): void {
    const limit = this.sampleRate / 5.5;
    const fc = Math.min(Math.max(cutoff, 20), limit);
    this.f = 2 * Math.sin((Math.PI * fc) / this.sampleRate);
    // The Chamberlin loop only stays stable while f + damping < 2. At low
    // sample rates (a 22 kHz preview, or an 8 kHz unit test) a bright, resonant
    // setting would otherwise run away to Infinity, so cap the damping here.
    const damping = 1 / Math.max(0.5, resonance);
    this.q = Math.max(0.02, Math.min(damping, 1.9 - this.f));
  }

  process(x: number): number {
    this.lp += this.f * this.bp;
    this.hp = x - this.lp - this.q * this.bp;
    this.bp += this.f * this.hp;
    // Belt and braces: keep any pathological state from turning into NaN.
    if (this.lp > 4) this.lp = 4;
    else if (this.lp < -4) this.lp = -4;
    if (this.bp > 4) this.bp = 4;
    else if (this.bp < -4) this.bp = -4;
    this.notch = this.hp + this.lp;
    return this.lp;
  }
}

/** One-pole low-pass, used for damping inside the reverb and for dull SFX. */
export class OnePole {
  private a = 0.5;
  private z = 0;

  constructor(coefficient = 0.5) {
    this.a = coefficient;
  }

  setCoefficient(a: number): void {
    this.a = Math.min(0.999, Math.max(0, a));
  }

  /** Set by cutoff frequency rather than raw coefficient. */
  setCutoff(cutoff: number, sampleRate: number): void {
    const x = Math.exp((-2 * Math.PI * cutoff) / sampleRate);
    this.a = Math.min(0.999, Math.max(0, x));
  }

  process(x: number): number {
    this.z = x * (1 - this.a) + this.z * this.a;
    return this.z;
  }
}

/** Removes DC offset left behind by asymmetric waveshaping. */
export class DcBlocker {
  private x1 = 0;
  private y1 = 0;

  process(x: number): number {
    const y = x - this.x1 + 0.995 * this.y1;
    this.x1 = x;
    this.y1 = y;
    return y;
  }
}
