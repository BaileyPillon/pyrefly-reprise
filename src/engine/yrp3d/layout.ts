/**
 * **Frame A's layout and camera maths** (the hidden 3D Bahamut chapter, `data/chapter-exp-yrp-3d.ts`; FFX-2 only): where the four figures stand, where the camera looks from, how a model is fitted to a figure and
 * where the model files are looked for. Pure: arrays and numbers, no `three`, no DOM (AGENTS.md hard rule 1's habit for anything a test must read without a renderer), so `tests/unit/yrp3d/layout.test.ts` pins the picture
 * without a browser.
 *
 * ## The target: end-state frame A, "classic, now in 3D" (Bailey delegated the frame pick to the recommendations, 2026-10-19)
 *
 * The picked picture (critic 8.0; the art room's frame A, a target and never an asset): a high three-quarter battle camera; Bahamut on the left with his wings spread over the left half, his left wing past the frame's edge, facing
 * right; the trio in a loose diagonal on the right, facing left: Paine at the back (nearest Bahamut), Rikku in the middle, Yuna at the front (the nearest the lens); a wide reflective floor; calm space along the bottom for the
 * FFX-2 HUD. The picture puts the row at x 0.67 to 0.96 and Bahamut at 0 to 0.65. The existing HUD's rail is the right quarter of the frame (the command stack starts at 0.745 of the width, `scenes/bevelle-underground.ts`'s
 * "HUD safe area"), which the front girl and the middle one reach into: while a command menu is up it covers part of them (a known cost of the picked frame; the stand is set a little left of the picture's, x 0.60 to 0.91, to
 * keep it small). {@link FRAME_A_BOXES} are the limits and the test holds the staging to them at 16:9.
 *
 * Staging is ours, not game data (AGENTS.md rule 6: nothing here is a number from a source; it is where figures stand on a stage and the view of them).
 *
 * ## Conventions
 *
 * World: x to the right of the frame, y up, z toward the camera; the floor is y 0. A model **faces +Z at rotation 0** (glTF's forward), stands on y 0 with its feet centred on the origin, and is scaled so its height is the
 * figure's world height ({@link fitBox}). Screen: x and y in 0..1 from the top left. Game case: FFX-2 only.
 */

export type V3 = readonly [number, number, number];

/** A camera rig, the shape of `engine/BattleCamera.ts`'s `CameraRig` (kept apart so this file imports nothing). */
export interface RigData {
  readonly position: V3;
  readonly lookAt: V3;
  readonly fov: number;
  readonly sway?: number;
}

/** The combatant ids of the chapter (Chapter IV's: `data/ffx2/builds/bevelle.ts`, `data/ffx2/enemies/bahamut.ts`), which are also the model file names. */
export const YRP_PARTY_IDS = ['yuna', 'rikku', 'paine'] as const;
export const YRP_BOSS_ID = 'bahamut' as const;
export const YRP_CAST = [...YRP_PARTY_IDS, YRP_BOSS_ID] as const;
export type YrpId = (typeof YRP_CAST)[number];

export const isYrpId = (id: string): id is YrpId => (YRP_CAST as readonly string[]).includes(id);

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Where they stand
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * The party's three active slots in slot order (Yuna, Rikku, Paine), then four reserve spots parked off the frame to the right (`SceneBuild.partySlots` holds seven: a character switched in walks from one). A loose
 * diagonal that runs back toward Bahamut: Yuna at the front right, Rikku in the middle, Paine at the back left (the picked frame's order). No one stands behind another at frame A's camera, and none is on the chamber's torn hole
 * (`scenes/bevelle-underground.ts` HOLE: x 2.4, z -7.8, radii 2.5 and 1.6).
 */
export const PARTY_SLOTS: readonly V3[] = [
  [4.6, 0, 0.2],
  [3.4, 0, -1.0],
  [2.2, 0, -2.2],
  [12.0, 0, 2.6],
  [12.9, 0, 1.0],
  [13.8, 0, -0.6],
  [14.7, 0, -2.2],
];

/** Bahamut's spot: left of the frame's middle and back, over the place the painted gantry cradled Vegnagun, turned toward the party. His part slots (Chapter IV's boss has no parts) stand behind and beside it. */
export const BOSS_SPOT: V3 = [-3.2, 0, -3.0];
export const ENEMY_SLOTS: readonly V3[] = [BOSS_SPOT, [-0.6, 0, -5.8], [-6.2, 0, -6.0]];

/**
 * World heights, staging (ours): the girls' a little over the stage's house default (1.82, `BEVELLE_GIRLS_HEIGHT`) so a model reads at the camera's distance, and Bahamut's 5.0, 2.6 times theirs (Chapter IV's painting is 3.5 and
 * the giants' table has him at 3.3 times the girls, `data/ffx2/fiend-stature.ts`; frame A wants him to fill the left half of the frame with the whole figure in it, the wings out).
 */
export const PARTY_HEIGHT = 1.9;
export const BOSS_HEIGHT = 5.0;

/** How wide each figure stands, half-width in world units: a girl with her arms in, and Bahamut with his wings out (for the frame's boxes and the lunge's reach; a model's own box wins at run time). */
export const HALF_WIDTH: Readonly<Record<YrpId, number>> = { yuna: 0.42, rikku: 0.4, paine: 0.42, bahamut: 4.4 };

/**
 * The way each side turns, as a yaw in radians about +Y with 0 facing +Z: the party toward Bahamut (left, -x) and a little toward the lens, so the face is seen (a three-quarter turn, not a profile); Bahamut toward
 * the party (right, +x), turned the same little toward the lens. `TURN_TO_LENS` is how far from the side-on direction.
 */
export const TURN_TO_LENS = 0.52;
export const PARTY_YAW = -Math.PI / 2 + TURN_TO_LENS;
export const BOSS_YAW = Math.PI / 2 - TURN_TO_LENS;

/** The yaw a model of `id` is turned to when it stands up. */
export const yawFor = (id: YrpId): number => (id === YRP_BOSS_ID ? BOSS_YAW : PARTY_YAW);

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// The camera
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * The rigs. `idle` is frame A: high (a pitch of about 15 degrees, against the 8 of Chapter IV's `idle`; higher would cut the painted vault off the top of the frame), three-quarter (the lens stands right of the
 * stage's axis, about 8 degrees of yaw, so the row and Bahamut both turn a little to it), the girls low and right, Bahamut tall and left, the bottom fifth of the frame floor. `intro` is the establishing shot: higher and further back, Bahamut alone in the left half and the row small (the presenter pushes in from it to `idle`).
 * `action` is the attack beat's low, closer, wider view (end-state frame B's: the camera down among the girls, Bahamut across them); `party`, `enemy` and `victory` are pushes toward who is being looked at;
 * `bahamut` is the boss shot Chapter IV's scene publishes as well. `overdrive` is end-state frame C's: the camera behind and above the trio, wide, the girls low in the frame and Bahamut rearing over them; `./director.ts`
 * takes it for Bahamut's Mega Flare. It looks along the party's axis (toward -x), where the painting's plane is seen at a glancing angle: the frame's left side is the dark of the room, not the plate (`planeMiss`).
 */
export const RIGS: Readonly<Record<string, RigData>> = {
  intro: { position: [3.0, 8.4, 17.6], lookAt: [0.2, 2.4, -2.6], fov: 32, sway: 1.4 },
  idle: { position: [2.2, 4.9, 10.4], lookAt: [0.6, 1.95, -0.8], fov: 32 },
  action: { position: [5.0, 3.0, 7.4], lookAt: [-0.4, 1.9, -2.2], fov: 36, sway: 0.7 },
  party: { position: [6.8, 3.2, 5.0], lookAt: [3.4, 1.2, -1.0], fov: 34, sway: 0.7 },
  enemy: { position: [1.0, 3.6, 7.6], lookAt: [-3.2, 2.6, -3.2], fov: 34, sway: 0.7 },
  bahamut: { position: [-0.8, 2.2, 7.2], lookAt: [-3.2, 1.9, -3.2], fov: 30, sway: 0.5 },
  victory: { position: [6.2, 3.0, 4.6], lookAt: [3.2, 1.3, -1.0], fov: 32, sway: 1.2 },
  overdrive: { position: [9.4, 4.4, 0.6], lookAt: [-1.0, 2.2, -2.6], fov: 50, sway: 0.6 },
};

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** The camera's basis: forward, right, up (a rig looks at its `lookAt` with world up). */
export function basisOf(rig: RigData): { f: V3; r: V3; u: V3 } {
  const f = norm(sub(rig.lookAt, rig.position));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  return { f, r, u };
}

/** A point on the screen: x and y in 0..1 from the top left, and `depth` along the view (positive in front of the lens). */
export interface ScreenPoint {
  x: number;
  y: number;
  depth: number;
}

/** Where `p` lands on the screen of a window `aspect` wide (width over height) seen through `rig` (the vertical field of view is the rig's, kept as the window widens). */
export function project(rig: RigData, aspect: number, p: V3): ScreenPoint {
  const { f, r, u } = basisOf(rig);
  const d = sub(p, rig.position);
  const depth = dot(d, f);
  const t = Math.tan((rig.fov * Math.PI) / 360);
  const nx = dot(d, r) / (depth * t * aspect);
  const ny = dot(d, u) / (depth * t);
  return { x: 0.5 + 0.5 * nx, y: 0.5 - 0.5 * ny, depth };
}

/** The screen box of a figure standing at `at`, `height` tall and `halfWidth` either side of its axis (the four corners of the box it fills, so the camera's yaw is told). */
export interface ScreenBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function boxOf(rig: RigData, aspect: number, at: V3, height: number, halfWidth: number): ScreenBox {
  const { r } = basisOf(rig);
  const corners: V3[] = [];
  for (const side of [-1, 1]) for (const y of [0, height]) corners.push([at[0] + r[0] * halfWidth * side, y, at[2] + r[2] * halfWidth * side]);
  const pts = corners.map((c) => project(rig, aspect, c));
  return { left: Math.min(...pts.map((q) => q.x)), right: Math.max(...pts.map((q) => q.x)), top: Math.min(...pts.map((q) => q.y)), bottom: Math.max(...pts.map((q) => q.y)) };
}

/** The boxes of the four figures at frame A's `idle` (or any rig), keyed by id. */
export function figureBoxes(rig: RigData, aspect: number): Record<YrpId, ScreenBox> {
  const out = {} as Record<YrpId, ScreenBox>;
  YRP_PARTY_IDS.forEach((id, i) => {
    out[id] = boxOf(rig, aspect, PARTY_SLOTS[i]!, PARTY_HEIGHT, HALF_WIDTH[id]);
  });
  out[YRP_BOSS_ID] = boxOf(rig, aspect, BOSS_SPOT, BOSS_HEIGHT, HALF_WIDTH.bahamut);
  return out;
}

/**
 * Where frame A's figures may stand on the screen at 16:9 (frame fractions): the row on the right and above the calm bottom band; Bahamut on the left, his left wing allowed past the frame's edge as the picked frame has it.
 * `bottom` is the lowest a foot may land (the HUD's status band and the message bar take the rest).
 */
export const FRAME_A_BOXES = {
  party: { left: 0.58, right: 0.94, top: 0.4, bottom: 0.9 },
  bahamut: { left: -0.12, right: 0.62, top: 0.0, bottom: 0.7 },
} as const;

/** How much of the frame's width two boxes share, as a fraction of the narrower (0 when they do not meet). */
export function overlapOf(a: ScreenBox, b: ScreenBox): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  if (w <= 0 || h <= 0) return 0;
  return (w * h) / Math.min((a.right - a.left) * (a.bottom - a.top), (b.right - b.left) * (b.bottom - b.top));
}

/**
 * Does the painting plane fill the frame behind the stage? The plane stands at `z`, `width` wide (the plate and its wings) and `height` tall with its centre at `centreY`; each of the frame's corners and edge midpoints is a ray
 * from the lens, and each must land inside the plane unless the ray meets the floor (y 0, nearer than the plane) first, which the deck draws over. Returns the share of the nine rays that land outside both.
 */
export function planeMiss(rig: RigData, aspect: number, plane: { z: number; width: number; height: number; centreY: number }): number {
  const { f, r, u } = basisOf(rig);
  const t = Math.tan((rig.fov * Math.PI) / 360);
  let miss = 0;
  for (const sx of [-1, 0, 1]) {
    for (const sy of [-1, 0, 1]) {
      const d: V3 = [f[0] + r[0] * sx * t * aspect + u[0] * sy * t, f[1] + r[1] * sx * t * aspect + u[1] * sy * t, f[2] + r[2] * sx * t * aspect + u[2] * sy * t];
      const hitFloor = d[1] < 0 ? -rig.position[1] / d[1] : Infinity; // distance along d where y reaches 0
      const hitPlane = d[2] < 0 ? (plane.z - rig.position[2]) / d[2] : Infinity;
      if (hitFloor < hitPlane) continue; // the deck's
      if (hitPlane === Infinity) {
        miss++;
        continue;
      }
      const x = rig.position[0] + d[0] * hitPlane;
      const y = rig.position[1] + d[1] * hitPlane;
      if (Math.abs(x) > plane.width / 2 || Math.abs(y - plane.centreY) > plane.height / 2) miss++;
    }
  }
  return miss / 9;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Fitting a model to a figure
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/** What a model file measures: its bounding box in its own units. */
export interface BoxData {
  readonly min: V3;
  readonly max: V3;
}

/** How to place a model so it stands on the floor at its figure's height: the uniform scale, and the offset (in the scaled model's units) that moves its feet-centre to the origin. */
export interface Fit {
  scale: number;
  offset: V3;
  /** The model's width over its height, from the box (what the camera and the lunge reach are told). */
  widthOverHeight: number;
}

/**
 * Fit a model of box `box` to a figure `height` tall: scaled so the box's height is `height`, shifted so the centre of its footprint is the origin and its lowest point is the floor. A box with no height (an empty
 * or flat file) is fitted at scale 1 so a bad file shows as a bad model, not as a division by zero.
 */
export function fitBox(box: BoxData, height: number): Fit {
  const h = box.max[1] - box.min[1];
  const scale = h > 1e-6 ? height / h : 1;
  const cx = (box.min[0] + box.max[0]) / 2;
  const cz = (box.min[2] + box.max[2]) / 2;
  const w = Math.max(box.max[0] - box.min[0], box.max[2] - box.min[2]);
  return { scale, offset: [-cx * scale, -box.min[1] * scale, -cz * scale], widthOverHeight: h > 1e-6 ? w / h : 1 };
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Where the files are
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * The URL a figure's model is loaded from: `<base><dir>/<id>.glb` (`yuna.glb`, `rikku.glb`, `paine.glb`, `bahamut.glb`), its clips from `<base><dir>/<id>-anims.glb` and the clip map from `<base><dir>/clipmap.json`.
 * `base` is the page's base (`import.meta.env.BASE_URL`) and `dir` a models folder (`YRP_MODEL_DIRS`, `data/yrp-ids.ts`). A slot whose file is missing stands on the neutral capsule figure (`./capsule.ts`); there is no other stand-in.
 */
export function modelUrl(base: string, dir: string, id: YrpId): string {
  return `${folderUrl(base, dir)}${id}.glb`;
}

/** `<base><dir>/`, with exactly one slash between. */
export function folderUrl(base: string, dir: string): string {
  return `${base.endsWith('/') ? base : `${base}/`}${dir}/`;
}

/** The URL of a figure's clips file: the model's own skeleton with every motion of the game's battle bank on it. */
export const animsUrl = (base: string, dir: string, id: YrpId): string => `${folderUrl(base, dir)}${id}-anims.glb`;

/** The URL of a named file in a models folder. */
export const fileUrl = (base: string, dir: string, file: string): string => `${folderUrl(base, dir)}${file}`;

/** The two looks a model is shaded in (`./shade.ts`): the real humans' diffuse look, and the AI boss's own physically based material. */
export type Look = 'diffuse' | 'pbr';

/**
 * Which Bahamut the chapter fights, and how he moves (Bailey, 2026-10-20): **by default the AI-made Bahamut** (`bahamut-ai.glb`: Meshy, unrigged, with the wing flap and breath of this chapter's first branch, shaded in his own
 * physically based material), the real Yuna, Rikku and Paine standing before him. `?boss=real` fights the game's own Bahamut (`bahamut.glb`, his real clips, 4x: the comparison). `?bossrig=clips` (AI boss only) moves the
 * game's Bahamut clips onto the AI mesh when that rigged file is on disk (`bahamut-ai-rigged.glb`, `bahamut-ai-anims.glb`: another agent's work, not played by default because Bailey judges rigs in motion first).
 */
export interface BossChoice {
  readonly boss: 'ai' | 'real';
  readonly rig: boolean;
}

/** The boss a page asks for: `?boss=real` is the game's, anything else the AI one; `?bossrig=clips` asks for the moved clips (only the AI boss has any to ask for). */
export function bossChoice(search: string): BossChoice {
  const q = new URLSearchParams(search);
  const boss = q.get('boss') === 'real' ? 'real' : 'ai';
  return { boss, rig: boss === 'ai' && q.get('bossrig') === 'clips' };
}

/** What a figure is loaded from: its model file, the file its clips are in (null for none), and the look it is shaded in. */
export interface FigurePlan {
  readonly mesh: string;
  readonly anims: string | null;
  readonly look: Look;
}

/** The AI boss's files: the unrigged mesh, and the rigged one with its clips file (only when the page asks). */
export const AI_BOSS_FILES = { mesh: 'bahamut-ai.glb', rigged: 'bahamut-ai-rigged.glb', anims: 'bahamut-ai-anims.glb' } as const;

/**
 * The files of a figure in the order they are tried: the real girls and the game's own Bahamut are `<id>.glb` and `<id>-anims.glb` in the diffuse look; the AI boss is `bahamut-ai.glb` with no clips in the `pbr` look, or, with
 * `rig` set, the rigged file and its clips first and the plain mesh after it (so a page that asks for clips the disk does not have gets the procedural boss, not a hole).
 */
export function figurePlans(id: YrpId, choice: BossChoice): readonly FigurePlan[] {
  if (id !== YRP_BOSS_ID || choice.boss === 'real') return [{ mesh: `${id}.glb`, anims: `${id}-anims.glb`, look: 'diffuse' }];
  const plain: FigurePlan = { mesh: AI_BOSS_FILES.mesh, anims: null, look: 'pbr' };
  return choice.rig ? [{ mesh: AI_BOSS_FILES.rigged, anims: AI_BOSS_FILES.anims, look: 'pbr' }, plain] : [plain];
}

/** The URL of the clip map (`clipmap.json`): which of the clips is which pose, per figure. */
export const clipMapUrl = (base: string, dir: string): string => `${folderUrl(base, dir)}clipmap.json`;

/** Is this a binary glTF? A dev server answers an unknown path under `public/` with its index page and status 200, so a fetched body is judged by its first four bytes ("glTF") and never by the status alone. */
export function looksLikeGlb(bytes: ArrayBuffer | Uint8Array): boolean {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return b.length >= 12 && b[0] === 0x67 && b[1] === 0x6c && b[2] === 0x54 && b[3] === 0x46;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Shading and light
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * The look of the real models: **soft and faithful, not toon** (Bailey found the painted-toon look "plastic"). The game's HD textures are almost all diffuse, so a model keeps its own base colour map under a plain
 * diffuse material: `roughness` high and `metalness` none, so no specular gloss appears anywhere, no ink outline, no ramp. `envMapIntensity` 0 keeps any environment the scene carries out of the figures (it would add a sheen).
 */
export const SHADE = { roughness: 0.8, metalness: 0, envMapIntensity: 0, anisotropy: 8 } as const;

/** One light of the figures' rig: a colour, an intensity and, for a directional light, where it stands and what it looks at. */
export interface LightData {
  readonly colour: number;
  readonly intensity: number;
  readonly position?: V3;
  readonly target?: V3;
}

/**
 * The figures' light, three lights beside the chamber's own (which light all real geometry too): **a warm key** from the front left and above (the lamps' glow warmed toward white), **a soft fill** (a hemisphere:
 * the vault's cool sky over a dim warm floor, no direction, so no shadow side goes black) and **a cool rim** from behind and to the right that edges each figure against the dark. None casts a shadow (the chamber's
 * key casts the models' shadows on the deck). Staging, ours; the numbers are tuned by eye against the game's own battle frames (`research/ffx-vs-ffx2-presentation.md`).
 */
export const LIGHTS: Readonly<Record<'key' | 'fill' | 'rim', LightData & { ground?: number }>> = {
  key: { colour: 0xffe3c6, intensity: 2.6, position: [-4.5, 8.5, 11.5], target: [0, 1.2, -1.5] },
  fill: { colour: 0xb9c4e6, intensity: 1.15, ground: 0x4a3f4c },
  rim: { colour: 0x8db2ff, intensity: 2.2, position: [5.5, 6.5, -12], target: [0.5, 1.4, -1.5] },
};

/** The cast glow's strength over time: a swell while a figure holds a `cast` pose (seconds since it began), breathing between 0.35 and 0.75 of the peak. */
export function castGlow(seconds: number): number {
  return 0.55 + 0.2 * Math.sin(seconds * 6.2) - 0.2 * Math.exp(-seconds * 2.5);
}
