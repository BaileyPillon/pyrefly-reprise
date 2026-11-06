/**
 * The secret word to the hidden Flooded Ways chapter (FFX only; branch `ch-flooded-ways`, 2026-11-06).
 *
 * Bailey, relayed by the release driver, 2026-11-06 about 00:30 and 00:55 EST: "implement all unimplemented chapters please" and "yes on all these too" (to building every researched boss he never picked).
 * The driver's decisions: the chapter ships HIDDEN behind a typed word, as the Spectral Keeper, the Dark Aeons and the others do, so he plays it, and listing it on the board waits for his word.
 * **The word is `geosgaeno`** (program plan section 8, pick GV1 of `docs/plans/ch-geosgaeno-review.md`), hidden chapter number 36. It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words
 * (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the chapter,
 * with no card, no sound and no sign. The unlock is not remembered: the word is typed on each visit.
 *
 * Which letters are bound (checked against `app/inputKeyMap.ts`, pinned by `tests/unit/chapters/flooded-ways-board.test.ts` with the real `Input` and the real board): **E is `start`, S is `down`, A is `left`**; G, O and N are
 * bound to nothing. The first letter G is unbound, so the board never sees a press of it; the later letters are claimed by the word (`WordDoor.continued`, the screen's `wordKey`), so the board leaves their presses alone
 * (the E of the second letter is a `start`, which the word swallows, as `keeper`'s does). The last letter O is bound to nothing, so no press is left latched for party prep to start the fight on.
 * `tests/unit/chapter-doors.test.ts` pins that no door's word begins with, ends with or contains another's, and that no word's end is another's beginning: `geosgaeno` begins with `g` (no other word ends in `g`, `ge` or
 * `geo`) and ends in `o` (no other word begins with `o`, `no`, `eno` or `aeno`), so it overlaps no word in any position.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { FLOODED_WAYS_CHAPTER_ID } from '../../../data/ffx/flooded-ways-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Flooded Ways chapter. */
export const GEOSGAENO_DOOR_WORD = 'geosgaeno';

/** Where the word leads. */
export const GEOSGAENO_DOOR_CHAPTER = FLOODED_WAYS_CHAPTER_ID;
