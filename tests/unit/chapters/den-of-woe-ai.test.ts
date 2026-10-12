/**
 * Chapter XV — the three shades' AI, walked against research §4.1–§4.3 (plan
 * `docs/plans/chapter-gippal-review.md` §9). **FFX-2 only.** A transcription
 * check: each test walks the source's table, and the weights are measured over
 * many draws at fixed seeds.
 *
 * Re-parity AI lane C (2026-10-10; reason "game-script parity"): the scripts are now the game's own
 * (`research/re-ffx2-ai-leblanc-den-ixion.md` 4.2 to 4.4). The one-third lines are integer (`HP < max / 3`), Baralai's
 * low-HP move is an extra command and his counter counts results; the decision tables of the new rules are walked in
 * `tests/unit/parity-ffx2-ai-den.test.ts`, and the cases below that the script no longer answers that way are re-pinned.
 */

import { describe, expect, it } from 'vitest';
import { aiHarness, aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import type { Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { DRILL_SHOT_AT, GIPPAL_CYCLE, MEM, NOOJ_CYCLE } from '../../../src/battle/ffx2/ai/den-of-woe.ts';

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

  it('"below 1/3" is `HP < max / 3` in integers (re-parity D8): 4,933 keeps the cycle, 4,932 turns to the random set', () => {
    const keep = shade('shade-gippal', 14800);
    keep.hp = 4933;
    const k = aiHarness(keep, [], 'shade-gippal', 23).run(600);
    expect(k).not.toContain('x2-den-gippal-mortar');
    expect(k).not.toContain('x2-den-gippal-potion-plus');
    const turn = shade('shade-gippal', 14800);
    turn.hp = 4932;
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

  it('Looming Glacier picks the highest-MP girl not in Stop; with every girl in Stop the target is left to the engine (D6)', () => {
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
    expect(aiScriptFor('shade-baralai').decide(h.ctx)).toMatchObject({ targets: [] }); // "nothing": the engine turns it into the nearest living girl
  });

  it('the counter counts results (D3): +1 per result, 7 results keep the cycle, the 8th sends the next poll to the Drill Shot on the latest attacker, then 0', () => {
    const b = shade('shade-baralai', 12220, 720);
    const h = aiHarness(b, [], 'shade-baralai', 34);
    const script = aiScriptFor('shade-baralai');
    script.onResults!(h.ctx, { count: DRILL_SHOT_AT - 1, lastAttackerId: 'paine' }); // seven results (two hits of one action are two)
    expect(b.aiMemory?.[MEM.hits]).toBe(7);
    expect(h.run(1)).toEqual(['x2-den-baralai-attack']);
    script.onResults!(h.ctx, { count: 1, lastAttackerId: 'rikku' });
    const drill = script.decide(h.ctx);
    expect(drill).toMatchObject({ id: 'x2-den-baralai-drill-shot', targets: ['rikku'] });
    expect(b.aiMemory?.[MEM.hits]).toBe(0);
  });

  it('a Regen payout that heals him is not a result (D3), but it is his latest "attacker": the Drill Shot then goes to himself (D4)', () => {
    const b = shade('shade-baralai', 12220, 720);
    const h = aiHarness(b, [], 'shade-baralai', 35);
    aiScriptFor('shade-baralai').onResults!(h.ctx, { count: DRILL_SHOT_AT, lastAttackerId: 'rikku' });
    aiScriptFor('shade-baralai').onRegen?.(h.ctx, 360);
    expect(b.aiMemory?.[MEM.hits]).toBe(DRILL_SHOT_AT);
    expect(aiScriptFor('shade-baralai').decide(h.ctx)).toMatchObject({ id: 'x2-den-baralai-drill-shot', targets: ['shade-baralai'] });
  });

  it('below a third, 1 poll in 4 queues the low-HP move AND the normal move (D1, D2): Regen, or Absorb under 60 MP; Guard needs Reflect', () => {
    // A fresh poll returns the low-HP move 1 time in 4, and the next call returns the normal command queued with it: so over many calls
    // one command in five is the low-HP move (0.25 / 1.25), and none of them is a Guard.
    const count = (mp: number) => {
      const b = shade('shade-baralai', 12220, mp);
      b.hp = 4000;
      b.stats.maxMp = 999;
      const ids = aiHarness(b, [], 'shade-baralai', 36).run(5000);
      return (id: string) => ids.filter((x) => x === id).length / ids.length;
    };
    expect(count(720)('x2-den-baralai-regen')).toBeCloseTo(0.2, 1);
    expect(count(720)('x2-den-baralai-not-so-mighty-guard')).toBe(0); // only a monster with Reflect casts it
    const poor = count(59);
    expect(poor('x2-den-baralai-regen')).toBe(0);
    expect(poor('x2-den-baralai-absorb')).toBeGreaterThan(0.15);
    const above = shade('shade-baralai', 12220, 720);
    above.hp = 4073; // not below 12,220 / 3 = 4,073 in integers
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
