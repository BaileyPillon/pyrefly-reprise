/**
 * The secret word to the hidden Penance chapter (FFX only; branch `ch-penance`, 2026-11-06).
 *
 * Bailey, 2026-11-06 ~00:30 EST, "implement all unimplemented chapters please", and ~00:55 EST, "yes on all these too" (to building Penance, the Dark Aeons and every researched boss he never picked). The driver's decision: the
 * chapter ships HIDDEN behind a typed word, as the Spectral Keeper, the Last Summoning and the others do, so he plays it, and listing it on the board waits for his word (preflight P2). **The word is `judgment`** (the
 * Judgment Day that decides the fight; eight letters), hidden chapter number 35. The obvious word, `penance`, fails the table's test twice (`yrp` ends in P and `experiment` begins with E: the last letter of one word
 * would start another, so one run of letters could finish two doors), so it is not used.
 * It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the
 * board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit.
 *
 * Which letters are bound (checked against `app/inputKeyMap.ts`, pinned by `tests/unit/chapters/penance-door.test.ts` with the real `Input` and the real board): J, U, G, N and T are bound to nothing, **D is `right`**,
 * **M is `select`** and **E is `start`**. The first letter J is a board key's neighbour and nothing else; the later letters are claimed by the word (`WordDoor.continued`, the screen's `wordKey`), so the board leaves their
 * presses alone. The last letter T is bound to nothing (FF7's `limit` ends in the same letter), so no latched press is left for party prep to start the fight on. `tests/unit/chapter-doors.test.ts` pins that no door's word
 * begins with, ends with or contains another's, and that no word's end is another's beginning: `judgment` begins with `j` (none of the other words ends in `j`) and ends in `t` (none begins with `t`), so it overlaps no word in any position.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { PENANCE_CHAPTER_ID } from '../../../data/ffx/penance-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Penance chapter. */
export const JUDGMENT_DOOR_WORD = 'judgment';

/** Where the word leads. */
export const JUDGMENT_DOOR_CHAPTER = PENANCE_CHAPTER_ID;
