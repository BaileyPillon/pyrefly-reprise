/**
 * The secret door to the hidden FF7 experiment (Guard Scorpion).
 *
 * Bailey approved option A on 2026-09-27 ("also the secret door to guard
 * scorpion i really like your ideas there i will go with it";
 * `docs/plans/ff7-guard-scorpion-architecture.md` §2.2):
 *
 * - **Keyboard:** on chapter select, type L-I-M-I-T, at most {@link KEY_GAP_MS}
 *   between letters. A wrong letter, a pause or a key the board answers (an
 *   arrow, Enter, Escape) resets silently; Shift for the capitals does not.
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
 * The typed word is {@link WordDoor}, which the hidden experimental Leblanc chapter's
 * door shares (`./leblancDoor.ts`): the two doors behave the same way because they are
 * the same code.
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
export class SequenceMatcher {
  private index = 0;
  private lastAt = -Infinity;
  /** The last token carried a sequence already under way one step on (not its first token, not a restart). False after anything else: a pass, a reset, a wrong token, a late one. */
  continued = false;

  constructor(
    private readonly sequence: readonly string[],
    private readonly gapMs: number,
  ) {}

  feed(token: string, atMs: number): DoorResult {
    if (this.index > 0 && atMs - this.lastAt > this.gapMs) this.index = 0;
    this.continued = this.index > 0 && token === this.sequence[this.index];
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

  /** A key came that is not a token and does not break the sequence (Shift while typing capitals): the sequence stands, and that key carried nothing on. */
  pass(): void {
    this.continued = false;
  }

  reset(): void {
    this.index = 0;
    this.continued = false;
  }
}

/**
 * The keys that are part of typing and not of the board: they add no letter and do not break the word (Shift for the capitals, CapsLock, the other modifiers and locks,
 * a dead key, an input method). Every other key that is not one character (an arrow, Enter, Escape, Tab, Backspace, a page key) is one the board answers: the player has gone on
 * to something else, so it ends the word.
 */
const TYPING_AIDS: ReadonlySet<string> = new Set([
  'Shift', 'CapsLock', 'Control', 'Alt', 'AltGraph', 'Meta', 'OS', 'Fn', 'FnLock', 'NumLock', 'ScrollLock', 'Hyper', 'Super', 'Symbol', 'SymbolLock',
  'Dead', 'Compose', 'Process', 'Unidentified',
]);

/**
 * A typed word, one `KeyboardEvent.key` at a time: the keyboard half of a secret door. Any case; Shift, CapsLock and the other typing aids are ignored outright; a wrong letter,
 * a pause over `gapMs` or a key the board answers (an arrow, Enter, Escape) resets silently, and a wrong letter that is the word's first starts it again.
 * {@link continued} is true only right after a letter that extended a live match, never for the key after it: the board may leave a press to the word only while it is the word's.
 */
export class WordDoor {
  private readonly matcher: SequenceMatcher;

  constructor(
    readonly word: string,
    gapMs: number = KEY_GAP_MS,
  ) {
    this.matcher = new SequenceMatcher(word.split(''), gapMs);
  }

  /** A key went down (`KeyboardEvent.key`): `'open'` on the word's last letter, otherwise `null`. */
  feedKey(key: string, atMs: number): DoorResult {
    if (key.length === 1) return this.matcher.feed(key.toLowerCase(), atMs);
    if (TYPING_AIDS.has(key)) this.matcher.pass();
    else this.matcher.reset(); // an arrow, Enter, Escape...: the board's own key, and the word is over
    return null;
  }

  /** The key just fed was a later letter of the word, typed in time: the board it is typed on should leave that press to the word. False for every other key, the one after a letter included. */
  get continued(): boolean {
    return this.matcher.continued;
  }

  reset(): void {
    this.matcher.reset();
  }
}

/** One board visit's door. Make a new one each time the board is entered. */
export class SecretDoor {
  private readonly word = new WordDoor(DOOR_WORD);
  private readonly pad = new SequenceMatcher(PAD_SEQUENCE, PAD_GAP_MS);
  private taps: number[] = [];

  /**
   * A key went down. `key` is `KeyboardEvent.key`. Shift, CapsLock and the other
   * typing aids are ignored outright, so typing the word in capitals works; any
   * other character resets the word, and so does a key the board answers (an
   * arrow, Enter, Escape): see {@link WordDoor}.
   */
  feedKey(key: string, atMs: number): DoorResult {
    return this.word.feedKey(key, atMs);
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
