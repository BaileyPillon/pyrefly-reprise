/**
 * The FFX-2 engine's playback protocol and determinism
 * (`docs/CONTRACTS.md`, "The playback protocol").
 *
 * The four invariants under test:
 * 1. `nextDecision()` never mutates for `'player-input'` or `'battle-over'`;
 * 2. every event carries a monotonic `seq`, and `state().log[i].seq === i`;
 * 3. events are pure JSON — no functions, no class instances;
 * 4. the same seed plus the same command sequence produces the same event
 *    stream, byte for byte.
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { bahamutSetup, bahamutEnemy, bevelleParty, enemy, group } from '../../src/battle/ffx2/fixtures.ts';
import type { BattleEvent, Decision } from '../../src/battle/common/types.ts';

/** Drive a whole battle, always attacking the first legal target. */
function playOut(seed: number, maxSteps = 4000): { engine: FFX2Engine; events: BattleEvent[] } {
  const engine = new FFX2Engine({ minigames: false });
  engine.init(bahamutSetup(seed));
  const events: BattleEvent[] = [];
  for (let i = 0; i < maxSteps; i++) {
    const decision: Decision = engine.nextDecision();
    if (decision.kind === 'battle-over') break;
    if (decision.kind === 'resolved') {
      events.push(...decision.events);
      continue;
    }
    if (decision.kind === 'waiting') {
      events.push(...engine.tick(decision.nextEventMs));
      continue;
    }
    const attack = decision.commands.find((c) => c.command.kind === 'attack');
    const targetId = attack?.validTargets[0];
    events.push(
      ...engine.submit(
        attack && targetId ? { kind: 'attack', targets: [targetId] } : { kind: 'defend', targets: [] },
      ),
    );
  }
  return { engine, events };
}

describe('the playback protocol', () => {
  it('opens on `waiting` when every bar starts empty, and reports a real delay', () => {
    const engine = new FFX2Engine();
    engine.init(bahamutSetup(1));
    const decision = engine.nextDecision();
    expect(decision.kind).toBe('waiting');
    if (decision.kind !== 'waiting') return;
    expect(decision.nextEventMs).toBeGreaterThan(0);
    // Gunner Agi 53 at Lv 24 -> a bar under 5 s. Nobody waits a minute.
    expect(decision.nextEventMs).toBeLessThan(10000);
  });

  it('advances the clock on `tick` and eventually hands over a turn', () => {
    const engine = new FFX2Engine();
    engine.init(bahamutSetup(1));
    let decision = engine.nextDecision();
    let guard = 0;
    while (decision.kind === 'waiting' && guard++ < 50) {
      engine.tick(decision.nextEventMs);
      decision = engine.nextDecision();
    }
    expect(decision.kind).toBe('player-input');
    expect(engine.state().ticks).toBeGreaterThan(0);
  });

  it('is idempotent for `player-input`: calling it twice changes nothing', () => {
    const engine = new FFX2Engine();
    engine.init(bahamutSetup(5));
    let decision = engine.nextDecision();
    while (decision.kind === 'waiting') {
      engine.tick(decision.nextEventMs);
      decision = engine.nextDecision();
    }
    expect(decision.kind).toBe('player-input');

    const before = JSON.stringify(engine.state());
    const again = engine.nextDecision();
    const third = engine.nextDecision();
    expect(JSON.stringify(engine.state())).toBe(before);
    expect(again).toEqual(decision);
    expect(third).toEqual(decision);
  });

  it('is idempotent for `battle-over` too', () => {
    // A boss with 1 HP dies to the first hit that lands.
    const engine = new FFX2Engine({ minigames: false });
    engine.init({
      game: 'ffx2',
      party: bevelleParty(24),
      enemies: group('glass', [enemy('glass', 'Glass', 'idle', { maxHp: 1, hp: 1, agi: 1 })]),
      triggers: [],
      seed: 2,
      condition: 'preemptive',
    });
    for (let i = 0; i < 200; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') { engine.tick(d.nextEventMs); continue; }
      if (d.kind === 'resolved') continue;
      const t = d.commands.find((c) => c.command.kind === 'attack')?.validTargets[0];
      engine.submit(t ? { kind: 'attack', targets: [t] } : { kind: 'defend', targets: [] });
    }
    const first = engine.nextDecision();
    expect(first.kind).toBe('battle-over');
    const snapshot = JSON.stringify(engine.state());
    expect(engine.nextDecision()).toEqual(first);
    expect(JSON.stringify(engine.state())).toBe(snapshot);
  });

  it('never runs the clock past something that needs handling', () => {
    const engine = new FFX2Engine();
    engine.init(bahamutSetup(11));
    // One absurdly long tick stops at the first thing that resolved rather
    // than burning the whole 60 s, so no turn is ever skipped.
    engine.tick(60000);
    expect(engine.state().ticks).toBeLessThan(60 * 3000);

    // Keep ticking and a player turn arrives, never having been jumped over.
    let decision = engine.nextDecision();
    let guard = 0;
    while (decision.kind !== 'player-input' && guard++ < 200) {
      if (decision.kind === 'waiting') engine.tick(decision.nextEventMs);
      else if (decision.kind === 'battle-over') break;
      decision = engine.nextDecision();
    }
    expect(decision.kind).toBe('player-input');
  });
});

describe('the event log', () => {
  it('numbers every event monotonically, with log[i].seq === i', () => {
    const { engine } = playOut(3, 600);
    const log = engine.state().log;
    expect(log.length).toBeGreaterThan(20);
    log.forEach((event, i) => expect(event.seq).toBe(i));
  });

  it('returns exactly the events it appended, in order and contiguously', () => {
    const { engine, events } = playOut(3, 600);
    const log = engine.state().log;
    // `init()` emits the opening `atb` snapshot before the caller starts
    // driving, so the batches begin at seq 1 rather than 0.
    const first = events[0]?.seq ?? 0;
    events.forEach((event, i) => {
      expect(event.seq).toBe(first + i);
      expect(log[first + i]).toBe(event);
    });
  });

  it('emits pure JSON data — no functions, no class instances', () => {
    const { events } = playOut(3, 400);
    const round = JSON.parse(JSON.stringify(events));
    expect(round).toEqual(events);
    for (const event of events) {
      for (const value of Object.values(event)) {
        expect(typeof value).not.toBe('function');
      }
    }
  });

  it('emits `atb` snapshots the HUD can redraw from', () => {
    const { events } = playOut(3, 300);
    const snapshots = events.filter((e) => e.type === 'atb');
    expect(snapshots.length).toBeGreaterThan(0);
    const first = snapshots[0];
    if (first?.type !== 'atb') return;
    expect(first.snapshot.bars).toHaveLength(4); // three girls + Bahamut
    for (const bar of first.snapshot.bars) {
      expect(bar.required).toBeGreaterThan(0);
      expect(bar.fill).toBeGreaterThanOrEqual(0);
      expect(['normal', 'haste', 'slow', 'stop']).toContain(bar.state);
    }
  });
});

describe('determinism', () => {
  it('produces an identical event stream for the same seed and commands', () => {
    const a = playOut(1234, 800);
    const b = playOut(1234, 800);
    expect(JSON.stringify(b.events)).toBe(JSON.stringify(a.events));
    expect(b.engine.state().ticks).toBe(a.engine.state().ticks);
  });

  it('diverges on a different seed', () => {
    const a = playOut(1234, 800);
    const b = playOut(999, 800);
    expect(JSON.stringify(b.events)).not.toBe(JSON.stringify(a.events));
  });

  it('never touches Math.random', () => {
    const original = Math.random;
    let used = false;
    Math.random = () => {
      used = true;
      return original();
    };
    try {
      playOut(77, 300);
    } finally {
      Math.random = original;
    }
    expect(used).toBe(false);
  });
});

describe('battle end', () => {
  it('reports victory and carries `nextGroupId` for a chained encounter', () => {
    const engine = new FFX2Engine({ minigames: false });
    engine.init({
      game: 'ffx2',
      party: bevelleParty(24),
      enemies: group('link-one', [enemy('paper', 'Paper', 'idle', { maxHp: 1, hp: 1, agi: 1 })], {
        nextGroupId: 'link-two',
      }),
      triggers: [],
      seed: 4,
      condition: 'preemptive',
    });
    for (let i = 0; i < 200; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') {
        expect(d.result.outcome).toBe('victory');
        // CONTRACT-CHANGES: the engine reports the link and stops. It never
        // advances the group itself.
        expect(d.result.nextGroupId).toBe('link-two');
        return;
      }
      if (d.kind === 'waiting') { engine.tick(d.nextEventMs); continue; }
      if (d.kind === 'resolved') continue;
      const t = d.commands.find((c) => c.command.kind === 'attack')?.validTargets[0];
      engine.submit(t ? { kind: 'attack', targets: [t] } : { kind: 'defend', targets: [] });
    }
    throw new Error('battle never ended');
  });

  it('omits `nextGroupId` when the formation is the last link', () => {
    const { engine } = playOut(9, 4000);
    const result = engine.state().result;
    if (result) expect(result.nextGroupId).toBeUndefined();
  });

  it('carries HP, MP and statuses into the next link', () => {
    const first = new FFX2Engine({ minigames: false });
    first.init(bahamutSetup(21));
    first.tick(30000);
    const yuna = first.state().combatants['yuna'];
    expect(yuna).toBeDefined();

    const second = new FFX2Engine({
      minigames: false,
      carriedParty: {
        chained: true,
        members: [{ id: 'yuna', hp: 123, mp: 7, statuses: { poison: {
          id: 'poison', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true,
        } } }],
      },
    });
    second.init({ ...bahamutSetup(21), chained: true, enemies: group('b2', [bahamutEnemy()]) });
    const carried = second.state().combatants['yuna'];
    expect(carried?.hp).toBe(123);
    expect(carried?.mp).toBe(7);
    expect(carried?.statuses.poison).toBeDefined();
    expect(second.state().flags['chained']).toBe(true);
  });

  it('clamps HP and MP that arrive above the dressphere the build reverts to (critic round 09 PR-0124)', () => {
    // This is the *other* carry path: `BattleScreenSetup.carryFfx2` rewrites
    // the next link's party build with the raw `hp`/`mp` a girl finished the
    // previous link on, but not `currentDressphere` — whether the worn
    // dressphere itself should carry across a seam is a separate, unsourced
    // question for Bailey (hard rule 6). A build like that lands here as
    // `party.members[].hp/mp` with no `carriedParty` option at all, so it is
    // `buildMember` (`src/battle/ffx2/setup.ts`), not `applyCarriedState`,
    // that has to clamp. Rikku changed Thief (Lv 50 max 123 MP, 1928 max HP
    // [ffx2-vegnagun-shuyin §6.2]) to a dressphere with a higher ceiling
    // mid-link; the build she starts the next link on still reads Thief, so
    // the carried numbers must not outlive its lower maximum the way the live
    // build's "123/106" row did.
    const party = bevelleParty(50);
    party.members[1] = { ...party.members[1], currentDressphere: 'thief', hp: 2600, mp: 219 };
    const engine = new FFX2Engine({ minigames: false });
    engine.init({ ...bahamutSetup(1), party });

    const rikku = engine.state().combatants['rikku'];
    expect(rikku).toBeDefined();
    expect(rikku!.mp).toBeLessThanOrEqual(rikku!.stats.maxMp);
    expect(rikku!.hp).toBeLessThanOrEqual(rikku!.stats.maxHp);
    // Clamped to the maximum, not merely floored at zero.
    expect(rikku!.mp).toBe(rikku!.stats.maxMp);
    expect(rikku!.hp).toBe(rikku!.stats.maxHp);
  });
});

describe('gaugeSnapshot', () => {
  it('draws a shorter runway for a faster dressphere', () => {
    const engine = new FFX2Engine();
    engine.init(bahamutSetup(1));
    const bars = engine.gaugeSnapshot().bars;
    const rikku = bars.find((b) => b.actorId === 'rikku'); // Thief, Agi 60
    const paine = bars.find((b) => b.actorId === 'paine'); // Warrior, Agi 50
    expect(rikku && paine).toBeTruthy();
    expect(rikku!.required).toBeLessThan(paine!.required);
  });
});
