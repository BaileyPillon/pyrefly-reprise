/**
 * The FF7 command window and the command queue: Attack / Magic / Item / Defend,
 * Limit in Attack's place, MP, items, Defend, rows, and the queue model
 * (core §2.6, **our estimate**, pinned here so it cannot drift). FF7 only.
 * "core" is `research/ff7-battle-core.md`, "gs" is `research/ff7-guard-scorpion.md`.
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../src/battle/common/types.ts';
import { ATTACK_BOSS, buildWith, DEFEND, newEngine, ofType, playUntil, toNextMenu, u } from './helpers/ff7.ts';

function menuFor(seed: number, want: string, party?: Parameters<typeof newEngine>[2]) {
  const e = newEngine(seed, {}, party);
  for (let i = 0; i < 50; i++) {
    const who = toNextMenu(e);
    if (who === want) {
      const d = e.nextDecision();
      if (d.kind !== 'player-input') throw new Error('no menu');
      return { e, rows: d.commands };
    }
    e.submit(DEFEND);
  }
  throw new Error(`no menu for ${want}`);
}

describe('the command window [core §9]', () => {
  it("Cloud: Attack, Magic (Bolt, Ice from his Materia), Item, Change, Defend", () => {
    const { rows } = menuFor(1, 'cloud');
    expect(rows.map((r) => [r.label, r.category, r.enabled])).toEqual([
      ['Attack', 'attack', true],
      ['Bolt', 'magic', true],
      ['Ice', 'magic', true],
      ['Potion x3', 'item', true],
      ['Phoenix Down x1', 'item', false], // nobody is KO'd
      ['Change', 'special', true],
      ['Defend', 'special', true],
    ]);
    expect(rows[1]?.mpCost).toBe(4);
    expect(rows[4]?.disabledReason).toBe('No target');
  });

  it('Barret: Attack, Cure (Restore on his one slot, gs §8.4), Item, Change, Defend', () => {
    const { rows } = menuFor(1, 'barret');
    expect(rows.map((r) => r.label)).toEqual(['Attack', 'Cure', 'Potion x3', 'Phoenix Down x1', 'Change', 'Defend']);
    expect(rows[1]?.validTargets).toEqual(['cloud', 'barret']);
  });

  it('Limit replaces Attack while the gauge is full: Braver for Cloud, Big Shot for Barret [core §7.2, §7.3]', () => {
    const full = buildWith((b) => b.members.forEach((m) => (m.limit.gauge = 255)));
    expect(menuFor(2, 'cloud', full).rows[0]).toMatchObject({ label: 'Braver', command: { kind: 'limit', id: 'braver' }, category: 'attack' });
    expect(menuFor(2, 'barret', full).rows[0]).toMatchObject({ label: 'Big Shot', command: { kind: 'limit', id: 'big-shot' } });
  });

  it('Magic greys out when MP cannot pay [core §8.5]', () => {
    const dry = buildWith((b) => {
      const c = b.members.find((m) => m.id === 'cloud');
      if (c) c.mp = 3;
    });
    const bolt = menuFor(1, 'cloud', dry).rows.find((r) => r.label === 'Bolt');
    expect(bolt).toMatchObject({ enabled: false, disabledReason: 'Not enough MP' });
  });

  it('an illegal command throws; a target on the wrong side throws', () => {
    const { e } = menuFor(1, 'cloud');
    expect(() => e.submit({ kind: 'ability', id: 'cure', targets: ['cloud'] })).toThrow(/not in cloud/);
    expect(() => e.submit({ kind: 'attack', targets: ['barret'] })).toThrow(/illegal target/);
  });
});

describe('what the commands do', () => {
  it('Bolt pays 4 MP and hits the tail-down boss for 90 to 96 (weak x2) [core §14]', () => {
    const { e } = menuFor(3, 'cloud');
    const out = e.submit({ kind: 'ability', id: 'bolt', targets: ['guard-scorpion'] });
    const hit = ofType(out, 'damage')[0];
    expect(hit?.amount).toBeGreaterThanOrEqual(90);
    expect(hit?.amount).toBeLessThanOrEqual(96);
    expect(hit?.affinity).toBe('weak');
    expect(u(e, 'cloud').mp).toBe(57 - 4);
  });

  it('Cure heals 232 to 248 [core §14]; a Potion 100 and one fewer is carried [core §8.6]', () => {
    const low = buildWith((b) => b.members.forEach((m) => (m.hp = 1)));
    const { e } = menuFor(1, 'barret', low);
    const cure = ofType(e.submit({ kind: 'ability', id: 'cure', targets: ['cloud'] }), 'damage')[0];
    expect(-(cure?.amount ?? 0)).toBeGreaterThanOrEqual(232);
    expect(-(cure?.amount ?? 0)).toBeLessThanOrEqual(248);
    const who = toNextMenu(e);
    expect(who).not.toBeNull();
    const target = u(e, 'barret').hp < 200 ? 'barret' : 'cloud';
    const before = u(e, target).hp;
    const potion = ofType(e.submit({ kind: 'item', id: 'potion', targets: [target] }), 'damage')[0];
    expect(potion?.amount).toBe(-Math.min(100, u(e, target).stats.maxHp - before));
    expect(e.inventory()['potion']).toBe(2);
  });

  it("Phoenix Down revives a KO'd ally with [MaxHP / 4] [core §8.6]; on the living it misses", () => {
    const ko = buildWith((b) => {
      const c = b.members.find((m) => m.id === 'barret');
      if (c) c.hp = 0;
    });
    const { e } = menuFor(1, 'cloud', ko);
    const row = e.nextDecision();
    if (row.kind !== 'player-input') throw new Error('menu');
    expect(row.commands.find((r) => r.label.startsWith('Phoenix'))?.validTargets).toEqual(['barret']);
    const out = e.submit({ kind: 'item', id: 'phoenix-down', targets: ['barret'] });
    const rev = ofType(out, 'revive')[0];
    expect(rev).toMatchObject({ targetId: 'barret', cause: 'phoenix-down', hp: Math.trunc(317 / 4) });
    expect(u(e, 'barret').alive).toBe(true);
    expect(e.inventory()['phoenix-down']).toBe(0);
  });

  it('Defend halves physical damage until the next action: Rifle 17 to 19, Scorpion Tail 30 to 34 [gs §4 table]', () => {
    const e = newEngine(9);
    playUntil(e, () => DEFEND, () => e.state().turn > 60);
    let seen = 0;
    let startId = '';
    for (const ev of e.state().log) {
      if (ev.type === 'action-start') startId = ev.abilityId ?? '';
      if (ev.type !== 'damage' || ev.crit || ev.sourceId !== 'guard-scorpion') continue;
      seen++;
      const [lo, hi] = startId === 'rifle' ? [17, 19] : [30, 34];
      expect(ev.amount, startId).toBeGreaterThanOrEqual(lo);
      expect(ev.amount, startId).toBeLessThanOrEqual(hi);
    }
    expect(seen).toBeGreaterThan(5);
  });

  it('front row takes the full hit: Rifle 35 to 38, Scorpion Tail 62 to 68 [gs §4]', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const e = newEngine(seed);
      playUntil(e, () => ATTACK_BOSS, () => e.state().turn > 12);
      let id = '';
      for (const ev of e.state().log) {
        if (ev.type === 'action-start') id = ev.abilityId ?? '';
        if (ev.type !== 'damage' || ev.crit || ev.sourceId !== 'guard-scorpion' || (id !== 'rifle' && id !== 'scorpion-tail')) continue;
        const [lo, hi] = id === 'rifle' ? [35, 38] : [62, 68];
        expect(ev.amount).toBeGreaterThanOrEqual(lo);
        expect(ev.amount).toBeLessThanOrEqual(hi);
      }
    }
  });

  it("back row halves the boss's hits on Barret, not his Long Range gun [core §5.1, gs §4]", () => {
    const back = buildWith((b) => {
      const m = b.members.find((x) => x.id === 'barret');
      if (m) m.row = 'back';
    });
    for (let seed = 1; seed <= 10; seed++) {
      const e = newEngine(seed, {}, back);
      playUntil(e, (who) => (who === 'barret' ? ATTACK_BOSS : DEFEND), () => e.state().turn > 14);
      let id = '';
      let tailUp = false;
      for (const ev of e.state().log) {
        if (ev.type === 'form-change') tailUp = ev.formIndex === 1;
        if (ev.type === 'action-start') id = `${ev.actorId}:${ev.abilityId}`;
        if (ev.type !== 'damage' || ev.crit || tailUp) continue;
        if (id === 'guard-scorpion:rifle' && ev.targetId === 'barret') expect(ev.amount).toBeLessThanOrEqual(19);
        if (id === 'barret:attack') {
          expect(ev.amount).toBeGreaterThanOrEqual(32);
          expect(ev.amount).toBeLessThanOrEqual(35);
        }
      }
    }
  });
});

describe('the queue [core §2.6, our estimate]', () => {
  it('party members whose gauges fill wait first-filled-first; the head is offered, the rest stay valid', () => {
    const e = newEngine(11, { atbMode: 'active' });
    const first = toNextMenu(e);
    for (let i = 0; i < 200 && e.inputQueue().length < 2; i++) e.tick(50, { throughInput: true });
    const q = e.inputQueue();
    expect(q[0]).toBe(first);
    if (q.length === 2) {
      expect(e.inputValid(q[1] ?? '')).toBe(true);
      const d = e.nextDecision();
      expect(d.kind === 'player-input' && d.actorId).toBe(first);
    }
  });

  it('an enemy commits the instant its gauge fills and its turn resolves in the same step [core §2.4]', () => {
    const e = newEngine(12);
    for (let i = 0; i < 20; i++) {
      const d = e.nextDecision();
      if (d.kind === 'player-input') e.submit(DEFEND);
      else if (d.kind === 'waiting') {
        const before = e.state().flags['guard-scorpion:count'];
        const out = e.tick(d.nextEventMs);
        if (out.some((ev) => ev.type === 'turn-start' && ev.actorId === 'guard-scorpion')) {
          expect(e.state().flags['guard-scorpion:count']).not.toBe(before);
          expect(u(e, 'guard-scorpion').ff7.atb.turnTimer).toBe(0);
          return;
        }
      }
    }
    throw new Error('the boss never acted');
  });

  it('a Limit jumps a queued action; any other command waits behind it [core §7.2]', () => {
    const full = buildWith((b) => b.members.forEach((m) => (m.limit.gauge = 255)));
    for (const [cmd, bossFirst, party] of [
      [{ kind: 'limit', id: 'braver', targets: ['guard-scorpion'] } as Command, false, full],
      [{ kind: 'attack', targets: ['guard-scorpion'] } as Command, true, undefined],
    ] as const) {
      const e = newEngine(13, {}, party);
      while (toNextMenu(e) !== 'cloud') e.submit(DEFEND);
      // Put a boss pass in the queue ahead of Cloud (reaching into the engine's private queue on purpose).
      (e as unknown as { rt: { actions: unknown[] } }).rt.actions.push({ actorId: 'guard-scorpion', command: null, abilityId: null, pass: true });
      const order = ofType(e.submit(cmd), 'turn-start').map((ev) => ev.actorId);
      expect(order[0]).toBe(bossFirst ? 'guard-scorpion' : 'cloud');
    }
  });

  it("a menu whose owner fell while it was open refuses the command (the turn is not spent, nobody else's is stolen)", () => {
    const e = newEngine(14, { atbMode: 'active' });
    const owner = toNextMenu(e);
    if (!owner) throw new Error('menu');
    const c = u(e, owner);
    c.alive = false;
    c.hp = 0;
    expect(e.inputValid(owner)).toBe(false);
    expect(e.submit(ATTACK_BOSS)).toEqual([]);
  });
});
