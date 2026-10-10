/**
 * FFX-2 stat builder, part 3: the recompute of one girl's save record -- the function the game runs at start-up, whenever a
 * menu changes her dressphere, grid or accessories, and on every dress change in battle.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), function 0x0060e2d0 and what it
 * calls.  Spec: `research/re-ffx2-dressphere.md` section 1.  Pure, deterministic, no DOM, no engine types.  Not wired into
 * the engine.
 *
 * What it reads: the record's experience, dressphere, grid, two accessories, bonus fields and last-built dressphere; what it
 * writes: next-level threshold, level sync byte, the three ability words, the maxima, the eight stat bytes, the pools (only
 * when the dressphere differs from the last one built) and the last-built dressphere.  The battle copy is made later by
 * `MsSetRamChrParam` (exe 0x00627590): see `battleStatBytes` here.
 */

import { abilityList, abilityWords, bonusBlock, plateIdOf, type Ffx2AbilityEnv } from './dressphere-abilities.ts';
import { jobGrowth } from './dressphere-growth.ts';
import {
  calculateStatsFor,
  finalStats,
  girlIndex,
  girlJob,
  isSpecialJob,
  keepRatioSave,
  saveLevel,
} from './dressphere-stats.ts';
import { clampInt } from './intops.ts';

/** The fields of a party member's save record (0x80 bytes at VA 0x00e006c0 + 0x80 * id) that the recompute touches. */
export interface Ffx2SaveRecord {
  hp: number;
  mp: number;
  maxHp: number;
  maxMp: number;
  /** u32 `+4`, `+8`: added to the dressphere's HP and MP. */
  hpBonus: number;
  mpBonus: number;
  /** Eight bytes `+0xc` .. `+0x13`: Strength, Defense, Magic, Magic Defense, Agility, Luck, Evasion, Accuracy. */
  bonus: number[];
  exp: number;
  nextExp: number;
  /** The final stat bytes `+0x2d` .. `+0x34`: Strength, Defense, Magic, Magic Defense, Agility, Accuracy, Evasion, Luck. */
  stats: number[];
  /** u16 `+0x36`: the dressphere (as stored, any of the girl's generic ids). */
  job: number;
  /** u16 `+0x38`: the garment grid; 0xff is none. */
  plate: number;
  /** u16 `+0x3a`, `+0x3c`. */
  accessories: [number, number];
  /** Byte `+0x35`: the highest level the player-side monsters' per-level gains have been applied up to. */
  levelSync: number;
  /** u16 `+0x56`: the dressphere the stats were last built for. */
  lastJob: number;
  /** u16 `+0x50`, `+0x52`, `+0x54`: the OR of the listed abilities' words. */
  words: [number, number, number];
}

export interface Ffx2RecalcEnv {
  readonly learned: (id: number) => boolean;
  readonly keyItem: (bit: number) => boolean;
  readonly gateSlots: readonly number[];
}

/** What the recompute also decided, besides the record. */
export interface Ffx2RecalcResult {
  readonly rec: Ffx2SaveRecord;
  readonly level: number;
  /** The dressphere used (`0x5000 | index`, the girl's own variant). */
  readonly job: number;
  readonly abilities: readonly number[];
  readonly block: readonly number[];
  /**
   * The level reads the experience of record `girlIndex(chr)`, and the next-level threshold is written back there: for a
   * child record (ids 3 to 8) that is its parent's record, not its own.  Set only in that case.
   */
  readonly parentNextExp?: { readonly record: number; readonly value: number };
}

/**
 * The recompute of party member `chr` (0 Yuna, 1 Rikku, 2 Paine; a child record 3 to 8 also reads its parent's experience, which
 * the caller passes as `parentExp`).  A Special dressphere's pods are separate battle bodies; a pod worn by `chr` is rebuilt
 * from `chr`'s own record like any other dressphere.
 */
export function recalcSaveRecord(chr: number, rec: Ffx2SaveRecord, env: Ffx2RecalcEnv, parentExp?: number): Ffx2RecalcResult {
  const out: Ffx2SaveRecord = { ...rec, bonus: [...rec.bonus], stats: [...rec.stats], accessories: [...rec.accessories], words: [0, 0, 0] };
  const parent = girlIndex(chr);
  const own = parent === (chr & 0xff);
  const lv = saveLevel(chr, own ? rec.exp : (parentExp ?? 0));
  if (own && lv.nextExp !== undefined) out.nextExp = lv.nextExp;
  const job = girlJob(chr, rec.job);
  out.levelSync = Math.max(rec.levelSync, lv.level);

  const base = calculateStatsFor(lv.level, job, { hp: rec.hpBonus, mp: rec.mpBonus, bytes: rec.bonus }).stats;

  const abilityEnv: Ffx2AbilityEnv = { level: lv.level, learned: env.learned, keyItem: env.keyItem, gateSlots: env.gateSlots };
  const plateId = plateIdOf(rec.plate);
  const abilities = abilityList({ job, plateId, accessories: rec.accessories, env: abilityEnv });
  out.words = abilityWords(abilities);

  const special = isSpecialJob(job, true);
  const block = bonusBlock({ accessories: rec.accessories, abilities, plateId, special });
  const s = finalStats({
    base,
    block,
    special,
    hpLimitBroken: (out.words[0] & 0x4000) !== 0,
    mpLimitBroken: (out.words[0] & 0x8000) !== 0,
  });
  out.maxHp = s.maxHp;
  out.maxMp = s.maxMp;
  out.stats = [s.str, s.def, s.mag, s.mdef, s.agi, s.acc, s.eva, s.lck];

  const pools = keepRatioSave(out, rec.maxHp, rec.maxMp, (rec.lastJob & 0xffff) !== job);
  out.hp = pools.hp;
  out.mp = pools.mp;
  out.lastJob = job;
  const parentNextExp = !own && lv.nextExp !== undefined ? { record: parent, value: lv.nextExp } : undefined;
  return { rec: out, level: lv.level, job, abilities, block, ...(parentNextExp ? { parentNextExp } : {}) };
}

/**
 * `MsSetRamChrParam` (exe 0x00627590): the battle character's stat bytes are the record's bytes plus the script-adjust bytes
 * (`Chr+0x39e` .. `+0x3a5`, signed, written only by battle scripts through stat ids 0x13 to 0x1a), clamped to 1..255
 * (Evasion 0..255).  Order of the eight: Strength, Defense, Magic, Magic Defense, Agility, Luck, Evasion, Accuracy.
 */
export function battleStatBytes(stats: readonly number[], adjust: readonly number[]): Ffx2Battle8 {
  const a = (k: number): number => (adjust[k] ?? 0) << 24 >> 24;
  const st = (k: number): number => stats[k] as number;
  return {
    str: clampInt(st(0) + a(0), 1, 255),
    def: clampInt(st(1) + a(1), 1, 255),
    mag: clampInt(st(2) + a(2), 1, 255),
    mdef: clampInt(st(3) + a(3), 1, 255),
    agi: clampInt(st(4) + a(4), 1, 255),
    lck: clampInt(st(7) + a(5), 1, 255),
    eva: clampInt(st(6) + a(6), 0, 255),
    acc: clampInt(st(5) + a(7), 1, 255),
  };
}

export interface Ffx2Battle8 {
  readonly str: number;
  readonly def: number;
  readonly mag: number;
  readonly mdef: number;
  readonly agi: number;
  readonly lck: number;
  readonly eva: number;
  readonly acc: number;
}

/** What `MsSetRamChrParam` hands the battle character from the save record. */
export interface Ffx2BattleParam {
  readonly hp: number;
  readonly mp: number;
  readonly maxHp: number;
  readonly maxMp: number;
  /** `Chr+0x38c` / `+0x390`: the record's maxima, before Double HP and the caps of the battle recompute. */
  readonly baseMaxHp: number;
  readonly baseMaxMp: number;
  readonly bytes: Ffx2Battle8;
  readonly words: readonly [number, number, number];
  /** `Chr+0x656`: the dressphere's Attack command (Berserk and the counter-attack use it); null for a dressphere with no record. */
  readonly attackCommand: number | null;
  /** `Chr+0x66f`: the worn dressphere is a Special (main unit or pod). */
  readonly special: boolean;
}

/**
 * `MsSetRamChrParam` (exe 0x00627590) for party member `chr`: the pools and maxima are copied as they are (no clamping: a record
 * with HP above its maximum gives a character with HP above its maximum until the maximum recompute runs), the three ability
 * words are copied, the stat bytes are `battleStatBytes`, and the character learns its dressphere's Attack command and whether it
 * wears a Special.  Nothing here recomputes a stat.
 */
export function setRamChrParam(chr: number, rec: Ffx2SaveRecord, adjust: readonly number[]): Ffx2BattleParam {
  const job = girlJob(chr, rec.job);
  return {
    hp: rec.hp,
    mp: rec.mp,
    maxHp: rec.maxHp,
    maxMp: rec.maxMp,
    baseMaxHp: rec.maxHp,
    baseMaxMp: rec.maxMp,
    bytes: battleStatBytes(rec.stats, adjust),
    words: [rec.words[0], rec.words[1], rec.words[2]],
    attackCommand: jobGrowth(job)?.attackCommand ?? null,
    special: isSpecialJob(job, true),
  };
}
