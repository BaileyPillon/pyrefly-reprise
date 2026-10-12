/**
 * Rig for `parity-ffx-engine-reactions.test.ts` (re-parity RC4 lane F; **FFX only**): generated fights written in the GAME's terms (seven
 * party slots with HP, the permanent and extra status words, thirteen counters, who wears Auto-Potion, Auto-Med and Auto-Phoenix, the item
 * bag by the game's item numbers), the engine's combatants and context built from them, and the oracle that decides the same reactions by
 * an independent route.
 *
 * Nothing here imports `src/battle/ffx/adapt/` or `src/battle/ffx/kernel/`: the rules below are typed again from the note (`FFX-G02`
 * sections 3.8 and 3.9), in the game's bytes and priorities, so a wrong translation of an engine fact into a kernel input, a wrong stock
 * rule or a wrong queue rule in the adapter shows as a difference from this oracle. The oracle works from facts (a hit's HP damage and the
 * status words before and after it, a death) and does not run any item: what the items DO to HP is the item pipeline's business.
 */

import type { SeededRng } from '../../../src/battle/common/rng.ts';
import type { AutoAbilityId, BattleState, FFXCombatant, StatusId, StatusInstance } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry } from '../../../src/battle/ffx/index.ts';
import { makeActorRuntime, type Ctx, type FFXRuntime } from '../../../src/battle/ffx/state.ts';
import { fighter, stats } from '../ffx-fixtures.test.ts';

/** The party slots, typed again: Tidus 0 .. Rikku 6. */
export const PARTY = ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku'] as const;

/** Engine item ids by the game's item number. */
export const ITEM_ID: Readonly<Record<number, string>> = {
  0x2000: 'potion', 0x2001: 'hi-potion', 0x2002: 'x-potion', 0x2006: 'phoenix-down', 0x200a: 'antidote', 0x200c: 'eye-drops',
  0x200d: 'echo-screen', 0x200e: 'holy-water', 0x200f: 'remedy',
};
export const ITEM_NUMBER: Readonly<Record<string, number>> = Object.fromEntries(Object.entries(ITEM_ID).map(([n, id]) => [id, Number(n)]));
/** The items the three reactions can use, in the game's numbers. */
export const REACTION_ITEMS = [0x2000, 0x2001, 0x2002, 0x2006, 0x200a, 0x200c, 0x200d, 0x200e, 0x200f] as const;

export type Wear = 'potion' | 'med' | 'phoenix';
const AUTO: Readonly<Record<Wear, AutoAbilityId>> = { potion: 'auto-potion', med: 'auto-med', phoenix: 'auto-phoenix' };

/** A character's status words: the permanent word (Death 1, Zombie 2, Petrify 4, Poison 8, ... Confuse 0x100, Berserk 0x200, Provoke 0x400, Threaten 0x800), thirteen counters, the extra word (Eject 0x100). */
export interface Words {
  perm: number;
  counters: number[];
  extra: number;
}

export interface Member {
  id: (typeof PARTY)[number];
  slot: number;
  maxHp: number;
  hp: number;
  dead: boolean;
  /** Off the field (a bench member). */
  bench: boolean;
  wears: Wear[];
  words: Words;
  /** Carries the Auto-Life status. */
  autoLife: boolean;
  /** Statuses equipment gives (they are permanent instances and never count as new). */
  given: { poison: boolean; zombie: boolean; darkness: boolean; silence: boolean };
}

export type Step =
  | { kind: 'hit'; who: string; hpDamage: number; after: Words; woke: boolean }
  | { kind: 'kill'; who: string }
  | { kind: 'drain'; keep: boolean };

export interface Situation {
  members: Member[];
  /** The bag by the game's item number. */
  bag: Record<number, number>;
  steps: Step[];
}

/** What a reaction event looks like, whoever produced it. */
export interface Seen {
  user: string;
  target: string;
  item: number;
  cause: string;
}

// -------------------------------------------------------------------------------------------------------- the generator

const pick = <T>(rng: SeededRng, xs: readonly T[]): T => rng.pick(xs);
const chance = (rng: SeededRng, p: number): boolean => rng.next() < p;

function randomWords(rng: SeededRng): Words {
  let perm = 0;
  if (chance(rng, 0.12)) perm |= 8; // Poison
  if (chance(rng, 0.05)) perm |= 2; // Zombie
  if (chance(rng, 0.04)) perm |= 4; // Petrify
  for (const bit of [0x100, 0x200, 0x400, 0x800]) if (chance(rng, 0.06)) perm |= bit;
  const counters = new Array<number>(13).fill(0);
  if (chance(rng, 0.07)) counters[0] = pick(rng, [1, 3, 254]); // Sleep
  if (chance(rng, 0.12)) counters[1] = pick(rng, [2, 3, 255]); // Silence
  if (chance(rng, 0.12)) counters[2] = pick(rng, [2, 3, 255]); // Darkness
  return { perm, counters, extra: chance(rng, 0.04) ? 0x100 : 0 };
}

/** The words after a hit: a few statuses come and go. */
function nextWords(rng: SeededRng, w: Words): Words {
  const out: Words = { perm: w.perm, counters: [...w.counters], extra: w.extra };
  const flip = (bit: number, p: number): void => {
    if (chance(rng, p)) out.perm ^= bit;
  };
  flip(8, 0.22);
  flip(2, 0.1);
  flip(4, 0.04);
  for (const bit of [0x100, 0x200, 0x400, 0x800]) flip(bit, 0.05);
  for (const [slot, p] of [[0, 0.1], [1, 0.22], [2, 0.22]] as const) {
    if (chance(rng, p)) out.counters[slot] = out.counters[slot] === 0 ? pick(rng, [2, 3, 255]) : 0;
  }
  // now and then a hit lands two or three of the four curable statuses at once (Remedy's case), or puts a sleeper down
  if (chance(rng, 0.2)) {
    for (const k of rng.shuffle([0, 1, 2, 3]).slice(0, rng.int(2, 3))) {
      if (k === 0) out.perm |= 8;
      else if (k === 1) out.perm |= 2;
      else out.counters[k - 1] = out.counters[k - 1] === 0 ? 3 : out.counters[k - 1] as number;
    }
  }
  if (chance(rng, 0.1)) out.counters[0] = 3;
  return out; // (Eject never comes or goes with a hit: an ejected character is off the field and is never a target)
}

const REACTION_BAG: readonly number[] = REACTION_ITEMS;

export function randomSituation(rng: SeededRng): Situation {
  const count = rng.int(2, 6);
  const ids = rng.shuffle([...PARTY]).slice(0, count);
  const members: Member[] = ids.map((id) => {
    const maxHp = pick(rng, [1, 2, 7, 100, 999, 1000, 2400, 5000, 9999]);
    const wears: Wear[] = (['potion', 'med', 'phoenix'] as const).filter(() => chance(rng, 0.45));
    return {
      id,
      slot: PARTY.indexOf(id),
      maxHp,
      hp: Math.max(1, pick(rng, [maxHp, maxHp, Math.floor(maxHp / 2) + 1, Math.floor(maxHp / 2), Math.floor(maxHp / 2) - 1, 1, rng.int(1, maxHp)])),
      dead: false,
      bench: chance(rng, 0.12),
      wears,
      words: randomWords(rng),
      autoLife: chance(rng, 0.1),
      given: { poison: chance(rng, 0.07), zombie: chance(rng, 0.03), darkness: chance(rng, 0.07), silence: chance(rng, 0.07) },
    };
  });
  // at least one member on the field
  if (members.every((m) => m.bench)) (members[0] as Member).bench = false;
  const bag: Record<number, number> = {};
  for (const item of REACTION_BAG) bag[item] = pick(rng, [0, 0, 1, 1, 2, 3, 5, 98, 99]);
  const steps: Step[] = [];
  const alive = new Set(members.filter((m) => !m.bench && (m.words.extra & 0x100) === 0).map((m) => m.id as string));
  const onField = new Set(alive);
  const cur = new Map(members.map((m) => [m.id as string, m.words]));
  const n = rng.int(3, 9);
  for (let k = 0; k < n; k++) {
    const t = rng.next();
    if (t < 0.62 && onField.size > 0) {
      const who = pick(rng, [...onField]);
      const after = nextWords(rng, cur.get(who) as Words);
      cur.set(who, after);
      steps.push({ kind: 'hit', who, hpDamage: chance(rng, 0.2) ? 0 : pick(rng, [1, 5, 40, 300, 1000, 9999]), after, woke: chance(rng, 0.1) });
    } else if (t < 0.84 && alive.size > 0) {
      const who = pick(rng, [...alive]);
      alive.delete(who);
      steps.push({ kind: 'kill', who });
    } else {
      steps.push({ kind: 'drain', keep: chance(rng, 0.3) });
    }
  }
  steps.push({ kind: 'drain', keep: false });
  return { members, bag, steps };
}

// ------------------------------------------------------------------------------------------------------------ the engine

function instance(id: StatusId, over: Partial<StatusInstance> = {}): StatusInstance {
  return { id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false, ...over };
}

/** The engine's combatants and context for a situation. */
export function contextOf(sit: Situation, rng: SeededRng): { ctx: Ctx; byId: Map<string, FFXCombatant>; events: Array<Record<string, unknown>> } {
  const byId = new Map<string, FFXCombatant>();
  const combatants: Record<string, FFXCombatant> = {};
  const activeIds: string[] = [];
  const reserveIds: string[] = [];
  for (const m of sit.members) {
    const armor = m.wears.map((w) => AUTO[w]);
    const c = fighter({
      id: m.id,
      side: 'party',
      stats: stats({ hp: m.maxHp, maxHp: m.maxHp }),
      removed: m.bench,
      alive: true,
      equipment: { weapon: { name: 'W', slots: 1, autoAbilities: [] }, armor: { name: 'A', slots: armor.length, autoAbilities: armor } },
    });
    c.hp = m.hp;
    const w = m.words;
    for (const [bit, id] of [[4, 'petrify'], [0x100, 'confuse'], [0x200, 'berserk'], [0x400, 'provoke'], [0x800, 'threaten']] as const) {
      if ((w.perm & bit) !== 0) c.statuses[id] = instance(id);
    }
    if (w.counters[0] !== 0) c.statuses['sleep'] = instance('sleep', { turnsRemaining: w.counters[0] as number });
    if ((w.extra & 0x100) !== 0) c.statuses['eject'] = instance('eject', { permanent: true });
    if (m.autoLife) c.statuses['auto-life'] = instance('auto-life');
    if (m.given.poison) c.statuses['poison'] = instance('poison', { permanent: true });
    if (m.given.zombie) c.statuses['zombie'] = instance('zombie', { permanent: true });
    if (m.given.darkness) c.statuses['darkness'] = instance('darkness', { permanent: true });
    if (m.given.silence) c.statuses['silence'] = instance('silence', { permanent: true });
    byId.set(m.id, c);
    combatants[m.id] = c;
    (m.bench ? reserveIds : activeIds).push(m.id);
  }
  const foe = fighter({ id: 'enemy-0', side: 'enemy', stats: stats({ hp: 99_999, maxHp: 99_999 }) });
  byId.set('enemy-0', foe);
  combatants['enemy-0'] = foe;
  const state: BattleState = {
    game: 'ffx', combatants, activeIds, reserveIds, enemyIds: ['enemy-0'], aeonId: null, turn: 1, ticks: 0, log: [], nextSeq: 0,
    triggers: [], firedTriggerIds: [], result: null, seed: 1, flags: {},
  };
  const rt: FFXRuntime = {
    actors: new Map(), currentActorId: null, elapsedTicks: 0, lastEnemyActorId: null, pendingMinigame: null, elapsedMs: 0, finished: false,
    aeonStoredGauge: new Map(), frozenPartyCtb: new Map(), aeonRoster: new Map(), inventory: new Map(), gil: 0, chained: false, overkilled: [],
    canEscape: false, sensedIds: new Set(), pendingPartRevivals: [], progress: { bestEnemyHp: 0, atTurn: 0 },
  };
  for (const [number, count] of Object.entries(sit.bag)) rt.inventory.set(ITEM_ID[Number(number)] as string, count);
  for (const c of byId.values()) rt.actors.set(c.id, makeActorRuntime(c));
  const events: Array<Record<string, unknown>> = [];
  const ctx: Ctx = {
    state, rt, rng, content: new FFXContentRegistry(),
    emit: (event) => {
      const full = { ...event, seq: state.nextSeq++ };
      events.push(full as Record<string, unknown>);
      state.log.push(full as never);
    },
  };
  return { ctx, byId, events };
}

/** Put a character's statuses in line with status words (the ones Can-act and the reactions read), keeping what equipment gives. */
export function syncStatuses(c: FFXCombatant, w: Words, given: Member['given']): void {
  const set = (id: StatusId, on: boolean, over: Partial<StatusInstance> = {}): void => {
    if (on) c.statuses[id] ??= instance(id, over);
    else delete c.statuses[id];
  };
  set('zombie', (w.perm & 2) !== 0 || given.zombie, given.zombie ? { permanent: true } : {});
  set('petrify', (w.perm & 4) !== 0);
  set('poison', (w.perm & 8) !== 0 || given.poison, given.poison ? { permanent: true } : {});
  for (const [bit, id] of [[0x100, 'confuse'], [0x200, 'berserk'], [0x400, 'provoke'], [0x800, 'threaten']] as const) set(id, (w.perm & bit) !== 0);
  set('sleep', (w.counters[0] as number) !== 0);
  set('silence', (w.counters[1] as number) !== 0 || given.silence, given.silence ? { permanent: true } : {});
  set('darkness', (w.counters[2] as number) !== 0 || given.darkness, given.darkness ? { permanent: true } : {});
  set('eject', (w.extra & 0x100) !== 0, { permanent: true });
}

/** A status word set as the engine's status record. */
export function recordOfWords(w: Words): { perm: number; counters: number[]; extra: number } {
  return { perm: w.perm, counters: [...w.counters], extra: w.extra };
}

// ---------------------------------------------------------------------------------------------------------- the oracle

/** One queued record of the oracle: the game's queue entry, paid for. */
interface Record_ {
  kind: 'auto-potion' | 'auto-med' | 'auto-phoenix';
  user: string;
  target: string;
  item: number;
  priority: number;
  lost: boolean;
}

export interface OracleOptions {
  /** A deliberately wrong rule, to show the comparison can fail. */
  mutant?: 'strict-half' | 'present-not-new' | 'no-class-limit' | 'no-cancel' | 'no-refund' | 'phoenix-descends' | 'mega-phoenix' | 'med-engine-order' | 'no-death-cancel-after';
}

/** What the oracle ends with: the events the engine should have produced, and the bag. */
export interface Outcome {
  seen: Seen[];
  bag: Record<number, number>;
}

export function oracle(sit: Situation, opt: OracleOptions = {}): Outcome {
  const mut = opt.mutant;
  const bag: Record<number, number> = { ...sit.bag };
  const stock = (item: number): number => bag[item] ?? 0;
  const pay = (item: number): void => {
    bag[item] = stock(item) - 1;
  };
  const members = new Map(sit.members.map((m) => [m.id as string, { ...m, words: { perm: m.words.perm, counters: [...m.words.counters], extra: m.words.extra }, dead: m.dead }]));
  const queue: Record_[] = [];
  const deaths = new Set<string>();
  const seen: Seen[] = [];

  /** Can-act (VA 0x007b24a0) with every flag asked: in battle, not Provoked, not Threatened. Death is not tested. */
  const canAct = (m: { words: Words; bench: boolean }, w: Words = m.words, asleepOverride?: boolean): boolean => {
    if ((w.perm & 4) !== 0) return false; // stoned
    if ((w.perm & 0x300) !== 0) return false; // Confuse, Berserk
    if ((asleepOverride ?? w.counters[0] !== 0) === true) return false;
    if ((w.extra & 0x100) !== 0) return false; // ejected
    if (m.bench) return false; // not in battle
    if ((w.perm & 0x400) !== 0) return false; // Provoke
    if ((w.perm & 0x800) !== 0) return false; // Threaten
    return true;
  };
  const blocked = (user: string, base: number): boolean => queue.some((r) => r.user === user && (r.priority & 0xf0) === base);
  const enqueue = (r: Omit<Record_, 'lost'>): void => {
    queue.push({ ...r, lost: deaths.has(r.user) && mut !== 'no-death-cancel-after' });
  };

  for (const step of sit.steps) {
    if (step.kind === 'hit') {
      const m = members.get(step.who) as typeof sit.members[number];
      const before = m.words;
      const after = step.after;
      const wearsMed = m.wears.includes('med');
      const wearsPotion = m.wears.includes('potion');
      if (wearsMed || wearsPotion) {
        const ok = canAct(m, after, after.counters[0] !== 0 && !step.woke);
        if (wearsMed && (mut === 'no-class-limit' || !blocked(step.who, 0x10))) {
          const poison = (after.perm & 8) !== 0 && (mut === 'present-not-new' || (before.perm & 8) === 0) && !m.given.poison;
          const zombie = (after.perm & 2) !== 0 && (mut === 'present-not-new' || (before.perm & 2) === 0) && !m.given.zombie;
          const dark = (after.counters[2] as number) !== 0 && (mut === 'present-not-new' || (before.counters[2] as number) === 0) && !m.given.darkness;
          const silence = (after.counters[1] as number) !== 0 && (mut === 'present-not-new' || (before.counters[1] as number) === 0) && !m.given.silence;
          const fresh = [poison, zombie, dark, silence];
          const count = fresh.filter(Boolean).length;
          if (count > 0 && ok) {
            const items = [0x200a, 0x200e, 0x200c, 0x200d];
            const order = mut === 'med-engine-order' ? [2, 3, 0, 1] : [0, 1, 2, 3];
            let item = 0;
            let prio = 0;
            if (count >= 2 && stock(0x200f) > 0) {
              item = 0x200f;
              prio = 0x15;
            } else {
              for (const k of order) {
                if (fresh[k] === true && stock(items[k] as number) > 0) {
                  item = items[k] as number;
                  prio = 0x11 + k;
                  break;
                }
              }
              if (item === 0 && stock(0x200f) > 0) {
                item = 0x200f;
                prio = 0x15;
              }
            }
            if (item !== 0) {
              pay(item);
              enqueue({ kind: 'auto-med', user: step.who, target: step.who, item, priority: prio });
            }
          }
        }
        if (wearsPotion && step.hpDamage > 0 && (mut === 'no-class-limit' || !blocked(step.who, 0x20))) {
          const hpAfter = Math.max(0, Math.min(m.maxHp, m.hp - step.hpDamage));
          const half = Math.floor(m.maxHp / 2);
          if ((mut === 'strict-half' ? hpAfter < half : hpAfter <= half) && ok) {
            for (const [k, item] of [0x2000, 0x2001, 0x2002].entries()) {
              if (stock(item) > 0) {
                pay(item);
                enqueue({ kind: 'auto-potion', user: step.who, target: step.who, item, priority: 0x21 + k });
                break;
              }
            }
          }
        }
      }
      m.hp = Math.max(0, m.hp - step.hpDamage);
      m.words = after;
    } else if (step.kind === 'kill') {
      const v = members.get(step.who) as typeof sit.members[number];
      if (mut !== 'no-cancel') for (const r of queue) if (r.user === step.who) r.lost = true;
      deaths.add(step.who);
      v.dead = true;
      v.hp = 0;
      if (v.autoLife) {
        v.autoLife = false;
        v.dead = false; // revived by the queued Auto-Life; it is not part of the item reactions
        v.hp = Math.max(1, Math.floor(v.maxHp / 4));
        v.words = { perm: 0, counters: new Array<number>(13).fill(0), extra: v.words.extra & 0x100 }; // the KO reset clears Zombie and Scan with the rest (RC5); only the Eject marker stays (the engine's stand-in for the separate ejected flag)
      } else if (stock(0x2006) >= 1) {
        const order = mut === 'phoenix-descends' ? [...sit.members].reverse() : sit.members;
        const holders = [...order].filter((x) => !x.bench).sort((a, b) => (mut === 'phoenix-descends' ? b.slot - a.slot : a.slot - b.slot));
        for (const h of holders) {
          const hm = members.get(h.id) as typeof h;
          if (!hm.dead && hm.wears.includes('phoenix') && canAct(hm)) {
            pay(0x2006);
            enqueue({ kind: 'auto-phoenix', user: h.id, target: step.who, item: 0x2006, priority: 0x30 });
            break;
          }
        }
      }
    } else {
      // drain
      let ran = 0;
      while (queue.length > 0 && ran < 62) {
        const r = queue.shift() as Record_;
        const u = members.get(r.user) as typeof sit.members[number];
        if (r.lost || u.dead) continue;
        if (r.kind === 'auto-phoenix' && !canAct(u)) {
          if (mut !== 'no-refund') bag[r.item] = Math.min(99, stock(r.item) + 1);
          continue;
        }
        ran++;
        seen.push({ user: r.user, target: r.target, item: mut === 'mega-phoenix' && r.item === 0x2006 ? 0x2007 : r.item, cause: r.kind });
      }
      queue.length = 0;
      if (!step.keep) deaths.clear();
    }
  }
  return { seen, bag };
}
