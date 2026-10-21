/**
 * **Parts of the temple chamber** (the hidden Wind Waker chapter; FFX-2 only), after TARGET-C: wall relief panels, pilasters, the carved arched door, thin waterfalls, torches and wall bowls with Wind Waker flames, hanging
 * vines. Ported from the look lab's `js/stageParts.mjs`. Each builder takes a {@link StageCtx} from `./stage.ts`. Flat colours only.
 *
 * ## Swappable: the temple kit
 *
 * A wall, a pillar, the door and a brazier each have a file they can be replaced by (`temple/<wall|pillar|door|brazier>.glb`; the conventions are in `./swaps.ts`). Each file stands on y 0, centred in x and z, its front
 * toward +Z; a placed piece is turned to face the arena's axis. The first kit (2026-10-21) is: **wall** 3 x 3 x 0.45 m (a tile), **pillar** 1 x 4 x 1 m, **door** 3.35 x 3.5 x 0.8 m, **brazier** 1.07 x 1.1 x 1.06 m. The
 * placement is by the file's own measured size, so a better file of other proportions still fits:
 *
 * - **The wall** ({@link tileWall}) is tiled round the chamber circle: as many tiles as fit the circumference (25 for a 3 m tile at R 12, each stretched a hair in x so the ring closes), in `rows` rows (the wall's height over
 *   a 4 m module, rounded: 3 for the lab's 10.5 m, each row 3.5 m, so a 3 m tile is stretched 1.16 times in y). The tiles meet at the corners of a regular polygon whose corners lie on the chamber's circle, so their inner
 *   faces are flat chords and the procedural parts that stand against the wall (waterfalls, vines, bowls) clear it. One tile is centred on the door's azimuth. The returned **inner face** radius is where the door and the pillars
 *   stand against.
 * - **The pillars** stand at the lab's six pilaster azimuths, stacked in the same rows, each module scaled evenly to the row's height (0.875 for 3.5 m).
 * - **The door** stands at the lab's door azimuth, its back against the wall's inner face.
 * - **The braziers** replace the floor torches' pedestal and bowl where the torches stood (the flame sits on the brazier's top), and each wall bowl's bowl on its bracket (at 0.8 of the size).
 *
 * A piece is made toon once and its placements are clones that share its geometry and materials, so 75 wall tiles are one geometry, one material and 75 draw calls the frustum culls. A name with no file builds the stand-in.
 */

import {
  Box3,
  BoxGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Euler,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  Sprite,
  SpriteMaterial,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type Group,
  type IUniform,
  type MeshToonMaterial,
  type Object3D,
  type Texture,
} from 'three';
import { rng } from './stageTextures.ts';
import type { StageTextures } from './stageTextureSet.ts';
import type { TempleName } from './layout.ts';
import type { ToonOptions } from './toon.ts';
import { toonify } from './toonify.ts';

/** What every builder is given. */
export interface StageCtx {
  readonly group: Group;
  readonly R: number;
  readonly H: number;
  readonly tex: StageTextures;
  readonly uniforms: Record<string, IUniform>;
  readonly swaps: Readonly<Partial<Record<TempleName, Object3D>>>;
  /** The names of the swapped pieces that were placed (a test's read). */
  readonly used: Set<TempleName>;
  /** The toon template of each swapped piece, made once (`templateOf`). */
  readonly templates: Map<TempleName, Object3D>;
  toon(opts: ToonOptions, uniforms?: Record<string, IUniform>): MeshToonMaterial;
  add(geo: BufferGeometry, mat: MeshToonMaterial | MeshBasicMaterial, o?: { cast?: boolean; receive?: boolean; at?: Vector3 }): Mesh;
}

/** The point at azimuth `deg` (0 = the far wall straight ahead, -z; positive toward +x, the right of the frame), radius `r`, height `y`. */
export const polarPos = (deg: number, r: number, y: number): Vector3 => new Vector3(r * Math.sin(MathUtils.degToRad(deg)), y, -r * Math.cos(MathUtils.degToRad(deg)));

/** Turn a flat part so its front faces the arena's axis at its own height. */
const faceCentre = (m: Object3D): void => m.lookAt(0, m.position.y, 0);

/** The height of one module of the kit's wall and pillars, metres: the wall's height is cut into this many (rounded) equal rows. */
export const WALL_MODULE_HEIGHT = 4;

/**
 * Polish 1 (the kit read small and grey beside TARGET-C): the door is scaled evenly so its top is {@link DOOR_TOP_SHARE} of the wall's height (TARGET-C: about 0.45 to 0.5; the 3.5 m file was a third), the floor braziers
 * 1.3 times (the wall ones keep their 0.8 against the floor ones), and the wall and the pillars are multiplied toward TARGET-C's blue stone (its wall stone median is (60, 102, 142) in display colour, the phase-2 build's
 * was (91, 125, 132): grey, busier). The tint is a multiply in the toon material, linear, never an edit of the file.
 */
export const DOOR_TOP_SHARE = 0.476;
export const FLOOR_BRAZIER_SCALE = 1.3;
export const WALL_BRAZIER_SCALE = 0.8 * FLOOR_BRAZIER_SCALE;
export const TEMPLE_TINT: Readonly<Partial<Record<TempleName, readonly [number, number, number]>>> = {
  wall: [0.46, 0.72, 1.08],
  pillar: [0.52, 0.76, 1.06],
};

/** How many rows of the kit's wall and pillars make a wall `H` high. */
export const rowsOf = (H: number): number => Math.max(1, Math.round(H / WALL_MODULE_HEIGHT));

/** The toon template of the swapped piece `name`, made once (geometry and materials are then shared by every placement), or null when there is no file. A wall does not cast the sun's shadow (TARGET-C's wall is lit). */
export function templateOf(ctx: StageCtx, name: TempleName): Object3D | null {
  const file = ctx.swaps[name];
  if (!file) return null;
  let t = ctx.templates.get(name);
  if (!t) {
    t = file.clone(true);
    t.name = `temple:${name}`;
    const set = toonify(t, ctx.uniforms, { cast: name !== 'wall', receive: false, cull: true });
    const tint = TEMPLE_TINT[name];
    if (tint) for (const { material } of set.entries) material.color.multiply(new Color().setRGB(tint[0], tint[1], tint[2])); // linear, toward TARGET-C's blue stone
    ctx.templates.set(name, t);
  }
  return t;
}

/** The size of a swapped piece's box in its file's units, or null when there is no file. */
export function swapSize(ctx: StageCtx, name: TempleName): Vector3 | null {
  const t = templateOf(ctx, name);
  return t ? new Box3().setFromObject(t).getSize(new Vector3()) : null;
}

/**
 * Place the swapped piece `name` at `at` (its base centre), turned to face the arena's axis, scaled by `scale` (one number, or x, y, z): a clone of the template, so it shares its geometry and materials. Returns the
 * object, or null when the piece has no file (the caller builds its stand-in).
 */
export function placeSwap(ctx: StageCtx, name: TempleName, at: Vector3, scale: number | readonly [number, number, number] = 1): Object3D | null {
  const t = templateOf(ctx, name);
  if (!t) return null;
  const piece = t.clone(true);
  piece.position.copy(at);
  if (typeof scale === 'number') piece.scale.setScalar(scale);
  else piece.scale.set(scale[0], scale[1], scale[2]);
  faceCentre(piece);
  ctx.group.add(piece);
  ctx.used.add(name);
  return piece;
}

/**
 * Tile the wall file round the chamber (see the header): the tiles' inner faces form a regular polygon inscribed in the circle of radius R, one tile centred on the azimuth `doorAz`. Returns the radius of the
 * polygon's inner faces (their distance from the axis), or null when there is no wall file.
 */
export function tileWall(ctx: StageCtx, doorAz: number): number | null {
  const size = swapSize(ctx, 'wall');
  if (!size || size.x < 1e-6 || size.y < 1e-6) return null;
  const { R, H } = ctx;
  const n = Math.max(3, Math.round((2 * Math.PI * R) / size.x));
  const rows = rowsOf(H);
  const rowH = H / rows;
  const apothem = R * Math.cos(Math.PI / n);
  const scale: [number, number, number] = [(2 * R * Math.sin(Math.PI / n)) / size.x, rowH / size.y, 1];
  for (let k = 0; k < n; k++) {
    const az = doorAz + (k * 360) / n;
    for (let r = 0; r < rows; r++) placeSwap(ctx, 'wall', polarPos(az, apothem + size.z / 2, r * rowH), scale);
  }
  return apothem;
}

/** The six pilaster azimuths of the lab's chamber, and the two beside the door's bay (11 and 35 degrees on either side of the door at 23). */
export const PILASTER_AZ: readonly number[] = [-52, -33, -13, 11, 35, 54];
const DOOR_AZ_DEG = 23;
/** The azimuth gap kept between a scaled door's edge and the pillar beside it (degrees), a pillar's half width included. */
const DOOR_PILLAR_GAP_DEG = 3.2;

/** The pilaster azimuths with the two beside the door moved out of its way when a swapped door of half width `doorHalf` metres stands against a wall face of radius `face` (the lab's 11 and 35 are the stand-in door's edges). */
export function pillarAzimuths(doorHalf: number, face: number): number[] {
  if (doorHalf <= 0) return [...PILASTER_AZ];
  const half = (Math.asin(Math.min(1, doorHalf / face)) * 180) / Math.PI + DOOR_PILLAR_GAP_DEG;
  return PILASTER_AZ.map((a) => (a > DOOR_AZ_DEG - 12.5 && a < DOOR_AZ_DEG ? Math.min(a, DOOR_AZ_DEG - half) : a > DOOR_AZ_DEG && a < DOOR_AZ_DEG + 12.5 ? Math.max(a, DOOR_AZ_DEG + half) : a));
}

/**
 * Pilasters between the bays (full height, blue blocks, a lighter cap and plinth) and the carved panels in the bays. `face` is the radius of the wall's inner face; `wallSwapped`: a wall file stands in for the wall, so
 * the procedural pilasters and panels are not built (a swapped `pillar` file is still placed, stacked in the wall's rows).
 */
export function addBays(ctx: StageCtx, face: number = ctx.R, wallSwapped = false): void {
  const { R, H, toon, add, tex } = ctx;
  const pil = toon({ map: tex.blockWall(5, [1, 4], [66, 98, 162], 4) });
  const cap = toon({ color: 0x7f9ad0 });
  const door = swapSize(ctx, 'door');
  const pilAz = pillarAzimuths(door ? (door.x * doorScale(H, door.y)) / 2 : 0, face);
  const size = swapSize(ctx, 'pillar');
  const rows = rowsOf(H);
  for (const az of pilAz) {
    if (size && size.y > 1e-6) {
      const rowH = H / rows;
      const k = rowH / size.y;
      for (let r = 0; r < rows; r++) placeSwap(ctx, 'pillar', polarPos(az, face - (size.z * k) / 2, r * rowH), k);
      continue;
    }
    if (wallSwapped) continue;
    const p = add(new BoxGeometry(1.7, H, 1.2), pil, { cast: true, at: polarPos(az, R - 0.55, H / 2) });
    faceCentre(p);
    for (const [y, h] of [[0.3, 0.6], [H * 0.55, 0.45], [H - 0.3, 0.6]] as const) {
      const c = add(new BoxGeometry(2.05, h, 1.5), cap, { at: polarPos(az, R - 0.6, y) });
      faceCentre(c);
    }
  }
  if (wallSwapped) return;
  const kinds = ['spiral', 'meander', 'gold', 'spiral', 'meander'] as const;
  const mats = new Map<string, MeshToonMaterial>();
  const bays: Array<[number, number]> = [[-52, -33], [-33, -13], [-13, 11], [35, 54]]; // the door bay (11 to 35) gets the door
  bays.forEach(([a, b], i) => {
    const mid = (a + b) / 2;
    const w = MathUtils.degToRad(b - a) * R * 0.62;
    const panels: Array<[number, number, 'spiral' | 'meander' | 'gold']> = [[3.6, Math.min(w, 3.1), kinds[i]!], [7.4, Math.min(w, 2.4), kinds[i + 1]!]];
    for (const [y, panelSize, kind] of panels) {
      if (!mats.has(kind)) mats.set(kind, toon({ map: tex.panel(kind) }));
      const m = add(new PlaneGeometry(panelSize, panelSize), mats.get(kind)!, { at: polarPos(mid, R - 0.07, y) });
      faceCentre(m);
    }
  });
  // a big framed gold panel above the door bay's left pilaster, like the large carved panel behind Rikku in TARGET-C
  const big = add(new PlaneGeometry(3.4, 3.4), toon({ map: tex.panel('gold') }), { at: polarPos(-22.5, R - 0.07, 5.2) });
  faceCentre(big);
}

/** The even scale that puts the door's top at {@link DOOR_TOP_SHARE} of the wall's height `H`, for a door file `height` tall. */
export const doorScale = (H: number, height: number): number => (height > 1e-6 ? (DOOR_TOP_SHARE * H) / height : 1);

/** The carved arched door with its golden wheel, set in a stone frame, at azimuth `az`. `face` is the radius of the wall's inner face: a swapped door file stands with its back against it. */
export function addDoor(ctx: StageCtx, az: number, face: number = ctx.R): void {
  const { R, toon, add, tex } = ctx;
  const size = swapSize(ctx, 'door');
  if (size) {
    const k = doorScale(ctx.H, size.y);
    placeSwap(ctx, 'door', polarPos(az, face - (size.z * k) / 2, 0), k); // its back (scaled depth) still ends on the wall
    return;
  }
  const frame = add(new BoxGeometry(4.6, 6.9, 0.7), toon({ color: 0x6f8bc4 }), { cast: true, at: polarPos(az, R - 0.38, 3.45) });
  faceCentre(frame);
  const leaf = add(new PlaneGeometry(3.7, 5.55), toon({ map: tex.door(), alphaTest: 0 }), { at: polarPos(az, R - 0.76, 2.78) });
  faceCentre(leaf);
  const step = add(new BoxGeometry(4.9, 0.3, 1.4), toon({ color: 0x8aa4d8 }), { at: polarPos(az, R - 1.0, 0.15) });
  faceCentre(step);
}

/** Thin waterfalls: a stone spout, a flat plane with a scrolling stripe texture, a small basin. Returns the textures to scroll. */
export function addWaterfalls(ctx: StageCtx, list: ReadonlyArray<readonly [number, number]>): Texture[] {
  const { R, toon, add, group, tex } = ctx;
  const scrolls: Texture[] = [];
  const stone = toon({ color: 0x7f9ad0 });
  for (const [az, top] of list) {
    const t = tex.waterfall();
    t.repeat.set(1, top / 2.8);
    const mat = new MeshBasicMaterial({ map: t, fog: true });
    const m = add(new PlaneGeometry(0.62, top), mat, { at: polarPos(az, R - 0.28, top / 2 + 0.2), receive: false });
    faceCentre(m);
    const spout = add(new BoxGeometry(1.1, 0.7, 0.8), stone, { cast: true, at: polarPos(az, R - 0.4, top + 0.45) });
    faceCentre(spout);
    add(new CylinderGeometry(0.95, 1.1, 0.35, 16), stone, { at: polarPos(az, R - 0.85, 0.17) });
    const pool = new Mesh(new CircleGeometry(0.8, 16).rotateX(-Math.PI / 2), new MeshBasicMaterial({ color: 0x9edcf7 }));
    pool.position.copy(polarPos(az, R - 0.85, 0.36));
    group.add(pool);
    scrolls.push(t);
  }
  return scrolls;
}

/** One torch flame: a sprite whose colour is above 1.0 so only the flames bloom, and where it rests. */
export interface Flame {
  readonly sprite: Sprite;
  readonly base: Vector3;
  readonly phase: number;
}

/** How far above a piece's top the flame rests. */
const FLAME_LIFT = 0.1;

/**
 * Torches: stone pedestal + bowl + flame sprite. `floorAz` stand on the floor, `wall` = [az, y] bowls on brackets. A swapped `brazier` replaces a floor torch's pedestal and bowl, and a wall bowl on its bracket (at
 * {@link WALL_BRAZIER_SCALE}); the flame sits just above its top.
 */
export function addTorches(ctx: StageCtx, floorAz: readonly number[], wall: ReadonlyArray<readonly [number, number]>): Flame[] {
  const { R, toon, add, group, tex } = ctx;
  const stone = toon({ color: 0x8aa2d8 });
  const flameMap = tex.flame();
  const flames: Flame[] = [];
  const flame = (pos: Vector3, i: number): void => {
    const mat = new SpriteMaterial({ map: flameMap, transparent: true, depthWrite: false, fog: false, toneMapped: false });
    mat.color.setRGB(2.4, 1.8, 1.0);
    const s = new Sprite(mat);
    s.position.copy(pos);
    s.scale.set(0.85, 1.3, 1);
    group.add(s);
    flames.push({ sprite: s, base: pos.clone(), phase: i * 1.7 });
  };
  const brazier = swapSize(ctx, 'brazier');
  floorAz.forEach((az, i) => {
    const base = polarPos(az, R - 1.9, 0);
    if (brazier && placeSwap(ctx, 'brazier', base, FLOOR_BRAZIER_SCALE)) {
      flame(base.clone().setY(brazier.y * FLOOR_BRAZIER_SCALE + FLAME_LIFT), i);
      return;
    }
    add(new CylinderGeometry(0.3, 0.42, 1.25, 12), stone, { cast: true, at: base.clone().setY(0.62) });
    add(new CylinderGeometry(0.55, 0.32, 0.34, 14), stone, { cast: true, at: base.clone().setY(1.42) });
    flame(base.clone().setY(2.15), i);
  });
  wall.forEach(([az, y], i) => {
    const base = polarPos(az, R - 1.7, y);
    const br = add(new BoxGeometry(0.5, 0.35, 1.0), stone, { at: polarPos(az, R - 1.3, y - 0.45) });
    faceCentre(br);
    if (brazier) {
      const seat = base.clone().setY(y - 0.16); // where the bowl's bottom was
      placeSwap(ctx, 'brazier', seat, WALL_BRAZIER_SCALE);
      flame(seat.clone().setY(seat.y + brazier.y * WALL_BRAZIER_SCALE + FLAME_LIFT), i + 10);
      return;
    }
    add(new CylinderGeometry(0.5, 0.3, 0.32, 14), stone, { cast: true, at: base.clone() });
    flame(base.clone().setY(y + 0.75), i + 10);
  });
  return flames;
}

/** Hanging vines: [azimuth, top y, drop length]. A tube per strand and instanced leaves along it. */
export function addVines(ctx: StageCtx, list: ReadonlyArray<readonly [number, number, number]>): void {
  const { R, toon, add, group, tex } = ctx;
  const r = rng(21);
  const vineMat = toon({ color: 0x2f8f3a });
  const per = 14;
  const leaves = new InstancedMesh(new PlaneGeometry(0.4, 0.4), toon({ map: tex.leaf(), alphaTest: 0.5, side: DoubleSide }), list.length * per);
  leaves.frustumCulled = false;
  const m4 = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const col = new Color();
  let li = 0;
  list.forEach(([az, top, drop], v) => {
    const pts: Vector3[] = [];
    for (let k = 0; k < 6; k++) pts.push(polarPos(az + Math.sin(k * 1.3 + v) * 0.9, R - 0.25 - Math.sin(k) * 0.05, top - (drop * k) / 5));
    const curve = new CatmullRomCurve3(pts);
    add(new TubeGeometry(curve, 24, 0.04, 5, false), vineMat, { receive: false });
    for (let k = 0; k < per; k++) {
      const p = curve.getPoint(r());
      e.set((r() - 0.5) * 1.2, -MathUtils.degToRad(az) + (r() - 0.5) * 1.4, (r() - 0.5) * 1.6);
      q.setFromEuler(e);
      m4.compose(p, q, new Vector3().setScalar(0.85 + r() * 0.8));
      leaves.setMatrixAt(li, m4);
      leaves.setColorAt(li, col.setHSL(0.27 + r() * 0.06, 0.6, 0.5 + r() * 0.12));
      li++;
    }
  });
  group.add(leaves);
}
