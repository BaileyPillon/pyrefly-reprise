/**
 * Rig for `parity-ffx-engine-gauge.test.ts`: Overdrive-gauge situations written in the GAME's terms (the mode number, the
 * gauge in the character's own points, the status and buff words), the engine's combatants built from them, and the kernel
 * world built from them again by an independent route (re-parity W5; **FFX only**).
 *
 * Nothing here imports `src/battle/ffx/adapt/`, `gauge.ts` or `aeon-gear.ts`: the slot numbers, the bar widths (a party
 * member's 100, an aeon's 20), the status-to-bit translation and the aeons' fixed gear are written out again from the research
 * note (`research/re-ffx-overdrive-steal-aeons.md` sections 1.1, 1.2 and 4.5 to 4.6) on purpose, so a wrong translation of an
 * engine fact into a kernel input shows as a difference.
 */

import type { SeededRng } from '../../../src/battle/common/rng.ts';
import type { FFXCombatant, StatusInstance } from '../../../src/battle/common/types.ts';
import { type OdWorld, newOdWorld, odRefDamage } from '../../../src/battle/ffx/kernel/overdrive.ts';
import { combatantOf, permOf, randomSide, type SideSpec } from './ffxEngineWiring.ts';

/** The 17 modes in the order of the game's mode number. */
export const MODE_NAMES = [
  'warrior', 'comrade', 'stoic', 'healer', 'tactician', 'victim', 'dancer', 'avenger', 'slayer', 'hero', 'rook', 'victor',
  'coward', 'ally', 'sufferer', 'daredevil', 'loner',
] as const;

/** Party slots 0 to 6 in the game's order; aeon slots 8 and up in the game's order (the Magus Sisters are not used here). */
export const PARTY_IDS = ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku'] as const;
export const AEON_IDS = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo'] as const;

export type SeatKind = 'party' | 'aeon' | 'enemy';

/** One character of a situation. */
export interface Seat {
  id: string;
  /** The game's character slot. */
  slot: number;
  kind: SeatKind;
  spec: SideSpec;
  /** The game's mode number (a party member); ignored for an aeon (0x13) and an enemy (0). */
  mode: number;
  /** The gauge in the character's own points: 0 to 100 for a party member, 0 to 20 for an aeon. */
  points: number;
  /** On the field (the party is not while an aeon is out). */
  inBattle: boolean;
  dead: boolean;
  /** Hot Spurs (buff 0x20), Eccentrick (buff 0x40), Curse. */
  hotSpurs: boolean;
  eccentrick: boolean;
  curse: boolean;
  /** Auto-ability word B bits the gauge reads: 1 Double, 2 Triple, 4 SOS, 8 Overdrive to AP. */
  gaugeAuto: number;
}

export const unitOfKind = (kind: SeatKind): number => (kind === 'aeon' ? 5 : 1);
export const barOfKind = (kind: SeatKind): number => (kind === 'aeon' ? 20 : 100);

const GAUGE_AUTO_IDS: Readonly<Record<number, string>> = { 1: 'double-overdrive', 2: 'triple-overdrive', 4: 'sos-overdrive', 8: 'overdrive-to-ap' };

/** A random seat. An aeon's fixed gear is written into its spec the way the research gives it (Pierce on nine, 6 crit, Break Damage Limit on two). */
export function randomSeat(rng: SeededRng, kind: SeatKind, id: string, slot: number, hpSide: boolean): Seat {
  const spec = randomSide(rng, hpSide);
  spec.sentinel = false; // a Sentinel or Guard member draws an enemy blow to itself (Cover), which is the engine's business, not the gauge's
  if (kind === 'aeon') {
    spec.pierce = spec.pierce || id !== 'valefor';
    spec.equipCrit = 6;
    spec.breakLimit = spec.breakLimit || id === 'bahamut' || id === 'anima';
  }
  const bar = barOfKind(kind);
  return {
    id, slot, kind, spec,
    mode: rng.int(0, 16),
    points: rng.int(0, bar - 1),
    inBattle: true,
    dead: false,
    hotSpurs: false, eccentrick: false, curse: false,
    gaugeAuto: 0,
  };
}

/** The engine's combatant for a seat. */
export function engineCombatant(seat: Seat): FFXCombatant {
  const c = combatantOf(seat.spec, seat.id, seat.kind as 'party' | 'enemy');
  if (seat.kind === 'aeon') {
    c.side = 'aeon';
    c.aeon = { ownerId: 'yuna', dismissable: true, temporaryOverdrive: null };
  }
  if (seat.kind !== 'enemy') {
    c.overdrive = { gauge: seat.points * unitOfKind(seat.kind), mode: seat.kind === 'aeon' ? 'stoic' : MODE_NAMES[seat.mode]!, unlockedOverdriveIds: [] };
  }
  const on = (id: string): StatusInstance => ({ id: id as never, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false });
  const statuses = c.statuses as Record<string, StatusInstance>;
  if (seat.hotSpurs) statuses['overdrive-x1_5'] = on('overdrive-x1_5');
  if (seat.eccentrick) statuses['overdrive-x2'] = on('overdrive-x2');
  if (seat.curse) statuses['curse'] = on('curse');
  if (seat.dead) {
    c.hp = 0;
    c.alive = false;
    statuses['ko'] = on('ko');
  }
  const autos = c.equipment?.weapon.autoAbilities as string[] | undefined;
  for (const bit of [1, 2, 4, 8]) if ((seat.gaugeAuto & bit) !== 0) autos?.push(GAUGE_AUTO_IDS[bit]!);
  return c;
}

/** The kernel's world for a set of seats, built by hand from the seat's own facts. */
export function oracleWorld(seats: readonly Seat[]): OdWorld {
  const w = newOdWorld();
  for (const save of w.save) save.counters.fill(0xffff);
  for (let i = 0; i < 8; i++) w.rom[i] = { a: 2, b: 0, c: 5, cap: 22000 };
  for (const s of seats) {
    const slot = w.slots[s.slot]!;
    Object.assign(slot, {
      mode: s.kind === 'aeon' ? 0x13 : s.kind === 'party' ? s.mode : 0,
      gauge: s.points,
      gaugeMax: barOfKind(s.kind),
      maxHp: s.spec.maxHp,
      hp: s.dead ? 0 : s.spec.hp,
      perm: permOf(s.spec),
      sleep: s.spec.sleep ? 1 : 0,
      darkness: s.spec.darkness ? 1 : 0,
      extra: (s.spec.shield ? 0x40 : 0) | (s.spec.boost ? 0x80 : 0) | (s.curse ? 0x400 : 0),
      buffs: (s.hotSpurs ? 0x20 : 0) | (s.eccentrick ? 0x40 : 0),
      autoB: s.gaugeAuto,
      refDamage: s.kind === 'enemy' ? 0 : odRefDamage(s.spec.str, s.spec.mag),
      apFactor: Math.fround(1),
      inBattle: s.inBattle,
      dead: s.dead,
      stoned: s.spec.petrify,
      getsTurns: s.inBattle,
    });
  }
  return w;
}

/** The ids the two sides of a scenario give their seats: a party member, an aeon, and enemies by formation index. */
export function partySeat(rng: SeededRng, n: number, hpSide = true): Seat {
  return randomSeat(rng, 'party', PARTY_IDS[n]!, n, hpSide);
}
export function aeonSeat(rng: SeededRng, n: number): Seat {
  return randomSeat(rng, 'aeon', AEON_IDS[n]!, 8 + n, true);
}
export function enemySeat(rng: SeededRng, index: number): Seat {
  return randomSeat(rng, 'enemy', `foe-${index}`, 0x14 + index, false);
}
