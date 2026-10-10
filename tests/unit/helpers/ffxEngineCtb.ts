/**
 * Rig for the CTB half of `parity-ffx-engine-ctb-status.test.ts` (re-parity W2; **FFX only**): generated battle fields
 * written in the GAME's terms (character slots, Agility, counter bytes, Haste and Slow counters, flags), the engine's
 * combatants and context built from them, and the oracle that runs the kernels on the same field by an independent route.
 *
 * Nothing here imports `src/battle/ffx/adapt/` or `src/battle/ffx/turnQueue.ts`: the slot table below is typed again on
 * purpose, so a wrong slot map, a wrong translation of an engine fact into a kernel input, or a wrong shortcut in the
 * engine's clock shows as a difference from the kernel loop.
 */

import { SeededRng, makeRng } from '../../../src/battle/common/rng.ts';
import type { BattleState, FFXCombatant, StatusInstance } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry } from '../../../src/battle/ffx/index.ts';
import { makeActorRuntime, type Ctx, type FFXRuntime } from '../../../src/battle/ffx/state.ts';
import { isReady, schedulerFrame, type SchedChr, type SchedGlobals } from '../../../src/battle/ffx/kernel/ctb-scheduler.ts';
import { chrBaseCtb, sortReady } from '../../../src/battle/ffx/kernel/ctb.ts';
import { initialCtb, type InitCtbSlot } from '../../../src/battle/ffx/kernel/ctb-init.ts';
import { fighter, stats } from '../ffx-fixtures.test.ts';

export { makeRng };

/** The game's slots, typed out again: party 0 to 6, the aeons from 8, the monsters from 0x14. */
const PARTY = ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku'] as const;
const AEONS = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'cindy', 'sandy', 'mindy'] as const;

/** One character of a generated field, in the game's terms. */
export interface FieldMember {
  id: string;
  side: 'party' | 'aeon' | 'enemy';
  /** The game slot this member must stand in (the oracle's own table). */
  slot: number;
  agi: number;
  /** Chr+0x65c, the CTB counter byte. */
  ctb: number;
  /** Chr+0x6d2, ticks since the last Regen payout. */
  regenTicks: number;
  /** Chr+0x613 / 0x614 as the engine can express them: off, a finite count, or permanent (255). */
  haste: number;
  slow: number;
  firstStrike: boolean;
  dead: boolean;
  petrified: boolean;
  /** Off the field for good (Eject) or waiting off-stage (a bench member, an aeon that is not out). */
  removed: boolean;
  ordersOnly: boolean;
}

export interface Field {
  members: FieldMember[];
  /** The aeon on the field, if one is summoned (the party is then off-stage with frozen counters). */
  aeonOut: string | null;
}

export function pick<T>(rng: SeededRng, xs: readonly T[]): T {
  return rng.pick(xs);
}
export const chance = (rng: SeededRng, p: number): boolean => rng.next() < p;

const AGILITIES = [1, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19, 22, 25, 30, 40, 55, 62, 80, 98, 120, 170, 255];

/** A random field: 1 to 3 party members on the field (more on the bench), maybe an aeon out, 1 to 4 enemies. */
export function randomField(rng: SeededRng): Field {
  const members: FieldMember[] = [];
  const base = (id: string, side: FieldMember['side'], slot: number): FieldMember => {
    // Haste and Slow exclude each other in the engine's status model (a permanent pair is only possible through equipment in the game).
    const haste = chance(rng, 0.12) ? pick(rng, [1, 5, 254, 255]) : 0;
    return {
      id,
      side,
      slot,
      agi: chance(rng, 0.8) ? pick(rng, AGILITIES) : rng.int(1, 255),
      ctb: chance(rng, 0.25) ? 0 : chance(rng, 0.5) ? rng.int(0, 40) : rng.int(0, 255),
      regenTicks: chance(rng, 0.7) ? rng.int(0, 40) : rng.int(0, 255),
      haste,
      slow: haste === 0 && chance(rng, 0.1) ? pick(rng, [1, 5, 254, 255]) : 0,
      firstStrike: false,
      dead: chance(rng, 0.08),
      petrified: chance(rng, 0.05),
      removed: false,
      ordersOnly: false,
    };
  };
  const party = rng.shuffle([...PARTY]);
  const active = rng.int(1, 3);
  const bench = rng.int(0, 2);
  party.slice(0, active + bench).forEach((id, i) => {
    const m = base(id, 'party', PARTY.indexOf(id as (typeof PARTY)[number]));
    m.removed = i >= active;
    m.firstStrike = chance(rng, 0.1);
    members.push(m);
  });
  let aeonOut: string | null = null;
  if (chance(rng, 0.2)) {
    aeonOut = pick(rng, AEONS.slice(0, 7));
    const m = base(aeonOut, 'aeon', 8 + AEONS.indexOf(aeonOut as (typeof AEONS)[number]));
    m.dead = false;
    members.push(m);
  }
  const enemyCount = rng.int(1, 4);
  for (let i = 0; i < enemyCount; i++) {
    const m = base(`enemy-${i}`, 'enemy', 0x14 + i);
    m.ordersOnly = chance(rng, 0.06);
    m.removed = chance(rng, 0.05);
    members.push(m);
  }
  // Equal counters and equal Agilities are where the tie-break lives: make some of each on purpose.
  const live = members.filter((m) => !m.dead && !m.petrified && !m.removed);
  if (live.length >= 2 && chance(rng, 0.4)) {
    const a = pick(rng, live);
    const b = pick(rng, live);
    b.ctb = a.ctb;
    if (chance(rng, 0.5)) b.agi = a.agi;
  }
  return { members, aeonOut };
}

function instance(id: StatusInstance['id'], over: Partial<StatusInstance> = {}): StatusInstance {
  return { id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false, ...over };
}

/** The engine's combatants and context for a field. */
export function contextOfField(field: Field, rng: SeededRng): { ctx: Ctx; byId: Map<string, FFXCombatant>; events: Array<Record<string, unknown>> } {
  const byId = new Map<string, FFXCombatant>();
  const combatants: Record<string, FFXCombatant> = {};
  const activeIds: string[] = [];
  const reserveIds: string[] = [];
  const enemyIds: string[] = [];
  for (const m of field.members) {
    const c = fighter({
      id: m.id,
      side: m.side,
      stats: stats({ agi: m.agi, hp: 3000, maxHp: 3000 }),
      removed: m.removed,
      alive: !m.dead,
      equipment: m.side === 'party' ? { weapon: { name: 'W', slots: 1, autoAbilities: m.firstStrike ? ['first-strike'] : [] }, armor: { name: 'A', slots: 1, autoAbilities: [] } } : undefined,
    });
    if (m.dead) {
      c.hp = 0;
      c.statuses['ko'] = instance('ko', { turnsRemaining: null });
    }
    if (m.petrified) c.statuses['petrify'] = instance('petrify');
    if (m.haste > 0) c.statuses['haste'] = instance('haste', m.haste === 255 ? { permanent: true, turnsRemaining: 255 } : { turnsRemaining: m.haste });
    else if (m.slow > 0) c.statuses['slow'] = instance('slow', m.slow === 255 ? { permanent: true, turnsRemaining: 255 } : { turnsRemaining: m.slow });
    byId.set(m.id, c);
    combatants[m.id] = c;
    if (m.side === 'party') (m.removed ? reserveIds : activeIds).push(m.id);
    if (m.side === 'enemy') enemyIds.push(m.id);
  }
  const state: BattleState = {
    game: 'ffx',
    combatants,
    activeIds,
    reserveIds,
    enemyIds,
    aeonId: field.aeonOut,
    turn: 1,
    ticks: 0,
    log: [],
    nextSeq: 0,
    triggers: [],
    firedTriggerIds: [],
    result: null,
    seed: 1,
    flags: {},
  };
  const rt: FFXRuntime = {
    actors: new Map(),
    currentActorId: null,
    elapsedTicks: 0,
    lastEnemyActorId: null,
    pendingMinigame: null,
    elapsedMs: 0,
    finished: false,
    aeonStoredGauge: new Map(),
    frozenPartyCtb: new Map(),
    aeonRoster: new Map(),
    inventory: new Map(),
    gil: 0,
    chained: false,
    overkilled: [],
    canEscape: false,
    sensedIds: new Set(),
    pendingPartRevivals: [],
    progress: { bestEnemyHp: 0, atTurn: 0 },
  };
  for (const m of field.members) {
    const actorRt = makeActorRuntime(byId.get(m.id) as FFXCombatant);
    actorRt.ctb = m.ctb;
    actorRt.regenTicks = m.regenTicks;
    if (m.ordersOnly) actorRt.ordersOnly = true;
    rt.actors.set(m.id, actorRt);
  }
  const events: Array<Record<string, unknown>> = [];
  const ctx: Ctx = {
    state,
    rt,
    rng,
    content: new FFXContentRegistry(),
    emit: (event) => {
      const full = { ...event, seq: state.nextSeq++ };
      state.log.push(full as never);
      events.push(full as never);
    },
  };
  return { ctx, byId, events };
}

// ------------------------------------------------------------------------------------------------------ the clock oracle

/** The scheduler kernel's input for a field, built from the spec (not from the engine). */
export function oracleView(field: Field): SchedChr[] {
  const view: SchedChr[] = Array.from({ length: 31 }, () => ({ inBattle: false, dead: false, perm: 0, queued: 0, ctb: 0, baseCtb: 0, getsTurns: true, tickCounter: 0, rank: 3, agi: 0 }));
  for (const m of field.members) {
    // The party is off-stage while an aeon is out; a bench member, an ejected one and an orders-only one are not on the field.
    const onField = !m.removed && !m.ordersOnly && !(m.side === 'party' && field.aeonOut !== null) && !(m.side === 'aeon' && field.aeonOut !== m.id);
    view[m.slot] = {
      inBattle: onField,
      dead: m.dead,
      perm: m.petrified ? 0x04 : 0,
      queued: 0,
      ctb: m.ctb,
      baseCtb: chrBaseCtb(m.agi),
      getsTurns: true,
      tickCounter: m.regenTicks,
      rank: 3,
      agi: m.agi,
    };
  }
  return view;
}

const GLOBALS: SchedGlobals = { paused: false, actionQueueCount: 0, frameCounter: 0, framesPerTick: 1, debugFastCtb: false, scriptHold: false };

/** Call the scheduler kernel once per tick until it queues somebody; returns the ticks it took and who it chose (a slot). */
export function runSchedulerLoop(view: SchedChr[]): { ticks: number; actor: number | null; chrs: SchedChr[] } {
  let chrs = view;
  for (let ticks = 0; ticks < 1000; ticks++) {
    const r = schedulerFrame(chrs, GLOBALS);
    if (r.actor !== null) {
      // The call that queues somebody does not tick; the actor's queued flag is only the queue's business, not the counters'.
      return { ticks, actor: r.actor, chrs: r.chrs.map((c, i) => ({ ...c, queued: (chrs[i] as SchedChr).queued })) };
    }
    if (!r.ticked && ticks > 0) break;
    chrs = r.chrs;
  }
  return { ticks: -1, actor: null, chrs };
}

/** Who the kernel would take first among the ready characters of a view, by slot. */
export function firstReady(view: readonly SchedChr[]): number | null {
  const ready: number[] = [];
  view.forEach((c, i) => {
    if (isReady(c)) ready.push(i);
  });
  return sortReady(ready, (i) => (view[i] as SchedChr).agi)[0] ?? null;
}

// ------------------------------------------------------------------------------------------------ the opening oracle

/** The initial-CTB kernel's input for a field, from the spec. A slot nobody stands in is a character that is not in the battle. */
export function oracleOpeningSlots(field: Field): InitCtbSlot[] {
  const slots: InitCtbSlot[] = Array.from({ length: 31 }, (_, i) => ({ agi: 0, haste: 0, slow: 0, autoA: 0, inBattle: false, isAeon: i >= 8 && i <= 0x11 }));
  for (const m of field.members) {
    const onField = !m.removed && !m.ordersOnly && !(m.side === 'party' && field.aeonOut !== null) && !(m.side === 'aeon' && field.aeonOut !== m.id);
    slots[m.slot] = {
      agi: m.agi,
      haste: m.haste,
      slow: m.slow,
      autoA: m.firstStrike && m.side === 'party' ? 2 : 0,
      inBattle: onField,
      isAeon: m.slot >= 8 && m.slot <= 0x11,
    };
  }
  return slots;
}

export { initialCtb };
