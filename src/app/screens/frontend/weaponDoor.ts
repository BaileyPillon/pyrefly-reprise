/**
 * The secret word to the hidden Omega Ruins chapter (FFX only; branch `ch-omega-ruins`, 2026-11-06).
 *
 * Bailey, 2026-11-06 ~00:30 EST, "implement all unimplemented chapters please", and ~00:55 EST, "yes on all these too" (to building every researched boss he never picked). The driver's decision: the chapter ships HIDDEN
 * behind a typed word, as the Spectral Keeper, the Sanctuary Keeper and the others do, so he plays it, and listing it on the board waits for his word (preflight WP1). **The word is `weapon`** (the program plan's pick, section 8;
 * the natural words `omega` and `ultima` fail the door rule: the end of `mushroom`, `om`, starts `omega`, and `ultima` ends in `a`, which starts `angra`), hidden chapter number 43.
 * It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the
 * board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit.
 *
 * `tests/unit/chapter-doors.test.ts` pins that no door's word begins with, ends with or contains another's, and that no word's end is another's beginning: `weapon` begins with `w` (the Wind Waker's `waker` also does,
 * but neither contains, begins with nor ends with the other) and ends in `n`, which begins no other word. `tests/unit/chapters/omega-ruins-door.test.ts` runs the exact check against the real table with the real key map.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { OMEGA_RUINS_CHAPTER_ID } from '../../../data/ffx/omega-ruins-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Omega Ruins chapter. */
export const WEAPON_DOOR_WORD = 'weapon';

/** Where the word leads. */
export const WEAPON_DOOR_CHAPTER = OMEGA_RUINS_CHAPTER_ID;
