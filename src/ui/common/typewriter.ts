/**
 * Pure typewriter-reveal math for `DialogueBox`.
 *
 * Kept free of the DOM so the timing itself is unit-testable
 * (`tests/unit/ui-common-typewriter.test.ts`); `DialogueBox.update(dt)` is the
 * only caller that needs a document.
 */

/** Characters revealed per second at `textSpeed === 1`. Tuned to read like FFX's own crawl. */
export const BASE_CHARS_PER_SECOND = 42;

/** Milliseconds per revealed character at a given `SaveData.settings.textSpeed` multiplier. */
export function msPerChar(textSpeed = 1): number {
  const speed = textSpeed > 0 ? textSpeed : 1;
  return 1000 / (BASE_CHARS_PER_SECOND * speed);
}

/** How many characters of `text` should be visible after `elapsedMs` of typing. */
export function computeRevealCount(text: string, elapsedMs: number, textSpeed = 1): number {
  if (!text.length || elapsedMs <= 0) return 0;
  const count = Math.floor(elapsedMs / msPerChar(textSpeed));
  return Math.min(text.length, Math.max(0, count));
}

/** Whether every character of `text` is visible yet at `elapsedMs`. */
export function isFullyRevealed(text: string, elapsedMs: number, textSpeed = 1): boolean {
  return computeRevealCount(text, elapsedMs, textSpeed) >= text.length;
}

/** Total time to type out all of `text` at a given speed. */
export function typingDurationMs(text: string, textSpeed = 1): number {
  return text.length * msPerChar(textSpeed);
}

/** Reading-speed hold (ms) for a fully-revealed line with no explicit `SayStep.auto`. */
export function autoAdvanceHoldMs(text: string): number {
  const words = text.trim().length ? text.trim().split(/\s+/).length : 0;
  const READING_WPM = 220;
  const ms = (words / READING_WPM) * 60_000;
  return Math.max(900, Math.min(4200, ms));
}
