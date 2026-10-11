/**
 * The battle character array as FFX's targeting chain reads it, and the two small functions every part of that chain shares: the
 * can-act gate and the picker (re-parity RC4 lane FFX-G; **FFX only**).
 *
 * **Game case: FFX only.** FFX-2 has its own spread routine and its own counters (`research/re-ffx-targeting.md` section 0). Source:
 * FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D; the rules are the FFX-G04 note's (`research/re-ffx-targeting.md`, our
 * words), each function proven against the game's own machine code in an x86-32 emulator (`tests/fixtures/parity/ffx/target_*.json`).
 * Pure and deterministic: a random draw is a callback the caller supplies (stream number in, chosen slot out), nothing here holds a
 * generator, nothing imports the DOM, `three` or the engine (AGENTS.md rule 1).
 *
 * The array has 31 slots: the party 0 to 7, the aeons 8 to 0x11, the monsters 0x14 to 0x1b. A slot is a plain record of the fields
 * the chain reads; a field left out is 0. Offsets are the character record's (`Chr+0xNNN`).
 */

import { ExtraBit, PermBit } from './status-types.ts';

/** The slots the exe walks. */
export const SLOT_COUNT = 31;
/** The monster slots (`pp_BtlIsMonster`, 0x0079aef0). */
export const MONSTER_FIRST = 0x14;
export const MONSTER_LAST = 0x1b;

/** The three random streams the chain draws from (`research/re-ffx-targeting.md` section 6): not per actor, a constant in each call. */
export const TargetStream = {
  /** A single-target auto-pick (Berserk, Confuse and any forced single-target action). */
  Picker: 4,
  /** The spread: one pick per hit of a random-spread command, and the group pick of a group-target forced action. */
  Spread: 5,
  /** The Reflect bounce of a spell whose holder is on the caster's own side. */
  Reflect: 6,
} as const;

/** One slot of the battle character array: the fields the targeting chain reads. A field left out is 0. */
export interface TargetSlot {
  /** `+0xdc8`: in battle. */
  inBattle?: number;
  /** `+0xdcd`: removed from the field. */
  removed?: number;
  /** `+0xdcc`: the dead flag (a KO'd character that is still on the field). */
  dead?: number;
  /** `+0xdce`: Petrified. */
  stoned?: number;
  /** `+0x5d0` (s32): current HP. */
  hp?: number;
  /** `+0x606` (u16): the permanent status word (Confuse, Berserk, Provoke and Threaten are bits 8 to 11). */
  perm?: number;
  /** `+0x608`: the Sleep counter. */
  sleep?: number;
  /** `+0x616` (u16): the extra status word (Eject 0x100, Guard 0x1000, Sentinel 0x2000). */
  extra?: number;
  /** `+0x60d`: the Reflect counter (any non-zero value, 254 and 255 included). */
  reflect?: number;
  /** `+0x62c` (u16): the temporal statuses equipment gives; bit 0x20 is Reflect. */
  autoTemp?: number;
  /** `+0xdd9`: Targetable (stat_cursor); 0 excludes. */
  targetable?: number;
  /** `+0xddd` (s8): the target class ("event character"). */
  tclass?: number;
  /** `+0xdde`: the "only targetable by" command id, 0xff for no restriction. */
  only?: number;
  /** `+0x4ff` (s8): BattleDistance, 0 in reach of a reach-0 command. */
  far?: number;
  /** `+0x504` (low three bits): the enemy group. */
  group?: number;
  /** `+0x6c6`: the character's default attack command id. */
  defAtk?: number;
  /** `+0x5cb`: the character keeps control of its script when Provoked. */
  keeps?: number;
  /** `+0x5c4`: the slot that Provoked the character. */
  provokedBy?: number;
}

/** The 31 slots; a missing entry is an all-zero slot. */
export type TargetWorld = ReadonlyArray<TargetSlot | undefined>;

/** The command record's words the chain reads (`Cmd+0xNN`). */
export interface TargetCommand {
  /** `+0x1a`: bit 1 the default aim is the opposite side, bits 2 and 3 the target type (0 single, 1 group, 2 all, 3 self), bit 6 can target the dead, bit 7 the low reach bit. */
  b1a: number;
  /** `+0x1b`: bit 0 the high reach bit, bit 1 reach 3 for slots 4, 8, 13, bit 2 may be aimed at ordinary actors, bit 3 at event characters. */
  b1b: number;
  /** `+0x1c` (u32): bit 7 reflectable, bit 15 random spread. */
  misc: number;
  /** `+0x20` (low two bits): the damage kind, 1 physical, 2 magical. */
  b20: number;
  /** `+0x2b`: the hit count. */
  hits: number;
}

/** `Cmd+0x1c` bits the chain reads. */
export const CMD_REFLECTABLE = 0x80;
export const CMD_RANDOM_SPREAD = 0x8000;

/** A field of a slot, 0 when the slot or the field is missing. */
export function field(world: TargetWorld, slot: number, key: keyof TargetSlot): number {
  return world[slot]?.[key] ?? 0;
}

/** Is this slot one of the monster slots? (`pp_BtlIsMonster`.) */
export function isMonsterSlot(slot: number): boolean {
  const s = slot & 0xff;
  return s >= MONSTER_FIRST && s <= MONSTER_LAST;
}

/** A signed byte. */
export function s8(v: number): number {
  const b = v & 0xff;
  return b >= 0x80 ? b - 0x100 : b;
}

/** A signed 16-bit value. */
export function s16(v: number): number {
  const w = v & 0xffff;
  return w >= 0x8000 ? w - 0x10000 : w;
}

/** Bit `i` (0 to 30) of a mask held as a JS number. */
export function hasBit(mask: number, i: number): boolean {
  return ((mask >>> i) & 1) === 1;
}

/**
 * `pp_BtlCanAct(chr, inBattle, notProvoked, notThreatened)` (VA 0x007b24a0): not Petrified, not Confused or Berserk, not asleep,
 * not Ejected, and, when asked, in battle, not Provoked and not Threatened. Every caller in the chain asks 1, 1, 1.
 */
export function canActSlot(c: TargetSlot | undefined, inBattle = 1, notProvoked = 1, notThreatened = 1): boolean {
  const slot = c ?? {};
  const perm = slot.perm ?? 0;
  const extra = slot.extra ?? 0;
  if ((slot.stoned ?? 0) !== 0) return false;
  if ((perm & (PermBit.Confuse | PermBit.Berserk)) !== 0) return false;
  if ((slot.sleep ?? 0) !== 0) return false;
  if ((extra & ExtraBit.Eject) !== 0) return false;
  if (inBattle !== 0 && (slot.inBattle ?? 0) === 0) return false;
  if (notProvoked !== 0 && (perm & PermBit.Provoke) !== 0) return false;
  if (notThreatened !== 0 && (perm & PermBit.Threaten) !== 0) return false;
  return true;
}

/** The set bits 0 to 30 of a mask, ascending (bit 31 is ignored by the picker and the builder). */
export function slotsOf(mask: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) if (hasBit(mask, i)) out.push(i);
  return out;
}

/** Draws one pick among two or more candidate slots on a stream: `slots[value % slots.length]`. The kernel never calls it with fewer than two. */
export type PickFn = (stream: number, slots: readonly number[]) => number;

/**
 * The picker (`pp_BtlPickTarget`, VA 0x007acd40) as the chain calls it: the candidates are the set bits 0 to 30 of the mask in
 * ascending order; with none it reports 0xff and draws nothing, with one it reports that one and draws nothing, and with two or
 * more it draws once on `stream` and takes the candidate of rank `value % count`.
 */
export function pickOne(mask: number, stream: number, pick: PickFn): number {
  const cands = slotsOf(mask);
  if (cands.length === 0) return 0xff;
  if (cands.length === 1) return cands[0] as number;
  return pick(stream, cands);
}
