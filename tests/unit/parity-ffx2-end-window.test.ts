/**
 * The FFX-2 battle-end commit window in the engine (re-parity RC8, lane X2-K, rows XK2 and XK-petrify; **FFX-2 only**): the end is evaluated every step but committed
 * only when every queued command has run out; a revive before the commit cancels it; an ejected girl is alive but not in the battle (a defeat, as before: result 3 is not
 * turned into an escape); enemies that are all Petrified count as defeated; a part never gates; nothing new starts inside the window.
 *
 * The kernel is proved against the game's own functions in `parity-ffx2-battle-end.test.ts`. Here the ENGINE is held to the rules of the note (FFX2-G10 sections 10.1
 * and 10.2): the expectations are written down from those rules, and the evaluation is checked against a small independent restatement over every combination of
 * states, not against the code under test.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleState, Command, Decision } from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  STEP_MS,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { enemy, group, setup } from '../../src/battle/ffx2/fixtures.ts';
import type { AiScript, Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { registerAiScript } from '../../src/battle/ffx2/ai/index.ts';
import { applyHpDelta } from '../../src/battle/ffx2/resolve-hp.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
import { battleOutcome, emptyState } from '../../src/battle/ffx2/results.ts';
import { Ffx2AtbState } from '../../src/battle/ffx2/kernel/atb-gauge.ts';
import { END_DRAIN_CAP_STEPS } from '../../src/battle/ffx2/end-window.ts';
import * as data from '../../src/data/ffx2/index.ts';

const PD = 'x2-phoenix-down';
const KEY = `inventory:${PD}`;

registerAiScript({ id: 'zz-window-quiet', decide: () => null } as AiScript);

interface Battle {
  engine: FFX2Engine;
  units: Record<string, Ffx2Unit>;
  flags: Record<string, unknown>;
  state: BattleState;
}

/** Three girls and the named monsters (`parts` are marked as parts after the build). */
function battle(opts: { foes?: string[]; parts?: string[]; stock?: Record<string, number>; seed?: number } = {}): Battle {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false,
  });
  const foes = (opts.foes ?? ['m0']).map((id, i) => enemy(id, id.toUpperCase(), 'zz-window-quiet', { agi: 30, hp: 9_999_999, maxHp: 9_999_999 }, { slot: i, immunityFlags: [], flags: {} }));
  const s = setup(group('zz-window', foes), { seed: opts.seed ?? 1 });
  const stock = opts.stock ?? { [PD]: 1 };
  engine.init({ ...s, party: { ...s.party, inventory: Object.entries(stock).map(([itemId, count]) => ({ itemId, count })) } });
  const state = engine.state() as BattleState;
  const units = state.combatants as Record<string, Ffx2Unit>;
  for (const id of opts.parts ?? []) (units[id] as Ffx2Unit).flags.isPart = true;
  return { engine, units, flags: state.flags as Record<string, unknown>, state };
}

const ctxOf = (b: Battle): Parameters<typeof applyHpDelta>[0] => (b.engine as unknown as { resolveCtx(): Parameters<typeof applyHpDelta>[0] }).resolveCtx();
const kill = (b: Battle, id: string, by?: string): void => applyHpDelta(ctxOf(b), b.units[id] as Ffx2Unit, (b.units[id] as Ffx2Unit).hp, by);
const stats = (b: Battle): { opened: number; lapsed: number; committed: number; waitedSteps: number; inFlight: { party: number; enemy: number }; capped: number; lastCode: number } =>
  (b.engine as unknown as { endWindowStats(): ReturnType<typeof stats> }).endWindowStats();

type Input = Extract<Decision, { kind: 'player-input' }>;

function nextMenu(engine: FFX2Engine, maxLoops = 20_000): Input {
  for (let i = 0; i < maxLoops; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'battle-over') throw new Error('the battle ended before a menu opened');
  }
  throw new Error('no menu opened');
}

/** Put a cast on the purple bar of a unit by hand (the way the engine's own tests do), `steps` logic steps from firing at the normal speed. */
function charge(u: Ffx2Unit, command: Command, steps: number): void {
  const units = steps * 95;
  u.atb.charging = { commandRef: command, remainingTicks: units, totalTicks: units };
  u.pendingCommand = command;
  u.gauge.state = Ffx2AtbState.Executing;
}

/** Play on (no menus answered but a defend) until the battle is over or `maxLoops` decisions have passed; returns every event seen. */
function playOut(b: Battle, maxLoops = 5000): BattleEvent[] {
  const seen: BattleEvent[] = [];
  for (let i = 0; i < maxLoops; i++) {
    const d = b.engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'resolved') seen.push(...d.events);
    else if (d.kind === 'waiting') seen.push(...b.engine.tick(Math.max(1, d.nextEventMs)));
    else seen.push(...b.engine.submit({ kind: 'defend', targets: [] } as Command));
  }
  return seen;
}

const types = (events: readonly BattleEvent[]): string[] => events.map((e) => e.type);

// ---------------------------------------------------------------------------------------------------------------------------------------
// The evaluation: an independent restatement of FFX2-G10 10.1 over every combination

type Mood = 'ok' | 'ko' | 'petrify' | 'out';

function setMood(u: Ffx2Unit, mood: Mood): void {
  u.alive = mood !== 'ko';
  u.hp = mood === 'ko' ? 0 : u.stats.maxHp;
  delete u.statuses['ko'];
  delete u.statuses['petrify'];
  u.removed = mood === 'out';
  if (mood === 'ko') applyStatus(u, { status: 'ko', chance: 255, duration: 0 });
  if (mood === 'petrify') applyStatus(u, { status: 'petrify', chance: 255, duration: 0 });
}

/** The note's rules, restated: 'defeat' | 'victory' | null. A part is never present. */
function oracle(girls: Mood[], foes: Mood[], partMood: Mood, badEnding: boolean): 'defeat' | 'victory' | null {
  if (badEnding) return 'defeat';
  const aliveGirls = girls.filter((m) => m === 'ok' || m === 'out').length; // not dead, not Death, not Petrify
  const inBattle = girls.filter((m) => m === 'ok').length;
  if (aliveGirls === 0) return 'defeat'; // result 1
  if (inBattle === 0) return 'defeat'; // result 3: alive but nobody in the battle (this engine has always ended that as a defeat)
  void partMood; // the part is not present: whatever it is, it does not hold the fight
  // every monster that is in the battle and not dead must be Petrified for the battle to be won
  return foes.every((m) => m === 'ko' || m === 'out' || m === 'petrify') ? 'victory' : null;
}

describe('XK-petrify and XK2: the evaluation, over every combination of states', () => {
  it('matches the restated rules for 3 girls x 2 monsters x 1 part in every state (2,048 worlds), with and without the fail clock', () => {
    const b = battle({ foes: ['m0', 'm1', 'p0'], parts: ['p0'] });
    const girls = ['yuna', 'rikku', 'paine'].map((id) => b.units[id] as Ffx2Unit);
    const foes = ['m0', 'm1'].map((id) => b.units[id] as Ffx2Unit);
    const part = b.units['p0'] as Ffx2Unit;
    const moods: Mood[] = ['ok', 'ko', 'petrify', 'out'];
    let worlds = 0;
    const seen = new Set<string>();
    for (const g0 of moods) for (const g1 of moods) for (const g2 of moods) {
      for (const f0 of moods) for (const f1 of moods) for (const pm of moods) {
        [g0, g1, g2].forEach((m, i) => setMood(girls[i] as Ffx2Unit, m));
        [f0, f1].forEach((m, i) => setMood(foes[i] as Ffx2Unit, m));
        setMood(part, pm);
        for (const bad of [false, true]) {
          const state = emptyState();
          state.flags['badEnding'] = bad;
          const want = oracle([g0, g1, g2], [f0, f1], pm, bad);
          const got = battleOutcome(Object.values(b.units), state);
          if (got !== want) throw new Error(`girls ${[g0, g1, g2]} foes ${[f0, f1]} part ${pm} bad ${bad}: engine ${got}, rules ${want}`);
          seen.add(String(got));
          worlds += 1;
        }
      }
    }
    expect(worlds).toBe(2 * 4 ** 6);
    expect([...seen].sort()).toEqual(['defeat', 'null', 'victory']);
  });

  it('XK-petrify: a Petrified last enemy ends the fight; a Petrified enemy beside a standing one does not; a Petrified part never gates', () => {
    const b = battle({ foes: ['m0', 'm1', 'p0'], parts: ['p0'] });
    const state = emptyState();
    const all = (): Ffx2Unit[] => Object.values(b.units);
    expect(battleOutcome(all(), state)).toBeNull();
    setMood(b.units['m0'] as Ffx2Unit, 'petrify');
    expect(battleOutcome(all(), state)).toBeNull(); // m1 still stands
    setMood(b.units['m1'] as Ffx2Unit, 'petrify');
    expect(battleOutcome(all(), state)).toBe('victory'); // the part is alive and unpetrified: parts never gate
    setMood(b.units['m1'] as Ffx2Unit, 'ok');
    setMood(b.units['m0'] as Ffx2Unit, 'ko');
    expect(battleOutcome(all(), state)).toBeNull();
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
// The window

describe('XK2: the commit window', () => {
  it('nothing in flight: the end commits at once, in the same call (the old behaviour, unchanged)', () => {
    const b = battle();
    kill(b, 'm0', 'yuna');
    const d = b.engine.nextDecision();
    expect(d.kind).toBe('battle-over');
    expect(b.state.result?.outcome).toBe('victory');
    expect(stats(b)).toMatchObject({ opened: 1, lapsed: 0, committed: 1, waitedSteps: 0, lastCode: 2 });
  });

  it('the last enemy falls with a girl\'s Phoenix Down in flight: the cast resolves first (Paine rises), then the victory', () => {
    const b = battle();
    kill(b, 'paine');
    const d = nextMenu(b.engine);
    b.engine.submit({ kind: 'item', id: PD, targets: ['paine'] });
    const caster = b.units[d.actorId] as Ffx2Unit;
    expect(caster.atb.charging).not.toBeNull();
    kill(b, 'm0', d.actorId);
    const before = b.state.ticks;
    // The note: the first non-zero evaluation closes the menus and opens a window; the commit waits for the queue.
    const first = b.engine.nextDecision();
    expect(first.kind).toBe('waiting');
    expect(b.state.result).toBeNull();
    expect(stats(b)).toMatchObject({ opened: 1, committed: 0, inFlight: { party: 1, enemy: 0 } });
    const events = playOut(b);
    const kinds = types(events);
    expect(kinds).toContain('revive');
    expect(kinds.indexOf('revive')).toBeLessThan(kinds.indexOf('victory')); // the cast resolved, then the end was committed
    expect(b.state.result?.outcome).toBe('victory');
    expect((b.units['paine'] as Ffx2Unit).alive).toBe(true);
    expect(b.flags[KEY]).toBe(0); // spent: the cast fired
    expect(stats(b)).toMatchObject({ opened: 1, lapsed: 0, committed: 1 });
    expect(stats(b).waitedSteps).toBeGreaterThan(20);
    expect(b.state.ticks - before).toBeGreaterThan(20);
  });

  it('inside the window nothing new starts: no menu is offered, no monster is polled', () => {
    const b = battle({ foes: ['m0'] });
    kill(b, 'paine');
    const d = nextMenu(b.engine);
    b.engine.submit({ kind: 'item', id: PD, targets: ['paine'] });
    kill(b, 'm0', d.actorId);
    const seen = new Set<string>();
    for (let i = 0; i < 4000; i++) {
      const dec = b.engine.nextDecision();
      seen.add(dec.kind);
      if (dec.kind === 'battle-over') break;
      if (dec.kind === 'waiting') b.engine.tick(Math.max(1, dec.nextEventMs));
    }
    expect(seen.has('player-input')).toBe(false);
    expect(seen.has('resolved')).toBe(false);
    expect(seen.has('battle-over')).toBe(true);
  });

  it('a defeat waits for an enemy\'s cast in flight, then commits (result 1 is a defeat)', () => {
    const b = battle();
    charge(b.units['m0'] as Ffx2Unit, { kind: 'attack', targets: ['yuna'] }, 40);
    for (const id of ['yuna', 'rikku', 'paine']) kill(b, id, 'm0');
    expect(b.engine.nextDecision().kind).toBe('waiting');
    expect(stats(b)).toMatchObject({ opened: 1, committed: 0, inFlight: { party: 0, enemy: 1 } });
    playOut(b);
    expect(b.state.result?.outcome).toBe('defeat');
    expect(stats(b)).toMatchObject({ committed: 1, lastCode: 1 });
    expect(stats(b).waitedSteps).toBeGreaterThanOrEqual(30);
  });

  it('a revive that lands inside the window CANCELS the end: a part\'s Phoenix Down raises the last enemy and the fight goes on', () => {
    const b = battle({ foes: ['a', 'p'], parts: ['p'] });
    charge(b.units['p'] as Ffx2Unit, { kind: 'ability', id: 'x2-item-phoenix-down', targets: ['a'] }, 30);
    kill(b, 'a', 'yuna');
    expect(b.engine.nextDecision().kind).toBe('waiting'); // all non-part enemies are down: the window opens, the part's cast holds it
    expect(stats(b).opened).toBe(1);
    for (let i = 0; i < 400 && stats(b).lapsed === 0; i++) {
      const d = b.engine.nextDecision();
      if (d.kind === 'waiting') b.engine.tick(Math.max(1, d.nextEventMs));
      else if (d.kind === 'battle-over') break;
    }
    expect(stats(b)).toMatchObject({ opened: 1, lapsed: 1, committed: 0 });
    expect((b.units['a'] as Ffx2Unit).alive).toBe(true);
    expect(b.state.result).toBeNull();
    // ... and it can end again later: knock the foe down once more, nothing in flight now.
    kill(b, 'a', 'yuna');
    expect(b.engine.nextDecision().kind).toBe('battle-over');
    expect(b.state.result?.outcome).toBe('victory');
    expect(stats(b)).toMatchObject({ opened: 2, lapsed: 1, committed: 1 });
  });

  it('an owner who is asleep, petrified or Stopped does not hold the window; the cast she never finished is dropped at the commit and its item comes back', () => {
    for (const status of ['sleep', 'stop', 'petrify'] as const) {
      const b = battle({ stock: { [PD]: 1 } });
      kill(b, 'paine');
      const d = nextMenu(b.engine);
      b.engine.submit({ kind: 'item', id: PD, targets: ['paine'] });
      const caster = b.units[d.actorId] as Ffx2Unit;
      expect(b.flags[KEY]).toBe(0);
      applyStatus(caster, { status, chance: 255, duration: status === 'petrify' ? 0 : 200 });
      kill(b, 'm0', d.actorId);
      expect(b.engine.nextDecision().kind, status).toBe('battle-over');
      expect(stats(b), status).toMatchObject({ opened: 1, committed: 1, waitedSteps: 0 });
      expect(caster.atb.charging, status).toBeNull();
      expect(b.flags[KEY], status).toBe(1); // the commit drops what never started, with a refund
    }
  });

  it('Petrified enemies end the fight, through the window: the last one turns to stone and the battle is won', () => {
    const b = battle({ foes: ['m0', 'm1'] });
    kill(b, 'm0', 'yuna');
    applyStatus(b.units['m1'] as Ffx2Unit, { status: 'petrify', chance: 255, duration: 0 });
    expect(b.engine.nextDecision().kind).toBe('battle-over');
    expect(b.state.result?.outcome).toBe('victory');
  });

  it('a party with no one left in the battle but a girl alive (ejected) ends as before: a defeat, with the game\'s result code 3 recorded', () => {
    const b = battle();
    (b.units['yuna'] as Ffx2Unit).removed = true;
    kill(b, 'rikku');
    kill(b, 'paine');
    expect(b.engine.nextDecision().kind).toBe('battle-over');
    expect(b.state.result?.outcome).toBe('defeat');
    expect(stats(b).lastCode).toBe(3);
  });

  it('the story\'s fail clock (badEnding) still ends a fight as a defeat', () => {
    const b = battle();
    b.flags['badEnding'] = true;
    expect(b.engine.nextDecision().kind).toBe('battle-over');
    expect(b.state.result?.outcome).toBe('defeat');
    expect(stats(b).lastCode).toBe(1);
  });

  it('a window that cannot drain is closed by the safety cap, which the stats count', () => {
    const b = battle();
    charge(b.units['m0'] as Ffx2Unit, { kind: 'attack', targets: ['yuna'] }, 10_000_000);
    for (const id of ['yuna', 'rikku', 'paine']) kill(b, id, 'm0');
    expect(b.engine.nextDecision().kind).toBe('waiting');
    for (let i = 0; i < 100 && b.state.result === null; i++) b.engine.tick((END_DRAIN_CAP_STEPS / 20) * STEP_MS);
    expect(b.state.result?.outcome).toBe('defeat');
    expect(stats(b).capped).toBe(1);
  });

  it('the window spends no random number', () => {
    const b = battle();
    const streams = (b.engine as unknown as { rng: { states: ArrayLike<bigint | number> } }).rng.states;
    kill(b, 'm0', 'yuna');
    const before = Array.from(streams);
    b.engine.nextDecision();
    expect(Array.from(streams)).toEqual(before);
  });
});
