/**
 * Jenova LIFE's script, the altar of the Forgotten Capital [jl §5, verified: 3 sources: the Speedrun wiki's script
 * in Fergusson's shape, Lifestream Encore, and the 09-27 plan for the dial; `research/ff7-jenova-life.md`].
 * Behaviour-exact restatement:
 *
 * ```
 * SETUP    Count = a uniform draw of 0, 1, 2 or 3;  SpclChance = 5
 * MAIN     Count 0 or 1: Blue Light on a random opponent; then 1 in SpclChance: a second Blue Light on another
 *                        random opponent in the same turn; Count + 1
 *          Count 2:      Blue Flame on a random opponent; then 1 in SpclChance: Count = 3, else Count = 0
 *          Count 3:      Aqualung on all opponents; Count = 0
 * COUNTER General:  SpclChance = 5 above 75% HP, 4 at 75% or less, 3 at 50% or less, 2 at 25% or less
 * COUNTER Magical:  no Reflect and at least 30 MP: Reflect on herself
 * ```
 *
 * So the cycle is Blue Light, Blue Light, Blue Flame and, one time in SpclChance, Aqualung, entered at a random
 * point (one battle in four opens on Aqualung). One variable raises both the chance of the double Blue Light and the
 * chance that Blue Flame becomes Aqualung: 1 in 5 at full health, 1 in 2 below a quarter.
 *
 * **What the sources do not say, and what this does** (each `[estimate]`, jl §5, §11): the General counter fires on a
 * miss too (as the Guard Scorpion's does); the "random opponent" draws among the **living** (the Guard Scorpion
 * script's rule); "another random opponent" is a draw among the living but the first mark when there is only one;
 * an unaffordable pick makes the turn fail silently (`resolve.ts#payFor`). **Draw order** (our estimate, as every
 * draw order is): the Count in Setup; in Main the target `Rnd(0..n-1)` then the 1-in-SpclChance `Rnd(0..SpclChance-1)`
 * (a draw of 0 wins), and for the double Blue Light the second target after the roll. **The magical counter fires
 * after the spell has resolved**, so the first magic hit of the battle lands; every later reflectable spell turns back.
 *
 * She needs the MP for what she does: 300 MP is her only budget, Blue Light 8, Blue Flame 12, Aqualung 34, and the
 * Reflect counter 30 (jl §4). At 7 MP or less she can do nothing she scripts.
 *
 * Pure (AGENTS.md rule 1). Game case: **FF7 only.**
 */

import type { Ff7Combatant } from '../../common/types.ts';
import { hasStatus } from '../statuses.ts';
import { randomOpponent, type Ff7AiApi, type Ff7AiPlan, type Ff7AiScript } from './script.ts';

const COUNT = 'count';
const SPCL_CHANCE = 'spcl-chance';

/** Reflect costs 30 MP [jl §4, verified: 3 sources]; the counter needs that much in hand [jl §5, verified: 2 sources]. */
export const JENOVA_REFLECT_MP = 30;

/** The dial's value for her current HP: 5 above 75%, 4 at 75% or less, 3 at 50% or less, 2 at 25% or less [jl §5]. */
export function spclChanceFor(hp: number, maxHp: number): number {
  if (hp * 4 <= maxHp) return 2;
  if (hp * 2 <= maxHp) return 3;
  if (hp * 4 <= maxHp * 3) return 4;
  return 5;
}

/** Roll 1 in `n`: one `Rnd(0..n-1)` draw, a 0 wins. */
function oneIn(api: Ff7AiApi, n: number): boolean {
  return api.rng.int(0, Math.max(1, n) - 1) === 0;
}

/** Another living opponent than `first` (one draw), or `first` again when it is the only one left. */
function anotherOpponent(api: Ff7AiApi, first: Ff7Combatant): Ff7Combatant {
  const others = api.opponents().filter((c) => c.id !== first.id);
  if (others.length === 0) return first;
  return others[api.rng.int(0, others.length - 1)] ?? first;
}

export const jenovaLifeScript: Ff7AiScript = {
  setup(api) {
    api.set(COUNT, api.rng.int(0, 3));
    api.set(SPCL_CHANCE, 5);
  },

  main(api): Ff7AiPlan {
    const count = api.get(COUNT);
    const chance = api.get(SPCL_CHANCE) || 5;
    if (count <= 1) {
      const first = randomOpponent(api);
      api.set(COUNT, count + 1);
      const plan: Ff7AiPlan = { kind: 'ability', abilityId: 'blue-light', targets: [first.id] };
      if (oneIn(api, chance)) plan.followUps = [{ abilityId: 'blue-light', targets: [anotherOpponent(api, first).id] }];
      return plan;
    }
    if (count === 2) {
      const target = randomOpponent(api);
      api.set(COUNT, oneIn(api, chance) ? 3 : 0);
      return { kind: 'ability', abilityId: 'blue-flame', targets: [target.id] };
    }
    api.set(COUNT, 0);
    return { kind: 'ability', abilityId: 'aqualung', targets: api.opponents().map((c) => c.id) };
  },

  // After any action against her: the dial follows her HP. It runs a plan-less section: it only sets the variable.
  counterGeneral(api) {
    api.set(SPCL_CHANCE, spclChanceFor(api.self.hp, api.self.stats.maxHp));
    return null;
  },

  // After a magical attack hit her: Reflect on herself, once, while she has the MP. The engine pays the 30 MP.
  counterMagical(api) {
    if (hasStatus(api.self, 'reflect') || api.self.mp < JENOVA_REFLECT_MP) return null;
    return { kind: 'ability', abilityId: 'jenova-reflect', targets: [api.self.id] };
  },
};
