/**
 * THE AUDIO PASS SWITCH (conference demo, the sound pass of 2026-10-22; Bailey, 2026-10-22 ~20:50 EDT, decision 184: "You choose all sound effects and music and voice overs for me for now please").
 *
 * Everything the pass adds (layered hits, the dip before a big blow, the UI family, spell sounds tied to the effect marks, the mix, the in-battle voice lines, the results sounds) is **OFF by default**
 * and ON only for Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2), the two demo chapters, in the same way as the motion pieces (`engine/motion/DemoGate.ts`):
 *
 * | address | the pass |
 * |---|---|
 * | nothing | off (today's sound, exactly) |
 * | `?audio=new` | on in the two demo chapters |
 * | `?pack=demo` | on in the two demo chapters (the shared key every demo piece answers to) |
 * | `?pack=demo&audio=today` | off (the A/B: the demo pack with today's sound) |
 *
 * The chapter is the one the chapter RUN names (`app/sfxGame.ts`, which wraps prep, battle, pause and results): the results screen is part of the run, so the results sounds follow the same gate, and the
 * title, the picker and every other chapter keep the sound they always had. The attract reel and the title are the booth flow (`?demo=1`): see {@link audioNewBooth}.
 *
 * Pure: no DOM but the address, no Web Audio. Game case: both games (shared plumbing); every number in the pass tables names the game it is for (AGENTS.md rule 14).
 */

import { DEMO_CHAPTERS, demoGameOf, isTreatedChapter, packDemo, queryWord } from '../../engine/motion/DemoGate.ts';

export type PassMode = 'new' | 'today';

/** `?audio=new|today` from a search string: the word named, or null when none (an unknown value names none). */
export function parseAudioKey(search: string | undefined): PassMode | null {
  const w = queryWord(search, 'audio');
  return w === 'new' || w === 'today' ? w : null;
}

/** Does the address ask for the pass? An explicit `?audio=` wins over the shared pack in both directions. */
export function passConfiguredBy(search: string | undefined): boolean {
  const named = parseAudioKey(search);
  if (named !== null) return named === 'new';
  return packDemo(search);
}

let address: string | undefined;
let forced: boolean | null = null;
let runChapter: string | undefined;

function search(): string | undefined {
  if (address !== undefined) return address;
  return globalThis.location === undefined ? undefined : (globalThis.location.search ?? '');
}

/** Tests and the booth's debug API: pin the answer (`null` goes back to the address). */
export function setAudioNew(on: boolean | null): void {
  forced = on;
}

/** Tests: name the address instead of reading the page's (`undefined` goes back to the page's). */
export function setPassAddress(s: string | undefined): void {
  address = s;
}

/** The chapter run names itself as it starts and `undefined` as it ends (`app/sfxGame.ts`). */
export function setPassChapter(id: string | undefined): void {
  runChapter = id;
}

export function passChapter(): string | undefined {
  return runChapter;
}

/** Is the pass asked for, by the address or the debug setter, whatever chapter is running? */
export function audioNewConfigured(): boolean {
  return forced ?? passConfiguredBy(search());
}

/** True while a chapter run of Chapter I or Chapter IV is on and the pass is asked for: the one question every piece of the pass asks. */
export function audioNewOn(): boolean {
  return isTreatedChapter(runChapter, 'audio') && audioNewConfigured();
}

/** The running demo chapter's game, or null when the pass is off (rule 14: the tables are read per game). */
export function passGame(): 'ffx' | 'ffx2' | null {
  return audioNewOn() ? demoGameOf(runChapter) : null;
}

/**
 * The booth flow's pieces that sit outside a chapter run (the attract reel's balance): the pass is asked for AND demo mode is on (`?demo=1`, `app/demoMode.ts`). Passed in by the caller,
 * so this module imports nothing of the app.
 */
export function audioNewBooth(demoModeOn: boolean): boolean {
  return demoModeOn && audioNewConfigured();
}

/** The two BOOTH chapters, for the tables that need to list them (the chapters the pass reaches are `TREATED_CHAPTERS` in `DemoGate.ts`). */
export const PASS_CHAPTERS: readonly string[] = Object.keys(DEMO_CHAPTERS);
