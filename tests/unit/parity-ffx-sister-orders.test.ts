/**
 * The Magus Sisters' target search and order handlers against the game's own runs (re-parity lane FFX-K, the Sisters' orders of 2026-10-15; **FFX only**).
 *
 * Source: `research/re-ffx-zanmato-and-orders.md` Part 2 sections 9 to 15 (branch `re-ffx-zanmato-and-orders`, final decode `f59c4592`). The two fixtures are stratified
 * subsets of that note's proofs (FFX.exe, Steam build 25501027; the game was never run):
 *
 * - `sister_search.json`: 300 of the 24,000 vectors of the target search on the REAL code (0x7A8B40 the usable set and the MP test, 0x7A8AD0 the chance roll with the
 *   standing order, 0x7A8F60 the property-filtered pick), each with the world it ran on (the three sisters' HP, MP, counters, extra word and gauge; 0 to 4 monsters with
 *   distance, Targetable, dead and removed flags), the command's record as the game's lookup returned it, and the answer: the usable mask, the roll, the picked slot, the
 *   stored target mask and every draw's stream.
 * - `sister_orders.json`: 320 of the 24,000 runs of the sixteen order handlers on the game's OWN script VM (20 per event), each with the sister's state, the natives' answers
 *   and the VM's ordered log of every effectful call and the private variables afterwards.
 *
 * The search is replayed through `kernel/sister-search.ts` with a world built from the vector; the handlers through `kernel/sister-orders.ts` and the data of
 * `kernel/sister-chains.ts` with a host that answers like the proof's world (the same rule for the roll, the search as an oracle) and writes the same log.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { abilityOfCommand, SISTER_ABILITY } from '../../src/battle/ffx/adapt/sister-orders.ts';
import { C } from '../../src/battle/ffx/kernel/sister-chains.ts';
import { type OrderHost, type OrderState, runOrder } from '../../src/battle/ffx/kernel/sister-orders.ts';
import { COMMAND_ROWS, NO_TARGET, type SearchChar, type SearchWorld, SEARCH_SLOTS, targetSearch } from '../../src/battle/ffx/kernel/sister-search.ts';
import type { ParityDraw } from './helpers/ffxParityFixture.ts';
import { targetFixture } from './helpers/ffxTargetFixtures.ts';

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// The target search
// ---------------------------------------------------------------------------------------------------------------------------------------------------

interface ChrFields {
  inBattle?: number;
  hp?: number;
  maxHp?: number;
  mp?: number;
  targetable?: number;
  dead?: number;
  removed?: number;
  far?: number;
  group?: number;
  shell?: number;
  protect?: number;
  reflect?: number;
  haste?: number;
  nulTide?: number;
  nulBlaze?: number;
  nulShock?: number;
  nulFrost?: number;
  silence?: number;
  extra?: number;
  gauge?: number;
  gaugeMax?: number;
}

/** The harness's characters are zeroed except what the vector lists; a character's hit points default to 1000 of 1000 (the harness gives every slot that). */
function searchChar(f: ChrFields): SearchChar {
  return {
    inBattle: (f.inBattle ?? 0) !== 0,
    removed: (f.removed ?? 0) !== 0,
    targetable: (f.targetable ?? 0) !== 0,
    dead: (f.dead ?? 0) !== 0,
    far: f.far ?? 0,
    group: f.group ?? 0,
    hp: f.hp ?? 1000,
    maxHp: f.maxHp ?? 1000,
    mp: f.mp ?? 0,
    silence: (f.silence ?? 0) !== 0,
    curse: ((f.extra ?? 0) & 0x400) !== 0,
    gauge: f.gauge ?? 0,
    gaugeMax: f.gaugeMax ?? 0,
    autoLife: (((f.extra ?? 0) >> 9) & 1) !== 0,
    shell: (f.shell ?? 0) !== 0,
    protect: (f.protect ?? 0) !== 0,
    reflect: (f.reflect ?? 0) !== 0,
    haste: (f.haste ?? 0) !== 0,
    nulTide: (f.nulTide ?? 0) !== 0,
    nulBlaze: (f.nulBlaze ?? 0) !== 0,
    nulShock: (f.nulShock ?? 0) !== 0,
    nulFrost: (f.nulFrost ?? 0) !== 0,
  };
}

describe('sister_search.json: the target search on the real code (note section 9)', () => {
  const fx = targetFixture('sister_search');

  it('300 vectors: the usable mask, the roll, the picked slot, the stored mask and every draw\'s stream and place equal the game\'s', () => {
    expect(fx.vectors).toHaveLength(300);
    const seen = { usable0: 0, rollFailed: 0, standingBlocked: 0, none: 0, one: 0, many: 0, group: 0 };
    for (const v of fx.vectors) {
      const i = v.in as { actor: number; cmd: number; T: number; P: number; F: number; C: number; standing: number; chrs: Record<string, ChrFields>; row: { u1a: number; silence: number; mp: number; od: number } };
      const world: Array<SearchChar | undefined> = new Array<SearchChar | undefined>(SEARCH_SLOTS).fill(undefined);
      for (const [slot, f] of Object.entries(i.chrs)) world[Number(slot)] = searchChar(f);
      // The row table is the game's: the vector carries the record the real lookup returned.
      const row = COMMAND_ROWS[i.cmd]!;
      expect([row.u1a, row.silence ? 1 : 0, row.mp, row.od], `vector ${v.id}: the command row of 0x${i.cmd.toString(16)}`).toEqual([i.row.u1a, i.row.silence, i.row.mp, i.row.od]);

      const draws: readonly ParityDraw[] = v.rngDraws ?? [];
      let n = 0;
      const next = (stream: number): number => {
        const d = draws[n];
        if (d === undefined) throw new Error(`vector ${v.id}: the search drew ${n + 1} times; the game drew ${draws.length}`);
        expect(d.stream, `vector ${v.id}: draw ${n}`).toBe(stream);
        n += 1;
        return d.value;
      };
      const r = targetSearch(world as SearchWorld, i.actor, i.cmd, i.T, i.P, i.F, i.C, {
        standing: i.standing,
        draw18: () => next(18),
        pick4: (slots) => slots[next(4) % slots.length] as number,
      });
      const out = v.out as { usable: number; roll: number | null; picked: number; stored: number };
      expect([r.usable, r.rolled === null ? null : r.rolled ? 1 : 0, r.picked, r.stored], `vector ${v.id}`).toEqual([out.usable, out.roll, out.picked, out.stored]);
      expect(n, `vector ${v.id}: draws taken`).toBe(draws.length);

      if (out.usable === 0) seen.usable0++;
      else if (out.roll === 0) {
        seen.rollFailed++;
        if (i.standing !== 0 && i.C >= 0 && i.cmd !== i.standing) seen.standingBlocked++;
      } else if (out.picked === NO_TARGET) seen.none++;
      else if (draws.at(-1)?.stream === 4) seen.many++;
      else seen.one++;
      if ((COMMAND_ROWS[i.cmd]!.u1a >> 2 & 3) === 1) seen.group++;
    }
    // The sample keeps the proof's mix: every kind of outcome is in it.
    expect(seen.usable0).toBeGreaterThan(80);
    expect(seen.rollFailed).toBeGreaterThan(20);
    expect(seen.standingBlocked, 'rolls refused by a standing order for another command').toBeGreaterThan(5);
    expect(seen.none).toBeGreaterThan(10);
    expect(seen.one).toBeGreaterThan(10);
    expect(seen.many, 'picks among several that drew on stream 4').toBeGreaterThan(5);
    expect(seen.group, 'group-type commands (Pray, Ultima, NulAll, the Delta Attack)').toBeGreaterThan(20);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// The handlers
// ---------------------------------------------------------------------------------------------------------------------------------------------------

interface HandlerState {
  M: number;
  hp: number;
  mhp: number;
  mp: number;
  mmp: number;
  stand: number;
  cindy_alive: number;
  cindy_reflect: number;
  last: number;
  flag: number;
  cls: number;
  usable: Record<string, boolean>;
  cands: Record<string, number[]>;
  d18: number[];
  d4: number[];
  lst?: number[];
  cnt?: number;
}

type LogEntry = unknown[];

/** A host that answers the way the proof's world does and writes the same log. */
function replayHost(st: HandlerState): { host: OrderHost; log: LogEntry[]; used: () => [number, number] } {
  const log: LogEntry[] = [];
  let i18 = 0;
  let i4 = 0;
  let stand = st.stand;
  const roll = (a: number, b: number): [number, number | null] => {
    if (b < 0) return [1, null];
    if (a !== 0 && stand !== 0) return [a === stand ? 1 : 0, null];
    const d = (st.d18[i18++] as number) & 0xff;
    return [d < b ? 1 : 0, d];
  };
  const host: OrderHost = {
    roll: (a, b) => {
      const [r, d] = roll(a, b);
      log.push(['roll', a, b, r, d]);
      return r === 1;
    },
    search: (cmd, T, P, F, Ch) => {
      if (st.usable[String(cmd)] === false) {
        log.push(['search', cmd, T, P, F, Ch, 255, 'unusable']);
        return 255;
      }
      const [passed, d] = roll(cmd, Ch);
      let res = 255;
      if (passed === 1) {
        const cands = st.cands[String(cmd)] ?? [];
        if (cands.length === 1) res = cands[0] as number;
        else if (cands.length > 1) res = cands[(st.d4[i4++] as number) % cands.length] as number;
      }
      log.push(['search', cmd, T, P, F, Ch, res, d]);
      return res;
    },
    stand: () => stand,
    setStanding: (v) => {
      stand = v & 0xffff;
      log.push(['stand', v]);
    },
    gain2: (g, m) => void log.push(['gain2', g, m]),
    gain4: (a, b, c, d) => void log.push(['gain4', [a, b, c, d]]),
    perform: (target, cmd) => void log.push(['perform', target, cmd]),
    delta: () => void log.push(['delta']),
  };
  return { host, log, used: () => [i18, i4] };
}

describe('sister_orders.json: the sixteen order handlers on the game\'s script VM (note sections 11 to 14)', () => {
  const fx = targetFixture('sister_orders');

  it('320 runs, 20 of each of the sixteen events: the ordered log of rolls, searches, standing-order writes, gains, performs and the Delta Attack, and the private variables, equal the VM\'s', () => {
    expect(fx.vectors).toHaveLength(320);
    const perClass: Record<string, number> = {};
    let rests = 0;
    let standing = 0;
    let combo = 0;
    let replays = 0;
    for (const v of fx.vectors) {
      const i = v.in as { sister: 'cindy' | 'sandy' | 'mindy'; event: number; st: HandlerState };
      const st = i.st;
      const state: OrderState = {
        m: st.M,
        hp: st.hp,
        maxHp: st.mhp,
        mp: st.mp,
        maxMp: st.mmp,
        cindyAlive: st.cindy_alive !== 0,
        cindyReflect: st.cindy_reflect !== 0,
        last: st.last,
        flag: st.flag,
        cls: st.cls,
        list: [st.lst?.[0] ?? 0, st.lst?.[1] ?? 0],
        count: st.cnt ?? 0,
      };
      const { host, log, used } = replayHost(st);
      runOrder(i.sister, i.event, state, host);
      const out = v.out as { log: LogEntry[]; after: { last: number; flag: number; cls: number; cnt?: number; lst?: number[] } };
      expect(log, `run ${v.id} (${v.class})`).toEqual(out.log);
      const after: Record<string, unknown> = { last: state.last, flag: state.flag, cls: state.cls };
      if (i.sister === 'mindy') {
        after['cnt'] = state.count;
        after['lst'] = state.list;
      }
      expect(after, `run ${v.id} (${v.class}): the private variables`).toEqual(out.after);
      // Every draw the VM's world supplied was used, and no more.
      expect(used(), `run ${v.id}: draws used`).toEqual([st.d18.length, st.d4.length]);

      perClass[v.class] = (perClass[v.class] ?? 0) + 1;
      if (log.some((e) => e[0] === 'perform' && e[2] === C.rest)) rests++;
      if (st.stand !== 0) standing++;
      if (i.sister === 'mindy' && i.event === 13 && log.some((e) => e[0] === 'search' && e[2] === 0x20f && e[5] !== -1)) combo++;
      if (i.sister === 'mindy' && i.event === 14 && log.some((e) => e[0] === 'search' && e[2] === 0x20f && e[5] === -1)) replays++;
    }
    expect(Object.keys(perClass).sort()).toEqual(['cindy:13', 'cindy:14', 'cindy:15', 'cindy:16', 'cindy:17', 'cindy:18', 'mindy:13', 'mindy:14', 'mindy:15', 'mindy:18', 'mindy:20', 'sandy:13', 'sandy:14', 'sandy:15', 'sandy:18', 'sandy:19']);
    expect(Object.values(perClass).every((n) => n === 20)).toBe(true);
    expect(rests, 'runs that ended with the rest command').toBeGreaterThan(80);
    expect(standing, 'runs that began with a standing order').toBeGreaterThan(60);
    expect(combo, "runs of Mindy's Reflect combo").toBeGreaterThan(3);
    expect(replays, "runs that replayed Mindy's stored list").toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// The data the engine maps the game's ids onto
// ---------------------------------------------------------------------------------------------------------------------------------------------------

describe('the engine\'s abilities for the commands the orders perform', () => {
  const byId = new Map(ALL_ABILITIES.map((a) => [a.id, a]));

  it('every command the handlers can perform has an ability, and its command record is that command (the Attack is each sister\'s own)', () => {
    for (const [cmd, id] of Object.entries(SISTER_ABILITY)) {
      const def = byId.get(id);
      expect(def, `0x${Number(cmd).toString(16)} -> ${id}`).toBeDefined();
      expect(def!.record?.id, `${id}'s record`).toBe(Number(cmd));
    }
    for (const sister of ['cindy', 'sandy', 'mindy'] as const) expect(byId.get(abilityOfCommand(C.attack, sister)), `${sister}'s Attack`).toBeDefined();
    // The 33 commands of the search table are these, the Attack, the rest command and the Delta Attack.
    const ours = new Set([...Object.keys(SISTER_ABILITY).map(Number), C.attack, C.rest, C.delta]);
    expect([...Object.keys(COMMAND_ROWS).map(Number)].sort((a, b) => a - b)).toEqual([...ours].sort((a, b) => a - b));
  });

  it('the MP cost the search tests is the engine data\'s MP cost for every spell (two independent sources agree)', () => {
    for (const [cmd, id] of Object.entries(SISTER_ABILITY)) {
      const row = COMMAND_ROWS[Number(cmd)]!;
      expect(byId.get(id)!.mpCost, `${id}`).toBe(row.mp);
    }
  });

  it('the player\'s Delta Attack row follows the game\'s record 0x30EA: Strength (formula 1), power 10, 6 hits and no element as recorded, and a GROUP-type command (the whole stored group is its target)', () => {
    const records = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx/command_records.json', import.meta.url)), 'utf8')) as { columns: string[]; rows: number[][] };
    const record = records.rows.find((r) => r[0] === C.delta)!;
    const col = (name: string): number => record[records.columns.indexOf(name)]!;
    const def = byId.get('delta-attack')!;
    expect(def.record?.id, 'the row carries the record 0x30EA').toBe(C.delta);
    expect([col('formula'), col('power'), col('hits'), col('element')], 'the game\'s record').toEqual([1, 10, 6, 0]);
    expect([def.formula, def.power, def.hits, def.element], 'our row, the same numbers').toEqual(['strength', 10, 6, ['none']]);
    // The command row (read from the install's command table): type bits of `Cmd+0x1a` 1 = group, reach 1, the opposite side; and the engine row keeps the named group whole.
    const u1a = COMMAND_ROWS[C.delta]!.u1a;
    expect([(u1a >> 2) & 3, (u1a >> 7) & 3, (u1a >> 1) & 1], 'group type, reach 1, opposite side').toEqual([1, 1, 1]);
    expect(def.extra?.['groupTarget'], 'the executor keeps the whole list the order names').toBe(true);
  });
});
