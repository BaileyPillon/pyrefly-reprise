/**
 * The secret word to the hidden Garik Ronso chapter (FFX-2 only; branch `ch-garik-ronso`, 2026-11-08): Garik and the Ronso Youths at the top of Mt. Gagazet, the Chapter 3 mission "Battle Blockade".
 *
 * Bailey, 2026-11-06 ~00:30 EST, "implement all unimplemented chapters please", and ~00:55 EST, "yes on all these too" (to building every researched boss he never picked). The driver's decision: the chapter ships
 * HIDDEN behind a typed word, as the Fallen Maesters and the others do (`./maestersDoor.ts`, `./angraDoor.ts`, `./wraithDoor.ts`), so he plays it, and listing it on the board waits for his word (preflight GA9).
 * **The word is `braveheart`.** The program plan's pick was `lionheart` (PLAN.md section 8, a word in the plan's pool), and **it fails the table's own test**: `tests/unit/chapter-doors.test.ts` "claims a later letter of a plain word"
 * needs FF7's secret word `limit` to have no later letter claimed, and a plain word that starts `li` claims the I of `limit`. The plan's script reproduced the pair rule and not that one. `braveheart` says the same thing (a
 * Ronso lord's pride and a Youth's nerve), passes every rule of the table and every other row's planned word, and is the one-line change this constant is for. The chapter is "Garik Ronso", hidden chapter number 47.
 * It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board
 * answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/inputKeyMap.ts` `KEY_MAP`, pinned by `tests/unit/braveheart-door.test.ts` with the real `Input`, the real board and the real title screen):
 * **R is `r1`**, **A is `left`**, **V is `select`**, **E is `start`**, and B, H and T are bound to nothing. On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C) start the flow, plus B for the briefing (the
 * keyboard's B, which this word's first letter is: the test pins what the title does with each letter); the word is typed on the board, not there. On the BOARD `r1` and `select` are ignored (it answers left, right, up, down,
 * confirm and cancel); the first letter B is bound to nothing on the board, so the cursor does not move at all; the later letters R, A, V, E, H, E, A and R are **claimed by the word** (`WordDoor.continued`, the screen's `wordKey`:
 * a later letter typed in time is swallowed, so it does not move the cursor or start anything). The last letter T is bound to nothing, so no latched press is left for the party prep to start the fight on. The R (`r1`) is one
 * of the buttons of FF7's pad sequence L1 R1 L1 R1 Select (`./secretDoor.ts`), and the V is Select; the word has no L1 (no F), so it never completes the sequence (and the matcher is per visit).
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no door's word
 * begins with, ends with or contains another's, that no word's end is another's beginning, and that `limit` loses no letter to a plain word: `braveheart` starts with `b` (no other word ends in `b`, `br`, `bra`, ...) and ends
 * with `t` (no word begins with `t`, `rt`, `art`, ...), and it contains none of the others.
 *
 * Game case: FFX-2 only (the chapter is FFX-2's, Chapter 3's summit fight); the board and the door are shared plumbing.
 */
import { GARIK_RONSO_ID } from '../../../data/garik-ronso-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Garik Ronso chapter. */
export const BRAVEHEART_DOOR_WORD = 'braveheart';

/** Where the word leads. */
export const BRAVEHEART_DOOR_CHAPTER = GARIK_RONSO_ID;
