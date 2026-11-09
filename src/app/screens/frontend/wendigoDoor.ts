/**
 * The secret word to the hidden Wendigo chapter (FFX only; branch `ch-wendigo`, 2026-11-06): Wendigo and its two Guado Guardians on frozen Lake Macalania, the Meshy 3D tech demo.
 *
 * Bailey, 2026-11-06: "make 1 brand new chapter using meshy extensively please", then "like a tech demo". The word is a **driver pick, his to overturn** (his blanket words of 2026-10-31 and 2026-11-06 leave the picks to the
 * driver; the paper preflight's CW1): `wendigo`, the monster's own name, hidden chapter number 49. It is the same `WordDoor` as the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any
 * case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles
 * on the frame after the last letter, which takes that letter's press (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit. The board has no card for
 * the chapter (`chapterGrid.ts`), so nothing else leads in. On a phone the same word is typed in the long-press field (`./doorField.ts`), which feeds the same matcher. **The chapter is desktop-only** (driver decision
 * 219q, 2026-11-03, for the two hidden 3D chapters; the anime chapter was the third and this the fourth, with the same textures): on the phone tier (`ArtDevice.deviceClass() === 'phone'`) the door stays shut through the
 * table's `gate` (`./chapterDoors.ts` `desktopOnly`).
 *
 * Which letters are bound (checked against `app/inputKeyMap.ts` `KEY_MAP`, pinned by `tests/unit/chapters/wendigo-door.test.ts` with the real `Input` and the real board): see that test, which reads the real key map. The
 * first letter W is `up`, which the board answers, so the word's first letter is the board's own press for a moment; the later letters that are board keys (E `start`, D `right`) are claimed by the word
 * (`WordDoor.continued`, the screen's `wordKey`), so they do not move the cursor. `tests/unit/chapter-doors.test.ts` pins that no door's word begins with, ends with or contains another's, and that no word's end is
 * another's beginning: `wendigo` begins with `w` (the doors that begin with `w`, `waker` and `wraith`, end in `r` and `h`) and ends in `o`, and no other word begins with `o`.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal.
 *
 * Game case: FFX only (the chapter is FFX's); the board and the door are shared plumbing.
 */
import { WENDIGO_CHAPTER_ID } from '../../../data/ffx/wendigo-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Wendigo chapter. */
export const WENDIGO_DOOR_WORD = 'wendigo';

/** Where the word leads. */
export const WENDIGO_DOOR_CHAPTER = WENDIGO_CHAPTER_ID;
