/**
 * Rig and **independent oracle** for the FFX kill rewards at the engine (re-parity RC9, lane FFX-M; **FFX only**). Test-only.
 *
 * The oracle restates the kill-rewards routine from the private notes in its own terms; its logic imports nothing from `src/battle/ffx/kernel/` or `src/battle/ffx/adapt/` (the rig below
 * imports only the engine's stream generator, `adapt/streams.ts#makeFfxRng`, to tap the draws). The sources are
 * `FFX-H02` section 3.5 (the AP award, the gil, the two item slots, the Distill priority, the Bribe gift, the reward list's stacking) and `FFX-G10` sections 3.4 and 3.5. It works from the
 * FACTS of a run: the draws the engine actually made, in order, each with its stream (read from the generator's tap), and the situation (the monster's record, the slots' states, the
 * overkill and Distill facts). It consumes the draws one by one and fails when the engine drew from a stream the routine does not, drew too many, or drew too few.
 */

import type { AutoAbilityId, BattleState, FFXCombatant, FfxLootRecord } from '../../../src/battle/common/types.ts';
import { GameStreams } from '../../../src/battle/common/streams.ts';
import { makeFfxRng } from '../../../src/battle/ffx/adapt/streams.ts';
import { makeActorRuntime, type Ctx, type FFXRuntime } from '../../../src/battle/ffx/state.ts';
import { FFXContentRegistry } from '../../../src/battle/ffx/index.ts';
import { fighter, stats } from '../ffx-fixtures.test.ts';

// ------------------------------------------------------------------------------------------------------------------- a small deterministic generator

export function lcg(seed: number) {
  let s = seed >>> 0 || 1;
  const next = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  return {
    next,
    int: (lo: number, hi: number): number => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p: number): boolean => next() < p,
    pick: <T>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)] as T,
  };
}

// ------------------------------------------------------------------------------------------------------------------- the game's slots, written out again

/** `adapt/slots.ts` restated from `research/re-ffx-ctb-status.md` section 0: the party in the game's order, then the ten aeons. */
export const PARTY_IDS = ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku', 'seymour'] as const;
export const AEON_IDS = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'cindy', 'sandy', 'mindy'] as const;
export const slotOfId = (id: string): number => {
  const p = (PARTY_IDS as readonly string[]).indexOf(id);
  if (p >= 0) return p;
  return 8 + (AEON_IDS as readonly string[]).indexOf(id);
};

// ------------------------------------------------------------------------------------------------------------------- the situation

/** What one of the 18 slots looks like to the AP award. */
export interface SlotSpec {
  id: string;
  /** Present in the battle at all (a combatant exists for it). */
  exists: boolean;
  /** On the field: an active party member, or the aeon that is out. */
  inBattle: boolean;
  dead: boolean;
  ejected: boolean;
  /** The auto-abilities that matter to the kill rewards. */
  autos: AutoAbilityId[];
}

/** The party and aeon side of a battle: what the AP award sees of the 18 slots. */
export interface Field {
  slots: SlotSpec[];
  /** Whether an aeon is out (the party is then off the field). */
  aeonOut: boolean;
}

/** One monster's death. */
export interface Kill {
  rec: FfxLootRecord;
  overkill: boolean;
  /** The Distill bits the monster carries (0x2 Power, 0x4 Mana, 0x8 Speed, 0x20 Ability). */
  distill: number;
  /** A Bribe value when the monster is bribed away. */
  bribed: number | undefined;
  /** Whoever dealt the killing blow (a party member's id), for the Bribe stream. */
  killerId: string;
}

export interface LedgerFacts {
  gil: number;
  ap: number[];
  items: Array<{ id: number; qty: number }>;
}

export const emptyLedger = (): LedgerFacts => ({ gil: 0, ap: new Array<number>(18).fill(0), items: [] });

// ------------------------------------------------------------------------------------------------------------------- the oracle

export interface Draw {
  stream: number;
  value: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const CAP = 999_999_999;

/** The reward list's add: equal items stack (cap 99), a new item takes a new stack while fewer than eight exist, item 0 or a quantity below 1 adds nothing. */
function listAdd(items: Array<{ id: number; qty: number }>, id: number, qty: number): void {
  if (id === 0 || qty < 1) return;
  const found = items.find((s) => s.id === id);
  if (found !== undefined) {
    found.qty = clamp(found.qty + qty, 0, 99);
    return;
  }
  if (items.length < 8) items.push({ id, qty: clamp(qty, 0, 99) });
}

export interface Expected {
  gil: number;
  ap: number[];
  items: Array<{ id: number; qty: number }>;
  baseAp: number;
  gearRolled: boolean;
  gearWouldDrop: boolean;
  /** How many of the draws given this kill took (the rest belong to the next kill). */
  used: number;
}

/** The mode-0 stream of a character (`research/re-ffx-rng-hit.md` section 2): a party member `slot + 20`, every aeon 27, slot 7 27. */
export const mode0Stream = (id: string): number => ((AEON_IDS as readonly string[]).includes(id) ? 27 : slotOfId(id) + 20);

/** `exact`: the draws given are this kill's alone (more or fewer fail); without it the kill takes what it needs from the front and says how many ({@link Expected.used}). */
export function oracleKill(f: Field, k: Kill, before: LedgerFacts, draws: readonly Draw[], exact = true): Expected {
  let cursor = 0;
  const take = (stream: number): number => {
    const d = draws[cursor++];
    if (d === undefined) throw new Error(`the routine needs a draw on stream ${stream}; the engine made only ${draws.length}`);
    if (d.stream !== stream) throw new Error(`draw ${cursor}: the routine draws stream ${stream}, the engine drew stream ${d.stream}`);
    return d.value;
  };
  const out: Expected = { gil: before.gil, ap: [...before.ap], items: before.items.map((x) => ({ ...x })), baseAp: k.overkill ? k.rec.apOverkill : k.rec.ap, gearRolled: false, gearWouldDrop: false, used: 0 };

  // 1. AP: every slot, in order; the multiplier chain for the gil starts at 1 and becomes 2 for a Gillionaire wearer who is in the battle and alive.
  let carry = 1;
  f.slots.forEach((slot, i) => {
    if (!slot.exists || slot.ejected) return;
    let amount = slot.autos.includes('no-ap') ? 0 : out.baseAp;
    const live = slot.inBattle && !slot.dead;
    if (live) {
      if (slot.autos.includes('gillionaire')) carry = 2;
      if (slot.autos.includes('triple-ap')) amount *= 3;
      else if (slot.autos.includes('double-ap')) amount *= 2;
    }
    out.ap[i] = clamp(out.ap[i]! + amount, 0, CAP);
  });

  if (k.bribed !== undefined) {
    // 2. A bribed monster: no gil; two draws on the killer's own mode-0 stream, then its Bribe item.
    const stream = mode0Stream(k.killerId);
    const a = (take(stream) % 11) + 20;
    const bit = take(stream) & 1;
    const qty = clamp(Math.trunc(Math.fround(bit + (Math.fround(Math.sqrt(k.bribed)) * k.rec.bribeFactor * 0.0625 * a) / 25)), 1, 99);
    listAdd(out.items, k.rec.bribeItem, qty);
  } else {
    // 3. Any other monster: the gil, then the two item slots in order.
    out.gil = clamp(carry * k.rec.gil + out.gil, 0, CAP);
    const list = k.overkill ? k.rec.overkillItems : k.rec.items;
    const qtys = k.overkill ? k.rec.overkillQty : k.rec.qty;
    for (let slotNo = 0; slotNo < 2; slotNo++) {
      const roll = take(10);
      if (roll % 255 < k.rec.chance[slotNo]!) {
        const rare = (take(11) & 0xff) < 0x20;
        const at = (rare ? 1 : 0) + 2 * slotNo;
        let item = list[at]!;
        const d = k.distill;
        if ((d & 0x2) !== 0) item = 0x2046;
        else if ((d & 0x4) !== 0) item = 0x2047;
        else if ((d & 0x8) !== 0) item = 0x2048;
        else if ((d & 0x10) === 0 && (d & 0x20) !== 0) item = 0x2049;
        listAdd(out.items, item, qtys[at]!);
      }
    }
  }
  // 4. The gear roll: one more draw on stream 10, whatever the monster. The piece is not made here (no streams 12 or 13).
  const gear = take(10);
  out.gearRolled = true;
  out.gearWouldDrop = gear % 255 < k.rec.gearChance;
  if (exact && cursor !== draws.length) throw new Error(`the routine drew ${cursor} times, the engine ${draws.length}`);
  out.used = cursor;
  return out;
}

// ------------------------------------------------------------------------------------------------------------------- the rig

export interface Rig {
  ctx: Ctx;
  rng: GameStreams;
  /** Every draw of the generator since the last {@link Rig.take}, in order, with its stream. */
  draws: Draw[];
}

/** An engine context around a field, on the game's 68 streams with every draw recorded. No monster yet: {@link addVictim}. */
export function buildField(f: Field, seed: number): Rig {
  const rng = makeFfxRng(seed);
  const draws: Draw[] = [];
  rng.tap = (stream, value) => draws.push({ stream, value });
  const combatants: Record<string, FFXCombatant> = {};
  const activeIds: string[] = [];
  const reserveIds: string[] = [];
  let aeonId: string | null = null;
  for (const slot of f.slots) {
    if (!slot.exists) continue;
    const isAeon = (AEON_IDS as readonly string[]).includes(slot.id);
    const c = fighter({ id: slot.id, side: isAeon ? 'aeon' : 'party', stats: stats() });
    c.equipment = { weapon: { name: 'W', slots: 4, autoAbilities: [...slot.autos] }, armor: { name: 'A', slots: 1, autoAbilities: [] } };
    if (slot.dead) {
      c.alive = false;
      c.statuses['ko'] = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    }
    if (slot.ejected) {
      c.alive = false;
      c.removed = true;
      c.statuses['eject'] = { id: 'eject', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    }
    // Benched, or an aeon that is not out, is off the field; a party member while an aeon holds the field is still "on the field" but off-stage.
    if (!slot.inBattle && !slot.ejected && !(f.aeonOut && !isAeon)) c.removed = true;
    combatants[c.id] = c;
    if (isAeon) {
      if (slot.inBattle) aeonId = c.id;
    } else if (slot.inBattle || (f.aeonOut && !slot.ejected)) activeIds.push(c.id);
    else reserveIds.push(c.id);
  }
  const state: BattleState = {
    game: 'ffx', combatants, activeIds, reserveIds, enemyIds: [], aeonId, turn: 1, ticks: 0, log: [], nextSeq: 0, triggers: [], firedTriggerIds: [], result: null, seed, flags: {},
  };
  const rt: FFXRuntime = {
    actors: new Map(), currentActorId: null, elapsedTicks: 0, lastEnemyActorId: null, pendingMinigame: null, elapsedMs: 0,
    finished: false, aeonStoredGauge: new Map(), frozenPartyCtb: new Map(), aeonRoster: new Map(), inventory: new Map(), gil: 0,
    chained: false, overkilled: [], canEscape: false, sensedIds: new Set(), pendingPartRevivals: [], progress: { bestEnemyHp: 0, atTurn: 0 },
  };
  for (const c of Object.values(combatants)) rt.actors.set(c.id, makeActorRuntime(c));
  const ctx: Ctx = { state, rt, rng, content: new FFXContentRegistry(), emit: (event) => void state.log.push({ ...event, seq: state.nextSeq++ } as never) };
  return { ctx, rng, draws };
}

/** A monster in the field, dead at the moment its death pays: with the overkill mark, the Distill bits and the Bribe marker the kill names. */
export function addVictim(rig: Rig, id: string, k: Kill, rewards?: Partial<FFXCombatant['enemy']> & object): FFXCombatant {
  const victim = fighter({ id, side: 'enemy', stats: stats() }) as FFXCombatant;
  victim.alive = false;
  victim.enemy = { aiScriptId: 'none', formIndex: 0, forms: [], rewards: { ap: k.rec.ap, apOverkill: k.rec.apOverkill, gil: k.rec.gil, overkillThreshold: 1, drops: [], loot: k.rec }, ...(rewards ?? {}) } as never;
  rig.ctx.state.combatants[id] = victim;
  rig.ctx.state.enemyIds.push(id);
  rig.ctx.rt.actors.set(id, makeActorRuntime(victim));
  if (k.overkill) rig.ctx.rt.overkilled.push(id);
  if (k.distill !== 0) rig.ctx.rt.actors.get(id)!.distill = k.distill;
  if (k.bribed !== undefined) rig.ctx.rt.actors.get(id)!.bribed = k.bribed;
  return victim;
}

/** The draws made since the last call, taken out of the record. */
export function takeDraws(rig: Rig): Draw[] {
  return rig.draws.splice(0, rig.draws.length);
}
