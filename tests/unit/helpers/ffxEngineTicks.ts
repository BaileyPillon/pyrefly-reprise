/**
 * Rig for `parity-ffx-engine-ticks.test.ts` (re-parity W2; **FFX only**): generated battle fields written in the GAME's terms
 * (character slots, HP, the permanent word's Zombie / Poison / Threaten bits, thirteen counters, the stances and Doom in the extra
 * word, each holder's Regen tick counter, the Threaten pairs), the engine's combatants built from them, and the oracle that runs the
 * tick kernels (`kernel/turn-ticks.ts`) on the same field by an independent route.
 *
 * Nothing here imports `src/battle/ffx/adapt/`: the slot table comes from `ffxEngineCtb.ts` (typed out again there), and the
 * reading of an engine fact as a kernel input is written below on its own.
 */

import { SeededRng } from '../../../src/battle/common/rng.ts';
import type { FFXCombatant, StatusId, StatusInstance } from '../../../src/battle/common/types.ts';
import {
  type TickChr,
  doomTick,
  endOfTurnTick,
  poisonMarked,
  poisonTick,
  releaseThreaten,
  startOfTurnTick,
} from '../../../src/battle/ffx/kernel/turn-ticks.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import { type Field, type FieldMember, contextOfField, randomField } from './ffxEngineCtb.ts';

export { contextOfField };

const TEMPORAL: readonly StatusId[] = ['sleep', 'silence', 'darkness', 'shell', 'protect', 'reflect', 'nultide', 'nulblaze', 'nulshock', 'nulfrost', 'regen', 'haste', 'slow'];
/** The extra statuses a tick situation uses, with their bits. */
const EXTRAS: ReadonlyArray<readonly [StatusId, number]> = [
  ['scan', 0x1], ['shield', 0x40], ['boost', 0x80], ['curse', 0x400], ['defend', 0x800], ['guard', 0x1000], ['sentinel', 0x2000], ['doom', 0x4000],
];

/** One character's status facts, in the game's terms. */
export interface TickSpec {
  hp: number;
  maxHp: number;
  zombie: boolean;
  poison: boolean;
  /** Thirteen counters: 0 off, 1 to 253, 254 until removed, 255 permanent. */
  counters: number[];
  extra: number;
  autoExtra: number;
  doom: number;
  /** An enemy's Poison byte; a party member's and an aeon's is 25. */
  poisonPercent: number;
}

export interface TickSituation {
  field: Field;
  specs: Map<string, TickSpec>;
  /** Who takes the turn. */
  actor: string;
  /** A Threaten pair: the user and the target. */
  pair: { user: string; target: string } | null;
  /** The action's results were applied (a normal action) rather than a passed turn. */
  resultsApplied: boolean;
}

const pickOf = <T,>(rng: SeededRng, xs: readonly T[]): T => rng.pick(xs);
const chance = (rng: SeededRng, p: number): boolean => rng.next() < p;

/** Is the member on the field for the tick kernels: present in the friendly side (an aeon alone while one is out) or an enemy, and not removed. */
export function onTheField(field: Field, m: FieldMember): boolean {
  if (m.removed) return false;
  if (m.side === 'party') return field.aeonOut === null;
  if (m.side === 'aeon') return field.aeonOut === m.id;
  return true;
}

/** A random tick situation on a random field. */
export function randomTickSituation(rng: SeededRng): TickSituation {
  const field = randomField(rng);
  const specs = new Map<string, TickSpec>();
  for (const m of field.members) {
    const maxHp = rng.int(300, 9999);
    const counters = new Array<number>(13).fill(0);
    for (let t = 0; t < 13; t++) {
      if (!chance(rng, t === 10 ? 0.3 : 0.15)) continue;
      counters[t] = t >= 6 && t <= 9 ? pickOf(rng, [1, 2, 3, 255]) : pickOf(rng, [1, 1, 2, 3, 5, 10, 99, 253, 254, 255]);
    }
    if (m.haste > 0) counters[11] = m.haste;
    if (m.slow > 0) counters[12] = m.slow;
    if ((counters[11] as number) !== 0 && (counters[12] as number) !== 0) counters[12] = 0;
    let extra = 0;
    for (const [, bit] of EXTRAS) if (chance(rng, 0.2)) extra |= bit;
    let autoExtra = 0;
    for (const [, bit] of EXTRAS) if ((extra & bit) !== 0 && chance(rng, 0.2)) autoExtra |= bit;
    specs.set(m.id, {
      hp: m.dead ? 0 : chance(rng, 0.15) ? rng.int(1, 300) : rng.int(1, maxHp),
      maxHp,
      zombie: chance(rng, 0.2),
      poison: chance(rng, 0.25),
      counters,
      extra,
      autoExtra,
      doom: pickOf(rng, [0, 1, 1, 2, 3, 5]),
      poisonPercent: m.side === 'enemy' ? pickOf(rng, [2, 5, 10, 25, 50]) : 25,
    });
  }
  const live = field.members.filter((m) => !m.dead && !m.petrified && onTheField(field, m));
  // The turn is taken by somebody who can take one: on the field, alive, not Petrified. (A field with nobody is made one.)
  if (live.length === 0) {
    const first = field.members[0] as FieldMember;
    first.dead = false;
    first.petrified = false;
    first.removed = false;
    if (first.side === 'party') field.aeonOut = null;
    live.push(first);
    specs.get(first.id)!.hp = Math.max(1, specs.get(first.id)!.hp);
  }
  const actor = pickOf(rng, live).id;
  let pair: TickSituation['pair'] = null;
  if (live.length >= 2 && chance(rng, 0.4)) {
    const user = pickOf(rng, live);
    const target = pickOf(rng, live.filter((m) => m.id !== user.id));
    pair = { user: user.id, target: target.id };
  }
  return { field, specs, actor, pair, resultsApplied: chance(rng, 0.7) };
}

function instance(id: StatusId, over: Partial<StatusInstance> = {}): StatusInstance {
  return { id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false, ...over };
}

/** Put the situation's statuses and HP on the engine's combatants. */
export function applySpecs(ctx: Ctx, byId: Map<string, FFXCombatant>, sit: TickSituation): void {
  for (const m of sit.field.members) {
    const c = byId.get(m.id) as FFXCombatant;
    const s = sit.specs.get(m.id) as TickSpec;
    c.stats.maxHp = s.maxHp;
    c.hp = m.dead ? 0 : s.hp;
    c.statuses = {};
    if (m.dead) c.statuses['ko'] = instance('ko', { turnsRemaining: null });
    if (m.petrified) c.statuses['petrify'] = instance('petrify');
    if (s.zombie) c.statuses['zombie'] = instance('zombie');
    if (s.poison) c.statuses['poison'] = instance('poison');
    TEMPORAL.forEach((status, t) => {
      const v = s.counters[t] as number;
      if (v === 0) return;
      const nul = t >= 6 && t <= 9;
      if (v === 255) c.statuses[status] = instance(status, nul ? { permanent: true, charges: null, turnsRemaining: null } : { permanent: true, turnsRemaining: 255 });
      else c.statuses[status] = instance(status, nul ? { charges: v, turnsRemaining: null } : { turnsRemaining: v });
    });
    for (const [status, bit] of EXTRAS) {
      if ((s.extra & bit) === 0) continue;
      if (status === 'doom') c.statuses[status] = instance(status, { turnsRemaining: s.doom });
      else c.statuses[status] = instance(status, (s.autoExtra & bit) !== 0 ? { permanent: true, turnsRemaining: 255 } : {});
    }
    if (m.side === 'enemy') {
      c.enemy = {
        rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0x7fffffff, drops: [] },
        forms: [],
        doomTurns: 5,
        poisonTickPercent: s.poisonPercent,
      } as unknown as FFXCombatant['enemy'];
    }
  }
  if (sit.pair) {
    const target = byId.get(sit.pair.target) as FFXCombatant;
    target.statuses['threaten'] = instance('threaten', { sourceId: sit.pair.user });
  }
  void ctx;
}

// ---------------------------------------------------------------------------------------------------------- what is compared

/** One character after the ticks, in the game's terms (counters and stances only for a character who is still alive). */
export interface Look {
  hp: number;
  alive: boolean;
  regenTicks: number;
  counters: number[] | null;
  stances: number | null;
  threatened: boolean;
  doom: number | null;
}

const STANCE_BITS = 0x800 | 0x1000 | 0x2000 | 0x40 | 0x80;

/** What the engine left. */
export function looksOfEngine(ctx: Ctx, byId: Map<string, FFXCombatant>, sit: TickSituation): Record<string, Look> {
  const out: Record<string, Look> = {};
  for (const m of sit.field.members) {
    const c = byId.get(m.id) as FFXCombatant;
    const alive = c.alive && c.statuses['ko'] === undefined;
    const counters = TEMPORAL.map((status, t) => {
      const inst = c.statuses[status];
      if (!inst) return 0;
      if (inst.permanent) return 255;
      const value = t >= 6 && t <= 9 ? (inst.charges ?? 1) : (inst.turnsRemaining ?? 254);
      // A status still on the combatant with nothing left to count is not "off": a counter that reached 0 must have ended it.
      return value === 0 ? -1 : value;
    });
    let stances = 0;
    for (const [status, bit] of EXTRAS) if ((STANCE_BITS & bit) !== 0 && c.statuses[status]) stances |= bit;
    out[m.id] = {
      hp: c.hp,
      alive,
      regenTicks: ctx.rt.actors.get(m.id)!.regenTicks,
      counters: alive ? counters : null,
      stances: alive ? stances : null,
      threatened: c.statuses['threaten'] !== undefined,
      doom: alive ? (c.statuses['doom']?.turnsRemaining ?? null) : null,
    };
  }
  return out;
}

/** The kernels' field for a situation: 31 slots, the Threaten pair written the way a landed Threaten leaves it. */
export function oracleChrs(sit: TickSituation): TickChr[] {
  const chrs: TickChr[] = Array.from({ length: 31 }, () => ({
    inBattle: false, dead: false, petrified: false, silent: false, reentered: false, hp: 0, maxHp: 0, perm: 0,
    counters: new Array<number>(13).fill(0), extra: 0, autoExtra: 0, tickCounter: 0, threatenedBy: 0xff, threatening: 0xff, doomCounter: 0, poisonPercent: 0,
  }));
  for (const m of sit.field.members) {
    const s = sit.specs.get(m.id) as TickSpec;
    chrs[m.slot] = {
      inBattle: onTheField(sit.field, m),
      dead: m.dead,
      petrified: m.petrified,
      silent: false,
      reentered: false,
      hp: m.dead ? 0 : s.hp,
      maxHp: s.maxHp,
      perm: (s.zombie ? 0x2 : 0) | (s.poison ? 0x8 : 0) | (m.petrified ? 0x4 : 0) | (m.dead ? 0x1 : 0),
      counters: [...s.counters],
      extra: s.extra,
      autoExtra: s.autoExtra,
      tickCounter: m.regenTicks,
      threatenedBy: 0xff,
      threatening: 0xff,
      doomCounter: s.doom,
      poisonPercent: s.poisonPercent,
    };
  }
  if (sit.pair) {
    const user = sit.field.members.find((m) => m.id === sit.pair!.user)!;
    const target = sit.field.members.find((m) => m.id === sit.pair!.target)!;
    (chrs[target.slot] as TickChr).perm |= 0x800;
    (chrs[target.slot] as TickChr).threatenedBy = user.slot;
    (chrs[user.slot] as TickChr).perm |= 0x800;
    (chrs[user.slot] as TickChr).threatening = target.slot;
  }
  return chrs;
}

/** The start of the actor's turn then its end, by the kernels, read into the same {@link Look}s. */
export function oracleTicks(sit: TickSituation): Record<string, Look> {
  let chrs = oracleChrs(sit);
  const actor = sit.field.members.find((m) => m.id === sit.actor)!;
  const start = startOfTurnTick(chrs, actor.slot);
  chrs = start.chrs;
  const a = chrs[actor.slot] as TickChr;
  // Doom counts down at the start of the actor's own turn; at 0 the actor dies and its turn is over.
  const died = new Set<number>();
  for (const p of start.payouts) if ((chrs[p.slot] as TickChr).hp <= 0) died.add(p.slot);
  let actorDied = died.has(actor.slot); // a Zombie actor killed by its own Regen payout takes no turn
  if (!actorDied) {
    const doom = doomTick({ extra: a.extra, reentered: false, doomCounter: a.doomCounter });
    if ((a.extra & 0x4000) !== 0) {
      a.doomCounter = doom.counter;
      if (doom.fires) actorDied = true;
    }
    if (doom.fires && (a.extra & 0x4000) !== 0) died.add(actor.slot);
  }
  if (!actorDied) {
    const end = endOfTurnTick(a);
    a.counters = end.counters;
    const chr = a;
    const marked = poisonMarked({ perm: chr.perm, dead: chr.dead, inBattle: chr.inBattle }, sit.resultsApplied);
    if (marked) {
      const poison = poisonTick({ hp: chr.hp, maxHp: chr.maxHp, poisonPercent: chr.poisonPercent }, actor.slot, actor.slot);
      chr.hp = poison.hpAfter;
      if (chr.hp <= 0) died.add(actor.slot);
    }
  }
  // The death handler dissolves the Threaten pair of the character that dies (VA 0x0078c740 -> 0x0078e410).
  for (const slot of died) chrs = releaseThreaten(chrs, slot);
  const out: Record<string, Look> = {};
  for (const m of sit.field.members) {
    const c = chrs[m.slot] as TickChr;
    const dead = m.dead || died.has(m.slot);
    const stances = (c.extra & STANCE_BITS);
    out[m.id] = {
      hp: dead ? 0 : c.hp,
      alive: !dead,
      regenTicks: c.tickCounter,
      counters: dead ? null : [...c.counters],
      stances: dead ? null : stances,
      threatened: sit.pair !== null && (c.perm & 0x800) !== 0 && c.threatenedBy !== 0xff,
      doom: dead ? null : (c.extra & 0x4000) !== 0 ? c.doomCounter : null,
    };
  }
  return out;
}
