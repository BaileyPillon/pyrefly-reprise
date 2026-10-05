/**
 * Sizing of the supersampled scene target (release 39; pure, no three). The scene is drawn `scale` times wider and taller than the
 * drawing buffer; what the GPU can hold bounds the scale, so a 5K window never asks for a 100-megapixel half-float target.
 */

/** The most pixels the supersampled target may hold: about 36 megapixels (a 4K frame at 2x is 33 of them, 265 MB as half floats). */
export const MAX_SUPERSAMPLED_PIXELS = 36e6;

/** Under this scale a supersample is not worth its cost (a 1.04x resolve of an 8K frame): the frame is drawn plain and the ladder's A2 rung stands in. */
export const MIN_USEFUL_SCALE = 1.25;

/**
 * The scale really drawn: the one asked for, held to the GPU's largest texture edge and to {@link MAX_SUPERSAMPLED_PIXELS}, never below 1.
 * `outW` x `outH` is the drawing buffer the resolve fills.
 */
export function supersampleScale(want: number, outW: number, outH: number, maxTexture: number, maxPixels = MAX_SUPERSAMPLED_PIXELS): number {
  const w = Math.max(1, outW);
  const h = Math.max(1, outH);
  const byTexture = maxTexture / Math.max(w, h);
  const byPixels = Math.sqrt(maxPixels / (w * h));
  return Math.max(1, Math.min(Number.isFinite(want) ? want : 1, byTexture, byPixels));
}

/** {@link supersampleScale}, or exactly 1 when what the GPU and the pixel budget leave is under {@link MIN_USEFUL_SCALE}. */
export function usableSupersample(want: number, outW: number, outH: number, maxTexture: number, maxPixels = MAX_SUPERSAMPLED_PIXELS): number {
  const s = supersampleScale(want, outW, outH, maxTexture, maxPixels);
  return s >= MIN_USEFUL_SCALE ? s : 1;
}
