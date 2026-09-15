/**
 * Float32 buffer helpers shared by every audio module.
 *
 * Everything here is deterministic and allocation-explicit: the same inputs
 * produce bit-identical outputs in Node and in the browser, which is what lets
 * `tools/render-track.mjs` preview exactly what the game will play.
 */

export interface Stereo {
  left: Float32Array;
  right: Float32Array;
}

export function makeStereo(length: number): Stereo {
  return { left: new Float32Array(length), right: new Float32Array(length) };
}

/** Wrap a mono buffer as a stereo pair without copying (both channels alias). */
export function monoToStereo(mono: Float32Array): Stereo {
  return { left: mono, right: Float32Array.from(mono) };
}

/** dst[offset + i] += src[i] * gain, clipped to the bounds of both buffers. */
export function mixInto(dst: Float32Array, src: Float32Array, offset: number, gain: number): void {
  if (gain === 0) return;
  const from = Math.max(0, -offset);
  const count = Math.min(src.length - from, dst.length - offset - from);
  for (let i = 0; i < count; i++) {
    dst[offset + from + i]! += src[from + i]! * gain;
  }
}

export function mixStereoInto(
  dst: Stereo,
  src: Stereo,
  offset: number,
  gainL: number,
  gainR: number,
): void {
  mixInto(dst.left, src.left, offset, gainL);
  mixInto(dst.right, src.right, offset, gainR);
}

export function scaleStereo(buf: Stereo, gain: number): void {
  if (gain === 1) return;
  for (let i = 0; i < buf.left.length; i++) {
    buf.left[i]! *= gain;
    buf.right[i]! *= gain;
  }
}

export function peakOf(buf: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = Math.abs(buf[i]!);
    if (v > peak) peak = v;
  }
  return peak;
}

export function peakOfStereo(buf: Stereo): number {
  return Math.max(peakOf(buf.left), peakOf(buf.right));
}

export function rmsOf(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i]! * buf[i]!;
  return Math.sqrt(sum / Math.max(1, buf.length));
}

/**
 * Normalise so the loudest sample sits at `target`. Only ever attenuates when
 * `allowBoost` is false, so quiet stems stay quiet relative to each other.
 * Returns the gain that was applied.
 */
export function normalizeStereo(buf: Stereo, target: number, allowBoost = true): number {
  const peak = peakOfStereo(buf);
  if (peak === 0) return 1;
  let gain = target / peak;
  if (!allowBoost && gain > 1) gain = 1;
  scaleStereo(buf, gain);
  return gain;
}

/**
 * Fold everything that rings out past `loopEnd` back into the loop region so a
 * looping player hears the reverb/delay tail of the last bar over the first bar.
 * This is what makes a synthesised loop seamless instead of chopping the tail.
 */
export function foldTail(buf: Stereo, loopStart: number, loopEnd: number): void {
  const loopLength = loopEnd - loopStart;
  if (loopLength <= 0 || loopEnd >= buf.left.length) return;
  for (let i = loopEnd; i < buf.left.length; i++) {
    const dst = loopStart + ((i - loopEnd) % loopLength);
    buf.left[dst]! += buf.left[i]!;
    buf.right[dst]! += buf.right[i]!;
  }
}

export function fadeIn(buf: Float32Array, samples: number): void {
  const n = Math.min(samples, buf.length);
  for (let i = 0; i < n; i++) buf[i]! *= i / n;
}

export function fadeOut(buf: Float32Array, samples: number): void {
  const n = Math.min(samples, buf.length);
  const start = buf.length - n;
  for (let i = 0; i < n; i++) buf[start + i]! *= 1 - i / n;
}

/** True when every sample is a finite number (used by tests and the tool). */
export function isFinitePcm(buf: Float32Array): boolean {
  for (let i = 0; i < buf.length; i++) {
    if (!Number.isFinite(buf[i]!)) return false;
  }
  return true;
}
