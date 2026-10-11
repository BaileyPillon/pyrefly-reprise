/**
 * What an Overdrive minigame's result does to the hits already planned for its targets, and which riders a Bushido lands.
 *
 * **Game case: FFX only** (FFX-2 has no Swordplay, Bushido or Fury). Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D;
 * the note `FFX-G01` sections 3, 4 and 8 (private working note). Pure and deterministic; the only random input is the `draw` the
 * caller hands in. Proven against the game's own machine code run in an emulator (`tests/unit/parity-ffx-overdrive-result.test.ts`,
 * vectors in `tests/fixtures/parity/ffx/overdrive_removal.json` and `bushido_rider.json`); the engine runs them through
 * `../adapt/overdrive-result.ts` (re-parity RC4, lane B).
 *
 * Exe addresses (all FFX.exe):
 * - 0x007b0470 / 0x007afe00  the result entry and handler: the grade becomes a replacement record, some pending hits are removed, the
 *                            targets that still have hits are recalculated (target by target, in character order)
 * - 0x00789740               the per-target calculation whose first pass leaves the "riders newly inflicted" count in byte 0x16 of the
 *                            target's result record: the handler picks a Bushido's success row when it is not 0, its (Immune) row when it is
 *
 * The game plans the FULL hit count of a random-target move first (the menu record's hits, spread over the targets one pick at a time),
 * and a lower grade only REMOVES hits afterwards; it does not plan fewer hits. What it removes, and the stream it draws on, is
 * {@link removalPlan} and {@link removeHits}.
 */

/** The Overdrive family byte of a command record (`Cmd+0x58`) the handler switches on. */
export const OdCategory = {
  SpiralCut: 0x20,
  ShootingStar: 0x22,
  Fury: 0x25,
  SliceAndDice: 0x30,
  DragonFang: 0x32,
  EnergyRain: 0x40,
  BanishingBlade: 0x42,
  BlitzAce: 0x50,
  Tornado: 0x52,
} as const;

/** How many hits the handler takes away, and how: one at a time from the targets holding the most (a draw each), or from every target. */
export interface RemovalPlan {
  /** Hits to remove. */
  n: number;
  /** The replacement record is flagged "random target": remove one hit at a time, each on a draw of stream 16. */
  random: boolean;
}

/** The stream every removal draw uses (`0x7afe00`, `pp_BtlRng(0x10)`). */
export const REMOVAL_STREAM = 16;

/**
 * The hits the handler removes for a command of `category` that finished with `grade` (a signed integer; 0 is a failed minigame).
 *
 * - Lulu's Fury (0x25): the grade is the number of casts reached, at least 1; the menu record's hit count minus the casts is removed
 *   (nothing for a grade above the hit count). The replacement record is the menu record itself, so `replRandom` is its own flag.
 * - Slice and Dice (0x30) on a failed minigame: the difference between the menu record's hits and the Fail record's, from the Fail record's
 *   flag (random). Tornado (0x52) on a failed minigame: likewise (its Fail record is not random: every target loses the difference).
 * - Nothing else removes a hit.
 *
 * `menuHits` is the menu record's hit count (`Cmd+0x2b`), `replHits` and `replRandom` the replacement record's hit count and its random-target
 * flag (`Cmd+0x1c` bit 0x8000). Returns `null` when nothing is removed.
 */
export function removalPlan(
  category: number,
  grade: number,
  menuHits: number,
  replHits: number,
  replRandom: boolean,
): RemovalPlan | null {
  let n = 0;
  if (category === OdCategory.Fury) {
    n = menuHits - (grade > 0 ? grade : 1);
    if (n < 0) return null;
  } else if ((category === OdCategory.SliceAndDice || category === OdCategory.Tornado) && grade === 0) {
    n = menuHits - replHits;
  } else {
    return null;
  }
  if (n === 0) return null;
  return { n, random: replRandom };
}

/** Signed byte, as the game keeps a pending-hit count. */
function sbyte(v: number): number {
  const b = v & 0xff;
  return b >= 0x80 ? b - 0x100 : b;
}

/**
 * Remove `plan.n` pending hits from the targets' counts (`pending[i]` = the hits still to land on target `i`, the targets in ascending
 * character order). Returns the new counts; `draw(modulus)` answers a draw of stream 16 already reduced to `0..modulus - 1`.
 *
 * Random removal (`plan.random`): `n` times, find the most hits any target holds; when it is 0 there is nothing to take and NO draw is
 * made; otherwise draw once, `value % tied`, where `tied` is the number of targets holding that most, and take one hit from the
 * `value`-th of them in ascending order (a draw is made also when only one target holds hits). Otherwise every target that has a
 * positive count loses `n` (a count that falls to 0 or below becomes 0).
 */
export function removeHits(pending: readonly number[], plan: RemovalPlan, draw: (modulus: number) => number): number[] {
  const left = pending.map(sbyte);
  if (plan.random) {
    for (let k = 0; k < plan.n; k++) {
      let most = 0;
      for (const c of left) if (c > most) most = c;
      if (most === 0) continue;
      const tied: number[] = [];
      left.forEach((c, i) => {
        if (c === most) tied.push(i);
      });
      const pick = draw(tied.length);
      const i = tied[pick] as number;
      left[i] = (left[i] as number) - 1;
      if ((left[i] as number) <= 0) left[i] = 0;
    }
    return left;
  }
  return left.map((c) => {
    if (c <= 0) return c;
    const v = sbyte(c - (plan.n & 0xff));
    return v <= 0 ? 0 : v;
  });
}

// ---------------------------------------------------------------------------------------------- the riders a Bushido lands

/** The four Bushido moves whose rider the handler looks at (Tornado carries none). */
export type BushidoMove = 'shooting-star' | 'dragon-fang' | 'banishing-blade' | 'tornado';

/** What the first pass reads of one target for the rider (all numbers are the game's words and bytes). */
export interface RiderTarget {
  /** Permanent-status word: bits 0x10 to 0x80 are the four Breaks the target already carries. */
  perm: number;
  /** Extra-status word: bit 0x100 is Eject, already carried. */
  extra: number;
  /** Extra-status immunity word: bit 0x100 is immunity to Eject. */
  extraImmune: number;
  /** The delay-immunity byte: an odd value is immune to the weak Delay. */
  delayImmune: number;
  /** The resistance bytes of Power, Magic, Armor and Mental Break (255 is immune). */
  breaks: readonly number[];
}

/**
 * How many riders the first pass newly inflicts on a target (byte 0x16 of its result record): 0 sends the Bushido to its (Immune) row.
 * Shooting Star's Eject: 0 when the target is immune to Eject or already carries it. Dragon Fang's weak Delay: 0 when the delay
 * byte is odd. Banishing Blade: one for each Break the target is neither immune to (byte 255) nor already carrying, so a single
 * immune Break does not send it to the Immune row. Tornado: no rider. A Petrified target does not follow these rules (unmapped).
 */
export function ridersLanding(move: BushidoMove, t: RiderTarget): number {
  switch (move) {
    case 'shooting-star':
      return (t.extraImmune & 0x100) !== 0 || (t.extra & 0x100) !== 0 ? 0 : 1;
    case 'dragon-fang':
      return (t.delayImmune & 1) !== 0 ? 0 : 1;
    case 'banishing-blade': {
      let n = 0;
      for (let k = 0; k < 4; k++) if ((t.breaks[k] ?? 0) !== 255 && (t.perm & (0x10 << k)) === 0) n++;
      return n;
    }
    case 'tornado':
      return 0;
  }
}
