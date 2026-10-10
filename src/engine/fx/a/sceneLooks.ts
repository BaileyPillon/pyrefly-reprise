/**
 * Option A's per-room settings: where each painting's own light is (measured on the approved
 * PNG, confirmed by eye on the captures), its colour, and how the bloom, shafts, streaks and
 * look sit in that room. Pure data, keyed by the chapter's `sceneKey`.
 *
 * Tuned bold on purpose (Bailey, 2026-09-29: "maximum eye candy ... absolutely beautiful"): the
 * ON frame must read richer than OFF at thumbnail size. Every strength is also scaled at run
 * time by the `?fxdial=` dials (`EyeCandy.ts`), so Bailey can turn any of it down.
 *
 * Game case (rule 14): Chapters I and VII are FFX only (gold, calm: long soft shafts, slow
 * beams, an anamorphic horizontal lens streak), IV and XVI FFX-2 only ("pink hour": a violet
 * and pink split, tighter and stronger bloom, four-point star glints, quicker beams). Nothing
 * here adds a particle or a mote: the shafts and haze are light the painting already paints
 * (research/ffx-vs-ffx2-presentation.md §8: Bevelle is "steam, not motes"; Gagazet and Djose
 * `unattested`, Macalania `absent` until Seymour's death).
 */

export type LookGame = 'ffx' | 'ffx2';

export interface ShaftSpec {
  /** On the painting, 0..1 from its top-left corner. */
  u: number;
  v: number;
  /** The light's colour (`#RRGGBB`). */
  color: string;
  /** Gather reach in frame heights (how far from the source paint may shine). */
  reach: number;
  gain: number;
  /** A soft glow drawn at the source itself. */
  disc?: number;
  /** The air lit round the source (a soft haze in its colour). */
  haze?: number;
}

export interface StreakSpec {
  /** `anamorphic` = one horizontal streak (FFX); `star` = four points (FFX-2). */
  mode: 'anamorphic' | 'star';
  /** Strength (0 = none). */
  gain: number;
  /** Peak threshold (luma) and how far it reaches: taps per side, spacing, falloff per tap. */
  threshold: number;
  taps: number;
  len: number;
  fall: number;
  /** The streak's tint (`#RRGGBB`). */
  tint: string;
}

export interface SceneLookA {
  game: LookGame;
  shafts: ShaftSpec[];
  /** Radial decay per sample (FFX long and soft, FFX-2 shorter and crisper). */
  decay: number;
  /** Beam structure in the shafts, 0 (a smooth glow) to 1 (distinct beams), and their speed. */
  rays: number;
  raySpeed: number;
  /** Bright-field threshold for the shafts (luma). */
  shaftThreshold: number;
  /** How much pale, uncoloured paint may feed a shaft or the bloom (snow, marble). */
  whiteDamp: number;
  /** Selective bloom: threshold, strength and radius. */
  bloom: { threshold: number; strength: number; radius: number };
  /** Look LUT mix, 0..1. */
  look: number;
  streak: StreakSpec;
  /** Vignette tint (the edge darkens toward this) and extra vignette. */
  vignetteTint: string;
  vignetteAdd: number;
  /** Rim light: strength, and a width multiplier (the colour is the painting's key at luma 0.85). */
  rim: number;
  rimWidth: number;
  /** Backdrop depth of field: mip bias at rest, in the menu, and during an action. */
  dof: { rest: number; menu: number; action: number };
  /** A big spell or an Overdrive / Special lands: bloom and shafts swell by this much, then settle. */
  drama: { boost: number; seconds: number };
  /** Optional per-room grade correction: the palette's gain times `gain` (RGB), plus `lift` on the black point, and the split-tone amount. */
  grade?: { gain: [number, number, number]; lift: [number, number, number]; shadowTintAmount: number };
}

const FFX_BASE: Omit<SceneLookA, 'shafts'> = {
  game: 'ffx',
  decay: 0.978,
  rays: 0.6,
  raySpeed: 1,
  shaftThreshold: 0.42,
  whiteDamp: 0.3,
  bloom: { threshold: 0.45, strength: 1.35, radius: 0.8 },
  look: 1,
  streak: { mode: 'anamorphic', gain: 0.8, threshold: 0.85, taps: 28, len: 3.2, fall: 0.9, tint: '#ffd9a0' },
  vignetteTint: '#141c38',
  vignetteAdd: 0.16,
  rim: 1.3,
  rimWidth: 1.35,
  dof: { rest: 1.1, menu: 2.3, action: 0.5 },
  drama: { boost: 0.35, seconds: 1.4 },
};

const FFX2_BASE: Omit<SceneLookA, 'shafts'> = {
  game: 'ffx2',
  decay: 0.966,
  rays: 0.5,
  raySpeed: 1.6,
  shaftThreshold: 0.42,
  whiteDamp: 0.35,
  bloom: { threshold: 0.45, strength: 1.5, radius: 0.55 },
  look: 1,
  streak: { mode: 'star', gain: 1.5, threshold: 0.74, taps: 14, len: 1.7, fall: 0.82, tint: '#ffc6e6' },
  vignetteTint: '#2a1242',
  vignetteAdd: 0.16,
  rim: 1.35,
  rimWidth: 1.35,
  dof: { rest: 1.1, menu: 2.3, action: 0.5 },
  drama: { boost: 0.45, seconds: 1.0 },
};

export const SCENE_LOOKS_A: Readonly<Record<string, SceneLookA>> = {
  /**
   * Ch I, FFX: night pass, cold moonlight. Moonbeams fall from the moon over the left crags
   * through the blizzard haze; the streak is silver, and only the top tenth leans gold.
   */
  gagazet: {
    ...FFX_BASE,
    // D must-fix 2: the painted moon stays a disc. No source disc, less lit air, and the streak only
    // on the hottest peaks (spells), never on the moon.
    // D must-fix 3: the moonbeams at 0.6 of the options page and fewer distinct rays, so the upper left
    // keeps its painted ridges and the moon never turns into a ray-star when the veils thin.
    shafts: [{ u: 0.225, v: 0.155, color: '#cfe0ff', reach: 1.0, gain: 1.3, disc: 0, haze: 0.3 }],
    rays: 0.4,
    whiteDamp: 0.15,
    bloom: { threshold: 0.66, strength: 0.95, radius: 0.85 },
    streak: { ...FFX_BASE.streak, tint: '#d8e6ff', gain: 0.6, threshold: 0.97 },
  },
  /**
   * Ch VII, FFX: the ice temple. Cold skylight falls through the tall ice windows onto the
   * floor; the two braziers breathe warm gold into the air round them.
   */
  'macalania-temple': {
    ...FFX_BASE,
    shafts: [
      { u: 0.47, v: 0.02, color: '#cfe8ff', reach: 1.1, gain: 1.35, disc: 0, haze: 0.2 },
      { u: 0.715, v: 0.765, color: '#ffc873', reach: 0.22, gain: 1.0, disc: 0.5, haze: 0.55 },
      { u: 0.225, v: 0.762, color: '#ffc873', reach: 0.22, gain: 1.0, disc: 0.5, haze: 0.55 },
    ],
    bloom: { threshold: 0.62, strength: 1.2, radius: 0.8 },
  },
  /**
   * Ch IV, FFX-2: the machina cathedral. Cyan-white light rains from the grated skylight; the
   * orange emergency lamps and the great round window burn in the violet dark.
   */
  'bevelle-underground': {
    ...FFX2_BASE,
    // D must-fix 3: the four-point lamp stars smaller, so they sit on the gantries instead of over them.
    streak: { ...FFX2_BASE.streak, gain: 0.9 },
    shafts: [
      { u: 0.5, v: 0.03, color: '#8fe6ff', reach: 1.0, gain: 1.7, disc: 0, haze: 0.25 },
      { u: 0.49, v: 0.5, color: '#ffa860', reach: 0.35, gain: 1.6, disc: 0.7, haze: 0.9 },
    ],
  },
  /**
   * Ch XVI, FFX-2: the round chamber. A cold beam from the high opening at the right crosses to
   * the floor; the amber work lamps glow in the dusty air (weak, as the painting has them).
   */
  'djose-chamber-provisional': {
    ...FFX2_BASE,
    bloom: { threshold: 0.7, strength: 0.95, radius: 0.5 },
    // D must-fix 7: the four-point star off the work lamp burned its lower pane; only the hottest peaks star now.
    streak: { ...FFX2_BASE.streak, gain: 1.0, threshold: 0.82 },
    shafts: [
      { u: 0.97, v: 0.06, color: '#cfe0ff', reach: 0.9, gain: 1.6, disc: 0.3, haze: 0.5 },
      // D must-fix 7: the work lamps glow without burning the painted mullions out.
      { u: 0.845, v: 0.43, color: '#ffb45a', reach: 0.28, gain: 0.55, disc: 0, haze: 0.45 },
      { u: 0.71, v: 0.22, color: '#ffb45a', reach: 0.24, gain: 0.45, disc: 0, haze: 0.5 },
    ],
  },
  /**
   * Ch V, FFX-2 (VP-1001-23): the Farplane plate is bright pastel paint edge to edge (luminance about
   * 0.76 behind the party), which is why its own palette blooms only above 0.9 at half strength
   * (`farplane.ts`). The FFX-2 default selective bloom (0.45, x1.5) spilled the sky over the girls,
   * who are 16 to 19 % of the frame by the approved staging A: Rikku's face washed to pink-white. The
   * bloom keeps to the hot light only, as the palette meant; nothing else changes.
   */
  farplane: {
    ...FFX2_BASE,
    shafts: [],
    bloom: { threshold: 0.86, strength: 0.9, radius: 0.55 },
  },
  /**
   * Ch XV, FFX-2 (VP-1001-03): the Den of Woe, back toward Bailey's O-3 A frame (a cold teal cave,
   * walls readable, round pyrefly motes). The FFX-2 defaults crushed it: the four-point star streak
   * turned the plate's round motes into star flares (the plate prompt excludes stars), and the full
   * Pink Hour look and vignette pushed the teal shadows to a navy void. No streak, a light look, no
   * extra vignette, and a bloom that only takes the motes.
   */
  'den-of-woe': {
    ...FFX2_BASE,
    shafts: [],
    streak: { ...FFX2_BASE.streak, gain: 0 },
    look: 0.35,
    vignetteAdd: 0,
    bloom: { threshold: 0.6, strength: 1.1, radius: 0.55 },
    // The plate's teal floor and rock walls back (its painted floor reads ~0.16/0.39/0.47): lift, and less of the blue split tone.
    grade: { gain: [1.8, 1.55, 1.35], lift: [0.02, 0.03, 0.036], shadowTintAmount: 0.04 },
  },
  /**
   * The experimental Leblanc chapter's Last Room (FFX-2 only; branch `exp-leblanc`, 2026-10-06): the "Moonlit Blue Hall" plate is a pale, soft lavender marble hall with a
   * polished floor, like the Farplane's pastel. Its own grade (`ScenePalettes.expMoonlitHall`: the plate as painted, then the mockup's haze) carries the look, so this row only
   * adds light. The FFX-2 defaults (bloom from 0.45 at x1.5, the full Pink Hour look, four-point star streaks at 0.74) were tuned for dark plates with a few neon lights:
   * on this one they bloomed the stained glass and every floor reflection to white. The plate paints its own light shafts (none added); the bloom is wide and soft
   * (threshold 0.5 on the linear frame, radius 0.8: the milky glow round the windows, the door and the floor's reflections, which lifts the glass toward the mockup's);
   * the stars only on the hottest peaks; no look LUT (its S-curve and split tone were tuned for dark plates and only harden pastels); no extra vignette.
   */
  'exp-leblanc-last-room': {
    ...FFX2_BASE,
    shafts: [],
    bloom: { threshold: 0.5, strength: 0.7, radius: 0.8 },
    streak: { ...FFX2_BASE.streak, gain: 0.45, threshold: 0.93 },
    look: 0,
    vignetteTint: '#9a96c8',
    vignetteAdd: 0,
  },
};

/** A room with no entry still gets the look, the bloom and the grade, with no shafts. */
export function sceneLookA(sceneKey: string, game: LookGame): SceneLookA {
  const hit = SCENE_LOOKS_A[sceneKey] ?? (sceneKey.includes('djose') ? SCENE_LOOKS_A['djose-chamber-provisional'] : undefined);
  if (hit && hit.game === game) return hit;
  return { ...(game === 'ffx2' ? FFX2_BASE : FFX_BASE), shafts: [] };
}

/** `#RRGGBB` to 0..1 channels. */
export function hex3(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
