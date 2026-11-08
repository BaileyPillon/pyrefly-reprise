/**
 * The secret word to the hidden Ifrit at Kilika Temple chapter (FFX-2 only; branch `ch-ifrit-kilika`, 2026-11-07): the second Chapter 3 temple mission, "Pest Control".
 *
 * Authority (relayed by the release driver, verbatim): "implement all unimplemented chapters please" (2026-11-06), "yes on all these too" and 2026-11-07 "ok keep going we have full usage here". The driver's decision: the
 * chapter ships HIDDEN behind a typed word, as Valefor at Besaid and the others do (`./valeforDoor.ts`, `./wraithDoor.ts`, `./drillshotDoor.ts`), so he plays it, and listing it on the board waits for his word. **The word is
 * `ifrit`** (the program plan's pick, section 8, checked against the table of doors; the chapter is "Ifrit at Kilika Temple", hidden chapter number 46). It is the same `WordDoor` as FF7's "limit" and the other hidden chapters'
 * words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on
 * the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered:
 * the word is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/inputKeyMap.ts` `KEY_MAP`, pinned by `tests/unit/ifrit-door.test.ts` with the real `Input`, the real board and the real title screen): **F is `l1`**,
 * **R is `r1`**, and I and T are bound to nothing. On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C) start the flow, plus B for the briefing; the word is typed on the board, not there, and none of
 * its letters is one of those. On the BOARD `l1` and `r1` are ignored (it answers left, right, up, down, confirm and cancel), so no letter of the word moves the cursor or opens a card. The last letter T is bound to
 * nothing, so no latched press is left for the party prep to start the fight on. The F and the R (`l1`, then `r1`) are the first two buttons of FF7's pad sequence L1 R1 L1 R1 Select (`./secretDoor.ts`), which this word never
 * completes (it has no Select, and the matcher is per visit and the board is left on the word's last letter).
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no door's word
 * begins with, ends with or contains another's, and that no word's end is another's beginning: `ifrit` starts with `i` (no other word ends in `i`, `if`, `ifr`, ...) and ends with `t` (no word begins with `t`, `it`,
 * `rit`, ...), and it contains none of the others.
 *
 * Game case: FFX-2 only (the chapter is FFX-2 Chapter 3's); the board and the door are shared plumbing.
 */
import { IFRIT_KILIKA_ID } from '../../../data/chapter-ffx2-ifrit-kilika.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Ifrit at Kilika Temple chapter. */
export const IFRIT_DOOR_WORD = 'ifrit';

/** Where the word leads. */
export const IFRIT_DOOR_CHAPTER = IFRIT_KILIKA_ID;
