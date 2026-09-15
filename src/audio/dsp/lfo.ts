/** Low frequency oscillators for vibrato, tremolo, PWM and filter wobble. */

import { makeNoise, sineAt, triangleAt, sawAt, squareAt, wrapPhase } from './oscillators.ts';

export type LfoShape = 'sine' | 'tri' | 'saw' | 'square' | 'sh';

export interface LfoOptions {
  shape?: LfoShape;
  /** Cycles per second. */
  rate?: number;
  /** Output is scaled by this (bipolar, so ±depth). */
  depth?: number;
  /** Starting phase 0..1 — set it to keep detuned voices from beating in sync. */
  phase?: number;
  /** Seconds before the LFO reaches full depth (vibrato delay). */
  fadeIn?: number;
  /** Seed for the sample-and-hold shape. */
  seed?: number;
}

export class Lfo {
  shape: LfoShape;
  rate: number;
  depth: number;
  private phase: number;
  private fadeIn: number;
  private time = 0;
  private noise: () => number;
  private held = 0;
  private lastStep = -1;

  constructor(options: LfoOptions = {}) {
    this.shape = options.shape ?? 'sine';
    this.rate = options.rate ?? 5;
    this.depth = options.depth ?? 1;
    this.phase = wrapPhase(options.phase ?? 0);
    this.fadeIn = options.fadeIn ?? 0;
    this.noise = makeNoise(options.seed ?? 1337);
  }

  /** Advance one sample and return the bipolar value scaled by depth. */
  next(sampleRate: number): number {
    const p = this.phase;
    this.phase = wrapPhase(this.phase + this.rate / sampleRate);
    this.time += 1 / sampleRate;
    let v: number;
    if (this.shape === 'sine') v = sineAt(p);
    else if (this.shape === 'tri') v = triangleAt(p);
    else if (this.shape === 'saw') v = sawAt(p);
    else if (this.shape === 'square') v = squareAt(p);
    else {
      const step = Math.floor(p * 4);
      if (step !== this.lastStep) {
        this.lastStep = step;
        this.held = this.noise();
      }
      v = this.held;
    }
    const fade = this.fadeIn > 0 ? Math.min(1, this.time / this.fadeIn) : 1;
    return v * this.depth * fade;
  }
}

/** Convenience: a ready-made vibrato LFO in semitone depth. */
export function vibrato(rateHz: number, semitones: number, delaySec = 0, phase = 0): Lfo {
  return new Lfo({ shape: 'sine', rate: rateHz, depth: semitones, fadeIn: delaySec, phase });
}
