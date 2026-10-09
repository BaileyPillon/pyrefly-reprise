/**
 * FFX-2 auto-abilities, what they do to a battle character: element affinities, status wards and touches, the statuses they keep
 * on, the SOS statuses that wait for low HP, and cast-speed entries.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), function 0x00626a20 (D: 0x00626a50),
 * the cast-speed entry writer 0x00627d60 and the rows of `battle/kernel/a_ability.bin`.  Spec: `research/re-ffx2-dressphere.md`
 * section 4.  Pure, deterministic, no DOM, no engine types.  Not wired into the engine.
 *
 * The tables start from zeros (the character set-up clears them, 0x00627590) and every listed ability adds into them.  Table
 * offsets are into the battle character: the five element bytes at `Chr+0x3af` .. `+0x3b3`, the weapon-status chances `+0x3bc`,
 * `+0x3d4`, `+0x3ec`, the wards `+0x404` (group 1) and `+0x41c` (group 2), the kept statuses `+0x534` with turn counts `+0x538`, the SOS set
 * `+0x518` with counts `+0x51c` and the flag byte `+0x66c`, the cast-speed entries `+0x5af` (count), `+0x5b0` (ids), `+0x5b8` (percents).
 */

import { abilityEffects, type Ffx2AbilityEffects, type Ffx2StatusEntry } from './ability-effects-data.ts';
import { STATUS2_INFO } from './statusTypes.ts';

/** The tables the abilities write. */
export interface Ffx2ChrTables {
  /** Weapon element, absorb, null, half, weak. */
  elements: number[];
  castCount: number;
  castIds: number[];
  castPercents: number[];
  touch1: number[];
  touch2: number[];
  times: number[];
  ward1: number[];
  ward2: number[];
  autoMask1: number;
  autoTimes: number[];
  sosMask1: number;
  sosTimes: number[];
  sosFlag: number;
}

const zeros = (n: number): number[] => new Array<number>(n).fill(0);

/** An empty set of tables, as a freshly set-up character has. */
export function emptyChrTables(): Ffx2ChrTables {
  return {
    elements: zeros(5),
    castCount: 0,
    castIds: zeros(4),
    castPercents: zeros(4),
    touch1: zeros(24),
    touch2: zeros(24),
    times: zeros(24),
    ward1: zeros(24),
    ward2: zeros(24),
    autoMask1: 0,
    autoTimes: zeros(24),
    sosMask1: 0,
    sosTimes: zeros(24),
    sosFlag: 0,
  };
}

const s8 = (v: number): number => (v << 24) >> 24;

/** 0xfe-saturating add of two unsigned bytes where 0xfe or more is a ceiling that wins (weapon-status chances). */
function addTouch1(cur: number, v: number): number {
  if (cur < 0xfe && v < 0xfe) return Math.min(cur + v, 0xfd);
  return cur < v ? v : cur;
}

/** Same with 0xff the ceiling (wards): 255 is immunity and stays. */
function addWard(cur: number, v: number): number {
  if (cur < 0xff && v < 0xff) return Math.min(cur + v, 0xfe);
  return cur < v ? v : cur;
}

/** The group-2 weapon chance: `cur` is an unsigned byte, `v` a signed byte; a sum below 0 becomes 0, above 0xfd becomes 0xfd. */
function addTouch2(cur: number, v: number): number {
  if (cur < 0xfe && v < 0xfe) {
    const s = v + cur;
    return s < 0 ? 0 : s > 0xfd ? 0xfd : s;
  }
  return cur < v ? v : cur;
}

/** The stored byte of a turn-count accumulation: `[lo, hi]` is [-10, 10] for a stage and [0, 125] for a counted status. */
function lohi(status: number): [number, number] {
  return (STATUS2_INFO[status] ?? 0) & 4 ? [0, 0x7d] : [-10, 10];
}

/** The turn-count table (`Chr+0x3ec`, an unsigned-byte table). */
function addTimeU(cur: number, v: number, lo: number, hi: number): number {
  if (hi < cur || hi < v) return cur < v ? v : cur;
  const s = v + cur;
  return Math.min(Math.max(s, lo), hi);
}

/** The kept-status turn counts (`Chr+0x538`, `+0x51c`, signed bytes). */
function addTimeS(cur: number, v: number, lo: number, hi: number): number {
  if (hi < cur || hi < v) return cur < v ? v : cur;
  return Math.min(Math.max(v + cur, lo), hi);
}

/** `0x00627d60`: add (id, percent) to the up-to-four cast-speed entries; the same id adds its percent (kept within -100..100). */
function addCast(t: Ffx2ChrTables, id: number, percent: number): void {
  if (id === 0 || percent === 0) return;
  const at = t.castIds.slice(0, t.castCount).indexOf(id);
  if (at >= 0) {
    const p = s8(t.castPercents[at] as number) + percent;
    t.castPercents[at] = p > -101 ? (p > 100 ? 100 : p) & 0xff : 0x9c;
    return;
  }
  if (t.castCount < 4) {
    t.castIds[t.castCount] = id;
    t.castPercents[t.castCount] = percent & 0xff;
    t.castCount += 1;
  }
}

/**
 * `0x00626a20`: apply a list of auto-abilities (the output of `abilityList`) to a character's tables, in list order.  For each
 * row: the five element bytes are ORed; the cast-speed entry is added; the group-1 weapon chance, group-2 weapon chance, turn counts and
 * the two ward tables accumulate with the saturating rules above; then the kept statuses: an ordinary row ORs its group-1 mask into
 * `autoMask1` and combines its turn counts into `autoTimes` for every group-2 status it names, while an SOS row (special bit 0) sets the
 * flag byte and does the same into the SOS set.  Note that the first mask is the GROUP-1 mask at `+0x84` for both rows, and the
 * group-2 mask at `+0x88` selects which counts are combined.  `rowOf` supplies the rows (the real table by default; the golden vectors
 * with synthetic rows, which reach every saturation rule that the real rows cannot, pass their own).
 */
export function applyAbilityEffects(
  list: readonly number[],
  t: Ffx2ChrTables = emptyChrTables(),
  rowOf: (id: number) => Ffx2AbilityEffects | undefined = abilityEffects,
): Ffx2ChrTables {
  for (const id of list) {
    if (id === 0 || id === 0xff) continue;
    const e = rowOf(id);
    if (!e) continue;
    for (let k = 0; k < 5; k++) t.elements[k] = (t.elements[k] as number) | (e.elements[k] as number);
    addCast(t, e.castType, e.castPercent);
    const full = (list: readonly Ffx2StatusEntry[]): number[] => {
      const a = zeros(24);
      for (const [k, v] of list) a[k] = v & 0xff;
      return a;
    };
    const t1 = full(e.touch1);
    const t2 = full(e.touch2);
    const tm = full(e.times);
    const w1 = full(e.ward1);
    const w2 = full(e.ward2);
    for (let k = 0; k < 24; k++) {
      t.touch1[k] = addTouch1(t.touch1[k] as number, t1[k] as number);
      t.touch2[k] = addTouch2(t.touch2[k] as number, s8(t2[k] as number)) & 0xff;
      const [lo, hi] = lohi(k);
      t.times[k] = addTimeU(t.times[k] as number, s8(tm[k] as number), lo, hi) & 0xff;
      t.ward1[k] = addWard(t.ward1[k] as number, w1[k] as number);
      t.ward2[k] = addWard(t.ward2[k] as number, w2[k] as number);
    }
    if (!e.sos) {
      t.autoMask1 |= e.auto1;
      for (let k = 0; k < 24; k++) {
        if (((e.auto2 >>> k) & 1) === 0) continue;
        const [lo, hi] = lohi(k);
        t.autoTimes[k] = addTimeS(s8(t.autoTimes[k] as number), s8(tm[k] as number), lo, hi) & 0xff;
      }
    } else {
      t.sosFlag = 1;
      t.sosMask1 |= e.auto1;
      for (let k = 0; k < 24; k++) {
        if (((e.auto2 >>> k) & 1) === 0) continue;
        const [lo, hi] = lohi(k);
        t.sosTimes[k] = addTimeS(s8(t.sosTimes[k] as number), s8(tm[k] as number), lo, hi) & 0xff;
      }
    }
  }
  return t;
}
