/**
 * Chapter XI — the fallen aeons (FFX-2): the Magus Sisters' and Anima's AI and
 * the FA2 Save Sphere between links. Split from `fallen-aeons-engine.test.ts`
 * (house rule 7). Pinned to `research/ffx2-fallen-aeons.md` §4.2 and §4.3.
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Every claim here is run, not
 * grepped [hard rule 3].
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { payStatusClocks } from '../../../src/battle/ffx2/engineHooks.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { AC } from '../../../src/battle/ffx2/ai/fallen-aeons.ts';
import { DELTA_DISARMED_FLAG } from '../../../src/battle/ffx2/ai/magus-sisters.ts';
import { aiHarness, aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import type { Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { applyStatus } from '../../../src/battle/ffx2/statuses.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { ROAD_SHIVA, ROAD_SISTERS } from '../../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { ctxFor, sisterCtx, sisterUnits } from '../helpers/fallenAeonsUnits.ts';

describe('the Magus Sisters (§4.2)', () => {
  function harness(seed = 21) {
    const s = sisterUnits();
    const h = aiHarness(s.sandy, [s.cindy, s.mindy], 'magus-sisters', seed);
    const script = aiScriptFor('magus-sisters');
    const turn = (u: Ffx2Unit): Command | null => script.decide(sisterCtx(h.ctx, u));
    return { ...s, h, script, turn };
  }

  it('Delta Attack needs all three alive and every counter at 100; it resets all three', () => {
    const t = harness();
    t.sandy.aiMemory = { [AC]: 100 };
    t.cindy.aiMemory = { [AC]: 100 };
    t.mindy.aiMemory = { [AC]: 99 };
    expect((t.turn(t.sandy) as { id: string }).id).not.toBe('x2-magus-delta-attack');
    t.mindy.aiMemory = { [AC]: 100 };
    expect((t.turn(t.mindy) as { id: string }).id).toBe('x2-magus-delta-attack');
    expect([t.sandy, t.cindy, t.mindy].map((u) => u.aiMemory?.[AC])).toEqual([0, 0, 0]);
  });

  it('the first kill disarms it for good', () => {
    const t = harness();
    t.mindy.alive = false;
    t.mindy.hp = 0;
    for (const u of [t.sandy, t.cindy]) u.aiMemory = { [AC]: 500 };
    t.script.onTurnResolved?.(sisterCtx(t.h.ctx, t.sandy), t.sandy);
    expect(t.h.flags[DELTA_DISARMED_FLAG]).toBe(true);
    for (let i = 0; i < 50; i++) {
      for (const u of [t.sandy, t.cindy]) expect((t.turn(u) as { id: string }).id).not.toBe('x2-magus-delta-attack');
    }
  });

  it('Cindy guards on turn 1, runs Action 1 on turns 2-8, and guards again on turn 9 (SinirothX)', () => {
    const t = harness();
    const ids: string[] = [];
    for (let i = 0; i < 17; i++) {
      t.cindy.aiMemory = { ...t.cindy.aiMemory, [AC]: 0 };
      ids.push((t.turn(t.cindy) as { id: string }).id);
    }
    const guards = ids.map((id, i) => (id === 'x2-cindy-not-so-mighty-guard' ? i + 1 : 0)).filter(Boolean);
    expect(guards).toEqual([1, 9, 17]);
    expect(new Set(ids.filter((id) => id !== 'x2-cindy-not-so-mighty-guard'))).toEqual(
      new Set(['x2-cindy-camisade', 'x2-cindy-absorb', 'x2-cindy-demi', 'x2-cindy-regen']),
    );
  });

  it('White Highwind only when all three are alive and below 1/4', () => {
    const t = harness();
    t.cindy.aiMemory = { turn: 1 };
    for (const u of [t.sandy, t.cindy, t.mindy]) u.hp = Math.floor(u.stats.maxHp / 4) - 1;
    expect((t.turn(t.cindy) as { id: string }).id).toBe('x2-cindy-white-highwind');
    t.sandy.hp = t.sandy.stats.maxHp;
    for (let i = 0; i < 30; i++) {
      t.cindy.aiMemory = { turn: 1 };
      expect((t.turn(t.cindy) as { id: string }).id).not.toBe('x2-cindy-white-highwind');
    }
  });

  it('+5 when her turn passes, +5 more for Cindy\'s Absorb, +5 when a Regen tick heals her', () => {
    const t = harness(4);
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      t.cindy.aiMemory = { turn: 1, [AC]: 0 };
      const id = (t.turn(t.cindy) as { id: string }).id;
      seen.add(id);
      expect(t.cindy.aiMemory[AC], id).toBe(id === 'x2-cindy-absorb' ? 10 : 5);
    }
    expect(seen.has('x2-cindy-absorb')).toBe(true);

    t.sandy.aiMemory = { [AC]: 0 };
    t.sandy.hp = 5000;
    applyStatus(t.sandy, { status: 'regen', chance: 254, duration: 0 });
    const { ctx } = ctxFor([t.sandy]);
    let heals = 0;
    for (let i = 0; i < 400 && heals === 0; i++) {
      const before = t.sandy.hp;
      payStatusClocks([t.sandy], 50, () => undefined, ctx, (u) => sisterCtx(t.h.ctx, u));
      if (t.sandy.hp > before) heals += 1;
    }
    expect(heals).toBe(1);
    expect(t.sandy.aiMemory[AC]).toBe(5);
  });

  it('a Regen payout at full HP heals nothing and adds nothing; two payouts in one clock step add 5 each', () => {
    const t = harness(5);
    applyStatus(t.cindy, { status: 'regen', chance: 254, duration: 0 });
    const { ctx } = ctxFor([t.cindy]);
    const interval = 9000; // STATUS_TICK_INTERVAL_TICKS: one payout every 3 s
    const pay = (step: number) => payStatusClocks([t.cindy], step, () => undefined, ctx, (u) => sisterCtx(t.h.ctx, u));

    t.cindy.aiMemory = { [AC]: 0 };
    t.cindy.hp = t.cindy.stats.maxHp;
    pay(interval * 3); // three payouts, all at full HP
    expect(t.cindy.aiMemory[AC]).toBe(0);

    t.cindy.aiMemory = { [AC]: 0 };
    t.cindy.statusTickAccumulator = 0;
    t.cindy.hp = 1000;
    pay(interval * 2); // two payouts, both with room
    expect(t.cindy.aiMemory[AC]).toBe(10);

    // Two payouts, but the first tops her up: only the first counts.
    const per = Math.floor(t.cindy.stats.maxHp * 0.03);
    t.cindy.aiMemory = { [AC]: 0 };
    t.cindy.statusTickAccumulator = 0;
    t.cindy.hp = t.cindy.stats.maxHp - Math.floor(per / 2);
    pay(interval * 2);
    expect(t.cindy.hp).toBe(t.cindy.stats.maxHp);
    expect(t.cindy.aiMemory[AC]).toBe(5);
  });
});

describe('Anima (§4.3)', () => {
  it('4/5 Stare, 1/5 Pain, +5 a turn, Oblivion at 100 and back to 0', () => {
    const anima = aiUnit('x2-anima', 'enemy');
    const h = aiHarness(anima, [], 'x2-anima', 31);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 5000; i++) {
      anima.aiMemory = { [AC]: 0 };
      const id = h.run(1)[0]!;
      counts[id] = (counts[id] ?? 0) + 1;
      expect(anima.aiMemory[AC]).toBe(5);
    }
    expect(counts['x2-anima-pain']! / 5000).toBeCloseTo(0.2, 1);
    anima.aiMemory = { [AC]: 100 };
    expect(h.run(1)[0]).toBe('x2-anima-oblivion');
    expect(anima.aiMemory[AC]).toBe(0);
  });
});

describe('FA2: the Save Sphere between links', () => {
  it('link 2 opens at full HP and MP with a KO\'d girl standing; link 1 does not restore', () => {
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    const first = { game: 'ffx2' as const, party: farplaneBuild, enemies: data.ENEMY_GROUPS_BY_ID[ROAD_SHIVA]!, triggers: [], seed: 5, condition: 'normal' as const, canEscape: false };
    engine.init(first);
    const state = engine.state();
    const yuna = state.combatants['yuna']!;
    const rikku = state.combatants['rikku']!;
    (yuna as { hp: number }).hp = 0;
    (rikku as { hp: number; mp: number }).hp = 17;
    (rikku as { mp: number }).mp = 0;
    const next = setupForNextLink(first, data.ENEMY_GROUPS_BY_ID[ROAD_SISTERS]!, state, 6);
    expect(next.party.members.find((m) => m.id === 'rikku')?.hp).toBe(17); // the chain carries...
    engine.init(next);
    const after = engine.state().combatants;
    for (const id of ['yuna', 'rikku', 'paine']) {
      const g = after[id]!;
      expect(g.hp, id).toBe(g.stats.maxHp); // ...and the Save Sphere restores
      expect(g.mp, id).toBe(g.stats.maxMp);
      expect(g.alive, id).toBe(true);
    }
    // A link without the flag keeps what it is handed (today's chain rule).
    const plain = { ...next, enemies: { ...data.ENEMY_GROUPS_BY_ID[ROAD_SISTERS]!, restoresPartyOnEntry: false } };
    engine.init(plain);
    expect(engine.state().combatants['rikku']!.hp).toBe(17);
  });
});
