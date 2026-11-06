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
 * - **`leblanc`**, **`experiment`**, **`mushroom`**, **`fayth`**, **`daigoro`** (the Tourist Trap, FFX-2, `./daigoroDoor.ts`; D is `right`, A is `left`, R is `r1`, its last letter O is unbound), **`valefor`** (FFX-2 Chapter 3's Valefor at Besaid, `./valeforDoor.ts`: V is SELECT, A is left, E is START, F and R are L1 and R1), **`gagazet`** (FFX, Kimahri's solo trial against Biran and Yenke, `./gagazetDoor.ts`: A is left, **Z is confirm**, E is START; G and T are unbound) , **`angra`** (FFX-2 Chapter 5's Angra Mainyu, `./angraDoor.ts`: A is left twice, R is R1, N and G are unbound) and **`yojimbo`** (FFX, the Mirror Aeons chapter, `./yojimboDoor.ts`: Y, O, J, I, B are unbound, M is SELECT) are plain `WordDoor`s. Their last letter can be a bound key (Leblanc's C is START, the Experiment's and Mushroom's M is SELECT),
 *   and party prep begins the fight on the latched press, so each opens on the board's *next frame*, which takes every press first (`ChapterSelectScreen.handleInput`, the `opening` frame); and a
 *   later letter that is a board key (the A of "leblanc" and "fayth" is `left`, the S of "mushroom" is `down`, the X of "experiment" is `cancel`) is claimed by the word, so it does not move the
 *   cursor (`KeyFeed.claimed`, the screen's `wordKey`).
 *
 * Nothing is remembered: a fresh `BoardDoors` is made on every visit to the board, so no letter, tap or progress survives leaving it. Nothing is shown: no card, no sound, no sign.
 *
 * **A phone has no keyboard to type a word on**, so the same table is also fed by `./doorField.ts` (r50-rc): a long press on the "Chapter select" label puts up one text field, and every letter typed in it goes
 * through a fresh `BoardDoors` exactly as a key press does (so a word added to `CHAPTER_DOORS` works on a phone with no other change). It is shown only while it is asked for and leaves nothing behind.
 *
 * `tests/unit/chapter-doors.test.ts` pins the table: every word is distinct and none begins with, ends with or contains another, and no word's end is another's beginning, so one run of letters can
 * only ever finish one door. The four older doors' suites and `fayth-door.test.ts` drive the board itself with real key events.
 *
 * **`summon`** (FFX, the hidden Last Summoning, `./summonDoor.ts`: S is `down`, M is `select`; U, O and N are unbound) is a plain `WordDoor` too, and so is **`yrp`** (FFX-2, the hidden 3D Bahamut, `./yrpDoor.ts`: R is `r1`; Y and P are unbound; three letters, the shortest word on the table), and so is **`waker`** (FFX-2, the hidden Wind Waker chapter, `./windwakerDoor.ts`: W is `up`, A is `left`, E is `start`, R is `r1`; K is unbound).
 *
 * **`darkaeon`** (FFX, the hidden Dark Aeons, `./darkaeonDoor.ts`: D is `right`, A `left`, R `r1`, E `start`; K, O and N are unbound) is a plain `WordDoor` too.
 *
 * **`keeper`** (FFX, the hidden Spectral Keeper, `./keeperDoor.ts`: K and P are unbound, E is `start`, R is `r1`) is a plain `WordDoor` too.
 *
 * **`geosgaeno`** (FFX, the hidden Flooded Ways, `./geosgaenoDoor.ts`: E is `start`, S `down`, A `left`; G, O and N are unbound) is a plain `WordDoor` too.
 *
 * **`yrp` and `waker` are desktop-only** (driver decision 219q, 2026-11-03; FFX-2 only): their rows carry the `desktopOnly` gate, so on the phone tier the door stays shut as FF7's does while its switch is off (see `desktopOnly` below).
 *
 * **`judgment`** (FFX, the hidden Penance chapter, `./judgmentDoor.ts`: D is `right`, M is `select`, E is `start`; J, U, G, N and T are unbound) is a plain `WordDoor` too, and is **not** desktop-only (painted 2D, preflight P2).
 *
 * **`infinito`** (FFX-2, the hidden Fallen Maesters, `./maestersDoor.ts`: only F is a bound key, `l1`, which the board ignores; I, N, T and O are unbound) is a plain `WordDoor` too.
 *
 * Game case: shared plumbing (both). Each row's game is its chapter's: FF7 for `limit`, FFX-2 for `leblanc`, `experiment`, `daigoro`, `valefor`, `angra`, `infinito` and `yrp`, FFX for `mushroom`, `fayth`, `gagazet`, `yojimbo`, `summon`, `keeper`, `darkaeon`, `judgment` and `geosgaeno`.
 */

import type { ChapterId } from '../../../data/encounters.ts';
import { ff7ExperimentReady } from '../../experiments/ff7Flag.ts';
import { deviceClass } from '../../../engine/ArtDevice.ts';
import { DOOR_WORD, SecretDoor, WordDoor, type DoorResult } from './secretDoor.ts';
import { EXP_LEBLANC_DOOR_CHAPTER, EXP_LEBLANC_DOOR_WORD } from './leblancDoor.ts';
import { EXPERIMENT_DOOR_CHAPTER, EXPERIMENT_DOOR_WORD } from './experimentDoor.ts';
import { MUSHROOM_DOOR_CHAPTER, MUSHROOM_DOOR_WORD } from './mushroomDoor.ts';
import { FAYTH_DOOR_CHAPTER, FAYTH_DOOR_WORD } from './faythDoor.ts';
import { DAIGORO_DOOR_CHAPTER, DAIGORO_DOOR_WORD } from './daigoroDoor.ts';
import { VALEFOR_DOOR_CHAPTER, VALEFOR_DOOR_WORD } from './valeforDoor.ts';
import { GAGAZET_DOOR_CHAPTER, GAGAZET_DOOR_WORD } from './gagazetDoor.ts';
import { ANGRA_DOOR_CHAPTER, ANGRA_DOOR_WORD } from './angraDoor.ts';
import { YOJIMBO_DOOR_CHAPTER, YOJIMBO_DOOR_WORD } from './yojimboDoor.ts';
import { SUMMON_DOOR_CHAPTER, SUMMON_DOOR_WORD } from './summonDoor.ts';
import { KEEPER_DOOR_CHAPTER, KEEPER_DOOR_WORD } from './keeperDoor.ts';
import { DARKAEON_DOOR_CHAPTER, DARKAEON_DOOR_WORD } from './darkaeonDoor.ts';
import { GEOSGAENO_DOOR_CHAPTER, GEOSGAENO_DOOR_WORD } from './geosgaenoDoor.ts';
import { MAESTERS_DOOR_CHAPTER, MAESTERS_DOOR_WORD } from './maestersDoor.ts';
import { PILGRIM_DOOR_CHAPTER, PILGRIM_DOOR_WORD } from './pilgrimDoor.ts';
import { YRP_DOOR_CHAPTER, YRP_DOOR_WORD } from './yrpDoor.ts';
import { WINDWAKER_DOOR_CHAPTER, WINDWAKER_DOOR_WORD } from './windwakerDoor.ts';
import { ANIME_DOOR_CHAPTER, ANIME_DOOR_WORD } from './animeDoor.ts';
import { JUDGMENT_DOOR_CHAPTER, JUDGMENT_DOOR_WORD } from './judgmentDoor.ts';

/**
 * **The two hidden 3D chapters are desktop-only** (driver decision 219q, 2026-11-03; FFX-2 only: `yrp`, the 3D Bahamut, and `waker`, the Wind Waker Valefor). They are not staged for a phone: the Wind Waker is expected to miss the phone budgets
 * and the 3D Bahamut's models are 141 MB. On the phone tier (`ArtDevice.deviceClass()`: an upright window under 600 px, a coarse pointer on a screen whose short side is under 600 px, or `?arttier=phone`) these two doors stay shut,
 * through the table's own `gate`: the word is typed and nothing opens, with no screen, no word and no sound beyond what a shut door already gives (the keyboard's board goes on, and the phone's long-press field stays as it was, so the
 * word looks like any other). Read when the door opens, so a window that turns into a phone, or back, is judged as it is then. Every other door is unchanged on a phone (`tests/unit/r74-hidden-3d-phone-doors.test.ts`).
 */
const desktopOnly = (): boolean => deviceClass() !== 'phone';

/** One door: a word on the keyboard and the chapter it opens. */
export interface ChapterDoor {
  /** The word, as lower-case letters (`KeyboardEvent.key`, so any keyboard layout types it). */
  readonly word: string;
  /** Where the word leads. */
  readonly chapter: ChapterId;
  /** The door stays shut while this answers false (FF7's switch, `app/experiments/ff7Flag.ts`; the two hidden 3D chapters' phone tier, {@link desktopOnly}). Absent: always open. Read when the door opens, never earlier. */
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
  { word: GAGAZET_DOOR_WORD, chapter: GAGAZET_DOOR_CHAPTER },
  { word: ANGRA_DOOR_WORD, chapter: ANGRA_DOOR_CHAPTER },
  { word: YOJIMBO_DOOR_WORD, chapter: YOJIMBO_DOOR_CHAPTER },
  { word: SUMMON_DOOR_WORD, chapter: SUMMON_DOOR_CHAPTER },
  { word: KEEPER_DOOR_WORD, chapter: KEEPER_DOOR_CHAPTER },
  { word: MAESTERS_DOOR_WORD, chapter: MAESTERS_DOOR_CHAPTER },
  { word: YRP_DOOR_WORD, chapter: YRP_DOOR_CHAPTER, gate: desktopOnly },
  { word: WINDWAKER_DOOR_WORD, chapter: WINDWAKER_DOOR_CHAPTER, gate: desktopOnly },
  { word: ANIME_DOOR_WORD, chapter: ANIME_DOOR_CHAPTER, gate: desktopOnly },
  { word: DARKAEON_DOOR_WORD, chapter: DARKAEON_DOOR_CHAPTER },
  { word: JUDGMENT_DOOR_WORD, chapter: JUDGMENT_DOOR_CHAPTER },
  { word: GEOSGAENO_DOOR_WORD, chapter: GEOSGAENO_DOOR_CHAPTER },
];

/**
 * The doors that lead to a run, not to a chapter of their own (FFX's Pilgrimage, `./pilgrimDoor.ts`, 2026-10-18): kept beside `CHAPTER_DOORS` because the table's test forbids the one-letter overlap `pilgrim` has with `mushroom`
 * (a harmless one, written up in `./pilgrimDoor.ts`). They are plain typed words (the next frame, later letters claimed) and `BoardDoors.isRun` says which chapter's door is one.
 */
export const RUN_DOORS: readonly ChapterDoor[] = [{ word: PILGRIM_DOOR_WORD, chapter: PILGRIM_DOOR_CHAPTER }];

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
  private readonly matchers: ReadonlyArray<{ row: ChapterDoor; door: { feedKey(key: string, atMs: number): DoorResult; readonly continued?: boolean } }> = [...CHAPTER_DOORS, ...RUN_DOORS].map((row) => ({
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

  /** True when `chapter`'s door leads to a run (the Pilgrimage), not to the chapter alone: the board then arms the flow. */
  isRun(chapter: ChapterId): boolean {
    return RUN_DOORS.some((row) => row.chapter === chapter);
  }

  /** False while the chapter's door is gated shut (FF7's switch); true for every other chapter. */
  isOpen(chapter: ChapterId): boolean {
    const gate = CHAPTER_DOORS.find((row) => row.chapter === chapter)?.gate;
    return gate === undefined || gate();
  }
}
