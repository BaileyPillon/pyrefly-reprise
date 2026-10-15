/**
 * **The doors of the chapter-select board, as one table.** Every typed word that opens a chapter the board has no card for, in one list (`CHAPTER_DOORS`), and the per-visit object that feeds
 * them (`BoardDoors`). A new hidden chapter's word is one row here and a constants file beside the others (`./faythDoor.ts` is the latest), never another field, import and pair of lines in
 * `ChapterSelectScreen.ts`, which had run out of room (399 of the house 400 lines) for a fifth door.
 *
 * The rows, in the order the doors were added:
 *
 * - **`limit`** opens FF7's Guard Scorpion experiment (`secret: true`, `./secretDoor.ts`). It is the one door with more than a word: the same chapter also opens on seven taps of the "Chapter
 *   select" label and on the pad sequence L1 R1 L1 R1 Select, so its matcher is the visit's `SecretDoor`. It opens in the key's own handler (its last letter, T, is bound to nothing, so no
 *   press is left over), its later letters are never board presses (L, I, M, I, T), and it stays shut while `ff7ExperimentReady()` says so (`gate`).
 * - **`leblanc`**, **`experiment`**, **`mushroom`**, **`fayth`**, **`daigoro`** (the Tourist Trap, FFX-2, `./daigoroDoor.ts`; D is `right`, A is `left`, R is `r1`, its last letter O is unbound), **`valefor`** (FFX-2 Chapter 3's Valefor at Besaid, `./valeforDoor.ts`: V is SELECT, A is left, E is START, F and R are L1 and R1) and **`angra`** (FFX-2 Chapter 5's Angra Mainyu, `./angraDoor.ts`: A is left twice, R is R1, N and G are unbound) are plain `WordDoor`s. Their last letter can be a bound key (Leblanc's C is START, the Experiment's and Mushroom's M is SELECT),
 *   and party prep begins the fight on the latched press, so each opens on the board's *next frame*, which takes every press first (`ChapterSelectScreen.handleInput`, the `opening` frame); and a
 *   later letter that is a board key (the A of "leblanc" and "fayth" is `left`, the S of "mushroom" is `down`, the X of "experiment" is `cancel`) is claimed by the word, so it does not move the
 *   cursor (`KeyFeed.claimed`, the screen's `wordKey`).
 *
 * Nothing is remembered: a fresh `BoardDoors` is made on every visit to the board, so no letter, tap or progress survives leaving it. Nothing is shown: no card, no sound, no sign.
 *
 * `tests/unit/chapter-doors.test.ts` pins the table: every word is distinct and none begins with, ends with or contains another, and no word's end is another's beginning, so one run of letters can
 * only ever finish one door. The four older doors' suites and `fayth-door.test.ts` drive the board itself with real key events.
 *
 * Game case: shared plumbing (both). Each row's game is its chapter's: FF7 for `limit`, FFX-2 for `leblanc` and `experiment`, FFX for `mushroom` and `fayth`.
 */

import type { ChapterId } from '../../../data/encounters.ts';
import { ff7ExperimentReady } from '../../experiments/ff7Flag.ts';
import { DOOR_WORD, SecretDoor, WordDoor, type DoorResult } from './secretDoor.ts';
import { EXP_LEBLANC_DOOR_CHAPTER, EXP_LEBLANC_DOOR_WORD } from './leblancDoor.ts';
import { EXPERIMENT_DOOR_CHAPTER, EXPERIMENT_DOOR_WORD } from './experimentDoor.ts';
import { MUSHROOM_DOOR_CHAPTER, MUSHROOM_DOOR_WORD } from './mushroomDoor.ts';
import { FAYTH_DOOR_CHAPTER, FAYTH_DOOR_WORD } from './faythDoor.ts';
import { DAIGORO_DOOR_CHAPTER, DAIGORO_DOOR_WORD } from './daigoroDoor.ts';
import { VALEFOR_DOOR_CHAPTER, VALEFOR_DOOR_WORD } from './valeforDoor.ts';
import { ANGRA_DOOR_CHAPTER, ANGRA_DOOR_WORD } from './angraDoor.ts';

/** One door: a word on the keyboard and the chapter it opens. */
export interface ChapterDoor {
  /** The word, as lower-case letters (`KeyboardEvent.key`, so any keyboard layout types it). */
  readonly word: string;
  /** Where the word leads. */
  readonly chapter: ChapterId;
  /** The door stays shut while this answers false (FF7's switch, `app/experiments/ff7Flag.ts`). Absent: always open. Read when the door opens, never earlier. */
  readonly gate?: () => boolean;
  /**
   * FF7's door: its word is matched by the visit's `SecretDoor` (so the label taps and the pad sequence open the same chapter), the chapter opens in the key's own handler instead of the next
   * frame, and its letters are never claimed from the board. Absent: a plain typed word (the next frame, and its later letters claimed).
   */
  readonly secret?: true;
}

/** Every door of the board, in the order they were added. */
export const CHAPTER_DOORS: readonly ChapterDoor[] = [
  { word: DOOR_WORD, chapter: 'ff7-guard-scorpion', gate: ff7ExperimentReady, secret: true },
  { word: EXP_LEBLANC_DOOR_WORD, chapter: EXP_LEBLANC_DOOR_CHAPTER },
  { word: EXPERIMENT_DOOR_WORD, chapter: EXPERIMENT_DOOR_CHAPTER },
  { word: MUSHROOM_DOOR_WORD, chapter: MUSHROOM_DOOR_CHAPTER },
  { word: FAYTH_DOOR_WORD, chapter: FAYTH_DOOR_CHAPTER },
  { word: DAIGORO_DOOR_WORD, chapter: DAIGORO_DOOR_CHAPTER },
  { word: VALEFOR_DOOR_WORD, chapter: VALEFOR_DOOR_CHAPTER },
  { word: ANGRA_DOOR_WORD, chapter: ANGRA_DOOR_CHAPTER },
];

/** What one key did to the doors. */
export interface KeyFeed {
  /** A door that opens in this key's own handler (FF7's), or null. */
  readonly now: ChapterId | null;
  /** A door whose word this key finished and that opens on the board's next frame, or null. */
  readonly next: ChapterId | null;
  /** This key was a later letter of a plain word, typed in time: the board leaves this frame's presses alone. */
  readonly claimed: boolean;
}

/** The door that is matched by the visit's `SecretDoor`: the table has exactly one (a test pins it). */
const SECRET_ROW = CHAPTER_DOORS.find((row) => row.secret === true);

/** One board visit's doors: the table's words, and FF7's label taps and pad sequence. Make a new one each time the board is entered. */
export class BoardDoors {
  private readonly secret = new SecretDoor();
  private readonly matchers: ReadonlyArray<{ row: ChapterDoor; door: { feedKey(key: string, atMs: number): DoorResult; readonly continued?: boolean } }> = CHAPTER_DOORS.map((row) => ({
    row,
    door: row.secret === true ? this.secret : new WordDoor(row.word),
  }));

  /** A key went down (`KeyboardEvent.key`, auto-repeat and chords already screened out by the caller): what it finished. */
  feedKey(key: string, atMs: number): KeyFeed {
    let now: ChapterId | null = null;
    let next: ChapterId | null = null;
    let claimed = false;
    for (const { row, door } of this.matchers) {
      if (door.feedKey(key, atMs) === 'open') {
        if (row.secret === true) now = row.chapter;
        else next = row.chapter;
      }
      if (row.secret !== true && door.continued === true) claimed = true;
    }
    return { now, next, claimed };
  }

  /** A pad (or mapped keyboard) button went down, as an `app/Input.ts` button name: the chapter the pad sequence opened, or null. */
  feedButton(button: string, atMs: number): ChapterId | null {
    return this.secret.feedButton(button, atMs) === 'open' ? (SECRET_ROW?.chapter ?? null) : null;
  }

  /** A tap or click on the "Chapter select" label: the chapter the taps opened, or null. */
  feedTap(atMs: number): ChapterId | null {
    return this.secret.feedTap(atMs) === 'open' ? (SECRET_ROW?.chapter ?? null) : null;
  }

  /** False while the chapter's door is gated shut (FF7's switch); true for every other chapter. */
  isOpen(chapter: ChapterId): boolean {
    const gate = CHAPTER_DOORS.find((row) => row.chapter === chapter)?.gate;
    return gate === undefined || gate();
  }
}
