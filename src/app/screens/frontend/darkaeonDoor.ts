/**
 * The secret word to the hidden Dark Aeons chapter (FFX only; branch `ch-dark-aeons`, 2026-11-06).
 *
 * Bailey, relayed by the release driver, 2026-11-06 about 00:30 and 00:55 EST: "implement all unimplemented chapters please" and "yes on all these too" (to building Penance, the Dark Aeons and every researched boss he never picked).
 * The driver's decisions: the chapter ships HIDDEN behind a typed word, as the Spectral Keeper, the Mirror Aeons (before it was listed) and the others do, so he plays it, and listing it on the board waits for his word (D-848).
 * **The word is `darkaeon`** (pick DA3 of `docs/plans/ch-dark-aeons-review.md`; `dark` alone is refused by the door test: it ends in `k`, which `keeper` begins with), hidden chapter number 34.
 * It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the
 * board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit.
 *
 * Which letters are bound (checked against `app/inputKeyMap.ts`, pinned by `tests/unit/chapters/dark-aeons-door.test.ts` with the real `Input` and the real board): **D is `right`, A is `left`, R is `r1`, E is `start`**; K, O and
 * N are bound to nothing. The first letter D reaches the board as a press of `right`, which a first letter cannot claim, so **the cursor takes one step on the first D** (as `daigoro`'s does; `daigoro` also begins with D: the second letter A matches both, the third, R against `daigoro`'s I, tells them apart); the later letters are claimed by the word
 * (`WordDoor.continued`, the screen's `wordKey`), so the board leaves their presses alone. The last letter N is bound to nothing, so no press is left latched for party prep to start the fight on (as `daigoro`'s O and `keeper`'s R,
 * which the board's next frame consumes). `tests/unit/chapter-doors.test.ts` pins that no door's word begins with, ends with or contains another's, and that no word's end is another's beginning: `darkaeon` begins with `d`
 * (no other word ends in `d`, `da` or `dar`) and ends in `n` (no other word begins with `n`, `on`, `eon` or `aeon`), so it overlaps no word in any position.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { DARK_AEONS_CHAPTER_ID } from '../../../data/ffx/dark-aeons-six-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Dark Aeons chapter. */
export const DARKAEON_DOOR_WORD = 'darkaeon';

/** Where the word leads. */
export const DARKAEON_DOOR_CHAPTER = DARK_AEONS_CHAPTER_ID;
