/**
 * SFX parity: the originality lint every prompt passes before it is sent (spec 2.1, 5.4).
 *
 * Our sounds are ORIGINALS made from written descriptions (AGENTS.md rule 8; decisions 47k and 52d). A prompt names no
 * game, place, character, composer, or "sounds like"; it describes a sound. This is the one list: the generator's
 * lint and `tests/unit/audio-sfx-parity.test.ts` both use it. Game case: both.
 */

/** Franchise, place, character, composer and "in the style of" words that must never reach a prompt. */
export const BANNED =
  /\b(?:final fantasy|square enix|ffx|ffx-2|ff7|ffvii|spira|yevon|zanarkand|bevelle|gagazet|macalania|ronso|fayths?|blitzball|gullwings|tidus|yunalesca|yuna|auron|wakka|lulu|kimahri|rikku|seymour|jecht|braska|shuyin|trema|paine|leblanc|ormi|shinra|uematsu|hamauzu|bahamut|aeons?|sinspawn|evrae|vegnagun|sounds? like|in the style of|in the manner of|impression of|imitat\w*|clon(?:e|es|ed|ing)|cover of|remix)\b/i;

/** The banned word a prompt contains, or `null` when it is clean. */
export function lintPrompt(text) {
  return BANNED.exec(text)?.[0] ?? null;
}
