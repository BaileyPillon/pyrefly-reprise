/**
 * THE BOOTH FLOW (release 61, the conference demo; Bailey, 2026-10-21 ~00:30 EDT, decision 169; both games: the flow is shared plumbing, Chapter I FFX and Chapter IV FFX-2 where a line names one).
 *
 * Everything in `src/app/demo/` is **demo mode only** (`?demo=1`, `app/demoMode.ts`). Without it nothing here runs and the game is exactly what it was. What demo mode adds on top of release 60's
 * seeds (this release, part by part):
 *
 *  1. **The fight picker.** Start on the title leads to a two-card board (Seymour Flux, Chapter I, FFX; Bahamut, Chapter IV, FFX-2): the chapter board's own cards and art with the other cards, the hidden
 *     doors and the extra tabs taken away (`demoBoard.ts`). After the results, "continue" returns to it.
 *  2. **Straight into the fight.** A demo fight skips party prep and the story scenes before and after it ({@link demoRunDefaults}): a visitor is fighting about 15 seconds after the press that starts
 *     it. Why prep goes and is not kept as one confirm: prep is a full menu (Party, Sphere Grid, Equipment, Items, Overdrive for FFX; the Garment Grid for FFX-2) and the picker's confirm already is the one
 *     decision; a stranger with a pad in the first minute should be in a fight, not in a menu. The party is the chapter's own build, exactly what the debug API and the critic's runs start from.
 *  3. **The reset key** (`demoReset.ts`), **the attract loop** (`demoAttract.ts`, `demoIdle.ts`), **the QR code** (`demoQr.ts`) and **the cleaner HUD** (`demoHud.ts`).
 *
 * No rule, number or engine is touched by any of it: the fights are the game's, with the seeds release 60 chose.
 */

import { demoModeOn } from '../demoMode.ts';
import type { RunChapterOptions } from '../screens/BattleScreenFlow.ts';

/** The booth's address, as the QR code and the printed card carry it. */
export const BOOTH_URL = 'https://echoesofspira.com';

export interface DemoFight {
  readonly id: string;
  readonly game: 'ffx' | 'ffx2';
  /** The card's boss, as the booth says it. */
  readonly boss: string;
  readonly place: string;
}

/** The two fights a visitor picks from, in the order the board shows them: FFX first. */
export const DEMO_FIGHTS: readonly DemoFight[] = [
  { id: 'seymour-flux', game: 'ffx', boss: 'Seymour Flux', place: 'Mt. Gagazet' },
  { id: 'ffx2-bahamut', game: 'ffx2', boss: 'Bahamut', place: 'Bevelle Underground' },
];

/** Is `id` one of the two demo fights? */
export function isDemoFight(id: string): boolean {
  return DEMO_FIGHTS.some((f) => f.id === id);
}

/** The fight that is not `id`: where the picker's cursor goes after a fight, so the next visitor's first press starts the other one. Null for a chapter that is not a demo fight. */
export function otherDemoFight(id: string | null | undefined): string | null {
  const at = DEMO_FIGHTS.findIndex((f) => f.id === id);
  return at < 0 ? null : DEMO_FIGHTS[(at + 1) % DEMO_FIGHTS.length]!.id;
}

/**
 * How a demo fight is run when the caller did not say: no prep menu and no story scene (`skipPrep`, `skipCutscenes`). Anything the caller names wins (the debug API names its own).
 * Outside demo mode, or for a chapter that is not a demo fight, `opts` comes back as it came.
 */
export function demoRunDefaults(id: string, opts: RunChapterOptions): RunChapterOptions {
  if (!demoModeOn() || !isDemoFight(id) || opts.pilgrim !== undefined) return opts;
  return { ...opts, skipPrep: opts.skipPrep ?? true, skipCutscenes: opts.skipCutscenes ?? true };
}
