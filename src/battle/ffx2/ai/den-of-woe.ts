/**
 * The three shades of the Den of Woe (Chapter XV): Baralai, Gippal, Nooj.
 * **FFX-2 only** [AGENTS.md rule 14]. Source: `research/ffx2-gippal-den-of-woe.md`
 * §4.1–§4.3, each script in the source's own branch order; the tags are that
 * file's (rule 6). Bailey's picks: `docs/plans/chapter-gippal-review.md` GP8 a
 * (arc and radius hit the whole party), GP9 (the dump's thresholds), GP11 a (the
 * counter counts actions).
 *
 * **"Below 1/3" is a strict `<`** (the Natus lesson): Gippal at 4,934 of 14,800
 * keeps his cycle, at 4,933 he turns (`3 × hp < maxHp`). Lightfall's "2,999 or
 * less" is `<=`, as the dump words it.
 *
 * **What the sources leave open, each an `[estimate]`:**
 * - a turn spent off the cycle (Gippal's bombs, Baralai's low-HP branch or Drill
 *   Shot, Nooj's Lightfall) does not advance the cycle;
 * - a single-target move with no named target picks a random living girl;
 * - Drill Shot fires on Baralai's **next turn** once the counter reaches 8: the
 *   FFX-2 engine has no out-of-turn enemy action (plan GP-G4). If the last
 *   attacker is down or gone, a random living girl takes it;
 * - GP11 a: +1 per party action that damages him (`onDamaged`, once per action,
 *   the Vegnagun Head precedent), and +1 per Regen payout that heals him ("or when
 *   his HP changes"); his own Absorb's drain is his own action and is not counted.
 *
 * **No `script-trigger` is emitted.** An AI-emitted name must be on
 * `src/story/registry.ts#AI_EMITTED_TRIGGERS` and resolve to a script, and the
 * story layer is a draft for Bailey (`docs/plans/gippal-story-draft.md`). GP15's
 * callouts can hang off `mid` triggers instead (`ability-used` on Mortar and
 * Lightfall, `hp-below` on Gippal), or be emitted here once the script exists.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';

/** Drill Shot's count (G-5: 8 in the Den, 10 at Bevelle; the dump's 8). */
export const DRILL_SHOT_AT = 8;
/** Lightfall's line, "HP <= 2,999" (G-2, the dump's value). */
export const LIGHTFALL_AT_OR_BELOW = 2999;

export const GIPPAL_CYCLE = [
  'x2-den-gippal-grinder', 'x2-den-gippal-attack', 'x2-den-gippal-grinder', 'x2-den-gippal-attack',
  'x2-den-gippal-bullseye',
] as const;
export const NOOJ_CYCLE = [
  'x2-den-nooj-attack', 'x2-den-nooj-attack', 'x2-den-nooj-rippling-chroma', 'x2-den-nooj-attack',
  'x2-den-nooj-greedy-aura',
] as const;

/** Memory keys, one namespace per script. */
export const MEM = {
  cycle: 'cycle',
  hits: 'hits',
  lastAttacker: 'lastAttacker',
  lightfall: 'lightfallFired',
} as const;

/** Strictly below a third of max HP. */
export function belowThird(unit: Ffx2Unit): boolean {
  return unit.hp * 3 < unit.stats.maxHp;
}

function use(id: string, targets: string[] = []): Command {
  return { kind: 'ability', id, targets };
}

function randomGirl(ctx: AiContext): string[] {
  const party = ctx.party();
  return party.length > 0 ? [ctx.rng.pick(party).id] : [];
}

/** Advance and return the 0-based cycle step. */
function nextStep(unit: Ffx2Unit): number {
  const step = mem(unit, MEM.cycle);
  setMem(unit, MEM.cycle, step + 1);
  return step;
}

/** The living girl with the most MP; `notStopped` skips anyone in Stop when it can. */
export function highestMp(ctx: AiContext, notStopped: boolean): string[] {
  const party = ctx.party();
  const pool = notStopped && party.some((u) => !u.statuses.stop) ? party.filter((u) => !u.statuses.stop) : party;
  let best: Ffx2Unit | undefined;
  for (const u of pool) if (!best || u.mp > best.mp) best = u;
  return best ? [best.id] : [];
}

/**
 * Gippal [§4.1, `[verified: 2 sources]` for the cycle; the low-HP set SinirothX]:
 *
 * ```
 * HP >= 1/3: 15/16 next cycle step (Grinder, Attack, Grinder, Attack, Bullseye);
 *            1/32 Flash Bomb; 1/32 Hush Grenade
 * HP <  1/3: 1/5 each Attack, Bullseye, Grinder, Mortar;
 *            1/15 each Potion Plus, Flash Bomb, Hush Grenade
 * ```
 */
export const shadeGippalScript: AiScript = {
  id: 'shade-gippal',
  decide(ctx) {
    if (ctx.party().length === 0) return null;
    const self = ctx.self;
    if (!belowThird(self)) {
      const roll = ctx.rng.int(0, 31); // thirty-seconds
      if (roll === 30) return use('x2-den-gippal-flash-bomb');
      if (roll === 31) return use('x2-den-gippal-hush-grenade');
      const id = GIPPAL_CYCLE[nextStep(self) % GIPPAL_CYCLE.length]!;
      return use(id, id === 'x2-den-gippal-bullseye' ? [] : randomGirl(ctx));
    }
    const roll = ctx.rng.int(0, 14); // fifteenths: 3 + 3 + 3 + 3 + 1 + 1 + 1
    if (roll < 3) return use('x2-den-gippal-attack', randomGirl(ctx));
    if (roll < 6) return use('x2-den-gippal-bullseye');
    if (roll < 9) return use('x2-den-gippal-grinder', randomGirl(ctx));
    if (roll < 12) return use('x2-den-gippal-mortar');
    if (roll === 12) return use('x2-den-gippal-potion-plus');
    return use(roll === 13 ? 'x2-den-gippal-flash-bomb' : 'x2-den-gippal-hush-grenade');
  },
};

/**
 * Baralai [§4.2, `[verified: 2 sources: SinirothX, wiki AI dump]`]:
 *
 * ```
 * Cycle: (1) Attack (2) Glint (3) Triple Attack (Attack if one girl is left)
 *        (4) Looming Glacier on the highest-MP girl not in Stop (else highest MP)
 *        (5) Silence on all if MP >= 20, else Absorb on the highest-MP girl
 * HP < 1/3: 1/4 chance of: Regen on him -> Not-So-Mighty Guard;
 *           else Regen (Absorb on the highest-MP girl if MP <= 59)
 * Counter: +1 when hit or when his HP changes; at 8, reset and Drill Shot the last attacker
 * ```
 *
 * The wiki's further 1/4 on Not-So-Mighty Guard is left out: SinirothX, the ranked
 * source, prints "Reflected" there and calls it a likely typo for Regen.
 */
export const shadeBaralaiScript: AiScript = {
  id: 'shade-baralai',
  decide(ctx) {
    const party = ctx.party();
    if (party.length === 0) return null;
    const self = ctx.self;

    if (mem(self, MEM.hits) >= DRILL_SHOT_AT) {
      setMem(self, MEM.hits, 0);
      const last = self.aiMemory?.[MEM.lastAttacker];
      const target = party.find((u) => u.id === last);
      return use('x2-den-baralai-drill-shot', target ? [target.id] : randomGirl(ctx));
    }

    if (belowThird(self) && ctx.rng.int(0, 3) === 0) {
      if (self.statuses.regen) return use('x2-den-baralai-not-so-mighty-guard');
      if (self.mp <= 59) return use('x2-den-baralai-absorb', highestMp(ctx, false));
      return use('x2-den-baralai-regen');
    }

    switch (nextStep(self) % 5) {
      case 0:
        return use('x2-den-baralai-attack', randomGirl(ctx));
      case 1:
        return use('x2-den-baralai-glint');
      case 2:
        return party.length === 1 ? use('x2-den-baralai-attack', [party[0]!.id]) : use('x2-den-baralai-triple-attack');
      case 3:
        return use('x2-den-baralai-looming-glacier', highestMp(ctx, true));
      default:
        return self.mp >= 20 ? use('x2-den-baralai-silence') : use('x2-den-baralai-absorb', highestMp(ctx, false));
    }
  },
  onDamaged(ctx, sourceId, amount) {
    if (!(amount > 0)) return;
    setMem(ctx.self, MEM.hits, mem(ctx.self, MEM.hits) + 1);
    if (sourceId) setMem(ctx.self, MEM.lastAttacker, sourceId);
  },
  onRegen(ctx) {
    setMem(ctx.self, MEM.hits, mem(ctx.self, MEM.hits) + 1);
  },
};

/**
 * Nooj [§4.3; cycle `[verified: 3 sources]`, Lightfall's line `[conflict]` G-2,
 * the dump's value]:
 *
 * ```
 * Cycle: Attack 1 -> Attack 1 -> Attack 2 -> Attack 1 -> Greedy Aura -> repeat
 * HP <= 2,999: Lightfall (once per fight)
 * ```
 */
export const shadeNoojScript: AiScript = {
  id: 'shade-nooj',
  decide(ctx) {
    if (ctx.party().length === 0) return null;
    const self = ctx.self;
    if (!mem(self, MEM.lightfall) && self.hp <= LIGHTFALL_AT_OR_BELOW) {
      setMem(self, MEM.lightfall, 1);
      return use('x2-den-nooj-lightfall');
    }
    const id = NOOJ_CYCLE[nextStep(self) % NOOJ_CYCLE.length]!;
    return use(id, id === 'x2-den-nooj-greedy-aura' ? [] : randomGirl(ctx));
  },
};

export const denOfWoeScripts: readonly AiScript[] = [shadeBaralaiScript, shadeGippalScript, shadeNoojScript];
