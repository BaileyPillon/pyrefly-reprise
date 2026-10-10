/**
 * The secret word to the hidden Sinspawn Gui chapter (FFX only; branch `ch-gui`, 2026-10-10).
 *
 * Bailey, 2026-10-10 (overnight): the new chapters ship hidden, as the experimental Leblanc chapter does (`./leblancDoor.ts`, "put the experimental new chapter in the live build but make it
 * hidden like you did with ff7 how i had to type limit at the main menu"); the driver's reading of his words is that the chapter opens by a typed word and gets no card until he says so.
 * The word is `mushroom`, for Mushroom Rock Road where the fight happens. It is the same `WordDoor` as FF7's "limit" and Leblanc's "leblanc": type the word on chapter select (any case, at
 * most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no
 * sign. It settles on the frame after the last letter, which takes that letter's press (the last M is the board's `select`, which party prep must not see: `ChapterSelectScreen.handleInput`).
 * The unlock is not remembered: the word is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/Input.ts` `KEY_MAP`, pinned by `tests/unit/mushroom-door.test.ts` with the real `Input`, the real board and the real
 * title screen): **M is `select`** (first and last letter), **S is `down`**, **R is `r1`**, and U, H and O are bound to nothing. On the TITLE screen only `confirm` (Enter, Space, Z) and `start`
 * (E, C) start the flow, plus B for the briefing: none is a letter of the word, so no letter typed there does anything. On the BOARD `select` and `r1` are ignored (the board answers
 * left, right, up, down, confirm and cancel), and the S of the word is claimed by the word (`WordDoor.continued`, `wordKey`) so it does not move the cursor. The first letter, M, can
 * never be a "later letter" of a match, so it is never swallowed or acted on by anything.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and pin that no door's word begins
 * another's (FF7's "limit", Leblanc's "leblanc", this one), or the shorter door would fire first.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { SINSPAWN_GUI_ID } from '../../../data/chapter-sinspawn-gui.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Sinspawn Gui chapter. */
export const MUSHROOM_DOOR_WORD = 'mushroom';

/** Where the word leads. */
export const MUSHROOM_DOOR_CHAPTER = SINSPAWN_GUI_ID;
