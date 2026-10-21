/**
 * **Parts of the temple chamber** (the hidden Wind Waker chapter; FFX-2 only), after TARGET-C: wall relief panels, pilasters, the carved arched door, thin waterfalls, torches and wall bowls with Wind Waker flames, hanging
 * vines. Ported from the look lab's `js/stageParts.mjs`. Each builder takes a {@link StageCtx} from `./stage.ts`. Flat colours only.
 *
 * **Swappable.** A pilaster, the door and a floor torch's pedestal and bowl each have a file they can be replaced by (`temple/pillar.glb`, `door.glb`, `brazier.glb`; the conventions are in `./swaps.ts`): {@link placeSwap}
 * clones the file, makes it toon, stands it where the procedural piece stood, turned to face the arena's centre, and records the name in `ctx.used`; a builder whose piece was swapped skips its procedural geometry. A name
 * with no file builds the stand-in as before.
 */

import {
  BoxGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  Euler,
  Color,
  SpriteMaterial,
  Sprite,
  TubeGeometry,
  Vector3,
  Box3,
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
  toon(opts: ToonOptions, uniforms?: Record<string, IUniform>): MeshToonMaterial;
  add(geo: BufferGeometry, mat: MeshToonMaterial | MeshBasicMaterial, o?: { cast?: boolean; receive?: boolean; at?: Vector3 }): Mesh;
}

/** The point at azimuth `deg` (0 = the far wall straight ahead, -z; positive toward +x, the right of the frame), radius `r`, height `y`. */
export const polarPos = (deg: number, r: number, y: number): Vector3 => new Vector3(r * Math.sin(MathUtils.degToRad(deg)), y, -r * Math.cos(MathUtils.degToRad(deg)));

/** Turn a flat part so its front faces the arena's axis at its own height. */
const faceCentre = (m: Object3D): void => m.lookAt(0, m.position.y, 0);

/**
 * Place the swapped piece `name`, if there is a file for it: a toon clone at `at`, facing the centre, scaled so its height is `height` when one is given. Returns the object, or null when the piece has no file (the caller
 * builds its stand-in).
 */
export function placeSwap(ctx: StageCtx, name: TempleName, at: Vector3, height?: number): Object3D | null {
  const file = ctx.swaps[name];
  if (!file) return null;
  const piece = file.clone(true);
  piece.name = `temple:${name}`;
  toonify(piece, ctx.uniforms, { cast: true, receive: false });
  piece.position.copy(at);
  if (height !== undefined) {
    const h = new Box3().setFromObject(piece).getSize(new Vector3()).y;
    if (h > 1e-6) piece.scale.setScalar(height / h);
  }
  faceCentre(piece);
  ctx.group.add(piece);
  ctx.used.add(name);
  return piece;
}

/**
 * Pilasters between the bays (full height, blue blocks, a lighter cap and plinth) and the carved panels in the bays. `wallSwapped`: a wall file stands in for the wall, so the procedural pilasters and panels are
 * not built (a swapped `pillar` file is still placed).
 */
export function addBays(ctx: StageCtx, wallSwapped = false): void {
  const { R, H, toon, add, tex } = ctx;
  const pil = toon({ map: tex.blockWall(5, [1, 4], [66, 98, 162], 4) });
  const cap = toon({ color: 0x7f9ad0 });
  const pilAz = [-52, -33, -13, 11, 35, 54];
  for (const az of pilAz) {
    if (placeSwap(ctx, 'pillar', polarPos(az, R - 0.55, 0), H) || wallSwapped) continue;
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
    for (const [y, size, kind] of panels) {
      if (!mats.has(kind)) mats.set(kind, toon({ map: tex.panel(kind) }));
      const m = add(new PlaneGeometry(size, size), mats.get(kind)!, { at: polarPos(mid, R - 0.07, y) });
      faceCentre(m);
    }
  });
  // a big framed gold panel above the door bay's left pilaster, like the large carved panel behind Rikku in TARGET-C
  const big = add(new PlaneGeometry(3.4, 3.4), toon({ map: tex.panel('gold') }), { at: polarPos(-22.5, R - 0.07, 5.2) });
  faceCentre(big);
}

/** The carved arched door with its golden wheel, set in a stone frame, at azimuth `az`. */
export function addDoor(ctx: StageCtx, az: number): void {
  const { R, toon, add, tex } = ctx;
  if (placeSwap(ctx, 'door', polarPos(az, R - 0.38, 0))) return;
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

/** Torches: stone pedestal + bowl + flame sprite. `floorAz` stand on the floor, `wall` = [az, y] bowls on brackets. A swapped `brazier` replaces a floor torch's pedestal and bowl; the flame sits on its top. */
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
  floorAz.forEach((az, i) => {
    const base = polarPos(az, R - 1.9, 0);
    const swapped = placeSwap(ctx, 'brazier', base);
    if (swapped) {
      const top = new Box3().setFromObject(swapped).max.y;
      flame(base.clone().setY(top + 0.1), i);
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
