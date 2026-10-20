/**
 * Demo looks: the colour grade of each look, as a 3D LUT built at run time (no image asset) with option A2's own builder (`fx/a/LookLut.ts`), which `GradeShader`
 * already samples (`uLook`). Each look has a base recipe; a room (its `sceneKey`) can override the recipe, the shadow and highlight hues, the light the shafts and
 * rim follow, and the fog colour. Pure data and maths (no `three`): `lutBytes` returns the bytes the rig uploads. Both games: every room's hues come from its
 * own painting palette unless the table names them.
 */
import { FFX2_RECIPE, FFX_RECIPE, atLuma, buildLookLut, complement, hexRgb, type LookPalette, type LookRecipe } from '../fx/a/LookLut.ts';
import type { LookName, Rgb } from './LookConfig.ts';

export type GameKey = 'ffx' | 'ffx2';

/** One room's overrides for one look. Every field is optional: unset means "derive it from the painting". */
export interface RoomLook {
  /** Recipe fields to change (tone curve strength, saturation, how far the hues move the shadows and highlights). */
  recipe?: Partial<LookRecipe>;
  /** The hues the shadows and highlights are moved toward (0..1 per channel). */
  shadow?: Rgb;
  highlight?: Rgb;
  /** Where the room's light is on the painting (0..1 from the top-left) and its colour: the shafts and the rim follow it. Unset: found from the picture. */
  light?: { u: number; v: number; color: Rgb };
  /** The fog's colour (the cinematic look); unset: the painting's sky pulled toward its key. */
  fog?: Rgb;
  /** The sharp band's centre for the depth of field (0 bottom .. 1 top); unset: the look's own. */
  focus?: number;
}

/** Per look, per sceneKey. Filled from the rooms' captures (see `docs/handoff/demo-looks.md`). */
export const ROOM_LOOKS: Readonly<Record<LookName, Readonly<Record<string, RoomLook>>>> = {
  hd2d: {},
  cinematic: {},
  anime: {},
};

const BASE: Readonly<Record<LookName, LookRecipe>> = {
  // Octopath: cool blue shadows, warm gold highlights, rich mids.
  hd2d: { shadowSplit: 0.32, highlightSplit: 0.22, shadowHue: [0.2, 0.3, 0.62], highlightHue: [1.0, 0.9, 0.7], topBias: [1, 0.92, 0.74], topBiasAmount: 0.35, contrast: 0.3, shoulder: 0.8, midSat: 0.4, deepDesat: 0 },
  // Expedition 33: a strong, painterly split; muted mids, deep shadows tinted by the room's own dark.
  cinematic: { shadowSplit: 0.5, highlightSplit: 0.34, shadowHue: null, highlightHue: null, topBias: null, topBiasAmount: 0, contrast: 0.56, shoulder: 0.72, midSat: 0.1, deepDesat: 0.08 },
  // Crisp cel look: little tint, a firm S-curve, strong mids.
  anime: { shadowSplit: 0.08, highlightSplit: 0.05, shadowHue: null, highlightHue: null, topBias: null, topBiasAmount: 0, contrast: 0.5, shoulder: 0.86, midSat: 0.55, deepDesat: 0 },
};

const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** The recipe in force for a look, a game and a room: the base, the game's flavour of it (FFX gold / FFX-2 violet and pink for the shadow and highlight), the room's overrides. */
export function recipeFor(look: LookName, game: GameKey, sceneKey: string, palette: LookPalette): LookRecipe {
  const room = ROOM_LOOKS[look][sceneKey];
  const r: LookRecipe = { ...BASE[look] };
  const key = hexRgb(palette.key);
  const sky = hexRgb(palette.sky);
  if (look === 'cinematic') {
    // shadows lean to the room's own dark with a good share of the key's complement; highlights are the key lifted
    r.shadowHue = atLuma(mixRgb(sky, complement(key), 0.4), 0.5);
    r.highlightHue = atLuma(key, 1);
    if (game === 'ffx2') {
      r.shadowHue = mixRgb(r.shadowHue, FFX2_RECIPE.shadowHue!, 0.45);
      r.highlightHue = mixRgb(r.highlightHue, FFX2_RECIPE.highlightHue!, 0.35);
    } else {
      r.topBias = FFX_RECIPE.topBias;
      r.topBiasAmount = 0.2;
    }
  } else if (look === 'anime') {
    r.shadowHue = atLuma(mixRgb(sky, complement(key), 0.15), 0.5);
    r.highlightHue = atLuma(key, 1);
  } else if (game === 'ffx2') {
    r.shadowHue = [0.26, 0.2, 0.6]; // hd2d, FFX-2: the violet end of the blue
    r.highlightHue = [1.0, 0.84, 0.82];
  }
  if (room?.shadow) r.shadowHue = room.shadow;
  if (room?.highlight) r.highlightHue = room.highlight;
  return room?.recipe ? { ...r, ...room.recipe } : r;
}

/** The LUT bytes for a look in a room (`LUT_SIZE` cubed RGBA, red fastest): `GradeShader`'s `uLook`. */
export function lutBytes(look: LookName, game: GameKey, sceneKey: string, palette: LookPalette): Uint8Array {
  return buildLookLut(palette, recipeFor(look, game, sceneKey, palette));
}

/** A cache key that changes whenever the LUT would. */
export function lutKey(look: LookName, game: GameKey, sceneKey: string, palette: LookPalette): string {
  return `${look}:${game}:${sceneKey}:${palette.key}:${palette.sky}`;
}
