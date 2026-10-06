/**
 * The arithmetic of a staged texture upload (release 39.1, "r391-stalls"; both games, shared plumbing, no game content).
 *
 * A master is uploaded to the GPU in row bands, a few megabytes a frame, so no frame carries more than a band (`TextureStager.ts`). Measured on the RTX 5070 Ti
 * (headless Chromium, ANGLE/D3D11): a 256-row band of a 4096-wide master is 1.3 to 1.7 ms of main thread, and the same master in one call is 21 ms (from an
 * ImageBitmap) or 145 ms (the way Three uploads an `<img>`). Pure: no DOM, no three.js, no clock.
 */

/** Bytes a frame may upload for a background load (a sibling pose, a planned view): about 1.5 ms of main thread at the measured rate. */
export const BAND_BYTES = 4 * 1024 * 1024;
/** Bytes a frame may upload for a master a figure on screen is waiting for. */
export const URGENT_BAND_BYTES = 6 * 1024 * 1024;
/** A frame this long (ms) is already late: upload a quarter of the budget. */
export const LATE_FRAME_MS = 24;
/** A frame this long (ms) is badly late: upload an eighth, so a load still finishes but never piles on. */
export const VERY_LATE_FRAME_MS = 40;
/** An upload call slower than this (ms) means the GPU is busy with something else: the next frames upload a quarter as much. */
export const SLOW_UPLOAD_MS = 6;
/** How many frames the back-off after a slow upload call lasts. */
export const BACKOFF_FRAMES = 8;
/** The fewest and the most rows in one band. */
export const MIN_BAND_ROWS = 16;
export const MAX_BAND_ROWS = 512;

/** Bytes one frame may upload: the budget of the job at the front of the queue, cut when the page is already late. */
export function bandBudget(urgent: boolean, frameMs: number): number {
  const base = urgent ? URGENT_BAND_BYTES : BAND_BYTES;
  if (frameMs > VERY_LATE_FRAME_MS) return Math.floor(base / 8);
  if (frameMs > LATE_FRAME_MS) return Math.floor(base / 4);
  return base;
}

/** How many rows of an RGBA8 texture `width` pixels wide fit in `bytes`, within the band limits. */
export function rowsForBudget(width: number, bytes: number): number {
  const rows = Math.floor(bytes / (Math.max(1, width) * 4));
  return Math.max(MIN_BAND_ROWS, Math.min(MAX_BAND_ROWS, rows));
}

/** The next band of a texture `height` rows tall of which `done` rows are in: its first row and row count, or null when it is complete. */
export function nextBand(done: number, height: number, rows: number): { y: number; rows: number } | null {
  if (done >= height || rows <= 0) return null;
  return { y: done, rows: Math.min(rows, height - done) };
}

/** How many frames a master of `width` x `height` takes at `bytes` a frame (for the plan's logging and the tests). */
export function framesToUpload(width: number, height: number, bytes: number): number {
  const rows = rowsForBudget(width, bytes);
  return Math.ceil(height / rows);
}
