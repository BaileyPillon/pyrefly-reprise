/**
 * The secret word to the hidden Oblitzerator chapter (FFX only; branch `ch-oblitzerator`, 2026-11-09): the blitzball machine and the dock crane at Luca.
 *
 * Bailey, 2026-11-06 ~00:30 EST, "implement all unimplemented chapters please", and ~00:55 EST, "yes on all these too" (to building every researched boss he never picked); 2026-10-31, "you make the executive decisions for
 * the next few days. i'll go with all of your recommendations." The driver's decision: the chapter ships HIDDEN behind a typed word, as the Keepers, Penance, Spherimorph and the others do, so he plays it, and listing it on the
 * board waits for his word (preflight OB1). **The word is `blitz`** (the program plan's pick, section 8, checked against the existing words and `pilgrim` with `door-check.mjs`; the full word `oblitzerator` fails the pair
 * rule five ways), hidden chapter number 50.
 * It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the
 * board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit.
 *
 * Which letters are bound (checked against `app/inputKeyMap.ts`, pinned by `tests/unit/chapters/oblitzerator-door.test.ts` with the real `Input` and the real board): B, L, I and T are bound to nothing; **Z is `confirm`**, and it is the
 * LAST letter. A later letter of a live match is claimed by the word (`WordDoor.continued`, the screen's `wordKey`, which consumes `confirm`), so the Z never opens the card the cursor stands on (`gagazet`'s Z is the other
 * `confirm` letter, in the middle of its word); the board's next frame (`opening`) consumes every press before party prep can see it, so no press is left latched for the prep screen. The test types the word with a card
 * selected and asserts that no chapter but this one opens. `tests/unit/chapter-doors.test.ts` pins that no door's word begins with, ends with or contains another's, and that no word's end is another's beginning: `blitz` begins
 * with `b` (no word ends in `b`) and ends in `z` (no word begins with `z`, `tz`, `itz` or `litz`), so it overlaps no word in any position.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { OBLITZERATOR_CHAPTER_ID } from '../../../data/ffx/oblitzerator-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Oblitzerator chapter. */
export const BLITZ_DOOR_WORD = 'blitz';

/** Where the word leads. */
export const BLITZ_DOOR_CHAPTER = OBLITZERATOR_CHAPTER_ID;
