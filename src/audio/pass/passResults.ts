/**
 * THE AUDIO PASS, THE END OF A FIGHT (conference demo sound pass, 2026-10-22; decision 184). Two picks, each read off the game's own sources and the measured library, both behind the pass switch
 * (`passSwitch.ts`: `?audio=new` or `?pack=demo`, Chapter I and Chapter IV only):
 *
 *  - **Chapter IV's win plays no music** (FFX-2 only). What the sources say: after Bahamut the girls do not pose and no victory fanfare plays, unique in the original (`research/writing-bible.md` lines 878 and
 *    1370, verified by two sources; the missing pose alone: `research/ffx2-bahamut.md` line 244 and `research/ffx-vs-ffx2-presentation.md` line 112, a single source each). That the Results screen then comes up
 *    silent is the writing bible's own instruction (line 1370; line 937 is its stage beat, "the music simply stops"), not a sourced statement of what the retail results screen plays, and the canon names no
 *    substitute cue, so this is a pick on the missing fanfare. Today the chapter plays `pause` on its results (release 61): the word "quiet" is true of its arrangement, not its level (its loop body reads -15.6 LUFS,
 *    the battle theme -15.7; only its first 5.2 s are low). The battle theme is already cut at the last blow, so the pass asks for none: the results panel and its menu sounds are all there is. `?audio=today` keeps `pause`.
 *  - **Chapter I's win is one fanfare** (FFX only). Today the last blow plays the presenter's 3.4 s sting (`victory-fanfare`, first bank), then 3.8 s later the results screen starts `victory-ffx`,
 *    whose first 8.5 s are a second fanfare: two fanfares in a row about 4 s apart. The pass starts the chapter's own results cue at the last blow instead and drops the sting, so the fanfare begins with
 *    the victory pose and carries across the wipe into the panel (the results screen asks for the cue that is already playing, which the mixer leaves alone). The sources do not say what the original
 *    plays (the fanfare is a music stream nobody measured, `sfx-parity/spec.md:226`), so this is a pick on the measured doubling, not a claim about the retail game.
 *
 * Pure but for the module variable set by `app/sfxGame.ts`; no DOM, no Web Audio.
 */

import { audioNewOn } from './passSwitch.ts';

/** Chapters whose win the sources leave silent (FFX-2 Chapter IV, Bahamut). */
export const PASS_SILENT_WIN: ReadonlySet<string> = new Set(['ffx2-bahamut']);

let victoryCue: string | null = null;

/** The chapter run names the cue its results will play on a win (the one the pass starts at the last blow), or `null`. */
export function setPassVictoryCue(cue: string | null): void {
  victoryCue = cue;
}

/** The cue to start at the last blow in place of the sting, or null (the pass is off, or the chapter has none). */
export function passVictoryCue(): string | null {
  return audioNewOn() ? victoryCue : null;
}

/** Does the pass leave this chapter's win results without music? */
export function passSilentWin(chapterId: string): boolean {
  return audioNewOn() && PASS_SILENT_WIN.has(chapterId);
}
