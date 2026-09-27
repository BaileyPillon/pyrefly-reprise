/**
 * Guard Scorpion's script, run through the engine (AGENTS.md rule 3):
 * the fixed 8-turn cycle, Search Scope then the attack on that target, the
 * attack choice, the tail on the turn counter, Tail Laser answering every
 * hostile action while the tail is up, the death counter, and the warning lines.
 * FF7 only. "gs" is `research/ff7-guard-scorpion.md`, "core" `research/ff7-battle-core.md`.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, Command } from '../../src/battle/common/types.ts';
import { GUARD_SCORPION_HINTS, hintCase, type Ff7Engine } from '../../src/battle/ff7/index.ts';
import { buildWith, DEFEND, newEngine, ofType, playUntil, toNextMenu, u } from './helpers/ff7.ts';

const BOSS = 'guard-scorpion';

/** The boss's turns in order: the action it took, or 'pass'. */
function bossTurns(log: readonly BattleEvent[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < log.length; i++) {
    const ev = log[i];
    if (ev?.type !== 'turn-start' || ev.actorId !== BOSS) continue;
    const next = log[i + 1];
    out.push(next?.type === 'action-start' && next.actorId === BOSS ? (next.abilityId ?? '?') : 'pass');
  }
  return out;
}

/** Defend with everyone until the boss has taken `n` turns. */
function defendFor(e: Ff7Engine, n: number): void {
  playUntil(e, () => DEFEND, () => bossTurns(e.state().log).length >= n);
}

/** Play to the boss's first Raise Tail, defending; the next menu is open when this returns. */
function toTailUp(e: Ff7Engine): string {
  playUntil(e, () => DEFEND, () => u(e, BOSS).ff7.formIndex === 1);
  const who = toNextMenu(e);
  if (!who) throw new Error('battle ended');
  return who;
}

describe('the 8-turn cycle [gs §5.2]', () => {
  it('Search Scope, attack, Search Scope, attack, Raise Tail, wait, wait, Drop Tail, repeat, on every seed', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const e = newEngine(seed);
      defendFor(e, 17);
      const turns = bossTurns(e.state().log).slice(0, 17);
      const shape = turns.map((t) => (t === 'rifle' || t === 'scorpion-tail' ? 'attack' : t));
      const cycle = ['search-scope', 'attack', 'search-scope', 'attack', 'raise-tail', 'pass', 'pass', 'drop-tail'];
      expect(shape, `seed ${seed}`).toEqual([...cycle, ...cycle, 'search-scope']);
    }
  });

  it('the attack hits the target Search Scope locked on to [gs §5.1]', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const e = newEngine(seed);
      defendFor(e, 4);
      const log = e.state().log;
      const locks = ofType(log, 'message').filter((m) => m.ff7?.kind === 'lock-on');
      const attacks = ofType(log, 'action-start').filter((a) => a.abilityId === 'rifle' || a.abilityId === 'scorpion-tail');
      expect(locks[0]?.text).toBe('Locked On Target');
      locks.slice(0, 2).forEach((m, i) => expect(attacks[i]?.targets).toEqual([m.ff7?.kind === 'lock-on' ? m.ff7.targetId : '']));
    }
  });

  it('at HP >= 400 Rifle about 2/3 and Scorpion Tail about 1/3 [gs §5.2]', () => {
    let rifle = 0;
    let tail = 0;
    for (let seed = 1; seed <= 150; seed++) {
      const e = newEngine(seed);
      defendFor(e, 4);
      for (const t of bossTurns(e.state().log)) {
        if (t === 'rifle') rifle++;
        if (t === 'scorpion-tail') tail++;
      }
    }
    const share = tail / (rifle + tail);
    expect(share).toBeGreaterThan(0.26);
    expect(share).toBeLessThan(0.41);
  });

  it('below half HP (399) it always uses Scorpion Tail [gs §5.1]', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const e = newEngine(seed);
      u(e, BOSS).hp = 399;
      defendFor(e, 4);
      const attacks = bossTurns(e.state().log).filter((t) => t === 'rifle' || t === 'scorpion-tail');
      expect(attacks, `seed ${seed}`).toEqual(['scorpion-tail', 'scorpion-tail']);
    }
  });

  it('the tail is on the turn counter, never on HP [gs §5.3]: it rises on turn 5 at full HP and at 50 HP', () => {
    for (const hp of [800, 50]) {
      const e = newEngine(7);
      u(e, BOSS).hp = hp;
      defendFor(e, 5);
      expect(bossTurns(e.state().log)[4]).toBe('raise-tail');
    }
  });

  it("if Search Scope's target falls before the attack, it attacks a living one [gs §5.6 G7, our estimate]", () => {
    const e = newEngine(3);
    defendFor(e, 1);
    const lock = ofType(e.state().log, 'message').find((m) => m.ff7?.kind === 'lock-on');
    const target = lock?.ff7?.kind === 'lock-on' ? lock.ff7.targetId : '';
    const other = target === 'cloud' ? 'barret' : 'cloud';
    const c = u(e, target);
    c.hp = 0;
    c.alive = false;
    playUntil(e, () => DEFEND, () => bossTurns(e.state().log).length >= 2);
    const attack = ofType(e.state().log, 'action-start').find((a) => a.abilityId === 'rifle' || a.abilityId === 'scorpion-tail');
    expect(attack?.targets).toEqual([other]);
  });
});

describe('the raised tail [gs §2.1, §5.5]', () => {
  it('Raise Tail changes form: Def 255 and MDf 384 halve Attack and Bolt (20 to 22, 44 to 48) [core §14]', () => {
    const e = newEngine(5);
    let who = toTailUp(e);
    const bolt = { kind: 'ability', id: 'bolt', targets: [BOSS] } as Command;
    while (who !== 'cloud') {
      e.submit(DEFEND);
      who = toNextMenu(e) ?? '';
    }
    const dmg = ofType(e.submit(bolt), 'damage').find((d) => d.targetId === BOSS);
    expect(dmg?.amount).toBeGreaterThanOrEqual(44);
    expect(dmg?.amount).toBeLessThanOrEqual(48);
    expect(ofType(e.state().log, 'form-change')[0]).toMatchObject({ enemyId: BOSS, formIndex: 1, spriteKey: 'guard-scorpion-tail-up' });
  });

  it('every hostile action while the tail is up is answered by one Tail Laser on the whole party, 100%', () => {
    const full = buildWith((b) => b.members.forEach((m) => (m.limit.gauge = 255)));
    const cmds: Record<string, Command> = {
      attack: { kind: 'attack', targets: [BOSS] },
      bolt: { kind: 'ability', id: 'bolt', targets: [BOSS] },
      ice: { kind: 'ability', id: 'ice', targets: [BOSS] },
      braver: { kind: 'limit', id: 'braver', targets: [BOSS] },
    };
    for (const [name, cmd] of Object.entries(cmds)) {
      for (let seed = 1; seed <= 5; seed++) {
        const e = newEngine(seed, {}, name === 'braver' ? full : undefined);
        let who = toTailUp(e);
        while (who !== 'cloud') {
          e.submit(DEFEND);
          who = toNextMenu(e) ?? '';
        }
        const out = e.submit(cmd);
        const counters = ofType(out, 'counter');
        expect(counters, `${name} seed ${seed}`).toHaveLength(1);
        expect(counters[0]).toMatchObject({ actorId: BOSS, targetId: 'cloud', abilityId: 'tail-laser', cause: 'script' });
        const laser = out.slice(out.indexOf(counters[0] as BattleEvent));
        // Both are targeted: a damage or a miss (Lucky Evade, core §3.1) each.
        const touched = [...ofType(laser, 'damage').filter((d) => d.sourceId === BOSS), ...ofType(laser, 'miss')].map((h) => h.targetId);
        expect(touched.sort()).toEqual(['barret', 'cloud']);
        const hits = ofType(laser, 'damage').filter((d) => d.sourceId === BOSS && !d.crit);
        // Front row, split x2/3: 72 to 77 each; 35 to 38 on a member still Defending [gs §4 table].
        for (const h of hits) {
          const [lo, hi] = u(e, h.targetId).ff7.defending ? [35, 38] : [72, 77];
          expect(h.amount >= lo && h.amount <= hi, `${h.targetId} ${h.amount}`).toBe(true);
        }
        // The counter never touches the boss's own gauge [core §12, our estimate].
        expect(ofType(laser, 'turn-start')).toHaveLength(0);
      }
    }
  });

  it('no Tail Laser while the tail is down, nor for Defend, healing or items while it is up', () => {
    const e = newEngine(4);
    playUntil(e, (who) => (u(e, BOSS).ff7.formIndex === 1 ? (who === 'barret' ? { kind: 'ability', id: 'cure', targets: ['cloud'] } : DEFEND) : { kind: 'attack', targets: [BOSS] }), () => bossTurns(e.state().log).length >= 9);
    const lasers = ofType(e.state().log, 'counter');
    expect(lasers).toHaveLength(0);
  });

  it('a missed attack still sets it off [gs §5.5 G6, our estimate]', () => {
    const blind = buildWith((b) => {
      const c = b.members.find((m) => m.id === 'cloud');
      if (c) c.weapon = { ...c.weapon, atPct: 0 }; // Hit% 4: nearly always a miss
    });
    const e = newEngine(8, {}, blind);
    let who = toTailUp(e);
    let out: BattleEvent[] = [];
    for (let tries = 0; tries < 6; tries++) {
      while (who !== 'cloud') {
        e.submit(DEFEND);
        who = toNextMenu(e) ?? '';
      }
      out = e.submit({ kind: 'attack', targets: [BOSS] });
      if (ofType(out, 'miss').length > 0) break;
      who = toNextMenu(e) ?? '';
    }
    expect(ofType(out, 'miss')).toHaveLength(1);
    expect(ofType(out, 'counter')).toHaveLength(1);
  });

  it('a killing blow does not trigger Tail Laser: the death counter drops the tail, then victory [gs §5.5]', () => {
    const e = newEngine(6);
    let who = toTailUp(e);
    while (who !== 'cloud') {
      e.submit(DEFEND);
      who = toNextMenu(e) ?? '';
    }
    u(e, BOSS).hp = 1;
    const out = e.submit({ kind: 'attack', targets: [BOSS] });
    expect(out.map((ev) => ev.type)).toEqual(
      expect.arrayContaining(['ko', 'counter', 'form-change', 'victory']),
    );
    const counter = ofType(out, 'counter')[0];
    expect(counter?.abilityId).toBe('drop-tail');
    expect(ofType(out, 'damage').filter((d) => d.sourceId === BOSS)).toHaveLength(0);
    expect(ofType(out, 'form-change')[0]?.formIndex).toBe(0);
  });
});

describe('the warning lines [gs §7.1, verbatim]', () => {
  function lines(party?: Parameters<typeof newEngine>[2]) {
    const e = newEngine(2, {}, party);
    defendFor(e, 13);
    return ofType(e.state().log, 'message').filter((m) => m.ff7?.kind === 'hint');
  }

  it('both alive: Cloud warns Barret by name, once per battle (the second raise says nothing)', () => {
    const got = lines();
    expect(got.map((m) => m.text)).toEqual(['Barret, be careful!', "Attack while it's tail's up!", "It's gonna counterattack with its laser."]);
    expect(got.every((m) => m.kind === 'story' && m.ff7?.kind === 'hint' && m.ff7.speakerId === 'cloud' && m.ff7.hintCase === 'both-alive')).toBe(true);
  });

  it('Cloud alone and Barret alone get their own lines', () => {
    const noBarret = buildWith((b) => {
      const m = b.members.find((x) => x.id === 'barret');
      if (m) m.hp = 0;
    });
    const noCloud = buildWith((b) => {
      const m = b.members.find((x) => x.id === 'cloud');
      if (m) m.hp = 0;
    });
    expect(lines(noBarret).map((m) => m.text)).toEqual([...GUARD_SCORPION_HINTS['cloud-only'].lines]);
    const b = lines(noCloud);
    expect(b.map((m) => m.text)).toEqual([...GUARD_SCORPION_HINTS['barret-only'].lines]);
    expect(b[0]?.ff7).toMatchObject({ speakerId: 'barret', hintCase: 'barret-only' });
  });

  it('who is alive picks the case', () => {
    expect(hintCase(true, true)).toBe('both-alive');
    expect(hintCase(true, false)).toBe('cloud-only');
    expect(hintCase(false, true)).toBe('barret-only');
    expect(hintCase(false, false)).toBeNull();
  });
});
