/**
 * **Where the anime chapter's figures stand and how the camera sees them** (the hidden anime chapter, `data/chapter-exp-anime.ts`; FFX-2 only). Pure: arrays and numbers, no `three`, no DOM, so
 * `tests/unit/ww3d/anime-layout.test.ts` pins the picture without a browser. It is the Wind Waker chapter's staging table (`./layout.ts` `WwStaging`) filled in for a different cast: **the Meshy toon girls at their own
 * heights** (Yuna 1.60 m, Rikku 1.55, Paine 1.70: adults of about 7 heads after the part-2 proportion pass (`tools/anime/cast.mjs`), not the Wind Waker chapter's 3-head 1.2 m cast) and **Valefor at 5 m** (her file is 3.5 m: scaled by 1.43, the concept frames' size against the girls).
 *
 * ## The target
 *
 * The concept frame of the survey (`TARGET-C`'s composition: the party in a diagonal on the left, Valefor in the right half with her wings spread, the bottom fifth calm for the HUD) as the anime lab fitted it
 * (`meshy-mockup/lab/js/scene.mjs` `LAYOUT`, measured by its `layoutcheck.mjs`: Yuna x -0.14..0.25, Rikku 0.19..0.40, Paine 0.39..0.52, Valefor 0.39..1.2 of the frame): a low camera (0.37 m) at (1.5, 3.8) tipped 15.6 degrees up,
 * a 49 degree lens. **The lab had no engine: the game's CHAPTER FRAMING lifts the picture by about 0.04 of the frame (`engine/fx/mix/framing.ts`), which the numbers here do not carry; the first GPU job measures it** and
 * `anime-layout.test.ts` says what the pure projection gives. Staging is ours, not game data (AGENTS.md rule 6).
 *
 * Conventions are `./layout.ts`'s: world x to the right of the frame, y up, z toward the lens, the floor y 0, a model faces +Z at rotation 0.
 *
 * ## The weapons
 *
 * The Wind Waker weapon files (`props/`) are made for a 1.2 m girl; a 1.6 m girl holds them at {@link ANIME_WEAPON_SCALE} (the lab's 1.3). Their aim specs are the lab's (the elevation the weapon points at in the stance and
 * the most the wrist may bend, 110 degrees), on the Wind Waker chapter's grip frame (`./props.ts`).
 */

import { boxOf, pitchedLook, type RigData, type ScreenBox } from './camera.ts';
import { MODEL_FILE, PARTY_SLOTS as WW_PARTY_SLOTS, WW_BOSS_ID, WW_PARTY_IDS, type V3, type WwId, type WwStaging } from './layout.ts';
import type { PropSpec } from './props.ts';
import type { WingShape } from './wing.ts';

/**
 * The girls' own heights as exported (metres: the files of the proportion pass, about 7 heads: `tools/anime/proportion.mjs`; the files before it stood 1.60 / 1.55 / 1.70), and Valefor's file's 3.5 m (times
 * {@link BOSS_SCALE} for her height here). The engine fits each figure to its world height below, so these only place the hit burst's chest.
 */
export const ANIME_NATIVE_HEIGHT: Readonly<Record<WwId, number>> = { yuna: 1.623, rikku: 1.554, paine: 1.719, 'x2-valefor': 3.5 };
export const BOSS_SCALE = 5.0 / 3.5;
export const ANIME_WORLD_HEIGHT: Readonly<Record<WwId, number>> = { yuna: 1.6, rikku: 1.55, paine: 1.7, 'x2-valefor': 5.0 };

/** The party's three active slots (the lab's x, z), then the four reserve spots parked off the frame to the left (the Wind Waker chapter's: nine metres from the lens's axis, outside every rig). */
export const ANIME_PARTY_SLOTS: readonly V3[] = [[-0.55, 0, 0.9], [0.15, 0, -0.1], [1.1, 0, -1.3], ...WW_PARTY_SLOTS.slice(3)];

/** Valefor's spot (the right half, back) and the two reserve spots of a formation that fields more than one. */
export const ANIME_BOSS_SPOT: V3 = [4.1, 0, -4.0];
export const ANIME_ENEMY_SLOTS: readonly V3[] = [ANIME_BOSS_SPOT, [6.4, 0, -5.8], [2.2, 0, -7.0]];

/** How high Valefor hovers (the lab's lift), and where the girls aim their weapons (in front of her chest, nearer the lens: the lab's `aimz` 3). */
export const ANIME_BOSS_HOVER = 1.0;
export const ANIME_BOSS_AIM: V3 = [ANIME_BOSS_SPOT[0] - 0.4, 2.8, ANIME_BOSS_SPOT[2] + 3.0];

/** The turns (degrees): the body 42 off the direction to the lens, the face 24 off it, Valefor's yaw (the lab's -38). */
export const ANIME_BODY_OFF_DEG = 42;
export const ANIME_FACE_OFF_DEG = 24;
export const ANIME_BOSS_YAW_DEG = -38;

/** The Meshy idle bows the head about 30 degrees: a head that looks more than 4 degrees below the horizon is raised toward it, by at most 40 degrees (the lab's `headPitchMax` and `headPitchFix`). */
export const ANIME_HEAD_PITCH_FIX = { minPitchDeg: -4, limitDeg: 40 } as const;

/** The model file of each figure under `WW_MODEL_DIR`: the girls' LOD1 files in `anime/` (2048 px, 20k triangles, then the part-2 proportion pass) and Valefor's own feathered file in `anime/` (part 2; the Wind Waker chapter keeps `valefor.glb`). */
export const ANIME_FILES: Readonly<Record<WwId, string>> = { yuna: 'anime/yuna', rikku: 'anime/rikku', paine: 'anime/paine', 'x2-valefor': 'anime/valefor' };

/**
 * The Wind Waker chapter's own Valefor file (`valefor.glb`, the flat v2): what the anime chapter stood before part 2's feathered one. It is a name for the comparison only (a test pins it as the Wind Waker chapter's file and
 * not the anime chapter's); nothing falls back to it: `ANIME_FILES` names the new file, and a missing file draws the capsule, as for every figure. To put v2 back, change the one `x2-valefor` entry of `ANIME_FILES`.
 */
export const ANIME_VALEFOR_V2 = MODEL_FILE['x2-valefor'];

/**
 * **Valefor's file of part 2** (`anime/valefor.glb`: Meshy image-to-3D from a Flux 2 klein front view of concept frame A's Valefor, 25 thousand triangles, a 2048 px map; fitted by `tools/anime/valefor-fit.mjs` to 3.5 m, the claws on y 0,
 * the body's centre line on x 0, facing +Z): where her wings bend and where her mouth and chest are, in the file's own metres. The wings begin at the shoulders about 2.2 m up and sweep out to 3.3 m either side; below 1.4 m there is
 * the body, the legs and the tail plumes, which do not flap. Measured on the file by `tools/anime/valefor-fit.mjs` (its report: the beak, the chest, the body's half width by height; the handoff has them); staging, ours.
 */
export const ANIME_WING: WingShape = { cx: 0, start: 0.7, full: 2.4, yLo: 1.4, pivotY: 2.2, ampDeg: 22, hz: 0.6 };
export const ANIME_BOSS_POINTS = { mouth: [0, 2.86, 0.98] as V3, chest: [0, 1.9, 0.55] as V3 } as const;

/** The anime chapter's staging table. */
export const ANIME_STAGING: WwStaging = {
  partySlots: ANIME_PARTY_SLOTS,
  bossSpot: ANIME_BOSS_SPOT,
  nativeHeight: ANIME_NATIVE_HEIGHT,
  worldHeight: ANIME_WORLD_HEIGHT,
  partyHeight: ANIME_WORLD_HEIGHT.yuna,
  bossHeight: ANIME_WORLD_HEIGHT[WW_BOSS_ID],
  bossHover: ANIME_BOSS_HOVER,
  bossAim: ANIME_BOSS_AIM,
  bodyOffDeg: ANIME_BODY_OFF_DEG,
  faceOffDeg: ANIME_FACE_OFF_DEG,
  bossYawDeg: ANIME_BOSS_YAW_DEG,
  files: ANIME_FILES,
  girlChest: 0.58,
  headPitchFix: ANIME_HEAD_PITCH_FIX,
  wing: ANIME_WING,
  bossPoints: ANIME_BOSS_POINTS,
};

/** Half the width each figure stands, metres (arms in; Valefor's wings out: 6.6 m of span times {@link BOSS_SCALE}), for the frame's boxes. */
export const ANIME_HALF_WIDTH: Readonly<Record<WwId, number>> = { yuna: 0.45, rikku: 0.45, paine: 0.45, 'x2-valefor': 4.7 };

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// The camera
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * The target shot: the lab's lens (0.37 m up at (1.5, 3.8), a 49 degree lens) tipped 17.6 degrees up, the lab's 15.6 plus 2.0, which puts the picture back down by the 0.04 of the frame the engine's CHAPTER FRAMING
 * lifts it by (2.0 / 49 = 0.04; to be measured live: the first GPU job).
 */
export const ANIME_CAMERA_POSITION: V3 = [1.5, 0.37, 3.8];
export const ANIME_PITCH_DEG = 17.6;
export const ANIME_FOV = 49;

/** The rigs the scene publishes, by the presenter's names: the target shot is `idle`; the others are pushes toward who is being looked at, from the same low height (`./camera.ts` is the Wind Waker chapter's). */
export const ANIME_RIGS: Readonly<Record<string, RigData>> = {
  idle: { position: ANIME_CAMERA_POSITION, lookAt: pitchedLook(ANIME_CAMERA_POSITION, ANIME_PITCH_DEG), fov: ANIME_FOV },
  // the lab's wide start of the push-in (the same numbers the Wind Waker chapter uses): further back, higher, the party small and the boss whole
  intro: { position: [2.6, 2.2, 9.0], lookAt: [1.7, 1.5, -2.5], fov: 49, sway: 1.4 },
  // a push toward the middle of the fight: the lens a little left and in, the girls a touch bigger, Valefor still whole
  action: { position: [1.1, 0.5, 3.4], lookAt: [1.4, 2.4, -4.4], fov: 50, sway: 0.7 },
  // the girls: in front of the diagonal, a touch to the right, looking at Rikku's waist
  party: { position: [2.0, 0.8, 3.4], lookAt: [0.1, 0.95, -0.3], fov: 40, sway: 0.7 },
  // Valefor: from among the girls, looking up at her
  enemy: { position: [0.8, 0.9, 2.6], lookAt: [3.8, 3.2, -4.0], fov: 52, sway: 0.7 },
  // Valefor again, a little wider (the reveal at the opening)
  reveal: { position: [0.6, 1.1, 3.8], lookAt: [3.6, 3.0, -4.0], fov: 54, sway: 1.2 },
  victory: { position: [1.4, 0.6, 3.2], lookAt: [0.1, 1.0, -0.3], fov: 42, sway: 1.2 },
};

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// The weapons
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/** The Wind Waker weapon files are made for a 1.2 m girl: a 1.6 m girl holds them at 1.3 (the lab's). */
export const ANIME_WEAPON_SCALE = 1.3;

/** The girls' weapons on the Meshy toon rig: which hand, which file, and the aim in the stance (the lab's elevations, wrists free to bend 110 degrees). `scale` is the procedural stand-in's (the files ship, so it is rarely used). */
export const ANIME_PROP_SPECS: Readonly<Record<'yuna' | 'rikku' | 'paine', readonly PropSpec[]>> = {
  yuna: [
    { hand: 'LeftHand', name: 'pistol', scale: 0.8, tilt: 0, grip: 0.06, aim: { elev: 14, turn: 110 }, mirrorSwapped: true },
    { hand: 'RightHand', name: 'pistol', scale: 0.8, tilt: 0, grip: 0.06, aim: { elev: 6, turn: 110 }, mirrorSwapped: false },
  ],
  rikku: [
    { hand: 'LeftHand', name: 'dagger', scale: 1.0, tilt: 0, grip: 0.05, aim: { elev: -20, turn: 110 }, mirrorSwapped: true },
    { hand: 'RightHand', name: 'dagger', scale: 1.0, tilt: 0, grip: 0.05, aim: { elev: -12, turn: 110 }, mirrorSwapped: false },
  ],
  paine: [{ hand: 'RightHand', name: 'sword', scale: 0.85, tilt: 0, grip: 0.06, aim: { elev: 20, turn: 110 }, mirrorSwapped: false }],
};

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Boxes (a test's and the tuner's read)
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/** The screen boxes of the four figures through `rig` at a window `aspect` wide (Valefor's lifted by her hover), keyed by id: the numbers the framing is fitted with. */
export function animeBoxes(rig: RigData, aspect: number): Record<WwId, ScreenBox> {
  const out = {} as Record<WwId, ScreenBox>;
  WW_PARTY_IDS.forEach((id, i) => {
    out[id] = boxOf(rig, aspect, ANIME_PARTY_SLOTS[i]!, ANIME_WORLD_HEIGHT[id], ANIME_HALF_WIDTH[id]);
  });
  out[WW_BOSS_ID] = boxOf(rig, aspect, ANIME_BOSS_SPOT, ANIME_WORLD_HEIGHT[WW_BOSS_ID], ANIME_HALF_WIDTH[WW_BOSS_ID], ANIME_BOSS_HOVER);
  return out;
}
