/**
 * A generated battle board for the FFX targeting-chain tests, and an **independent oracle** of what the game's chain does on it (re-parity RC4 lane
 * FFX-G; **FFX only**).
 *
 * The oracle restates the rules of `research/re-ffx-targeting.md` in its own terms (plain records and arrays by combatant id, no bit masks, no
 * slot arrays) and imports nothing from `src/battle/ffx/kernel/`, `adapt/target-world.ts` or `target-build.ts`: a wrong translation of an engine
 * fact into a kernel input shows as a difference between the engine and this file.
 *
 * Slots: the party members have the game's fixed slots (Tidus 0, Yuna 1, Auron 2, Kimahri 3, Wakka 4, Lulu 5, Rikku 6), the monsters `0x14` plus
 * their place in the formation. Draws come from a mirror of the battle's generator (`makeFfxRng(seed)`), so the oracle takes the same stream positions
 * the engine does without sharing a line of the engine's code.
 */

import type { AbilityDef, BattleState, FFXCombatant, StatusId, StatusInstance } from '../../../src/battle/common/types.ts';
import { makeFfxRng } from '../../../src/battle/ffx/adapt/streams.ts';
import { makeActorRuntime, type Ctx, type FFXRuntime } from '../../../src/battle/ffx/state.ts';
import { FFXContentRegistry } from '../../../src/battle/ffx/registry.ts';
import type { GameStreams } from '../../../src/battle/common/streams.ts';
import type { SeededRng } from '../../../src/battle/common/rng.ts';

export const PARTY_IDS = ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku'] as const;

/** A tiny deterministic generator for the board (not the battle's). */
export function lcg(seed: number): { next: () => number; int: (lo: number, hi: number) => number; chance: (p: number) => boolean; pick: <T>(a: readonly T[]) => T } {
  let s = seed >>> 0 || 1;
  const next = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p) => next() < p,
    pick: (a) => a[Math.floor(next() * a.length)] as never,
  };
}

/** One combatant of a board, in the game's terms. */
export interface Member {
  id: string;
  side: 'party' | 'enemy';
  slot: number;
  hp: number;
  dead: boolean;
  petrified: boolean;
  sleep: boolean;
  confuse: boolean;
  berserk: boolean;
  threaten: boolean;
  /** The id of the provoker, when Provoked. */
  provokedBy: string | null;
  reflect: boolean;
  guard: boolean;
  sentinel: boolean;
  /** An enemy's Guard mark (a boss script's), the engine's stand-in for the Guard status on a monster. */
  guardMark: boolean;
  /** Untargetable (hidden). */
  untargetable: boolean;
  /** An enemy whose script keeps control when Provoked. */
  keeps: boolean;
}

export interface Board {
  members: Member[];
  /** The Tidus counters, index 1 to 7. */
  bond: number[];
}

/** A random board: 2 to 3 party members (Tidus often among them) against 1 to 5 monsters, with the statuses the chain reads. */
export function randomBoard(r: ReturnType<typeof lcg>): Board {
  const members: Member[] = [];
  const party = [...PARTY_IDS].sort(() => r.next() - 0.5).slice(0, r.int(2, 4));
  if (r.chance(0.6) && !party.includes('tidus')) party[0] = 'tidus';
  const status = (side: 'party' | 'enemy', id: string, slot: number): Member => {
    const dead = r.chance(0.1);
    return {
      id,
      side,
      slot,
      hp: dead ? 0 : r.pick([1000, 1200, 1500, 2600, 5000, 9999]),
      dead,
      petrified: !dead && r.chance(0.04),
      sleep: !dead && r.chance(0.07),
      confuse: !dead && r.chance(0.05),
      berserk: !dead && r.chance(0.05),
      threaten: !dead && r.chance(0.07),
      provokedBy: null,
      reflect: !dead && r.chance(0.2),
      guard: !dead && r.chance(0.2),
      sentinel: !dead && r.chance(0.12),
      guardMark: side === 'enemy' && !dead && r.chance(0.15),
      untargetable: side === 'enemy' && r.chance(0.05),
      keeps: false,
    };
  };
  for (const id of party) members.push(status('party', id, PARTY_IDS.indexOf(id as never)));
  const monsters = r.int(1, 5);
  for (let i = 0; i < monsters; i++) members.push(status('enemy', `m${i}`, 0x14 + i));
  // Now and then a member is Provoked (by another member): it cannot cover, and it is what the forced-turn tests act on.
  for (const m of members) {
    const others = members.filter((o) => o.id !== m.id);
    if (!m.dead && others.length > 0 && r.chance(0.06)) m.provokedBy = r.pick(others).id;
  }
  const bond = [0, 0, 0, 0, 0, 0, 0, 0].map((_, i) => (i === 0 ? 0 : r.chance(0.5) ? r.int(0, 2000) : 0));
  return { members, bond };
}

/** The combatant record the engine reads for a member. */
export function combatantOfMember(m: Member): FFXCombatant {
  const status = (id: StatusId, extra: Partial<StatusInstance> = {}): [StatusId, StatusInstance] => [
    id,
    { id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false, ...extra },
  ];
  const on: Array<[StatusId, StatusInstance]> = [];
  if (m.dead) on.push(status('ko'));
  if (m.petrified) on.push(status('petrify'));
  if (m.sleep) on.push(status('sleep'));
  if (m.confuse) on.push(status('confuse'));
  if (m.berserk) on.push(status('berserk'));
  if (m.threaten) on.push(status('threaten'));
  if (m.provokedBy !== null) on.push(status('provoke', { sourceId: m.provokedBy }));
  if (m.reflect) on.push(status('reflect'));
  if (m.guard) on.push(status('guard'));
  if (m.sentinel) on.push(status('sentinel'));
  const maxHp = 9999;
  const c: FFXCombatant = {
    id: m.id,
    name: m.id,
    side: m.side,
    spriteKey: m.id,
    hp: m.hp,
    mp: 100,
    stats: { hp: maxHp, mp: 100, str: 20, def: 20, mag: 20, mdef: 20, agi: 20, luck: 20, eva: 0, acc: 100, maxHp, maxMp: 100 },
    statuses: Object.fromEntries(on),
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: m.side === 'party' ? 'player' : 'ai',
    alive: !m.dead,
    removed: false,
    slot: 0,
    flags: m.untargetable ? { untargetable: true } : {},
    learnedAbilityIds: [],
  };
  if (m.keeps) c.enemy = { aiScriptId: 'seymour-natus', forms: [], formIndex: 0 } as never;
  return c;
}

/** A battle context around a board. `activeOrder` is the list order the engine keeps the party in (not the slot order). */
export function contextOfBoard(board: Board, seed: number, activeOrder?: readonly string[]): { ctx: Ctx; events: Array<Record<string, unknown>>; rng: GameStreams; byId: Map<string, FFXCombatant> } {
  const rng = makeFfxRng(seed);
  const combatants = board.members.map(combatantOfMember);
  const byId = new Map(combatants.map((c) => [c.id, c] as const));
  const partyIds = combatants.filter((c) => c.side === 'party').map((c) => c.id);
  const order = activeOrder ?? partyIds;
  const state: BattleState = {
    game: 'ffx',
    combatants: Object.fromEntries(combatants.map((c) => [c.id, c])),
    activeIds: order.filter((id) => partyIds.includes(id)),
    reserveIds: [],
    enemyIds: combatants.filter((c) => c.side === 'enemy').map((c) => c.id),
    aeonId: null, turn: 1, ticks: 0, log: [], nextSeq: 0, triggers: [], firedTriggerIds: [], result: null, seed, flags: {},
  };
  const rt: FFXRuntime = {
    actors: new Map(), currentActorId: null, elapsedTicks: 0, lastEnemyActorId: null, pendingMinigame: null, elapsedMs: 0,
    finished: false, aeonStoredGauge: new Map(), frozenPartyCtb: new Map(), aeonRoster: new Map(), inventory: new Map(), gil: 0,
    chained: false, overkilled: [], canEscape: false, sensedIds: new Set(), pendingPartRevivals: [], progress: { bestEnemyHp: 0, atTurn: 0 },
    coverBond: [...board.bond],
  };
  for (const c of combatants) rt.actors.set(c.id, makeActorRuntime(c));
  for (const m of board.members) if (m.guardMark) rt.actors.get(m.id)!.guardMark = true;
  const events: Array<Record<string, unknown>> = [];
  const ctx: Ctx = {
    state,
    rt,
    rng: rng as unknown as SeededRng,
    content: new FFXContentRegistry(),
    emit: (event) => {
      const full = { ...event, seq: state.nextSeq++ };
      state.log.push(full as never);
      events.push(full as never);
    },
  };
  return { ctx, events, rng, byId };
}

// ------------------------------------------------------------------ the abilities

/** What an ability does, in the game's terms. */
export interface AbilitySpec {
  kind: 'attack' | 'gouge' | 'sweep' | 'fire' | 'cure' | 'slowga' | 'hastega' | 'dispel' | 'fury' | 'mix';
  hits: number;
}

export function abilityOfSpec(spec: AbilitySpec): AbilityDef {
  const base = {
    name: spec.kind,
    game: 'ffx' as const,
    category: 'skill' as const,
    mpCost: 0,
    rank: 3,
    power: 1,
    formula: 'fixed-no-variance' as const,
    element: [],
    hits: spec.hits,
    statusEffects: [],
    removesStatuses: [],
    canMiss: false,
  };
  switch (spec.kind) {
    case 'attack': return { ...base, id: 'attack', damageType: 'physical', targeting: 'single-enemy', flags: [] } as AbilityDef;
    // a physical blow at one of the user's own side (a Confused swing): the user can be its own target, and Cover applies to it as to any single physical blow
    case 'gouge': return { ...base, id: 'gouge', damageType: 'physical', targeting: 'single-ally', flags: [] } as AbilityDef;
    // a physical blow at every enemy: not a single-target command, so never covered
    case 'sweep': return { ...base, id: 'sweep', damageType: 'physical', targeting: 'all-enemies', flags: [] } as AbilityDef;
    case 'fire': return { ...base, id: 'fire', category: 'blackmagic', damageType: 'magical', targeting: 'single-enemy', flags: ['reflectable'] } as AbilityDef;
    case 'cure': return { ...base, id: 'cure', category: 'whitemagic', damageType: 'magical', targeting: 'single-ally', flags: ['reflectable'] } as AbilityDef;
    case 'slowga': return { ...base, id: 'slowga', category: 'blackmagic', damageType: 'magical', targeting: 'all-enemies', flags: ['reflectable'] } as AbilityDef;
    case 'hastega': return { ...base, id: 'hastega', category: 'whitemagic', damageType: 'magical', targeting: 'all-allies', flags: ['reflectable'] } as AbilityDef;
    case 'dispel': return { ...base, id: 'dispel', category: 'blackmagic', damageType: 'magical', targeting: 'single-enemy', flags: [] } as AbilityDef;
    case 'fury': return { ...base, id: 'fury', category: 'overdrive', damageType: 'magical', targeting: 'random-enemy', flags: [] } as AbilityDef;
    case 'mix': return { ...base, id: 'mix', category: 'overdrive', damageType: 'other', targeting: 'random-ally', flags: [] } as AbilityDef;
  }
}

// ------------------------------------------------------------------ the oracle

export interface Expected {
  /** Hits per target id (targets with 0 hits are left out). */
  hits: Record<string, number>;
  /** Hits that found nobody to land on, per reflecting id. */
  lost: Record<string, number>;
  /** The streams 4, 5 and 6 draws the chain takes, in order. */
  draws: number[];
}

/**
 * What the game's target builder does for `userId` using `spec` at `chosen` on `board`, taking its draws from `mirror` (a generator seeded like the
 * engine's). `chosen` is one id for a single-target ability.
 */
export function oracleAction(board: Board, userId: string, spec: AbilitySpec, chosen: string | null, mirror: GameStreams): Expected {
  const byId = new Map(board.members.map((m) => [m.id, m] as const));
  const user = byId.get(userId) as Member;
  const drawn: number[] = [];
  const draw = (stream: number, n: number): number => {
    drawn.push(stream);
    return mirror.draw(stream) % n;
  };
  const bySlot = (a: Member, b: Member): number => a.slot - b.slot;
  const fit = (m: Member): boolean => !m.dead && !m.untargetable; // alive on the field and aimable
  const own = board.members.filter((m) => m.side === user.side).sort(bySlot);
  const opp = board.members.filter((m) => m.side !== user.side).sort(bySlot);
  const ab = abilityOfSpec(spec);

  // 1. the mask the action carries
  let mask: Member[];
  switch (ab.targeting) {
    case 'single-enemy':
    case 'single-ally':
      mask = chosen === null ? [] : [byId.get(chosen) as Member];
      break;
    case 'all-enemies':
      mask = opp.filter(fit);
      break;
    case 'all-allies':
      mask = own.filter(fit);
      break;
    case 'random-enemy':
      mask = opp.filter(fit);
      break;
    default:
      mask = own.filter(fit);
  }
  if (mask.length === 0) return { hits: {}, lost: {}, draws: drawn };

  // 2. the hit counts: a random-target row deals each hit to one member of the set (a draw only with two or more); anything else gives each its hits
  const hits = new Map<string, number>();
  const spread = ab.targeting === 'random-enemy' || ab.targeting === 'random-ally';
  if (spread) {
    for (let n = 0; n < spec.hits; n++) {
      const pick = mask.length >= 2 ? (mask[draw(5, mask.length)] as Member) : (mask[0] as Member);
      hits.set(pick.id, (hits.get(pick.id) ?? 0) + 1);
    }
  } else {
    for (const m of mask) hits.set(m.id, spec.hits);
  }
  const targetsSoFar = new Map<string, Member>(mask.map((m) => [m.id, m] as const));

  // 3. Cover: a physical command of a single target; the user is never covered
  if (ab.damageType === 'physical' && (ab.targeting === 'single-enemy' || ab.targeting === 'single-ally')) {
    for (const t of [...targetsSoFar.values()].sort(bySlot)) {
      if (t.id === user.id) continue;
      const group = board.members.filter((m) => m.side === t.side);
      let best: Member | null = null;
      let bestScore = -1;
      for (const c of group.sort(bySlot)) {
        if (c.id === user.id || c.id === t.id) continue;
        const holds = c.guard || c.sentinel || (c.side === 'enemy' && c.guardMark);
        const canAct = !c.petrified && !c.confuse && !c.berserk && !c.sleep && c.provokedBy === null && !c.threaten;
        if (!holds || c.dead || !canAct) continue;
        let score = c.hp * (c.sentinel ? 2 : 1);
        if (t.slot === 0) score += Math.trunc(board.bond[c.slot]! / 2) * (c.slot >= 1 && c.slot <= 7 ? 1 : 0);
        if (c.slot === 0) score += Math.trunc((board.bond[t.slot] ?? 0) / 2) * (t.slot >= 1 && t.slot <= 7 ? 1 : 0);
        if (score > bestScore) {
          best = c;
          bestScore = score;
        }
      }
      if (best !== null) {
        hits.set(best.id, (hits.get(best.id) ?? 0) + (hits.get(t.id) ?? 0));
        hits.set(t.id, 0);
        targetsSoFar.delete(t.id);
        targetsSoFar.set(best.id, best);
      }
    }
  }

  // 4. Reflect: a reflectable ability, each target in slot order; a bounce is never looked at again
  const lost: Record<string, number> = {};
  const reflectable = ab.flags.includes('reflectable');
  const finalSet = new Map<string, Member>();
  for (const t of [...targetsSoFar.values()].sort(bySlot)) {
    if (reflectable && t.reflect) {
      const had = hits.get(t.id) ?? 0;
      hits.set(t.id, 0);
      if (t.side !== user.side) {
        hits.set(user.id, (hits.get(user.id) ?? 0) + had);
        finalSet.set(user.id, user);
      } else {
        const candidates = board.members.filter((m) => m.side !== user.side && fit(m)).sort(bySlot);
        const landing = candidates.length >= 2 ? (candidates[draw(6, candidates.length)] as Member) : candidates[0];
        if (landing !== undefined) {
          hits.set(landing.id, (hits.get(landing.id) ?? 0) + had);
          finalSet.set(landing.id, landing);
        } else {
          lost[t.id] = (lost[t.id] ?? 0) + had;
        }
      }
    } else {
      finalSet.set(t.id, t);
    }
  }
  const out: Record<string, number> = {};
  for (const [id, n] of hits) if (n > 0) out[id] = n;
  return { hits: out, lost, draws: drawn };
}

// ------------------------------------------------------------------ the forced turn

export interface ExpectedForced {
  kind: 'none' | 'dropped' | 'attack';
  targets: string[];
  /** The Provoke bit was cleared (the provoker is gone). */
  cleared: boolean;
  draws: number[];
}

/**
 * What the game's turn start does for an actor: Provoke first, then Berserk, then Confuse. Berserk aims at the opposite side, Confuse at its own side
 * with the actor in it (a single candidate draws nothing, two or more one draw of stream 4); Provoke at the provoker alone, unless the provoker is gone
 * (the bit is cleared and the actor goes on) or the actor keeps control of its script (the bit stays).
 */
export function oracleForced(board: Board, actorId: string, mirror: GameStreams): ExpectedForced {
  const byId = new Map(board.members.map((m) => [m.id, m] as const));
  const a = byId.get(actorId) as Member;
  const drawn: number[] = [];
  const fit = (m: Member): boolean => !m.dead && !m.untargetable;
  const sorted = (side: 'party' | 'enemy'): Member[] => board.members.filter((m) => m.side === side && fit(m)).sort((x, y) => x.slot - y.slot);
  const pickOne = (set: Member[]): Member => {
    if (set.length === 1) return set[0] as Member;
    drawn.push(4);
    return set[mirror.draw(4) % set.length] as Member;
  };
  let cleared = false;
  if (a.provokedBy !== null) {
    const p = byId.get(a.provokedBy);
    if (p === undefined || p.dead || p.petrified) cleared = true;
    else if (!a.keeps) {
      const legal = sorted(p.side);
      return legal.includes(p) ? { kind: 'attack', targets: [p.id], cleared, draws: drawn } : { kind: 'dropped', targets: [], cleared, draws: drawn };
    }
  }
  if (a.berserk || a.confuse) {
    const set = a.berserk ? sorted(a.side === 'party' ? 'enemy' : 'party') : sorted(a.side);
    if (set.length === 0) return { kind: 'dropped', targets: [], cleared, draws: drawn };
    return { kind: 'attack', targets: [pickOne(set).id], cleared, draws: drawn };
  }
  return { kind: 'none', targets: [], cleared, draws: drawn };
}
