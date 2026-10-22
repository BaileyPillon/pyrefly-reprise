/**
 * **Framing mockups: two closer resting views, opt-in** (the hidden 3D Bahamut chapter, `data/chapter-exp-yrp-3d.ts`; FFX-2 only). Bailey: the girls look small at frame A's resting camera (21 to 27 percent of the screen's
 * height, a face about 30 px at 1600x900). Frame A is the approved target and stays the default and the only view anyone gets without asking; `?frame=b` and `?frame=c` are two mockups of what a closer chapter would be, for
 * Bailey to look at and pick (AGENTS.md hard rule 9: show the options before building one). Nothing here is balance or game data (rule 6): it is where a camera stands.
 *
 * - **a** (the default, no query): `RIGS.idle` in `./layout.ts`, unchanged. The girls stand 24 to 30 percent of the frame's height (Paine at the back to Yuna at the front), Bahamut 61.
 * - **b** (`?frame=b`): the camera **dollies in and comes down** (pitch about 6 degrees against A's 15, yaw close to A's) so the girls stand about 35 percent of the height, Yuna 38 and Paine 31, while Bahamut stays
 *   in frame on the left from his feet to his horns, only his far wing tip leaving the left edge (as A's does). The feet stay above the calm band for the HUD.
 * - **c** (`?frame=c`): a **lower, closer three-quarter** from the right, a little below the girls' heads: they stand about 44 percent of the height (a face about 50 px) and Bahamut towers partly out of the top of the
 *   frame (horns and wing tips cropped, his body and feet in). The girls' feet reach about 0.9 of the height, the lowest this look takes.
 *
 * What a frame changes: the **resting** shots, `idle` (the view while a menu is up and between actions) and `intro` (the establishing shot, the same view pulled back). Every other rig is frame A's: the close shots
 * (`party`, `enemy`, `bahamut`, `victory`) already show the girls at 36 to 57 percent and are fitted to who they look at, `action` is not played by the presenter, and `overdrive` is end-state frame C's Mega Flare camera.
 * The painting's parallax stack is aligned for the frame's own `idle` (the scene passes it as `cameraRef`), so the bands register at rest in every frame. Pure: numbers only, no `three`, no DOM.
 */

import { RIGS, type RigData, type V3 } from './layout.ts';

/** The frames: `a` is the approved layout and the default. */
export type FrameName = 'a' | 'b' | 'c';
export const FRAME_NAMES: readonly FrameName[] = ['a', 'b', 'c'];

/** The frame a page asks for: `?frame=b` or `?frame=c` (any case); anything else, or nothing, is frame A. */
export function frameChoice(search: string): FrameName {
  const asked = new URLSearchParams(search).get('frame')?.toLowerCase();
  return asked === 'b' || asked === 'c' ? asked : 'a';
}

/** Frame b's resting camera: in and down, the girls at 0.35 of the height (Yuna 0.38, Rikku 0.34, Paine 0.31), Bahamut's body and feet in frame. */
export const IDLE_B: RigData = { position: [3.2, 2.75, 8.8], lookAt: [0.75, 1.6, -1.0], fov: 32 };

/** Frame c's resting camera: low and close, the girls at 0.44 of the height (Yuna 0.48, Rikku 0.43, Paine 0.39), Bahamut's head and wing tips above the frame. */
export const IDLE_C: RigData = { position: [4.2, 1.9, 6.8], lookAt: [1.0, 1.2, -2.5], fov: 32 };

/**
 * The establishing shot of a frame: its resting camera pulled back along its own line of sight by `back` (A's `intro` stands 1.8 times as far from its look-at as `idle` does), lifted by `lift` metres and aimed a
 * little higher and further back (`aimX` is how far its look-at sits right of the resting one's: frame c's, further right, keeps the left edge on the painting), so Bahamut stands alone in the left half and the row
 * is small (the presenter pushes in from it to the resting shot).
 */
export function establishing(rest: RigData, back = 1.8, lift = 1.4, aimX = -0.4): RigData {
  const at: V3 = [rest.lookAt[0] + aimX, rest.lookAt[1] + 0.45, rest.lookAt[2] - 1.8];
  const round = (n: number): number => Math.round(n * 100) / 100;
  const position: V3 = [0, 1, 2].map((i) => round(rest.lookAt[i]! + (rest.position[i]! - rest.lookAt[i]!) * back + (i === 1 ? lift : 0))) as unknown as V3;
  return { position, lookAt: at, fov: rest.fov, sway: 1.4 };
}

/** The rig table of each frame: A's `RIGS` as they are, and B's and C's with the resting shots (`idle`, `intro`) replaced. */
export const FRAME_RIGS: Readonly<Record<FrameName, Readonly<Record<string, RigData>>>> = {
  a: RIGS,
  b: { ...RIGS, idle: IDLE_B, intro: establishing(IDLE_B) },
  c: { ...RIGS, idle: IDLE_C, intro: establishing(IDLE_C, 1.8, 1.4, 0.8) },
};

/** The rigs the scene publishes for `frame`. */
export const rigsFor = (frame: FrameName): Readonly<Record<string, RigData>> => FRAME_RIGS[frame];
