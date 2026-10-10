/**
 * Adapters between the emulator vectors of the FFX-2 dressphere / stat-builder functions
 * (`tests/fixtures/parity/ffx2/dressphere_*.json`, format `ffx2-kernel-check/1`) and the inputs of the kernels in
 * `src/battle/ffx2/kernel/dressphere-*.ts`, `spherechange.ts`, `auto-ability.ts` and `ability-effects.ts`.
 *
 * A vector's `in` describes the game state the real function was run on (save record fields, the mastery flags, key items,
 * gate slots); these helpers turn it into the kernel's inputs, so the vectors check the adapters as well as the kernels.
 * Game case: FFX-2 only.
 */

import { abilityRow } from '../../../src/battle/ffx2/kernel/dressphere-rows.ts';
import type { Ffx2RecalcEnv, Ffx2SaveRecord } from '../../../src/battle/ffx2/kernel/dressphere-recalc.ts';
import type { Rec } from './ffx2AtbAdapters.ts';

/**
 * Command ids (0x3000 ..) whose AP cost is 0, so the game counts them as mastered with no AP at all: asked of the real mastery
 * test 0x0060c4d0 with every AP word clear.  The last range also covers ids past the end of the command table, which read row 0.
 */
export const FREE_COMMAND_RANGES: readonly (readonly [number, number])[] = [
  [0x3000, 0x301e],
  [0x3025, 0x302b],
  [0x317c, 0x3180],
  [0x3182, 0x31e5],
  [0x31f0, 0x31f3],
  [0x3212, 0x32ff],
];

/** Yuna's experience at the start of level 20: T(19) = ((14*20 + 20) * 19 * 19) / 10 = 108,300 / 10 = 10,830. */
export const YUNA_LEVEL_20 = 10830;

/** The eight gate-ability slots of a girl who has crossed nothing (0xff = empty). */
export const emptyGateSlots = (): number[] => new Array<number>(8).fill(0xff);

/** A save record with nothing set: a Gunner with no grid and no accessories, unless a test says otherwise. */
export function blankRecord(over: Partial<Ffx2SaveRecord> = {}): Ffx2SaveRecord {
  return {
    hp: 0,
    mp: 0,
    maxHp: 0,
    maxMp: 0,
    hpBonus: 0,
    mpBonus: 0,
    bonus: [0, 0, 0, 0, 0, 0, 0, 0],
    exp: 0,
    nextExp: 0,
    stats: [0, 0, 0, 0, 0, 0, 0, 0],
    job: 0x5001,
    plate: 0xff,
    accessories: [0xffff, 0xffff],
    levelSync: 0,
    lastJob: 0x5001,
    words: [0, 0, 0],
    ...over,
  };
}

/**
 * "Mastered" as the game decides it (0x0060c4d0): the AP word has reached the cost.  A vector either gives everything full AP
 * (`learn: 'all'`) or lists the abilities and commands that have it; every other id is mastered only when its cost is 0 -- 28 of
 * the 162 auto-abilities, the command ranges above, and every category-4 id (no AP table behind them).
 */
export function learnedOf(i: Rec): (id: number) => boolean {
  if (i['learn'] === 'all') return () => true;
  const chosen = new Set<number>([...((i['learned'] as number[] | undefined) ?? []), ...((i['learnedCmds'] as number[] | undefined) ?? [])]);
  return (id) => {
    if (chosen.has(id)) return true;
    const cat = id >> 12;
    if (cat === 8) return abilityRow(id).ap === 0;
    if (cat === 4) return true;
    if (cat === 3) return FREE_COMMAND_RANGES.some(([lo, hi]) => id >= lo && id <= hi);
    return false;
  };
}

/** The key-item test of a vector: a list of item numbers, or the word 'all' (every one of 0..127 held). */
export function keyItemsOf(i: Rec): (bit: number) => boolean {
  const k = i['keyItems'];
  if (k === 'all') return () => true;
  const set = new Set<number>(k as number[]);
  return (b) => set.has(b);
}

/** The recompute environment of a recalc / refresh vector. */
export function recalcEnvOf(i: Rec): Ffx2RecalcEnv {
  const slots = [...(i['gateArray'] as number[]), ...new Array<number>(8).fill(0xff)].slice(0, 8);
  return { learned: learnedOf(i), keyItem: keyItemsOf(i), gateSlots: slots };
}

/** The save record of a recalc vector (the fields the recompute reads; the outputs start at their pre-call values). */
export function saveRecordOf(i: Rec): Ffx2SaveRecord {
  return {
    hp: i['hp'] as number,
    mp: i['mp'] as number,
    maxHp: i['maxhp'] as number,
    maxMp: i['maxmp'] as number,
    hpBonus: i['hpBonus'] as number,
    mpBonus: i['mpBonus'] as number,
    bonus: [...(i['bonus'] as number[])],
    exp: i['exp'] as number,
    nextExp: 0x5a5a5a5a,
    stats: [0, 0, 0, 0, 0, 0, 0, 0],
    job: i['job'] as number,
    plate: i['plate'] as number,
    accessories: [...(i['acc'] as [number, number])],
    levelSync: i['lvSync'] as number,
    lastJob: i['lastJob'] as number,
    words: [0, 0, 0],
  };
}

/** The save record of an in-battle refresh vector (the record's own pools are the `rec*` fields). */
export function refreshRecordOf(i: Rec): Ffx2SaveRecord {
  return {
    hp: i['recHp'] as number,
    mp: i['recMp'] as number,
    maxHp: i['recMaxHp'] as number,
    maxMp: i['recMaxMp'] as number,
    hpBonus: i['hpBonus'] as number,
    mpBonus: i['mpBonus'] as number,
    bonus: [...(i['bonus'] as number[])],
    exp: i['exp'] as number,
    nextExp: 0,
    stats: [0, 0, 0, 0, 0, 0, 0, 0],
    job: i['job'] as number,
    plate: i['plate'] as number,
    accessories: [...(i['acc'] as [number, number])],
    levelSync: 0,
    lastJob: i['lastJob'] as number,
    words: [0, 0, 0],
  };
}

/** 32-bit FNV-1a of the JSON text of a value: the digest the table tests compare. */
export function fnv1a(value: unknown): number {
  let h = 0x811c9dc5;
  for (const ch of JSON.stringify(value)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
