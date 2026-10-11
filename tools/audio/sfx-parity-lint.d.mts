/** Types for `tools/audio/sfx-parity-lint.mjs`. */
export declare const BANNED: RegExp;
/** The banned word a prompt contains, or `null` when it is clean. */
export declare function lintPrompt(text: string): string | null;
