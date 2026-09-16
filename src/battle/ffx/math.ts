/**
 * Integer arithmetic primitives for the FFX battle engine.
 *
 * Everything in the FFX damage chain is **integer** arithmetic with `//` =
 * floor-toward-negative-infinity (Python semantics). The negative-constant
 * steps genuinely rely on that: `d2` and `d4` are negative, and truncation
 * toward zero would be off by one on almost every hit
 * [ffx-combat-core §2.1].
 *
 * Two of the chain's steps multiply a ~4x10^8 intermediate by a ~1.3x10^9
 * constant, which overflows IEEE-754's exact-integer range (2^53). Those steps
 * go through {@link mulDivFloor}, which does the multiply in `BigInt` and then
 * floors. Nothing else in the engine needs BigInt.
 */

/**
 * Floor toward negative infinity — the `//` of the research documents.
 *
 * `Math.floor` already does this for a single value; the point of the named
 * helper is that `Math.trunc` / `| 0` / `>> 0` do **not**, and the chain is
 * full of possibly-negative operands (healing is negative damage here).
 */
export function ifloor(n: number): number {
  return Math.floor(n);
}

/** `a // b` with floor-toward-negative-infinity semantics. */
export function idiv(a: number, b: number): number {
  return Math.floor(a / b);
}

/**
 * `floor(a * b / d)` computed exactly, even when `a * b` exceeds 2^53.
 *
 * Used for the two magic-constant steps of the damage chain
 * (`-1282606671 // 0xFFFFFFFF` and `-2004318071 // 0xFFFFFFFF`), where the
 * product reaches ~5x10^17 for a high-Strength hit.
 */
export function mulDivFloor(a: number, b: number, d: number): number {
  const prod = BigInt(Math.trunc(a)) * BigInt(Math.trunc(b));
  const den = BigInt(Math.trunc(d));
  let q = prod / den; // BigInt division truncates toward zero
  if (prod % den !== 0n && prod < 0n !== den < 0n) q -= 1n;
  return Number(q);
}

/** Clamp `n` into `[lo, hi]`. */
export function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n;
}

// ---------------------------------------------------------------------------
// ICV_BASE — Agility -> base CTB ticks [ffx-combat-core §1.2]
// ---------------------------------------------------------------------------

/**
 * Breakpoints of the 256-entry `ICV_BASE` table, as `[minAgility, baseTicks]`.
 * [ffx-combat-core §1.2, verified: 2 sources]
 */
const ICV_BASE_BREAKPOINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 28],
  [2, 26],
  [3, 24],
  [4, 20],
  [5, 16],
  [7, 15],
  [10, 14],
  [12, 13],
  [15, 12],
  [17, 11],
  [19, 10],
  [23, 9],
  [29, 8],
  [35, 7],
  [44, 6],
  [62, 5],
  [98, 4],
  [170, 3],
];

function buildIcvBase(): number[] {
  const table = new Array<number>(256).fill(28);
  for (let agi = 0; agi < 256; agi++) {
    let ticks = 28;
    for (const bp of ICV_BASE_BREAKPOINTS) {
      if (agi >= bp[0]) ticks = bp[1];
      else break;
    }
    table[agi] = ticks;
  }
  return table;
}

/** The full 256-entry Agility -> base-ticks table. */
export const ICV_BASE: readonly number[] = buildIcvBase();

/**
 * Base CTB ticks for an Agility value. Agility above 170 changes nothing
 * except first-turn placement [ffx-combat-core §1.2].
 */
export function baseCtb(agility: number): number {
  return ICV_BASE[clamp(Math.trunc(agility), 0, 255)] ?? 28;
}

// ---------------------------------------------------------------------------
// ICV_VARIANCE — opening-jitter bound [ffx-combat-core §1.9]
// ---------------------------------------------------------------------------

/**
 * `ICV_VARIANCE` is constant on each `ICV_BASE` plateau and counts position
 * within that plateau in fixed-size groups, capped at 9:
 * `variance[agi] = floor((agi - runStart) / groupSize) + 1`, and `0` at
 * Agility 0 (no jitter at all) [ffx-combat-core §1.9].
 *
 * Group sizes: 1 below Agility 44, then 2 (44-61), 4 (62-97), 8 (98-169) and
 * 16 (170-255). The last plateau tops out at 6 rather than 9 purely because
 * the 256-entry table runs out mid-plateau — a data-table artefact we
 * reproduce deliberately.
 */
function buildIcvVariance(): number[] {
  const table = new Array<number>(256).fill(0);
  // Agility 0 is its own run (`ICV_VARIANCE[0] = 0`, no jitter at all), so the
  // base-28 plateau that 0 and 1 share effectively starts counting at 1.
  let runStart = 1;
  for (let agi = 1; agi < 256; agi++) {
    if (agi > 1 && (ICV_BASE[agi] ?? 28) !== (ICV_BASE[agi - 1] ?? 28)) runStart = agi;
    const groupSize = agi >= 170 ? 16 : agi >= 98 ? 8 : agi >= 62 ? 4 : agi >= 44 ? 2 : 1;
    table[agi] = Math.min(9, Math.floor((agi - runStart) / groupSize) + 1);
  }
  table[0] = 0;
  return table;
}

/** The full 256-entry opening-jitter table. */
export const ICV_VARIANCE: readonly number[] = buildIcvVariance();

/** Inclusive upper bound of the normal-condition opening jitter. */
export function icvVariance(agility: number): number {
  return ICV_VARIANCE[clamp(Math.trunc(agility), 0, 255)] ?? 0;
}

// ---------------------------------------------------------------------------
// MITIGATION (DefNum) [ffx-combat-core §2.3]
// ---------------------------------------------------------------------------

/**
 * MITIGATION / "DefNum" from a Defense or Magic Defense stat, as the exact
 * integer chain rather than the published `floor((Def - 280.4)^2 / 110) + 16`
 * approximation, which is off by one for 26 of the 256 inputs
 * [ffx-combat-core §2.3].
 *
 * ```
 * m1 = def * def
 * m1 = (m1 * 0x2E8BA2E9) // 0xFFFFFFFF
 * m1 = m1 // 2
 * m  = (def * 0x33) - m1
 * m  = (m * 0x66666667) // 0xFFFFFFFF
 * MITIGATION = 0x2DA - (m // 4)
 * ```
 *
 * Reference values: 0 -> 730, 20 -> 632, 50 -> 498, 100 -> 311, 255 -> 21.
 */
export function mitigation(defStat: number): number {
  const def = clamp(Math.trunc(defStat), 0, 255);
  let m1 = def * def;
  m1 = mulDivFloor(m1, 0x2e8ba2e9, 0xffffffff);
  m1 = idiv(m1, 2);
  let m = def * 0x33 - m1;
  m = mulDivFloor(m, 0x66666667, 0xffffffff);
  return 0x2da - idiv(m, 4);
}

// ---------------------------------------------------------------------------
// Hit chance table [ffx-combat-core §2.11]
// ---------------------------------------------------------------------------

/** `HIT_CHANCE_TABLE`, indexed by `clamp(floor(acc*0.4) - targetEva + 10, 0, 8)`. */
export const HIT_CHANCE_TABLE: readonly number[] = [25, 30, 30, 40, 40, 50, 60, 80, 100];
