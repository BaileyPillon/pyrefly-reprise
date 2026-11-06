/**
 * **Where the four figures stand, how big they are, which way they turn and where the files are** (the hidden Wind Waker chapter, `data/chapter-exp-windwaker.ts`; FFX-2 only). Pure: arrays and numbers, no `three`, no DOM
 * (AGENTS.md hard rule 1's habit for anything a test must read without a renderer), so `tests/unit/ww3d/layout.test.ts` pins the picture without a browser.
 *
 * ## The target: TARGET-C, "Besaid, toon 3-head" (Bailey's pick, 2026-10-20), as the look lab framed it
 *
 * The numbers are the look lab's run 3 (`D:\Tools\pyrefly-scratch\2026-10-20\windwaker\look-lab\js\shots.mjs`, fitted to the picture): the girls in a staggered diagonal that recedes to the right, Yuna big and close on the
 * left, Rikku in the middle, Paine further back; Valefor hovering in the right half, her whole body and spread wings in frame; the bottom fifth calm for the HUD. Staging is ours, not game data (AGENTS.md rule 6: nothing here
 * is a number from a source; it is where figures stand on a stage and the view of them).
 *
 * ## Conventions
 *
 * World: x to the right of the frame, y up, z toward the camera; the floor is y 0. A model **faces +Z at rotation 0** (glTF's forward) and stands on y 0. Heights are the cast scale of the lab: one scale for the three girls
 * (so Yuna, Rikku and Paine keep the relative heights their models were made with), Valefor a little smaller than her native size against them. Game case: FFX-2 only.
 */

export type V3 = readonly [number, number, number];

/** The combatant ids of the chapter (chapter 24's: `data/ffx2/builds/bevelle.ts`, `data/ffx2/enemies/valefor.ts`). */
export const WW_PARTY_IDS = ['yuna', 'rikku', 'paine'] as const;
export const WW_BOSS_ID = 'x2-valefor' as const;
export const WW_CAST = [...WW_PARTY_IDS, WW_BOSS_ID] as const;
export type WwId = (typeof WW_CAST)[number];

export const isWwId = (id: string): id is WwId => (WW_CAST as readonly string[]).includes(id);

/** The model file of each figure (`public/models-exp/windwaker/<file>.glb`): the girls' own names, and Valefor's `valefor` (her combatant id is `x2-valefor`). */
export const MODEL_FILE: Readonly<Record<WwId, string>> = { yuna: 'yuna', rikku: 'rikku', paine: 'paine', 'x2-valefor': 'valefor' };

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Where they stand
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * The party's three active slots in slot order (Yuna, Rikku, Paine), then four reserve spots parked off the frame to the left (`SceneBuild.partySlots` holds seven: a character switched in walks from one). The lab's
 * diagonal: Yuna at the front left, Rikku in the middle, Paine at the back right, none behind another at the target camera. The reserves stand on the arena's far left, about nine metres from the lens's axis: outside the
 * frame at every rig (the left edge of the target shot is at about x -5.5 at the girls' depth).
 *
 * **Polish 2.** The lab's slots were (-0.34, 0.89), (-0.05, -0.16) and (0.69, -1.28). Rikku and Paine stand 0.11 and 0.15 m further back (with the lens lowered to 0.26, `camera.ts`, that puts the three hair tops on TARGET-C's .33 / .47 / .55 and Rikku, who was
 * bigger than TARGET-C's, at its size), and **Paine stands 0.26 m further left** (x 0.43): at the target shot the move advisor's card slid left over Paine's rear boot (the card's lane is `squeezed` against the party panel: it sits at a fixed place, and the
 * girl's boot reached 36 px into it, measured on a mask of her alone), and now it clears the card's slanted edge by about 30 px. The advisor lane solver is the shared HUD's and is not touched.
 */
export const PARTY_SLOTS: readonly V3[] = [
  [-0.34, 0, 0.88],
  [-0.05, 0, -0.27],
  [0.43, 0, -1.43],
  [-9.0, 0, 1.0],
  [-9.9, 0, 0.2],
  [-10.8, 0, -0.6],
  [-11.7, 0, -1.4],
];

/** Valefor's spot on the ground (her hover is the model's, `BOSS_HOVER`): the right half of the frame, back, turned toward the party. The other two slots are reserves for a formation that fields more than one. */
export const BOSS_SPOT: V3 = [4.0, 0, -3.3];
export const ENEMY_SLOTS: readonly V3[] = [BOSS_SPOT, [6.2, 0, -5.0], [2.2, 0, -6.4]];

/** How high Valefor hovers above the floor, metres at her world size (the lab's spot y), and the slow bob on top of it (amplitude metres, Hz). */
export const BOSS_HOVER = 0.9;
export const BOSS_BOB = { amplitude: 0.15, hz: 0.25 } as const;

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// How big they are
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/** The models' native heights, metres (read off the final files: `yuna-v2` 1.20, `rikku-v2` 1.15, `paine-v2` 1.25, `valefor` 3.50). A model is fitted to a world height, so a newer file of other proportions still stands the same. */
export const NATIVE_HEIGHT: Readonly<Record<WwId, number>> = { yuna: 1.2, rikku: 1.15, paine: 1.25, 'x2-valefor': 3.5 };

/** The lab's cast scale: Yuna 1.20 m became 1.50 m, and the others took the same scale. Valefor takes it times {@link BOSS_SIZE}. */
export const CAST_SCALE = 1.25;
export const BOSS_SIZE = 0.95;

/** The world height of each figure, metres: native times the cast scale (Valefor's also times her size). */
export const WORLD_HEIGHT: Readonly<Record<WwId, number>> = {
  yuna: NATIVE_HEIGHT.yuna * CAST_SCALE,
  rikku: NATIVE_HEIGHT.rikku * CAST_SCALE,
  paine: NATIVE_HEIGHT.paine * CAST_SCALE,
  'x2-valefor': NATIVE_HEIGHT['x2-valefor'] * CAST_SCALE * BOSS_SIZE,
};

/** The heights the scene publishes (`SceneBuild.partyHeight`, `enemyHeight`, `figureHeights`): the party's is Yuna's, Valefor's her own. */
export const PARTY_HEIGHT = WORLD_HEIGHT.yuna;
export const BOSS_HEIGHT = WORLD_HEIGHT['x2-valefor'];

/** A figure's height as a share of the stage's height for its side: the skin multiplies the actor's height by it, so Rikku stands a little shorter than Yuna and Paine a little taller, as the models were made. */
export function heightFactor(id: WwId): number {
  return WORLD_HEIGHT[id] / (id === WW_BOSS_ID ? BOSS_HEIGHT : PARTY_HEIGHT);
}

/** Half the width each figure stands, metres (arms in; Valefor's wings out), for the frame's boxes and the lunge's reach. */
export const HALF_WIDTH: Readonly<Record<WwId, number>> = { yuna: 0.34, rikku: 0.33, paine: 0.34, 'x2-valefor': 4.0 };

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Which way they turn
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * The body is turned `BODY_OFF_DEG` off the direction to the camera toward the right (the stance points at the boss); the head is then turned toward the viewer so the face is `FACE_OFF_DEG` off the camera
 * (three-quarter faces). Valefor's yaw is a fixed turn toward the party. (The lab's run 3.)
 */
export const BODY_OFF_DEG = 62;
export const FACE_OFF_DEG = 46;
/** The most the procedural head turn may move the head away from what the clip does, degrees. */
export const HEAD_TURN_MAX_DEG = 55;
/**
 * Valefor's yaw about +Y (0 faces +Z, the lens side), degrees. The direction from her spot to the target shot's lens (1.0, 0.37, 3.2) is -24.8 degrees; she is turned a further `BOSS_OFF_DEG` toward the party (the left of the
 * frame), to -75: three-quarter, as in TARGET-C. The look lab had her at -28, which is almost square to the lens: a front-on cutout (phase 2, stills 21, 23, 24). `tests/unit/ww3d/bossMotion.test.ts` derives the number.
 */
export const BOSS_OFF_DEG = 50;
export const BOSS_YAW_DEG = -75;

export const rad = (deg: number): number => (deg * Math.PI) / 180;

/** `a` wrapped to (-pi, pi]. */
export function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/** The yaw (about +Y, 0 facing +Z) of the direction from `from` to `to` on the floor. */
export function yawToward(from: V3, to: V3): number {
  return Math.atan2(to[0] - from[0], to[2] - from[2]);
}

/**
 * The root yaw that turns a girl's body (`stanceYaw`: the facing of her shoulders and hips in the stance, measured at root yaw 0) to `bodyOffDeg` off the direction to the camera, toward the right: the lab's
 * `faceYawDeg`, in radians. `slot` is where she stands, `camera` where the lens is.
 */
export function bodyYaw(slot: V3, camera: V3, stanceYaw: number, bodyOffDeg: number = BODY_OFF_DEG): number {
  return wrapAngle(yawToward(slot, camera) + rad(bodyOffDeg) - stanceYaw);
}

/**
 * How far to turn the head about the world Y axis so the face looks `faceOffDeg` off the direction to the camera: `headYaw` is the yaw the face points now (the `headfront` bone minus the head bone), `head` the
 * head's world position. Clamped to `maxDeg` either way (the lab's `turnHead`). Radians.
 */
export function headTurn(head: V3, camera: V3, headYaw: number, faceOffDeg: number = FACE_OFF_DEG, maxDeg: number = HEAD_TURN_MAX_DEG): number {
  const delta = wrapAngle(yawToward(head, camera) + rad(faceOffDeg) - headYaw);
  const lim = rad(maxDeg);
  return Math.max(-lim, Math.min(lim, delta));
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Fitting a model to a figure
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/** What a model file measures: its bounding box in its own units. */
export interface BoxData {
  readonly min: V3;
  readonly max: V3;
}

/** How to place a model so it stands on the floor at its figure's height: the uniform scale, and the offset (in world units, after the scale) that puts its anchor on the origin and its lowest point on the floor. */
export interface Fit {
  scale: number;
  offset: V3;
}

/**
 * Fit a model of box `box` to a figure `height` tall: scaled so the box's height is `height`, shifted so the anchor (the centre of the footprint unless `anchor` says where; Valefor's second file, `valefor-v2`, has even wings, so the centre of her footprint is the centre of her body and she needs none) is the origin and the lowest point is the
 * floor (`groundY`, the lowest point of the standing pose, when the bind pose's box is not where the feet are). A box with no height (an empty or flat file) is fitted at scale 1 so a bad file shows as a bad model, not
 * as a division by zero.
 */
export function fitBox(box: BoxData, height: number, opts: { anchor?: readonly [number, number]; groundY?: number } = {}): Fit {
  const h = box.max[1] - box.min[1];
  const scale = h > 1e-6 ? height / h : 1;
  const ax = opts.anchor ? opts.anchor[0] : (box.min[0] + box.max[0]) / 2;
  const az = opts.anchor ? opts.anchor[1] : (box.min[2] + box.max[2]) / 2;
  const floor = opts.groundY ?? box.min[1];
  return { scale, offset: [-ax * scale, -floor * scale, -az * scale] };
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Where the files are
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

const withSlash = (base: string): string => (base.endsWith('/') ? base : `${base}/`);

/**
 * The URL a figure's model is loaded from: `<base><dir>/<file>.glb` (`yuna.glb`, `rikku.glb`, `paine.glb`, `valefor.glb`). `dir` is `WW_MODEL_DIR` (`data/windwaker-ids.ts`). `files` is another chapter's file table
 * (the anime chapter's girls are `anime/<id>`, `animeLayout.ts`); omitted, it is this chapter's own.
 */
export function modelUrl(base: string, dir: string, id: WwId, files: Readonly<Record<WwId, string>> = MODEL_FILE): string {
  return `${withSlash(base)}${dir}/${files[id]}.glb`;
}

/** The weapons a file in the props folder may replace, and the temple pieces a file in the temple folder may replace. */
export const PROP_NAMES = ['pistol', 'dagger', 'sword'] as const;
export const TEMPLE_NAMES = ['wall', 'door', 'brazier', 'pillar'] as const;
export type PropName = (typeof PROP_NAMES)[number];
export type TempleName = (typeof TEMPLE_NAMES)[number];

/** The URL of a swappable piece: `<base><dir>/<name>.glb`. */
export function swapUrl(base: string, dir: string, name: string): string {
  return `${withSlash(base)}${dir}/${name}.glb`;
}

/** Is this a binary glTF? A dev server answers an unknown path under `public/` with its index page and status 200, so a fetched body is judged by its first four bytes ("glTF") and never by the status alone. */
export function looksLikeGlb(bytes: ArrayBuffer | Uint8Array): boolean {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return b.length >= 12 && b[0] === 0x67 && b[1] === 0x6c && b[2] === 0x54 && b[3] === 0x46;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// The cast glow
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/** The cast glow's strength over time: a swell while a figure holds a `cast` pose (seconds since it began), breathing between 0.35 and 0.75 of the peak. */
export function castGlow(seconds: number): number {
  return 0.55 + 0.2 * Math.sin(seconds * 6.2) - 0.2 * Math.exp(-seconds * 2.5);
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// The staging as one table (the optional-config seam of the anime chapter)
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * **Everything above that a second chapter on this engine needs to change, as one table** (the hidden anime chapter, `animeLayout.ts`, FFX-2 only; shared plumbing, additive). The models (`model.ts`) and the skin (`skin.ts`)
 * read their numbers from the staging they are handed; **omitted, it is {@link WW_STAGING}, the Wind Waker chapter's own constants, so that chapter reads and draws exactly as it did** (`tests/unit/ww3d/staging.test.ts`
 * pins every field against the constant it stands for).
 */
export interface WwStaging {
  /** The party's slots (the active three, then the reserves) and Valefor's spot. */
  readonly partySlots: readonly V3[];
  readonly bossSpot: V3;
  /** The models' native heights and the world heights they are fitted to, metres (`NATIVE_HEIGHT`, `WORLD_HEIGHT`). */
  readonly nativeHeight: Readonly<Record<WwId, number>>;
  readonly worldHeight: Readonly<Record<WwId, number>>;
  /** The height the party's actors are staged at (a girl's share of it is her `worldHeight` over this) and Valefor's, metres. */
  readonly partyHeight: number;
  readonly bossHeight: number;
  /** How high Valefor hovers at her staged height, metres. */
  readonly bossHover: number;
  /** The world point the girls aim their weapons at (Valefor's chest; the anime chapter aims a little nearer the lens so the weapons read across the picture instead of foreshortening into the depth). */
  readonly bossAim: V3;
  /** Which way they turn (degrees): the body off the direction to the lens, the face off it, Valefor's yaw about +Y. */
  readonly bodyOffDeg: number;
  readonly faceOffDeg: number;
  readonly bossYawDeg: number;
  /** The model file of each figure under the models folder, without `.glb`. */
  readonly files: Readonly<Record<WwId, string>>;
  /** Where on a girl a blow lands, as a share of her model's own height. */
  readonly girlChest: number;
  /** Raise a head the clip bows (the Meshy toon girls' idle bows the head about 30 degrees): absent, the head is only yawed, as the Wind Waker chapter's is. */
  readonly headPitchFix?: HeadPitchFix;
}

/** A head that looks down by more than `minPitchDeg` below the horizon is raised toward it, by at most `limitDeg` (the anime lab's `headPitchMax` and `headPitchFix`). */
export interface HeadPitchFix {
  readonly minPitchDeg: number;
  readonly limitDeg: number;
}

/** The Wind Waker chapter's staging: the constants above, unchanged. */
export const WW_STAGING: WwStaging = {
  partySlots: PARTY_SLOTS,
  bossSpot: BOSS_SPOT,
  nativeHeight: NATIVE_HEIGHT,
  worldHeight: WORLD_HEIGHT,
  partyHeight: PARTY_HEIGHT,
  bossHeight: BOSS_HEIGHT,
  bossHover: BOSS_HOVER,
  bossAim: [BOSS_SPOT[0], BOSS_HOVER + 1.3, BOSS_SPOT[2]],
  bodyOffDeg: BODY_OFF_DEG,
  faceOffDeg: FACE_OFF_DEG,
  bossYawDeg: BOSS_YAW_DEG,
  files: MODEL_FILE,
  girlChest: 0.58,
};

/** A figure's height as a share of the stage's height for its side, in `staging` ({@link heightFactor} for the Wind Waker chapter's). */
export function heightFactorIn(staging: WwStaging, id: WwId): number {
  return staging.worldHeight[id] / (id === WW_BOSS_ID ? staging.bossHeight : staging.partyHeight);
}
