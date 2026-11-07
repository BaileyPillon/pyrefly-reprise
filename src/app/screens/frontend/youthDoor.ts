/**
 * The secret word to the hidden Youth League Tournament chapter (FFX-2 only; branch `ch-youth-league`, 2026-11-07): Mushroom Rock Road's seven fights, Yaibal to Lucil.
 *
 * Bailey, 2026-11-06 ~00:30 EST: "implement all unimplemented chapters please"; ~00:55 EST: "yes on all these too"; 2026-10-31: "you make the executive decisions for the next few days. i'll go with all of your
 * recommendations." The chapter ships HIDDEN behind a typed word, as the other hidden chapters do (`./leblancDoor.ts`, `./experimentDoor.ts`, `./mushroomDoor.ts`, `./faythDoor.ts`, `./daigoroDoor.ts`, `./valeforDoor.ts`,
 * `./angraDoor.ts`, `./maestersDoor.ts`, `./drillshotDoor.ts`, `./duelistDoor.ts`, `./wraithDoor.ts`); listing it on the board waits for his word. **The word is `youth`** (the program plan's section 8, checked against every
 * existing word by the rule of `tests/unit/chapter-doors.test.ts`), the driver's pick ("the word is a house detail"); hidden chapter number 42. It is the same `WordDoor` as FF7's "limit" and the other hidden chapters'
 * words (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles on the
 * chapter, with no card, no sound and no sign. It settles on the frame after the last letter, which takes that letter's press (`ChapterSelectScreen.handleInput`, the `opening` frame). The unlock is not remembered: the word is
 * typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/inputKeyMap.ts` `KEY_MAP`, pinned by `tests/unit/chapters/youth-league-door.test.ts` with the real `Input`, the real board and the real title
 * screen): **Y, O, U, T and H are ALL bound to nothing**, so the word is the one door on the table that presses no board key at all: the first letter does not even move the cursor (the `daigoro`, `darkaeon` and
 * `duelist` words' first letter D is `right`), no later letter needs claiming, and the last letter H leaves no latched press for the party prep to start the fight on. On the TITLE screen only `confirm` (Enter, Space, Z) and
 * `start` (E, C) start the flow, plus B for the briefing; the word is typed on the board, not there, and the title answers none of its letters.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no door's word
 * begins with, ends with or contains another's, and that no word's end is another's beginning: `youth` starts with `y` (no other word ends in `y`, `ey`, ...) and ends with `h` (no word begins with `h`, `th`, `uth`, ...).
 *
 * Game case: FFX-2 only (the chapter is FFX-2's); the board and the door are shared plumbing.
 */
import { YOUTH_LEAGUE_ID } from '../../../data/youth-league-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Youth League Tournament chapter. */
export const YOUTH_DOOR_WORD = 'youth';

/** Where the word leads. */
export const YOUTH_DOOR_CHAPTER = YOUTH_LEAGUE_ID;
