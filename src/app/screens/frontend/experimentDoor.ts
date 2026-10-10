/**
 * The secret word to the hidden Experiment chapter (FFX-2 only; branch `ch-experiment`).
 *
 * Bailey, 2026-10-10: "I'll add in those 2 chapter recommendations" and "i want those chapters added in over night while im sleep"; the driver's
 * reading, recorded as his delegation: the chapter ships HIDDEN behind a typed word, as the Leblanc preview does (`./leblancDoor.ts`), so he plays it in the
 * morning, and listing it on the board waits for his word. It is the same `WordDoor` as FF7's "limit" and the Leblanc preview's: type the word on chapter select
 * (any case, at most `KEY_GAP_MS` between letters; a wrong letter, a pause or a key the board answers, such as an arrow, resets silently) and the board settles
 * on the chapter, with no card, no sound and no sign. It settles on the frame after the last letter (`ChapterSelectScreen.handleInput`, the `opening` frame),
 * which takes that letter's press. The unlock is not remembered: the word is typed on each visit.
 *
 * **Why "experiment" is safe to type on the board** (pinned with the real `Input` in `tests/unit/ffx2-experiment-door.test.ts`): four of its letters are bound to
 * buttons (`app/Input.ts`, `KEY_MAP`): E is START, X is CANCEL, R is R1, M is SELECT. The board answers CANCEL (it leaves for the title), but a later letter of a live
 * match is claimed by the same guard the Leblanc word's A and C rely on (`WordDoor.continued`, `ChapterSelectScreen.wordKey`), so the X typed second never reaches
 * the board; the board never acts on START, R1 or SELECT, and the opening frame consumes every button. The last letter, T, is bound to nothing, so no press is left
 * for party prep to read as START (F393-03). The first E is START but only the board sees it that frame, and the board does not use START.
 *
 * ONE named constant: to change the word, change the line below (lower-case letters, `KeyboardEvent.key`). The tests read the constant, never a literal, and pin
 * that it stays clear of the other doors' words (neither may begin the other, or the shorter door would fire first).
 *
 * Game case: FFX-2 only (the chapter is the Machine Faction's Experiment, FFX-2 Chapter 5); the board and the door are shared plumbing.
 */
import { EXPERIMENT_ID } from '../../../data/chapter-ffx2-experiment.ts';

/** THE WORD. Typed on chapter select, it opens the hidden Experiment chapter. */
export const EXPERIMENT_DOOR_WORD = 'experiment';

/** Where the word leads. */
export const EXPERIMENT_DOOR_CHAPTER = EXPERIMENT_ID;
