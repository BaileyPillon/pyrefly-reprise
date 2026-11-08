/**
 * The secret word to the hidden Spherimorph chapter (FFX only; branch `ch-spherimorph`, 2026-11-06).
 *
 * Bailey, 2026-11-06 ~00:30 EST, "implement all unimplemented chapters please", and ~00:55 EST, "yes on all these too" (to building every researched boss he never picked). The driver's decision: the chapter ships HIDDEN
 * behind a typed word, as the Keepers, Penance and the others do, so he plays it, and listing it on the board waits for his word (preflight SP1). **The word is `spherimorph`** (the program plan's pick, section 8, checked
 * against the existing words and `pilgrim` with `door-check.mjs`), hidden chapter number 41.
 * It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the
 * board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit.
 *
 * Which letters are bound (checked against `app/inputKeyMap.ts`, pinned by `tests/unit/chapters/spherimorph-door.test.ts` with the real `Input` and the real board): see that test, which reads the real key map. The
 * letters the board answers are the word's to claim once it has begun (`WordDoor.continued`, the screen's `wordKey`), so the board leaves their presses alone. `tests/unit/chapter-doors.test.ts` pins that no door's word
 * begins with, ends with or contains another's, and that no word's end is another's beginning: `spherimorph` begins with `s` and ends in `h`; no other word ends in `s` or begins with `h`, so it overlaps no word in any position.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { SPHERIMORPH_CHAPTER_ID } from '../../../data/ffx/spherimorph-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Spherimorph chapter. */
export const SPHERIMORPH_DOOR_WORD = 'spherimorph';

/** Where the word leads. */
export const SPHERIMORPH_DOOR_CHAPTER = SPHERIMORPH_CHAPTER_ID;
