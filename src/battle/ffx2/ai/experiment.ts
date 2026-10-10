/**
 * The Experiment's action pattern, one script per Special level (FFX-2 Chapter 5, Djose Temple; our hidden chapter "The Experiment"). **FFX-2 only** [AGENTS.md rule 14].
 *
 * The game has ONE script with five branches (`m194`), and the branch is chosen by the battle scene the Djose event picks from the Special level: Special 1 to 5 are five different formations,
 * and the script tests the scene, never the level (`research/re-ffx2-experiment.md` §3 and §5.4, `[H]`: the source and the compiled script agree). Our two acts need two of them, 1 and 5, and
 * the model keeps all five, so the script id carries the level (`x2-experiment-special-N`), which is the same thing seen from our side. There is no reaction, no phase change, no counter and no
 * target-dependent branch: **the pattern, in the game's own order** (a "poll" is one call of the monster's action entry):
 *
 * ```
 * Special 1: Attack every poll
 * Special 2: Attack, Attack, Attack, Rocket Launcher (4 hits), repeat
 * Special 3: Attack, Attack, Rocket Launcher (6 hits), repeat; and in place of a poll, a Lifeslicer when its HP first falls below 60 percent, below 40 and below 20 (each once, the
 *            lowest line first; the counter jumps straight to 3, so a drop through several lines in one go fires ONE Lifeslicer and skips the rest), aimed at the girl with the most HP left
 * Special 4: each poll a roll of 6: 0 Lifeslicer (a living girl, uniform), 1 and 2 Rocket Launcher (8 hits), 3 to 5 Attack  (1/6, 2/6, 3/6)
 * Special 5: Rocket Launcher (10 hits), Attack, Rocket Launcher (10), Attack, Lifeslicer (a living girl, uniform), Annihilator, Attack, repeat
 * ```
 *
 * A Lifeslicer poll of Special 3 does not advance the cycle. An Attack goes to one living girl and a Rocket Launcher to all of them (each hit picks its own target: the engine does that for a
 * `random-enemy` ability, so it is issued with no targets); the Annihilator hits the whole party. **Not modelled:** the game weights an Attack's target by nearness (50, 25, 25 percent for the girls'
 * start positions; no FFX-2 script here has the positions to do it), so a girl is picked uniformly, as the other FFX-2 scripts do; and the dead "battle too long" block (it only counts while no
 * girl stands, and the gauge does not run then). Deterministic under the seeded RNG (`ctx.rng`).
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { EXPERIMENT_ACTIONS, UPGRADE_LEVELS, experimentScriptId, type UpgradeLevel } from '../../../data/ffx2/enemies/experiment-levels.ts';

/** AI memory: where the cycle stands (the game's `turn`), and which of Special 3's three HP bands have fired (its `chestbeam`, 0 to 3). */
export const EXPERIMENT_STEP = 'experimentStep';
export const EXPERIMENT_HP_TRIGGERS = 'experimentHpTriggers';

type Move = 'attack' | 'rocket' | 'lifeslicer' | 'annihilator';

/** The cycles (Special 2, 3, 5), in order; Special 1 is one Attack, Special 4 is a roll. */
export const EXPERIMENT_CYCLES: Readonly<Record<2 | 3 | 5, readonly Move[]>> = {
  2: ['attack', 'attack', 'attack', 'rocket'],
  3: ['attack', 'attack', 'rocket'],
  5: ['rocket', 'attack', 'rocket', 'attack', 'lifeslicer', 'annihilator', 'attack'],
};

/** Special 4's roll of 6: 0 Lifeslicer, 1 and 2 Rocket Launcher, 3 to 5 Attack (16.7, 33.3 and 50 percent). */
export const EXPERIMENT_SPECIAL_4_ROLL: readonly Move[] = ['lifeslicer', 'rocket', 'rocket', 'attack', 'attack', 'attack'];

/** Special 3's HP lines as the script tests them: `HP x 5 < maxHP x k` with k = 3, 2, 1 (60, 40 and 20 percent; with 18,324 HP: 10,994, 7,329 and 3,664 or below). */
export const EXPERIMENT_SPECIAL_3_BANDS: readonly number[] = [3, 2, 1];

function randomGirl(ctx: AiContext): string[] {
  const party = ctx.party();
  return party.length > 0 ? [ctx.rng.pick(party).id] : [];
}

/** The living girl with the most HP; a tie is broken at random (the game breaks it by nearness). */
function highestHpGirl(ctx: AiContext): string[] {
  const party = ctx.party();
  if (party.length === 0) return [];
  const top = Math.max(...party.map((g) => g.hp));
  const tied = party.filter((g) => g.hp === top);
  return [(tied.length === 1 ? tied[0]! : ctx.rng.pick(tied)).id];
}

function command(move: Move, special: UpgradeLevel, ctx: AiContext): Command {
  switch (move) {
    case 'attack':
      return { kind: 'ability', id: EXPERIMENT_ACTIONS.attack, targets: randomGirl(ctx) };
    case 'rocket':
      // Level 2 brings the 4-hit row, 3 the 6-hit, 4 the 8-hit and 5 the 10-hit: variant A to D (`experiment-abilities.ts`).
      return { kind: 'ability', id: EXPERIMENT_ACTIONS.rocketLauncher[Math.max(0, special - 2)]!, targets: [] };
    case 'lifeslicer':
      return { kind: 'ability', id: EXPERIMENT_ACTIONS.lifeslicer, targets: randomGirl(ctx) };
    case 'annihilator':
      return { kind: 'ability', id: EXPERIMENT_ACTIONS.annihilator, targets: [] };
  }
}

/** Special 3's HP bands: the lowest line first, the counter set straight to its line's number (so one Lifeslicer a drop). Returns the Lifeslicer, or null for the ordinary cycle. */
function special3Band(ctx: AiContext): Command | null {
  const self = ctx.self;
  const fired = mem(self, EXPERIMENT_HP_TRIGGERS);
  const below = (k: number): boolean => self.hp * 5 < self.stats.maxHp * k;
  let band = 0;
  const [k60, k40, k20] = EXPERIMENT_SPECIAL_3_BANDS as readonly [number, number, number];
  if (below(k20) && fired <= 2) band = 3;
  else if (below(k40) && fired <= 1) band = 2;
  else if (below(k60) && fired === 0) band = 1;
  if (band === 0) return null;
  setMem(self, EXPERIMENT_HP_TRIGGERS, band);
  return { kind: 'ability', id: EXPERIMENT_ACTIONS.lifeslicer, targets: highestHpGirl(ctx) };
}

function scriptFor(special: UpgradeLevel): AiScript {
  return {
    id: experimentScriptId(special),
    decide(ctx) {
      const self = ctx.self;
      if (ctx.party().length === 0) return null;
      if (special === 1) return command('attack', special, ctx);
      if (special === 4) return command(EXPERIMENT_SPECIAL_4_ROLL[ctx.rng.int(0, 5)]!, special, ctx);
      if (special === 3) {
        const slice = special3Band(ctx);
        if (slice) return slice; // a Lifeslicer poll does not advance the cycle
      }
      const cycle = EXPERIMENT_CYCLES[special];
      const step = mem(self, EXPERIMENT_STEP);
      setMem(self, EXPERIMENT_STEP, (step + 1) % cycle.length);
      return command(cycle[step % cycle.length]!, special, ctx);
    },
  };
}

/** One script per Special level: ids `x2-experiment-special-1` to `-5`. */
export const experimentScripts: readonly AiScript[] = UPGRADE_LEVELS.map(scriptFor);
