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
