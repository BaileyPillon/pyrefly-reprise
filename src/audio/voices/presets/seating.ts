/**
 * Where each instrument sits on the platform.
 *
 * Two numbers per seat do most of the work of making a sampled orchestra
 * sound like one room rather than a stack of solo recordings:
 *
 *   `pan`   left/right, as heard from the audience — 1st violins on the left,
 *           cellos on the right, horns back left, trumpets back right.
 *   `depth` 0 at the front edge, 1 at the back wall. Depth decides how much
 *           of the instrument goes to the hall (further = wetter) and how
 *           long its early reflections take to arrive.
 *
 * A preset names a seat; nothing else in the audio code needs to know about
 * orchestral layout. Rock and electronic cues use the `band-*` seats, which
 * are shallower and wider — a kit is close-miked, not twenty metres away.
 */

export interface Seat {
  /** -1 hard left .. 1 hard right, audience perspective. */
  pan: number;
  /** 0 front .. 1 back wall. Drives reverb send and early-reflection delay. */
  depth: number;
  /** Multiplies the seat's reverb send, for an instrument that wants more or less. */
  wetScale?: number;
}

export const SEATS: Record<string, Seat> = {
  // --- strings, front arc -------------------------------------------------
  'violin-1': { pan: -0.55, depth: 0.22 },
  'violin-2': { pan: -0.28, depth: 0.26 },
  viola: { pan: 0.28, depth: 0.26 },
  cello: { pan: 0.5, depth: 0.28 },
  bass: { pan: 0.62, depth: 0.38 },
  'strings-wide': { pan: 0, depth: 0.26 },

  // --- woodwinds, centre, mid depth ---------------------------------------
  flute: { pan: -0.14, depth: 0.46 },
  oboe: { pan: 0.14, depth: 0.46 },
  clarinet: { pan: -0.22, depth: 0.5 },
  bassoon: { pan: 0.24, depth: 0.5 },

  // --- brass, behind the winds --------------------------------------------
  horn: { pan: -0.46, depth: 0.66, wetScale: 1.15 },
  trumpet: { pan: 0.34, depth: 0.62 },
  trombone: { pan: 0.48, depth: 0.66 },
  tuba: { pan: 0.55, depth: 0.7 },

  // --- percussion and harp ------------------------------------------------
  timpani: { pan: 0.1, depth: 0.82 },
  percussion: { pan: -0.1, depth: 0.85, wetScale: 1.1 },
  'percussion-low': { pan: 0.05, depth: 0.8, wetScale: 0.9 },
  harp: { pan: -0.42, depth: 0.34 },
  celesta: { pan: -0.34, depth: 0.42 },
  piano: { pan: 0, depth: 0.2, wetScale: 0.85 },
  organ: { pan: 0, depth: 0.92, wetScale: 1.25 },

  // --- voices, on risers at the back --------------------------------------
  choir: { pan: 0, depth: 0.88, wetScale: 1.2 },
  soloist: { pan: -0.06, depth: 0.3, wetScale: 1.1 },

  // --- band / electronic: close, wide, dry --------------------------------
  'band-centre': { pan: 0, depth: 0.12, wetScale: 0.5 },
  'band-left': { pan: -0.42, depth: 0.14, wetScale: 0.5 },
  'band-right': { pan: 0.42, depth: 0.14, wetScale: 0.5 },
  'band-kit': { pan: 0, depth: 0.2, wetScale: 0.55 },
  'band-bass': { pan: 0, depth: 0.14, wetScale: 0.3 },
  'synth-wide': { pan: 0, depth: 0.3, wetScale: 0.7 },
};

/** Fallback for a preset naming a seat that does not exist. */
export const DEFAULT_SEAT: Seat = { pan: 0, depth: 0.4 };

export function seatOf(name: string): Seat {
  return SEATS[name] ?? DEFAULT_SEAT;
}

/**
 * Reverb send for a seat: front-row instruments keep their definition, back-row
 * ones sit in the hall. Kept here (not in the mix code) so that changing the
 * apparent room is a one-line edit an arranger can make.
 */
export function sendOf(seat: Seat): number {
  return Math.min(1, (0.14 + seat.depth * 0.46) * (seat.wetScale ?? 1));
}

/** Early-reflection pre-delay in seconds — roughly the extra metres to the back wall. */
export function preDelayOf(seat: Seat): number {
  return 0.006 + seat.depth * 0.026;
}
