/**
 * The Magus Sisters' orders in the engine, part 2 (re-parity lane FFX-K, the Sisters' orders of 2026-10-15; **FFX only**): "One more time", the standing order that is ONE
 * global for the three sisters, the gates a standing order opens, Mindy's replay of her stored spells, the clamps, the rest command's turn and the private variables across
 * turns. `parity-ffx-engine-k-orders.test.ts` is part 1 (the same rig, `helpers/ffxOrderRig.ts`, and the same independent oracle, `helpers/ffxSisterOracle.ts`, no import of
 * a kernel or an adapter). Source: `research/re-ffx-zanmato-and-orders.md` Part 2 sections 11 to 14.
 *
 * The test values (motivation, HP and MP, the monsters) are the test's own; the real chapter's are its builder's.
 */

import { describe, expect, it } from 'vitest';
import { type Played, ORDER_ID, ORDER_COMMAND, playOrder, seeds, sistersRt, sweep } from './helpers/ffxOrderRig.ts';
import { Rig, SUMMON, build, ids, sisters } from './helpers/ffxKRig.ts';

const REST = 0x312c;
const CAMISADE = 0x30e5;
const ULTIMA = 0x3053;

/** Did the repeat's roll pass? (Its four-argument pair is written then, and only then.) */
const passed = (p: Played): boolean => p.oracle.fx.some((f) => f.kind === 'gain4');
const performedOnce = (ps: Played[], id: string): Played[] => ps.filter((p) => p.performed.includes(id));

describe('"One more time" (0x3125, event 14): roll M + 150 (Cindy) or M + 120, then the last command stands as the order', () => {
  it('a passed roll stores her last command as the standing order, sets the repeat flag, writes the four-argument pair and re-enters her stored class', () => {
    for (const [who, last, command] of [['cindy', CAMISADE, 'camisade'], ['sandy', 0x30e7, 'razzia'], ['mindy', 0x30e9, 'passado']] as const) {
      const all = sweep(`${who} repeat`, () => ({ who, event: 14, m: 100, memory: { last, cls: 2 } }), seeds(24));
      const ps = all.filter(passed);
      expect(ps.length, `${who}: seeds whose roll passed`).toBeGreaterThan(10);
      for (const p of ps) {
        expect(p.performed, who).toEqual([command]); // the only candidate that passes is the standing one (no roll of its own; a pick among the foes)
        const rt = sistersRt(p.rig);
        expect([rt.order, rt.memory[who]!.last, rt.memory[who]!.flag, rt.memory[who]!.cls], who).toEqual([last, last, 1, 2]);
        // The two-argument gain calls are suppressed while an order stands: the pair is the repeat's, +4 motivation and +2 gauge points (the repeated action hit).
        expect(rt.motivation[who], who).toBe(100); // 100 + 4, clamped
      }
    }
  });
  it('a repeat whose command finds nothing to hit loses the repeat\'s 6 (Mindy\'s 15), not the usual 5: the two-argument loss is suppressed while the order stands', () => {
    for (const [who, last, loss] of [['cindy', CAMISADE, 6], ['sandy', 0x30e7, 6], ['mindy', 0x30e9, 15]] as const) {
      const ps = sweep(`${who} repeat, nobody to hit`, () => ({ who, event: 14, m: 100, memory: { last, cls: 2 }, monsters: [{ distance: 3 }] }), seeds(24)).filter(passed);
      expect(ps.length, who).toBeGreaterThan(10);
      for (const p of ps) {
        expect(p.performed, who).toEqual([]);
        const rt = sistersRt(p.rig);
        expect([rt.motivation[who], rt.memory[who]!.last, rt.order], who).toEqual([100 - loss, REST, last]);
      }
    }
  });
  it('a failed roll clears the standing order, stores class 1 (Mindy also clears her stored list) and runs the class 1 chain', () => {
    const ps = sweep('cindy failed repeat', () => ({ who: 'cindy', event: 14, m: 0, memory: { last: CAMISADE, cls: 2 } }), seeds(40)).filter((p) => !passed(p));
    expect(ps.length).toBeGreaterThan(10);
    for (const p of ps) expect([sistersRt(p.rig).order, sistersRt(p.rig).memory['cindy']!.flag, sistersRt(p.rig).memory['cindy']!.cls]).toEqual([0, 0, 1]);
    const ms = sweep('mindy failed repeat', () => ({ who: 'mindy', event: 14, m: 0, memory: { last: 0x30e9, cls: 0, cnt: 2, lst: [0x3052, 0x3045] }, sisters: { cindy: { reflect: true } } }), seeds(40)).filter((p) => !passed(p));
    expect(ms.length).toBeGreaterThan(10);
    for (const p of ms) expect(sistersRt(p.rig).memory['mindy']!.count).toBe(0);
  });
  it('with nothing performed yet (last = 0) a passed repeat stores 0, which is no order, and the free choice runs', () => {
    const ps = sweep('cindy repeat with no history', () => ({ who: 'cindy', event: 14, m: 100, memory: { last: 0, cls: 0 } }), seeds(24)).filter(passed);
    expect(ps.length).toBeGreaterThan(10);
    for (const p of ps) expect(sistersRt(p.rig).memory['cindy']!.flag).toBe(1);
  });
});

describe('the standing order is ONE global for all three sisters', () => {
  it('Cindy\'s repeat sets it, the next handler of ANY sister clears it first, and that sister\'s own search then rolls its chance again', () => {
    const rig = new Rig(build({ aeons: sisters(0), sisters: { motivation: { cindy: 100, sandy: 100, mindy: 100 } } }), undefined, 3);
    rig.until('yuna');
    rig.submit(SUMMON('cindy'));
    rig.until('cindy');
    const rt = sistersRt(rig);
    rt.memory['cindy'] = { last: CAMISADE, flag: 0, cls: 2, list: [0, 0], count: 0 };
    rt.menu!.orders.push(ORDER_COMMAND(14));
    rig.submit({ kind: 'ability', id: ORDER_ID[14]!, targets: [] });
    const standing = rt.order;
    // The repeat's roll can fail (M + 150 is 250 of 256): then nothing stands and the point is moot; the seed above passes it.
    expect(standing, 'Cindy\'s repeat stands as the order').toBe(CAMISADE);
    // Another sister takes her turn with a handler of her own: it clears the order before it searches anything.
    for (let i = 0; i < 10; i++) {
      const d = rig.nextInput();
      if (d.actorId === 'sandy') {
        rt.menu!.orders.push(ORDER_COMMAND(15));
        expect(rt.order, 'still standing at Sandy\'s turn: a turn start clears nothing').toBe(CAMISADE);
        const from = rig.taps.length;
        rig.submit({ kind: 'ability', id: ORDER_ID[15]!, targets: [] });
        expect(rt.order, 'cleared by Sandy\'s Fight!').toBe(0);
        expect(rig.draws(from, 18).length, 'with no order standing her Razzia roll is a real roll again').toBeGreaterThan(0);
        return;
      }
      rig.submit({ kind: 'defend', targets: [] });
    }
    throw new Error('Sandy never had a turn');
  });
});

describe('the gates a standing order opens, and a negative chance', () => {
  it('"Go, go!" under a repeat: the plain gate roll is drawn first and always, then Ultima\'s M - 80 is negative and passes with no roll of its own; it hits the whole group', () => {
    const ps = sweep('gogo repeat ultima', () => ({ who: 'cindy', event: 14, m: 20, memory: { last: ULTIMA, cls: 3 } }), seeds(60));
    const cast = performedOnce(ps, 'ultima');
    expect(cast.length, 'seeds whose repeat roll passed').toBeGreaterThan(20);
    for (const p of cast) {
      const start = p.events.find((e) => e.type === 'action-start' && e.abilityId === 'ultima');
      expect(start && start.type === 'action-start' ? [...start.targets].sort() : [], 'Ultima is aimed at the stored group, every foe').toEqual(['m0', 'm1']);
      // The repeat roll and the gate roll (both on stream 18), and one pick among the two foes on stream 4; Ultima itself rolled nothing.
      expect([p.d18.length, p.d4.length]).toEqual([2, 1]);
    }
  });
  it('Cindy\'s "Go, go!" opens its first two rows under a standing order even when she is unhurt and has full MP (Pray and Osmose are searched, and refused for not being the standing command)', () => {
    const ps = sweep('gogo repeat unhurt', () => ({ who: 'cindy', event: 14, m: 100, memory: { last: 0x3000, cls: 3 } }), seeds(24)).filter(passed);
    expect(ps.length).toBeGreaterThan(10);
    for (const p of ps) expect(p.performed).toEqual(['cindy-attack']);
  });
});

describe('Mindy\'s stored list is replayed by "One more time" (note section 14 step 1)', () => {
  it('both stored spells are searched on Cindy alone with no roll and performed in order, with no gain call of their own and her last command unchanged; they bounce', () => {
    const ps = sweep('mindy replay', () => ({ who: 'mindy', event: 14, m: 100, memory: { last: 0x3045, cls: 0, cnt: 2, lst: [0x3052, 0x3045] }, sisters: { cindy: { reflect: true } } }), seeds(24)).filter(passed);
    expect(ps.length).toBeGreaterThan(10);
    for (const p of ps) {
      expect(p.performed).toEqual(['flare', 'fira']);
      expect(sistersRt(p.rig).memory['mindy']!.last, 'a replay sets no last command').toBe(0x3045);
      expect(p.rig.fighter('cindy').hp).toBe(6000);
    }
  });
});

describe('the rest command, the clamps and the turn', () => {
  it('a rest turn is no action: no ability starts, only the order\'s own start and end; the turn is charged rank 3 (Agility 40: 21 ticks, Agility 100: 12)', () => {
    for (const [who, ticks] of [['cindy', 21], ['sandy', 21], ['mindy', 12]] as const) {
      const p = playOrder({ who, event: 15, m: 40, monsters: [{ distance: 3 }], seed: 2 });
      expect(p.performed).toEqual([]);
      expect(p.events.filter((e) => e.type === 'action-start' || e.type === 'action-end').map((e) => e.type)).toEqual(['action-start', 'action-end']);
      expect(p.rig.rt.actors.get(who)!.ctb, who).toBe(ticks);
    }
  });
  it('motivation clamps at 100 and at 0; the gauge clamps at the bar\'s 20 points', () => {
    const up = Array.from({ length: 16 }, (_, i) => playOrder({ who: 'cindy', event: 15, m: 99, gauge: 19, seed: i + 1 }));
    for (const p of up) {
      expect(sistersRt(p.rig).motivation['cindy']).toBeLessThanOrEqual(100);
      expect(p.rig.fighter('cindy').overdrive!.gauge).toBeLessThanOrEqual(100);
    }
    expect(up.some((p) => sistersRt(p.rig).motivation['cindy'] === 100), 'the motivation reached its ceiling').toBe(true);
    expect(up.some((p) => p.rig.fighter('cindy').overdrive!.gauge === 100), 'the gauge reached its ceiling').toBe(true);
    const down = playOrder({ who: 'cindy', event: 15, m: 2, monsters: [{ distance: 3 }], seed: 4 });
    expect(sistersRt(down.rig).motivation['cindy'], 'a loss of 5 from 2 stops at 0').toBe(0);
  });
  it('every order is an action she parsed: the engine counts it and her next menu offers "One more time"', () => {
    const rig = new Rig(build({ aeons: sisters(0), sisters: { motivation: { cindy: 40, sandy: 40, mindy: 40 } } }), undefined, 5);
    rig.until('yuna');
    rig.submit(SUMMON('cindy'));
    rig.until('sandy');
    const rt = sistersRt(rig);
    rt.menu!.orders.push(ORDER_COMMAND(13));
    rig.submit({ kind: 'ability', id: ORDER_ID[13]!, targets: [] });
    expect((rig.engine as unknown as { ctx: { rt: { sisters: { parsed: Record<string, number> } } } }).ctx.rt.sisters.parsed['sandy']).toBe(1);
    for (let i = 0; i < 12; i++) {
      const d = rig.nextInput();
      if (d.actorId === 'sandy') {
        expect(ids(d.commands)).toContain('sister-order-repeat');
        return;
      }
      rig.submit({ kind: 'defend', targets: [] });
    }
    throw new Error('Sandy never had a second turn');
  });
});

describe('Combine powers, in the proven handler\'s terms', () => {
  it('a failed Combine performs the rest command on herself, which is her last command; the roll is the proven handler\'s (200 + M, stream 18, and the pick on stream 4 only after it)', () => {
    let failed = 0;
    for (const seed of seeds(30)) {
      const p = playOrder({ who: 'cindy', event: 18, m: 0, gauge: 20, seed });
      expect(p.d18.length, `seed ${seed}: stream-18 draws`).toBe(p.oracle.draws.i18);
      expect(p.d4.length, `seed ${seed}: stream-4 draws`).toBe(p.oracle.draws.i4);
      if (p.oracle.fx.some((f) => f.kind === 'delta')) continue; // a pass is the joint action: `parity-ffx-engine-k-aeons*.test.ts` has it
      failed++;
      expect([sistersRt(p.rig).memory['cindy']!.last, sistersRt(p.rig).motivation['cindy'], p.performed], `seed ${seed}`).toEqual([REST, 0, []]);
    }
    expect(failed, 'seeds whose roll of 200 + M failed').toBeGreaterThan(3);
  });
});

describe('whole battles: every offered order, chosen at random, over many turns', () => {
  /** A small deterministic generator of the test's own (not the game's). */
  const lcg = (seed: number): (() => number) => {
    let x = seed >>> 0;
    return () => {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      return x / 0x100000000;
    };
  };

  it('40 seeds x 60 turns: the Sisters take any order the menu offers, with their HP, MP and statuses shaken between turns; nothing throws, every action ends, motivation stays in 0..100, the gauge in 0..100, and the standing order is 0 or a command they can perform', () => {
    const performable = new Set([0, 0x3000, 0x3019, 0x3020, 0x302b, 0x302c, 0x302d, 0x3034, 0x3035, 0x3036, 0x303a, 0x303b, 0x303c, 0x3040, 0x3045, 0x3046, 0x3047, 0x3048, 0x3049, 0x304a, 0x304b, 0x304c, 0x304d, 0x304f, 0x3050, 0x3051, 0x3052, 0x3053, 0x30e5, 0x30e7, 0x30e9, 0x312c, 0x312d]);
    let orders = 0;
    const seen = new Set<string>();
    for (const seed of seeds(40)) {
      const rand = lcg(seed * 7919);
      const rig = new Rig(build({ aeons: sisters(rand() < 0.5 ? 100 : 0), sisters: { motivation: { cindy: 10 + Math.floor(rand() * 90), sandy: 10 + Math.floor(rand() * 90), mindy: 10 + Math.floor(rand() * 90) } } }), undefined, seed);
      rig.until('yuna');
      rig.submit(SUMMON('cindy'));
      const rt = sistersRt(rig);
      for (let turn = 0; turn < 60; turn++) {
        let d;
        try {
          d = rig.nextInput();
        } catch {
          break; // the battle ended (the Sisters were all knocked out and went away, or the foes fell)
        }
        if (d.actorId === 'yuna') break;
        // Shake the field a little between turns.
        for (const id of ['cindy', 'sandy', 'mindy'] as const) {
          const c = rig.fighter(id);
          if (c.alive && rand() < 0.3) c.hp = Math.max(1, Math.floor(c.stats.maxHp * rand()));
          if (c.alive && rand() < 0.3) c.mp = Math.floor(c.stats.maxMp * rand());
        }
        const orderRows = d.commands.filter((r) => r.enabled && r.command.kind === 'ability' && r.command.id.startsWith('sister-order-'));
        const row = orderRows[Math.floor(rand() * orderRows.length)] ?? d.commands.find((r) => r.enabled && r.command.kind === 'dismiss');
        if (row === undefined) break;
        const before = rig.events.length;
        rig.submit(row.command);
        const events = rig.events.slice(before);
        orders++;
        const depth = events.reduce((n, e) => (e.type === 'action-start' ? n + 1 : e.type === 'action-end' ? n - 1 : n), 0);
        expect(depth, `seed ${seed} turn ${turn}: every action ended`).toBe(0);
        for (const id of ['cindy', 'sandy', 'mindy']) {
          expect(rt.motivation[id]).toBeGreaterThanOrEqual(0);
          expect(rt.motivation[id]).toBeLessThanOrEqual(100);
          const g = rig.fighter(id).overdrive!.gauge;
          expect(g).toBeGreaterThanOrEqual(0);
          expect(g).toBeLessThanOrEqual(100);
        }
        expect(performable.has(rt.order), `seed ${seed} turn ${turn}: the standing order 0x${rt.order.toString(16)}`).toBe(true);
        for (const e of events) if (e.type === 'action-start' && e.abilityId !== undefined) seen.add(e.abilityId);
        if (rig.state.aeonId === null) break; // the Sisters went away (all three down, or dismissed)
      }
    }
    expect(orders).toBeGreaterThan(400);
    expect(seen.size, 'distinct abilities the Sisters performed').toBeGreaterThan(20);
  });
});
