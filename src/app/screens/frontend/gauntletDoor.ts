/**
 * The secret word to the hidden Gauntlet chapter (FFX only; branch `ch-gauntlet`, 2026-11-10).
 *
 * Bailey, relayed by the release driver, 2026-11-06 and 2026-11-09: "implement all unimplemented chapters please", "yes on all these too" (to building every researched boss he never picked), "you make the executive decisions
 * for the next few days. i'll go with all of your recommendations" and "Keep going please with everything you were doing". The driver's decisions: the chapter ships HIDDEN behind a typed word, as the Dark Aeons, Shinryu and the
 * others do, so he plays it, and listing it on the board waits for his word. **The word is `gauntlet`** (pick GA1 of `docs/plans/ch-gauntlet-review.md`, re-checked against the table of doors by the plan's door check; the
 * alternative named there, `catastrophe`, fails it: two clashes), hidden chapter number 54. It is the same `WordDoor` as the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most
 * `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. The unlock is not
 * remembered: the word is typed on each visit.
 *
 * Which letters are bound (checked against `app/inputKeyMap.ts`, pinned by `tests/unit/chapters/gauntlet-board.test.ts` with the real `Input` and the real board): **A is `left` and E is `start`**; G, U, N, T and L are bound to
 * nothing. The first letter G is bound to nothing, so the board sees no press on it; A and E are later letters, claimed by the word (`WordDoor.continued`, the screen's `wordKey`), so the board leaves their presses alone.
 * The last letter T is bound to nothing, so no press is left latched for party prep to start the fight on. `tests/unit/chapter-doors.test.ts` pins that no door's word begins with, ends with or contains another's, and
 * that no word's end is another's beginning: `gauntlet` begins with `g` (no other word ends in `g`, `ga`, `gau`, `gaun`, `gaunt` or `gauntl`) and ends in `t` (no other word begins with `t`, `et`, `let`, `tlet`,
 * `ntlet`, `untlet` or `auntlet`), so it overlaps no word in any position. It shares its first two letters with `gagazet` and its last two with that word, which the table allows (neither word contains or ends the other).
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { GAUNTLET_CHAPTER_ID, GAUNTLET_DOOR_WORD } from '../../../data/ffx/gauntlet-ids.ts';

/** THE WORD (`'gauntlet'`, written once in the chapter's ids module). Typed on chapter select, it opens the hidden Gauntlet chapter. */
export { GAUNTLET_DOOR_WORD };

/** Where the word leads. */
export const GAUNTLET_DOOR_CHAPTER = GAUNTLET_CHAPTER_ID;
