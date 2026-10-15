/**
 * **Engine-level parity, FFX-2 Confusion** (re-parity RC9 lane X2-H; **FFX-2 only**).
 *
 * `parity-ffx2-confusion-pick.test.ts` proves the kernel against the game's own machine code (460 stratified worlds of the 20,000 the harness ran, 0 mismatches). This file proves
 * the WIRING on the engine's own path (`nextDecision`, the Active `tick`, `performCommand`), against an oracle written from the rules in the test's own words: it imports no
 * kernel, no adapter and no menu code, only the generator (`makeFfx2Rng`) to replay the stream the game would draw from. The rules (`docs/handoff/re-parity-rc9-x2-confusion.md`):
 * a Confused girl is never asked for a command; at her ready moment she lists the commands of her main window that a Confused character may pick (a Gunner: her Attack, and the
 * Item command when the party holds something usable), one draw of HER stream (slot + 20) picks one, a second picks the item, and the target is one draw of stream 4 among
 * everyone in the battle (a row with the team-split bit takes both sides, herself included) or, for a multiple-target row, one draw of stream 5 picks a side.
 *
 * Mutation-checked by hand (scratch, one line at a time, each caught here): the pick not wired (`confused: false`); `awaitsPlayerInput` ignoring Confusion; the menu not closed
 * when Confusion lands; the first draw on the wrong stream; the item index off by one; the single-target draw on stream 5; the team split dropped (allies and herself left out).
 */

import { describe, expect, it } from 'vitest';
import { makeFfx2Rng } from '../../src/battle/ffx2/adapt/streams.ts';
import type { BattleEvent, StatusId, StatusInstance } from '../../src/battle/common/types.ts';
import { Ffx2AtbState } from '../../src/battle/ffx2/kernel/atb-gauge.ts';
import { runAutopilot } from '../../src/battle/ffx2/engineHooks.ts';
import { LOADOUTS, board, type Probe } from './helpers/ffx2AutoRig.ts';

const confusion = (): StatusInstance => ({ id: 'confuse' as StatusId, turnsRemaining: null, ticksRemaining: 100_000_000, charges: null, stacks: 1, permanent: false });

interface Start {
  state: ReturnType<Probe['streams']['saveState']>;
  alive: Map<string, boolean>;
  events: BattleEvent[];
  start: { command: { kind: string; id?: string; targets: string[] }; abilityName?: string; targets: string[] };
}

/** A board that isolates the girls' turns: the girls cannot fall and Paragon is Stopped (Genesis and its Itch would overwrite or dispel the Confusion under test). Test rig only; no data is changed. */
function tough(e: Probe, freezeEnemy = true): Probe {
  for (const id of ['yuna', 'rikku', 'paine']) {
    const u = e.unit(id);
    u.stats.maxHp = 99999;
    u.hp = 99999;
  }
  if (freezeEnemy) e.unit('paragon').statuses['stop'] = { id: 'stop' as StatusId, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
  return e;
}

/** Play until `who` begins an action, answering every other girl's menu with a pass; null when the battle ends first. */
function toAction(e: Probe, who: string, maxCalls = 4000): Start | null {
  for (let i = 0; i < maxCalls; i++) {
    const state = e.streams.saveState();
    const alive = new Map(e.all.map((u) => [u.id, u.alive && !u.removed]));
    const d = e.nextDecision();
    if (d.kind === 'battle-over') return null;
    if (d.kind === 'waiting') {
      e.tick(d.nextEventMs);
      continue;
    }
    if (d.kind === 'player-input') {
      if (d.actorId === who) throw new Error(`${who} is Confused and was handed a menu`);
      e.submit({ kind: 'defend', targets: [] });
      continue;
    }
    const start = d.events.find((x) => x.type === 'action-start' && (x as { actorId?: string }).actorId === who);
    if (start !== undefined) return { state, alive, events: d.events, start: start as never };
  }
  return null;
}

/** The party stock in the order the build lists it, with the game's id and target flags of each (the data's rows). */
const STOCK = [
  { item: 'x2-megalixir', game: 0x2009, cursor: 0x35 },
  { item: 'x2-light-curtain', game: 0x2032, cursor: 0x35 },
  { item: 'x2-lunar-curtain', game: 0x2031, cursor: 0x35 },
  { item: 'x2-remedy', game: 0x200f, cursor: 0x31 },
] as const;

/** The unit ids by slot in Chapter XIII's board (the girls 0 to 2, Paragon 15). */
const SLOT_OF: Record<string, number> = { yuna: 0, rikku: 1, paine: 2, paragon: 15 };

/** The oracle: what the game does for a Gunner (Attack and Item as candidates) from the stream state before the call. */
function oracle(seed: number, s: Start): { item: string | null; targets: string[]; draws: number[] } {
  const rng = makeFfx2Rng(seed);
  rng.restoreState(s.state);
  const draw = (stream: number): number => rng.on(stream).int(0, 0x7fffffff);
  const streams: number[] = [];
  const take = (stream: number): number => {
    streams.push(stream);
    return draw(stream);
  };
  const candidates = ['attack', 'item'];
  const picked = candidates[take(20) % candidates.length];
  let cursor = 0x433;
  let item: string | null = null;
  if (picked === 'item') {
    const chosen = STOCK[take(20) % STOCK.length] as (typeof STOCK)[number];
    item = chosen.item;
    cursor = chosen.cursor;
  }
  // the rows' 0x20 bit: everyone in the battle, in ascending slot order, the dead left out
  const everyone = Object.entries(SLOT_OF).filter(([id]) => s.alive.get(id) === true).sort((a, b) => a[1] - b[1]);
  const type = (cursor >> 2) & 3;
  let targets: string[];
  if (type === 0) {
    targets = everyone.length > 1 ? [(everyone[take(4) % everyone.length] as [string, number])[0]] : everyone.map(([id]) => id);
  } else {
    const girls = everyone.filter(([, slot]) => slot < 15).map(([id]) => id);
    const monsters = everyone.filter(([, slot]) => slot >= 15).map(([id]) => id);
    const halves = [girls, monsters].filter((h) => h.length > 0);
    targets = (halves[take(5) % halves.length] as string[]) ?? [];
  }
  return { item, targets, draws: streams };
}

describe('a Confused girl on the engine\'s own path', () => {
  it('is never offered a menu, and acts by herself with the command and the target the game\'s rule picks (150 seeds, the oracle replays her stream)', () => {
    const seen = { attack: 0, item: 0, multi: 0, self: 0, enemy: 0, ally: 0, games: 0 };
    for (let seed = 1; seed <= 150; seed++) {
      const e = tough(board({ yuna: LOADOUTS['plain'] as never }, seed));
      e.unit('yuna').statuses['confuse'] = confusion();
      const got = toAction(e, 'yuna');
      if (got === null) continue;
      seen.games++;
      const want = oracle(seed, got);
      const c = got.start.command;
      expect(c.kind === 'item' ? c.id : null, `seed ${seed} item`).toBe(want.item);
      expect(c.kind, `seed ${seed} kind`).toBe(want.item === null ? 'attack' : 'item');
      expect([...c.targets].sort(), `seed ${seed} targets`).toEqual([...want.targets].sort());
      if (want.item === null) seen.attack++;
      else seen.item++;
      if (want.targets.length > 1) seen.multi++;
      if (want.targets.length === 1 && want.targets[0] === 'yuna') seen.self++;
      if (want.targets.length === 1 && want.targets[0] === 'paragon') seen.enemy++;
      if (want.targets.length === 1 && (want.targets[0] === 'rikku' || want.targets[0] === 'paine')) seen.ally++;
    }
    expect(seen.games).toBeGreaterThan(110);
    // the oracle's own spread: both commands, both kinds of aim, every side
    for (const [k, n] of Object.entries(seen)) expect(n, `branch ${k}`).toBeGreaterThan(0);
  });

  it('draws only what the game draws, in its order: her own stream (slot + 20) for the command and the item, then 4 for a single target or 5 for a multiple one', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const e = tough(board({ yuna: LOADOUTS['plain'] as never }, seed));
      e.unit('yuna').statuses['confuse'] = confusion();
      const draws: number[] = [];
      (e.streams as unknown as { tap: (s: number, v: number) => void }).tap = (s) => draws.push(s);
      const got = toAction(e, 'yuna');
      if (got === null) continue;
      const want = oracle(seed, got);
      // the draws of the call that began her action come first in that call; find them as the last run of the oracle's length ending at the pick
      const at = draws.length;
      expect(at).toBeGreaterThanOrEqual(want.draws.length);
      const head = draws.join(',');
      expect(head.includes(want.draws.join(',')), `seed ${seed}`).toBe(true);
    }
  });

  it('the Active clock path (tick with throughInput) resolves her too, with no menu', () => {
    let acted = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const e = tough(board({ yuna: LOADOUTS['plain'] as never }, seed));
      e.unit('yuna').statuses['confuse'] = confusion();
      let mine = false;
      for (let i = 0; i < 3000 && !mine; i++) {
        const d = e.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') {
          expect(d.actorId).not.toBe('yuna');
          e.tick(40, { throughInput: true });
          e.submit({ kind: 'defend', targets: [] });
          continue;
        }
        const events = d.kind === 'waiting' ? e.tick(Math.max(1, d.nextEventMs), { throughInput: true }) : d.kind === 'resolved' ? d.events : [];
        mine = events.some((x) => x.type === 'action-start' && (x as { actorId?: string }).actorId === 'yuna');
      }
      if (mine) acted++;
    }
    expect(acted).toBeGreaterThan(20);
  });

  it('Confusion landing on an open menu closes it, and the girl is handed to the autopilot (state 7) the next step', () => {
    const e = tough(board({ yuna: LOADOUTS['plain'] as never }, 5));
    const yuna = e.unit('yuna');
    for (let i = 0; i < 4000 && yuna.gauge.state !== Ffx2AtbState.WaitCommand; i++) e.steps(1);
    expect(yuna.gauge.state).toBe(Ffx2AtbState.WaitCommand);
    yuna.statuses['confuse'] = confusion();
    e.steps(1);
    expect(yuna.gauge.state).not.toBe(Ffx2AtbState.WaitCommand);
    for (let i = 0; i < 5 && yuna.gauge.state !== Ffx2AtbState.Confused; i++) e.steps(1);
    expect(yuna.gauge.state).toBe(Ffx2AtbState.Confused);
    expect(e.inputValid('yuna')).toBe(false);
  });

  it('when the pick queues nothing (no candidate: a Songstress with an empty stock) she stays idle, spends no draw, begins no turn, and asks again next step', () => {
    const e = tough(board({ yuna: { ...(LOADOUTS['plain'] as never as Record<string, unknown>), dressphere: 'songstress' } as never }, 9));
    for (const key of Object.keys(e.state().flags)) if (key.startsWith('inventory:')) e.state().flags[key] = 0;
    const yuna = e.unit('yuna');
    yuna.statuses['confuse'] = confusion();
    const draws: number[] = [];
    (e.streams as unknown as { tap: (s: number, v: number) => void }).tap = (s) => draws.push(s);
    for (let i = 0; i < 4000 && yuna.gauge.state !== Ffx2AtbState.Confused; i++) e.steps(1);
    expect(yuna.gauge.state).toBe(Ffx2AtbState.Confused);
    const before = draws.filter((s) => s === 20).length;
    let turns = 0;
    for (let i = 0; i < 12; i++) {
      const d = e.nextDecision();
      if (d.kind === 'resolved') turns += d.events.filter((x) => x.type === 'turn-start' && (x as { actorId?: string }).actorId === 'yuna').length;
      e.steps(1);
    }
    expect(turns).toBe(0);
    expect(draws.filter((s) => s === 20).length).toBe(before);
    expect(yuna.alive).toBe(true);
  });

  it('a Confused monster keeps running its script (its lists are unread), and a Confused girl is not a monster', () => {
    const e = tough(board({ yuna: LOADOUTS['plain'] as never }, 3), false);
    const paragon = e.unit('paragon');
    paragon.statuses['confuse'] = confusion();
    let acted = 0;
    const count = (events: readonly BattleEvent[]): number => events.filter((x) => x.type === 'action-start' && (x as { actorId?: string }).actorId === 'paragon').length;
    for (let i = 0; i < 4000 && acted === 0; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') {
        acted += count(e.tick(d.nextEventMs));
        continue;
      }
      if (d.kind === 'player-input') {
        e.submit({ kind: 'defend', targets: [] });
        continue;
      }
      acted += count(d.events);
    }
    expect(acted).toBeGreaterThan(0);
  });

  it('the autopilot is exported for the engine core and refuses nothing about Berserk: a Berserked girl still swings her Attack', () => {
    expect(typeof runAutopilot).toBe('function');
    const e = tough(board({ yuna: LOADOUTS['plain'] as never }, 4));
    e.unit('yuna').statuses['berserk'] = { ...confusion(), id: 'berserk' as StatusId };
    const got = toAction(e, 'yuna');
    expect(got?.start.command.kind).toBe('attack');
  });
});
