/** Feedback delay line with a damping one-pole in the feedback path. */

import { OnePole } from './filter.ts';
import type { Stereo } from './buffer.ts';

export interface DelayOptions {
  /** Delay time in seconds. */
  time: number;
  /** 0..0.95 — how much of the output is fed back in. */
  feedback?: number;
  /** Low-pass cutoff applied to each repeat, Hz (0 = off). */
  damp?: number;
}

export class FeedbackDelay {
  private buffer: Float32Array;
  private index = 0;
  private feedback: number;
  private damper: OnePole;

  constructor(sampleRate: number, options: DelayOptions) {
    const samples = Math.max(1, Math.round(options.time * sampleRate));
    this.buffer = new Float32Array(samples);
    this.feedback = Math.min(0.95, Math.max(0, options.feedback ?? 0.35));
    this.damper = new OnePole(0);
    if (options.damp && options.damp > 0) this.damper.setCutoff(options.damp, sampleRate);
  }

  /** Returns the delayed sample and writes input + damped feedback back in. */
  process(x: number): number {
    const out = this.buffer[this.index]!;
    const fed = this.damper.process(out) * this.feedback;
    this.buffer[this.index] = x + fed;
    this.index = (this.index + 1) % this.buffer.length;
    return out;
  }
}

/**
 * Process a stereo bus in place with a ping-pong-ish pair of delays (the right
 * channel runs slightly longer, which widens repeats without a chorus).
 */
export function applyDelayStereo(buf: Stereo, sampleRate: number, options: DelayOptions): void {
  const left = new FeedbackDelay(sampleRate, options);
  const right = new FeedbackDelay(sampleRate, { ...options, time: options.time * 1.5 });
  for (let i = 0; i < buf.left.length; i++) {
    buf.left[i] = left.process(buf.left[i]!);
    buf.right[i] = right.process(buf.right[i]!);
  }
}

/** Fixed short delay used for chorus/ensemble widening (no feedback). */
export class ModDelay {
  private buffer: Float32Array;
  private write = 0;
  private sampleRate: number;

  constructor(sampleRate: number, maxSeconds: number) {
    this.sampleRate = sampleRate;
    this.buffer = new Float32Array(Math.max(2, Math.ceil(maxSeconds * sampleRate) + 2));
  }

  /** Write one sample and read back `delaySeconds` ago with linear interpolation. */
  process(x: number, delaySeconds: number): number {
    this.buffer[this.write] = x;
    const d = Math.min(this.buffer.length - 2, Math.max(1, delaySeconds * this.sampleRate));
    let readPos = this.write - d;
    while (readPos < 0) readPos += this.buffer.length;
    const i0 = Math.floor(readPos);
    const frac = readPos - i0;
    const a = this.buffer[i0 % this.buffer.length]!;
    const b = this.buffer[(i0 + 1) % this.buffer.length]!;
    this.write = (this.write + 1) % this.buffer.length;
    return a + (b - a) * frac;
  }
}
