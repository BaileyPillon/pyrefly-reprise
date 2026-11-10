/**
 * The secret word to the hidden Gullwings, Chapter 1 chapter (FFX-2 only; branch `ch-gullwings-ch1`, 2026-11-09): the four hotspot missions of the Gullwings' first chapter, Boris at the Floating Ruins, the Flame Dragon in
 * Besaid's cave, the Guardian Beast in the Zanarkand Ruins and YSLS-Zero at Kilika's approach.
 *
 * Authority (relayed by the release driver, verbatim): 2026-11-09 "Keep going please with everything you were doing"; 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too". The driver's
 * decision: the chapter ships HIDDEN behind a typed word, as the Bevelle Guardians and the others do (`./drillshotDoor.ts`, `./ifritDoor.ts`), so he plays it, and listing it on the board waits for his word. **The word is
 * `dragon`** (the program plan's pick, wave 5, re-checked 2026-11-09 against the 29 words on `origin/main` and the words the plan reserves; the chapter is "Gullwings, Chapter 1", hidden chapter number 51; the alternative is
 * `boris`). It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a
 * key the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/inputKeyMap.ts` `KEY_MAP`, pinned by `tests/unit/dragon-door.test.ts` with the real `Input`, the real board and the real title screen): **D is
 * `right`**, **R is `r1`**, **A is `left`**, and G, O and N are bound to nothing. On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C) start the flow, plus B for the briefing; the word is typed on the
 * board, not there, and none of its letters is one of those. On the BOARD `r1` is ignored, so the R moves nothing; **the first letter D is the board's `right` key, so the cursor takes ONE step for it** (a first letter cannot be
 * claimed: the board cannot know a word has begun, as `daigoro`'s and `drillshot`'s first D); **the later A is claimed by the word** (`KeyFeed.claimed`, the screen's `wordKey`), so it does not move the cursor again. The last
 * letter N is bound to nothing, so no latched press is left for the party prep to start the fight on. The R (`r1`) is the second button of FF7's pad sequence L1 R1 L1 R1 Select (`./secretDoor.ts`), which this word never
 * completes (it has no L1 before it and no Select, and the matcher is per visit).
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no door's word
 * begins with, ends with or contains another's, and that no word's end is another's beginning: `dragon` starts with `d` (no other word ends in `d`, `dr`, `dra`, ...) and ends with `n` (no word begins with `n`, `on`,
 * `gon`, ...), and it contains none of the others.
 *
 * Game case: FFX-2 only (the chapter is FFX-2 Chapter 1's); the board and the door are shared plumbing.
 */
import { GULLWINGS_CH1_ID } from '../../../data/gullwings-ch1-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Gullwings, Chapter 1 chapter. */
export const DRAGON_DOOR_WORD = 'dragon';

/** Where the word leads. */
export const DRAGON_DOOR_CHAPTER = GULLWINGS_CH1_ID;
