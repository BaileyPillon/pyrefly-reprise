/**
 * The secret word to the hidden Bevelle Guardians chapter (FFX-2 only; branch `ch-bevelle-guardians`, 2026-11-06): Georapella and the Precepts Guard on floor 3 of the Bevelle Underground, Baralai on floor 7.
 *
 * Bailey wrote, relayed by the release driver, on 2026-11-06 (~00:30 EST) "implement all unimplemented chapters please" and (~00:55 EST) "yes on all these too". The chapter ships HIDDEN behind a typed word, as the
 * Leblanc preview, the Experiment, Sinspawn Gui, Fayth, the Tourist Trap, Valefor at Besaid, Angra Mainyu and the Fallen Maesters do (`./leblancDoor.ts`, `./experimentDoor.ts`, `./mushroomDoor.ts`, `./faythDoor.ts`,
 * `./daigoroDoor.ts`, `./valeforDoor.ts`, `./angraDoor.ts`, `./maestersDoor.ts`); listing it on the board waits for his word. **The word is `drillshot`** (the move that names the fight: Baralai's tenth blow), the
 * program plan's pick for row 37 (section 8: checked against every existing word and every proposal); hidden chapter number 37. It is the same `WordDoor` as FF7's "limit" and the other hidden chapters' words
 * (`./secretDoor.ts`): type the word on chapter select (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles
 * on the chapter, with no card, no sound and no sign. The unlock is not remembered: the word is typed on each visit. The board has no card for the chapter (`chapterGrid.ts`), so nothing else leads in.
 *
 * Which letters are bound, and why the word is safe (checked against `app/inputKeyMap.ts` `KEY_MAP`, pinned by `tests/unit/drillshot-door.test.ts` with the real `Input`, the real board and the real title screen):
 * the test reads the bound keys from the map and says which letters of the word are among them. The word is claimed by the matcher on every letter after the first (`WordDoor.continued`, the screen's `wordKey`).
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and `tests/unit/chapter-doors.test.ts` pins that no door's
 * word begins with, ends with or contains another's, and that no word's end is another's beginning: `drillshot` starts with `d` and ends with `t`, and the program plan checked it against every word (section 8).
 *
 * Game case: FFX-2 only (the chapter is FFX-2's, Chapter 2's descent); the board and the door are shared plumbing.
 */
import { BEVELLE_GUARDIANS_ID } from '../../../data/bevelle-guardians-ids.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Bevelle Guardians chapter. */
export const DRILLSHOT_DOOR_WORD = 'drillshot';

/** Where the word leads. */
export const DRILLSHOT_DOOR_CHAPTER = BEVELLE_GUARDIANS_ID;
