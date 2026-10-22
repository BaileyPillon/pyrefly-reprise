/**
 * A LOSS AT THE BOOTH (release 62, the conference demo; Bailey, 2026-10-22 ~00:00 EDT, decision 173g: "Instant 'Try again' or 'Other fight' (Recommended)"; both games, demo mode only; Chapter I is FFX,
 * Chapter IV is FFX-2).
 *
 * After a demo fight is lost the defeat panel (`ResultsScreen`, the same ink-and-fallen-leader page the whole game uses) offers two slabs, one button each, instead of RETRY and CHAPTER SELECT:
 *
 *  - **TRY AGAIN**: the same fight, fresh (a new battle from its first frame: full HP, the opening), on the **same demo seed** as the fight just lost (`attemptSeed` in `demoMode.ts`; release 61 took the
 *    next seed of the table here). No prep menu and no story scene (`demoRunDefaults`), as for every demo fight.
 *  - **OTHER FIGHT**: the other of the two fights, started at once (a visitor who lost does not need the picker to say what the other card is). Back (B / Esc) still leaves for the picker.
 *
 * There is no long defeat scene: the fight's own defeat beat is 1.1 s (`TIMING.defeat`) and the panel follows on the results wipe.
 *
 * This file holds the one thing the flow needs to remember across the panel: that OTHER FIGHT was chosen, so that `GameFlow.runChapter` starts the other fight when the lost one has been closed out.
 * Outside demo mode, and for a chapter that is not a demo fight, nothing here does anything.
 */

import { demoModeOn } from '../demoMode.ts';
import { rememberBoardChapter } from '../screens/frontend/boardFocus.ts';
import { isDemoFight, otherDemoFight } from './demoFlow.ts';

/** Is `chapterId` a demo fight in demo mode, that is, does its defeat panel show TRY AGAIN / OTHER FIGHT? */
export function demoDefeatPanel(chapterId: string): boolean {
  return demoModeOn() && isDemoFight(chapterId);
}

let pending: string | null = null;

/** The defeat panel's answer for a lost demo fight: OTHER FIGHT remembers the fight to start next. Any other answer, outside demo mode or on another chapter: nothing is remembered. */
export function noteDemoDefeatChoice(chapterId: string, choice: string): void {
  pending = choice === 'other-fight' && demoDefeatPanel(chapterId) ? otherDemoFight(chapterId) : null;
}

/**
 * The fight OTHER FIGHT chose, once (null when none was chosen). The picker's memory is moved to it, so after that fight is won the picker's cursor opens on the fight that is then the OTHER one
 * (`demoBoard.demoStartIndex`), as after any fight.
 */
export function takeDemoNextFight(): string | null {
  const next = pending;
  pending = null;
  if (next !== null) rememberBoardChapter(next);
  return next;
}
