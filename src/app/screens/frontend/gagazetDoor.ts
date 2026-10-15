/**
 * The secret word to the hidden Biran and Yenke chapter (FFX only; branch `ch-biran-yenke`, 2026-10-14).
 *
 * Bailey, 2026-10-07 (D-536) and 2026-10-14 (chat, relayed by the driver): "Biran and Yenke Ronso (FFX, Kimahri's solo trial)" and "Please work on finishing the unimplemented chapters STAT". The driver's
 * decisions: the chapter ships HIDDEN behind a typed word, as the Leblanc preview, the Experiment, Sinspawn Gui, Fayth, the Tourist Trap and Valefor at Besaid do (`./leblancDoor.ts`, `./experimentDoor.ts`,
 * `./mushroomDoor.ts`, `./faythDoor.ts`, `./daigoroDoor.ts`, `./valeforDoor.ts`), so he plays it, and listing it on the board waits for his word. **The word is `gagazet`**, for the mountain. It is the
 * same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key
 * the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/Input.ts` `KEY_MAP`, pinned by `tests/unit/gagazet-door.test.ts` with the real `Input`, the real board and the real title screen):
 * **G is bound to nothing**, **A is `left`**, **Z is `confirm`**, **E is `start`**, **T is bound to nothing**. The two letters that are board keys are later letters of a match and are **claimed by the word**
 * (`WordDoor.continued`, the screen's `wordKey`, which consumes `left`, `right`, `up`, `down`, `confirm` and `cancel`): the A never moves the cursor, and **the Z never opens the card the cursor stands on**
 * (this is the first door with a `confirm` letter; the test types the word with a card selected and asserts that no chapter but this one opens). `start` is ignored by the board. The last letter T is bound to
 * nothing and the board's next frame (`opening`) consumes every press before party prep can see it, so nothing latched is left for the prep screen. On the TITLE screen Enter, Space, Z (`confirm`) and E, C (`start`)
 * advance the flow, so a word with a Z and an E cannot be typed there: it is typed on the board, as the others are. The word shares no letter with FF7's pad sequence L1 R1 L1 R1 Select (F, R, V, M), which it
 * never starts.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no
 * door's word begins with, ends with or contains another's, and that no word's end is another's beginning: `gagazet` ends in `t` (none of `limit`, `leblanc`, `experiment`, `mushroom`, `fayth`, `daigoro`,
 * `valefor` begins with `t`, `et`, `zet`, `azet`, `gazet` or `agazet`) and begins with `g` (none ends in `g`, `ga`, `gag`, `gaga`, `gagaz` or `gagaze`), so it overlaps no word in any position.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { BIRAN_YENKE_ID } from '../../../data/ffx/biran-yenke-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Biran and Yenke chapter. */
export const GAGAZET_DOOR_WORD = 'gagazet';

/** Where the word leads. */
export const GAGAZET_DOOR_CHAPTER = BIRAN_YENKE_ID;
