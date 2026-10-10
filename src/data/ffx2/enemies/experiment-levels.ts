/**
 * The Experiment's upgrade model (FFX-2 Chapter 5, Djose Temple; our hidden chapter "The Experiment", mission Masterpiece Theatre). **FFX-2 only** [AGENTS.md rule 14].
 *
 * The Machine Faction's weapon has three upgrade tracks, each Level 1 to 5. In the game the levels come from the Assembly pieces dug up in the Bikanel Desert and the
 * technician reads them out before the fight (`research/ffx2-experiment.md` §2; there is no upgrade menu). **The chapter is the game's own two-act Rematch** (the driver's
 * pick, 2026-10-10, concept B): Act I is the machine at 1 / 1 / 1, Act II the full weapon at 5 / 5 / 5, with a seam and a retry checkpoint between them. So **there is no
 * chosen-levels path and no prep tab**: this model is internal, and it is how the two acts are made (`./experiment.ts`). It has no DOM and no state.
 *
 * - **Attack** sets Strength and Magic.
 * - **Defense** sets Defense and Magic Defense.
 * - **Special** sets which actions it uses and in what order (`../../../battle/ffx2/ai/experiment.ts`).
 * - HP, Agility and the rest of the row do not change with a level.
 *
 * Sources and tags (carried verbatim, rule 6): `research/ffx2-experiment.md` §3. `[SinirothX]` is the GameFAQs enemy encyclopedia's dump; `[verified: 3 sources]` the tables agree in
 * SinirothX, Jegged and the wiki (Attack 3's Strength is 155 there and 144 in KeyBlade999/GamerGuides: conflict G-1, the dump's 155 stands); `[game rows]` the game's own table, read by
 * the reverse-engineering session (`research/re-ffx2-experiment.md`) and pinned by `tests/unit/chapters/experiment-engine.test.ts`.
 */

/** The three tracks, in the order the game lists them (Attack, Defense, Special). */
export const UPGRADE_TRACKS = ['attack', 'defense', 'special'] as const;
export type UpgradeTrack = (typeof UPGRADE_TRACKS)[number];

/** A track's level. */
export type UpgradeLevel = 1 | 2 | 3 | 4 | 5;
export const UPGRADE_LEVELS: readonly UpgradeLevel[] = [1, 2, 3, 4, 5] as const;

/** One state of the machine: a level on each track. */
export interface ExperimentLevels {
  readonly attack: UpgradeLevel;
  readonly defense: UpgradeLevel;
  readonly special: UpgradeLevel;
}

/** Act I: the first test, nothing dug yet (Jegged: "Attack Lv. 1, Defense Lv. 1, Special Lv. 1"). */
export const ACT_I_LEVELS: ExperimentLevels = { attack: 1, defense: 1, special: 1 };
/** Act II: the full weapon, all three at the maximum, the state the game's Episode Complete needs a win in. */
export const ACT_II_LEVELS: ExperimentLevels = { attack: 5, defense: 5, special: 5 };

/** A stable key for a state, "a-d-s" (`"1-1-1"`): a memo key and the suffix tests print. */
export function levelsKey(l: ExperimentLevels): string {
  return `${l.attack}-${l.defense}-${l.special}`;
}

// ---------------------------------------------------------------------------
// What each level sets
// ---------------------------------------------------------------------------

/** The Attack track: Strength and Magic by level `[verified: 3 sources]` (Attack 3's Strength 155: conflict G-1). */
export const ATTACK_TRACK: Readonly<Record<UpgradeLevel, { readonly str: number; readonly mag: number }>> = {
  1: { str: 112, mag: 1 },
  2: { str: 130, mag: 20 },
  3: { str: 155, mag: 45 },
  4: { str: 180, mag: 72 },
  5: { str: 215, mag: 100 },
};

/** The Defense track: Defense and Magic Defense by level `[verified: 3 sources]`. */
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

/**
 * The actions each Special level can use `[SinirothX, Jegged, wiki]`: Level 1 only Attack; Level 2 adds the 4-hit Rocket Launcher; 3 the 6-hit, and Lifeslicer through its HP triggers
 * (single source, research G-7); 4 the 8-hit and Lifeslicer; 5 the 10-hit, Lifeslicer and Annihilator.
 */
export function experimentActionIds(special: UpgradeLevel): string[] {
  const ids: string[] = [EXPERIMENT_ACTIONS.attack];
  if (special >= 2) ids.push(EXPERIMENT_ACTIONS.rocketLauncher[special - 2]!);
  if (special >= 3) ids.push(EXPERIMENT_ACTIONS.lifeslicer);
  if (special >= 5) ids.push(EXPERIMENT_ACTIONS.annihilator);
  return ids;
}
