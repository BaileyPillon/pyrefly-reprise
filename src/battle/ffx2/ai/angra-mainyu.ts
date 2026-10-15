/**
 * **Angra Mainyu and his two arms** at the Bikanel excavation camp (FFX-2 Chapter 5; the hidden chapter "Angra Mainyu"). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Source: `research/ffx2-angra-mainyu.md` ("§n"). **No script of these three monsters was read** (§0.2): the order below is the written sources' description (`[search]`, read through the web search tool's
 * summaries) put in order by me (`[inferred]`), and every odd is `[estimate]` (§4). Every move's numbers are other monsters' rows of the game's own table standing in, or estimates
 * (`data/ffx2/enemies/angra-mainyu-abilities.ts`).
 *
 * ## Angra Mainyu's turn (§4.1)
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | an arm is down, and he has the MP for Full-Life | **Full-Life** on it (Tawrich first when both are down) `[search: 4 sources]` |
 * | 2 | an arm is down, and he lacks the MP | **Osmose** on a random girl `[search: 2 sources]` |
 * | 3 | both arms stand, and the Flame is due: his first turn, or the seventh of his turns since the last | **Perdition's Flame** at random girls, ten hits `[search: single source]` for the clock, `[search: 2 sources]` for "both arms" |
 * | 4 | otherwise | **Demi** (every girl), **Flare** (one girl) or **Curaga** (himself) at equal odds `[estimate]`; one he cannot pay for becomes **Osmose** |
 *
 * Every one of his turns counts toward the Flame's clock, a revive included: when the arms have kept it waiting, it comes on the first turn both stand again. A Flame chosen while both arms
 * stand goes off even if they fall during its cast: the turn decides, as a GameFAQs poster explains the one Flame he saw with both arms down (`[search: single source]`, conflict A-4).
 *
 * ## The arms (§4.2, `[estimate]`)
 *
 * - **Tawrich**: Bloody Breath on every girl one turn in three, else Punch on a random girl.
 * - **Zarich**: Glimmer of Despair on every girl one turn in five; else an -ara spell (two in five) or an -aga spell (two in five) of a random element, on a random girl.
 *
 * RNG: one `random() mod n` draw (stream 2) per choice, and the uniform target search (stream 4), as the house scripts do (`./script-rolls.ts`).
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { girls, pickId, scriptModCtx } from './script-rolls.ts';

/** The ids, mirrored from `src/data/angra-mainyu-ids.ts` (`src/battle/**` imports no `src/data/**`; a test pins the two). */
export const ANGRA_ID = 'x2-angra-mainyu';
export const TAWRICH_ID = 'x2-tawrich';
export const ZARICH_ID = 'x2-zarich';
export const ANGRA_SCRIPT = 'x2-angra-mainyu';
export const TAWRICH_SCRIPT = 'x2-tawrich';
export const ZARICH_SCRIPT = 'x2-zarich';
export const ANGRA_ABILITY = {
  perditionsFlame: 'x2-angra-perditions-flame',
  demi: 'x2-angra-demi',
  flare: 'x2-angra-flare',
  curaga: 'x2-angra-curaga',
  fullLife: 'x2-angra-full-life',
  osmose: 'x2-angra-osmose',
} as const;
export const TAWRICH_ABILITY = { punch: 'x2-tawrich-punch', bloodyBreath: 'x2-tawrich-bloody-breath' } as const;
export const ZARICH_ABILITY = {
  ara: ['x2-zarich-fira', 'x2-zarich-blizzara', 'x2-zarich-thundara', 'x2-zarich-watera'],
  aga: ['x2-zarich-firaga', 'x2-zarich-blizzaga', 'x2-zarich-thundaga', 'x2-zarich-waterga'],
  glimmer: 'x2-zarich-glimmer-of-despair',
} as const;

/** The arms in the order he revives them: Tawrich (the right) first. */
export const ARMS = [TAWRICH_ID, ZARICH_ID] as const;

/** "Again 7 turns later" (§4.1, `[search: single source]`): the Flame comes on the seventh of his turns after the last. */
export const FLAME_EVERY = 7;
/** AI memory: his turns since the last Flame (it starts one short, so his first turn is a Flame). */
export const SINCE_FLAME = 'sinceFlame';
/** The MP each of his casts costs (mirrors `ANGRA_FULL_LIFE_MP` and `ANGRA_MP_COST` of the data, `[estimate]`); a test pins the two. */
export const ANGRA_MP = { fullLife: 60, demi: 10, flare: 54, curaga: 20 } as const;

/** Tawrich: Bloody Breath when `random() mod 3` is this (one in three). */
export const TAWRICH_BREATH_ROLL = 0;
/** Zarich: `random() mod 5`: 0 Glimmer of Despair, 1 or 2 an -ara spell, 3 or 4 an -aga spell. */
export const ZARICH_GLIMMER_ROLL = 0;

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

function unit(ctx: AiContext, id: string): Ffx2Unit | undefined {
  return ctx.units.find((u) => u.id === id);
}

/** An arm on the field and fallen (a removed unit is gone for good, never revived). */
function fallen(ctx: AiContext, id: string): Ffx2Unit | undefined {
  const arm = unit(ctx, id);
  return arm && !arm.removed && (!arm.alive || arm.hp <= 0) ? arm : undefined;
}

/** True when both arms stand. */
export function bothArmsStand(ctx: AiContext): boolean {
  return ARMS.every((id) => {
    const arm = unit(ctx, id);
    return arm !== undefined && !arm.removed && arm.alive && arm.hp > 0;
  });
}

/** Osmose on a random girl (his answer to an empty purse). */
function osmose(ctx: AiContext): Command {
  return use(ANGRA_ABILITY.osmose, pickId(ctx.rng, girls(ctx)));
}

/** One of Angra Mainyu's turns. */
export const angraMainyuScript: AiScript = {
  id: ANGRA_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    if (girls(ctx).length === 0) return null;
    const since = mem(self, SINCE_FLAME, FLAME_EVERY - 1) + 1;
    setMem(self, SINCE_FLAME, since);

    // 1 and 2: a fallen arm is raised while he has the MP; without it, he drains a girl's.
    const down = ARMS.map((id) => fallen(ctx, id)).find((arm) => arm !== undefined);
    if (down) return self.mp >= ANGRA_MP.fullLife ? use(ANGRA_ABILITY.fullLife, [down.id]) : osmose(ctx);

    // 3: the Flame, while both arms stand.
    if (since >= FLAME_EVERY && bothArmsStand(ctx)) {
      setMem(self, SINCE_FLAME, 0);
      ctx.emit({ type: 'charge', enemyId: self.id, name: "Perdition's Flame", turnsLeft: 0, stage: 2 });
      return use(ANGRA_ABILITY.perditionsFlame, []);
    }

    // 4: Demi, Flare or Curaga, one he can pay for.
    const roll = scriptModCtx(ctx, 3);
    if (roll === 0) return self.mp >= ANGRA_MP.demi ? use(ANGRA_ABILITY.demi, []) : osmose(ctx);
    if (roll === 1) return self.mp >= ANGRA_MP.flare ? use(ANGRA_ABILITY.flare, pickId(ctx.rng, girls(ctx))) : osmose(ctx);
    return self.mp >= ANGRA_MP.curaga ? use(ANGRA_ABILITY.curaga, [self.id]) : osmose(ctx);
  },
};

/** One of Tawrich's turns. */
export const tawrichScript: AiScript = {
  id: TAWRICH_SCRIPT,
  decide(ctx) {
    if (girls(ctx).length === 0) return null;
    if (scriptModCtx(ctx, 3) === TAWRICH_BREATH_ROLL) return use(TAWRICH_ABILITY.bloodyBreath, []);
    return use(TAWRICH_ABILITY.punch, pickId(ctx.rng, girls(ctx)));
  },
};

/** One of Zarich's turns. */
export const zarichScript: AiScript = {
  id: ZARICH_SCRIPT,
  decide(ctx) {
    if (girls(ctx).length === 0) return null;
    const roll = scriptModCtx(ctx, 5);
    if (roll === ZARICH_GLIMMER_ROLL) return use(ZARICH_ABILITY.glimmer, []);
    const tier = roll <= 2 ? ZARICH_ABILITY.ara : ZARICH_ABILITY.aga;
    const spell = tier[scriptModCtx(ctx, tier.length)] ?? tier[0];
    return use(spell, pickId(ctx.rng, girls(ctx)));
  },
};

export const angraMainyuScripts: readonly AiScript[] = [angraMainyuScript, tawrichScript, zarichScript];
