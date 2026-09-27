/**
 * The secret door to the hidden FF7 experiment (Guard Scorpion).
 *
 * Bailey approved option A on 2026-09-27 ("also the secret door to guard
 * scorpion i really like your ideas there i will go with it";
 * `docs/plans/ff7-guard-scorpion-architecture.md` §2.2):
 *
 * - **Keyboard:** on chapter select, type L-I-M-I-T, at most {@link KEY_GAP_MS}
 *   between letters. A wrong letter or a pause resets silently.
 * - **Phone or mouse:** tap the small "Chapter select" label
 *   {@link TAP_COUNT} times within {@link TAP_WINDOW_MS}.
 * - **Gamepad:** L1 R1 L1 R1 Select, at most {@link PAD_GAP_MS} between presses.
 *
 * None of these keys or buttons moves the board's cursor or starts a chapter:
 * the board ignores `select`, `l1` and `r1`, and the letters L, I and T are
 * bound to no button at all (`app/Input.ts`, `KEY_MAP`; M is `select`).
 *
 * Pure: no DOM, no timers, time comes in as an argument, so every rule has a
 * unit test (`tests/unit/ff7-secret-door.test.ts`). `ChapterSelectScreen`
 * feeds it and decides what "open" does.
 *
 * Game case: FF7 only (the door leads to the FF7 experiment; the board itself is unchanged).
 */

/** What a feed returns: `'open'` once a whole sequence lands, otherwise `null`. */
export type DoorResult = 'open' | null;

/** The word, as lower-case letters (`KeyboardEvent.key`, so any keyboard layout types it). */
export const DOOR_WORD = 'limit';

/** Longest pause between two letters, ms ("at most ~2 s between letters", plan §2.2). */
export const KEY_GAP_MS = 2000;

/** Taps on the label that open the door. */
export const TAP_COUNT = 7;

/** The window the taps must fall in, ms ("seven times within ~4 s"). */
export const TAP_WINDOW_MS = 4000;

/** The gamepad sequence, as `app/Input.ts` button names. */
export const PAD_SEQUENCE: readonly string[] = ['l1', 'r1', 'l1', 'r1', 'select'];

/** Longest pause between two pad presses, ms (the same allowance as the letters). */
export const PAD_GAP_MS = 2000;

/** Progress through one ordered sequence with a gap limit. */
class SequenceMatcher {
  private index = 0;
  private lastAt = -Infinity;

  constructor(
    private readonly sequence: readonly string[],
    private readonly gapMs: number,
  ) {}

  feed(token: string, atMs: number): DoorResult {
    if (this.index > 0 && atMs - this.lastAt > this.gapMs) this.index = 0;
    if (token === this.sequence[this.index]) {
      this.index += 1;
    } else {
      // A wrong token resets, but may itself start the sequence again ("LLIMIT").
      this.index = token === this.sequence[0] ? 1 : 0;
    }
    this.lastAt = atMs;
    if (this.index < this.sequence.length) return null;
    this.index = 0;
    return 'open';
  }

  reset(): void {
    this.index = 0;
  }
}

/** One board visit's door. Make a new one each time the board is entered. */
export class SecretDoor {
  private readonly word = new SequenceMatcher(DOOR_WORD.split(''), KEY_GAP_MS);
  private readonly pad = new SequenceMatcher(PAD_SEQUENCE, PAD_GAP_MS);
  private taps: number[] = [];

  /**
   * A key went down. `key` is `KeyboardEvent.key`. Keys that are not a single
   * character (Shift, CapsLock, the arrows, F-keys) are ignored outright, so
   * typing the word in capitals works; any other character resets the word.
   */
  feedKey(key: string, atMs: number): DoorResult {
    if (key.length !== 1) return null;
    return this.word.feed(key.toLowerCase(), atMs);
  }

  /** A pad (or mapped keyboard) button went down, as an `app/Input.ts` button name. */
  feedButton(button: string, atMs: number): DoorResult {
    return this.pad.feed(button, atMs);
  }

  /** A tap or click on the label. */
  feedTap(atMs: number): DoorResult {
    this.taps = this.taps.filter((t) => atMs - t <= TAP_WINDOW_MS);
    this.taps.push(atMs);
    if (this.taps.length < TAP_COUNT) return null;
    this.taps = [];
    return 'open';
  }

  /** Forget every partial sequence. */
  reset(): void {
    this.word.reset();
    this.pad.reset();
    this.taps = [];
  }
}
