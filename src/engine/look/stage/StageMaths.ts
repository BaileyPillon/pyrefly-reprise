/**
 * Demo looks, the DEPTH STAGE (release 61, decision 169m: "Add depth and life"): the pure maths of the room's weather and light. No DOM, no `three`, so vitest runs it in Node and the shaders
 * (`StageGlintShader.ts`) mirror it line for line. Both games (shared plumbing): a room names its own wind, its moon and its ice in `StageConfig.ts`.
 *
 * Three small pieces:
 *  - the wind: one gust envelope for the whole room, so the snow, the streaks and the mist all lean into the same breath of wind at the same moment (a gust leans in and eases out, and never the
 *    same twice in a row), and the warped clock the weather runs on while it blows;
 *  - the moon's glitter on the ice: for a point on the floor, the camera and the moon, how much of the moon a tiny ice facet throws back at the eye;
 *  - the layers' sway: how far, in pixels, the painting's depth layers move against each other when the camera is still (used by the debug read-out and the tests).
 */

const TAU = Math.PI * 2;
const clamp = (x: number, a: number, b: number): number => (x < a ? a : x > b ? b : x);
const smooth = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** A room's wind: how strong a gust is, how often, and how much it speeds the weather. */
export interface WindSpec {
  /** How much a gust brightens the moon's light shafts (0.3 = 30 percent brighter at the peak): the air is fuller of snow and mist, so it throws more of the light. */
  shaft?: number;
  /** Seconds between the starts of two gusts, on average (the two slow waves below beat against each other, so it is never regular). */
  every: number;
  /** How long a gust lasts at its strongest, seconds. */
  length: number;
  /** How much the weather's clock runs faster at the peak of a gust (1 = twice as fast). */
  speedUp: number;
  /** How much a gust thickens the streaks and the low mist at its peak (1 = twice as thick). */
  thicken: number;
  /** Seconds added to the clock, so a recording can choose where in the cycle it starts. */
  phase: number;
}

export const NO_WIND: WindSpec = { every: 1, length: 1, speedUp: 0, thicken: 0, phase: 0 };

/**
 * The gust at time `t` (seconds), 0 (calm) to 1 (the peak). One crest every `every` seconds, a smooth bell (never a flat top) whose width at half height is `length`; a second, slower
 * wave (about 3.3 crests long) makes each crest a different strength, between 44 percent and the full strength, so the gusts are never the same twice in a row and none is missing for long.
 * Between gusts the wind is a light breath (0.08), so the snow never hangs still. A gust leans in and eases out over about `length` seconds, which is what the eye reads as a gust and not a wobble.
 */
export function gustAt(t: number, w: WindSpec): number {
  if (w.speedUp === 0 && w.thicken === 0) return 0;
  const T = Math.max(1, w.every);
  const u = (t + w.phase) / T;
  const a = 0.5 + 0.5 * Math.cos(u * TAU); // 0..1, a crest at every whole u
  // The crest's shape: a^p with p chosen so the bell is `length` seconds wide at half height (a = 0.5 + 0.5 cos(pi * width fraction) at its edges).
  const wf = clamp(w.length / T, 0.05, 0.95);
  const edge = clamp(0.5 + 0.5 * Math.cos(Math.PI * wf), 1e-3, 0.999);
  const p = Math.log(0.5) / Math.log(edge);
  const strength = 0.72 + 0.28 * Math.sin((u / 3.3) * TAU + 1.1);
  return 0.08 + 0.92 * Math.pow(a, p) * strength;
}

/**
 * The clock the weather runs on, advanced by one frame: real time `dt` at a calm, up to `1 + speedUp` times that at the peak of a gust. Returns the new clock; `gust` is this frame's
 * {@link gustAt}. Monotone for any `dt >= 0`, so nothing ever runs backwards.
 */
export function windClock(clock: number, dt: number, gust: number, w: WindSpec): number {
  return clock + Math.max(0, dt) * (1 + w.speedUp * clamp(gust, 0, 1));
}

/** The multiplier a gust puts on a streak's or a mist sheet's opacity. */
export function gustThicken(gust: number, w: WindSpec): number {
  return 1 + w.thicken * clamp(gust, 0, 1);
}

/** The multiplier a gust puts on the moon's light shafts. */
export function gustShaft(gust: number, w: WindSpec): number {
  return 1 + (w.shaft ?? 0) * clamp(gust, 0, 1);
}

// ------------------------------------------------------------------------------------- the glitter

const fract = (x: number): number => x - Math.floor(x);

/** A 2D hash in 0..1, the same one the shader uses (Hoskins' hash without sine: stable for the large cell numbers of a wide floor). */
export function hash21(x: number, y: number): number {
  let a = fract(x * 0.1031);
  let b = fract(y * 0.1031);
  let c = fract(x * 0.1031);
  const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
  a += d;
  b += d;
  c += d;
  return fract((a + b) * c);
}

/** What the camera is looking along, and where the moon is, for one point on the floor. All vectors are in world space; `from` points at the eye, `to` at the moon. Both unit length. */
export interface GlintView {
  from: readonly [number, number, number];
  to: readonly [number, number, number];
}

/**
 * How much of the moon an ice facet at floor cell (cx, cy) throws at the eye, 0..1. The facet's normal is the floor's up tilted by a hashed amount (at most `rough` radians in x and z); the
 * moon is seen in it when its mirror direction lines up with the eye within `width` (a cosine). `twinkle` (0..1) is the facet's own slow flicker. A flat mirror (rough 0) would send the moon back
 * along one line only; the tilt is what widens that line into a road of separate sparkles.
 */
export function facetGlint(cx: number, cy: number, v: GlintView, rough: number, width: number, time: number, speed: number): number {
  const nx = (hash21(cx, cy) - 0.5) * 2 * rough;
  const nz = (hash21(cy + 7.3, cx - 3.1) - 0.5) * 2 * rough;
  const ny = Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz));
  // The half vector between the eye and the moon: a facet shines when its normal points along it.
  let hx = v.from[0] + v.to[0];
  let hy = v.from[1] + v.to[1];
  let hz = v.from[2] + v.to[2];
  const hl = Math.hypot(hx, hy, hz) || 1;
  hx /= hl;
  hy /= hl;
  hz /= hl;
  const align = nx * hx + ny * hy + nz * hz;
  const lobe = smooth(1 - width, 1, align);
  const ph = hash21(cx * 1.7 + 11.1, cy * 2.3 - 5.7) * TAU;
  const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * speed * (0.6 + hash21(cy, cx)) + ph));
  return clamp(lobe * lobe * tw, 0, 1);
}

/** A floor reflects more at a grazing angle: 0 looking straight down (`viewUp` 1), 1 at the horizon (`viewUp` 0); the glitter's broad sheen is scaled by it (the shader's `fres`). */
export function glintFresnel(viewUp: number): number {
  return Math.pow(1 - clamp(viewUp, 0, 1), 4);
}

/** The cos of the eye-to-moon half angle over which a perfectly flat floor would shine: a cheap ceiling used by the shader to skip the facets that cannot light (an early out). */
export function glintReach(rough: number, width: number): number {
  // a facet tilted by `rough` (in each axis) moves the half vector's alignment by at most cos(rough * sqrt2) of 1; the lobe is open `width` wide
  return Math.cos(Math.min(Math.PI / 2, rough * Math.SQRT2 + Math.acos(clamp(1 - width, -1, 1))));
}

// ------------------------------------------------------------------------------------- the layers

/**
 * How far (px at `width` px across) a layer at `depth` (metres from the camera) slides against the far plate when the camera moves sideways by `shift` metres, at a field of view `fovDeg`
 * (vertical) and aspect `aspect`. The standard parallax: the shift's image is `shift / depth`, so a layer is seen to move by the difference of two such images. Used by the tests, the
 * handoff note and the debug read-out to say how much one layer moves against the next.
 */
export function layerSlidePx(shift: number, nearDepth: number, farDepth: number, fovDeg: number, aspect: number, width: number): number {
  const half = Math.tan((fovDeg * Math.PI) / 360) * aspect; // half the frame's width at unit depth
  const px = (d: number): number => (shift / Math.max(1e-3, d) / (2 * half)) * width;
  return Math.abs(px(nearDepth) - px(farDepth));
}
