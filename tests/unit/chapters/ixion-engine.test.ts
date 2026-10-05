/**
 * Ixion at Djose (FFX-2 Chapter 3 finale; our Chapter XVI, listed 2026-09-27): data cites, the action
 * counter and the Recharge tell, the multi-target rule (IX-11), registration, the story's order, determinism.
 * **FFX-2 only** [AGENTS.md rule 14]. Every expected number is `research/ffx2-ixion-djose.md`'s.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { resolveAbility } from '../../../src/battle/ffx2/resolve.ts';
import { aiScriptFor, registerAiScript } from '../../../src/battle/ffx2/ai/index.ts';
import { AC, AC_TRIGGER_FLAG } from '../../../src/battle/ffx2/ai/fallen-aeons.ts';
import { IXION_HAMMER_NEXT, IXION_RECHARGE_TRIGGER, IXION_SPLIT_FLAG, IXION_STEP } from '../../../src/battle/ffx2/ai/ixion.ts';
import { aiHarness, aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import { mem, setMem, type Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import * as ffxData from '../../../src/data/ffx/index.ts';
import { DJOSE_IXION, IXION_ID, x2Ixion, djoseIxionGroup } from '../../../src/data/ffx2/enemies/ixion-djose.ts';
import { IXION_THORS_HAMMER_ELEMENT } from '../../../src/data/ffx2/enemies/ixion-djose-abilities.ts';
import { djoseBuild } from '../../../src/data/ffx2/builds/djose.ts';
import { CHAPTERS, CHAPTER_IDS, getChapter } from '../../../src/data/encounters.ts';
import { FFX2_IXION_DJOSE, IXION_DJOSE_SCENE_KEY } from '../../../src/data/chapter-ffx2-ixion-djose.ts';
import { ffx2IxionDjoseScripts, IXION_WHISTLES, IXION_WHISTLE_FLAG } from '../../../src/story/scripts/ffx2-ixion-djose.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import { getScene, isPlaceholderScene } from '../../../src/scenes/index.ts';
import { DJOSE_CHAMBER_PLATE, isIxionStandIn } from '../../../src/data/ixion-plates.ts';
import { ability, ctxFor } from '../helpers/fallenAeonsUnits.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { driveIxion } from '../helpers/ixionDrive.ts';

/** An Ixion unit on his own script, for the AI harness. */
function ixionUnit(): Ffx2Unit {
  const u = aiUnit(IXION_ID, 'enemy', 12380, 0);
  u.enemy = { aiScriptId: 'x2-ixion', formIndex: 0, forms: [], rewards: x2Ixion.rewards };
  return u;
}

describe('data: research §3.1 and §4.1, carried verbatim (rule 6)', () => {
  it('the stat block, elements, immunities and rewards', () => {
    expect(x2Ixion.level).toBe(28);
    expect([x2Ixion.stats.hp, x2Ixion.stats.maxHp, x2Ixion.stats.mp]).toEqual([12380, 12380, 9999]);
    const s = x2Ixion.stats;
    expect([s.str, s.mag, s.def, s.mdef, s.agi, s.eva, s.luck, s.acc]).toEqual([62, 21, 106, 82, 138, 35, 4, 0]);
    expect(x2Ixion.affinities).toEqual({ lightning: 'absorb', water: 'weak', gravity: 'immune' });
    for (const st of ['ko', 'petrify', 'sleep', 'silence', 'darkness', 'poison', 'confuse', 'berserk', 'curse', 'eject', 'stop', 'doom'] as const) {
      expect(x2Ixion.immunities[st], st).toBe(255);
    }
    // Slow and every Break land [verified: 4 sources].
    for (const st of ['slow', 'str-down', 'mag-down', 'def-down', 'mdef-down'] as const) expect(x2Ixion.immunities[st], st).toBeUndefined();
    expect(x2Ixion.immunityFlags).toContain('immune-to-percentage-damage');
    const r = x2Ixion.rewards!;
    expect([r.exp, r.ap, r.gil, r.stolenGil]).toEqual([2600, 15, 1800, 3000]);
    expect(r.drops).toEqual([{ itemId: 'soul-of-thamasa', count: 1 }]);
    expect([r.steal?.common.itemId, r.steal?.rare.itemId, r.steal?.stealRate]).toEqual(['sprint-shoes', 'sprint-shoes', 128]);
    expect(r.bribe).toBeUndefined();
    expect(data.ITEMS['soul-of-thamasa']?.name).toBe('Soul of Thamasa');
    expect(data.ITEMS['sprint-shoes']?.name).toBe('Sprint Shoes');
  });

  it('the five actions: DCs, targets, elements; magic, fractional, Recharge and the Overdrive never miss', () => {
    const atk = ability('x2-ixion-attack');
    expect([atk.power, atk.formula, atk.targeting]).toEqual([16, 'strength', 'single-enemy']);
    expect(atk.canMiss).not.toBe(false); // physical rolls (hard rule 5)
    const thundara = ability('x2-ixion-thundara');
    expect([thundara.power, thundara.formula, thundara.targeting, thundara.mpCost, thundara.element]).toEqual([12, 'magic', 'all-enemies', 12, ['lightning']]);
    const aero = ability('x2-ixion-aerospark');
    expect([aero.power, aero.formula, aero.targeting, aero.damageType]).toEqual([10, 'percent-current', 'single-enemy', 'other']); // 10/16 = 5/8
    const recharge = ability('x2-ixion-recharge');
    expect([recharge.targeting, recharge.formula, recharge.power * 50, recharge.extra?.['restoresMp']]).toEqual(['self', 'fixed', 200, 200]);
    const hammer = ability('x2-ixion-thors-hammer');
    expect([hammer.power, hammer.formula, hammer.targeting]).toEqual([30, 'magic', 'all-enemies']);
    // IX-2 [conflict], Q1 open: non-elemental, our estimate, one constant away from Lightning.
    expect(IXION_THORS_HAMMER_ELEMENT).toBe('none');
    expect(hammer.element).toEqual(['none']);
    for (const a of [thundara, aero, recharge, hammer]) expect(a.canMiss, a.id).toBe(false);
  });

  it('no id collides with the FFX Ixion (the Chapter XI FA-G7 rule)', () => {
    const ffxIds = new Set(Object.values(ffxData.ENEMY_GROUPS_BY_ID).flatMap((g) => [...g.enemies, ...(g.parts ?? [])].map((e) => e.id)));
    expect(ffxIds.has(IXION_ID)).toBe(false);
    expect(ffxData.ENEMY_GROUPS_BY_ID[DJOSE_IXION]).toBeUndefined();
    expect(data.ENEMY_GROUPS_BY_ID[DJOSE_IXION]).toBe(djoseIxionGroup);
    expect(aiScriptFor('x2-ixion').id).toBe('x2-ixion');
  });
});

describe('the counter and the tell (research §4.2)', () => {
  it('alone, the cycle is Attack-or-Thundara, Attack-or-Thundara, Aerospark; Recharge on his 16th action, Thor\'s Hammer on the 17th', () => {
    const self = ixionUnit();
    const h = aiHarness(self, [], 'x2-ixion');
    const acs: number[] = [];
    const picks: Array<string | null> = [];
    for (let i = 0; i < 18; i++) {
      picks.push(...h.run(1));
      acs.push(mem(self, AC));
    }
    for (let i = 0; i < 15; i++) {
      const want = i % 3 === 2 ? ['x2-ixion-aerospark'] : ['x2-ixion-attack', 'x2-ixion-thundara'];
      expect(want, `action ${i + 1}`).toContain(picks[i]);
    }
    // +5, +5, +10 a cycle: 20 per cycle, 100 after five cycles [derived, §4.4].
    expect(acs.slice(0, 15)).toEqual([5, 10, 20, 25, 30, 40, 45, 50, 60, 65, 70, 80, 85, 90, 100]);
    expect(picks[15]).toBe('x2-ixion-recharge');
    expect(picks[16]).toBe('x2-ixion-thors-hammer');
    expect(acs[16]).toBe(0);
    // IX-12: the cycle restarts at step 1 after the Hammer, our estimate.
    expect(['x2-ixion-attack', 'x2-ixion-thundara']).toContain(picks[17]);
    expect(h.emitted.filter((e) => e.type === 'script-trigger' && (e as { name: string }).name === IXION_RECHARGE_TRIGGER)).toHaveLength(1);
  });

  it('+5 every time the party aims at him (FA8 a); landed damage only under the Chapter XI switch (FA8 b)', () => {
    const self = ixionUnit();
    const h = aiHarness(self, [], 'x2-ixion');
    const script = aiScriptFor('x2-ixion');
    script.onTargeted!(h.ctx, 'rikku');
    script.onDamaged!(h.ctx, 'rikku', 500);
    expect(mem(self, AC)).toBe(5);
    h.flags[AC_TRIGGER_FLAG] = 'damaged';
    script.onTargeted!(h.ctx, 'rikku');
    script.onDamaged!(h.ctx, 'rikku', 0);
    expect(mem(self, AC)).toBe(5);
    script.onDamaged!(h.ctx, 'rikku', 500);
    expect(mem(self, AC)).toBe(10);
  });

  it('at 100 the next action is Recharge, whatever the cycle step; the one after is the Hammer', () => {
    const self = ixionUnit();
    const h = aiHarness(self, [], 'x2-ixion');
    setMem(self, IXION_STEP, 2);
    setMem(self, AC, 95);
    aiScriptFor('x2-ixion').onTargeted!(h.ctx, 'paine');
    expect(h.run(2)).toEqual(['x2-ixion-recharge', 'x2-ixion-thors-hammer']);
    expect([mem(self, AC), mem(self, IXION_HAMMER_NEXT), mem(self, IXION_STEP)]).toEqual([0, 0, 0]);
  });

  it('F-8: 3/4 : 1/4 by default (our estimate); the wiki\'s 2/3 : 1/3 behind the bench flag', () => {
    const count = (wiki: boolean): number => {
      const self = ixionUnit();
      const h = aiHarness(self, [], 'x2-ixion', 11);
      if (wiki) h.flags[IXION_SPLIT_FLAG] = 'wiki';
      let thundara = 0, free = 0;
      for (let i = 0; i < 3000; i++) {
        setMem(self, AC, 0);
        const id = h.run(1)[0];
        if (id === 'x2-ixion-aerospark') continue;
        free += 1;
        if (id === 'x2-ixion-thundara') thundara += 1;
      }
      return thundara / free;
    };
    expect(count(false)).toBeGreaterThan(0.22);
    expect(count(false)).toBeLessThan(0.28);
    expect(count(true)).toBeGreaterThan(0.3);
    expect(count(true)).toBeLessThan(0.37);
  });
});

describe('resolution in the FFX-2 engine', () => {
  const ixion = (): Ffx2Unit => {
    const u = aiUnit(IXION_ID, 'enemy', 12380, 0);
    u.level = 28;
    u.stats = { ...u.stats, str: 62, mag: 21, def: 106, mdef: 82 };
    return u;
  };
  const girlsMdef35 = (): Ffx2Unit[] => ['yuna', 'rikku', 'paine'].map((id, i) => {
    const g = aiUnit(id, 'party', 5000, i);
    g.stats = { ...g.stats, mdef: 35 };
    return g;
  });

  it('IX-11: an enemy\'s all-party Thundara and Thor\'s Hammer are not halved (150-169 and 935-1,057 against MDef 35)', () => {
    const seen = { thundara: [] as number[], hammer: [] as number[] };
    for (let seed = 1; seed <= 60; seed++) {
      for (const [key, id] of [['thundara', 'x2-ixion-thundara'], ['hammer', 'x2-ixion-thors-hammer']] as const) {
        const party = girlsMdef35();
        const { ctx, events } = ctxFor([ixion(), ...party], seed);
        resolveAbility(ctx, ctx.units[0]!, ability(id), []);
        const hits = events.filter((e) => e.type === 'damage') as Array<Extract<BattleEvent, { type: 'damage' }>>;
        expect(hits).toHaveLength(3);
        seen[key].push(...hits.map((e) => e.amount));
      }
    }
    expect(Math.min(...seen.thundara)).toBeGreaterThanOrEqual(149);
    expect(Math.max(...seen.thundara)).toBeLessThanOrEqual(169);
    expect(Math.min(...seen.hammer)).toBeGreaterThanOrEqual(935);
    expect(Math.max(...seen.hammer)).toBeLessThanOrEqual(1057);
  });

  it('Aerospark takes about 5/8 of current HP and cannot kill on its own', () => {
    const party = girlsMdef35();
    party[0]!.hp = 4000;
    const { ctx } = ctxFor([ixion(), ...party], 3);
    resolveAbility(ctx, ctx.units[0]!, ability('x2-ixion-aerospark'), ['yuna']);
    const taken = 4000 - party[0]!.hp;
    expect(taken).toBeGreaterThanOrEqual(Math.floor((2500 * 240) / 256));
    expect(taken).toBeLessThanOrEqual(Math.ceil((2500 * 271) / 256));
    party[0]!.hp = 1;
    resolveAbility(ctx, ctx.units[0]!, ability('x2-ixion-aerospark'), ['yuna']);
    expect(party[0]!.alive).toBe(true);
  });

  it('Recharge restores exactly 200 HP and 200 MP to him', () => {
    const self = ixion();
    self.hp = 9000;
    self.mp = 5000;
    self.stats = { ...self.stats, maxMp: 9999 };
    const { ctx } = ctxFor([self, ...girlsMdef35()], 4);
    resolveAbility(ctx, self, ability('x2-ixion-recharge'), [self.id]);
    expect([self.hp, self.mp]).toEqual([9200, 5200]);
  });

  it('in a real fight the tell reads: every Recharge line is followed by Ixion\'s Thor\'s Hammer as his next action', () => {
    let recharges = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const run = driveIxion('sensible', seed);
      const mine = run.log.filter((e) => e.type === 'action-start' && (e as { actorId: string }).actorId === IXION_ID) as Array<{ abilityId: string; abilityName?: string }>;
      mine.forEach((e, i) => {
        if (e.abilityId !== 'x2-ixion-recharge') return;
        recharges += 1;
        // The banner (`BattlePresenterBeats.ts` shows `abilityName`) reads "Recharge": the game's only warning.
        expect(e.abilityName).toBe('Recharge');
        if (i + 1 < mine.length) expect(mine[i + 1]!.abilityId).toBe('x2-ixion-thors-hammer');
      });
    }
    expect(recharges).toBeGreaterThan(0);
  });

  it('is deterministic: the same seed gives the same log, byte for byte', () => {
    for (const seed of [1, 7, 42]) {
      const a = driveIxion('sensible', seed, { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } });
      const b = driveIxion('sensible', seed, { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } });
      expect(JSON.stringify(b.log)).toBe(JSON.stringify(a.log));
    }
    expect(JSON.stringify(driveIxion('naive', 1).log)).not.toBe(JSON.stringify(driveIxion('naive', 2).log));
  });

  it('in the engine, the party\'s actions feed the counter (FA8 a), and he recharges exactly when it reads 100', () => {
    // Watch the shipped script from inside the engine: the counter as he decides, and what he picks.
    const shipped = aiScriptFor('x2-ixion');
    const seen: Array<{ ac: number; own: number; pending: number; id: string | undefined }> = [];
    let own = 0;
    registerAiScript({
      ...shipped,
      decide(ctx) {
        const ac = mem(ctx.self, AC);
        const pending = mem(ctx.self, IXION_HAMMER_NEXT);
        const cmd = shipped.decide(ctx);
        const id = cmd && 'id' in cmd ? cmd.id : undefined;
        seen.push({ ac, own, pending, id });
        own = id === 'x2-ixion-thors-hammer' ? 0 : own + (id === 'x2-ixion-aerospark' ? 10 : id === 'x2-ixion-recharge' ? 0 : 5);
        return cmd;
      },
    });
    try {
      let recharges = 0;
      for (const seed of [1, 2, 3, 4, 5]) {
        seen.length = 0;
        own = 0;
        driveIxion('naive', seed);
        for (const s of seen) {
          if (s.pending === 1) expect(s.id).toBe('x2-ixion-thors-hammer');
          else expect(s.id === 'x2-ixion-recharge', `seed ${seed} at AC ${s.ac}`).toBe(s.ac >= 100);
          // What he did himself is part of the counter; the rest came from the party, 5 at a time.
          expect(s.ac - s.own).toBeGreaterThanOrEqual(0);
          expect((s.ac - s.own) % 5).toBe(0);
          if (s.id === 'x2-ixion-recharge') {
            recharges += 1;
            expect(s.ac - s.own, 'the party fed the counter').toBeGreaterThan(0);
          }
        }
      }
      expect(recharges).toBeGreaterThan(0);
    } finally {
      registerAiScript(shipped);
    }
  });

  it('a fresh fight starts him at AC 0 on step 1', () => {
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    engine.setSeed(1);
    engine.init({ game: 'ffx2', party: djoseBuild, enemies: djoseIxionGroup, triggers: [], seed: 1, condition: 'normal', canEscape: false });
    const unit = engine.state().combatants[IXION_ID] as unknown as Ffx2Unit;
    expect([mem(unit, AC), mem(unit, IXION_STEP), mem(unit, IXION_HAMMER_NEXT)]).toEqual([0, 0, 0]);
  });
});

describe('registration: listed as Chapter XVI (2026-09-27)', () => {
  it('getChapter finds it; chapter select, CHAPTERS and CHAPTER_IDS list it after Chapter XV, number 16 (the two Sin chapters, XVII and XVIII, follow since 2026-09-29)', () => {
    const ch = getChapter('ffx2-ixion-djose');
    expect(ch).toBe(FFX2_IXION_DJOSE);
    expect([ch?.game, ch?.number, ch?.buildRef, ch?.enemyGroupRef]).toEqual(['ffx2', 16, djoseBuild, djoseIxionGroup]);
    expect(CHAPTERS.at(-3)).toBe(FFX2_IXION_DJOSE);
    expect(CHAPTER_IDS.at(-3)).toBe('ffx2-ixion-djose');
  });

  it('the scene is the Chamber on its stand-in plate (swappable in one line); the painting is look B, its own FFX-2 subject (D-268)', () => {
    expect(FFX2_IXION_DJOSE.sceneKey).toBe(IXION_DJOSE_SCENE_KEY);
    expect(IXION_DJOSE_SCENE_KEY).toBe(DJOSE_CHAMBER_PLATE);
    expect(isIxionStandIn(DJOSE_CHAMBER_PLATE)).toBe(true);
    expect(isPlaceholderScene(IXION_DJOSE_SCENE_KEY)).toBe(false);
    expect(getScene(IXION_DJOSE_SCENE_KEY)?.title).toMatch(/Djose/);
    expect(x2Ixion.spriteKey).toBe('x2-ixion');
    expect(x2Ixion.forms?.map((f) => f.spriteKey)).toEqual(['x2-ixion']);
  });

  it('the party: Yuna White Mage, Rikku and Paine Dark Knight, Lv 32 / 33 / 34 (our estimate), Samurai and Lady Luck owned (D-361)', () => {
    expect(djoseBuild.members.map((m) => [m.id, m.currentDressphere, m.level])).toEqual([
      ['yuna', 'white-mage', 32], ['rikku', 'dark-knight', 33], ['paine', 'dark-knight', 34],
    ]);
    for (const m of djoseBuild.members) {
      expect(m.owned).toContain('samurai');
      // Lady Luck was left out until Bailey's D-361 (2026-10-03): the Luca Sphere Break is a Chapter 3 event and Djose is
      // the end of Chapter 3, so she is owned here; the other three conditional pickups stay out.
      expect(m.owned).toContain('lady-luck');
      for (const no of ['mascot', 'berserker', 'trainer']) expect(m.owned).not.toContain(no);
      expect(m.garmentGrid.id).not.toBe('unwavering-guard');
    }
  });
});

describe('the story: concept A\'s order', () => {
  const { pre, post } = ffx2IxionDjoseScripts;

  it('opens the battle, shows results, then the fall, the Abyss, four whistles and the wake in Bevelle', () => {
    expect(pre.at(-1)?.type).toBe('battleStart');
    expect(post[0]?.type).toBe('results');
    const text = post.filter((s) => s.type === 'say' || s.type === 'narrate').map((s) => (s as { text: string }).text);
    expect(text.some((t) => t.startsWith('(Placeholder)'))).toBe(false);
    const order = ['fayth stood', 'Ixion rises and charges', 'Songstress', 'Lenne', 'Baralai', "I'm all alone.", 'Bevelle Underground'];
    const at = order.map((k) => text.findIndex((t) => t.includes(k)));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    const whistles = post.filter((s) => s.type === 'choice');
    expect(whistles).toHaveLength(IXION_WHISTLES);
    const flags = post.filter((s) => s.type === 'setFlag' && (s as { key: string }).key === IXION_WHISTLE_FLAG);
    expect(flags.map((s) => (s as { value: number }).value)).toEqual([1, 2, 3, 4]);
    expect(post.some((s) => s.type === 'showActor')).toBe(false); // no new art
  });

  it('passes the house lint', () => {
    expect(lintScript(pre)).toEqual([]);
    expect(lintScript(post)).toEqual([]);
  });
});
