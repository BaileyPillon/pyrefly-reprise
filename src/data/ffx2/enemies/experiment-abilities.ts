/**
 * The Experiment's actions (FFX-2 Chapter 5, Djose Temple; our hidden chapter "The Experiment"). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Sources: the public descriptions (FF Wiki, Jegged's Chapter 5 Djose page: `[public]`), reconciled with the game's own command rows by the
 * reverse-engineering session (`research/re-ffx2-experiment.md`: `[game rows]`); the rows themselves are attached from
 * `./experiment-command-records.ts`, so the W3 kernels resolve the game's numbers and not a reading of ours. This file carries the fields the engine's
 * `AbilityDef` needs around them: ids, names, targeting, hit counts, the message and the hit rule.
 *
 * **Hit rule (AGENTS.md rule 5).** Magic and Annihilator always hit (`canMiss: false`); the physical rows roll. Lifeslicer is `canMiss` as the game's row says.
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

/** The four Rocket Launcher variants: `[hits, damage constant]` `[public]` (Level 2: 4 hits, constant 4; Levels 3, 4 and 5: 6, 8 and 10 hits, constant 3). */
export const ROCKET_LAUNCHER_VARIANTS: readonly (readonly [hits: number, power: number])[] = [
  [4, 4],
  [6, 3],
  [8, 3],
  [10, 3],
] as const;

const ROCKET_NAMES = ['A', 'B', 'C', 'D'] as const;

/** Rocket Launcher A to D: physical, every hit on a fresh random girl `[public]`. */
const rocketLaunchers: AbilityDef[] = ROCKET_LAUNCHER_VARIANTS.map(([hits, power], i): AbilityDef => ({
  ...base,
  id: EXPERIMENT_ACTIONS.rocketLauncher[i]!,
  name: 'Rocket Launcher',
  power,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'random-enemy', // "hits random targets with each hit" [public]
  hits,
  flags: ['crit-eligible'],
  extra: { variant: ROCKET_NAMES[i] },
  messageTemplate: 'The Experiment launches rockets',
}));

/** The Experiment's actions, in the order the levels bring them. */
export const experimentAbilities: AbilityDef[] = [
  {
    ...base,
    id: EXPERIMENT_ACTIONS.attack,
    name: 'Attack',
    category: 'attack',
    power: 16, // the plain Attack, DC 16 [public]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['crit-eligible'],
    messageTemplate: 'The Experiment attacks {target}',
  },
  ...rocketLaunchers,
  {
    ...base,
    id: EXPERIMENT_ACTIONS.lifeslicer,
    name: 'Lifeslicer',
    // Damage equal to the target's maximum HP [public]: n/16 of max HP with n = 16 through the fractional path. The game's row sets the rest.
    power: 16,
    formula: 'percent-total',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['always-break-damage-limit'],
    messageTemplate: 'The Experiment uses Lifeslicer',
  },
  {
    ...base,
    id: EXPERIMENT_ACTIONS.annihilator,
    name: 'Annihilator',
    // Heavy magic damage to the whole party that skips Magic Defense, and a weak delay [public]; "1,240 to 1,400". The Gun Mage's Blue Bullet is not modelled.
    power: 0,
    formula: 'piercing-magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    flags: ['weak-delay'],
    canMiss: false,
    messageTemplate: 'The Experiment fires the Annihilator',
  },
];
