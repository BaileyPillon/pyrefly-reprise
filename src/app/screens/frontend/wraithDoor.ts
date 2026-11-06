/**
 * The secret word to the hidden Yuna's Ballad chapter (FFX-2 only; branch `ch-yunas-ballad`, 2026-11-06): Yuna alone against the possessed Rikku and then the possessed Paine, the Den of Woe's first two fights.
 *
 * Bailey, 2026-11-06 ~00:30 EST, "implement all unimplemented chapters please", and ~00:55 EST, "yes on all these too" (to building every researched boss he never picked). The driver's decision: the chapter ships
 * HIDDEN behind a typed word, as the Fallen Maesters and the others do (`./maestersDoor.ts`, `./angraDoor.ts`, `./valeforDoor.ts`, `./daigoroDoor.ts`), so he plays it, and listing it on the board waits for his word
 * (preflight YB10). **The word is `wraith`** (the program plan's pick, section 8, checked against the table of doors; the chapter is "Yuna's Ballad", hidden chapter number 40). It is the same `WordDoor` as FF7's
 * "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow,
 * resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press (`ChapterSelectScreen.handleInput`, the
 * `opening` frame). The unlock is not remembered: the word is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/inputKeyMap.ts` `KEY_MAP`, pinned by `tests/unit/wraith-door.test.ts` with the real `Input`, the real board and the real title screen):
 * **W is `up`**, **R is `r1`**, **A is `left`**, and I, T and H are bound to nothing. On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C) start the flow, plus B for the briefing; the word is typed on
 * the board, not there, and none of its letters is one of those. On the BOARD `r1` is ignored (it answers left, right, up, down, confirm and cancel); the first W (`up`) moves the cursor one step, as the first letter of
 * `summon` (a `down`), `daigoro` (a `right`) and `fayth`'s are known to, and the board then leaves for the chapter; the A (`left`) is a later letter of a match and is **claimed by the word** (`WordDoor.continued`,
 * the screen's `wordKey`: a later letter typed in time is swallowed, so it does not move the cursor). The last letter H is bound to nothing, so no latched press is left for the party prep to start the fight on. The R
 * (`r1`) is one of the buttons of FF7's pad sequence L1 R1 L1 R1 Select (`./secretDoor.ts`), which this word never completes (it has no F, and the matcher is per visit).
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no door's word
 * begins with, ends with or contains another's, and that no word's end is another's beginning: `wraith` starts with `w` (no other word ends in `w`, `wr`, `wra`, ...) and ends with `h` (no word begins with `h`, `th`,
 * `ith`, ...), and it contains none of the others.
 *
 * Game case: FFX-2 only (the chapter is FFX-2's, the Den of Woe's opening duels); the board and the door are shared plumbing.
 */
import { YUNAS_BALLAD_ID } from '../../../data/yunas-ballad-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Yuna's Ballad chapter. */
export const WRAITH_DOOR_WORD = 'wraith';

/** Where the word leads. */
export const WRAITH_DOOR_CHAPTER = YUNAS_BALLAD_ID;
