/**
 * The secret word to the hidden Tourist Trap chapter (FFX-2 only; branch `ch-tourist-trap`, 2026-10-14): Yojimbo and Daigoro in the Cavern of the Stolen Fayth, the optional mission.
 *
 * Bailey, 2026-10-13/14: "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and Valefor at Besaid Temple." and "full speed ahead while I sleep"; the
 * driver's decision: the chapter ships HIDDEN behind a typed word, hidden chapter number 23, and listing it on the board waits for his word. It is the same `WordDoor` as the other hidden
 * chapters' words (`./secretDoor.ts`, `./leblancDoor.ts`, `./experimentDoor.ts`, `./mushroomDoor.ts`, `./faythDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between
 * letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the
 * frame after the last letter (`ChapterSelectScreen.handleInput`, the `opening` frame), which takes that letter's press. The unlock is not remembered: the word is typed on each visit.
 *
 * **Why "daigoro" is safe to type on the board** (checked against `app/Input.ts` `KEY_MAP`, pinned by `tests/unit/daigoro-door.test.ts` with the real `Input`, the real board and the real title
 * screen): three of its letters are bound: **D is `right`**, **A is `left`**, **R is `r1`**; I, G and O are bound to nothing. The first letter D reaches the board as a press of `right`: a first
 * letter cannot be claimed in advance (the board cannot know a word is coming), so the cursor takes one step, and the board then leaves for the chapter, so it is harmless (and it is what any
 * player typing a D would get). The A and the R are later letters of a live match and are claimed by the word (`WordDoor.continued`, the screen's `wordKey`), so the A does not move the cursor
 * and the R is not a board action anyway. The last letter, O, is bound to nothing, so no press is left latched for party prep (F393-03), and the `opening` frame consumes every button anyway.
 * On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C) start the flow, plus B for the briefing: no letter of `daigoro` is one of them.
 *
 * **The word is not found in the board's text.** The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in; Chapter IX's card reads "Cavern of the Stolen Fayth", but
 * no test looks for the word in the board's text. A test asserts the chapter's id, the EXP numeral and the tile count.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `chapter-doors.test.ts` pins that no
 * door's word begins, ends with or contains another's, and that no word's end is another's beginning (or the shorter door would fire first, or two would fire on one run of letters).
 *
 * Game case: FFX-2 only (the chapter is FFX-2's); the board and the door are shared plumbing.
 */
import { TOURIST_TRAP_ID } from '../../../data/tourist-trap-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Tourist Trap chapter. */
export const DAIGORO_DOOR_WORD = 'daigoro';

/** Where the word leads. */
export const DAIGORO_DOOR_CHAPTER = TOURIST_TRAP_ID;
