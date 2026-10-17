/**
 * FFX-2 script stat setter: what a boss script's `setstat` / `setstat2` writes to a character (re-parity RC9, lane X2-E; **FFX-2 only**).
 *
 * **Game case: FFX-2 only.** FFX has its own stat setter and its own stat ids; none of it is read here. Source: FFX-2.exe, Steam build
 * 25501027 (SHA-256 6EA7F142...CD69); spec: the checked note FFX2-G05 sections 1, 3 and 4.1, 4.2 and 10. The setter (live `0x639400`) was run
 * in the harness over 207,552 generated worlds against an independent port with 0 mismatches; `tests/fixtures/parity/ffx2/stat_setter.json` holds
 * 4,209 of those answers for the 43 ids below (the game's own count, changed bytes and callee calls) and `parity-ffx2-stat-setter-kernel.test.ts`
 * replays every one. Pure and deterministic, no DOM, no engine types, **no random draw** (the setter makes none; the status recompute it asks for
 * draws once for a new Poison or Regen, and that belongs to the status lane).
 *
 * **What is ported.** The setter body for the 42 stat ids the 36 compiled boss packages write through it, plus id 198, which has no case (a no-op that
 * still counts its slots). Of the setter's 333 cases that is all the shipped scripts use (891 compiled calls, `stat_setter_usage.json`). Three
 * ids the scripts also write are *helpers* the game runs after the store: 204 (the motion table), 209 and 329 (visibility and shadow, which walk
 * linked characters). They only move presentation bytes; they are declined with an error, not guessed. The follow-up routines the setter asks for
 * (the status recompute, the HP-state refresh, the SOS check, the model's effect level, `STRPOST`) are returned as {@link StatCall}s, as the harness
 * logged them: the engine's adapter (`../adapt/stat-setter.ts`) decides what each one means for its own state.
 *
 * **Group specs.** The setter turns a spec into a set of slots once, before the loop. The shipped scripts use three kinds: `chr_own` (-13, the script's
 * own character), a slot number (the default branch: slot `spec & 0xff` when that is 0 to 30, whatever its state), and a species word (0x1000 + k:
 * monster slots 15 to 30 that are in the battle, not gone, whose species word equals the spec). The other specs (`chr_all`, the party groups ...)
 * read battle globals or other bytes and no shipped script uses them: a spec in that family throws.
 */

import { s32 } from './int32.ts';

/** The ids of the stats the shipped scripts write that the engine reads or that this kernel is named after (`stat_*` in the game's header). */
export const StatId = {
  hp: 1,
  inBattle: 6,
  str: 11,
  vit: 12,
  mag: 13,
  spirit: 14,
  dex: 15,
  invincible: 90,
  autoInvinciblePhysic: 124,
  autoInvincibleMagic: 125,
  exp: 173,
  deathPattern: 211,
  cursor: 216,
  existFlag: 224,
  noDamageExeFlag: 358,
} as const;

/** `chr_own` (-13): the script's own character. */
export const GROUP_OWN = 0xfffffff3;
/** The first monster slot (a script's `chr_mon1`); the party holds slots 0 to 14. */
export const FIRST_MONSTER_SLOT = 15;
/** The last slot. */
export const LAST_SLOT = 30;
/** The spec a script gives for its n-th monster of the scene (`chr_mon1` is the slot 15): the compiled calls carry the slot number. */
export const chrMonster = (n: number): number => FIRST_MONSTER_SLOT - 1 + n;

/** How the setter cuts the written value down (FFX2-G05 3.3). */
export type StatForm = 'raw32' | 'lo8' | 'lo16' | 'bit0' | 'clamp1' | 'bitof';

/** One ported id: where the store goes and how the value is cut down. */
export interface StatRow {
  readonly id: number;
  readonly name: string;
  /** The byte offset in the character record (`Chr+offset`). */
  readonly offset: number;
  readonly width: 1 | 2 | 4;
  readonly form: StatForm;
  /** `bitof`: which bit of the byte it sets or clears. */
  readonly bit?: number;
  /** The store is followed by the status recompute (auto-status copy, `MsSetStatus` with mask 0xff, the status-effect check, the HP-state refresh). */
  readonly recompute?: true;
  /** A helper the game calls after the store: `STRPOST` (the Strength post-step) always, `EFFLV_MODEL` when the character has a model object. */
  readonly call?: 'STRPOST' | 'EFFLV_MODEL';
}

const row = (id: number, name: string, offset: number, width: 1 | 2 | 4, form: StatForm, more: Partial<StatRow> = {}): StatRow => ({ id, name, offset, width, form, ...more });

/** The plain stores, ascending by id. Ids 1 (hit points) and 211 (death pattern) are hand cases below. */
export const STAT_ROWS: readonly StatRow[] = [
  row(6, 'inBattle', 0x1784, 1, 'bit0'),
  row(11, 'str', 0x396, 1, 'clamp1', { call: 'STRPOST' }),
  row(12, 'vit', 0x397, 1, 'clamp1'),
  row(13, 'mag', 0x398, 1, 'clamp1'),
  row(14, 'spirit', 0x399, 1, 'clamp1'),
  row(15, 'dex', 0x39a, 1, 'clamp1'),
  row(90, 'invincible', 0x4c5, 1, 'lo8', { recompute: true }),
  row(124, 'autoInvinciblePhysic', 0x547, 1, 'lo8', { recompute: true }),
  row(125, 'autoInvincibleMagic', 0x548, 1, 'lo8', { recompute: true }),
  row(173, 'exp', 0x69c, 4, 'raw32'),
  row(193, 'attackNormalFrame', 0x78e, 2, 'lo16'),
  row(194, 'motionNum', 0x75f, 1, 'lo8'),
  row(195, 'attackIncSpeed', 0x794, 1, 'lo8'),
  row(196, 'attackDecSpeed', 0x795, 1, 'lo8'),
  row(197, 'round', 0x796, 2, 'lo16'),
  row(202, 'effectHitNum', 0x14fc, 1, 'lo8'),
  row(203, 'motionType', 0x758, 4, 'raw32'),
  row(205, 'idle2Prob', 0x75e, 1, 'lo8'),
  row(207, 'disableMoveFlag', 0x2ee, 1, 'bit0'),
  row(208, 'disableJumpFlag', 0x2ef, 1, 'bit0'),
  row(216, 'cursor', 0x1796, 1, 'bit0'),
  row(222, 'efflv', 0x1664, 4, 'raw32', { call: 'EFFLV_MODEL' }),
  row(224, 'existFlag', 0x1788, 1, 'bit0'),
  row(234, 'action', 0x1789, 1, 'bit0'),
  row(257, 'autoCameraFlag', 0x178a, 1, 'bit0'),
  row(258, 'autoPosFlag', 0x178b, 1, 'bit0'),
  row(325, 'hitEffectOffFlag', 0x164b, 1, 'bit0'),
  row(333, 'invPhysicMotion', 0x2ec, 1, 'bitof', { bit: 0 }),
  row(334, 'invMagicMotion', 0x2ec, 1, 'bitof', { bit: 1 }),
  row(336, 'soundHitNumCritical', 0x14fb, 1, 'lo8'),
  row(337, 'magicEffectGround', 0x1652, 2, 'lo16'),
  row(338, 'magicEffectWater', 0x1654, 2, 'lo16'),
  row(344, 'soundHitNum', 0x14f8, 1, 'lo8'),
  row(345, 'damageNumPos', 0x304, 4, 'raw32'),
  row(351, 'motionTypeMonster', 0x5b, 1, 'lo8'),
  row(353, 'dist', 0x5ac, 1, 'lo8'),
  row(355, 'titlePos', 0x308, 4, 'raw32'),
  row(358, 'noDamageExeFlag', 0xe6f, 1, 'lo8'),
  row(363, 'deathPatternFriend', 0x2d9, 1, 'lo8'),
  row(364, 'motionIdleType', 0x5c, 1, 'bit0'),
];

/** The ids the shipped scripts write that this kernel does not port: the setter's helpers (204 the attack motion table, 209 and 329 visibility and shadow). */
export const HELPER_STAT_IDS: readonly number[] = [204, 209, 329];
/** The id with no case in the setter: a write does nothing, but its slots are still counted (written by the attack macros of five boss packages). */
export const NO_CASE_STAT_IDS: readonly number[] = [198];

const ROW_BY_ID: ReadonlyMap<number, StatRow> = new Map(STAT_ROWS.map((r) => [r.id, r]));

/** Where the hand cases write. */
export const HP_OFFSET = 0x3b4;
export const APPLIED_STATUS_OFFSET = 0x450;
export const DEATH_PATTERN_OFFSET = 0x2d8;
export const DEATH_PATTERN_REVIVE_OFFSET = 0x2da;

/** The bytes of the character records the setter reads. Every read names its offset, so a reader that lacks a field fails loudly. */
export interface StatWorld {
  u8(slot: number, offset: number): number;
  u16(slot: number, offset: number): number;
  u32(slot: number, offset: number): number;
}

/** One store: `value` is the unsigned value of the `width` bytes at `Chr+offset` of the slot's record. */
export interface StatWrite {
  readonly slot: number;
  readonly offset: number;
  readonly width: 1 | 2 | 4;
  readonly value: number;
}

/**
 * A routine the setter asks for after a store, with its first two arguments as the harness logged them (pointers to a character record are the
 * slot number here). AUTOCOPY(slot, 1), MSSETSTATUS(slot, 255), STATUSEFFECTCHECK(slot, slot) and HPSTATE(slot, 0xffffffff) are the status recompute; SOS(slot, slot) is the
 * low-HP check; STRPOST(slot, 0); EFFLV_MODEL(model object, the value).
 */
export interface StatCall {
  readonly name: 'AUTOCOPY' | 'MSSETSTATUS' | 'STATUSEFFECTCHECK' | 'HPSTATE' | 'SOS' | 'STRPOST' | 'EFFLV_MODEL';
  readonly a: number;
  readonly b: number;
}

/** What one call of the setter did: the number of slots it visited (also for an id with no case), the stores in slot order, and the routines it asked for in the order it asked. */
export interface StatResult {
  readonly count: number;
  readonly writes: StatWrite[];
  readonly calls: StatCall[];
}

/** The value the setter stores for a form (FFX2-G05 3.3). `clamp1` is the signed clamp to 1..255: 0, a negative number and 0xFFFFFFFF all store 1. */
export function storedValue(form: Exclude<StatForm, 'bitof'>, value: number): number {
  switch (form) {
    case 'raw32':
      return value >>> 0;
    case 'lo8':
      return value & 0xff;
    case 'lo16':
      return value & 0xffff;
    case 'bit0':
      return value & 1;
    case 'clamp1': {
      const v = s32(value);
      return v < 1 ? 1 : v > 255 ? 255 : v;
    }
  }
}

/** A species word group spec: 0x1000 to 0x1fff (the high bits are tested as `(spec & 0xfffff000) == 0x1000`). */
const isSpeciesSpec = (spec: number): boolean => (spec & 0xfffff000) >>> 0 === 0x1000;

/**
 * The slots a spec names, ascending (the builder at live `0x6117b0`, FFX2-G05 3.2): `chr_own` is the owner when its slot is below 31; a species word is
 * every monster slot (15 to 30) in the battle, not gone, whose species word equals it; any other value that is not one of the named negative specs is
 * a slot number by its low byte (0 to 30 whatever the slot's state, 31 and up nobody).
 */
export function groupSlots(world: StatWorld, owner: number, spec: number): number[] {
  const s = spec >>> 0;
  if (isSpeciesSpec(s)) {
    const slots: number[] = [];
    for (let slot = FIRST_MONSTER_SLOT; slot <= LAST_SLOT; slot += 1) {
      if (world.u8(slot, 0x1784) !== 0 && world.u8(slot, 0x1792) === 0 && world.u16(slot, 0xe) === s) slots.push(slot);
    }
    return slots;
  }
  if (s === GROUP_OWN) return (owner & 0xff) < 0x1f ? [owner & 0x1f] : [];
  const signed = s32(s);
  if (signed < 0 && signed >= -31) throw new Error(`stat setter: group spec ${signed} is not one the shipped scripts use (own, a slot number, a species word)`);
  return (s & 0xff) > 0x1e ? [] : [s & 0x1f];
}

const isMonsterSlot = (slot: number): boolean => slot >= FIRST_MONSTER_SLOT && slot <= LAST_SLOT;

/** The status recompute the setter runs after a store that asks for it. */
function recompute(slot: number, calls: StatCall[]): void {
  calls.push({ name: 'AUTOCOPY', a: slot, b: 1 });
  calls.push({ name: 'MSSETSTATUS', a: slot, b: 0xff });
  calls.push({ name: 'STATUSEFFECTCHECK', a: slot, b: slot });
  calls.push({ name: 'HPSTATE', a: slot, b: 0xffffffff });
}

/**
 * `btlSetStat(group, id, value)` as the script command runs it (live `0x639400`): `owner` is the script's own slot (0 to 30). The group becomes a set of slots once;
 * the loop visits them in ascending order and, for each, stores the value cut down by the id and then asks for the id's follow-up. Returns the stores and
 * the asked routines; the caller applies them. Throws for an id the shipped scripts do not write (a helper, or one of the 290 other cases).
 */
export function setStat(world: StatWorld, owner: number, id: number, spec: number, value: number): StatResult {
  const slots = groupSlots(world, owner, spec);
  const writes: StatWrite[] = [];
  const calls: StatCall[] = [];
  const plain = ROW_BY_ID.get(id);
  if (plain === undefined && id !== StatId.hp && id !== StatId.deathPattern && !NO_CASE_STAT_IDS.includes(id)) {
    throw new Error(`stat setter: stat id ${id} is not one the shipped scripts write${HELPER_STAT_IDS.includes(id) ? ' (a helper that only moves presentation bytes)' : ''}`);
  }
  for (const slot of slots) {
    if (id === StatId.hp) {
      // Raw 32 bits, no clamp to the maximum. A value of 1 or more on a character whose applied status has the Death bit clears that bit (an in-place revival); the KO routine is not run.
      writes.push({ slot, offset: HP_OFFSET, width: 4, value: value >>> 0 });
      const applied = world.u8(slot, APPLIED_STATUS_OFFSET);
      const revives = (applied & 1) !== 0 && s32(value) >= 1;
      if (revives) {
        writes.push({ slot, offset: APPLIED_STATUS_OFFSET, width: 1, value: applied & 0xfe });
        recompute(slot, calls);
      }
      calls.push({ name: 'SOS', a: slot, b: slot });
      calls.push({ name: 'HPSTATE', a: slot, b: 0xffffffff });
    } else if (id === StatId.deathPattern) {
      // Monsters only: the live pattern and the one a revive restores. A party slot is left alone.
      if (isMonsterSlot(slot)) {
        writes.push({ slot, offset: DEATH_PATTERN_OFFSET, width: 1, value: value & 0xff });
        writes.push({ slot, offset: DEATH_PATTERN_REVIVE_OFFSET, width: 1, value: value & 0xff });
      }
    } else if (plain !== undefined) {
      if (plain.form === 'bitof') {
        const old = world.u8(slot, plain.offset);
        const mask = 1 << (plain.bit ?? 0);
        writes.push({ slot, offset: plain.offset, width: 1, value: (value & 1) !== 0 ? old | mask : old & ~mask & 0xff });
      } else {
        writes.push({ slot, offset: plain.offset, width: plain.width, value: storedValue(plain.form, value) });
      }
      if (plain.recompute === true) recompute(slot, calls);
      if (plain.call === 'STRPOST') calls.push({ name: 'STRPOST', a: slot, b: 0 });
      if (plain.call === 'EFFLV_MODEL') {
        const model = world.u32(slot, 0);
        if (model !== 0) calls.push({ name: 'EFFLV_MODEL', a: model, b: value >>> 0 });
      }
    }
  }
  return { count: slots.length, writes, calls };
}
