/**
 * The secret word to the hidden Angra Mainyu chapter (FFX-2 only; branch `ch-angra-mainyu`, 2026-10-14).
 *
 * Bailey adopted the chapter on 2026-10-07 (D-536: "Angra Mainyu (FFX-2, the Bikanel Desert superboss)") and on 2026-10-14 wrote, relayed by the driver: "Please work on finishing the unimplemented
 * chapters STAT". The driver's reading, recorded as his delegation: the chapter ships HIDDEN behind a typed word, as the Leblanc preview, the Experiment, Sinspawn Gui, Fayth, the Tourist Trap and
 * Valefor at Besaid do (`./leblancDoor.ts`, `./experimentDoor.ts`, `./mushroomDoor.ts`, `./faythDoor.ts`, `./daigoroDoor.ts`, `./valeforDoor.ts`), so he plays it when he wakes, and listing it on the board waits
 * for his word. **The word is `angra`**, hidden chapter number 26. It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select
 * (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no
 * sound and no sign. It settles on the frame after the last letter, which takes that letter's press (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word
 * is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/Input.ts` `KEY_MAP`, pinned by `tests/unit/angra-door.test.ts` with the real `Input`, the real board and the real title
 * screen): **A is `left`** (twice), **R is `r1`**, and N and G are bound to nothing. On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C) start the flow, plus B for the briefing; the
 * word is typed on the board, not there (and none of its letters is one of those). On the BOARD `r1` is ignored (the board answers left, right, up, down, confirm and cancel); the one letter that is a board
 * key, the A (`left`), is a later letter of a match at its last place and is **claimed by the word** (`WordDoor.continued`, the screen's `wordKey`: a later letter typed in time is swallowed, so it does not
 * move the cursor); the first A moves the cursor one step, as the first letter of `daigoro` (a `right`) and `fayth`'s are known to, and the board then leaves for the chapter. The last letter A is a `left`, which the
 * board's next frame (`opening`) consumes with every other press before party prep can see it; nothing latched is left for the prep screen to start the fight on. The R (`r1`) is one of the buttons of FF7's pad sequence
 * L1 R1 L1 R1 Select (`./secretDoor.ts`), which this word never completes (the matcher is per visit and the board is left on the word's last letter).
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts`
 * pins that no door's word begins with, ends with or contains another's, and that no word's end is another's beginning: `angra` ends in `a` (none of the other words starts with `a`, `ra`, `gra` or
 * `ngra`) and starts with `a` (none of them ends in `a`, `an`, `ang` or `angr`), so it overlaps `limit`, `leblanc`, `experiment`, `mushroom`, `fayth`, `daigoro`, `valefor` and the Biran and Yenke
 * lane's `gagazet` in no position. `tests/unit/angra-door.test.ts` runs the same rule with `gagazet` present.
 *
 * Game case: FFX-2 only (the chapter is FFX-2 Chapter 5's); the board and the door are shared plumbing.
 */
import { ANGRA_MAINYU_ID } from '../../../data/angra-mainyu-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Angra Mainyu chapter. */
export const ANGRA_DOOR_WORD = 'angra';

/** Where the word leads. */
export const ANGRA_DOOR_CHAPTER = ANGRA_MAINYU_ID;
