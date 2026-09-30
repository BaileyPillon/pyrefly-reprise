/**
 * The battle **pacing switch** (fb-0929 pacing track): an OPTION for Bailey, default off.
 *
 * Bailey, 2026-09-29, relaying a friend: "moves and transitions happen too fast". That is
 * taste, not a defect (AGENTS.md rules 9 and 10), so this module changes nothing unless a
 * preset other than `'current'` is picked, by `?pace=<name>` in the URL or
 * `window.__pyrefly.pace('<name>')` from the console. `'current'` is exactly the live build.
 *
 * **Presentation only.** It scales how long the presenter waits, how fast actor tweens, hit
 * sparks and spell effects run, how long a damage numeral lives, and how long the battle
 * entry and the results wipe take. It never touches an engine, the RNG, the CTB order or the
 * FFX-2 ATB clock: the Active pump reads real elapsed time and waits on the presenter's
 * unscaled `baseSleep`, and an animation never pays the clock (`BattlePresenterActive.ts`
 * property 5), so a slower animation costs wall time only, never ATB, in Wait or Active.
 *
 * **Game case: FFX and FFX-2 are separate presets** (hard rule 14). FFX is CTB, one actor at a
 * time, and its presets stretch the most. FFX-2 is sourced as "ATB, but faster" with party
 * members acting at once (`research/ffx-vs-ffx2-presentation.md` §4.2), so its presets stretch
 * less. FF7 and anything else always plays at 1. **Every multiplier here is `[ours]`**: no
 * source in `research/` gives a duration in seconds for any battle beat of either game
 * (`ffx-vs-ffx2-presentation.md` open question 5), so none of these is game data.
 *
 * Pure TypeScript: no DOM, no `three` (hard rule 1).
 */

export type PaceName = 'current' | 'steady' | 'relaxed';

/** What a multiplier stretches. */
export type PaceKind = 'action' | 'numeral' | 'transition';

export type PaceGame = 'ffx' | 'ffx2' | 'other';

/** Duration multipliers (1 = the live build; 1.4 = 40 % longer). */
export type PaceScales = Readonly<Record<PaceKind, number>>;

export const PACE_NAMES: readonly PaceName[] = ['current', 'steady', 'relaxed'];

const ONE: PaceScales = { action: 1, numeral: 1, transition: 1 };

/** The presets, per game. `[ours]`, every number (see the header). */
export const PACE_PRESETS: Readonly<Record<'ffx' | 'ffx2', Readonly<Record<PaceName, PaceScales>>>> = {
  ffx: {
    current: ONE,
    steady: { action: 1.2, numeral: 1.3, transition: 1.2 },
    relaxed: { action: 1.4, numeral: 1.6, transition: 1.4 },
  },
  ffx2: {
    current: ONE,
    steady: { action: 1.1, numeral: 1.25, transition: 1.1 },
    relaxed: { action: 1.25, numeral: 1.5, transition: 1.3 },
  },
};

let active: PaceName = 'current';
let game: PaceGame = 'other';

export function isPaceName(v: unknown): v is PaceName {
  return typeof v === 'string' && (PACE_NAMES as readonly string[]).includes(v);
}

/** Pick a preset. Unknown names are refused (returns false) and change nothing. */
export function setPace(name: unknown): boolean {
  if (!isPaceName(name)) return false;
  active = name;
  return true;
}

export function pace(): PaceName {
  return active;
}

/** A chapter's game id as the pacing sees it (FF7 and the rest are never paced). */
export function paceGameOf(g: string): PaceGame {
  return g === 'ffx' || g === 'ffx2' ? g : 'other';
}

/** The battle screen names its game as it starts, so the presets stay game-aware. */
export function setPaceGame(g: string): void {
  game = paceGameOf(g);
}

export function paceGame(): PaceGame {
  return game;
}

/** The multipliers in force for `g` (default: the running battle's game). */
export function paceScales(g: PaceGame = game): PaceScales {
  if (g === 'other') return ONE;
  return PACE_PRESETS[g][active];
}

/** Duration multiplier for one kind of beat (>= 1 lengthens it). */
export function paceFactor(kind: PaceKind, g: PaceGame = game): number {
  return paceScales(g)[kind];
}

/** Clock rate for a dt-driven animation of this kind: the inverse of {@link paceFactor}. */
export function paceRate(kind: PaceKind, g: PaceGame = game): number {
  return 1 / paceFactor(kind, g);
}

/** `?pace=<name>` from a query string; null when absent or unknown. */
export function paceFromQuery(search: string): PaceName | null {
  try {
    const v = new URLSearchParams(search).get('pace');
    return isPaceName(v) ? v : null;
  } catch {
    return null;
  }
}
