/**
 * FFX gear drop kernel: the roll that turns a monster's loot record into a weapon or armor with auto-ability slots
 * (`pp_BtlRollGearDrop`, VA 0x00798c10).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D. Spec:
 * `research/re-ffx-overdrive-steal-aeons.md` section 3.5. Not wired into the engine. Pure given `draw`.
 *
 * The roll is only reached from the kill rewards (`./drops.ts`) when the monster's gear-drop chance succeeds. It makes six
 * or more draws in this order: stream 12 (who gets the gear), stream 12 (weapon or armor), stream 12 twice (slot count and
 * extra-ability count), then one stream-13 draw for each ability it tries to add. Everything about the display name and the
 * model of the finished gear (`FUN_007a0cf0`, `FUN_007a0c50`) is cosmetic and is not part of the roll; the entry's first word
 * is whatever `nameOf` returns (the emulator checks used a fixed stub).
 */

import { clamp } from './ap-award.ts';

/** Up to eight gear entries per battle. */
export const GEAR_LIST_CAPACITY = 8;

/** What the gear roll reads of the monster's loot record. */
export interface GearLoot {
  /** +0x2d: the base slot count. */
  slotBase: number;
  /** +0x2e, +0x2f, +0x30: three bytes copied into the entry unchanged (the game keeps them with the gear; their meaning was not traced). */
  copy2e: number;
  copy2f: number;
  copy30: number;
  /** +0x31: the base number of extra-ability tries. */
  abilityBase: number;
  /**
   * The ability rows at +0x32: one row of eight u16 for every (owner, type) pair, row = `type + owner * 2`, type 0 weapon and 1
   * armor. Element 0 is the ability the gear always starts with, elements 1 to 7 are the pool the extra tries draw from.
   */
  rows: ReadonlyMap<number, readonly number[]>;
}

/** One gear entry of the rewards list (0x16 bytes). */
export interface GearEntry {
  /** +0: the name code written by the naming function. */
  name: number;
  /** +2 (u16): always 1 for a new entry. */
  flag: number;
  /** +4: the party member the gear is for (0 to 6). */
  owner: number;
  /** +5: 0 weapon, 1 armor. */
  type: number;
  /** +6: always 0xff for a new entry. */
  mark: number;
  /** +8, +9, +0xa: loot bytes 0x2e, 0x30 and 0x2f. */
  copies: [number, number, number];
  /** +0xb: the number of ability slots, 1 to 4. */
  slots: number;
  /** +0xe (four u16): the abilities; unused places hold 0x00ff. */
  abilities: [number, number, number, number];
}

/** The 22 bytes of an entry as the game stores them (the bytes the roll never writes are 0). */
export function gearEntryBytes(g: GearEntry): number[] {
  const b = new Array<number>(0x16).fill(0);
  b[0] = g.name & 0xff;
  b[1] = (g.name >> 8) & 0xff;
  b[2] = g.flag & 0xff;
  b[3] = (g.flag >> 8) & 0xff;
  b[4] = g.owner;
  b[5] = g.type;
  b[6] = g.mark;
  b[8] = g.copies[0];
  b[9] = g.copies[1];
  b[10] = g.copies[2];
  b[11] = g.slots;
  g.abilities.forEach((a, k) => {
    b[0xe + 2 * k] = a & 0xff;
    b[0xf + 2 * k] = (a >> 8) & 0xff;
  });
  return b;
}

/**
 * `pp_BtlRollGearDrop(killerId, loot, rewards)`. `gear` is the rewards list (a new entry is appended and returned; null
 * when the list already holds eight, in which case nothing is drawn). `joined[i]` is bit 4 of the party save record's byte
 * +0x2c (the member has joined the party). `groupOf(ability)` is byte +0x69 of the ability's table record: two abilities with
 * the same group cannot be on one piece of gear.
 *
 * Owner: with `n` = the number of joined members (0 to 6) plus 3 when the killer is a party member (id below 7; otherwise the
 * killer counts as member 0 and adds nothing), one stream-12 draw `d`; the owner is the first joined member whose running
 * count exceeds `d % n`, and the killer when none does. Type: the low bit of the next stream-12 draw. Slots:
 * `clamp(trunc((slotBase + (a & 7) - 4) / 4), 1, 4)` and extra tries `trunc((abilityBase + (b & 7) - 4) / 8)` from the next two
 * stream-12 draws `a` and `b`. The gear starts with row element 0 when the row has one; each try draws stream 13, picks pool
 * element `(d % 7) + 1`, skips an empty one or one whose group is already on the gear, and stops once the slots are full.
 */
export function rollGearDrop(
  killerId: number,
  loot: GearLoot,
  gear: GearEntry[],
  joined: readonly boolean[],
  groupOf: (ability: number) => number,
  nameOf: (e: GearEntry) => number,
  draw: (stream: number) => number,
): GearEntry | null {
  if (gear.length >= GEAR_LIST_CAPACITY) return null;
  let n = 0;
  for (let i = 0; i < 7; i++) if (joined[i] === true) n++;
  let killer = killerId | 0;
  if (killer < 7) n += 3;
  else killer = 0;
  if (n === 0) throw new RangeError('gear drop owner roll with nobody to choose from (the game faults here)');
  const rem = (draw(12) & 0x7fffffff) % n;
  let owner = killer;
  let count = 0;
  for (let i = 0; i < 7; i++) {
    if (joined[i] === true) {
      count++;
      if (count > rem) {
        owner = i;
        break;
      }
    }
  }
  const type = draw(12) & 1;
  const a = draw(12);
  const b = draw(12);
  const t1 = loot.slotBase - 5 + ((a & 7) + 1);
  const slots = clamp((t1 + ((t1 >> 31) & 3)) >> 2, 1, 4);
  const t2 = loot.abilityBase - 5 + ((b & 7) + 1);
  let tries = (t2 + ((t2 >> 31) & 7)) >> 3;
  const row = loot.rows.get(type + owner * 2) ?? new Array<number>(8).fill(0);
  const abilities: number[] = [];
  const first = row[0] ?? 0;
  if (slots !== 0 && first !== 0) abilities.push(first);
  while (tries > 0) {
    if (abilities.length >= slots) break;
    const cand = row[((draw(13) & 0x7fffffff) % 7) + 1] ?? 0;
    if (cand !== 0) {
      const key = groupOf(cand);
      if (!abilities.some((x) => groupOf(x) === key)) abilities.push(cand);
    }
    tries--;
  }
  while (abilities.length < 4) abilities.push(0xff);
  const entry: GearEntry = {
    name: 0,
    flag: 1,
    owner,
    type,
    mark: 0xff,
    copies: [loot.copy2e, loot.copy30, loot.copy2f],
    slots,
    abilities: abilities as [number, number, number, number],
  };
  entry.name = nameOf(entry) & 0xffff;
  gear.push(entry);
  return entry;
}
