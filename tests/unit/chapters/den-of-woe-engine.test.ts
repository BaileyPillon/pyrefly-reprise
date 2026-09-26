/**
 * Chapter XV — the Den of Woe (FFX-2): data, the shades' actions and the
 * registration. Mechanic units pinned to `research/ffx2-gippal-den-of-woe.md`
 * rows (plan `docs/plans/chapter-gippal-review.md` §9). **Game case: FFX-2 only**
 * [AGENTS.md rule 14]; the registration block is the "both" plumbing.
 *
 * Every claim here is run, not grepped [hard rule 3].
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { resolveAbility } from '../../../src/battle/ffx2/resolve.ts';
import { computeDamage } from '../../../src/battle/ffx2/formulas.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import * as ffxData from '../../../src/data/ffx/index.ts';
import {
  DEN_BARALAI,
  DEN_GIPPAL,
  DEN_NOOJ,
  DEN_OF_WOE_CHAIN_ORDER,
  shadeBaralai,
  shadeGippal,
  shadeNooj,
} from '../../../src/data/ffx2/enemies/den-of-woe.ts';
import { denOfWoeKit } from '../../../src/data/ffx2/builds/den-of-woe.ts';
import { CHAPTERS, CHAPTER_IDS, getChapter } from '../../../src/data/encounters.ts';
import { ability, ctxFor, girlsAt } from '../helpers/fallenAeonsUnits.ts';
import { INFINITE_STATUSES, advanceStatuses, durationToTicks } from '../../../src/battle/ffx2/statuses.ts';
import { DEN_GUARD_DURATION, DEN_REGEN_DURATION, DEN_STOP_DURATION } from '../../../src/data/ffx2/enemies/den-of-woe-abilities.ts';

type Damage = Extract<BattleEvent, { type: 'damage' }>;
type Removed = Extract<BattleEvent, { type: 'status-remove' }>;
const damages = (events: readonly { type: string }[]) => events.filter((e) => e.type === 'damage') as Damage[];

describe('data, carried from research §3 (rule 6)', () => {
  it('ships every §3 headline number exactly', () => {
    expect([shadeBaralai.stats.maxHp, shadeGippal.stats.maxHp, shadeNooj.stats.maxHp]).toEqual([12220, 14800, 23800]);
    expect([shadeBaralai.level, shadeGippal.level, shadeNooj.level]).toEqual([52, 56, 63]);
    expect(shadeGippal.stats).toMatchObject({ mp: 235, str: 73, mag: 55, def: 68, mdef: 33, agi: 118, eva: 23, luck: 6, acc: 0 });
    expect(shadeBaralai.stats).toMatchObject({ mp: 720, str: 68, mag: 67, def: 67, mdef: 26, agi: 112, eva: 12, luck: 6 });
    expect(shadeNooj.stats).toMatchObject({ mp: 720, str: 75, mag: 101, def: 144, mdef: 103, agi: 121, eva: 0, luck: 8 });
  });

  it('rewards: the dump over the conflicts (G-3 Nooj gil, G-4 Kaiser Knuckles)', () => {
    expect(shadeGippal.rewards).toMatchObject({ exp: 1200, ap: 5, gil: 5000, stolenGil: 15000 });
    expect(shadeGippal.rewards.drops[0]?.itemId).toBe('kaiser-knuckles');
    expect(shadeGippal.rewards.steal?.stealRate).toBe(128);
    expect(shadeBaralai.rewards).toMatchObject({ exp: 1200, ap: 5, gil: 200, stolenGil: 300 });
    expect(shadeNooj.rewards).toMatchObject({ exp: 1800, ap: 10, gil: 30000, stolenGil: 20000 });
  });

  it('every shade: the §3 immunities and fractional immunity; the Breaks land; Gravity immune', () => {
    for (const e of [shadeBaralai, shadeGippal, shadeNooj]) {
      for (const s of ['ko', 'petrify', 'sleep', 'silence', 'darkness', 'poison', 'confuse', 'berserk', 'curse', 'eject', 'slow', 'stop', 'doom', 'delay-effect', 'action-cancel'] as const) {
        expect(e.immunities[s], `${e.id} ${s}`).toBe(255);
      }
      for (const s of ['str-down', 'mag-down', 'def-down', 'mdef-down'] as const) expect(e.immunities[s], `${e.id} ${s}`).toBeUndefined();
      expect(e.immunityFlags).toContain('immune-to-percentage-damage');
      expect(e.affinities.gravity).toBe('immune');
    }
  });

  it('new ids, never the men\'s, and none meets an FFX id', () => {
    const ffxIds = new Set(Object.values(ffxData.ENEMY_GROUPS_BY_ID).flatMap((g) => [...g.enemies, ...(g.parts ?? [])].map((e) => e.id)));
    for (const id of ['shade-baralai', 'shade-gippal', 'shade-nooj']) expect(ffxIds.has(id)).toBe(false);
    for (const g of DEN_OF_WOE_CHAIN_ORDER) expect(ffxData.ENEMY_GROUPS_BY_ID[g]).toBeUndefined();
  });

  it('magic, fractional and constant moves never miss; physical strikes roll (hard rule 5)', () => {
    for (const id of ['x2-den-gippal-bullseye', 'x2-den-gippal-potion-plus', 'x2-den-gippal-flash-bomb', 'x2-den-gippal-hush-grenade',
      'x2-den-baralai-looming-glacier', 'x2-den-baralai-drill-shot', 'x2-den-baralai-absorb', 'x2-den-baralai-silence',
      'x2-den-baralai-regen', 'x2-den-baralai-not-so-mighty-guard', 'x2-den-nooj-rippling-chroma', 'x2-den-nooj-greedy-aura',
      'x2-den-nooj-lightfall']) {
      expect(ability(id).canMiss, id).toBe(false);
    }
    for (const id of ['x2-den-gippal-attack', 'x2-den-gippal-grinder', 'x2-den-gippal-mortar', 'x2-den-baralai-attack',
      'x2-den-baralai-triple-attack', 'x2-den-baralai-glint', 'x2-den-nooj-attack']) {
      expect(ability(id).canMiss, id).not.toBe(false);
      expect(ability(id).damageType, id).toBe('physical');
    }
  });
});

describe('the shades\' actions (§4)', () => {
  it('Bullseye takes exactly 9/16 of current HP from every girl (GP10 a, GP8 a) and never kills', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const party = girlsAt(3200, 100);
      party[2]!.hp = 1;
      const gippal = aiUnit('shade-gippal', 'enemy');
      const { ctx, events } = ctxFor([gippal, ...party], seed);
      resolveAbility(ctx, gippal, ability('x2-den-gippal-bullseye'), []);
      expect(damages(events).map((e) => e.amount), `seed ${seed}`).toEqual([1800, 1800, 0]);
      expect(party.map((g) => g.alive)).toEqual([true, true, true]);
    }
  });

  it('cannotKill holds even under a long chain multiplier', () => {
    const girl = girlsAt(1000, 0)[0]!;
    const gippal = aiUnit('shade-gippal', 'enemy');
    const r = computeDamage({ user: gippal, target: girl, ability: ability('x2-den-gippal-bullseye'), chainCount: 40, crit: false, randomRoll: 271 });
    expect(r.amount).toBe(999);
  });

  it('Grinder and Mortar ignore Defense: the same damage at DEF 0 and DEF 200', () => {
    const gippal = aiUnit('shade-gippal', 'enemy');
    gippal.level = 56;
    gippal.stats.str = 73;
    for (const id of ['x2-den-gippal-grinder', 'x2-den-gippal-mortar']) {
      const soft = girlsAt(5000, 0)[0]!;
      const hard = girlsAt(5000, 0)[0]!;
      soft.stats.def = 0;
      hard.stats.def = 200;
      const at = (t: typeof soft) => computeDamage({ user: gippal, target: t, ability: ability(id), chainCount: 0, crit: false, randomRoll: 256 }).amount;
      expect(at(soft), id).toBe(at(hard));
      expect(at(soft), id).toBeGreaterThan(0);
    }
    const plain = (def: number) => {
      const t = girlsAt(5000, 0)[0]!;
      t.stats.def = def;
      return computeDamage({ user: gippal, target: t, ability: ability('x2-den-gippal-attack'), chainCount: 0, crit: false, randomRoll: 256 }).amount;
    };
    expect(plain(200)).toBeLessThan(plain(0)); // his kick does not
  });

  it('Potion Plus restores 600 on him at the neutral roll (constant, rolled like any constant)', () => {
    const gippal = aiUnit('shade-gippal', 'enemy', 14800);
    gippal.hp = 10000;
    const { ctx } = ctxFor([gippal], 1);
    resolveAbility(ctx, gippal, ability('x2-den-gippal-potion-plus'), []);
    expect(gippal.hp - 10000).toBeGreaterThanOrEqual(562);
    expect(gippal.hp - 10000).toBeLessThanOrEqual(635);
    expect(computeDamage({ user: gippal, target: gippal, ability: ability('x2-den-gippal-potion-plus'), chainCount: 0, crit: false, randomRoll: 256 }).amount).toBe(-600);
  });

  it('Flash Bomb and Hush Grenade: 46-52 to all (1 x 50 under the roll) [derived]', () => {
    for (const id of ['x2-den-gippal-flash-bomb', 'x2-den-gippal-hush-grenade']) {
      for (const roll of [240, 271]) {
        const girl = girlsAt(3000, 0)[0]!;
        const amount = computeDamage({ user: aiUnit('shade-gippal', 'enemy'), target: girl, ability: ability(id), chainCount: 0, crit: false, randomRoll: roll }).amount;
        expect(amount, `${id} ${roll}`).toBe(roll === 240 ? 46 : 52);
      }
    }
  });

  it('Looming Glacier: MP to 0 and Stop on the girl it names', () => {
    const party = girlsAt(3000, 180);
    const baralai = aiUnit('shade-baralai', 'enemy');
    baralai.level = 52;
    const { ctx, events } = ctxFor([baralai, ...party], 2);
    resolveAbility(ctx, baralai, ability('x2-den-baralai-looming-glacier'), ['rikku']);
    expect(party[1]!.mp).toBe(0);
    expect(party[1]!.statuses.stop).toBeDefined();
    expect(party[1]!.hp).toBe(3000);
    expect(party[0]!.mp).toBe(180);
    expect(events.some((e) => e.type === 'mp-damage')).toBe(true);
  });

  it('Drill Shot: exactly 3/4 of max HP (GP10 a), and it can kill', () => {
    for (const seed of [1, 2, 3]) {
      const girl = girlsAt(5000, 0)[0]!;
      const baralai = aiUnit('shade-baralai', 'enemy');
      const { ctx, events } = ctxFor([baralai, girl], seed);
      resolveAbility(ctx, baralai, ability('x2-den-baralai-drill-shot'), [girl.id]);
      expect(damages(events)[0]?.amount).toBe(3750);
    }
    const low = girlsAt(3000, 0)[0]!;
    const baralai = aiUnit('shade-baralai', 'enemy');
    resolveAbility(ctxFor([baralai, low], 1).ctx, baralai, ability('x2-den-baralai-drill-shot'), [low.id]);
    expect(low.alive).toBe(false);
  });

  it('Absorb drains 3/16 of current MP into Baralai', () => {
    const girl = girlsAt(4000, 160)[0]!;
    const baralai = aiUnit('shade-baralai', 'enemy');
    baralai.mp = 10;
    resolveAbility(ctxFor([baralai, girl]).ctx, baralai, ability('x2-den-baralai-absorb'), [girl.id]);
    expect(girl.mp).toBe(130);
    expect(baralai.mp).toBe(40);
  });

  it('Not-So-Mighty Guard and Regen land on him; Regen costs 40 MP', () => {
    const baralai = aiUnit('shade-baralai', 'enemy');
    baralai.mp = 100;
    const { ctx } = ctxFor([baralai]);
    resolveAbility(ctx, baralai, ability('x2-den-baralai-regen'), []);
    expect(baralai.mp).toBe(60);
    expect(baralai.statuses.regen).toBeDefined();
    resolveAbility(ctx, baralai, ability('x2-den-baralai-not-so-mighty-guard'), []);
    expect(Object.keys(baralai.statuses).sort()).toEqual(['protect', 'regen', 'shell']);
  });

  it('Stop, Protect, Shell and Regen are timed (combat-core §2.8); Darkness and Silence are Infinite', () => {
    const party = girlsAt(3000, 180);
    const baralai = aiUnit('shade-baralai', 'enemy');
    baralai.mp = 100;
    const { ctx } = ctxFor([baralai, ...party], 2);
    resolveAbility(ctx, baralai, ability('x2-den-baralai-looming-glacier'), ['rikku']);
    expect(party[1]!.statuses.stop!.ticksRemaining).toBe(durationToTicks(DEN_STOP_DURATION));
    expect(DEN_STOP_DURATION).toBe(100);
    resolveAbility(ctx, baralai, ability('x2-den-baralai-not-so-mighty-guard'), []);
    for (const s of ['protect', 'shell', 'regen'] as const) {
      expect(baralai.statuses[s]!.ticksRemaining, s).toBe(durationToTicks(DEN_GUARD_DURATION));
      expect(baralai.statuses[s]!.permanent, s).toBe(false);
    }
    delete baralai.statuses.regen;
    resolveAbility(ctx, baralai, ability('x2-den-baralai-regen'), []);
    expect(baralai.statuses.regen!.ticksRemaining).toBe(durationToTicks(DEN_REGEN_DURATION));
    expect([DEN_GUARD_DURATION, DEN_REGEN_DURATION]).toEqual([100, 50]);
    // Run the clock: the Regen spell's 50 units go first, then the Guard's 100, then Stop's.
    const removed: string[] = [];
    const emit = (e: { type: string }) => {
      if (e.type === 'status-remove') removed.push(`${(e as Removed).targetId}:${(e as Removed).status}`);
    };
    resolveAbility(ctx, baralai, ability('x2-den-baralai-not-so-mighty-guard'), []);
    advanceStatuses(baralai, durationToTicks(DEN_GUARD_DURATION)! + 1, emit);
    advanceStatuses(party[1]!, durationToTicks(DEN_STOP_DURATION)! + 1, emit);
    expect(baralai.statuses.protect ?? baralai.statuses.shell ?? baralai.statuses.regen).toBeUndefined();
    expect(party[1]!.statuses.stop).toBeUndefined();
    expect(removed.sort()).toEqual(['rikku:stop', 'shade-baralai:protect', 'shade-baralai:regen', 'shade-baralai:shell']);
    expect(INFINITE_STATUSES).toContain('darkness');
    expect(INFINITE_STATUSES).toContain('silence');
  });

  it('Rippling Chroma ignores Magic Defense', () => {
    const nooj = aiUnit('shade-nooj', 'enemy');
    nooj.level = 63;
    nooj.stats.mag = 101;
    const at = (mdef: number) => {
      const t = girlsAt(5000, 0)[0]!;
      t.stats.mdef = mdef;
      return computeDamage({ user: nooj, target: t, ability: ability('x2-den-nooj-rippling-chroma'), chainCount: 0, crit: false, randomRoll: 256 }).amount;
    };
    expect(at(0)).toBe(at(250));
    expect(at(0)).toBeGreaterThan(0);
  });

  it('Greedy Aura takes exactly 3/16 of max HP and max MP from every girl, and does not heal him (G-7)', () => {
    const party = girlsAt(4000, 200);
    party.forEach((g, i) => { g.stats.maxHp = [2488, 5652, 5862][i]!; g.stats.maxMp = [320, 160, 16][i]!; });
    const nooj = aiUnit('shade-nooj', 'enemy', 23800);
    nooj.hp = 10000;
    const { ctx, events } = ctxFor([nooj, ...party], 4);
    resolveAbility(ctx, nooj, ability('x2-den-nooj-greedy-aura'), []);
    expect(damages(events).map((e) => e.amount)).toEqual([466, 1059, 1099]);
    expect(party.map((g) => g.mp)).toEqual([200 - 60, 200 - 30, 200 - 3]);
    expect(nooj.hp).toBe(10000);
  });

  it('Lightfall: exactly 5,000 to every girl (GP10 a); Invincible stops it', () => {
    for (const seed of [1, 2, 3]) {
      const party = girlsAt(5652, 0);
      party.forEach((g) => { g.stats.maxHp = 9999; });
      party[1]!.statuses.invincible = { id: 'invincible', ticksRemaining: null, stacks: 1 } as never;
      const nooj = aiUnit('shade-nooj', 'enemy');
      const { ctx, events } = ctxFor([nooj, ...party], seed);
      resolveAbility(ctx, nooj, ability('x2-den-nooj-lightfall'), []);
      expect(party.map((g) => g.hp), `seed ${seed}`).toEqual([652, 5652, 652]);
      expect(damages(events).filter((e) => e.amount > 0)).toHaveLength(2);
    }
  });
});

describe('registration: registered, reachable, unlisted', () => {
  it('getChapter finds Chapter XV; chapter select does not list it', () => {
    const ch = getChapter('ffx2-den-of-woe');
    expect(ch?.game).toBe('ffx2');
    expect(ch?.number).toBe(15);
    expect(ch?.title).toBe('The Den of Woe');
    expect(ch?.location).toBe('Den of Woe — under Mushroom Rock Road');
    expect(ch?.buildRef).toBe(denOfWoeKit); // Bailey's pick 2026-09-26: the preset + 3 Hero Drinks + 8 levels
    expect(ch?.enemyGroupRef.id).toBe(DEN_BARALAI);
    expect(CHAPTER_IDS).not.toContain('ffx2-den-of-woe');
    expect(CHAPTERS.some((c) => c.id === 'ffx2-den-of-woe')).toBe(false);
  });

  it('three links in the sourced order, no Save Sphere, full carry into 2 and 3, no escape, one cue', () => {
    const groups = DEN_OF_WOE_CHAIN_ORDER.map((id) => data.ENEMY_GROUPS_BY_ID[id]!);
    expect(groups.map((g) => g.enemies.map((e) => e.id))).toEqual([['shade-baralai'], ['shade-gippal'], ['shade-nooj']]);
    expect(groups.map((g) => g.nextGroupId)).toEqual([DEN_GIPPAL, DEN_NOOJ, undefined]);
    expect(groups.some((g) => g.restoresPartyOnEntry === true)).toBe(false);
    expect(groups.map((g) => g.carriesFullPartyState === true)).toEqual([false, true, true]);
    expect(groups.every((g) => g.canEscape === false)).toBe(true);
    expect(groups.every((g) => g.musicCues?.[0]?.track === 'boss-shuyin')).toBe(true);
  });

  it('every ability a shade names is in the shipped table', () => {
    for (const e of [shadeBaralai, shadeGippal, shadeNooj]) {
      for (const id of e.abilityIds) expect(data.ABILITIES[id], id).toBeDefined();
    }
  });
});
