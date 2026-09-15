/**
 * Pure-TypeScript DSP kit.
 *
 * No Web Audio, no DOM: everything is Float32Array maths so the exact same code
 * renders offline WAV previews in Node (`tools/render-track.mjs`) and fills an
 * AudioBuffer in a Web Worker in the browser.
 */

export * from './buffer.ts';
export * from './oscillators.ts';
export * from './envelope.ts';
export * from './filter.ts';
export * from './lfo.ts';
export * from './delay.ts';
export * from './reverb.ts';
export * from './shaper.ts';
