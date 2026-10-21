/**
 * Demo looks, the DEPTH STAGE (release 61, decision 169m, Bailey 2026-10-21 ~00:30 EDT: "Add depth and life (Recommended)": parallax layers, drifting snow and mist, moonlight on the ice).
 * Both games for the plumbing (`LookStage.ts`); each room's recipe is its own entry below, and only Chapter I's room, Mt. Gagazet (FFX), has one. No flag of its own: it runs exactly while an HD-2D
 * look at bold strength is on in a room that has a recipe, so `?look=off` and the VISUAL STYLE setting's CLASSIC (both of which turn the look off) turn every part of it off, and nothing here
 * is built until then. Pure (no DOM, no `three`).
 *
 * What a recipe holds (each number says what it makes visible):
 *  - `wind`: the room's gusts (`StageMaths.gustAt`): the weather leans into one breath of wind together;
 *  - `glint`: the moon's glitter on the ice: a road of sparkling facets on the floor toward the moon, moving with the camera because it is real geometry;
 *  - `mist`: low banks of mist that roll along the ice in front of and behind the fighters (cut away by the nearer rocks by their own depth), never over a face;
 *  - the quality tiers (`lookq=medium|low`, F7) drop the glint, the snow and the mist sheets, and soften the wind (`STAGE_QUALITY`).
 */
import type { LookQuality } from '../LookConfig.ts';
import { NO_WIND, type WindSpec } from './StageMaths.ts';

export type Rgb = [number, number, number];

export interface GlintSpec {
  /** Where the moon is, as a point on the painting (u from the left, v from the top, 0..1): the room's own light, read once. */
  moon: readonly [number, number];
  /** The light's colour, sRGB 0..1. */
  color: Rgb;
  /** Brightness of the sparkles (linear, additive; 1 = a sparkle at the peak lifts a dark floor by about the moon's own value). */
  gain: number;
  /** Size of one ice facet on the floor, metres. */
  cell: number;
  /** How far a facet may tilt from flat (radians, per axis): wider = a broader road. */
  rough: number;
  /** How exactly a facet must line up with the half vector (a cosine margin): narrower = fewer, hotter sparkles. */
  width: number;
  /** Twinkle rate (radians a second at the slowest facet). */
  speed: number;
  /** The floor's patch: centre (x, z) and radius, metres; the glitter dissolves toward the rim, so the patch never shows its own edge. */
  center: readonly [number, number];
  radius: number;
  /** A broad soft sheen along the road, under the sparkles (0 = none). */
  sheen: number;
}

export interface MistSpec {
  /** Height of the bank's centre above the floor and its size (metres): rolls along x, faces the camera. */
  y: number;
  z: number;
  w: number;
  h: number;
  /** Opacity at the densest, sRGB colour, and the bank's drift (uv a second) in the wind. */
  opacity: number;
  color: Rgb;
  flow: readonly [number, number];
  /** 0 = in front of the figures (they are in it, up to their knees), 1 = behind them (renderOrder under the figures). */
  behind: boolean;
  /** Noise cells across and down, and the cover threshold (higher = thinner wisps). */
  scale: readonly [number, number];
  cover: number;
}

export interface StageRecipe {
  game: 'ffx' | 'ffx2';
  wind: WindSpec;
  glint: GlintSpec | null;
  mist: readonly MistSpec[];
}

/** What one quality tier keeps of a recipe. */
export interface StageQuality {
  /** The share of the glitter's brightness kept (0 = the sheet is not drawn). */
  glint: number;
  /** The share of the weather's particles (the snow bands, option B's flakes) and of its mist sheets that stay (`StageWind.density`). */
  density: number;
  /** The wind's strength. */
  wind: number;
}

export const STAGE_QUALITY: Readonly<Record<LookQuality, StageQuality>> = {
  high: { glint: 1, density: 1, wind: 1 },
  medium: { glint: 0.7, density: 0.7, wind: 0.85 },
  low: { glint: 0, density: 0.45, wind: 0.6 },
};

export const NO_STAGE: StageRecipe = { game: 'ffx', wind: NO_WIND, glint: null, mist: [] };

/**
 * Chapter I (FFX), Mt. Gagazet at night. The wind comes in gusts about every 11 seconds. The moon is the painting's own (u 0.226, v 0.154, found by `LookLight`); its glitter lies on the
 * ice as a road of facets whose colour is the painting's own cold white. The mist is two low banks (one behind the fighters, one that crosses their feet) in the ice's own pale blue.
 */
export const ROOM_STAGE: Readonly<Record<string, StageRecipe>> = {
  gagazet: {
    game: 'ffx',
    wind: { every: 11, length: 4.2, speedUp: 1.6, thicken: 0.9, shaft: 0.35, phase: 3 },
    glint: { moon: [0.226, 0.154], color: [0.78, 0.9, 1.0], gain: 1.6, cell: 0.07, rough: 0.42, width: 0.05, speed: 2.1, center: [-3, -4], radius: 17, sheen: 0.1 },
    mist: [
      { y: 0.55, z: -9, w: 44, h: 3.2, opacity: 0.5, color: [0.66, 0.8, 1.0], flow: [0.06, 0.004], behind: true, scale: [3.2, 1.1], cover: 0.36 },
      { y: 0.3, z: 2.2, w: 34, h: 1.5, opacity: 0.26, color: [0.72, 0.84, 1.0], flow: [0.1, 0.006], behind: false, scale: [4.6, 1.0], cover: 0.42 },
    ],
  },
};

export const stageRecipe = (key: string): StageRecipe | null => (Object.prototype.hasOwnProperty.call(ROOM_STAGE, key) ? ROOM_STAGE[key]! : null);

/** The stage runs for a room when the look is hd2d or cinematic at bold strength and the room has a recipe. Anime and subtle keep today's frame. */
export function stageWanted(look: string | null, strength: string, key: string): boolean {
  return look !== null && look !== 'anime' && strength === 'bold' && stageRecipe(key) !== null;
}

/**
 * `?stage=off` (a dev flag, for the before / after captures and for finding what is the stage's): the HD-2D bold look runs as it did in release 60 and the depth stage does nothing. Read once
 * from the address; `__pyrefly.look.param('stage.off', 1)` does the same live.
 */
export function stageSwitchedOff(search: string): boolean {
  try {
    return (new URLSearchParams(search).get('stage') ?? '').trim().toLowerCase() === 'off';
  } catch {
    return false;
  }
}
