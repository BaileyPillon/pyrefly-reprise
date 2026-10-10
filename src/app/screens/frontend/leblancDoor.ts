/**
 * The secret word to the hidden experimental Leblanc chapter (FFX-2 only; branch `exp-leblanc`).
 *
 * Bailey, 2026-10-06: "put the experimental new chapter in the live build but make it hidden like you did with ff7 how i had to type limit at
 * the main menu"; the word, confirmed: "leblanc (Recommended)". It mirrors FF7's door (`./secretDoor.ts`, the word "limit") because it is the same
 * `WordDoor`: type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an
 * arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that
 * letter's press (the C is the board's START key, and party prep would begin the fight on it: `ChapterSelectScreen.handleInput`). The unlock is not remembered: the word
 * is typed on each visit. The board has no experiment card (`chapterGrid.ts`), so nothing else leads in. FF7's taps and pad sequence stay FF7's alone.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a
 * literal, and pin that it stays clear of FF7's word (neither may begin the other, or the shorter door would fire first).
 *
 * Game case: FFX-2 only (the chapter is Chapter VI's mission in new paintings); the board and the door are shared plumbing.
 */
import { EXP_LEBLANC_ID } from '../../../data/chapter-exp-leblanc.ts';

/** THE WORD. Typed on chapter select, it opens the hidden experimental Leblanc chapter. */
export const EXP_LEBLANC_DOOR_WORD = 'leblanc';

/** Where the word leads. */
export const EXP_LEBLANC_DOOR_CHAPTER = EXP_LEBLANC_ID;
