/**
 * The secret word to the hidden Fiend Arena Superbosses chapter (FFX-2 only; branch `ch-fiend-superbosses`, 2026-11-09): Almighty Shinra, then the Major Numerus with its four heads, the two top fights of the Fiend Arena.
 *
 * Bailey, 2026-11-06: "implement all unimplemented chapters please" and "yes on all these too" (to building every researched boss he never picked); 2026-10-31: "you make the executive decisions for the next few days.
 * i'll go with all of your recommendations." The driver's decision: the chapter ships HIDDEN behind a typed word, as the other hidden chapters do (`./duelistDoor.ts`, `./maestersDoor.ts`, `./braveheartDoor.ts`), so he
 * plays it, and listing it on the board waits for his word. **The word is `legion`** (the paper preflight's pick LG10, `docs/plans/ch-fiend-superbosses-review.md`: the driver's call, his to overturn; its two alternatives,
 * `shinra` and `numerus`, both fail the table's rule: the last letter of `shinra` starts `angra`, and the last of `numerus` starts `summon`). Hidden chapter number 53. It is the same `WordDoor` as FF7's "limit" and the other
 * hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the
 * board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not
 * remembered: the word is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/inputKeyMap.ts` `KEY_MAP`, pinned by `tests/unit/chapters/legion-door.test.ts` with the real `Input`, the real board and the real title screen):
 * **E is `start`**, and L, G, I, O and N are bound to nothing. On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C) start the flow, plus B for the briefing; the word is typed on the board, not there, and
 * the only one of its letters the title answers is the E. On the BOARD the first letter L is bound to nothing, so the cursor does not move at all; the later E (`start`, which the board ignores) is **claimed by the word**
 * (`WordDoor.continued`, the screen's `wordKey`: a later letter typed in time is swallowed, so it does not move the cursor or start anything). The last letter N is bound to nothing, so no latched press is left for the
 * party prep to start the fight on. The word has no L1 and no R1 (L is the keyboard letter, not the pad's L1: `KeyF` is `l1`), so it never completes FF7's pad sequence L1 R1 L1 R1 Select (`./secretDoor.ts`).
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no door's word
 * begins with, ends with or contains another's, that no word's end is another's beginning, and that `limit` loses no letter to a plain word: `legion` starts with `l` and `le`, which `leblanc` also starts (a shared
 * PREFIX is allowed: the table forbids a word that BEGINS another word, not two words that begin alike; the first letter that differs, G, ends `leblanc`'s match), and it ends with `n` (no word begins with `n`, `on`, `ion`, ...).
 *
 * Game case: FFX-2 only (the chapter is FFX-2's); the board and the door are shared plumbing.
 */
import { FIEND_SUPERBOSSES_ID } from '../../../data/fiend-superbosses-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Fiend Arena Superbosses chapter. */
export const LEGION_DOOR_WORD = 'legion';

/** Where the word leads. */
export const LEGION_DOOR_CHAPTER = FIEND_SUPERBOSSES_ID;
