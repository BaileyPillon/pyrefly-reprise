/**
 * The rig of the engine-level tests of the Magus Sisters' orders (re-parity lane FFX-K, the Sisters' orders of 2026-10-15; **FFX only**): one engine on a TEST build that owns
 * the Sisters, a scenario that is applied to the engine AND handed to the independent oracle (`helpers/ffxSisterOracle.ts`), and one order played from the sister's turn with
 * every draw of the game's generator tapped. Used by `parity-ffx-engine-k-orders.test.ts`.
 */

import { expect } from 'vitest';
import type { BattleEvent, EnemyDef, StatusId } from '../../../src/battle/common/types.ts';
import { enemy, stats } from '../ffx-fixtures.test.ts';
import { Rig, SUMMON, build, sisters, starts } from './ffxKRig.ts';
import { Draws, type OMonster, type OSister, type OState, type OWorld, Oracle, type Who } from './ffxSisterOracle.ts';

export type { Who };

/** The ability id of each order event. */
export const ORDER_ID: Readonly<Record<number, string>> = {
  13: 'sister-order-free', 14: 'sister-order-repeat', 15: 'sister-order-attack', 16: 'sister-order-cindy-spells', 17: 'sister-order-cindy-support', 18: 'sister-order-combine',
  19: 'sister-order-sandy-support', 20: 'sister-order-mindy-drain',
};
/** The game's order command of each event (0x3124 is 13). */
export const ORDER_COMMAND = (event: number): number => 0x3124 + (event - 13);

/** The engine's ability id of each command a handler performs (written here from the data's own names, not imported from the adapter). */
const ABILITY: Readonly<Record<number, string>> = {
  0x3019: 'pray', 0x3020: 'lancet', 0x302b: 'cure', 0x302c: 'cura', 0x302d: 'curaga', 0x3034: 'life', 0x3035: 'full-life-spell', 0x3036: 'haste', 0x303a: 'shell', 0x303b: 'protect',
  0x303c: 'reflect', 0x3040: 'auto-life', 0x3045: 'fira', 0x3046: 'blizzara', 0x3047: 'thundara', 0x3048: 'watera', 0x3049: 'firaga', 0x304a: 'blizzaga', 0x304b: 'thundaga',
  0x304c: 'waterga', 0x304d: 'bio', 0x304f: 'death', 0x3050: 'drain', 0x3051: 'osmose-spell', 0x3052: 'flare', 0x3053: 'ultima', 0x30e5: 'camisade', 0x30e7: 'razzia',
  0x30e9: 'passado', 0x30ea: 'delta-attack', 0x312d: 'nul-all-aeon',
};
export const abilityFor = (cmd: number, who: Who): string => (cmd === 0x3000 ? `${who}-attack` : ABILITY[cmd] ?? `?${cmd.toString(16)}`);

/** The Sisters' stats in the rig (`sisters()` of `ffxKRig.ts`). */
export const MAX: Readonly<Record<Who, { hp: number; mp: number }>> = { cindy: { hp: 6000, mp: 200 }, sandy: { hp: 5000, mp: 100 }, mindy: { hp: 3000, mp: 300 } };

/** What a scenario says about one sister: anything left out is as the rig starts her (full HP and MP, no status). */
export interface SisterSetup {
  hp?: number;
  mp?: number;
  dead?: boolean;
  silence?: boolean;
  curse?: boolean;
  autoLife?: boolean;
  shell?: boolean;
  protect?: boolean;
  haste?: boolean;
  reflect?: boolean;
  allNul?: boolean;
  /** Her gauge in the bar's points, 0 to 20. */
  gauge?: number;
}

export interface Scenario {
  who: Who;
  /** The order's script event: 13 free choice, 14 One more time, 15 Fight!, 16 Go go, 17 Help, 18 Combine, 19 Defense!, 20 Are you all right? */
  event: number;
  seed?: number;
  /** The acting sister's motivation (default 40). */
  m?: number;
  sisters?: Partial<Record<Who, SisterSetup>>;
  /** The monsters, in formation order (default two plain ones). */
  monsters?: Array<{ distance?: number; untargetable?: boolean; dead?: boolean }>;
  /** The standing order when her turn begins (default none). */
  stand?: number;
  /** Her private variables when her turn begins. */
  memory?: Partial<{ last: number; cls: number; lst: [number, number]; cnt: number }>;
  /** Everyone's gauge at the summon, in points of the bar (default 0). */
  gauge?: number;
}

/** The engine's runtime pieces the tests read and write. */
interface SistersRt {
  order: number;
  motivation: Record<string, number>;
  menu: { actorId: string; orders: number[] } | null;
  memory: Record<string, { last: number; flag: number; cls: number; list: [number, number]; count: number }>;
  pair: Record<string, { f714: number; f715: number; b726: number; b727: number; b728: number; b729: number }>;
}
export const sistersRt = (rig: Rig): SistersRt => (rig.engine as unknown as { ctx: { rt: { sisters: SistersRt } } }).ctx.rt.sisters;

const monsterDef = (i: number, m: { distance?: number; untargetable?: boolean }): EnemyDef =>
  enemy({
    id: `m${i}`,
    slot: i,
    stats: stats({ hp: 99999, maxHp: 99999, str: 1, agi: 1 }),
    immunities: { ko: 255 }, // a Death spell must not thin the field: every bounce then has the same number of foes to land on
    flags: { ...(m.distance !== undefined ? { battleDistance: m.distance } : {}), ...(m.untargetable ? { untargetable: true } : {}) },
  });

/** A played order: the engine's log and draws, and the oracle that ran from the same scenario and the same draws. */
export interface Played {
  rig: Rig;
  events: BattleEvent[];
  taps: Array<{ stream: number; value: number }>;
  oracle: Oracle;
  state: OState;
  /** The sister's own action-starts after the order's own, as ability ids. */
  performed: string[];
  /** The oracle's performed commands (the rest command left out), as ability ids. */
  want: string[];
  /** The raw draws of streams 18 and 4 during the order. */
  d18: number[];
  d4: number[];
  world: OWorld;
}

function apply(rig: Rig, id: Who, s: SisterSetup): void {
  const c = rig.fighter(id);
  if (s.hp !== undefined) c.hp = s.hp;
  if (s.mp !== undefined) c.mp = s.mp;
  if (s.dead) rig.knockOut(id);
  const status = (on: boolean | undefined, ...ids: StatusId[]): void => {
    if (on) for (const st of ids) rig.inflict(id, st);
  };
  status(s.silence, 'silence');
  status(s.curse, 'curse');
  status(s.autoLife, 'auto-life');
  status(s.shell, 'shell');
  status(s.protect, 'protect');
  status(s.haste, 'haste');
  status(s.reflect, 'reflect');
  status(s.allNul, 'nultide', 'nulblaze', 'nulshock', 'nulfrost');
  if (s.gauge !== undefined) c.overdrive!.gauge = s.gauge * 5;
}

/** Play one order of `sc.who` from the start of her turn. */
export function playOrder(sc: Scenario): Played {
  const monsters = sc.monsters ?? [{}, {}];
  const rig = new Rig(build({ aeons: sisters((sc.gauge ?? 0) * 5), sisters: { motivation: { cindy: 40, sandy: 40, mindy: 40 } } }), monsters.map((m, i) => monsterDef(i, m)), sc.seed ?? 1);
  rig.until('yuna');
  rig.submit(SUMMON('cindy'));
  rig.until(sc.who);
  monsters.forEach((m, i) => {
    if (m.dead) rig.knockOut(`m${i}`);
  });
  for (const id of ['cindy', 'sandy', 'mindy'] as const) apply(rig, id, sc.sisters?.[id] ?? {});
  const rt = sistersRt(rig);
  rt.motivation[sc.who] = sc.m ?? 40;
  rt.order = sc.stand ?? 0;
  const mem = rt.memory[sc.who]!;
  Object.assign(mem, { last: sc.memory?.last ?? mem.last, cls: sc.memory?.cls ?? mem.cls });
  if (sc.memory?.lst !== undefined) mem.list = [...sc.memory.lst];
  if (sc.memory?.cnt !== undefined) mem.count = sc.memory.cnt;
  // The order is the test's to choose: make sure the menu of this turn offered it (the menu builder has its own tests).
  const command = ORDER_COMMAND(sc.event);
  if (!rt.menu!.orders.includes(command)) rt.menu!.orders.push(command);

  // The oracle's world and state, from the same scenario (not read back from the engine).
  const sis = (id: Who): OSister => {
    const s = sc.sisters?.[id] ?? {};
    return {
      hp: s.dead ? 0 : s.hp ?? MAX[id].hp, maxHp: MAX[id].hp, mp: s.mp ?? MAX[id].mp, dead: s.dead === true, silence: s.silence === true, curse: s.curse === true,
      gauge: s.gauge ?? sc.gauge ?? 0, autoLife: s.autoLife === true, shell: s.shell === true, protect: s.protect === true, haste: s.haste === true, reflect: s.reflect === true,
      allNul: s.allNul === true,
    };
  };
  const world: OWorld = {
    sisters: { cindy: sis('cindy'), sandy: sis('sandy'), mindy: sis('mindy') },
    monsters: monsters.map((m, i): OMonster => ({ slot: 0x14 + i, distance: m.distance ?? 0, targetable: !m.untargetable, dead: m.dead === true })),
  };
  const me = world.sisters[sc.who];
  const cindy = world.sisters.cindy;
  const state: OState = {
    who: sc.who, m: sc.m ?? 40, hp: me.hp, maxHp: me.maxHp, mp: me.mp, maxMp: MAX[sc.who].mp, cindyAlive: cindy.dead !== true, cindyReflect: cindy.reflect === true,
    last: mem.last, flag: mem.flag, cls: mem.cls, lst: [mem.list[0], mem.list[1]], cnt: mem.count, stand: sc.stand ?? 0,
  };

  const from = rig.taps.length;
  const before = rig.events.length;
  rig.submit({ kind: 'ability', id: ORDER_ID[sc.event]!, targets: [] });
  const events = rig.events.slice(before);
  const taps = rig.taps.slice(from);
  const d18 = taps.filter((t) => t.stream === 18).map((t) => t.value);
  const d4 = taps.filter((t) => t.stream === 4).map((t) => t.value);
  const oracle = new Oracle(world, state, new Draws(d18, d4));
  oracle.run(sc.event);
  const performed = starts(events).filter(([a]) => a === sc.who).map(([, n]) => n).slice(1);
  const want = oracle.fx.flatMap((e) => (e.kind === 'perform' && e.cmd !== 0x312c ? [abilityFor(e.cmd, sc.who)] : []));
  return { rig, events, taps, oracle, state, performed, want, d18, d4, world };
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const seeds = (n: number, from = 1): number[] => Array.from({ length: n }, (_, i) => from + i);

/** For each action the order carried out (the rest command last, if any), did it deal HP damage? (Which column of a four-argument pair the end-of-action step applies.) */
function damagedIn(p: Played): boolean[] {
  const out: boolean[] = [];
  let current = -1;
  for (const e of p.events) {
    if (e.type === 'action-start' && e.actorId === p.state.who && e.abilityId !== undefined) {
      out.push(false);
      current = out.length - 1;
    } else if (e.type === 'action-end' && e.actorId === p.state.who) current = -1;
    else if (e.type === 'damage' && current >= 0 && e.amount > 0) out[current] = true;
  }
  const rests = p.oracle.fx.filter((f) => f.kind === 'perform' && f.cmd === 0x312c).length;
  return [...out, ...Array<boolean>(rests).fill(false)];
}

/**
 * Check one played order against its oracle: the commands, the draws, the standing order, the private variables, the motivation and the gauge. The pair the handler left is
 * rebuilt from the oracle's calls (a two-argument gain is suppressed while an order stands); each action applies it, in the column its effect chooses. The gauge is checked
 * through the order's own `overdrive-gauge` events (cause 'sister-order'): an aeon's own attack also fills its gauge, cause 'aeon-attack', the game's rule for every aeon,
 * already in the engine and not part of the orders; the scenarios keep the gauge below the bar's 20 points so the clamp never bites (a case of its own pins it).
 */
export function agree(p: Played, label: string, m0: number): void {
  const who = p.state.who;
  expect(p.performed, `${label}: the commands carried out`).toEqual(p.want);
  expect(p.d18.length, `${label}: stream-18 draws`).toBe(p.oracle.draws.i18);
  expect(p.d4.length, `${label}: stream-4 draws`).toBe(p.oracle.draws.i4);
  const rt = sistersRt(p.rig);
  const mem = rt.memory[who]!;
  expect([mem.last, mem.flag, mem.cls, mem.list, mem.count], `${label}: her private variables`).toEqual([p.state.last, p.state.flag, p.state.cls, p.state.lst, p.state.cnt]);
  expect(rt.order, `${label}: the standing order`).toBe(p.state.stand);

  let standing = 0;
  let pair: [number, number, number, number] | null = null;
  for (const f of p.oracle.fx) {
    if (f.kind === 'stand') standing = f.value & 0xffff;
    else if (f.kind === 'gain2' && standing === 0) pair = [f.g, f.m, f.g, f.m];
    else if (f.kind === 'gain4') pair = f.g;
  }
  let motivation = m0;
  let gaugeDelta = 0;
  const hit = damagedIn(p);
  if (pair !== null) {
    p.oracle.fx.filter((f) => f.kind === 'perform').forEach((_, i) => {
      const col = hit[i] === true ? 0 : 2;
      gaugeDelta += pair![col]!;
      motivation = clamp(motivation + pair![col + 1]!, 0, 100);
    });
  }
  expect(rt.motivation[who], `${label}: her motivation`).toBe(motivation);
  const fromOrder = p.events.filter((e) => e.type === 'overdrive-gauge' && e.who === who && e.cause === 'sister-order');
  expect(fromOrder.reduce((sum, e) => sum + (e.type === 'overdrive-gauge' ? e.to - e.from : 0), 0) / 5, `${label}: her gauge, the pair's part`).toBe(gaugeDelta);
}

/** Play `make(seed)` for every seed, check each against its oracle, return what was played. */
export function sweep(label: string, make: (seed: number) => Scenario, over = seeds(24)): Played[] {
  return over.map((seed) => {
    const sc = make(seed);
    const p = playOrder({ ...sc, seed });
    agree(p, `${label} seed ${seed}`, sc.m ?? 40);
    return p;
  });
}
