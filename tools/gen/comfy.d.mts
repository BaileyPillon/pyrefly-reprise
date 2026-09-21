/**
 * Types for `tools/gen/comfy.mjs` — PARTIAL, unlike `black-frame.d.mts` and
 * `pose-phrases.d.mts`'s "whole public surface" convention.
 *
 * `comfy.mjs` is a ~2000-line CLI with dozens of exports (workflow builders,
 * facing/composition tables, the ComfyUI HTTP client...) that has never
 * needed a declaration file because nothing imported it from TypeScript.
 * `tests/unit/art-prompt-lint.test.ts` is the first to do that, for the
 * 2026-09-21 pose-prompt lint — so this file declares exactly that surface
 * (plus the two existing prompt builders the test asserts against) rather
 * than the whole module. If a later test needs another export, add it here
 * rather than reaching for `any`.
 */

export interface LintStrippedEntry {
  field: 'tags' | 'poseTags';
  segment: string;
  token: string;
  reason: 'effect' | 'background';
  replacedWith?: string;
}

export interface LintSpritePromptResult {
  tags: string;
  poseTags: string;
  stripped: LintStrippedEntry[];
}

export declare const EFFECTS_BANNED_TOKENS: readonly string[];
export declare const EFFECTS_NEGATIVE: string;
export declare const SPRITE_NEGATIVE: string;
export declare const LINTED_COMPOSITIONS: readonly string[];

export declare function lintSpritePrompt(opts?: {
  tags?: string;
  poseTags?: string;
  composition?: string;
}): LintSpritePromptResult;

export declare function buildCharacterPrompt(opts: {
  tags: string;
  poseTags: string;
  composition?: string;
  facing?: string;
  facingPhrase?: string | null;
  emphasis?: string | null;
}): string;

export declare function buildBackdropPrompt(opts: { tags: string }): string;

// --------------------------------------------------------------------------
// 2026-09-21 art-quality-pilot: reference defaults, the monochrome-reference
// guard, and the candidate-staging rule. tests/unit/art-ref-defaults.test.ts
// is what needs these.
// --------------------------------------------------------------------------

export declare const REF_WEIGHT_DEFAULT: number;
export declare const REF_START_DEFAULT: number;
export declare const REF_END_DEFAULT: number;
export declare const REF_WEIGHT_TYPE_DEFAULT: string;

export declare const MONOCHROME_HUE_BUCKETS: number;
export declare const MONOCHROME_VALUE_BANDS: number;
export declare const MONOCHROME_GRAY_BANDS: number;
export declare const MONOCHROME_GRAY_SAT_MAX: number;
export declare const MONOCHROME_TOP2_SHARE_MIN: number;
export declare const MONOCHROME_MIN_OPAQUE_PIXELS: number;

export interface DecodedPixels {
  width: number;
  height: number;
  alpha: Uint8Array;
  rgb: Uint8Array;
}

export declare function colorBucketCounts(pixels: DecodedPixels): {
  counts: Map<string, number>;
  opaque: number;
};

export interface ReferenceMonochromeResult {
  opaque: number;
  dominantShare: number;
  top2Share: number;
  monochrome: boolean;
}

export declare function evaluateReferenceMonochrome(
  pixels: DecodedPixels,
  opts?: { top2ShareMin?: number },
): ReferenceMonochromeResult;

export interface ReferenceOptionsResult {
  width: number;
  height: number;
  refImage?: string;
  refWeight: number;
  refWeightType: string;
  refScaling: string;
  refStart: number;
  refEnd: number;
  initImage?: string;
  denoise: number;
  provenance: Record<string, unknown>;
}

export declare function referenceOptions(
  args: Record<string, unknown>,
  opts: { defaultWidth: number; defaultHeight: number },
): Promise<ReferenceOptionsResult>;

export declare function isUnderPublicArt(absPath: string): boolean;

export declare function resolveCandidateOutPath(
  outPath: string,
  opts: { name: string; pose: string; candidateDirArg?: unknown; install: boolean },
): { outPath: string; redirected: boolean };

export declare function rawPathFor(outPath: string): string;
