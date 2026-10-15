/**
 * The secret word to the hidden Valefor at Besaid chapter (FFX-2 only; branch `ch-besaid-valefor`, 2026-10-14).
 *
 * Bailey, 2026-10-13 (chat, relayed by the driver): "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and Valefor at Besaid Temple." and "full speed ahead
 * while I sleep". The driver's reading, recorded as his delegation: the chapter ships HIDDEN behind a typed word, as the Leblanc preview, the Experiment, Sinspawn Gui and Fayth do
 * (`./leblancDoor.ts`, `./experimentDoor.ts`, `./mushroomDoor.ts`, `./faythDoor.ts`), so he plays it in the morning, and listing it on the board waits for his word. **The word is `valefor`**
 * (the driver's decision of 2026-10-14: the first pick, `besaid`, ended in a letter the Tourist Trap lane's word `daigoro` begins with, which the shared door rule forbids; `valefor` overlaps no other
 * word). It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong
 * letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last
 * letter, which takes that letter's press (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit. The board has no card for the
 * chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/Input.ts` `KEY_MAP`, pinned by `tests/unit/valefor-door.test.ts` with the real `Input`, the real board and the real
 * title screen): **V is `select`**, **A is `left`**, **E is `start`**, **F is `l1`**, **R is `r1`**, and L and O are bound to nothing. On the TITLE screen only `confirm` (Enter, Space, Z) and
 * `start` (E, C) start the flow, plus B for the briefing; the word is typed on the board, not there (the title advances on Enter and E, so a word cannot be typed on it). On the BOARD `select`,
 * `start`, `l1` and `r1` are ignored (the board answers left, right, up, down, confirm and cancel); the one letter that is a board key, the A (`left`), is a later letter of a match and is **claimed
 * by the word** (`WordDoor.continued`, the screen's `wordKey`: a later letter typed in time is swallowed, so it does not move the cursor); the last letter R is an `r1`, which the board's next frame
 * (`opening`) consumes with every other press before party prep can see it. Nothing latched is left for the prep screen to start the fight on. The F and the R (`l1`, then `r1` with a non-button
 * letter between) are two thirds of FF7's pad sequence L1 R1 L1 R1 Select (`./secretDoor.ts`), which this word never completes (the matcher is per visit and the board is left on the word's last
 * letter), and a `select` after them (the V of a second try) breaks it.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and
 * `tests/unit/chapter-doors.test.ts` pins that no door's word begins with, ends with or contains another's, and that no word's end is another's beginning: `valefor` ends in `r` (none of the other
 * words starts with `r`, `or`, `for`, `efor`, `lefor` or `alefor`) and starts with `v` (none of them ends in `v`, `va`, `val`, ...), so it overlaps `limit`, `leblanc`, `experiment`, `mushroom`, `fayth`
 * and the sibling lane's `daigoro` in no position. `tests/unit/valefor-door.test.ts` runs the same rule with `daigoro` present.
 *
 * Game case: FFX-2 only (the chapter is FFX-2 Chapter 3's); the board and the door are shared plumbing.
 */
import { VALEFOR_BESAID_ID } from '../../../data/chapter-ffx2-valefor-besaid.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Valefor at Besaid chapter. */
export const VALEFOR_DOOR_WORD = 'valefor';

/** Where the word leads. */
export const VALEFOR_DOOR_CHAPTER = VALEFOR_BESAID_ID;
