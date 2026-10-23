/**
 * **The framing** (the hidden 3D Bahamut chapter, `data/chapter-exp-yrp-3d.ts`; FFX-2 only). Bailey: the girls looked small at frame A's resting camera (21 to 27 percent of the screen's height, a face about 30 px at 1600x900),
 * was shown three framings and picked **"b: dolly in"** (2026-10-22): **frame b is the default**. `?frame=a` is the old framing exactly as it was (the approved layout) and `?frame=c` the opt-in lower three-quarter.
 * Nothing here is balance or game data (rule 6): it is where a camera and the party stand.
 *
 * - **a** (`?frame=a`): `RIGS.idle` in `./layout.ts`, unchanged. Measured live at 1600x900 (silhouettes, head to feet): Yuna 28 percent of the frame's height, Rikku 23 to 24, Paine 22 (a face about 25 to 32 px); Bahamut 77.
 * - **b** (the default): the camera **dollies in and comes down** (to 3.0 m, a pitch of about 7 degrees against A's 15) and **the party's three active slots stand 1.9 m toward Bahamut** (`PARTY_DX`), so the girls stand about a
 *   third of the height live (Yuna 40 to 44, Rikku 31 to 34, Paine 28 to 30; a face 32 to 50 px) with Bahamut in frame on the left from his feet to his horns, only his far wing tip leaving the left edge (as A's does). The nudge
 *   is what clears the menu: at frame A's slots the command stack and the party stats covered the front girl (Yuna 80 to 90 percent under them, 58 in A); at b's the planner leaves about 1 percent of her silhouette (8 percent of
 *   her box) under them live, and the other two none. The two close shots that look at the party (`party`, `victory`) are panned with it.
 * - **c** (`?frame=c`): a **lower, closer three-quarter** from the right, a little above the girls' heads: about 41 to 43 percent live (Yuna 52 to 54, Rikku 39 to 40, Paine 33 to 35; a face 37 to 61 px) and Bahamut towers
 *   partly out of the top of the frame (his head and a wing tip cropped, his body and feet in). The menu still covers the front girl in c (60 to 80 percent). The range in each is the game's own camera planner, which settles
 *   a few points differently from one run to the next.
 *
 * **The live sizes are not the layout maths'** (`layout.ts`'s projection reads 0.37 for b and 0.47 for c): the game's CHAPTER FRAMING (`engine/fx/mix`, on by default) takes any resting rig as the chapter's master, pulls it back
 * a few percent and shifts the picture by a lens offset (up to 128 px either way) to clear the command menu, and a silhouette is about 0.93 of a model's box. The rigs below were tuned against that, measured in the page.
 *
 * What a frame changes: the **resting** shots, `idle` (the view while a menu is up and between actions) and `intro` (the establishing shot, the same view pulled back), and in b the party's place and the two close shots that
 * look at it. Every other rig is frame A's: the close shots (`enemy`, `bahamut`) look at Bahamut, `action` is not played by the presenter, and `overdrive` is end-state frame C's Mega Flare camera.
 * The painting's parallax stack is aligned for the frame's own `idle` (the scene passes it as `cameraRef`), so the bands register at rest in every frame. Pure: numbers only, no `three`, no DOM.
 */

import { PARTY_SLOTS, RIGS, type RigData, type V3 } from './layout.ts';

/** The frames: `a` is the approved layout, kept behind `?frame=a`; `b` is the chapter's default since Bailey's pick of the dolly-in (2026-10-22); `c` is the opt-in lower three-quarter. */
export type FrameName = 'a' | 'b' | 'c';
export const FRAME_NAMES: readonly FrameName[] = ['a', 'b', 'c'];

/** The frame a page gets with no query, and for any query that is not `a` or `c`. */
export const DEFAULT_FRAME: FrameName = 'b';

/** The frame a page asks for: `?frame=a` (the old framing) or `?frame=c` (any case); anything else, or nothing, is the default, frame b. */
export function frameChoice(search: string): FrameName {
  const asked = new URLSearchParams(search).get('frame')?.toLowerCase();
  return asked === 'a' || asked === 'c' ? asked : DEFAULT_FRAME;
}

/** Frame b's resting camera: in and down, the girls at 0.37 of the height by the layout maths (Yuna 0.43, Rikku 0.36, Paine 0.31; about 0.36 live), Bahamut's body and feet in frame. */
export const IDLE_B: RigData = { position: [3.05, 3.0, 8.21], lookAt: [0.75, 1.92, -1.0], fov: 32 };

/** How far the party's three active slots stand from frame A's, along x in metres (negative: toward Bahamut). */
export const PARTY_DX: Readonly<Record<FrameName, number>> = { a: 0, b: -1.9, c: 0 };

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

/** A rig panned along x by `dx` (the camera and its look-at together), for a close shot that looks at the party. */
export const panned = (rig: RigData, dx: number): RigData => {
  const round = (n: number): number => Math.round(n * 100) / 100;
  return { ...rig, position: [round(rig.position[0] + dx), rig.position[1], rig.position[2]], lookAt: [round(rig.lookAt[0] + dx), rig.lookAt[1], rig.lookAt[2]] };
};

/** The party's slots in `frame`: frame A's, with the three active ones stood `PARTY_DX` along x (the four reserve spots stay off the frame where they were). */
export const partySlotsFor = (frame: FrameName): readonly V3[] => {
  const dx = PARTY_DX[frame];
  return dx === 0 ? PARTY_SLOTS : PARTY_SLOTS.map((s, i): V3 => (i < 3 ? [Math.round((s[0] + dx) * 100) / 100, s[1], s[2]] : s));
};

/** The rig table of each frame: A's `RIGS` as they are; B's and C's with the resting shots (`idle`, `intro`) replaced and, where the party stands elsewhere, the two close shots that look at it (`party`, `victory`) panned with it. */
export const FRAME_RIGS: Readonly<Record<FrameName, Readonly<Record<string, RigData>>>> = {
  a: RIGS,
  b: { ...RIGS, idle: IDLE_B, intro: establishing(IDLE_B), party: panned(RIGS['party']!, PARTY_DX.b), victory: panned(RIGS['victory']!, PARTY_DX.b) },
  c: { ...RIGS, idle: IDLE_C, intro: establishing(IDLE_C, 1.8, 1.4, 0.8) },
};

/** The rigs the scene publishes for `frame`. */
export const rigsFor = (frame: FrameName): Readonly<Record<string, RigData>> => FRAME_RIGS[frame];
