/**
 * The Experiment's action pattern, one script per Special level (FFX-2 Chapter 5, Djose Temple; our hidden chapter "The Experiment"). **FFX-2 only**
 * [AGENTS.md rule 14].
 *
 * The Special track decides which actions the Experiment uses and in what order (`src/data/ffx2/enemies/experiment-levels.ts`); the Attack and Defense
 * tracks only move its stats. The pattern per level `[public]` (Jegged's Chapter 5 Djose page, the FF Wiki), reconciled with the game's own script by the
 * reverse-engineering session (`research/re-ffx2-experiment.md`, `[game rows]`):
 *
 * ```
 * Special 1: Attack
 * Special 2: Attack, Attack, Attack, Rocket Launcher (4 hits)
 * Special 3: Attack, Attack, Rocket Launcher (6 hits)
 * Special 4: each turn at random: Attack 3/6, Rocket Launcher (8 hits) 2/6, Lifeslicer 1/6
 * Special 5: Rocket Launcher (10 hits), Attack, Rocket Launcher, Attack, Lifeslicer, Annihilator, Attack, then again
 * ```
 *
 * An Attack and a Lifeslicer go to one random living girl; a Rocket Launcher picks a fresh random girl for each hit (the engine does that for a
 * `random-enemy` ability, so it is issued with no targets); the Annihilator hits the whole party. The cycles keep their place in AI memory, so a Level
 * 2 to 3 or 5 fight walks its list in order from the first turn. Deterministic under the seeded RNG (`ctx.rng`).
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { EXPERIMENT_ACTIONS, UPGRADE_LEVELS, experimentScriptId, type UpgradeLevel } from '../../../data/ffx2/enemies/experiment-levels.ts';

/** AI memory: where the cycle stands. */
export const EXPERIMENT_STEP = 'experimentStep';

type Move = 'attack' | 'rocket' | 'lifeslicer' | 'annihilator';

/** The cycles (Special 2, 3, 5), in order; Special 1 is one Attack, Special 4 is a roll. */
export const EXPERIMENT_CYCLES: Readonly<Record<2 | 3 | 5, readonly Move[]>> = {
  2: ['attack', 'attack', 'attack', 'rocket'],
  3: ['attack', 'attack', 'rocket'],
  5: ['rocket', 'attack', 'rocket', 'attack', 'lifeslicer', 'annihilator', 'attack'],
};

/** Special 4's roll, in sixths: Attack 3, Rocket Launcher 2, Lifeslicer 1 (50 %, 33 %, 17 %). */
export const EXPERIMENT_SPECIAL_4_WEIGHTS = { attack: 3, rocket: 2, lifeslicer: 1 } as const;

function randomGirl(ctx: AiContext): string[] {
  const party = ctx.party();
  return party.length > 0 ? [ctx.rng.pick(party).id] : [];
}

function command(move: Move, special: UpgradeLevel, ctx: AiContext): Command {
  switch (move) {
    case 'attack':
      return { kind: 'ability', id: EXPERIMENT_ACTIONS.attack, targets: randomGirl(ctx) };
    case 'rocket':
      // Level 2 brings the 4-hit variant, 3 the 6-hit, 4 the 8-hit and 5 the 10-hit: variant A to D (`experiment-abilities.ts`).
      return { kind: 'ability', id: EXPERIMENT_ACTIONS.rocketLauncher[Math.max(0, special - 2)]!, targets: [] };
    case 'lifeslicer':
      return { kind: 'ability', id: EXPERIMENT_ACTIONS.lifeslicer, targets: randomGirl(ctx) };
    case 'annihilator':
      return { kind: 'ability', id: EXPERIMENT_ACTIONS.annihilator, targets: [] };
  }
}

function special4Move(ctx: AiContext): Move {
  const roll = ctx.rng.int(0, 5); // 0..5, inclusive
  return roll <= 2 ? 'attack' : roll <= 4 ? 'rocket' : 'lifeslicer';
}

function scriptFor(special: UpgradeLevel): AiScript {
  return {
    id: experimentScriptId(special),
    decide(ctx) {
      const self = ctx.self;
      if (ctx.party().length === 0) return null;
      if (special === 1) return command('attack', special, ctx);
      if (special === 4) return command(special4Move(ctx), special, ctx);
      const cycle = EXPERIMENT_CYCLES[special];
      const step = mem(self, EXPERIMENT_STEP);
      setMem(self, EXPERIMENT_STEP, (step + 1) % cycle.length);
      return command(cycle[step % cycle.length]!, special, ctx);
    },
  };
}

/** One script per Special level: ids `x2-experiment-special-1` to `-5`. */
export const experimentScripts: readonly AiScript[] = UPGRADE_LEVELS.map(scriptFor);
