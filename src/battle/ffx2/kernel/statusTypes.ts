/**
 * Shared types, tables and the landing test of the FFX-2 status-infliction kernels
 * (`./statusGroup1.ts`, `./statusGroup2.ts`, `./status.ts`).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69),
 * `pp_status_roll_g1` 0x00619230 and `pp_status_roll_g2` 0x00619700, the two flag-word tables read from
 * the image on 2026-10-08 (0x00d484fc and 0x00d48804, 24 entries of 6 bytes, the first two bytes are the
 * word). Spec: `research/re-ffx2-hit-status.md` section 4. Pure, no DOM, no engine types.
 *
 * A command carries two 24-entry chance tables (group 1 at row +0x2f, group 2 at row +0x47) and a
 * 24-entry amount table (row +0x5f). Group 1 are the on/off ailments (Death, Petrify, Sleep, Silence,
 * Darkness, Poison, Confusion, Berserk, Curse, Defense, Eject, ...); group 2 are the timed and staged
 * statuses (Shell, Protect, Reflect, Regen, Haste, Slow, Stop, the seven stat stages, Doom, the
 * immunities). The target has a matching resist table for each (Chr +0x404 and +0x41c; 255 = immune).
 */

export const STATUS_COUNT = 24;

/** Group 1 index to name, for readers and tests (the engine's names differ). */
export const Status1 = {
  Death: 0,
  Petrify: 1,
  Sleep: 2,
  Silence: 3,
  Darkness: 4,
  Poison: 5,
  Confusion: 6,
  Berserk: 7,
  Curse: 8,
  Defense: 9,
  Eject: 10,
} as const;

/** Group 2 index to name. Indices 7 to 13 are the stat stages (STR, MAG, DEF, MDEF, ACC, EVA, LCK). */
export const Status2 = {
  Shell: 0,
  Protect: 1,
  Reflect: 2,
  Regen: 3,
  Haste: 4,
  Slow: 5,
  Stop: 6,
  StatStrength: 7,
  StatLuck: 13,
  Doom: 14,
} as const;

/**
 * The group 1 flag words (exe 0x00d484fc, `pp_status_g1_flags`). Bits the kernel reads: 0x400 (the
 * status is gated by the scripted "check stop" condition: Petrify and Sleep) and 0x100 (the status is
 * blocked while the target is mid-action: Petrify and Eject). The others (0x20 negative status, 0x10,
 * 0x2, 0x1) only steer display counters.
 */
export const STATUS1_INFO: readonly number[] = [
  0x0220, 0x0520, 0x0422, 0x0030, 0x0030, 0x0030, 0x0030, 0x0020, 0x0020, 0x0001, 0x0320, 0x0000,
  0x0000, 0x0000, 0x0000, 0x0000, 0x0020, 0x0020, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000,
];

/**
 * The group 2 flag words (exe 0x00d48804, `pp_MsCheckStatCount`). Bits the kernel reads: 0xc (a timed
 * status with a counter, as opposed to a -10..+10 stat stage), 0x400 (check-stop gated: Stop) and 0x100
 * (blocked while the target is mid-action: Stop). 0x4 is the 1500-unit counter step (Shell ... Slow, the
 * immunities), 0x8 the 10000-unit step with a lethal expiry (Doom).
 */
export const STATUS2_INFO: readonly number[] = [
  0x0005, 0x0005, 0x0005, 0x0004, 0x0004, 0x0024, 0x05a4, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000,
  0x0000, 0x0000, 0x0068, 0x0004, 0x0004, 0x0004, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000,
];

/** A 24-entry table of bytes. */
export type StatusBytes = readonly number[];

/** The attacker fields the status rolls read. */
export interface StatusAttacker {
  /** Battle slot id: picks the status stream, `rngStreamForChr(id, 2)`. */
  id: number;
  /** Chr +0x380 (s32). */
  level: number;
  /** Chr +0x3bc: the equipped weapon's group 1 chances (24 bytes). Used when the command uses character properties. */
  weaponChance1: StatusBytes;
  /** Chr +0x3d4: the weapon's group 2 chances (24 bytes). */
  weaponChance2: StatusBytes;
  /** Chr +0x3ec: the weapon's group 2 amounts (24 signed bytes). */
  weaponAmount2: StatusBytes;
}

/** The target fields the status rolls read. */
export interface StatusTarget {
  /** Battle slot id (monster slots 15 to 30 are Petrified straight into Eject). */
  id: number;
  /** Chr +0x380 (s32). */
  level: number;
  /** Chr +0x434: status word 1 as the roll starts (bit i = group 1 status i is on). */
  status1: number;
  /** Chr +0x404 and +0x41c: resist tables (255 = immune). */
  resist1: StatusBytes;
  resist2: StatusBytes;
  /** Chr +0x570 OR +0x4fc: group 1 statuses held by permanent sources (cannot be cleansed; some block others). */
  protectMask: number;
  /** `FUN_00632630(target, 0, 0)`: the target's action-state bits (bit 2 petrified/Stopped, bits 0 and 1 mid-action). */
  actionState: number;
  /** Chr +0x438 + i (signed): the group 2 byte currently in effect. */
  activeBytes: StatusBytes;
  /** Chr +0x500 + i and +0x574 + i: permanent group 2 sources (only indices 4 to 6 and the cleanse test read them). */
  layerB: StatusBytes;
  layerD: StatusBytes;
}

/** The command row fields the status rolls read. */
export interface StatusCommand {
  /** Row +0x2f, +0x47: the chance bytes of group 1 and group 2 (255 = always, 254 = unless immune). */
  chance1: StatusBytes;
  chance2: StatusBytes;
  /** Row +0x5f (signed bytes): the duration to add (timed) or the step to add (stat stage). */
  amount2: StatusBytes;
  /** Row +0x1c bit 0x20: the command removes statuses (no roll, no draw). */
  cleanse: boolean;
  /** Row +0x16 bit 0 (`flags_misc & 0x10000`): take the larger of the row and the attacker's weapon value. */
  usesWeapon: boolean;
}

/**
 * The parts of the 0x80-byte result buffer the status rolls read and write. `pp_result_init` fills it
 * from the target before the rolls (see {@link initialStatusResult}).
 */
export interface StatusResult {
  /** Result +0x10: apply to the SECONDARY layer (+0x50 / +0x54) instead of the main one. From row +0x18 bit 2. */
  secondaryLayer: boolean;
  /** Result +0x34: group 1 statuses set after the command; starts as the target's +0x450. */
  statusSet: number;
  /** Result +0x38 + i: group 2 counters / stages (signed bytes, 24 entries); start as the target's +0x4b4. */
  counters: number[];
  /** Result +0x50: the secondary layer's group 1 set; starts as the target's +0x550. */
  layerCSet: number;
  /** Result +0x54 + i: the secondary layer's group 2 bytes; start as the target's +0x554. */
  layerCBytes: number[];
  /**
   * The result-kind flag word the rolls add to (result flags: 0x4000 Petrify immune, 0x200 Sleep
   * immune, 0x400 Silence immune, 0x800 Darkness immune); it is `local_70` of the damage orchestrator.
   */
  flags: number;
}

/** What happened to one status. */
export interface StatusOutcome {
  group: 1 | 2;
  /** Status index 0 to 23. */
  index: number;
  /** The chance byte used (after the weapon table). */
  chance: number;
  /** The target's resist byte (255 when the stop gate forced it). */
  resist: number;
  /** `draw % 101`, or `null` for a cleanse (no draw). */
  roll: number | null;
  /** The roll succeeded (always true for a cleanse). */
  landed: boolean;
  /** Resist 255 stopped it (the "immune" message). */
  immune: boolean;
  /** The status was added (or the stage went up). */
  applied: boolean;
  /** The status was removed (or the stage went down). */
  removed: boolean;
  /** Group 2: the attempt left the result unchanged (`local_c` in the decompile). */
  attempted: boolean;
}

/** The debug switches and scripted gates the rolls consult. All off in ordinary play. */
export interface StatusOptions {
  /** VA 0x00df68ce: every roll lands. */
  debugForceLand?: boolean;
  /** VA 0x00df68cf: every roll fails. */
  debugForceFail?: boolean;
  /**
   * The scripted "check stop" gate (`FUN_0062e4d0` and VA 0x00df948d, or the roll function's last
   * argument): while it holds, statuses whose flag word has 0x400 (Petrify, Sleep in group 1; Stop in
   * group 2) read as resisted. False in ordinary play.
   */
  stopGate?: boolean;
}

/**
 * The landing test shared by both groups (and the only place the status RNG is turned into a decision):
 *
 *     lands  iff  c == 255
 *            or   (r != 255  and  (c == 254  or  roll < c + 5 * (lvA - lvT) - r))
 *
 * `roll` is `draw % 101` (0 to 100); the right-hand side is a signed 32-bit int and is not clamped.
 */
export function statusLands(
  chance: number,
  resist: number,
  roll: number,
  attackerLevel: number,
  targetLevel: number,
  debugForceLand = false,
): boolean {
  const c = chance & 0xff;
  const r = resist & 0xff;
  if (c === 0xff) return true;
  if (r === 0xff) return false;
  if (c === 0xfe) return true;
  return roll < ((Math.imul((attackerLevel | 0) - (targetLevel | 0), 5) - r + c) | 0) || debugForceLand;
}

/**
 * `pp_result_init` (exe 0x0061b1c0), the status part: the result buffer a command starts from. When
 * `skipCopy` (row `flags_misc & 0x800`) is set nothing is copied from the target and the sets and
 * counters start empty.
 */
export function initialStatusResult(
  target: { appliedSet: number; counters: StatusBytes; secondarySet: number; secondaryBytes: StatusBytes },
  skipCopy: boolean,
  secondaryLayer: boolean,
  flags = 0,
): StatusResult {
  return {
    secondaryLayer,
    statusSet: skipCopy ? 0 : target.appliedSet | 0,
    counters: skipCopy ? new Array<number>(STATUS_COUNT).fill(0) : Array.from(target.counters),
    layerCSet: skipCopy ? 0 : target.secondarySet | 0,
    layerCBytes: skipCopy ? new Array<number>(STATUS_COUNT).fill(0) : Array.from(target.secondaryBytes),
    flags,
  };
}
