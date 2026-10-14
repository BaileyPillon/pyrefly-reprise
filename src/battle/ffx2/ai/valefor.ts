/**
 * Valefor at Besaid Temple (FFX-2 Chapter 3, "Protect Besaid Temple!"; the hidden chapter "Valefor at Besaid"). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The order below is the game's own script, `m164`** (the RE session's review of 2026-10-14: "RE review 2026-10-14, m164, row 164, pos_bsyt05_229", `research/re-ffx2-ai-valefor.md`; the first build was
 * the research's description, `research/ffx2-fallen-aeons.md` §7.1, `[verified: 2 sources]`, which the script confirms in outline: Normal Attack 2/3 and Sonic Wings 1/3, +5 a count, Energy Ray at 30 and
 * 60, the Energy Blast at 100). The script has one gauge and a "Rays fired" counter, **no HP phases** (it reads none of her own HP, MP or statuses) and **no timer** (nothing scripted ends the fight;
 * the "too long" Meteor block never runs: none is added here). Each turn, in this order `[script]`:
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | gauge at least 100 | gauge := 0 and Rays fired := 0; **Energy Blast** on every girl |
 * | 2 | else gauge at least 60 and fewer than 2 Rays fired | one more Ray fired; **Energy Ray** on every girl |
 * | 3 | else gauge at least 30 and no Ray fired | Rays fired := 1; **Energy Ray** on every girl |
 * | 4 | else (an attack-class turn) gauge + 5, then `random() mod 3` | 0 **Sonic Wings** on the girl at the greatest ground distance; 1 or 2 **Normal Attack** on a near-weighted living girl |
 *
 * **The gauge is read BEFORE the turn's own gain**, and the Ray and Blast turns add nothing. With nobody hitting her, the Rays come on her 7th and 14th turn and the Blast on her 23rd. Every result applied to her
 * (a landing strike, a miss or a no-effect result, never her own) adds 5 through the reaction handler (`resultGauge(5)`; Valefor is immune to every status that would switch the handler off, so its guard only
 * filters her own results). RNG `[script]`: `random()` on stream 2, **one draw per attack-class turn only**; the target searches on stream 4 (a search over fewer than two candidates draws nothing).
 *
 * **Targets, from the Besaid scene's start positions** (`./script-rolls.ts` `SCENES.besaid`, `pos_bsyt05_229.psc`; the engine tracks no later movement, as for every other boss that uses `searchr`):
 *
 * - **Normal Attack**: the near-weighted pick of a living girl (`searchNear`: weight by ground distance and angle from the boss's facing): at the start Yuna 41.9 percent, Rikku 29.1, Paine 29.0.
 * - **Sonic Wings**: the girl at the **greatest 2-D ground distance** from the boss: Yuna at the start (53.00 against 52.39 for Rikku and Paine). Body radii are not read, so exact ties (Rikku and Paine, when Yuna is
 *   down) are near-weighted, and an unambiguous extreme draws nothing. (The first build used Ormi's stand-in, the highest slot; the game's own positions replace it. `[script]`; whether m164 makes a first,
 *   discarded search before this one is in the note's search idiom: none is made here, as for Ormi's single `searchr`.)
 * - **Energy Ray and Energy Blast**: the whole party. The research says "everyone in a 160 degree arc in front of her"; the script's Ray is on all girls (the girls stand in front of the boss in every start
 *   formation on record, the largest angle from the boss's facing is about 17 degrees against an 80 degree half-arc, and the engine tracks no later movement), so **Energy Ray hits every living girl, as the Blast does**.
 *
 * What the data layer carries beside this script (`src/data/ffx2/enemies/valefor-abilities.ts`, `monster-records/records-valefor.ts`): Energy Ray is magical (Shell halves it) and **Energy Blast is not**
 * (its row has damage flags 0: neither Shell nor Protect reduces it); Sonic Wings is physical (Protect applies), MP damage only, and never misses.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { AC, AC_OVERDRIVE, acOf, bumpAc, resultGauge } from './fallen-aeons.ts';
import { SCENES, girls, scriptModCtx, searchNear } from './script-rolls.ts';

/** The script id (`EnemyFields.aiScriptId`; the data file `src/data/ffx2/enemies/valefor.ts` names the same string, a test pins it). */
export const VALEFOR_SCRIPT = 'x2-valefor';

/** The ability ids (the data file `valefor-abilities.ts` owns the rows; `src/battle/**` imports no `src/data/**`, so a test pins these against it). */
export const VALEFOR_ABILITY = {
  attack: 'x2-valefor-attack',
  sonicWings: 'x2-valefor-sonic-wings',
  energyRay: 'x2-valefor-energy-ray',
  energyBlast: 'x2-valefor-energy-blast',
} as const;

/** AI memory: how many Energy Rays have gone since the last Blast (the script's "Rays fired" counter: 0, 1 or 2). */
export const VALEFOR_RAYS_FIRED = 'valeforRays';

/** The gauge marks `[script]`: the first Ray at 30 (none fired yet), the second at 60 (fewer than two fired); the Overdrive is {@link AC_OVERDRIVE}. */
export const VALEFOR_RAY_MARKS: readonly [number, number] = [30, 60];
/** Rays per cycle. */
export const VALEFOR_RAYS_PER_CYCLE = 2;
/** The gauge gained by an attack-class turn, and per result applied to her `[script]`. */
export const VALEFOR_AC_PER_ACTION = 5;
export const VALEFOR_AC_PER_RESULT = 5;
/** The roll value (`random() mod 3`) that is Sonic Wings: 1 of 3, so Normal Attack gets the other 2 of 3 `[script]`. */
export const VALEFOR_SONIC_WINGS_ROLL = 0;

/** Valefor's room: the boss and the girls' start positions (`pos_bsyt05_229.psc`, `[script]`). */
export const VALEFOR_SCENE = SCENES.besaid;

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** The ground distance from the boss to the girl at party slot `slot`, in the game's units, from the scene's start positions. */
export function groundDistance(slot: number): number {
  const girl = VALEFOR_SCENE.girls[slot] ?? VALEFOR_SCENE.girls[0];
  return Math.hypot(girl.x - VALEFOR_SCENE.boss.x, girl.z - VALEFOR_SCENE.boss.z);
}

/**
 * "The character furthest away": the living girl(s) at the greatest ground distance (Yuna at the start); an unambiguous extreme draws nothing, exact ties are near-weighted (`searchNear`),
 * one draw among two or more. `[script]`, from the Besaid scene's own start positions.
 */
export function furthestGirl(ctx: AiContext): string[] {
  const alive = girls(ctx);
  if (alive.length === 0) return [];
  const farthest = Math.max(...alive.map((u) => groundDistance(u.slot)));
  const tied = alive.filter((u) => Math.abs(groundDistance(u.slot) - farthest) < 1e-9);
  const pick = searchNear(ctx.rng, tied, VALEFOR_SCENE);
  return pick === undefined ? [] : [pick.id];
}

/** The Normal Attack's target: the near-weighted pick of a living girl (one draw with two or more). `[script]`. */
export function attackTarget(ctx: AiContext): string[] {
  const pick = searchNear(ctx.rng, girls(ctx), VALEFOR_SCENE);
  return pick === undefined ? [] : [pick.id];
}

export const x2ValeforScript: AiScript = {
  id: VALEFOR_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    if (girls(ctx).length === 0) return null;
    // The gauge as it stands: a turn's own gain comes only in the attack-class branch below.
    const gauge = acOf(self);
    const rays = mem(self, VALEFOR_RAYS_FIRED);
    // 1: the Blast resets the gauge and the Ray counter.
    if (gauge >= AC_OVERDRIVE) {
      setMem(self, AC, 0);
      setMem(self, VALEFOR_RAYS_FIRED, 0);
      return use(VALEFOR_ABILITY.energyBlast, []);
    }
    // 2 and 3: an Energy Ray at each mark the gauge has reached and the counter has not answered (a gauge that jumps past both gives two Rays on her next two turns).
    if (gauge >= VALEFOR_RAY_MARKS[1] && rays < VALEFOR_RAYS_PER_CYCLE) {
      setMem(self, VALEFOR_RAYS_FIRED, rays + 1);
      return use(VALEFOR_ABILITY.energyRay, []);
    }
    if (gauge >= VALEFOR_RAY_MARKS[0] && rays === 0) {
      setMem(self, VALEFOR_RAYS_FIRED, 1);
      return use(VALEFOR_ABILITY.energyRay, []);
    }
    // 4: an attack-class turn: the gauge gains 5, then one in three Sonic Wings on the farthest girl, else a Normal Attack on a near-weighted girl.
    bumpAc(self, VALEFOR_AC_PER_ACTION);
    if (scriptModCtx(ctx, 3) === VALEFOR_SONIC_WINGS_ROLL) return use(VALEFOR_ABILITY.sonicWings, furthestGirl(ctx));
    return use(VALEFOR_ABILITY.attack, attackTarget(ctx));
  },
  ...resultGauge(VALEFOR_AC_PER_RESULT),
};
