/**
 * The search half of the independent oracle of `parity-ffx-engine-k-orders*.test.ts` (re-parity lane FFX-K, the Sisters' orders of 2026-10-15; **FFX only**): the Magus Sisters'
 * target search written out again from the note (`research/re-ffx-zanmato-and-orders.md` Part 2 sections 9 and 10), with NO import of the kernels or the adapters: the commands'
 * facts as the note lists them, the candidate sets, the usable test, the nine property tests and the raw draws. The handlers are in `ffxSisterOracle.ts`.
 */

export type Who = 'cindy' | 'sandy' | 'mindy';
export const SLOT: Readonly<Record<Who, number>> = { cindy: 15, sandy: 16, mindy: 17 };
export const tdiv = (a: number, b: number): number => Math.trunc(a / b);

/** One command's facts the search reads, written from the note's list: reach, the dead-target bit, target type, silenceable, MP cost, Overdrive cost. */
interface Facts {
  reach: number;
  dead?: true;
  type: 'single' | 'group' | 'self';
  silence?: true;
  mp: number;
  od?: number;
}
const sp = (mp: number, extra: Partial<Facts> = {}): Facts => ({ reach: 3, type: 'single', silence: true, mp, ...extra });
const MELEE: Facts = { reach: 0, type: 'single', mp: 0 };
export const FACTS: Readonly<Record<number, Facts>> = {
  0x3000: MELEE, 0x30e5: MELEE, 0x30e7: MELEE, 0x30e9: MELEE,
  0x3019: { reach: 3, type: 'group', mp: 0 }, // Pray
  0x3020: { reach: 3, type: 'single', mp: 0 }, // Lancet
  0x302b: sp(4), 0x302c: sp(10), 0x302d: sp(20), // Cure, Cura, Curaga
  0x3034: sp(18, { dead: true }), 0x3035: sp(60, { dead: true }), // Life, Full-Life
  0x3036: sp(8), 0x303a: sp(10), 0x303b: sp(12), 0x303c: sp(14), 0x3040: sp(97), // Haste, Shell, Protect, Reflect, Auto-Life
  0x3045: sp(8), 0x3046: sp(8), 0x3047: sp(8), 0x3048: sp(8), 0x3049: sp(16), 0x304a: sp(16), 0x304b: sp(16), 0x304c: sp(16), // Fira..Watera, Firaga..Waterga
  0x304d: sp(10), 0x304f: sp(20), 0x3050: sp(12), 0x3051: sp(0), 0x3052: sp(54), // Bio, Death, Drain, Osmose, Flare
  0x3053: sp(90, { type: 'group' }), // Ultima
  0x30ea: { reach: 1, type: 'group', mp: 0, od: 20 }, // Delta Attack
  0x312c: { reach: 3, type: 'self', mp: 0 },
  0x312d: { reach: 3, type: 'group', mp: 4 }, // NulAll
};

/** A sister as the search sees her. */
export interface OSister {
  hp: number;
  maxHp: number;
  mp: number;
  dead?: boolean;
  targetable?: boolean;
  silence?: boolean;
  curse?: boolean;
  /** Her gauge in the bar's points (20 is full). */
  gauge?: number;
  autoLife?: boolean;
  shell?: boolean;
  protect?: boolean;
  haste?: boolean;
  reflect?: boolean;
  /** The four Nul counters set (Tide, Blaze, Shock, Frost all). */
  allNul?: boolean;
}
export interface OMonster {
  slot: number;
  distance?: number;
  targetable?: boolean;
  dead?: boolean;
}
export interface OWorld {
  sisters: Record<Who, OSister>;
  monsters: OMonster[];
}

const isMonster = (s: number): boolean => s >= 0x14 && s <= 0x1b;

/** The slots of a world, in ascending order, with what the search needs of each. */
function chars(w: OWorld): Map<number, { sister?: OSister; monster?: OMonster }> {
  const m = new Map<number, { sister?: OSister; monster?: OMonster }>();
  for (const who of ['cindy', 'sandy', 'mindy'] as const) m.set(SLOT[who], { sister: w.sisters[who] });
  for (const mo of w.monsters) m.set(mo.slot, { monster: mo });
  return m;
}

/** The candidate set of targeting code T (0 the monsters, 1 her own side, 0x101 her side without her, 0x200 + k slot k alone). */
export function candidates(w: OWorld, actor: number, cmd: number, T: number): number[] {
  const f = FACTS[cmd]!;
  const all = chars(w);
  let base: number[];
  if ((T & 0x200) !== 0) base = [T & 0xff];
  else base = [...all.keys()].filter((s) => (T === 0 ? isMonster(s) : !isMonster(s)));
  const out = base.filter((s) => {
    const c = all.get(s);
    if (c === undefined) return false;
    const targetable = c.sister ? c.sister.targetable !== false : c.monster!.targetable !== false;
    const dist = c.sister ? 0 : c.monster!.distance ?? 0;
    const dead = c.sister ? c.sister.dead === true : c.monster!.dead === true;
    if (!targetable) return false;
    if (dist > f.reach && s !== actor) return false;
    if (dead && f.dead !== true) return false;
    return true;
  });
  return (T & 0x100) !== 0 && (T & 0x200) === 0 ? out.filter((s) => s !== actor).sort((a, b) => a - b) : out.sort((a, b) => a - b);
}

/** Can she use the command: Overdrive cost needs a full gauge and no Curse, silence, MP. */
export function usable(w: OWorld, who: Who, cmd: number): boolean {
  const f = FACTS[cmd]!;
  const me = w.sisters[who];
  if (f.od !== undefined && ((me.gauge ?? 0) < 20 || me.curse === true)) return false;
  if (f.silence === true && me.silence === true) return false;
  return me.mp >= f.mp;
}

/** The nine property tests on one candidate slot. */
export function holds(w: OWorld, P: number, slot: number): boolean {
  const s = [w.sisters.cindy, w.sisters.sandy, w.sisters.mindy].find((_, i) => 15 + i === slot);
  if (P === 92) return true;
  if (s === undefined) throw new Error('a property test on a monster other than 92');
  switch (P) {
    case 242: return s.dead === true;
    case 152: return s.autoLife === true;
    case 50: return s.reflect === true;
    case 283: return s.hp >= s.maxHp;
    case 285: return s.allNul === true;
    case 286: return s.shell === true || s.reflect === true;
    case 287: return s.protect === true || s.reflect === true;
    case 288: return s.haste === true || s.reflect === true;
    default: throw new Error(`property ${P}`);
  }
}

/** The raw draws a run may take, in order, per stream, with the counters of how many were used. */
export class Draws {
  i18 = 0;
  i4 = 0;
  constructor(readonly d18: readonly number[], readonly d4: readonly number[]) {}
  take18(): number {
    const v = this.d18[this.i18++];
    if (v === undefined) throw new Error('the oracle needed more stream-18 draws than the engine took');
    return v;
  }
  take4(): number {
    const v = this.d4[this.i4++];
    if (v === undefined) throw new Error('the oracle needed more stream-4 draws than the engine took');
    return v;
  }
}
