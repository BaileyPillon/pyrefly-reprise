/**
 * The secret word to the hidden Sanctuary Keeper chapter (FFX only; branch `ch-sanctuary-keeper`, 2026-11-06).
 *
 * Bailey, 2026-11-06 ~00:30 EST, "implement all unimplemented chapters please", and ~00:55 EST, "yes on all these too" (to building every researched boss he never picked). The driver's decision: the chapter ships HIDDEN
 * behind a typed word, as the Spectral Keeper, Penance and the others do, so he plays it, and listing it on the board waits for his word (preflight SK1). **The word is `beast`** (the program plan's pick, section 8; the
 * natural word `keeper` is the Spectral Keeper's), hidden chapter number 39.
 * It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the
 * board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit.
 *
 * Which letters are bound (checked against `app/inputKeyMap.ts`, pinned by `tests/unit/chapters/sanctuary-keeper-door.test.ts` with the real `Input` and the real board): see that test, which reads the real key map; the first
 * letter B is a board key's neighbour and nothing else, the later letters are claimed by the word (`WordDoor.continued`, the screen's `wordKey`), so the board leaves their presses alone. `tests/unit/chapter-doors.test.ts`
 * pins that no door's word begins with, ends with or contains another's, and that no word's end is another's beginning: `beast` begins with `b` (none of the other words ends in `b`) and ends in `t` (none begins with `t`, and
 * the run door `pilgrim` begins with `p`), so it overlaps no word in any position.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { SANCTUARY_KEEPER_CHAPTER_ID } from '../../../data/ffx/sanctuary-keeper-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Sanctuary Keeper chapter. */
export const BEAST_DOOR_WORD = 'beast';

/** Where the word leads. */
export const BEAST_DOOR_CHAPTER = SANCTUARY_KEEPER_CHAPTER_ID;
