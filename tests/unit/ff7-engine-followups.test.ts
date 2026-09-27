/**
 * The FF7 engine's follow-ups to the adversarial check (docs/handoff/ff7-engine.md,
 * CHECK and FOLLOW-UP): the Change command (C1), animations under the three modes
 * (C2), Wait's fresh menu at the top list (C3), and Defend ending when the Time gauge
 * fills (C7). FF7 only. "core" is `research/ff7-battle-core.md`, "gs" is
 * `research/ff7-guard-scorpion.md`; the manual is the North American FF7 manual.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, Command, Ff7AtbMode, Ff7Combatant } from '../../src/battle/common/types.ts';
import { clockHeldByAnimation, runFf7Battle, sensiblePolicy, type Ff7Policy } from '../../src/battle/ff7/index.ts';
import { ATTACK_BOSS, buildWith, DEFEND, gsSetup, newEngine, ofType, REG, toNextMenu, u } from './helpers/ff7.ts';

const CHANGE: Command = { kind: 'row-change', targets: [] };

describe('Change (C1) [core §5.1, §9; manual p. 18]', () => {
  it('both members have it, between the Items and Defend, with no target', () => {
    const e = newEngine(1);
    const who = toNextMenu(e) ?? '';
    const d = e.nextDecision();
    expect(d.kind).toBe('player-input');
    if (d.kind !== 'player-input') return;
    const labels = d.commands.map((r) => r.label);
    expect(labels.slice(-2)).toEqual(['Change', 'Defend']);
    const change = d.commands.find((r) => r.command.kind === 'row-change');
    expect(change).toMatchObject({ category: 'special', enabled: true, validTargets: [], mpCost: 0 });
    expect(who === 'cloud' || who === 'barret').toBe(true);
  });

  it('swaps the row, spends the turn (gauge back to 0) and swaps back on a second use', () => {
    const e = newEngine(3);
    const who = toNextMenu(e) ?? '';
    expect(u(e, who).ff7.row).toBe('front'); // both start front [staging §5, FF Wiki Row]
    const out = e.submit(CHANGE);
    expect(out.map((ev) => ev.type)).toEqual(['turn-start', 'action-start', 'action-end']);
    expect(ofType(out, 'action-start')[0]?.command).toEqual(CHANGE);
    expect(u(e, who).ff7.row).toBe('back');
    expect(u(e, who).ff7.atb.turnTimer).toBe(0);
    expect(e.inputQueue()).not.toContain(who);
    for (let i = 0; i < 200; i++) {
      const next = toNextMenu(e);
      if (next === who) break;
      e.submit(DEFEND);
    }
    e.submit(CHANGE);
    expect(u(e, who).ff7.row).toBe('front');
  });

  it('is offered with a full Limit gauge too, and a new battle starts in the build row (manual: not carried over)', () => {
    const full = buildWith((b) => b.members.forEach((m) => (m.limit.gauge = 255)));
    const f = newEngine(2, {}, full);
    toNextMenu(f);
    const menu = f.nextDecision();
    const kinds = menu.kind === 'player-input' ? menu.commands.map((r) => r.command.kind) : [];
    expect(kinds[0]).toBe('limit');
    expect(kinds.slice(-2)).toEqual(['row-change', 'defend']);
    const e = newEngine(2);
    const who = toNextMenu(e) ?? '';
    e.submit(CHANGE);
    expect(u(e, who).ff7.row).toBe('back');
    expect(u(newEngine(2), who).ff7.row).toBe('front');
  });

  it('Cloud at the back deals half: Attack on the lowered tail 18 to 20 instead of 38 to 41 [core §4.5 step 3, derived]', () => {
    let seen = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const e = newEngine(seed);
      for (let i = 0; i < 400 && seen < 40; i++) {
        const d = e.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') e.tick(d.nextEventMs);
        if (d.kind !== 'player-input') continue;
        const c = u(e, d.actorId);
        if (d.actorId === 'cloud' && c.ff7.row === 'front') e.submit(CHANGE);
        else if (d.actorId === 'cloud' && u(e, 'guard-scorpion').ff7.formIndex === 0) {
          const limit = d.commands.find((r) => r.command.kind === 'limit');
          if (limit) {
            e.submit({ ...limit.command, targets: ['guard-scorpion'] } as Command); // Braver; not counted
            continue;
          }
          for (const ev of ofType(e.submit(ATTACK_BOSS), 'damage')) {
            if (ev.sourceId !== 'cloud' || ev.crit) continue;
            seen++;
            expect(ev.amount).toBeGreaterThanOrEqual(18);
            expect(ev.amount).toBeLessThanOrEqual(20);
          }
        } else e.submit(DEFEND);
      }
    }
    expect(seen).toBeGreaterThan(10);
  });

  it('a battle where Barret moves back: he takes half (Rifle 17 to 19, Scorpion Tail 30 to 34, split Tail Laser 35 to 38) and his Long Range Gatling Gun still deals 32 to 35 [gs §4, §8.3; core §5.1]', () => {
    // Barret: Change once, then Attack every turn; Cloud plays the sensible policy.
    const policy: Ff7Policy = (view) => {
      if (view.actorId !== 'barret') return sensiblePolicy(view);
      const b = view.state.combatants.barret as Ff7Combatant;
      if (b.ff7.row === 'front') return CHANGE;
      const limit = view.commands.find((r) => r.command.kind === 'limit');
      return limit ? ({ ...limit.command, targets: ['guard-scorpion'] } as Command) : ATTACK_BOSS;
    };
    const counts = { rifle: 0, tail: 0, laser: 0, gun: 0 };
    let wins = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const run = runFf7Battle({ setup: gsSetup(seed), registry: REG, policy });
      if (run.result.outcome === 'victory') wins++;
      let back = false;
      let tailUp = false;
      let start: Extract<BattleEvent, { type: 'action-start' }> | null = null;
      for (const ev of run.log) {
        if (ev.type === 'form-change') tailUp = ev.formIndex === 1;
        if (ev.type === 'action-start') {
          start = ev;
          if (ev.actorId === 'barret' && ev.command.kind === 'row-change') back = !back;
        }
        if (ev.type !== 'damage' || ev.crit || !back || !start || ev.amount <= 0) continue;
        if (ev.targetId === 'barret' && ev.sourceId === 'guard-scorpion') {
          const id = start.abilityId;
          const [lo, hi, key] =
            id === 'rifle' ? [17, 19, 'rifle'] : id === 'scorpion-tail' ? [30, 34, 'tail'] : id === 'tail-laser' && start.targets.length === 2 ? [35, 38, 'laser'] : [0, 0, ''];
          if (!key) continue;
          counts[key as keyof typeof counts]++;
          expect(ev.amount, `${id} seed ${seed}`).toBeGreaterThanOrEqual(lo);
          expect(ev.amount, `${id} seed ${seed}`).toBeLessThanOrEqual(hi);
        }
        if (ev.sourceId === 'barret' && start.abilityId === 'attack' && !tailUp) {
          counts.gun++;
          expect(ev.amount, `Gatling Gun seed ${seed}`).toBeGreaterThanOrEqual(32);
          expect(ev.amount, `Gatling Gun seed ${seed}`).toBeLessThanOrEqual(35);
        }
      }
    }
    expect(counts.rifle).toBeGreaterThan(3);
    expect(counts.tail).toBeGreaterThan(3);
    expect(counts.laser).toBeGreaterThan(3);
    expect(counts.gun).toBeGreaterThan(10);
    expect(wins).toBeGreaterThan(0);
  });
});

describe('animations and the three modes (C2) [core §2.5]', () => {
  it('Recommended and Wait hold during an animation; Active holds only for a Summon', () => {
    expect(clockHeldByAnimation('recommended', true, false)).toBe(true);
    expect(clockHeldByAnimation('wait', true, false)).toBe(true);
    expect(clockHeldByAnimation('active', true, false)).toBe(false);
    expect(clockHeldByAnimation('active', true, true)).toBe(true);
    for (const m of ['active', 'recommended', 'wait'] as const) expect(clockHeldByAnimation(m, false, false)).toBe(false);
  });

  for (const mode of ['recommended', 'wait'] as const) {
    it(`${mode}: tick during an animation moves nothing`, () => {
      const e = newEngine(5, { atbMode: mode });
      e.setAnimating(true);
      const t = e.state().ticks;
      const timers = ['cloud', 'barret', 'guard-scorpion'].map((id) => u(e, id).ff7.atb.turnTimer);
      expect(e.tick(20000)).toEqual([]);
      expect(e.state().ticks).toBe(t);
      expect(['cloud', 'barret', 'guard-scorpion'].map((id) => u(e, id).ff7.atb.turnTimer)).toEqual(timers);
      e.setAnimating(false);
      expect(e.animating()).toBe(false);
    });
  }

  it('Active: every gauge runs during an animation, but nothing executes until it ends', () => {
    const e = newEngine(5, { atbMode: 'active' });
    e.setAnimating(true);
    expect(e.clockHeld()).toBe(false);
    const out = e.tick(30000); // long enough for all three gauges to fill
    expect(out.filter((ev) => ev.type === 'turn-start')).toEqual([]);
    expect(e.state().ticks).toBeGreaterThan(0);
    expect([...e.inputQueue()].sort()).toEqual(['barret', 'cloud']);
    expect(u(e, 'guard-scorpion').ff7.atb.ready).toBe(true); // committed, waiting in the queue
    e.setAnimating(false);
    const d = e.nextDecision();
    expect(d.kind).toBe('resolved');
    if (d.kind === 'resolved') expect(d.events.find((ev) => ev.type === 'turn-start')).toMatchObject({ actorId: 'guard-scorpion' });
  });

  it('Active: a Summon animation holds the clock', () => {
    const e = newEngine(5, { atbMode: 'active' });
    e.setAnimating(true, { summon: true });
    expect(e.clockHeld()).toBe(true);
    const t = e.state().ticks;
    e.tick(5000);
    expect(e.state().ticks).toBe(t);
  });

  it('with animation and menu time the modes differ, and each is deterministic', () => {
    const run = (mode: Ff7AtbMode) =>
      runFf7Battle({ setup: gsSetup(7), registry: REG, policy: sensiblePolicy, atbMode: mode, animationMs: 1500, menuMs: { top: 500, deep: 1500 } });
    const a = run('active');
    expect(JSON.stringify(run('active').log)).toBe(JSON.stringify(a.log));
    const r = run('recommended');
    const w = run('wait');
    for (const x of [a, r, w]) expect(['victory', 'defeat']).toContain(x.result.outcome);
    // The boss acts more often per party turn when time runs through animations and menus.
    const bossShare = (log: readonly BattleEvent[]) => {
      const t = ofType(log, 'turn-start');
      return t.filter((ev) => ev.actorId === 'guard-scorpion').length / t.length;
    };
    expect(bossShare(a.log)).toBeGreaterThan(bossShare(w.log));
  });
});

describe('Defend ends when the Time gauge fills (C7) [manual p. 18; core §5.2]', () => {
  it('stays up while the gauge refills, and is gone at the fill, before the next command', () => {
    const e = newEngine(4);
    const who = toNextMenu(e) ?? '';
    e.submit(DEFEND);
    expect(u(e, who).ff7.defending).toBe(true);
    for (let i = 0; i < 500; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') throw new Error('battle ended');
      if (d.kind === 'player-input' && d.actorId === who) break;
      if (!u(e, who).ff7.atb.ready && u(e, who).alive) expect(u(e, who).ff7.defending).toBe(true);
      if (d.kind === 'waiting') e.tick(d.nextEventMs);
      else if (d.kind === 'player-input') e.submit(DEFEND);
    }
    expect(e.inputQueue()).toContain(who);
    expect(u(e, who).ff7.defending).toBe(false);
  });
});
