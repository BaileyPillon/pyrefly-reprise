/**
 * The secret word to the hidden anime chapter (FFX-2 only; branch `ch-anime`, 2026-11-06): hidden chapter 24's Valefor fight drawn in an anime cel-shaded style (the Genshin Impact / Guilty Gear Strive manner).
 *
 * Bailey, 2026-10-22: "make a genshin / guilty gear version of the chapter". The word is a **driver pick, his to overturn** (his blanket words of 2026-10-31 and 2026-11-06 leave the picks to the driver): `gear`, the
 * second half of the second of the two names (the first, `genshin`, fails the door rule: its last two letters are the first two of `infinito`, so the board would have fired one word on the end of the other). It is the same
 * `WordDoor` as the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as
 * an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in. On a
 * phone the same word is typed in the long-press field (`./doorField.ts`), which feeds the same matcher. **The chapter is desktop-only** (driver decision 219q, 2026-11-03, for the two hidden 3D chapters; this one is
 * the third and has the same textures): on the phone tier (`ArtDevice.deviceClass() === 'phone'`) the door stays shut through the table's `gate` (`./chapterDoors.ts` `desktopOnly`).
 *
 * Which letters are bound, and why the word is safe (checked against `app/inputKeyMap.ts` `KEY_MAP`, pinned by `tests/unit/anime-door.test.ts` with the real `Input`, the real board and the real title screen):
 * **G is bound to nothing**, **E is `start`**, **A is `left`**, **R is `r1`**: the same shape as `waker` (W up, A left, K nothing, E start, R r1). On the BOARD the first letter G does nothing at all; the A (`left`) is a
 * later letter of a match and is **claimed by the word** (`WordDoor.continued`, the screen's `wordKey`), so it does not move the cursor; `start` and `r1` are ignored by the board; the last letter R is an `r1`, which the
 * board's next frame (`opening`) consumes with every other press before party prep can see it. Nothing latched is left for the prep screen to start the fight on. On the TITLE screen only `confirm` and `start` start the
 * flow, so the word is typed on the board, never there (its E starts the flow on the title, as the E of "valefor" and "experiment" does).
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no door's word begins
 * with, ends with or contains another's, and that no word's end is another's beginning: `gear` begins with `g` (no other word ends in `g`, `ge` or `gea`) and ends in `r` (no other word begins with `r`, `ar`, `ear` or
 * `gear`), so it overlaps none of `limit`, `leblanc`, `experiment`, `mushroom`, `fayth`, `daigoro`, `valefor`, `gagazet`, `angra`, `yojimbo`, `summon`, `keeper`, `infinito`, `yrp`, `waker` in any position.
 *
 * Game case: FFX-2 only (the chapter is hidden chapter 24's Valefor fight); the board and the door are shared plumbing.
 */
import { EXP_ANIME_ID } from '../../../data/anime-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden anime chapter. */
export const ANIME_DOOR_WORD = 'gear';

/** Where the word leads. */
export const ANIME_DOOR_CHAPTER = EXP_ANIME_ID;
