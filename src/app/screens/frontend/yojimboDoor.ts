/**
 * The secret word to the hidden Mirror Aeons chapter (FFX only; branch `ch-mirror-aeons`, 2026-10-15).
 *
 * Bailey, 2026-10-15 (chat, relayed by the driver): "we definitely need an awesome chapter built with yojimbo AND magus sisters ..." and "i like the mirror match". The driver's decisions: the chapter ships HIDDEN behind a
 * typed word, as the Leblanc preview, the Experiment, Sinspawn Gui, Fayth, the Tourist Trap, Valefor at Besaid, Biran and Yenke and Angra Mainyu do (`./leblancDoor.ts`, `./experimentDoor.ts`, `./mushroomDoor.ts`,
 * `./faythDoor.ts`, `./daigoroDoor.ts`, `./valeforDoor.ts`, `./gagazetDoor.ts`, `./angraDoor.ts`), and listing it on the board waits for his word. **The word is `yojimbo`**, hidden chapter number 27. It is the same
 * `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board
 * answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * **Why not `zanmato`** (the brief's suggestion, Yojimbo's Overdrive). Its first letter is Z, and Z is `confirm` in `app/Input.ts` `KEY_MAP`. The first letter of a word is never claimed from the board
 * (`WordDoor.continued` is true only from the second letter on; `tests/unit/chapter-doors.test.ts` pins "the first letter is never claimed"), so the first press would open whichever card the cursor stands on.
 * `gagazet`'s Z is its fourth letter and is claimed. Making a first-letter confirm safe would change the board's shared input, which this chapter does not.
 *
 * Which letters are bound, and why `yojimbo` is safe (checked against `app/Input.ts` `KEY_MAP`, pinned by `tests/unit/yojimbo-door.test.ts` with the real `Input`, the real board and the real title screen): **Y, O, J,
 * I and B are bound to nothing**, and **M is `select`**. The one board key, the M, is a later letter and is **claimed by the word** (`WordDoor.continued`, the screen's `wordKey`); `select` is ignored by the board anyway.
 * The first letter Y is bound to nothing, so a first press moves nothing. The last letter O is bound to nothing, and the board's next frame (`opening`) consumes every press before party prep can see it; nothing
 * latched is left for the prep screen to start the fight on. On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C) advance the flow, plus B for the briefing; the word is typed on the board, not there.
 * The M is one of the buttons of FF7's pad sequence L1 R1 L1 R1 Select (`./secretDoor.ts`) only by its mapping to `select`; the matcher is per visit and this word never completes the sequence.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no door's
 * word begins with, ends with or contains another's, and that no word's end is another's beginning: `yojimbo` ends in `o` (none of `limit`, `leblanc`, `experiment`, `mushroom`, `fayth`, `daigoro`, `valefor`,
 * `gagazet`, `angra` begins with `o`, `bo`, `mbo`, `imbo`, `jimbo` or `ojimbo`) and begins with `y` (none ends in `y`, `yo`, `yoj`, `yoji`, `yojim` or `yojimb`), so it overlaps all nine in no position.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { MIRROR_AEONS_ID } from '../../../data/ffx/mirror-aeons-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Mirror Aeons chapter. */
export const YOJIMBO_DOOR_WORD = 'yojimbo';

/** Where the word leads. */
export const YOJIMBO_DOOR_CHAPTER = MIRROR_AEONS_ID;
