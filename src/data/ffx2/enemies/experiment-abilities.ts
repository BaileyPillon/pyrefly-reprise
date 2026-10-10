/**
 * The Experiment's actions (FFX-2 Chapter 5, Djose Temple; our hidden chapter "The Experiment"). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Source: the game's own command rows (`kernel/monmagic.bin` rows 0x41da and 0x4121 to 0x4126), read by the new-chapters reverse-engineering lane (`research/re-ffx2-experiment.md` §6 and §8;
 * `[game rows]`), laid on these abilities by `../command-records/experiment.ts` so the W3 kernels resolve the game's numbers and not a reading of ours. This file carries the fields the engine's
 * `AbilityDef` needs around them: ids, names, targeting, hit counts, the banner, the hit rule and the pace (charge and rest, in the game's own units).
 *
 * **Hit rule (AGENTS.md rule 5).** Only the plain Attack rolls to hit (accuracy formula 2: the attacker's Accuracy, 95); the Rocket Launcher, Lifeslicer and Annihilator never roll (accuracy
 * formula 0), so each carries `canMiss: false`.
 *
 * **Pace.** `chargeTicks` is the row's charge value and `recoveryTicks` its rest value (`cost_cast` and `cost_atb`: the gauge takes `value x 10000 / (AGI + 1)` units, so 14,492 for a rest of 100 at AGI 68):
 * Attack charge 0 and rest 100 (5.1 s); Rocket Launcher 60 and 100 (3.1 s, then 5.1 s); Lifeslicer 100 and 180 (5.1 s, then 9.2 s); Annihilator 210 and 100 (10.7 s, then 5.1 s). The animation and effect
 * lengths were not measured (`re-ffx2-experiment.md` §12), so none is modelled here.
 *
 * **Reductions** (the damage notes, `re-ffx2-experiment.md` §6): Protect halves the Attack and the Rocket Launcher (the physical bit); Shell halves the Annihilator (the magical bit); nothing reduces
 * Lifeslicer (its row has no damage-type bit): `damageType: 'other'`, as Aerospark's and the Bulwarks' fractional rows are.
 *
 * Every id is `x2-experiment-`-prefixed so nothing collides with another chapter's lookup.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';
import { EXPERIMENT_ACTIONS } from './experiment-levels.ts';

const base = {
  game: 'ffx2' as const,
  category: 'enemy' as const,
  mpCost: 0,
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
};

/** The four Rocket Launcher rows: `[hits, damage constant]` (rows 0x4121 to 0x4124: 4 hits of power 4 for Special 2; 6, 8 and 10 hits of power 3 for Special 3, 4 and 5). */
export const ROCKET_LAUNCHER_VARIANTS: readonly (readonly [hits: number, power: number])[] = [
  [4, 4],
  [6, 3],
  [8, 3],
  [10, 3],
] as const;

const ROCKET_NAMES = ['A', 'B', 'C', 'D'] as const;

/** Rocket Launcher A to D: physical, never rolls, can crit on a fixed 10, every hit on a fresh random girl (one draw per hit), charge 60 and rest 100. */
const rocketLaunchers: AbilityDef[] = ROCKET_LAUNCHER_VARIANTS.map(([hits, power], i): AbilityDef => ({
  ...base,
  id: EXPERIMENT_ACTIONS.rocketLauncher[i]!,
  name: 'Rocket Launcher',
  power,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'random-enemy',
  hits,
  flags: ['crit-eligible'],
  canMiss: false, // accuracy formula 0: it never rolls
  chargeTicks: 60,
  recoveryTicks: 100,
  extra: { variant: ROCKET_NAMES[i] },
  messageTemplate: 'Experiment uses Rocket Launcher',
}));

/** The Experiment's actions, in the order the levels bring them. */
export const experimentAbilities: AbilityDef[] = [
  {
    ...base,
    id: EXPERIMENT_ACTIONS.attack,
    name: 'Attack',
    category: 'attack',
    power: 16, // the plain monster Attack, row 0x41da: power 16, accuracy formula 2 (ACC 95), crit on a fixed 5
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['crit-eligible'],
    recoveryTicks: 100,
    messageTemplate: 'Experiment attacks {target}',
  },
  ...rocketLaunchers,
  {
    ...base,
    id: EXPERIMENT_ACTIONS.lifeslicer,
    name: 'Lifeslicer',
    // Row 0x4125: damage formula 7, power 16 = 16/16 of the target's MAXIMUM HP; never rolls; no damage-type bit, so no Protect or Shell reduces it; not reflectable; one enemy that must be alive.
    // A certain KO unless something prevents it, and a Phoenix Down is the answer [verified: the game's row; SinirothX, Split_Infinity, wiki, Jegged, StrategyWiki].
    power: 16,
    formula: 'fractional',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['always-break-damage-limit'],
    canMiss: false,
    chargeTicks: 100,
    recoveryTicks: 180,
    messageTemplate: 'Experiment uses Lifeslicer',
  },
  {
    ...base,
    id: EXPERIMENT_ACTIONS.annihilator,
    name: 'Annihilator',
    // Row 0x4126: damage formula 3 (magic that ignores Magic Defense), power 20, magical (Shell halves it); never rolls; all enemies; weak Delay on each target (4,000 gauge units). 1,240 to 1,400 a
    // girl at Attack Level 5's Magic 100, less at lower Attack levels. The party's Blue Bullet of the same name (48 MP, the Gun Mage learns it by being hit) is not modelled.
    power: 20,
    formula: 'piercing-magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    flags: ['weak-delay'],
    canMiss: false,
    chargeTicks: 210,
    recoveryTicks: 100,
    messageTemplate: 'Experiment uses Annihilator',
  },
];
