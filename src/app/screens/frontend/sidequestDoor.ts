/**
 * The secret word to the hidden Belgemine's Challenge chapter (FFX only; branch `ch-belgemine`, 2026-11-09): the eight aeon duels of the Remiem Temple.
 *
 * Bailey, 2026-11-06 ~00:30 EST, "implement all unimplemented chapters please", and ~00:55 EST, "yes on all these too" (to building every researched boss he never picked); 2026-10-31, "you make the executive decisions for the
 * next few days. i'll go with all of your recommendations." The driver's decision: the chapter ships HIDDEN behind a typed word, as the Dark Aeons, Penance and the others do, so he plays it, and listing it on the board waits for his
 * word (the paper preflight's BD9). **The word is `sidequest`** (the program plan's pick, section 8, `door-check.mjs`: the natural word `belgemine` fails the door rule, its trailing `e` starts `experiment`), hidden chapter number 45.
 * It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the
 * board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit.
 *
 * Which letters are bound (checked against `app/inputKeyMap.ts`, pinned by `tests/unit/chapters/belgemine-door.test.ts` with the real `Input` and the real board): S is `down`, D is `right`, E is `start`, Q is `triangle`; I, U and T are
 * unbound. The first letter S is the board's own press for a moment; the later letters that are board keys are claimed by the word (`WordDoor.continued`, the screen's `wordKey`), so they do not move the cursor.
 * `tests/unit/chapter-doors.test.ts` pins that no door's word begins with, ends with or contains another's, and that no word's end is another's beginning: `sidequest` begins with `s` (no other word ends in `s`) and ends in `t`
 * (no other word begins with `t`, and the run door `pilgrim` begins with `p`), so it overlaps no word in any position.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { BELGEMINE_CHAPTER_ID } from '../../../data/ffx/belgemine-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Belgemine's Challenge chapter. */
export const SIDEQUEST_DOOR_WORD = 'sidequest';

/** Where the word leads. */
export const SIDEQUEST_DOOR_CHAPTER = BELGEMINE_CHAPTER_ID;
