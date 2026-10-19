/**
 * The secret word to the hidden Pilgrimage (FFX only, prototype; branch `pilgrim-proto`, 2026-10-18).
 *
 * Bailey, 2026-10-18: "it needs a really addictive aspect and tighter core gameplay loop", and from the mockups he picked "Option 2 + B: branching, boons (Recommended)" as a PLAYABLE PROTOTYPE
 * (decision 122): a four-fight branching run, every fight its faithful chapter, one of three one-fight boons after each win. It ships HIDDEN behind a typed word, as the hidden chapters do
 * (`./chapterDoors.ts`), and nothing changes for a player who never types it. **The word is `pilgrim`.** It is a `WordDoor` like the others (`./secretDoor.ts`): type it on chapter select (any case, at most
 * `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers resets silently); no card, no sound, no sign. It settles on the frame after the last letter, which takes that letter's press
 * (`ChapterSelectScreen.handleInput`, the `opening` frame). On a phone the same word is typed in the long-press field (`./doorField.ts`), which feeds the same matcher.
 *
 * **Where it leads.** Not to a chapter of its own: the door settles the board on the run's first stop (Seymour and Anima), exactly as a hidden chapter's word settles it on its chapter, and the
 * board arms the flow (`GameFlow.armPilgrimage`), so the flow's next `runChapter` for that id is the Pilgrimage (`app/pilgrim/PilgrimFlow.ts`) and not the chapter alone. The first stop is a listed chapter
 * that no other door leads to, so a door that opens it is the Pilgrimage's and nobody else's (`BoardDoors.isRun`).
 *
 * Which letters are bound (checked against `app/Input.ts` `KEY_MAP`, pinned by `tests/unit/pilgrim-door.test.ts` with the real `Input`, the real board and the real title screen): **P, I, L and G are bound to
 * nothing**, **R is `r1`** and **M is `select`**. The R is a later letter and is claimed by the word (`WordDoor.continued`, the screen's `wordKey`); `r1` and `select` are ignored by the board anyway. The last
 * letter M is `select`, which party prep would not act on, and the board's next frame (`opening`) consumes every press before any other screen can see it. The first letter P is bound to nothing, so a first press
 * moves nothing. (P pauses a BATTLE through a raw listener of its own; the board has none.)
 *
 * The one overlap with the table's words, and why it is harmless: `pilgrim` ends in `m` and `mushroom` begins with `m` (`tests/unit/chapter-doors.test.ts` forbids that inside the table, which is why this row is
 * kept beside it). `pilgrim` finishes first and the board is shut from that frame (`opening`), so the continuation `ushroom` can never be typed on the board that has opened; no other word begins, ends with or contains it.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The unlock is not remembered: the word is typed on each visit.
 *
 * Game case: FFX only (the run's stops are FFX chapters); the door itself is shared plumbing.
 */
import { PILGRIM_FIRST_CHAPTER } from '../../pilgrim/route.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Pilgrimage. */
export const PILGRIM_DOOR_WORD = 'pilgrim';

/** Where the word settles the board: the run's first stop (the flow, armed by the board, plays the run instead of the chapter alone). */
export const PILGRIM_DOOR_CHAPTER = PILGRIM_FIRST_CHAPTER;
