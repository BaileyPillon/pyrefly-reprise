/**
 * The secret word to the hidden Luca Opener chapter (FFX-2 only; branch `ch-luca-opener`, 2026-11-09): Logos and Ormi, then Leblanc, on the docks of Luca, the first fights of FFX-2's Chapter 1.
 *
 * Authority (relayed by the release driver, verbatim): 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-11-09 "Keep going please with everything you were doing". The chapter ships
 * HIDDEN behind a typed word, as the Leblanc preview, the Experiment, Valefor at Besaid, the Bevelle Guardians, Ifrit at Kilika and the others do (`./leblancDoor.ts`, `./experimentDoor.ts`, `./valeforDoor.ts`,
 * `./drillshotDoor.ts`, `./ifritDoor.ts`), so he plays it; listing it on the board waits for his word. **The word is `debut`** (the first fights of the game; the program plan's pick for row 52, section 8, checked against
 * every word on the table and every word the plan reserves), hidden chapter number 52. It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select
 * (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on
 * the frame after the last letter, which takes that letter's press (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit. The board has no card for the
 * chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/inputKeyMap.ts` `KEY_MAP`, pinned by `tests/unit/debut-door.test.ts` with the real `Input`, the real board and the real title screen): **D is
 * `right`** (the first letter moves the cursor one step, as `daigoro`'s and `duelist`'s do), **E is `start`**, and B, U and T are bound to nothing. On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C) start
 * the flow, plus B for the briefing; the word is typed on the board, not there. The last letter T is bound to nothing, so no latched press is left for the party prep to start the fight on.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no door's word
 * begins with, ends with or contains another's, and that no word's end is another's beginning: `debut` starts with `d` and ends with `t` (no other word begins with `t`, `ut`, `but`, ...), and contains none of the others.
 *
 * Game case: FFX-2 only (the chapter is FFX-2 Chapter 1's); the board and the door are shared plumbing.
 */
import { LUCA_OPENER_ID } from '../../../data/luca-opener-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Luca Opener chapter. */
export const DEBUT_DOOR_WORD = 'debut';

/** Where the word leads. */
export const DEBUT_DOOR_CHAPTER = LUCA_OPENER_ID;
