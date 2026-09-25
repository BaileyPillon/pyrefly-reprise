/**
 * Dressphere stat derivation.
 *
 * **The single most important stat fact in FFX-2**: a girl's combat stats are a
 * function of `(dressphere x level)` only [ffx2-combat-core §5.1]. Yuna, Rikku
 * and Paine are identical in the same dressphere at the same level, which is
 * why `FFX2MemberBuild` carries no stat block at all and the engine derives one.
 *
 * This is the engine's **fallback** table. The FFX-2 data agent owns the full
 * growth algorithms (`ffx2-combat-core §5.1a`); inject a `DressphereRegistry`
 * with a real `stats` function and this file stops being consulted.
 *
 * Anchors, transcribed verbatim:
 * - Lv 20 / 24 / 28 — [ffx2-bahamut §4.2] `[verified: 2 sources]`
 * - Lv 45 / 50 — [ffx2-vegnagun-shuyin §6.2] `[single source]` (transcribed
 *   game tables, so high confidence)
 * - Lv 99 — [ffx2-trema §5] `[single source]` (the wiki's transcribed tables), for
 *   Chapter XIII's Lv 99 party (FFX-2 only; plan TR-G1). Gunner, Warrior, Dark
 *   Knight, White Mage, Alchemist and Gun Mage. Every other shipped build is at
 *   Lv 50 or below, where these rows change nothing; Levels 51 to 98 now
 *   interpolate towards the real Lv 99 row instead of extrapolating past Lv 50.
 *
 * Between and outside those anchors we interpolate linearly, which is
 * `[estimate]` — the real curves are mildly convex — and is accurate to a few
 * points across the two bands our chapters actually use (Lv 20–28, Lv 45–52).
 */

import type { StatBlock } from '../common/types.ts';

/** `[level, hp, mp, str, mag, def, mdef, agi, acc, eva, luck]`. */
type Anchor = readonly [number, number, number, number, number, number, number, number, number, number, number];

const ANCHORS: Readonly<Record<string, readonly Anchor[]>> = {
  // [ffx2-bahamut §4.2] Lv 20/24/28 · [ffx2-vegnagun-shuyin §6.2] Lv 45/50
  gunner: [
    [20, 862, 51, 46, 24, 30, 30, 53, 123, 4, 15],
    [24, 1005, 57, 52, 26, 32, 32, 53, 123, 4, 15],
    [28, 1143, 63, 58, 29, 35, 35, 53, 123, 4, 16],
    [45, 1680, 84, 81, 40, 45, 45, 55, 126, 5, 19],
    [50, 1822, 90, 87, 44, 47, 47, 56, 127, 5, 20],
    // Lv 99 [ffx2-trema §5] `[single source]`; MDef 48 from the growth algorithm, because the
    // wiki table copies Defense into Magic Defense (58/58) [ffx2-combat-core §5.1a data warning].
    [99, 2837, 123, 137, 73, 58, 48, 57, 131, 4, 24],
  ],
  thief: [
    [20, 896, 74, 39, 32, 24, 54, 60, 110, 19, 26],
    [24, 1048, 81, 44, 37, 27, 57, 60, 110, 19, 26],
    [28, 1195, 88, 50, 40, 29, 60, 61, 111, 20, 27],
    [45, 1773, 116, 72, 56, 42, 72, 63, 113, 23, 31],
    [50, 1928, 123, 78, 62, 45, 76, 64, 114, 24, 31],
  ],
  warrior: [
    [20, 1002, 58, 57, 24, 95, 8, 50, 102, 5, 12],
    [24, 1176, 65, 64, 26, 99, 8, 50, 102, 5, 12],
    [28, 1349, 72, 72, 27, 102, 9, 50, 102, 5, 12],
    [45, 2063, 102, 101, 36, 115, 11, 52, 103, 6, 13],
    [50, 2267, 110, 109, 38, 117, 12, 53, 104, 7, 14],
    [99, 4122, 168, 168, 56, 132, 13, 54, 103, 6, 13], // Lv 99 [ffx2-trema §5] `[single source]`
  ],
  'dark-knight': [
    [20, 1311, 147, 60, 44, 118, 80, 38, 102, 2, 10],
    [24, 1533, 158, 69, 49, 121, 82, 38, 102, 2, 10],
    [28, 1753, 169, 76, 54, 124, 84, 38, 102, 2, 10],
    [45, 2668, 216, 107, 72, 136, 93, 40, 104, 3, 11],
    [50, 2931, 229, 116, 77, 139, 96, 41, 104, 4, 12],
    [99, 5355, 338, 175, 109, 151, 105, 42, 105, 3, 11], // Lv 99 [ffx2-trema §5] `[single source]`
  ],
  'white-mage': [
    [20, 613, 119, 9, 64, 12, 129, 52, 100, 5, 10],
    [24, 715, 133, 9, 70, 12, 132, 52, 100, 5, 10],
    [28, 815, 147, 10, 76, 13, 136, 52, 100, 5, 10],
    [45, 1221, 203, 14, 101, 16, 150, 54, 102, 6, 11],
    [50, 1334, 219, 14, 108, 17, 155, 54, 102, 7, 12],
    [99, 2294, 350, 20, 154, 21, 194, 55, 103, 7, 12], // Lv 99 [ffx2-trema §5] `[single source]`
  ],
  'black-mage': [
    [20, 593, 130, 8, 68, 7, 124, 51, 99, 4, 10],
    [24, 692, 145, 8, 74, 7, 127, 51, 99, 4, 10],
    [28, 789, 160, 9, 80, 8, 130, 51, 99, 4, 10],
    [45, 1184, 224, 13, 106, 12, 142, 53, 101, 5, 11],
    [50, 1294, 242, 13, 112, 12, 146, 53, 101, 6, 12],
  ],
  alchemist: [
    [20, 788, 42, 44, 12, 26, 10, 52, 119, 3, 11],
    [24, 917, 47, 49, 14, 28, 11, 52, 120, 3, 11],
    [28, 1041, 52, 54, 15, 30, 13, 52, 120, 3, 11],
    [45, 1524, 70, 76, 21, 39, 19, 55, 121, 4, 12],
    [50, 1652, 75, 81, 23, 42, 21, 55, 123, 4, 13],
    [99, 2553, 107, 125, 29, 52, 35, 58, 124, 4, 12], // Lv 99 [ffx2-trema §5] `[single source]`
  ],
  'gun-mage': [
    [20, 747, 98, 52, 61, 25, 63, 53, 120, 3, 10],
    [24, 871, 109, 59, 67, 27, 66, 53, 120, 3, 10],
    [28, 991, 120, 66, 73, 29, 69, 53, 121, 3, 10],
    [45, 1462, 166, 92, 96, 38, 81, 56, 123, 4, 11],
    [50, 1588, 179, 99, 102, 41, 83, 56, 124, 5, 12],
    [99, 2523, 288, 152, 149, 51, 97, 59, 127, 4, 11], // Lv 99 [ffx2-trema §5] `[single source]`
  ],
  songstress: [
    [20, 597, 98, 7, 46, 7, 41, 55, 98, 10, 9],
    [24, 699, 110, 7, 50, 7, 42, 55, 98, 10, 9],
    [28, 800, 121, 8, 56, 8, 44, 56, 98, 10, 9],
    [45, 1209, 164, 11, 77, 11, 50, 58, 99, 11, 10],
    [50, 1323, 176, 12, 84, 12, 52, 59, 100, 12, 11],
  ],
  berserker: [
    // Chapter 3 acquisition — present for the Farplane build only. §4.2
    [20, 1393, 44, 59, 3, 26, 3, 61, 104, 15, 13],
    [24, 1640, 50, 66, 3, 26, 3, 61, 104, 15, 13],
    [28, 1883, 55, 73, 3, 26, 3, 61, 104, 15, 13],
    [45, 2881, 76, 104, 4, 28, 5, 64, 105, 17, 14],
    [50, 3163, 82, 112, 5, 29, 5, 64, 106, 18, 15],
  ],
  // Lv 45/50 only — anything below Lv 45 is a linear extrapolation. `[estimate]`
  samurai: [
    [45, 1636, 124, 99, 60, 45, 56, 58, 107, 13, 15],
    [50, 1791, 135, 107, 64, 47, 58, 58, 108, 14, 16],
  ],
  'lady-luck': [
    [45, 1390, 174, 66, 60, 27, 49, 57, 124, 6, 30],
    [50, 1503, 188, 72, 65, 28, 51, 58, 125, 7, 32],
  ],
  trainer: [
    [45, 1866, 134, 92, 52, 55, 34, 53, 105, 7, 10],
    [50, 2028, 143, 99, 55, 57, 35, 53, 106, 8, 11],
  ],
  mascot: [
    [45, 3433, 340, 95, 105, 139, 123, 62, 126, 16, 18],
    [50, 3767, 364, 102, 112, 140, 124, 62, 127, 17, 19],
  ],
};

/** Dresspheres with no published table fall back to the Gunner's shape. */
const DEFAULT_SPHERE = 'gunner';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolate(rows: readonly Anchor[], level: number): Anchor {
  const first = rows[0];
  const last = rows[rows.length - 1];
  if (!first || !last) throw new Error('dressphere-stats: empty anchor table');
  if (rows.length === 1) return first;

  let lo = first;
  let hi = rows[1] as Anchor;
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i] as Anchor;
    const b = rows[i + 1] as Anchor;
    if (level <= b[0] || i === rows.length - 2) {
      lo = a;
      hi = b;
      if (level >= a[0] && level <= b[0]) break;
    }
  }
  const span = hi[0] - lo[0];
  const t = span === 0 ? 0 : (level - lo[0]) / span;
  const out = new Array<number>(11);
  out[0] = level;
  for (let i = 1; i < 11; i++) {
    out[i] = Math.max(i === 2 ? 0 : 1, Math.round(lerp(lo[i] as number, hi[i] as number, t)));
  }
  return out as unknown as Anchor;
}

/**
 * Derive a stat block for `(dressphere x level)`.
 *
 * `maxHp`/`maxMp` start equal to the pool; accessory and Garment Grid bonuses
 * are layered on afterwards by `garment-grids.ts` and the setup step.
 */
export function dressphereStats(dressphereId: string, level: number): StatBlock {
  const clamped = Math.max(1, Math.min(99, Math.round(level)));
  const rows = ANCHORS[dressphereId] ?? ANCHORS[DEFAULT_SPHERE];
  if (!rows) throw new Error(`dressphere-stats: no anchors for ${dressphereId}`);
  const [, hp, mp, str, mag, def, mdef, agi, acc, eva, luck] = interpolate(rows, clamped);
  return { hp, mp, str, def, mag, mdef, agi, luck, eva, acc, maxHp: hp, maxMp: mp };
}

/** True when the fallback table has a real transcription for this dressphere. */
export function hasAnchors(dressphereId: string): boolean {
  return Object.prototype.hasOwnProperty.call(ANCHORS, dressphereId);
}

/**
 * Special-dressphere part stats [ffx2-combat-core §3.15].
 *
 * Only the `-main` part scales with the host Garment Grid's node count (2–6);
 * the two pods are fixed. `[estimate]` — no source publishes the SDSP tables in
 * a form this engine can consume, so the shape is derived from the girl's own
 * level with a node-count multiplier on the main unit.
 */
export function sdspPartStats(part: 'main' | 'pod', level: number, gridNodeCount: number): StatBlock {
  const base = dressphereStats('mascot', level);
  if (part === 'pod') {
    return {
      ...base,
      hp: Math.round(base.hp * 0.35),
      maxHp: Math.round(base.hp * 0.35),
      mp: Math.round(base.mp * 0.5),
      maxMp: Math.round(base.mp * 0.5),
      def: Math.round(base.def * 0.6),
      mdef: Math.round(base.mdef * 0.6),
    };
  }
  // 2 nodes = x0.8, 6 nodes = x1.2 — the published "more nodes = stronger main".
  const nodes = Math.max(2, Math.min(6, gridNodeCount));
  const scale = 0.8 + (nodes - 2) * 0.1;
  return {
    ...base,
    hp: Math.round(base.hp * scale),
    maxHp: Math.round(base.hp * scale),
    mp: Math.round(base.mp * scale),
    maxMp: Math.round(base.mp * scale),
    str: Math.round(base.str * scale),
    mag: Math.round(base.mag * scale),
    def: Math.round(base.def * scale),
    mdef: Math.round(base.mdef * scale),
  };
}
