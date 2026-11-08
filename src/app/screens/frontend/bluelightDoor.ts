/**
 * The secret word to the hidden Jenova LIFE chapter (FF7 only; branch `ch-jenova-life`, 2026-11-07): the boss at the altar of the Forgotten Capital.
 *
 * Bailey, 2026-11-06 ~00:30 EST, "implement all unimplemented chapters please", and ~00:55 EST, "yes on all these too" (to building every researched boss he never picked, FF7 included). The driver's decision: the chapter ships
 * HIDDEN behind a typed word, as the Fallen Maesters, the Sanctuary Keeper and the others do, so he plays it, and listing it on the board waits for his word (preflight J1). **The word is `bluelight`** (the program plan's pick,
 * section 8, checked against the table of doors; Blue Light is the boss's own attack; the natural word `jenova` ends in `va`, which begins `valefor`), hidden chapter number 44. It is the same `WordDoor` as the other hidden
 * chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board
 * settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not
 * remembered: the word is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in. **Unlike the Guard Scorpion's door (`limit`) it is a plain typed word**: no label taps and no
 * pad sequence, which belong to that one chapter. It stays shut while the FF7 switch is off (`gate: ff7ExperimentReady`, `./chapterDoors.ts`), as the Guard Scorpion's does.
 *
 * Which letters are bound is pinned by `tests/unit/bluelight-door.test.ts` with the real `Input` and the real board (it reads `app/inputKeyMap.ts`, never a literal). `tests/unit/chapter-doors.test.ts` pins that no door's word begins
 * with, ends with or contains another's, and that no word's end is another's beginning: `bluelight` starts with `b` (no other word ends in `b`) and ends with `t` (no word begins with `t`, `ht`, `ght`, ...), and it contains none
 * of the others (`limit` is not inside it).
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal.
 *
 * Game case: FF7 only (the chapter is FF7's); the board and the door are shared plumbing.
 */
import { JENOVA_LIFE_CHAPTER_ID } from '../../../data/ff7/jenova-life-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Jenova LIFE chapter. */
export const BLUELIGHT_DOOR_WORD = 'bluelight';

/** Where the word leads. */
export const BLUELIGHT_DOOR_CHAPTER = JENOVA_LIFE_CHAPTER_ID;
