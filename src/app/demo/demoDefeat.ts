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

import type { Chapter } from '../../data/encounters.ts';
import { demoModeOn } from '../demoMode.ts';
import { cueForGroup } from '../screens/BattleEncounterChain.ts';
import { rememberBoardChapter } from '../screens/frontend/boardFocus.ts';
import { isDemoFight, otherDemoFight } from './demoFlow.ts';

/** Is `chapterId` a demo fight in demo mode, that is, does its defeat panel show TRY AGAIN / OTHER FIGHT? */
export function demoDefeatPanel(chapterId: string): boolean {
  return demoModeOn() && isDemoFight(chapterId);
}

/**
 * The QUICK retry (r63-play, the overnight fix of the skeptic's m4; Bailey 2026-10-22: a lost fight is a "quick retry"; both games, demo mode only): TRY AGAIN took 10.0 to 11.7 s to the first menu in both
 * chapters (the entry, then the whole authored opening: the boss card, the sweep, the roar). A retry of a demo fight is the same fight from its first frame (full HP, the demo seed, `attemptSeed`), with the opening
 * a visitor has just watched played hurried (`ui/common/transitions/openingHurry.ts`: the card for 0.7 s, the sweep cut, the reveal skipped; nothing of the fight itself changes), and its scene, depth plates and programs' compile are made behind the
 * defeat card (`demoWarm.warmDemoFights` with `light`: no offscreen draw, which could stop the page as TRY AGAIN is pressed) instead of under the entry. True from the second attempt on, for a demo fight in demo mode.
 */
export function demoQuickRetry(chapterId: string, attempt: number): boolean {
  return attempt > 0 && demoDefeatPanel(chapterId);
}

/** How long the chapter's theme takes to come in at TRY AGAIN, seconds (the defeat theme goes out over `DEFEAT_OUT_S`, 0.5; the two cross). */
export const RETRY_THEME_FADE_S = 0.8;

/** The mixer the retry's theme is asked of: the page's `audio` has this shape, a test passes a fake. */
export interface RetryThemePort {
  playMusic(name: string, options?: { fade?: number }): Promise<void> | unknown;
  /** The cue the mixer is heading for (`AudioManager.requestedMusic`): when it is the theme already, nothing is asked twice. */
  readonly requestedMusic?: string | null;
}

/** The cue a retried demo fight's chain asks for first, or undefined (not a demo fight, or no theme). Its decoded buffer is what a TRY AGAIN needs again after the defeat theme has played. */
export function retryTheme(chapter: Chapter): string | undefined {
  return demoDefeatPanel(chapter.id) ? cueForGroup(chapter, chapter.enemyGroupRef, 'first').track : undefined;
}

/**
 * The theme a retried demo fight plays from its first frame (r64-fixes, both games; demo mode only; Chapter I FFX and Chapter IV FFX-2). The first attempt's theme comes in when the fight's chain
 * starts (`BattleEncounterChain`: after the entry, the load and the boss card), and that is a few seconds on a retry, which the defeat theme's exit left silent (the skeptic's m1: the master output read
 * 0 to 0.0003 RMS at the press and the theme came in 2 to 4 s later, about when the first menu opened). So the same cue, the one the chain will ask for, is asked at the press; the chain's own request for
 * it then finds it already playing (`AudioManager.playMusic` returns early for the current track). Returns the cue name, or null when nothing was asked.
 */
export function startRetryTheme(chapter: Chapter, audio: RetryThemePort): string | null {
  const track = retryTheme(chapter);
  if (!track) return null;
  if (audio.requestedMusic === track) return track; // already on its way (the press asked for it, `showProDefeat`)
  try {
    void Promise.resolve(audio.playMusic(track, { fade: RETRY_THEME_FADE_S })).catch(() => undefined);
  } catch {
    return null;
  }
  return track;
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
