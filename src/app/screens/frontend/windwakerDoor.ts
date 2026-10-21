/**
 * The secret word to the hidden Wind Waker chapter (FFX-2 only; branch `exp-windwaker`, 2026-10-20): hidden chapter 24's Valefor fight drawn in the style of Wind Waker HD.
 *
 * Bailey, 2026-10-20: "a new experimental hidden chapter (separate from the ones we're working ) and make it like wind waker hd esque graphics for for our ffx/ffx-2 game", and his picks, among them the secret
 * word `waker`. It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter,
 * a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that
 * letter's press (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else
 * leads in. On a phone the same word is typed in the long-press field (`./doorField.ts`), which feeds the same matcher.
 *
 * Which letters are bound, and why the word is safe (checked against `app/Input.ts` `KEY_MAP`, pinned by `tests/unit/windwaker-door.test.ts` with the real `Input`, the real board and the real title screen):
 * **W is `up`**, **A is `left`**, **K is bound to nothing**, **E is `start`**, **R is `r1`**. On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C) start the flow, plus B for the briefing; the word is
 * typed on the board, not there (its E starts the flow on the title, as the E of "valefor" and "experiment" does). On the BOARD the first letter W is an `up` and moves the cursor one step (as the first letters of
 * `daigoro` and `fayth` move it), after which the board leaves for the chapter; the A (`left`) is a later letter of a match and is **claimed by the word** (`WordDoor.continued`, the screen's `wordKey`), so it does
 * not move the cursor; `start` and `r1` are ignored by the board; the last letter R is an `r1`, which the board's next frame (`opening`) consumes with every other press before party prep can see it. Nothing latched
 * is left for the prep screen to start the fight on.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no door's word
 * begins with, ends with or contains another's, and that no word's end is another's beginning: `waker` begins with `w` (no other word ends in `w`, `wa`, `wak` or `wake`) and ends in `r` (no other word begins with `r`,
 * `er`, `ker`, `aker` or `waker`), so it overlaps `limit`, `leblanc`, `experiment`, `mushroom`, `fayth`, `daigoro`, `valefor`, `gagazet`, `angra`, `yojimbo` and `summon` in no position (and the 3D Bahamut branch's
 * `yrp`, which neither begins nor ends with any of its letters in common positions).
 *
 * THE WORD AND THE NUMBER ARE PLACEHOLDERS: the release driver assigns the real ones at merge.
 *
 * Game case: FFX-2 only (the chapter is hidden chapter 24's Valefor fight); the board and the door are shared plumbing.
 */
import { EXP_WINDWAKER_ID } from '../../../data/windwaker-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Wind Waker chapter. */
export const WINDWAKER_DOOR_WORD = 'waker';

/** Where the word leads. */
export const WINDWAKER_DOOR_CHAPTER = EXP_WINDWAKER_ID;
