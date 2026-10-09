/**
 * Integer arithmetic primitives for the FFX battle engine.
 *
 * The damage chain's own arithmetic (32-bit products, truncating divisions) lives in the parity kernels
 * (`./kernel/int32.ts`, `./kernel/damage.ts`); what is left here is the engine's `//`
 * (floor toward negative infinity) for the bookkeeping that is not the game's damage chain, the CTB
 * tables (batch W2 of the re-parity track replaces them), and `clamp`.
 */

/** `a // b` with floor-toward-negative-infinity semantics. */
export function idiv(a: number, b: number): number {
  return Math.floor(a / b);
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
