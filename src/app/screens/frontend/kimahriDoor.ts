/**
 * The secret word to the hidden Biran and Yenke chapter (FFX only; 2026-10-15).
 *
 * Bailey, 2026-10-15, verbatim: "Implement the unimplemented chapters please." and "Implement the unimplemented chapters end-to-end please. It needs to be a finished product." The chapter
 * ships HIDDEN behind a typed word, as the other hidden chapters do (`./leblancDoor.ts`, `./experimentDoor.ts`, `./mushroomDoor.ts`, `./faythDoor.ts`, `./daigoroDoor.ts`,
 * `./valeforDoor.ts`), and listing it on the board waits for his word after he has played it (D-848). **The word is `kimahri`**: the duel is his alone. It is the same `WordDoor` as the
 * others (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers resets silently) and the
 * board settles on the chapter on the frame after the last letter, with no card, no sound and no sign. The unlock is not remembered.
 *
 * Which letters are bound, and why the word is safe (checked against `app/Input.ts` `KEY_MAP`, pinned by `tests/unit/kimahri-door.test.ts` with the real `Input`, the real board and the real
 * title screen): **K, I and H are bound to nothing**, **M is `select`**, **A is `left`**, **R is `r1`**. The first letter, K, is no board key, so starting the word never moves the cursor; the
 * one later letter the board answers, the A (`left`), is **claimed by the word** (`WordDoor.continued`); M and R are keys the board ignores; and the last letter, I, is bound to nothing,
 * so no press is left latched for party prep. On the TITLE screen only `confirm` and `start` start the flow (and B the briefing): none of the word's letters does. The M and R (`select`, then
 * `r1`) are never FF7's pad sequence L1 R1 L1 R1 Select in order.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). `tests/unit/chapter-doors.test.ts` pins that no door's word begins with, ends with
 * or contains another's, and that no word's end is another's beginning: `kimahri` starts with `k` (no other word ends in `k`, `ki`, `kim`, ...) and ends in `i` (no other word starts with
 * `i`, `ri`, `hri`, ...).
 *
 * Game case: FFX only (Kimahri's duel); the board and the door are shared plumbing.
 */
import { BIRAN_YENKE_ID } from '../../../data/ffx/biran-yenke-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Biran and Yenke chapter. */
export const KIMAHRI_DOOR_WORD = 'kimahri';

/** Where the word leads. */
export const KIMAHRI_DOOR_CHAPTER = BIRAN_YENKE_ID;
