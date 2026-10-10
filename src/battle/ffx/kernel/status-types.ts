/**
 * The shapes and tables the FFX status-infliction kernels share (`./status-inflict.ts`, `./status-extra.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D. Spec:
 * `research/re-ffx-ctb-status.md` sections 6 and 7. Plain data and types; no behaviour.
 *
 * Vocabulary (the game's, read from the exe):
 * - **Regular statuses** are numbered 0..24 in the command record's chance bytes (`Cmd+0x2e + i`), the weapon's
 *   (`Chr+0x5de + i`) and the target's resistance bytes (`Chr+0x641 + i`). Numbers 0..11 are the PERMANENT group:
 *   one bit each in the 16-bit word `Chr+0x606`. Numbers 12..24 are the TEMPORAL group: one turn counter byte each
 *   in `Chr+0x608 + (i - 12)`, with its duration in `Cmd+0x47 + (i - 12)` / `Chr+0x5f7 + (i - 12)`.
 * - **Extra statuses** are the 16 bits of the word `Chr+0x616`. They have no chance byte; the command carries the
 *   wanted bits in the word `Cmd+0x54`.
 * - The **hit record** is the 0x2c-byte per-target snapshot the infliction edits: permanent word at +0x14, the
 *   thirteen counters at +0x07..+0x13 (same order as the Chr), extra word at +0x16. The game copies it back to the
 *   character after the action's damage has been applied.
 */

/** Regular status numbers (the index into the chance, duration-offset and resistance bytes). */
export const Status = {
  Death: 0,
  Zombie: 1,
  Petrify: 2,
  Poison: 3,
  PowerBreak: 4,
  MagicBreak: 5,
  ArmorBreak: 6,
  MentalBreak: 7,
  Confuse: 8,
  Berserk: 9,
  Provoke: 10,
  Threaten: 11,
  Sleep: 12,
  Silence: 13,
  Darkness: 14,
  Shell: 15,
  Protect: 16,
  Reflect: 17,
  NulTide: 18,
  NulBlaze: 19,
  NulShock: 20,
  NulFrost: 21,
  Regen: 22,
  Haste: 23,
  Slow: 24,
} as const;

export const REGULAR_STATUS_COUNT = 25;
export const PERMANENT_STATUS_COUNT = 12;
export const TEMPORAL_STATUS_COUNT = 13;
export const EXTRA_STATUS_BITS = 16;

/** Counter slot of a temporal status (`Status.Sleep` is slot 0): `Chr+0x608 + slot`, record +0x07 + slot. */
export const TemporalSlot = {
  Sleep: 0,
  Silence: 1,
  Darkness: 2,
  Shell: 3,
  Protect: 4,
  Reflect: 5,
  NulTide: 6,
  NulBlaze: 7,
  NulShock: 8,
  NulFrost: 9,
  Regen: 10,
  Haste: 11,
  Slow: 12,
} as const;

/** Bits of the permanent status word (`Chr+0x606`, hit record +0x14). */
export const PermBit = {
  Death: 0x0001,
  Zombie: 0x0002,
  Petrify: 0x0004,
  Poison: 0x0008,
  PowerBreak: 0x0010,
  MagicBreak: 0x0020,
  ArmorBreak: 0x0040,
  MentalBreak: 0x0080,
  Confuse: 0x0100,
  Berserk: 0x0200,
  Provoke: 0x0400,
  Threaten: 0x0800,
} as const;

/** Bits of the extra status word (`Chr+0x616`, hit record +0x16). Bit 4 and bit 15 are unused by any command seen. */
export const ExtraBit = {
  Scan: 0x0001,
  DistillPower: 0x0002,
  DistillMana: 0x0004,
  DistillSpeed: 0x0008,
  DistillAbility: 0x0020,
  Shield: 0x0040,
  Boost: 0x0080,
  Eject: 0x0100,
  AutoLife: 0x0200,
  Curse: 0x0400,
  Defend: 0x0800,
  Guard: 0x1000,
  Sentinel: 0x2000,
  Doom: 0x4000,
} as const;

/** `Cmd+0x20` bit 5: this command CLEANSES instead of inflicting (Esuna, Dispel, Phoenix Down, ...). */
export const CMD_CLEANSE = 0x20;
/** `Cmd+0x1c` bit 18: the status chances, durations and extra word are merged with the user's weapon's. */
export const CMD_USES_WEAPON = 0x40000;

/** The byte value 255 in a chance byte: always lands, ignoring resistance. In a resistance byte: immune. */
export const ALWAYS_OR_IMMUNE = 255;
/** The byte value 254 in a chance byte: lands unless immune. */
export const LANDS_UNLESS_IMMUNE = 254;

/**
 * Byte 3 of the 4-byte records of the status behaviour tables in the exe's data section: 0x00c423e8 (the 12
 * permanent statuses), 0x00c42420 (the 16 extra bits), 0x00c42464 (the 13 temporal statuses). Read from the image
 * (research/re-ffx-ctb-status.md section 0). Meaning of the bits as the code uses them:
 * - 0x80: a bad status (counted in result counter 7); 0x40 and 0x20: two more classes, counted in counters 1 and 2
 *   (0x40 selects counter 1 instead of counter 0);
 * - temporal table only, low nibble: 1 counter ticks down at the start of the holder's turn, 2 an event fires there,
 *   4 counter ticks down at the END of the holder's turn, 8 an event fires there.
 */
export const PERM_STATUS_FLAGS: readonly number[] = [
  0x80, 0xc0, 0x80, 0xc0, 0x80, 0x80, 0x80, 0x80, 0xc0, 0x80, 0x80, 0x80,
];
export const EXTRA_STATUS_FLAGS: readonly number[] = [
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x80, 0x10, 0x00, 0x10, 0x80, 0x00,
];
export const TEMPORAL_STATUS_FLAGS: readonly number[] = [
  0xac, 0xcc, 0xcc, 0x14, 0x14, 0x14, 0x00, 0x00, 0x00, 0x00, 0x03, 0x0c, 0x8c,
];
/** Temporal flag bit 4: the counter ticks down at the end of the holder's own turn. */
export const TEMPORAL_TICKS_AT_END = 0x04;

/** Indices of the two eight-integer result-counter arrays every infliction step adds to. */
export const ResultCounter = {
  /** Statuses that took effect, class bit 0x40 clear. */
  Plain: 0,
  /** Statuses that took effect, class bit 0x40 set (Zombie, Poison, Confuse, Silence, Darkness). */
  Class40: 1,
  /** Statuses that took effect, class bit 0x20 set. */
  Class20: 2,
  /** Cleanse array only: a Death was removed (a revive). */
  Revived: 3,
  /** Any change at all (inflicted or removed). */
  Changed: 4,
  /** The target was immune. */
  Immune: 5,
  /** The status did not take effect (a roll missed, or a rule blocked it). */
  Failed: 6,
  /** Statuses that took effect, class bit 0x80 set (every bad status). */
  Bad: 7,
} as const;

/** The status part of a hit record. */
export interface StatusRecord {
  /** Rec+0x14 (u16): permanent statuses. */
  perm: number;
  /** Rec+0x07..0x13: the thirteen counters, Sleep first, Slow last. */
  counters: number[];
  /** Rec+0x16 (u16): extra statuses. */
  extra: number;
}

/** What an infliction step reads of the command record. */
export interface InflictCommand {
  /** Cmd+0x17: the command type (1 and 2 are the magic kinds Magic Booster boosts). Read by the extra step only. */
  type: number;
  /** Cmd+0x1c (u32): only bit 0x40000 (uses weapon properties) is read. */
  flagsMisc: number;
  /** Cmd+0x20: only bit 0x20 (cleanse) is read. */
  flagsDamage: number;
  /** Cmd+0x2c: the shatter chance (percent). Read by the extra step only. */
  shatter: number;
  /** Cmd+0x2e..0x46: the 25 chance bytes. */
  chances: readonly number[];
  /** Cmd+0x47..0x53: the 13 duration bytes. */
  durations: readonly number[];
}

/** The acting character, as far as infliction reads it. */
export interface InflictUser {
  /** The character id (its mode 2 stream is the one the draws come from; also the "user is the target" test). */
  id: number;
  /** Chr+0x5ac. */
  agi: number;
  /** Chr+0x65c, the user's own CTB (Threaten schedules the target right after it). */
  ctb: number;
  /** Chr+0xde8, the rank of the action in progress (Threaten's delay). */
  rank: number;
  /** Chr+0x613 and Chr+0x614. */
  haste: number;
  slow: number;
  /** Chr+0xf5c, the command id being executed (marks Death from two particular commands). */
  currentCommand: number;
  /** Chr+0x6bc (u16): bit 6 (0x40) is Magic Booster. */
  autoA: number;
  /** Chr+0x5de..0x5f6, the weapon's 25 status chances, merged when the command uses weapon properties. */
  weaponChances: readonly number[];
  /** Chr+0x5f7..0x603, the weapon's 13 durations. */
  weaponDurations: readonly number[];
}

/** The target character, as far as infliction reads it. */
export interface InflictTarget {
  /** The target's character id (equal to the user's id for a self-cast). */
  id: number;
  /** Chr+0x0c, the id byte the monster test reads. */
  chrId: number;
  /** Chr+0x641..0x659: the 25 resistance bytes. */
  resist: readonly number[];
  /** Chr+0x606: the LIVE permanent word (the record holds the snapshot this hit works on). */
  perm: number;
  /** Chr+0x608..0x614: the LIVE counters. */
  counters: readonly number[];
  /** Chr+0x616: the LIVE extra word. */
  extra: number;
  /** Chr+0x62a (u16): permanent statuses given by equipment; bits 8..11 block Confuse, Berserk, Provoke, Threaten. */
  autoPerm: number;
  /** Chr+0x62e (u16): extra statuses given by equipment. */
  autoExtra: number;
  /** Chr+0x65a (u16): immunity to extra statuses. */
  extraImmune: number;
  /** Chr+0x5b8 (u16): special bits; bit 2 is immune to Life. */
  special: number;
  /** Chr+0x65c, the target's CTB (Threaten reads it). */
  ctb: number;
  /** Chr+0x5c9: the Doom countdown a new Doom starts from. */
  doomInitial: number;
}

/** Debug switches and one battle flag the code reads. All false in normal play. */
export interface InflictFlags {
  /** VA 0x0112a90a: a roll that would fail counts as a hit (not for resistance 255 or the Threaten roll). */
  debugAlwaysHit?: boolean;
  /** VA 0x0112a91f: every status that reaches the apply step fails. */
  debugNeverHit?: boolean;
  /** VA 0x0112c9ce: a byte of the battle setup record; when set, Petrify also shatters a PARTY member. */
  petrifyShattersParty?: boolean;
}
