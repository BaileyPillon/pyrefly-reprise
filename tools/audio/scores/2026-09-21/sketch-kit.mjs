/**
 * Small shared helpers for the 2026-09-21 chapter sketches.
 *
 * Nothing here is new musical material — it is the arithmetic the six sketch
 * files would otherwise repeat. Melodic material comes from
 * `src/audio/tracks/themes.ts` (imported, never retyped: THEMES.md's standing
 * instruction) or is written in the sketch file itself.
 *
 * Game case (AGENTS.md rule 14): BOTH — arithmetic, no game content.
 */

/**
 * Stamp a repeating velocity shape onto a line, in order.
 *
 * THEMES.md "Dynamics": never render a phrase at constant velocity. A cell
 * imported as `Note[]` carries no velocities, so the arranger supplies the
 * shape here rather than editing the theme data.
 */
export function shape(notes, velocities) {
  return notes.map((n, i) => [n[0], n[1], n[2], velocities[i % velocities.length]]);
}

/** A four-bar arch over a line: 0.62 -> 0.78 -> 0.58 by position. */
export function arch(notes, from, to, low = 0.58, peak = 0.8) {
  const span = Math.max(1e-6, to - from);
  return notes.map((n) => {
    const t = Math.min(1, Math.max(0, (n[0] - from) / span));
    const bell = Math.sin(Math.PI * t);
    const v = low + (peak - low) * bell;
    return [n[0], n[1], n[2], Math.min(1, Math.max(0.05, v * (n[3] ?? 0.8) * 1.25))];
  });
}

/**
 * Swing a straight eighth-note line: every off-beat eighth is pushed late to
 * the triplet point, and the on-beat eighth lengthened to meet it. `step` is
 * the written eighth in beats (0.5 for 4/4 eighths).
 */
export function swing(notes, step = 0.5, ratio = 2 / 3) {
  const pair = step * 2;
  return notes.map((n) => {
    const within = n[0] % pair;
    if (Math.abs(within - step) > 1e-6) {
      return [n[0], Math.min(n[1], pair * ratio), n[2], n[3]];
    }
    const start = n[0] - step + pair * ratio;
    return [start, Math.min(n[1], pair * (1 - ratio)), n[2], n[3]];
  });
}

/** Keep only the notes that start inside [from, to). */
export function between(notes, from, to) {
  return notes.filter((n) => n[0] >= from - 1e-9 && n[0] < to - 1e-9);
}

/** Add a constant to every velocity, clamped. */
export function louder(notes, by) {
  return notes.map((n) => [n[0], n[1], n[2], Math.min(1, Math.max(0.05, (n[3] ?? 0.8) + by))]);
}
