/**
 * Types for `tools/gen/black-frame.mjs`, so the unit tests (TypeScript, and
 * type-checked by `tsc --noEmit`) can import the guard's decision functions
 * directly instead of shelling out to node.
 *
 * Same arrangement as `manifest.d.mts`. This file declares the module's whole
 * public surface — if you add an export over there, add it here too.
 */

/** Minimum gap between two black-frame ComfyUI restarts, in ms (10 minutes). */
export declare const BLACK_RESTART_MIN_INTERVAL_MS: number;

/**
 * True only when the largest RGB sample in the render is exactly 0 — the
 * signature of a NaN'd GPU. `null`/`undefined` (undecodable) is not black.
 */
export declare function isBlackFrame(maxRgb: number | null | undefined): boolean;

/** Parse the restart sentinel (epoch seconds, or ms) into epoch ms, or null. */
export declare function parseRestartSentinel(text: string | null | undefined): number | null;

/** Whether a ComfyUI restart is allowed now, given the last one's timestamp. */
export declare function shouldRestartAfterBlack(
  nowMs: number,
  lastRestartMs: number | null | undefined,
  minIntervalMs?: number,
): boolean;

/**
 * Largest R/G/B sample in an 8-bit non-interlaced PNG; null when the bytes
 * cannot be read as one. Alpha is ignored.
 */
export declare function maxRgbOfPng(buf: Uint8Array | null | undefined): number | null;

/**
 * Pick the decoder whose answer the guard acts on: the embedded python's, else
 * the built-in decoder's (evaluated lazily), else none — an unverified render.
 */
export declare function resolveMaxRgb(
  pythonMax: number | null | undefined,
  fallback: (() => number | null | undefined) | number | null | undefined,
): { maxRgb: number | null; source: 'python' | 'fallback' | 'none' };

/**
 * Where ComfyUI's own copy of a black render sits, and where to move it.
 * `null` means "do not touch anything" (no filename, not an output image, or a
 * path that would escape `outputDir`).
 */
export declare function quarantineTargetFor(
  image: { filename?: string; subfolder?: string; type?: string } | null | undefined,
  opts: { outputDir: string; quarantineDir: string; stamp?: string },
): { from: string; to: string } | null;

/** `2026-09-18T13:35:01.123Z` -> `20260918T133501Z`, for quarantine filenames. */
export declare function fileStamp(when?: Date | number | string): string;
