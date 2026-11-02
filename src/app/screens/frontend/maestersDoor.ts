/**
 * The secret word to the hidden Fallen Maesters chapter (FFX-2 only; branch `ch-maesters`, 2026-11-02): the four fixed fights of the Via Infinito, floors 20, 40, 60 and 80.
 *
 * Bailey chose the chapter on 2026-10-18 (D-1039: "Spectral Keeper + Fallen Maesters (Recommended)") and on 2026-11-02 wrote, relayed by the release driver: "i'll go with all of your recommendations please
 * implement all the unimplemented chapters that i decided on". The chapter ships HIDDEN behind a typed word (FM11), as the Leblanc preview, the Experiment, Sinspawn Gui, Fayth, the Tourist Trap, Valefor at Besaid and
 * Angra Mainyu do (`./leblancDoor.ts`, `./experimentDoor.ts`, `./mushroomDoor.ts`, `./faythDoor.ts`, `./daigoroDoor.ts`, `./valeforDoor.ts`, `./angraDoor.ts`); listing it on the board waits for his word. **The word is
 * `infinito`** (the dungeon's name), the driver's pick (FM11: "the word is a house detail"); hidden chapter number 30. It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type
 * the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no
 * sound and no sign. It settles on the frame after the last letter, which takes that letter's press (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each
 * visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/inputKeyMap.ts` `KEY_MAP`, pinned by `tests/unit/maesters-door.test.ts` with the real `Input`, the real board and the real title screen): **only F is
 * a bound key (`l1`)**; I, N, T and O are bound to nothing. The first letter, I, moves nothing on the board. The F is a later letter of a match and is **claimed by the word** (`WordDoor.continued`, the screen's `wordKey`),
 * and `l1` is ignored by the board anyway (it answers left, right, up, down, confirm and cancel). On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C) start the flow, plus B for the briefing; the word is
 * typed on the board, not there, and none of its letters is one of those. The last letter O is bound to nothing, so no latched press is left for the party prep to start the fight on. F is one of the buttons of FF7's pad
 * sequence L1 R1 L1 R1 Select (`./secretDoor.ts`), which this word never completes (the matcher is per visit and the board is left on the word's last letter).
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no door's word
 * begins with, ends with or contains another's, and that no word's end is another's beginning: `infinito` starts with `i` (no other word ends in `i`, `in`, `inf`, ...) and ends with `o` (no word begins with `o`, `to`,
 * `ito`, ...), and it contains none of the others.
 *
 * Game case: FFX-2 only (the chapter is FFX-2's, Chapter 5's optional dungeon); the board and the door are shared plumbing.
 */
import { FALLEN_MAESTERS_ID } from '../../../data/fallen-maesters-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Fallen Maesters chapter. */
export const MAESTERS_DOOR_WORD = 'infinito';

/** Where the word leads. */
export const MAESTERS_DOOR_CHAPTER = FALLEN_MAESTERS_ID;
