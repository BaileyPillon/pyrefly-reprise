/**
 * The Experiment's upgrade model (FFX-2 Chapter 5, Djose Temple; our hidden chapter "The Experiment"). **FFX-2 only** [AGENTS.md rule 14].
 *
 * The Machine Faction's walking weapon has three upgrade tracks, each Level 1 to 5. In the game the levels come from "Assembly" pieces dug up in
 * Bikanel Desert; in this chapter the player picks the three levels before the fight (`../../../app/experiments/`, the prep tab). This file owns the
 * model and nothing else restates it: the levels, the point arithmetic, the stat each track sets, and the one default. It has no DOM and no state; the
 * session's choice lives in `./experiment-loadout.ts`.
 *
 * - **Attack** sets Strength and Magic.
 * - **Defense** sets Defense and Magic Defense.
 * - **Special** sets which actions the Experiment uses and in what order (`../../../battle/ffx2/ai/experiment.ts`).
 * - HP, Agility and the rest of the row do not change with a level.
 *
 * Sources and tags (the tags are the research's, carried verbatim into the data, rule 6): `research/ffx2-experiment.md`.
 * `[public]` below means the FF Wiki page and Jegged's Chapter 5 Djose page, which agree to the number; `[game rows]` means the game's own table, read by the
 * reverse-engineering session (`research/re-ffx2-experiment.md`) and pinned by `tests/unit/chapters/experiment-engine.test.ts`.
 */

/** The three tracks, in the order the game lists them (Attack, Defense, Special). */
export const UPGRADE_TRACKS = ['attack', 'defense', 'special'] as const;
export type UpgradeTrack = (typeof UPGRADE_TRACKS)[number];

/** A track's level. */
export type UpgradeLevel = 1 | 2 | 3 | 4 | 5;
export const UPGRADE_LEVELS: readonly UpgradeLevel[] = [1, 2, 3, 4, 5] as const;

/** One choice: a level on each track. */
export interface ExperimentLevels {
  readonly attack: UpgradeLevel;
  readonly defense: UpgradeLevel;
  readonly special: UpgradeLevel;
}

/** True for 1 to 5. */
export function isUpgradeLevel(n: unknown): n is UpgradeLevel {
  return n === 1 || n === 2 || n === 3 || n === 4 || n === 5;
}

/** Clamp any number to a level (a fractional or out-of-range value from a stray input never reaches the data). */
export function toUpgradeLevel(n: number): UpgradeLevel {
  const k = Math.min(5, Math.max(1, Math.round(Number.isFinite(n) ? n : 1)));
  return k as UpgradeLevel;
}

/**
 * The choice the chapter opens on until the player changes it. Provisional: the first fight the game offers, every track at Level 1 (Jegged: "Attack Lv. 1, Defense
 * Lv. 1, Special Lv. 1"), which is one of the two fights the game itself has (the other is all 5). The driver's concept pick names the shipped default.
 */
export const DEFAULT_EXPERIMENT_LEVELS: ExperimentLevels = { attack: 1, defense: 1, special: 1 };

/** The weakest and the strongest fight the game offers. */
export const MIN_EXPERIMENT_LEVELS: ExperimentLevels = { attack: 1, defense: 1, special: 1 };
export const MAX_EXPERIMENT_LEVELS: ExperimentLevels = { attack: 5, defense: 5, special: 5 };

/** A stable key for a choice, "a-d-s" (`"1-1-1"`): the memo key of the group and the id suffix tests print. */
export function levelsKey(l: ExperimentLevels): string {
  return `${l.attack}-${l.defense}-${l.special}`;
}

/** Equal choices. */
export function sameLevels(a: ExperimentLevels, b: ExperimentLevels): boolean {
  return a.attack === b.attack && a.defense === b.defense && a.special === b.special;
}

/** A copy with one track changed. */
export function withLevel(l: ExperimentLevels, track: UpgradeTrack, level: UpgradeLevel): ExperimentLevels {
  return { ...l, [track]: level };
}

// ---------------------------------------------------------------------------
// The Assembly points (the game's way to a level)
// ---------------------------------------------------------------------------

/** The three kinds of Assembly piece and what each is worth to its track `[public]`. */
export const ASSEMBLY_POINTS = { Z: 5, S: 3, A: 1 } as const;
export type AssemblyKind = keyof typeof ASSEMBLY_POINTS;

/** The fewest points that make each level, Level 1 first `[public]`: 0-3 is Level 1, 4-9 Level 2, 10-19 Level 3, 20-37 Level 4, 38 and up Level 5. */
export const LEVEL_MIN_POINTS: Readonly<Record<UpgradeLevel, number>> = { 1: 0, 2: 4, 3: 10, 4: 20, 5: 38 };

/** The level a track's points make. */
export function levelForPoints(points: number): UpgradeLevel {
  const p = Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 0;
  let level: UpgradeLevel = 1;
  for (const l of UPGRADE_LEVELS) if (p >= LEVEL_MIN_POINTS[l]) level = l;
  return level;
}

/** The points of a set of pieces: `{ Z: 1, S: 3, A: 1 }` is 15 (the wiki's worked example). */
export function pointsOf(pieces: Partial<Record<AssemblyKind, number>>): number {
  let total = 0;
  for (const kind of Object.keys(ASSEMBLY_POINTS) as AssemblyKind[]) total += ASSEMBLY_POINTS[kind] * Math.max(0, Math.floor(pieces[kind] ?? 0));
  return total;
}

// ---------------------------------------------------------------------------
// What each level sets
// ---------------------------------------------------------------------------

/** The Attack track: Strength and Magic by level `[public]`. */
export const ATTACK_TRACK: Readonly<Record<UpgradeLevel, { readonly str: number; readonly mag: number }>> = {
  1: { str: 112, mag: 1 },
  2: { str: 130, mag: 20 },
  3: { str: 155, mag: 45 },
  4: { str: 180, mag: 72 },
  5: { str: 215, mag: 100 },
};

/** The Defense track: Defense and Magic Defense by level `[public]`. */
export const DEFENSE_TRACK: Readonly<Record<UpgradeLevel, { readonly def: number; readonly mdef: number }>> = {
  1: { def: 1, mdef: 1 },
  2: { def: 50, mdef: 50 },
  3: { def: 100, mdef: 100 },
  4: { def: 150, mdef: 150 },
  5: { def: 205, mdef: 205 },
};

/** The ids of the actions the Experiment can use (`./experiment-abilities.ts`). */
export const EXPERIMENT_ACTIONS = {
  attack: 'x2-experiment-attack',
  rocketLauncher: ['x2-experiment-rocket-launcher-a', 'x2-experiment-rocket-launcher-b', 'x2-experiment-rocket-launcher-c', 'x2-experiment-rocket-launcher-d'],
  lifeslicer: 'x2-experiment-lifeslicer',
  annihilator: 'x2-experiment-annihilator',
} as const;

/** The AI script id of a Special level (`../../../battle/ffx2/ai/experiment.ts`). */
export function experimentScriptId(special: UpgradeLevel): string {
  return `x2-experiment-special-${special}`;
}

/** The actions each Special level can use `[public]`: Level 1 only Attack; Level 2 adds the 4-hit Rocket Launcher; 3 the 6-hit; 4 the 8-hit and Lifeslicer; 5 the 10-hit, Lifeslicer and Annihilator. */
export function experimentActionIds(special: UpgradeLevel): string[] {
  const ids: string[] = [EXPERIMENT_ACTIONS.attack];
  if (special >= 2) ids.push(EXPERIMENT_ACTIONS.rocketLauncher[special - 2]!);
  if (special >= 4) ids.push(EXPERIMENT_ACTIONS.lifeslicer);
  if (special >= 5) ids.push(EXPERIMENT_ACTIONS.annihilator);
  return ids;
}
