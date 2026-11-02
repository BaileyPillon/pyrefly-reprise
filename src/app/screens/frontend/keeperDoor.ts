/**
 * The secret word to the hidden Spectral Keeper chapter (FFX only; branch `ch-keeper`, 2026-11-02).
 *
 * Bailey, 2026-10-18, picked "Spectral Keeper + Fallen Maesters (Recommended)" (D-1039: "a build behind a hidden word") and, 2026-11-02, "i'll go with all of your recommendations please implement all the unimplemented
 * chapters that i decided on". The driver's decisions: the chapter ships HIDDEN behind a typed word, as the Leblanc preview, the Experiment, Sinspawn Gui, Fayth, the Tourist Trap, Valefor at Besaid, Biran and Yenke,
 * Angra Mainyu and the Last Summoning do, so he plays it, and listing it on the board waits for his word (preflight SK9). **The word is `keeper`** (a house detail the preflight delegates), hidden chapter number 29.
 * It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the
 * board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit.
 *
 * Which letters are bound (checked against `app/inputKeyMap.ts`, pinned by `tests/unit/chapters/spectral-keeper-door.test.ts` with the real `Input` and the real board): K and P are bound to nothing, **E is `start`**
 * (three times) and **R is `r1`**. The first letter K is a board key's neighbour and nothing else; the later letters are claimed by the word (`WordDoor.continued`, the screen's `wordKey`), so the board leaves their presses
 * alone. The last letter R is `r1`, and the board's next frame (`opening`) consumes every press before party prep can see it, so nothing latched is left for the prep screen to start the fight on (as `daigoro`'s R and `leblanc`'s C). `tests/unit/chapter-doors.test.ts` pins that no door's word begins with, ends with or contains another's, and
 * that no word's end is another's beginning: `keeper` begins with `k` (none of the other words ends in `k`) and ends in `r` (none begins with `r`, and `er` or `per` begin no word either: `experiment` begins `ex`), so it overlaps no word in any position.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { SPECTRAL_KEEPER_CHAPTER_ID } from '../../../data/ffx/spectral-keeper-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Spectral Keeper chapter. */
export const KEEPER_DOOR_WORD = 'keeper';

/** Where the word leads. */
export const KEEPER_DOOR_CHAPTER = SPECTRAL_KEEPER_CHAPTER_ID;
