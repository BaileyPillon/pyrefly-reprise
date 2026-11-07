/**
 * The secret word to the hidden Shinryu chapter (FFX only; branch `ch-shinryu`, 2026-11-07).
 *
 * Bailey, relayed by the release driver, 2026-11-06 and 2026-11-07: "implement all unimplemented chapters please", "yes on all these too" (to building every researched boss he never picked) and "ok keep going we have full
 * usage here". The driver's decisions: the chapter ships HIDDEN behind a typed word, as the Flooded Ways, Penance and the others do, so he plays it, and listing it on the board waits for his word. **The word is `shinryu`**
 * (program plan section 8, pick SH9 of `docs/plans/ch-shinryu-review.md`; the alternative named there is `leviathan`), hidden chapter number 48. It is the same `WordDoor` as the other hidden chapters' words
 * (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the
 * chapter, with no card, no sound and no sign. The unlock is not remembered: the word is typed on each visit.
 *
 * Which letters are bound (checked against `app/inputKeyMap.ts`, pinned by `tests/unit/chapters/shinryu-board.test.ts` with the real `Input` and the real board): **S is `down` and R is `r1`**; H, I, N, Y and U are bound to
 * nothing. The first letter S is a `down` press, which the board answers by moving its cursor one step (as `summon` and `duelist` begin on a bound key too); the later letters are claimed by the word
 * (`WordDoor.continued`, the screen's `wordKey`), so the board leaves their presses alone. The last letter U is bound to nothing, so no press is left latched for party prep to start the fight on.
 * `tests/unit/chapter-doors.test.ts` pins that no door's word begins with, ends with or contains another's, and that no word's end is another's beginning: `shinryu` begins with `s` (no other word ends in `s`, `sh`, `shi`,
 * `shin` or `shinr`) and ends in `u` (no other word begins with `u`, `yu`, `ryu`, `nryu` or `inryu`), so it overlaps no word in any position.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { SHINRYU_CHAPTER_ID } from '../../../data/ffx/shinryu-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Shinryu chapter. */
export const SHINRYU_DOOR_WORD = 'shinryu';

/** Where the word leads. */
export const SHINRYU_DOOR_CHAPTER = SHINRYU_CHAPTER_ID;
