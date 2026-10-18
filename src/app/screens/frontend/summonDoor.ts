/**
 * The secret word to the hidden Last Summoning chapter (FFX only; branch `ch-last-summoning`, 2026-10-15).
 *
 * Bailey, 2026-10-15, verbatim: "we definitely need an awesome chapter built with yojimbo AND magus sisters ... the most epic encounter ever!!!!!!!!!" and "I'll go with all your recommendations I like the last
 * summoning". The driver's decisions: the chapter ships HIDDEN behind a typed word, as the Leblanc preview, the Experiment, Sinspawn Gui, Fayth, the Tourist Trap, Valefor at Besaid, Biran and Yenke and Angra Mainyu do
 * (`./leblancDoor.ts`, `./experimentDoor.ts`, `./mushroomDoor.ts`, `./faythDoor.ts`, `./daigoroDoor.ts`, `./valeforDoor.ts`, `./gagazetDoor.ts`, `./angraDoor.ts`), so he plays it, and listing it on the board waits for his
 * word. **The word is `summon`**, hidden chapter number 28. It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most
 * `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the
 * frame after the last letter, which takes that letter's press (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit. The board has no card for the
 * chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/Input.ts` `KEY_MAP`, pinned by `tests/unit/summon-door.test.ts` with the real `Input`, the real board and the real title screen):
 * **S is `down`**, U is bound to nothing, **M is `select`** (twice), O and N are bound to nothing. On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C) start the flow, plus B for the briefing; the word
 * is typed on the board, not there (and none of its letters is one of those). On the BOARD the first S is a `down` and moves the cursor one step, as the first letter of `daigoro` (a `right`) and `fayth`'s are known to,
 * and the board then leaves for the chapter; `select` is ignored by the board, and both M's are later letters of a match, **claimed by the word** (`WordDoor.continued`, the screen's `wordKey`). The last letter N is
 * bound to nothing, and the board's next frame (`opening`) consumes every press before party prep can see it, so nothing latched is left for the prep screen to start the fight on. The M is also one of the buttons of
 * FF7's pad sequence L1 R1 L1 R1 Select (`./secretDoor.ts`), which this word never completes (it has no R and no F, and the matcher is per visit).
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no door's word
 * begins with, ends with or contains another's, and that no word's end is another's beginning. `summon` begins with `s`, and none of `limit`, `leblanc`, `experiment`, `mushroom`, `fayth`, `daigoro`, `valefor`,
 * `gagazet`, `angra` or `yojimbo` ends in `s`, `su`, `sum`, `summ` or `summo`; it ends with `n`, and none of them begins with `n`, `on`, `mon`, `mmon` or `ummon`: so it overlaps no word in any position. The Dark Mirror
 * lane's `yojimbo` (chapter 27) is not in this tree yet; `tests/unit/summon-door.test.ts` names it and proves the pair, so it is proved before the two lanes merge.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { LAST_SUMMONING_ID } from '../../../data/ffx/last-summoning-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Last Summoning chapter. */
export const SUMMON_DOOR_WORD = 'summon';

/** Where the word leads. */
export const SUMMON_DOOR_CHAPTER = LAST_SUMMONING_ID;
