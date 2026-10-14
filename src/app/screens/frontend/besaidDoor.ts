/**
 * The secret word to the hidden Valefor at Besaid chapter (FFX-2 only; branch `ch-besaid-valefor`, 2026-10-14).
 *
 * Bailey, 2026-10-13 (chat, relayed by the driver): "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and Valefor at Besaid Temple." and "full speed ahead
 * while I sleep". The driver's reading, recorded as his delegation: the chapter ships HIDDEN behind a typed word, as the Leblanc preview, the Experiment, Sinspawn Gui and Fayth do
 * (`./leblancDoor.ts`, `./experimentDoor.ts`, `./mushroomDoor.ts`, `./faythDoor.ts`), so he plays it in the morning, and listing it on the board waits for his word; the word is `besaid`, for
 * the temple. It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between
 * letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the
 * frame after the last letter, which takes that letter's press (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit. The board
 * has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/Input.ts` `KEY_MAP`, pinned by `tests/unit/besaid-door.test.ts` with the real `Input`, the real board and the real
 * title screen): **E is `start`**, **S is `down`**, **A is `left`**, **D is `right`**, and B and I are bound to nothing. On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C)
 * start the flow, plus B for the briefing; the word is typed on the board, not there (the title advances on Enter and E, so a word cannot be typed on it). On the BOARD the first letter B does
 * nothing and `start` (the E) is ignored (the board answers left, right, up, down, confirm and cancel); the later letters S, A and D are board keys (down, left, right) and are **claimed by the
 * word** (`WordDoor.continued`, the screen's `wordKey`: a later letter of a match typed in time is swallowed, so none moves the cursor); the last letter D is a `right`, which the board's next frame
 * (`opening`) consumes with every other press before party prep can see it. Nothing latched is left for the prep screen to start the fight on.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and
 * `tests/unit/chapter-doors.test.ts` pins that no door's word begins with, ends with or contains another's, and that no word's end is another's beginning.
 *
 * **Merge note (the driver's).** The sibling lane's word `daigoro` (branch `ch-tourist-trap`) does not begin with, end with or contain `besaid`, and `besaid` none of it. The shared rule also forbids
 * any *overlap* (the last k letters of one word equalling the first k of another): the last letter of `besaid`, `d`, is the first of `daigoro`, a one-letter overlap, so that shared test will fail
 * when the two lanes meet, on the pair (`besaid`, `daigoro`). `tests/unit/besaid-door.test.ts` states the overlap as a computed fact. The decision (relax the rule to overlaps of two or more letters,
 * or move one word) is the driver's.
 *
 * Game case: FFX-2 only (the chapter is FFX-2 Chapter 3's); the board and the door are shared plumbing.
 */
import { VALEFOR_BESAID_ID } from '../../../data/chapter-ffx2-valefor-besaid.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Valefor at Besaid chapter. */
export const BESAID_DOOR_WORD = 'besaid';

/** Where the word leads. */
export const BESAID_DOOR_CHAPTER = VALEFOR_BESAID_ID;
