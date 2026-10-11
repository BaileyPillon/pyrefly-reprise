/**
 * The random numbers and target searches an FFX-2 boss script uses, in the shapes the game's scripts use them
 * (`research/re-ffx2-ai-bahamut-vegnagun.md` sections 1.3 and 1.4). **FFX-2 only** [AGENTS.md rule 14].
 *
 * | Script call | Shape | Helper |
 * |---|---|---|
 * | `random() % n` | the low 16 bits of one draw, then the script's own `mod` | {@link scriptMod} |
 * | `searchr_nop(group, stat, word)` | the `(value mod n)`-th candidate in slot order; **no draw with fewer than 2 candidates** | {@link searchUniform} |
 * | `searchr(group, stat, word)` | `r = value mod W`, `W` the sum of the candidates' weights; the first candidate whose running sum reaches `r` (`r <= sum`, so the first slot owns one extra value) | {@link searchNear} |
 *
 * The game draws them from two global streams (2 for `random()`, 4 for every search); this engine has one seeded stream and
 * feeds all of them from it (adopting each game's own streams is a separate decision of Bailey's, plan P3). The search's raw
 * value is a 31-bit draw: the note does not record its width, and 31 bits keep the modulo bias of a three-way pick below one
 * in 700 million.
 *
 * The weight of a candidate is `1 + floor(32768 / floor(cost + 1))`, `cost = (1 + d) x (1 + 2a)`, `d` the distance on the
 * ground plane between boss and girl and `a` the angle (0 to pi) between the boss's facing and the direction to her. It is
 * the rule the note ran on the live exe in four geometries. What the exe knows and this engine does not is where everyone
 * stands at the moment of the poll, so {@link SCENES} gives the scene's start positions (the game's own, numbers only) with the
 * boss facing the middle of the party, which is the note's own worked example; `NEAR_WEIGHTED_TARGET_SEARCH` turns the
 * weights off and leaves the search uniform.
 */

import type { Rng, StatusId } from '../../common/types.ts';
import { NEAR_WEIGHTED_TARGET_SEARCH } from '../constants.ts';
import type { Ffx2Unit } from '../internal.ts';

/** The raw value of a target search: the engine's 31-bit draw. */
const SEARCH_DRAW_MAX = 0x7fffffff;

/** `random()`: one draw of the shared stream, 0 to 0xFFFF. */
export function scriptValue(rng: Rng): number {
  return rng.int(0, 0xffff);
}

/** `random() % n`, one draw. */
export function scriptMod(rng: Rng, n: number): number {
  return scriptValue(rng) % n;
}

/** The candidates in the order the searches index them: the party's slots Yuna, Rikku, Paine, then any others; ties keep the given order. */
export function inSlotOrder<T extends Ffx2Unit>(list: readonly T[]): T[] {
  return list
    .map((unit, i) => ({ unit, i }))
    .sort((a, b) => a.unit.slot - b.unit.slot || a.i - b.i)
    .map((e) => e.unit);
}

/** A search whose result the script throws away still draws when it had two or more candidates (the Tail's sweeps). */
export function spendSearchDraw(rng: Rng, candidateCount: number): void {
  if (candidateCount >= 2) rng.int(0, SEARCH_DRAW_MAX);
}

/** `searchr_nop`: a uniform pick; `undefined` for no candidate (the game's "nothing"), no draw below two. */
export function searchUniform<T extends Ffx2Unit>(rng: Rng, candidates: readonly T[]): T | undefined {
  const ordered = inSlotOrder(candidates);
  if (ordered.length < 2) return ordered[0];
  return ordered[rng.int(0, SEARCH_DRAW_MAX) % ordered.length];
}

/** A place on the ground plane (the game's x and z). */
export interface Placement {
  x: number;
  z: number;
}

/** Where one scene starts its fight: the boss and the three girls by party slot. */
export interface Scene {
  boss: Placement;
  girls: readonly [Placement, Placement, Placement];
}

/**
 * The start positions of the scenes whose bosses use `searchr` (the scene's `PlayerPos` and `EnemyPos` lines, FFX2_Data.vbf
 * build 25501027). The Leg is the first enemy of its scene and Shuyin the fourth (the other three are the cannon's inert parts).
 */
export const SCENES = {
  bahamut: { boss: { x: 0, z: 30 }, girls: [{ x: 0, z: -20 }, { x: -17, z: -25 }, { x: 17, z: -25 }] },
  tail: { boss: { x: -33, z: 73 }, girls: [{ x: 1, z: -43 }, { x: 29, z: -48 }, { x: 38, z: -16 }] },
  leg: { boss: { x: -70.83, z: 50.85 }, girls: [{ x: -7, z: -34 }, { x: 13, z: -29 }, { x: 28, z: -14 }] },
  shuyin: { boss: { x: 0, z: 0 }, girls: [{ x: -30, z: 27.6 }, { x: -11, z: 35 }, { x: -40, z: 10.6 }] },
} as const satisfies Record<string, Scene>;

/** The weight of one candidate: `1 + floor(32768 / floor((1 + d)(1 + 2a) + 1))`. */
export function nearWeight(distance: number, angle: number): number {
  const cost = (1 + distance) * (1 + 2 * angle);
  return 1 + Math.floor(32768 / Math.floor(cost + 1));
}

/** The unit vector from the boss to the middle of the girls' start positions: the boss faces the party. */
function facingOf(scene: Scene): Placement {
  const mx = scene.girls.reduce((s, g) => s + g.x, 0) / scene.girls.length;
  const mz = scene.girls.reduce((s, g) => s + g.z, 0) / scene.girls.length;
  const dx = mx - scene.boss.x;
  const dz = mz - scene.boss.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: dx / len, z: dz / len };
}

/** The weights of the girls at `slots`, in that order, for a boss at the scene's start facing its party. */
export function sceneWeights(scene: Scene, slots: readonly number[]): number[] {
  const facing = facingOf(scene);
  return slots.map((slot, i) => {
    const girl = scene.girls[slot] ?? scene.girls[i] ?? scene.girls[0];
    const dx = girl.x - scene.boss.x;
    const dz = girl.z - scene.boss.z;
    const distance = Math.hypot(dx, dz);
    const cos = distance === 0 ? 1 : (dx * facing.x + dz * facing.z) / distance;
    return nearWeight(distance, Math.acos(Math.max(-1, Math.min(1, cos))));
  });
}

/** The index a raw value picks over `weights`: `r = raw mod W`, the first running sum that reaches `r`. */
export function pickIndexByWeights(raw: number, weights: readonly number[]): number {
  const total = weights.reduce((s, w) => s + w, 0);
  const r = raw % total;
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i] as number;
    if (r <= sum) return i;
  }
  return weights.length - 1;
}

/**
 * `searchr`: the near-weighted pick among `candidates` (already filtered to the living, targetable girls the script's test
 * keeps). `undefined` for no candidate, one candidate without a draw. With the weights off, a uniform pick.
 */
export function searchNear<T extends Ffx2Unit>(rng: Rng, candidates: readonly T[], scene: Scene): T | undefined {
  const ordered = inSlotOrder(candidates);
  if (ordered.length < 2) return ordered[0];
  const raw = rng.int(0, SEARCH_DRAW_MAX);
  if (!NEAR_WEIGHTED_TARGET_SEARCH) return ordered[raw % ordered.length];
  return ordered[pickIndexByWeights(raw, sceneWeights(scene, ordered.map((u) => u.slot)))];
}

/** The girls without `status`, in slot order (`searchr(.., stat, not)`'s candidates). */
export function lacking<T extends Ffx2Unit>(girls: readonly T[], status: StatusId): T[] {
  return girls.filter((g) => !g.statuses[status]);
}
