/**
 * The secret word to the hidden 3D Bahamut chapter (FFX-2 only; branch `exp-yrp-3d`, 2026-10-19): Chapter IV's fight drawn as a real 3D scene with toon-shaded models.
 *
 * Bailey, 2026-10-19: "I like it can we do an experimental 3d chapter that's hidden?", and his picks, among them the secret word `yrp`. It is the same `WordDoor` as FF7's "limit" and the other hidden
 * chapters' words (`./secretDoor.ts`, `./faythDoor.ts`, `./angraDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board
 * answers, such as an arrow, resets silently) and the board settles on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 * On a phone the same word is typed in the long-press field (`./doorField.ts`), which feeds the same matcher.
 *
 * Which letters are bound, and why the word is safe (checked against `app/Input.ts` `KEY_MAP`, pinned by `tests/unit/yrp-door.test.ts` with the real `Input`, the real board and the real title screen):
 * **Y is bound to nothing**, **R is `r1`**, **P is bound to nothing** (P pauses a BATTLE through a raw listener of its own; the board has none). The first letter Y moves nothing; the R is a later letter and is
 * claimed by the word (`WordDoor.continued`, the screen's `wordKey`), and the board ignores `r1` anyway; the last letter P is bound to nothing, so no press is left latched for party prep, and the `opening`
 * frame consumes every button anyway. On the TITLE screen only `confirm` (Enter, Space, Z) and `start` (E, C) start the flow, plus B for the briefing: no letter of `yrp` is one of them.
 *
 * **It is three letters, the shortest word on the table** (the others are four to ten): Bailey's pick. A run of Y, R, P by accident is rare (none of them is a board key, and a stray key or a pause of
 * over `KEY_GAP_MS` resets it), and `tests/unit/chapter-doors.test.ts` pins that no word begins, ends with or contains another, so the short word cannot shadow a longer door. (`pilgrim` begins with `p`,
 * where `yrp` ends: the table's test does not cover the run doors, and one run of letters that finishes `yrp` and then starts `pilgrim` opens `yrp` first and shuts the board.)
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal.
 *
 * Game case: FFX-2 only (the chapter is Chapter IV's Bahamut); the board and the door are shared plumbing.
 */
import { EXP_YRP_ID } from '../../../data/yrp-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden 3D Bahamut chapter. */
export const YRP_DOOR_WORD = 'yrp';

/** Where the word leads. */
export const YRP_DOOR_CHAPTER = EXP_YRP_ID;
