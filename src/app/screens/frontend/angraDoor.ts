/**
 * The secret word to the hidden Angra Mainyu chapter (FFX-2 only; 2026-10-15).
 *
 * Bailey, 2026-10-15, verbatim: "Implement the unimplemented chapters please." and "Implement the unimplemented chapters end-to-end please. It needs to be a finished product." The chapter ships
 * HIDDEN behind a typed word, as the other hidden chapters do (`./leblancDoor.ts`, `./experimentDoor.ts`, `./mushroomDoor.ts`, `./faythDoor.ts`, `./daigoroDoor.ts`, `./valeforDoor.ts`,
 * `./kimahriDoor.ts`), and listing it on the board waits for his word after he has played it (D-848). **The word is `angra`**, the first half of the fiend's name. It is the same `WordDoor` as the
 * others (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers resets silently) and the board
 * settles on the chapter on the frame after the last letter, with no card, no sound and no sign. The unlock is not remembered.
 *
 * Which letters are bound, and why the word is safe (checked against `app/Input.ts` `KEY_MAP`, pinned by `tests/unit/angra-door.test.ts` with the real `Input`, the real board and the real
 * title screen): **A is `left`**, **R is `r1`**, **N and G are bound to nothing**. The first letter A reaches the board as a press of `left`: a first letter cannot be claimed in advance (the board
 * cannot know a word is coming), so the cursor takes one step, and the board then leaves for the chapter, which is harmless (the `daigoro` precedent, whose D is `right`). The R and the last A
 * are later letters of a live match and are claimed by the word (`WordDoor.continued`), so the last A does not move the cursor, and the board's `opening` frame takes every press, so nothing is left
 * latched for party prep. On the TITLE screen only `confirm` and `start` start the flow (and B the briefing): none of the word's letters does.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). `tests/unit/chapter-doors.test.ts` pins that no door's word begins with, ends with
 * or contains another's, and that no word's end is another's beginning: `angra` starts and ends with `a`, and no other word starts or ends with it.
 *
 * Game case: FFX-2 only (the chapter is FFX-2's); the board and the door are shared plumbing.
 */
import { ANGRA_MAINYU_ID } from '../../../data/angra-mainyu-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Angra Mainyu chapter. */
export const ANGRA_DOOR_WORD = 'angra';

/** Where the word leads. */
export const ANGRA_DOOR_CHAPTER = ANGRA_MAINYU_ID;
