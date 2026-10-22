/**
 * THE LIVING CATHEDRAL (release 62; Bailey, 2026-10-22 ~00:00 EDT, decision 173a: "Yes: dust in the skylight, flickering lamps, floor ripples (Recommended)" for the Bahamut cathedral; **FFX-2 only**: Chapter IV's room,
 * the Bevelle underground, `bevelle-underground`). The same idea as Chapter I's living stage (`look/stage/`, release 61: moonlight, snow, mist, a glitter road on the ice): the painted room moves a little, so a visitor
 * who stands in front of it for the two minutes of the fight sees a place and not a picture. Three things, all inside the HD-2D bold look, so CLASSIC and `?look=off` take every one away:
 *
 *  - **dust in the skylight beam**: pale cyan motes drift down the beam of light that falls from the rose windows at the top of the painting; each is lit only while it is inside the beam (brightest on its axis),
 *    twinkles as it turns, rises out of the dark and fades back into it (`moteAt`). Behind the figures, never over a face;
 *  - **the lamps' flames**: the four lamps of the painting (the ones that already throw embers) flicker: the glass and its reflections in the floor swell and dim, and the warm light they cast on the walls and
 *    floor sways with them (`lampFlicker`, the number the shader mirrors);
 *  - **ripples in the floor's reflection** when someone is hit: a soft ring spreads from the hit figure's feet, bending the polished floor's reflections (the figures' own and the painted lamps') as it passes and
 *    catching a little light on its crest, then dies away in about two seconds (`rippleWave`).
 *
 * Quality tiers (`?lookq=medium|low`, F7): fewer motes, fewer ripples at once; LOW EFFECTS (the eye-candy `low` tier) takes it all away. REDUCE MOTION: the look's clock stops, so the motes hang where they are, the
 * lamps hold steady (amplitude 0) and no ripple is ever started. REDUCE FLASHES: the lamps' flicker is a third as deep (a flicker is a brightness change). Pure (no DOM, no `three`).
 */
import type { LookName, LookQuality, Rgb } from '../LookConfig.ts';

export interface BeamSpec {
  /** The beam's two ends on the painting (u from the left, v from the top, 0..1): the rose windows, and where it fades into the room. */
  top: readonly [number, number];
  bottom: readonly [number, number];
  /** Half its width at each end, as a share of the painting's width. */
  halfTop: number;
  halfBottom: number;
  /** The motes' colour, sRGB 0..1: the skylight's own cold cyan. */
  color: Rgb;
  /** How bright a mote is on the axis (linear, additive). */
  gain: number;
  /** A mote's size, device px at 900p tall (it scales with the window). */
  size: number;
  /** A faint shaft of the beam itself under the motes, so they have a light to hang in (0 = none). */
  glow: number;
}

export interface LampsSpec {
  /** The warm light the flames cast on the walls and floor (linear, additive, times the surface's own brightness), and its reach round a lamp in frame heights. */
  spill: number;
  reach: number;
  /** How deep the flicker is (1 +- this), and how much of it the lamp glass itself (and its reflection) takes. */
  amp: number;
  glass: number;
  /** The flames' colour, sRGB 0..1. */
  color: Rgb;
}

export interface RippleSpec {
  /** How far a ring bends the reflection, in frame heights at its strongest (a thousandth is a pixel on a 1000 px tall frame). */
  amp: number;
  /** How fast the ring spreads (frame heights a second), how fast it dies (1 / seconds), the floor's top edge in the frame (v up from the bottom), and the crest's glint. */
  speed: number;
  decay: number;
  floor: number;
  glint: number;
}

export interface LivingRecipe {
  game: 'ffx2';
  beam: BeamSpec | null;
  /** How many motes at the high tier. */
  motes: number;
  lamps: LampsSpec | null;
  ripple: RippleSpec | null;
}

/** What one quality tier keeps of a recipe. */
export interface LivingQuality {
  /** The share of the motes and of the lamps' light that stays. */
  motes: number;
  lamps: number;
  /** How many ripples may live at once (the shader carries three). */
  ripples: number;
}

export const MAX_MOTES = 28;
export const MAX_RIPPLES = 3;

export const LIVING_QUALITY: Readonly<Record<LookQuality, LivingQuality>> = {
  high: { motes: 1, lamps: 1, ripples: 3 },
  medium: { motes: 0.55, lamps: 1, ripples: 2 },
  low: { motes: 0, lamps: 0.5, ripples: 0 },
};

/**
 * Chapter IV (FFX-2), the Bevelle underground: the skylight's beam falls from the rose windows at the top of the painting (u 0.43 to 0.58, v 0 to 0.07) down the middle of the hall; the four lamps are the ones
 * `LookBoldConfig.ROOM_BOLD` already gives embers; the floor is polished (gloss 0.8), so a ripple has something to bend.
 */
export const ROOM_LIVING: Readonly<Record<string, LivingRecipe>> = {
  'bevelle-underground': {
    game: 'ffx2',
    beam: { top: [0.505, 0.03], bottom: [0.5, 0.66], halfTop: 0.05, halfBottom: 0.17, color: [0.55, 0.88, 1.0], gain: 1.15, size: 2.7, glow: 0.05 },
    motes: 26,
    lamps: { spill: 0.5, reach: 0.2, amp: 0.2, glass: 1.5, color: [1.0, 0.56, 0.2] },
    ripple: { amp: 0.0085, speed: 0.32, decay: 1.5, floor: 0.34, glint: 0.4 },
  },
};

export const livingRecipe = (key: string): LivingRecipe | null => (Object.prototype.hasOwnProperty.call(ROOM_LIVING, key) ? ROOM_LIVING[key]! : null);

/** The living room runs when the look is hd2d or cinematic at bold strength and the room has a recipe (the stage's own rule, `StageConfig.stageWanted`). */
export function livingWanted(look: LookName | string | null, strength: string, key: string): boolean {
  return look !== null && look !== 'anime' && strength === 'bold' && livingRecipe(key) !== null;
}

// ------------------------------------------------------------------ the maths the shader mirrors

/** The shader's hash (`hash21`). */
export function hash21(x: number, y: number): number {
  let px = (x * 123.34) % 1;
  let py = (y * 456.21) % 1;
  if (px < 0) px += 1;
  if (py < 0) py += 1;
  const d = px * (px + 45.32) + py * (py + 45.32);
  px += d;
  py += d;
  const r = (px * py) % 1;
  return r < 0 ? r + 1 : r;
}

const smooth01 = (t: number): number => {
  const x = t <= 0 ? 0 : t >= 1 ? 1 : t;
  return x * x * (3 - 2 * x);
};

/** The shader's value noise (`vnoise`): smooth, 0..1, mean about a half. */
export function vnoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth01(x - ix);
  const fy = smooth01(y - iy);
  const a = hash21(ix, iy);
  const b = hash21(ix + 1, iy);
  const c = hash21(ix, iy + 1);
  const d = hash21(ix + 1, iy + 1);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

/** A lamp's flicker at time `t` seconds: 1 plus or minus `amp`, from two slow noises (a quick one and a lazy one), different for each lamp `j`. Mirrors the shader's `lampFlick`. */
export function lampFlicker(t: number, j: number, amp: number): number {
  const a = vnoise(t * 6.3 + j * 13.7, j * 3.1);
  const b = vnoise(t * 2.1 + j * 5.9, j * 7.7 + 30);
  return 1 + amp * (0.5 * a + 0.5 * b - 0.5) * 2;
}

/** One mote's state at time `t`: where it is in the beam (`s` 0 at the top to 1 at the bottom, `a` -1 to 1 across), its size share, and how bright it is (0 when it is out of the beam's light or fading in and out). */
export function moteAt(i: number, t: number): { s: number; a: number; size: number; bright: number } {
  const h1 = hash21(i * 7.3 + 1, i * 3.1 + 2);
  const h2 = hash21(i * 5.7 + 0.3, i * 2.9 + 4);
  const h3 = hash21(i * 1.9 + 8, i * 6.1 + 5);
  const period = 11 + 14 * h1;
  const ph = (((t / period + h2) % 1) + 1) % 1;
  const s = ph;
  const a = (h3 * 2 - 1) * 0.82 + Math.sin(t * 0.31 + h2 * 40) * 0.1 + Math.sin(t * 0.13 + h1 * 17) * 0.06;
  const life = smooth01(ph / 0.12) * (1 - smooth01((ph - 0.78) / 0.22));
  const twinkle = 0.55 + 0.45 * Math.sin(t * (0.7 + 1.6 * h3) + h1 * 30);
  const prof = Math.exp(-a * a * 1.6);
  return { s, a, size: 0.55 + 0.9 * h2, bright: twinkle * life * prof };
}

/**
 * A ring's bend at a point `rad` frame heights (floor-corrected) from its centre, `age` seconds after the hit, for a strength `k`: a travelling sine inside a soft envelope that follows the ring out and fades with time.
 * Positive and negative both (the shader bends the reflection along the radius by it); 0 before the hit.
 */
export function rippleWave(age: number, rad: number, k: number, s: RippleSpec): number {
  if (age < 0 || k <= 0) return 0;
  const R = age * s.speed;
  const x = rad - R;
  const env = Math.exp(-(x * x) / (RIPPLE_SPREAD * RIPPLE_SPREAD)) * Math.exp(-age * s.decay) * smooth01(age / 0.05);
  return Math.sin(x * RIPPLE_K) * env * k;
}
export const RIPPLE_SPREAD = 0.06;
export const RIPPLE_K = 150;
/** The floor is foreshortened: a ring is this much flatter than it is wide (the same figure the pools use). */
export const RIPPLE_SQUASH = 0.38;
/** A ring is over after this many seconds (its envelope is under about 3 percent of the start). */
export const rippleLife = (s: RippleSpec): number => Math.log(30) / s.decay;
