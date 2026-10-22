/**
 * **Framing mockups: two closer resting views, opt-in** (the hidden 3D Bahamut chapter, `data/chapter-exp-yrp-3d.ts`; FFX-2 only). Bailey: the girls look small at frame A's resting camera (21 to 27 percent of the screen's
 * height, a face about 30 px at 1600x900). Frame A is the approved target and stays the default and the only view anyone gets without asking; `?frame=b` and `?frame=c` are two mockups of what a closer chapter would be, for
 * Bailey to look at and pick (AGENTS.md hard rule 9: show the options before building one). Nothing here is balance or game data (rule 6): it is where a camera stands.
 *
 * - **a** (the default, no query): `RIGS.idle` in `./layout.ts`, unchanged. Measured live at 1600x900 (silhouettes, head to feet): Yuna 29 percent of the frame's height, Rikku 24, Paine 22 (a face about 26 to 32 px); Bahamut 59.
 * - **b** (`?frame=b`): the camera **dollies in and comes down** (to 2.9 m, a pitch of about 7 degrees against A's 15) so the girls stand about 36 percent of the height live (Yuna 44, Rikku 34, Paine 30; a face 34 to 50 px) while
 *   Bahamut stays in frame on the left from his feet to his horns, only his far wing tip leaving the left edge (as A's does).
 * - **c** (`?frame=c`): a **lower, closer three-quarter** from the right, a little above the girls' heads: about 43 percent live (Yuna 54, Rikku 40, Paine 34; a face 38 to 61 px) and Bahamut towers partly out of the top
 *   of the frame (his head and a wing tip cropped, his body and feet in).
 *
 * **The live sizes are not the layout maths'** (`layout.ts`'s projection reads 0.37 for b and 0.47 for c): the game's CHAPTER FRAMING (`engine/fx/mix`, on by default) takes any resting rig as the chapter's master, pulls it back
 * a few percent and shifts the picture by a lens offset (about 128 px left) to clear the command menu, and a silhouette is about 0.93 of a model's box. The rigs below were tuned against that, measured in the page. **The menu
 * still covers the front girl in b and c** (the planner reports Yuna 80 to 90 percent under the command stack in b, 60 to 80 in c; 58 in A): the command stack stands in the right quarter, where the girls are.
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

/** Frame b's resting camera: in and down, the girls at 0.37 of the height by the layout maths (Yuna 0.43, Rikku 0.36, Paine 0.31; about 0.36 live), Bahamut's body and feet in frame. */
export const IDLE_B: RigData = { position: [3.05, 2.88, 8.21], lookAt: [0.75, 1.8, -1.0], fov: 32 };

/** Frame c's resting camera: low and close, the girls at 0.47 of the height by the layout maths (Yuna 0.58, Rikku 0.46, Paine 0.38; about 0.43 live), Bahamut's head and a wing tip above the frame. */
export const IDLE_C: RigData = { position: [4.04, 1.86, 6.34], lookAt: [1.0, 1.2, -2.5], fov: 32 };

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
