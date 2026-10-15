/**
 * The random numbers and target searches an FFX-2 boss script uses, in the shapes the game's scripts use them
 * (`research/re-ffx2-ai-bahamut-vegnagun.md` sections 1.3 and 1.4). **FFX-2 only** [AGENTS.md rule 14].
 *
 * One file for the three boss-AI lanes of re-parity (RC3 merged them; each section keeps its lane's shapes exactly, so each lane's
 * decision-table tests enumerate the same draws): **section 1** the shared rolls (lanes a, b and c), **section 2** the near-weighted
 * `searchr` and the scene table (lane a: Bahamut, the Vegnagun chain, Shuyin), **section 3** the helpers of lane b (Shiva, the Sisters,
 * Anima, Paragon, the Oversoul, Trema), **section 4** the helpers of lane c (the Leblanc Syndicate, the Den of Woe, Ixion).
 *
 * | Script call | Shape | Helper |
 * |---|---|---|
 * | `random() % n` | the low 16 bits of one draw, then the script's own `mod` | {@link scriptMod} (`rng`), {@link scriptModCtx} (`ctx`) |
 * | `searchr_nop(group, stat, word)` | the `(value mod n)`-th candidate in slot order; **no draw with fewer than 2 candidates** | {@link searchUniform}, {@link pickUniform}, {@link pickFrom} |
 * | `searchr(group, stat, word)` | `r = value mod W`, `W` the sum of the candidates' weights; the first candidate whose running sum reaches `r` (`r <= sum`, so the first slot owns one extra value) | {@link searchNear} |
 *
 * The game draws them from two global streams, 2 for `random()` and 4 for every search, and so does the engine now
 * (`adapt/streams.ts`; Bailey 2026-10-09 "Adopt game streams"). The search's raw value is the generator's 31-bit draw; a pick is that
 * value modulo the candidate count, along the candidates in slot order. The lanes wrote it in two shapes, `int(0, 2^31 - 1) % n` (lanes a and b)
 * and `int(0, n - 1)` (lane c's {@link pickFrom}); on a stream of the game's generator the two are the same number.
 *
 * The weight of a candidate is `1 + floor(32768 / floor(cost + 1))`, `cost = (1 + d) x (1 + 2a)`, `d` the distance on the
 * ground plane between boss and girl and `a` the angle (0 to pi) between the boss's facing and the direction to her. It is
 * the rule the note ran on the live exe in four geometries. What the exe knows and this engine does not is where everyone
 * stands at the moment of the poll, so {@link SCENES} gives the scene's start positions (the game's own, numbers only) with the
 * boss facing the middle of the party, which is the note's own worked example; `NEAR_WEIGHTED_TARGET_SEARCH` turns the
 * weights off and leaves the search uniform.
 */

import type { AbilityDef, StatusId } from '../../common/types.ts';
import type { BattleRng } from '../../common/streams.ts';
import { Ffx2ScriptStream } from '../adapt/streams.ts';
import { NEAR_WEIGHTED_TARGET_SEARCH } from '../constants.ts';
import type { AiContext, Ffx2Unit } from '../internal.ts';
import { resolveCommand } from '../adapt/command.ts';

// ---------------------------------------------------------------------------------------------------------------------------------
// 1. The shared rolls (lanes a, b, c)
// ---------------------------------------------------------------------------------------------------------------------------------

/** The raw value of a target search: the engine's 31-bit draw. */
const SEARCH_DRAW_MAX = 0x7fffffff;

/** `random()`: one draw of the shared stream, 0 to 0xFFFF. */
export function scriptValue(rng: BattleRng): number {
  return rng.on(Ffx2ScriptStream.Random).int(0, 0xffff);
}

/** `random() % n`, one draw. */
export function scriptMod(rng: BattleRng, n: number): number {
  return scriptValue(rng) % n;
}

/** {@link scriptMod} for a script that holds the AI context (lane b's call shape): `random() mod n`, one draw from the context's generator. */
export function scriptModCtx(ctx: AiContext, n: number): number {
  return scriptMod(ctx.rng, n);
}

/** The candidates in the order the searches index them: the party's slots Yuna, Rikku, Paine, then any others; ties keep the given order. */
export function inSlotOrder<T extends Ffx2Unit>(list: readonly T[]): T[] {
  return list
    .map((unit, i) => ({ unit, i }))
    .sort((a, b) => a.unit.slot - b.unit.slot || a.i - b.i)
    .map((e) => e.unit);
}

/** A search whose result the script throws away still draws when it had two or more candidates (the Tail's sweeps). */
export function spendSearchDraw(rng: BattleRng, candidateCount: number): void {
  if (candidateCount >= 2) rng.on(Ffx2ScriptStream.Search).int(0, SEARCH_DRAW_MAX);
}

/** `searchr_nop`: a uniform pick; `undefined` for no candidate (the game's "nothing"), no draw below two. */
export function searchUniform<T extends Ffx2Unit>(rng: BattleRng, candidates: readonly T[]): T | undefined {
  const ordered = inSlotOrder(candidates);
  if (ordered.length < 2) return ordered[0];
  return ordered[rng.on(Ffx2ScriptStream.Search).int(0, SEARCH_DRAW_MAX) % ordered.length];
}

// ---------------------------------------------------------------------------------------------------------------------------------
// 2. The near-weighted search and the scene table (lane a)
// ---------------------------------------------------------------------------------------------------------------------------------

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
 * **`besaid`** is Valefor's room, Besaid Temple's trial room (formation 0393 `bsyt05_229`; the RE review of 2026-10-14, `pos_bsyt05_229.psc`, which is byte for byte Ixion's `pos` file): the boss
 * at (0, 26), Yuna (0, -27), Rikku (-12, -25), Paine (12, -25). Her Sonic Wings takes the greatest ground distance (Yuna at the start, 53.00 against 52.39 for Rikku and Paine) and her Attack
 * the near-weighted pick (Yuna 41.9 percent, Rikku 29.1, Paine 29.0), `./valefor.ts`.
 */
export const SCENES = {
  bahamut: { boss: { x: 0, z: 30 }, girls: [{ x: 0, z: -20 }, { x: -17, z: -25 }, { x: 17, z: -25 }] },
  tail: { boss: { x: -33, z: 73 }, girls: [{ x: 1, z: -43 }, { x: 29, z: -48 }, { x: 38, z: -16 }] },
  leg: { boss: { x: -70.83, z: 50.85 }, girls: [{ x: -7, z: -34 }, { x: 13, z: -29 }, { x: 28, z: -14 }] },
  shuyin: { boss: { x: 0, z: 0 }, girls: [{ x: -30, z: 27.6 }, { x: -11, z: 35 }, { x: -40, z: 10.6 }] },
  besaid: { boss: { x: 0, z: 26 }, girls: [{ x: 0, z: -27 }, { x: -12, z: -25 }, { x: 12, z: -25 }] },
  // Angra Mainyu's room (the five Bikanel desert scenes `bika07_229`, `bika08_229`, `bika09_229`, `bika13_229`, `bika14_229`, whose `pos_*.psc` is byte for byte the same; the RE note of 2026-10-14, §8.2): the body at
  // (-45, -13), Yuna (23, 29), Rikku (33, 11), Paine (32, -9); ground distances 79.93, 81.61 and 77.10. The arms' own spots are unknown (both read (0, 0) and the body's script links them to its model): `./angra-mainyu.ts`.
  angra: { boss: { x: -45, z: -13 }, girls: [{ x: 23, z: 29 }, { x: 33, z: 11 }, { x: 32, z: -9 }] },
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
export function searchNear<T extends Ffx2Unit>(rng: BattleRng, candidates: readonly T[], scene: Scene): T | undefined {
  const ordered = inSlotOrder(candidates);
  if (ordered.length < 2) return ordered[0];
  const raw = rng.on(Ffx2ScriptStream.Search).int(0, SEARCH_DRAW_MAX);
  if (!NEAR_WEIGHTED_TARGET_SEARCH) return ordered[raw % ordered.length];
  return ordered[pickIndexByWeights(raw, sceneWeights(scene, ordered.map((u) => u.slot)))];
}

/** The girls without `status`, in slot order (`searchr(.., stat, not)`'s candidates). */
export function lacking<T extends Ffx2Unit>(girls: readonly T[], status: StatusId): T[] {
  return girls.filter((g) => !g.statuses[status]);
}

// ---------------------------------------------------------------------------------------------------------------------------------
// 3. The helpers of lane b (Shiva, the Magus Sisters, Anima, Paragon, the Oversoul Paragon, Trema)
//    - the reaction guard (`getreaction`) is false when the actor is the one who caused the result, or is stopped, asleep,
//      petrified, confused, berserk or ejected;
//    - a uniform target (`searchr_nop`, and the `searchr` pick stood in for it where the engine has no battle geometry) keeps the
//      living, targetable members in slot order and takes the `(value mod n)`-th; with one candidate nothing is drawn.
//    65,536 is not a multiple of 3, 5 or 6, so those residues are not exactly even: the game's bias is kept, not smoothed.
// ---------------------------------------------------------------------------------------------------------------------------------

/** The party's living, targetable members in slot order (the order the target searches scan). */
export function girlsInSlotOrder(ctx: AiContext): Ffx2Unit[] {
  return [...ctx.party()].sort((a, b) => a.slot - b.slot);
}

/**
 * A uniform pick among `candidates` (already filtered and in slot order): the `(draw mod n)`-th, no draw below two candidates,
 * `undefined` for none. The target search of the scripts that use `searchr_nop`; the near-weighted `searchr` of Paragon's
 * single-target Attacks needs positions and facing the engine does not model, so it is this pick too (the rows P3, listed).
 */
export function pickUniform<T>(ctx: AiContext, candidates: readonly T[]): T | undefined {
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];
  return candidates[ctx.rng.on(Ffx2ScriptStream.Search).int(0, SEARCH_DRAW_MAX) % candidates.length];
}

/** A uniform living girl as a target list: one id, or no target. */
export function pickGirl(ctx: AiContext): string[] {
  const girl = pickUniform(ctx, girlsInSlotOrder(ctx));
  return girl === undefined ? [] : [girl.id];
}

/** One target search whose answer the script throws away: it still draws, with two or more candidates (Final Impact's macro). */
export function discardPick(ctx: AiContext, candidates: readonly unknown[]): void {
  pickUniform(ctx, candidates);
}

/** Statuses that switch the reaction entry off (`getreaction`): stopped, asleep, petrified, confused, berserk, ejected. */
const REACTION_OFF = ['stop', 'sleep', 'petrify', 'confuse', 'berserk', 'eject'] as const;

/**
 * `getreaction`: true unless the actor is the attacker itself, or is stopped, asleep, petrified, confused, berserk or ejected.
 * Shiva and Anima test it; the Sisters, both Paragon scripts and Trema do not (1.2).
 */
export function reactionGuard(self: Ffx2Unit, source: Ffx2Unit): boolean {
  if (self === source || self.id === source.id) return false;
  if (self.removed) return false;
  return !REACTION_OFF.some((s) => self.statuses[s] !== undefined);
}

/** A command row's damage flags masked with 3 (`getcominfo(cmd, 1)`): 1 physical only, 2 magical only, 0 neither. */
export function damageBits(ability: AbilityDef, user: Ffx2Unit): number {
  return resolveCommand(ability, user).record.flagsDamage & 3;
}

/** `floor(max / n)` of a unit's own maximum HP (the scripts' integer-division thresholds). */
export function maxHpDiv(unit: Ffx2Unit, n: number): number {
  return Math.floor(unit.stats.maxHp / n);
}

// ---------------------------------------------------------------------------------------------------------------------------------
// 4. The helpers of lane c (the Leblanc Syndicate, the Den of Woe, Ixion)
//    A target search keeps the girls that are alive and targetable (a petrified girl is alive), in slot order. With one candidate nothing
//    is drawn; with two or more the pick is the `(value mod n)`-th candidate ({@link pickFrom}). `searchr` is weighted by closeness and
//    facing, which needs positions the engine does not have, so it is the same uniform pick here. The common pair,
//    `searchr(all girls, alive)` then `searchr(that set, stat, max or min)`, still makes its first search's draw when two or more girls
//    live and throws the pick away; the second keeps every candidate tied for the extreme value and picks among the ties ({@link extremePick}).
// ---------------------------------------------------------------------------------------------------------------------------------

/** The girls a search sees: alive and targetable, in slot order (Yuna, Rikku, Paine). The same list as {@link girlsInSlotOrder}. */
export function girls(ctx: AiContext): Ffx2Unit[] {
  return girlsInSlotOrder(ctx);
}

/** A search over `pool`: the `(value mod n)`-th candidate; nothing is drawn for fewer than two. */
export function pickFrom<T>(rng: BattleRng, pool: readonly T[]): T | undefined {
  if (pool.length === 0) return undefined;
  if (pool.length === 1) return pool[0];
  return pool[rng.on(Ffx2ScriptStream.Search).int(0, pool.length - 1)];
}

/** The id of a search over `pool` as a one-target list, or an empty list ("nothing", value 255). */
export function pickId(rng: BattleRng, pool: readonly Ffx2Unit[]): string[] {
  const unit = pickFrom(rng, pool);
  return unit === undefined ? [] : [unit.id];
}

/** The first search of a pair: made, and its pick thrown away. */
export function discardedPick(rng: BattleRng, candidates: number): void {
  if (candidates >= 2) rng.on(Ffx2ScriptStream.Search).int(0, candidates - 1);
}

/**
 * The pair for "the girl with the highest or lowest `key`": the first search over `pool` is made and discarded,
 * then every candidate tied for the extreme is kept and one is picked.
 */
export function extremePick(rng: BattleRng, pool: readonly Ffx2Unit[], key: (unit: Ffx2Unit) => number, extreme: 'max' | 'min'): Ffx2Unit | undefined {
  discardedPick(rng, pool.length);
  if (pool.length === 0) return undefined;
  const values = pool.map(key);
  const best = extreme === 'max' ? Math.max(...values) : Math.min(...values);
  return pickFrom(rng, pool.filter((_, i) => values[i] === best));
}

/** `extremePick` as a one-target list. */
export function extremeId(rng: BattleRng, pool: readonly Ffx2Unit[], key: (unit: Ffx2Unit) => number, extreme: 'max' | 'min'): string[] {
  const unit = extremePick(rng, pool, key, extreme);
  return unit === undefined ? [] : [unit.id];
}
