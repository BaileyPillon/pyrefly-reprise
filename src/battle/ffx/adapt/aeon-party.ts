/**
 * The party around an aeon, run by the game's own kernels (re-parity W5; **FFX only**).
 *
 * The engine used to freeze the party's counters when an aeon came and put them back when it left, which erased the
 * summoner's recovery (a Yuna who summoned at Agility 20 was charged 30 and acted again at once when the aeon left), kept the
 * provoked and threatened pairs of a party that had left the field, gave every fallen aeon the same three battles away and never
 * counted them down. The game parks the party (`kernel/aeon-party.ts`, proven against FFX.exe in
 * `tests/unit/parity-ffx-aeon-party.test.ts`): nobody's counter changes on the way out or back, whoever a leaver provoked is
 * released and a Threaten pair it was an end of is broken, the aeon's counter is 0 (it acts next), a Grand Summon holds the aeon's
 * gauge at its maximum, a wiped aeon starts its recovery count (one more than `ply_rom` gives, because the battle's own save counts it
 * down once), and the end-of-battle save counts it down and stands the aeon up, at full HP and MP, when it reaches 0
 * (`kernel/battle-save.ts#saveCharacter`).
 *
 * This module builds the world those kernels read from the engine's combatants, runs the transition, and hands back what it
 * decided; `../aeons.ts` carries it out with the events the engine always emitted. Magus Sisters (three aeons at once, the joint
 * Delta Attack, the revive of a fallen sister) are in no shipped chapter and the engine has one `aeonId`; the kernel handles
 * them and this adapter does not feed it more than one.
 *
 * Inputs and where each comes from: `docs/handoff/re-parity-w5.md`, section 1.
 */

import type { FFXCombatant } from '../../common/types.ts';
import {
  type PartyChr,
  type PartyWorld,
  aeonUnavailable,
  aeonWipe,
  dismiss,
  startArrival,
  summon,
} from '../kernel/aeon-party.ts';
import { saveCharacter } from '../kernel/battle-save.ts';
import { PermBit } from '../kernel/status-types.ts';
import { aeonGearOf } from '../aeon-gear.ts';
import { type Ctx, friendlies, has, rtOf, statusOf, tryActor } from '../state.ts';
import { SLOT_COUNT, slotOf } from './slots.ts';
import { permWord } from './words.ts';
import { holdsGrandSummon, slotIfAny, unitOf } from './od-world.ts';

const NONE = 0xff;

/** What the transition decided, per combatant. */
export interface PartyOutcome {
  /** The aeon's counter (0 after a summon: it acts next). */
  aeonCtb: number;
  /** The aeon holds a Grand Summon's full gauge. */
  held: boolean;
  /** The combatants whose Provoke or Threaten the kernel took off. */
  freed: Array<{ c: FFXCombatant; provoke: boolean; threaten: boolean }>;
  /** The aeon's recovery counter after a wipe. */
  recover: number;
}

/** The world the kernels read, with the combatant behind each slot. */
interface Field {
  w: PartyWorld;
  at: Array<FFXCombatant | undefined>;
}

function emptyChr(): PartyChr {
  return {
    present: 0, dc8: 0, dc9: 0, df8: 0, dcb: 0, f1a: 0, summoner: NONE, arrival: 0, blocked: 0, dead: 0, hp: 0, ctb: 0, perm: 0,
    provoker: NONE, thrA: NONE, thrB: NONE, gauge: 0, gaugeMax: 0, gaugeSaved: 0, gaugeHeld: 0, stoned: 0, baseCtb: 0, recover: 0,
    recoverMax: 0, avail: 0,
  };
}

/** The party slots in the order of the active list (empty entries 0xff, seven wide). */
function activeSlots(ctx: Ctx): number[] {
  const out: number[] = [];
  for (const id of ctx.state.activeIds) {
    const c = tryActor(ctx, id);
    const slot = c && c.side === 'party' ? slotIfAny(ctx, c) : undefined;
    if (slot !== undefined) out.push(slot);
  }
  while (out.length < 7) out.push(NONE);
  return out.slice(0, 7);
}

/**
 * The field before or after a summon. `aeon` is the aeon the transition is about; `out` says it is already on the field (the
 * party parked behind it).
 */
function fieldOf(ctx: Ctx, aeon: FFXCombatant, out: boolean, grand: boolean): Field {
  const at = new Array<FFXCombatant | undefined>(SLOT_COUNT).fill(undefined);
  const chr: Record<number, PartyChr> = {};
  const inField = new Set(friendlies(ctx).map((c) => c.id));
  const owner = aeon.aeon ? tryActor(ctx, aeon.aeon.ownerId) : undefined;
  const aeonSlot = slotOf(ctx, aeon);
  const ownerSlot = owner ? slotOf(ctx, owner) : NONE;
  const party = activeSlots(ctx);

  for (const c of Object.values(ctx.state.combatants) as FFXCombatant[]) {
    const id = slotIfAny(ctx, c);
    if (id === undefined) continue; // a made-up id of a unit test has no game slot
    at[id] = c;
    const row = emptyChr();
    const unit = unitOf(c);
    const stored = c.overdrive ? Math.floor(Math.max(0, Math.min(100, c.overdrive.gauge)) / unit) : 0;
    const held = c.side === 'aeon' && holdsGrandSummon(c);
    row.present = 1;
    row.dc8 = inField.has(c.id) && c.side !== 'enemy' ? 1 : c.side === 'enemy' && !c.removed ? 1 : 0;
    if (out && c.side === 'party') {
      row.dc8 = 0;
      row.dc9 = c.removed ? 0 : 1; // parked
    }
    row.blocked = has(c, 'eject') ? 1 : 0;
    row.dead = !c.alive || has(c, 'ko') ? 1 : 0;
    row.stoned = has(c, 'petrify') ? 1 : 0;
    row.hp = c.hp;
    row.ctb = rtOf(ctx, c.id).ctb;
    row.baseCtb = rtOf(ctx, c.id).base;
    row.perm = permWord(c);
    const provoke = statusOf(c, 'provoke');
    if (provoke?.sourceId !== undefined) {
      const by = tryActor(ctx, provoke.sourceId);
      const bySlot = by === undefined ? undefined : slotIfAny(ctx, by);
      if (bySlot !== undefined) row.provoker = bySlot;
    }
    row.gaugeMax = 100 / unit;
    row.gauge = held ? row.gaugeMax : stored;
    row.gaugeSaved = stored;
    row.gaugeHeld = held ? 1 : 0;
    row.avail = 1;
    if (c.side === 'aeon') {
      row.recover = c.aeon?.reviveCountdown ?? 0;
      row.recoverMax = aeonGearOf(c).recovery;
      if (out && c.id === aeon.id) {
        row.dc8 = 1;
        row.summoner = ownerSlot;
      }
    }
    chr[id] = row;
  }
  // A Threaten pair: the target names the user in `thrA`, the user names the target in `thrB`, and both carry the bit.
  for (const c of Object.values(ctx.state.combatants) as FFXCombatant[]) {
    const inst = statusOf(c, 'threaten');
    if (!inst) continue;
    const user = inst.sourceId === undefined ? undefined : tryActor(ctx, inst.sourceId);
    const cs = slotIfAny(ctx, c);
    const us = user === undefined ? undefined : slotIfAny(ctx, user);
    if (cs === undefined) continue;
    chr[cs]!.perm |= PermBit.Threaten;
    if (us === undefined) continue;
    chr[cs]!.thrA = us;
    chr[us]!.perm |= PermBit.Threaten;
    chr[us]!.thrB = cs;
  }
  // A world only has the ids the kernel walks: party and aeon slots 0 to 0x11 and monster slots 0x14 to 0x1b.
  for (let id = 0; id < SLOT_COUNT; id++) if ((id < 0x12 || (id >= 0x14 && id <= 0x1b)) && chr[id] === undefined) chr[id] = emptyChr();

  const w: PartyWorld = {
    active: out ? [aeonSlot, NONE, NONE, NONE, NONE, NONE, NONE] : party,
    saved: out ? party : new Array<number>(7).fill(NONE),
    roster: Array.from({ length: 17 }, (_, i) => i),
    rosterSaved: Array.from({ length: 17 }, (_, i) => i),
    summonActive: out ? 1 : 0,
    aeonId: out ? aeonSlot : 0,
    summonerId: out ? ownerSlot : NONE,
    grandSummon: grand ? 1 : 0,
    actor: NONE,
    deadMask: 0,
    reward: new Array<number>(18).fill(0),
    chr,
  };
  return { w, at };
}

/** What the kernel took off the field's characters, as a list of combatants to free. */
function freedBetween(before: Field, after: Field): PartyOutcome['freed'] {
  const out: PartyOutcome['freed'] = [];
  for (const idText of Object.keys(before.w.chr)) {
    const id = Number(idText);
    const c = before.at[id];
    if (!c) continue;
    const was = before.w.chr[id]!.perm;
    const now = after.w.chr[id]!.perm;
    const provoke = (was & PermBit.Provoke) !== 0 && (now & PermBit.Provoke) === 0;
    const threaten = (was & PermBit.Threaten) !== 0 && (now & PermBit.Threaten) === 0;
    if (provoke || threaten) out.push({ c, provoke, threaten });
  }
  return out;
}

/** `FUN_007adf90` and the arrival step: the party leaves the field and the aeon takes it. */
export function summonOutcome(ctx: Ctx, aeon: FFXCombatant, summoner: FFXCombatant, grand: boolean): PartyOutcome {
  const before = fieldOf(ctx, aeon, false, grand);
  const after = fieldOf(ctx, aeon, false, grand);
  summon(after.w, slotOf(ctx, summoner), slotOf(ctx, aeon));
  startArrival(after.w);
  const a = after.w.chr[slotOf(ctx, aeon)]!;
  return { aeonCtb: a.ctb, held: a.gaugeHeld !== 0, freed: freedBetween(before, after), recover: a.recover };
}

/**
 * The aeon leaves the field and the party returns: `wiped` is the wipe (every aeon out is down; the recovery count starts and
 * the aeon goes without the revive), else the Dismiss command (`reviveFallen`).
 */
export function dismissOutcome(ctx: Ctx, aeon: FFXCombatant, wiped: boolean): PartyOutcome {
  const f = fieldOf(ctx, aeon, true, false);
  if (wiped) aeonWipe(f.w);
  dismiss(f.w, wiped ? 0 : 1);
  const a = f.w.chr[slotOf(ctx, aeon)]!;
  return { aeonCtb: a.ctb, held: a.gaugeHeld !== 0, freed: [], recover: a.recover };
}

/** `FUN_0079a080` for an aeon: can it be summoned (HP above 0, nothing left of its recovery count)? */
export function aeonSummonable(aeon: FFXCombatant): boolean {
  const row = emptyChr();
  row.hp = aeon.hp;
  row.avail = 1;
  row.blocked = has(aeon, 'eject') ? 1 : 0;
  row.recover = aeon.aeon?.reviveCountdown ?? 0;
  return aeonUnavailable(row) === 0;
}

/**
 * The end-of-battle save for the aeons (`FUN_00785fc0`, `kernel/battle-save.ts#saveCharacter`): an aeon with a recovery count has
 * it counted down by one, and the battle that brings it to 0 stands it up at full HP and MP. (The party's own saved HP is not
 * touched here: a chained link carries a fallen member as it fell, which is the seam's own rule.)
 */
export function settleAeonRecovery(ctx: Ctx): void {
  for (const aeon of ctx.rt.aeonRoster.values()) {
    const had = aeon.aeon?.reviveCountdown ?? 0;
    if (!aeon.aeon || had === 0) continue;
    const save = {
      hp: 0, mp: 0, maxHp: aeon.stats.maxHp, maxMp: aeon.stats.maxMp, recover: 0, weaponId: 0, armorId: 0, odMode: 0, odGauge: 0, odMax: 0,
    };
    saveCharacter(
      { hp: aeon.hp, mp: aeon.mp, recover: had, weaponId: 0, armorId: 0, odMode: 0, odGauge: 0, odMax: 0 },
      save,
    );
    aeon.aeon.reviveCountdown = save.recover;
    if (save.recover === 0) {
      aeon.hp = save.hp;
      aeon.mp = save.mp;
      aeon.alive = aeon.hp > 0;
    }
  }
}
