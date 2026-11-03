/**
 * **The real models' look: one table to tune** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only). Bailey asked for the girls to read clearly in the arena: the first in-game shots had them too
 * dark, too blue and too small. The target is the soft studio of the turntable sheets he liked (`soft-studio/scripts/studio.py`, `yrp-assets/scripts/preview-bahamut-turn.py`, "plain" mode): a neutral-warm key, a cool-neutral
 * fill, a soft rim from behind and a grey world, true skin and costume colours, no gloss. {@link LOOK} is that rig, **and the only place its numbers live**: every value a later tuning round may touch is here.
 *
 * ## Why the girls were dark, blue and small
 *
 * - **Dark.** Chapter IV's grade never encodes sRGB (the post chain works in linear light and nothing encodes it: `../figureTrue.ts`), so a figure lit to 0.45 linear reached the screen as 0.45, not 0.71. The chapter's own grade
 *   now encodes (`./stageLook.ts`, `YRP_PALETTE`, gamma 2.2), which is what the studio's "Standard" view does, so the same light numbers as the studio's give the studio's brightness.
 * - **Blue.** The chamber's own lights light every real surface: a cyan key from behind, a cold sky fill, a rust rim, a dark-blue ambient, and the hole's cyan uplight, all on top of the figures' three. {@link LOOK}`.room` scales
 *   them (the chamber's key, fill, rim and ambient go to nothing: with the deck hidden, the figures are the only lit things in the room). Fog is off on the figures' materials (`LOOK.figure.fog`).
 * - **Small.** The close shots take the long lens (`./layout.ts`, `longLens`); frame A's size is unchanged.
 *
 * ## The rig
 *
 * Three suns and a world, **copied from the studio**: a Blender sun of strength S lights a diffuse white to S/pi at normal incidence, which is a three.js directional light of intensity S (the lights have no pi
 * factor since r155), and the world's grey radiance 0.2158605 (sRGB 128) is an ambient light of pi times that. Each light stands at an **azimuth from the camera's axis** (positive toward the camera's right: the studio's own
 * convention) and an elevation, **measured from frame A's camera toward Yuna's mark and then held in the world**, so a close shot, a turning camera and a figure that lunges see the same light (the lab's habit,
 * `look-shaders.js`). Colours are linear RGB, as Blender's light colours are. The lights are on the figure layer too (`LAYER.figure`) so the floor's mirror, which draws that layer alone, lights the figures it reflects.
 *
 * Pure: arrays and numbers, no `three`, no DOM, so `tests/unit/yrp3d/look.test.ts` pins the rig without a renderer (the build of the lights themselves is `./rig.ts`'s). Game case: FFX-2 only (Chapter IV's Bahamut fight).
 */

import { PARTY_SLOTS, RIGS, type V3 } from './layout.ts';

const DEG = Math.PI / 180;

/** The three.js layers the chapter draws on, besides the default layer 0: the figures (the floor's mirror draws them alone) and the painted backdrop (the floor draws it alone for its lantern streaks). */
export const LAYER = { figure: 1, backdrop: 2 } as const;

/** One of the rig's suns: where it stands from the camera's axis (degrees; azimuth positive toward the camera's right, elevation above the horizon), how strong, and its colour (linear RGB). */
export interface RigLight {
  readonly az: number;
  readonly el: number;
  readonly intensity: number;
  readonly colour: V3;
}

/** The whole rig: three suns and the ambient (the world's light). */
export interface Rig {
  readonly key: RigLight;
  readonly fill: RigLight;
  readonly rim: RigLight;
  readonly ambient: { readonly intensity: number; readonly colour: V3 };
}

/** The grey world's radiance, linear: the studio's `plain_grey`, sRGB 128. */
export const STUDIO_GREY = 0.2158605;

/**
 * **THE TUNING TABLE.** `rig` is the figures' light (the studio's, number for number); `room` is how much of Chapter IV's own light still reaches them; `figure` is what their materials do about the scene.
 *
 * - `rig.key`, `rig.fill`, `rig.rim`: azimuth and elevation in degrees, intensity (1 lights a white to 0.32 at normal incidence), linear colour. The key is the studio's front-left warm sun, the fill its cool-neutral one on the
 *   far side and low, the rim its soft sun from behind. Raise `intensity` to brighten, move `az` to turn a light, push a colour toward 1,1,1 to neutralise it.
 * - `rig.ambient`: the world's light, an ambient light of `intensity` (pi times the grey's radiance) and a colour. It is what keeps a side away from every sun from going black.
 * - `room.key`, `room.fill`, `room.rim`, `room.ambient`: the share of the chamber's own cyan key, cold sky fill, rust rim and dark-blue ambient that stays, 0 to 1 (0 is gone). `room.practicals` is the four rust lamps' point lights
 *   and `room.hole` the pit's cyan uplight (their flicker is kept; the share multiplies it). The chamber's key also stops casting a shadow map while the deck is hidden: no receiver is left.
 * - `figure.fog`: whether the scene's fog reaches the figures' materials (it is off: a figure takes its colour from the light, not from the distance).
 */
export const LOOK = {
  rig: {
    key: { az: -40, el: 48, intensity: 3.0, colour: [1.0, 0.95, 0.88] },
    fill: { az: 65, el: 22, intensity: 0.9, colour: [0.88, 0.93, 1.0] },
    rim: { az: 165, el: 40, intensity: 1.8, colour: [1.0, 0.97, 0.92] },
    ambient: { intensity: Math.PI * STUDIO_GREY, colour: [1, 1, 1] },
  },
  room: { key: 0, fill: 0, rim: 0, ambient: 0, practicals: 1, hole: 0.35 },
  figure: { fog: false },
} as const satisfies {
  rig: Rig;
  room: Record<'key' | 'fill' | 'rim' | 'ambient' | 'practicals' | 'hole', number>;
  figure: { fog: boolean };
};

export type SunName = 'key' | 'fill' | 'rim';
export const SUNS: readonly SunName[] = ['key', 'fill', 'rim'];

const normalise = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/**
 * The world-space unit vectors **toward** each sun, for a camera at `camera` looking at a figure whose chest is at `chest`: the horizontal unit vector to the camera and to the camera's right are the frame, `az` turns away
 * from the camera's axis toward the right, `el` lifts. (With `az` 0 and `el` 0 a light stands at the camera; with `az` 180 it stands behind the figure on the camera's line.)
 */
export function lightDirections(camera: V3, chest: V3, rig: Pick<Rig, SunName> = LOOK.rig): Record<SunName, V3> {
  const to = normalise([camera[0] - chest[0], 0, camera[2] - chest[2]]);
  const right: V3 = [to[2], 0, -to[0]]; // cross(-toCam, up): the camera's right
  const dir = (s: RigLight): V3 => {
    const c = Math.cos(s.el * DEG);
    const a = s.az * DEG;
    return normalise([to[0] * c * Math.cos(a) + right[0] * c * Math.sin(a), Math.sin(s.el * DEG), to[2] * c * Math.cos(a) + right[2] * c * Math.sin(a)]);
  };
  return { key: dir(rig.key), fill: dir(rig.fill), rim: dir(rig.rim) };
}

/** Where frame A's camera looks at Yuna's mark from, and the height of her chest there: what the rig's azimuths are measured against. */
export const RIG_VIEW = { camera: RIGS['idle']!.position, chest: [PARTY_SLOTS[0]![0], 1.3, PARTY_SLOTS[0]![2]] as V3 } as const;

/** The rig's three suns, fixed in the world: the directions from frame A's camera toward Yuna's mark (held for every shot), with each sun's colour and intensity. */
export function frameALights(rig: Pick<Rig, SunName> = LOOK.rig): { dir: Record<SunName, V3>; colour: Record<SunName, V3>; intensity: Record<SunName, number> } {
  return {
    dir: lightDirections(RIG_VIEW.camera, RIG_VIEW.chest, rig),
    colour: { key: rig.key.colour, fill: rig.fill.colour, rim: rig.rim.colour },
    intensity: { key: rig.key.intensity, fill: rig.fill.intensity, rim: rig.rim.intensity },
  };
}

/**
 * The linear light a white diffuse surface of normal `n` (a unit vector) sends out under the rig, per channel: each sun's `intensity * max(0, n . dir) / pi` in its colour, plus the ambient's `intensity / pi`. The
 * three.js lights compute exactly this (without the pi factor on the intensities, since r155), so a test can pin the figures' brightness and tint without a renderer. Multiply by an albedo to get a surface.
 */
export function litBy(n: V3, rig: Rig = LOOK.rig): V3 {
  const { dir, colour, intensity } = frameALights(rig);
  const out: [number, number, number] = [rig.ambient.colour[0] * rig.ambient.intensity, rig.ambient.colour[1] * rig.ambient.intensity, rig.ambient.colour[2] * rig.ambient.intensity];
  for (const s of SUNS) {
    const ndl = Math.max(0, n[0] * dir[s][0] + n[1] * dir[s][1] + n[2] * dir[s][2]);
    for (let i = 0; i < 3; i++) out[i]! += colour[s][i]! * intensity[s] * ndl;
  }
  return [out[0] / Math.PI, out[1] / Math.PI, out[2] / Math.PI];
}

/** The display value (0..1) a linear value reaches under the chapter's own grade, which encodes with gamma 2.2 (`./stageLook.ts`). */
export const displayOf = (linear: number): number => Math.pow(Math.min(1, Math.max(0, linear)), 1 / 2.2);

/** A change to some of the rig's numbers: each sun's fields (and the ambient's) that are given replace the table's. */
export interface RigPatch {
  readonly key?: Partial<RigLight>;
  readonly fill?: Partial<RigLight>;
  readonly rim?: Partial<RigLight>;
  readonly ambient?: Partial<Rig['ambient']>;
}

/** The rig with `patch` laid over it (a debug handle's live tuning: `__yrp3d.tune({ key: { intensity: 2.4 } })`). */
export function mergeRig(base: Rig, patch: RigPatch): Rig {
  return {
    key: { ...base.key, ...patch.key },
    fill: { ...base.fill, ...patch.fill },
    rim: { ...base.rim, ...patch.rim },
    ambient: { ...base.ambient, ...patch.ambient },
  };
}
