/**
 * The secret word to the hidden Farplane Cup chapter (FFX-2 only; branch `ch-farplane-cup`, 2026-11-06): the Fiend Arena's three duels, Auron, Tidus and Seymour.
 *
 * Bailey, 2026-11-06 ~00:30 EST: "implement all unimplemented chapters please"; ~00:55 EST: "yes on all these too"; 2026-10-31: "you make the executive decisions for the next few days. i'll go with all of your
 * recommendations." The chapter ships HIDDEN behind a typed word, as the other hidden chapters do (`./leblancDoor.ts`, `./experimentDoor.ts`, `./mushroomDoor.ts`, `./faythDoor.ts`, `./daigoroDoor.ts`, `./valeforDoor.ts`,
 * `./angraDoor.ts`, `./maestersDoor.ts`); listing it on the board waits for his word. **The word is `duelist`** (the program plan's section 8, checked against every existing word by the rule of
 * `tests/unit/chapter-doors.test.ts`), the driver's pick ("the word is a house detail"); hidden chapter number 38. It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the
 * word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound
 * and no sign. It settles on the frame after the last letter, which takes that letter's press (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit. The board
 * has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/inputKeyMap.ts` `KEY_MAP`, pinned by `tests/unit/chapters/farplane-cup-door.test.ts` with the real `Input`, the real board and the real title
 * screen): **D is `right`, E is `start`, S is `down`**; U, L, I and T are bound to nothing. The first letter D reaches the board as a press of `right`: a first letter cannot be claimed in advance (the board cannot know a
 * word is coming), so the cursor takes one step, and the board then leaves for the chapter, so it is harmless (and it is what any player typing a D would get; the daigoro and darkaeon words do the same). The E and the S
 * are later letters of a live match and are claimed by the word (`WordDoor.continued`, the screen's `wordKey`), so neither starts anything or moves the cursor. The last letter T is bound to nothing, so no latched press is
 * left for the party prep to start the fight on. On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C) start the flow, plus B for the briefing; the word is typed on the board, not there, and the only one
 * of its letters the title answers is the E.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no door's word
 * begins with, ends with or contains another's, and that no word's end is another's beginning: `duelist` starts with `d` (no other word ends in `d`, `ed`, ...) and ends with `t` (no word begins with `t`, `st`, `ist`, ...).
 *
 * Game case: FFX-2 only (the chapter is FFX-2's); the board and the door are shared plumbing.
 */
import { FARPLANE_CUP_ID } from '../../../data/farplane-cup-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Farplane Cup chapter. */
export const DUELIST_DOOR_WORD = 'duelist';

/** Where the word leads. */
export const DUELIST_DOOR_CHAPTER = FARPLANE_CUP_ID;
