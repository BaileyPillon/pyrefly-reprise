/**
 * The secret word to the hidden Fayth chapter (FFX only; branch `fayth-3d`, 2026-10-10): Evrae on the Fahrenheit's deck with FFX's own battle camera.
 *
 * Bailey, 2026-10-10 (~15:00 EDT): "add as a new experimental chapter please that is hidden. with a code word i need to type in at the chapter select menu please." His pick (~15:15 EDT) was the word
 * `fayth`. It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`, `./leblancDoor.ts`, `./experimentDoor.ts`, `./mushroomDoor.ts`): type the word on
 * chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no
 * card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the
 * word is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/Input.ts` `KEY_MAP`, pinned by `tests/unit/fayth-door.test.ts` with the real `Input`, the real board and the real title
 * screen): **F is `l1`**, **A is `left`**, and Y, T and H are bound to nothing. On the BOARD the first F reaches the board as `l1`, which the board ignores (it answers left, right, up, down, confirm
 * and cancel) and which only starts FF7's pad sequence harmlessly (the next token, `left`, resets it); the A of the word is claimed by the word (`WordDoor.continued`, `wordKey`) so it does not move the
 * cursor; the last letter, H, is bound to nothing, so no press is left latched for party prep, and the `opening` frame consumes every button anyway. On the TITLE screen only `confirm` (Enter, Space, Z)
 * and `start` (E, C) start the flow, plus B for the briefing: no letter of `fayth` is one of them.
 *
 * **The word is not found in the board's text.** Chapter IX's card reads "Cavern of the Stolen Fayth", so a test must never look for `fayth` in the board; it asserts the chapter's id, the EXP numeral and the tile count.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `chapter-doors.test.ts` pins that no door's
 * word begins, ends with or contains another's, and that no word's end is another's beginning (or the shorter door would fire first, or two would fire on one run of letters).
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { EXP_FAYTH_ID } from '../../../data/ffx/exp-fayth-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Fayth chapter. */
export const FAYTH_DOOR_WORD = 'fayth';

/** Where the word leads. */
export const FAYTH_DOOR_CHAPTER = EXP_FAYTH_ID;
