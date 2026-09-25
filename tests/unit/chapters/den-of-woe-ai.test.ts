/**
 * Chapter XV — the three shades' AI, walked against research §4.1–§4.3 (plan
 * `docs/plans/chapter-gippal-review.md` §9). **FFX-2 only.** A transcription
 * check: each test walks the source's table, and the weights are measured over
 * many draws at fixed seeds.
 */

import { describe, expect, it } from 'vitest';
import { aiHarness, aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import type { EventDraft, Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { notifyEnemiesDamaged } from '../../../src/battle/ffx2/engineHooks.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { DRILL_SHOT_AT, GIPPAL_CYCLE, MEM, NOOJ_CYCLE } from '../../../src/battle/ffx2/ai/den-of-woe.ts';
import { shadeBaralai } from '../../../src/data/ffx2/enemies/den-of-woe.ts';

function shade(id: string, maxHp: number, mp = 999): Ffx2Unit {
  const u = aiUnit(id, 'enemy', maxHp);
  u.mp = mp;
  u.stats.maxMp = mp;
  return u;
}

describe('Gippal (§4.1)', () => {
  it('the scripts are registered under the data file\'s ids', () => {
    for (const id of ['shade-baralai', 'shade-gippal', 'shade-nooj']) expect(aiScriptFor(id).id).toBe(id);
  });

  it('above a third: the five-step cycle in order, skipping nothing it did not take', () => {
    const g = shade('shade-gippal', 14800);
    const h = aiHarness(g, [], 'shade-gippal', 21);
    const ids = h.run(400);
    const cycle = ids.filter((id) => id !== 'x2-den-gippal-flash-bomb' && id !== 'x2-den-gippal-hush-grenade');
    cycle.forEach((id, i) => expect(id, `step ${i}`).toBe(GIPPAL_CYCLE[i % 5]));
  });

  it('above a third: 15/16 cycle, 1/32 Flash Bomb, 1/32 Hush Grenade (8,000 draws)', () => {
    const g = shade('shade-gippal', 14800);
    const h = aiHarness(g, [], 'shade-gippal', 22);
    const ids = h.run(8000);
    const share = (id: string) => ids.filter((x) => x === id).length / ids.length;
    expect(share('x2-den-gippal-flash-bomb')).toBeCloseTo(1 / 32, 2);
    expect(share('x2-den-gippal-hush-grenade')).toBeCloseTo(1 / 32, 2);
    expect(share('x2-den-gippal-mortar')).toBe(0);
    expect(share('x2-den-gippal-potion-plus')).toBe(0);
  });

  it('"below 1/3" is strict: 4,934 keeps the cycle, 4,933 turns to the random set', () => {
    const keep = shade('shade-gippal', 14800);
    keep.hp = 4934;
    const k = aiHarness(keep, [], 'shade-gippal', 23).run(600);
    expect(k).not.toContain('x2-den-gippal-mortar');
    expect(k).not.toContain('x2-den-gippal-potion-plus');
    const turn = shade('shade-gippal', 14800);
    turn.hp = 4933;
    const h = aiHarness(turn, [], 'shade-gippal', 23);
    const t = h.run(600);
    expect(t).toContain('x2-den-gippal-mortar');
    // No unwired story beat: an AI-emitted name must be on the registry's list (story-triggers.test.ts).
    expect(h.emitted.filter((e) => e.type === 'script-trigger')).toEqual([]);
  });

  it('below a third: 1/5 each Attack, Bullseye, Grinder, Mortar; 1/15 each Potion Plus, Flash Bomb, Hush Grenade', () => {
    const g = shade('shade-gippal', 14800);
    g.hp = 3000;
    const ids = aiHarness(g, [], 'shade-gippal', 24).run(15000);
    const share = (id: string) => ids.filter((x) => x === id).length / ids.length;
    for (const id of ['attack', 'bullseye', 'grinder', 'mortar']) expect(share(`x2-den-gippal-${id}`), id).toBeCloseTo(1 / 5, 1);
    for (const id of ['potion-plus', 'flash-bomb', 'hush-grenade']) expect(share(`x2-den-gippal-${id}`), id).toBeCloseTo(1 / 15, 1);
  });
});

describe('Baralai (§4.2)', () => {
  it('above a third: the five-step cycle, Triple Attack while two girls stand', () => {
    const b = shade('shade-baralai', 12220, 720);
    const h = aiHarness(b, [], 'shade-baralai', 31);
    expect(h.run(10)).toEqual([
      'x2-den-baralai-attack', 'x2-den-baralai-glint', 'x2-den-baralai-triple-attack', 'x2-den-baralai-looming-glacier',
      'x2-den-baralai-silence',
      'x2-den-baralai-attack', 'x2-den-baralai-glint', 'x2-den-baralai-triple-attack', 'x2-den-baralai-looming-glacier',
      'x2-den-baralai-silence',
    ]);
  });

  it('step 3 is a plain Attack when one girl is left; step 5 is Absorb under 20 MP', () => {
    const b = shade('shade-baralai', 12220, 19);
    const h = aiHarness(b, [], 'shade-baralai', 32);
    const party = h.ctx.units.filter((u) => u.side === 'party');
    party[1]!.alive = false;
    party[2]!.alive = false;
    expect(h.run(5)).toEqual([
      'x2-den-baralai-attack', 'x2-den-baralai-glint', 'x2-den-baralai-attack', 'x2-den-baralai-looming-glacier',
      'x2-den-baralai-absorb',
    ]);
  });

  it('Looming Glacier picks the highest-MP girl not in Stop, else the highest MP', () => {
    const b = shade('shade-baralai', 12220, 720);
    b.aiMemory = { [MEM.cycle]: 3 };
    const h = aiHarness(b, [], 'shade-baralai', 33);
    const [yuna, rikku, paine] = h.ctx.units.filter((u) => u.side === 'party') as [Ffx2Unit, Ffx2Unit, Ffx2Unit];
    yuna.mp = 300; rikku.mp = 100; paine.mp = 50;
    expect(h.ctx.units.length).toBeGreaterThan(3);
    const first = aiScriptFor('shade-baralai').decide(h.ctx);
    expect(first).toMatchObject({ id: 'x2-den-baralai-looming-glacier', targets: ['yuna'] });
    yuna.statuses.stop = { id: 'stop' } as never;
    b.aiMemory = { [MEM.cycle]: 3 };
    expect(aiScriptFor('shade-baralai').decide(h.ctx)).toMatchObject({ targets: ['rikku'] });
    rikku.statuses.stop = { id: 'stop' } as never;
    paine.statuses.stop = { id: 'stop' } as never;
    b.aiMemory = { [MEM.cycle]: 3 };
    expect(aiScriptFor('shade-baralai').decide(h.ctx)).toMatchObject({ targets: ['yuna'] });
  });

  it('the counter: +1 per damaging action (GP11 a), and at 8 Drill Shot on the last attacker, then 0', () => {
    const b = shade('shade-baralai', 12220, 720);
    b.enemy = { aiScriptId: 'shade-baralai', formIndex: 0, forms: [], rewards: shadeBaralai.rewards };
    const h = aiHarness(b, [], 'shade-baralai', 34);
    const at = (u: Ffx2Unit) => ({ ...h.ctx, self: u });
    const hit = (by: string, amount: number): EventDraft[] =>
      [{ type: 'damage', targetId: 'shade-baralai', sourceId: by, amount, element: 'none', crit: false, hitIndex: 0, hitCount: 1 },
        { type: 'damage', targetId: 'shade-baralai', sourceId: by, amount, element: 'none', crit: false, hitIndex: 1, hitCount: 2 }];
    const party = h.ctx.units.filter((u) => u.side === 'party');
    for (let i = 0; i < DRILL_SHOT_AT - 1; i++) notifyEnemiesDamaged(hit('paine', 100), party[2]!, h.ctx.units, at);
    expect(b.aiMemory?.[MEM.hits]).toBe(7); // two hits in one action count once
    expect(h.run(1)).toEqual(['x2-den-baralai-attack']);
    notifyEnemiesDamaged(hit('rikku', 0), party[1]!, h.ctx.units, at); // a zero hit is not damage
    expect(b.aiMemory?.[MEM.hits]).toBe(7);
    notifyEnemiesDamaged(hit('rikku', 50), party[1]!, h.ctx.units, at);
    const drill = aiScriptFor('shade-baralai').decide(h.ctx);
    expect(drill).toMatchObject({ id: 'x2-den-baralai-drill-shot', targets: ['rikku'] });
    expect(b.aiMemory?.[MEM.hits]).toBe(0);
  });

  it('a Regen payout that heals him counts too ("or when his HP changes")', () => {
    const b = shade('shade-baralai', 12220, 720);
    const h = aiHarness(b, [], 'shade-baralai', 35);
    aiScriptFor('shade-baralai').onRegen?.(h.ctx, 360);
    expect(b.aiMemory?.[MEM.hits]).toBe(1);
  });

  it('below a third, 1 turn in 4: Regen; then Not-So-Mighty Guard while Regen holds; Absorb when MP <= 59', () => {
    const count = (mp: number, regen: boolean) => {
      const b = shade('shade-baralai', 12220, mp);
      b.hp = 4000;
      if (regen) b.statuses.regen = { id: 'regen' } as never;
      const ids = aiHarness(b, [], 'shade-baralai', 36).run(4000);
      return (id: string) => ids.filter((x) => x === id).length / ids.length;
    };
    expect(count(720, false)('x2-den-baralai-regen')).toBeCloseTo(0.25, 1);
    expect(count(720, true)('x2-den-baralai-not-so-mighty-guard')).toBeCloseTo(0.25, 1);
    expect(count(720, true)('x2-den-baralai-regen')).toBe(0);
    const poor = count(59, false);
    expect(poor('x2-den-baralai-regen')).toBe(0);
    // The branch's quarter only: 59 MP is still 20 or more, so step 5 stays Silence.
    expect(poor('x2-den-baralai-absorb')).toBeCloseTo(0.25, 1);
    expect(poor('x2-den-baralai-silence')).toBeGreaterThan(0);
    const above = shade('shade-baralai', 12220, 720);
    above.hp = 4074; // 3 x 4,074 = 12,222: not below a third
    expect(aiHarness(above, [], 'shade-baralai', 37).run(400)).not.toContain('x2-den-baralai-regen');
  });
});

describe('Nooj (§4.3)', () => {
  it('the five-step cycle, repeating', () => {
    const n = shade('shade-nooj', 23800, 720);
    const ids = aiHarness(n, [], 'shade-nooj', 41).run(15);
    ids.forEach((id, i) => expect(id, `step ${i}`).toBe(NOOJ_CYCLE[i % 5]));
  });

  it('Lightfall once at 2,999 or less (G-2), never at 3,000; the cycle resumes where it was', () => {
    const n = shade('shade-nooj', 23800, 720);
    n.hp = 3000;
    const h = aiHarness(n, [], 'shade-nooj', 42);
    expect(h.run(2)).toEqual(['x2-den-nooj-attack', 'x2-den-nooj-attack']);
    n.hp = 2999;
    expect(h.run(4)).toEqual(['x2-den-nooj-lightfall', 'x2-den-nooj-rippling-chroma', 'x2-den-nooj-attack', 'x2-den-nooj-greedy-aura']);
    n.hp = 10;
    expect(h.run(20)).not.toContain('x2-den-nooj-lightfall');
  });
});
