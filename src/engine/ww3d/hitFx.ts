/**
 * **The object that draws a Wind Waker hit** (the hidden Wind Waker chapter; FFX-2 only; the numbers and the reasons are `./hitBurst.ts`): where a blow lands, a flat star pops and shrinks over a quarter of a second and
 * a few curly toon smoke puffs drift up and fade. The scene says it draws its own hits (`SceneStaging.ownImpacts`, `../ownImpacts.ts`), so the stage's shared impact effects are off, and the skin starts one of these on the
 * shot director's `impact` beat (`./skin.ts`).
 *
 * **Flat, and never above the bloom's threshold.** Every layer is a `MeshBasicMaterial` in a flat colour under 1.0 in luminance (`HIT_COLOURS`), opaque or faded by plain alpha, nothing additive, no texture: the game's
 * bloom has nothing to spread. Each piece is a camera-facing shape set up in its own `onBeforeRender` from the live camera (so it faces whichever rig is on, and the star is capped to a share of the frame by the live
 * lens, `starCapRadius`), drawn over the figure (no depth test) in a fixed order: the smoke, then the star's outline, its body and its white core.
 *
 * Geometry is made once (a star of 4, 5 and 6 points; the puff's lobes, their outline and the curl) and shared; each burst owns three meshes for its star and three for each puff, and the puffs' materials, which fade
 * one by one. Needs three.js only.
 */

import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Shape,
  ShapeGeometry,
  TubeGeometry,
  Vector3,
  type Camera,
  type Material,
  type PerspectiveCamera,
} from 'three';
import {
  HIT_COLOURS,
  PUFF_LOBES,
  PUFF_OUTLINE,
  STAR_LAYERS,
  burstLife,
  curlSpiral,
  hitPlan,
  puffLayout,
  puffState,
  starAngle,
  starCapRadius,
  starPoints,
  starScale,
  type HitInfo,
  type HitPlan,
  type Puff,
} from './hitBurst.ts';

const RIGHT = new Vector3();
const UP = new Vector3();
const CAM_Q = new Quaternion();
const SPIN_Q = new Quaternion();
const Z = new Vector3(0, 0, 1);

/** Draw orders: the smoke under the star, the star's layers in order (the outline first, the white core on top). */
const ORDER = { puffLine: 14, puff: 15, curl: 16, outline: 20, body: 21, core: 22 } as const;

function flat(hex: string, opacity = 1): MeshBasicMaterial {
  return new MeshBasicMaterial({ color: new Color(hex), transparent: true, opacity, depthTest: false, depthWrite: false, toneMapped: false, fog: false, side: DoubleSide });
}

/** One flat star of `points` points and outer radius 1, in the xy plane. */
function starGeometry(points: number): ShapeGeometry {
  const shape = new Shape();
  starPoints(points, 1).forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();
  return new ShapeGeometry(shape);
}

/** A flat cloud: a triangle fan for each lobe (`segments` round), the lobes' radii times `grow`, merged into one geometry in the xy plane. */
function cloudGeometry(grow: number, segments = 22): BufferGeometry {
  const positions: number[] = [];
  const index: number[] = [];
  for (const [cx, cy, r] of PUFF_LOBES) {
    const first = positions.length / 3;
    positions.push(cx, cy, 0);
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      positions.push(cx + Math.cos(a) * r * grow, cy + Math.sin(a) * r * grow, 0);
    }
    for (let i = 0; i < segments; i++) index.push(first, first + 1 + i, first + 1 + ((i + 1) % segments));
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  return g;
}

/** The curl inside a puff: a thin tube along a spiral in the xy plane. */
function curlGeometry(): TubeGeometry {
  const pts = curlSpiral(1.5, 0.46, 26).map(([x, y]) => new Vector3(x, y, 0));
  return new TubeGeometry(new CatmullRomCurve3(pts), 40, 0.05, 4, false);
}

/** One puff alive: its plan and its three meshes (outline, white body, curl) with the three materials they own. */
interface PuffMeshes {
  readonly puff: Puff;
  readonly meshes: readonly Mesh[];
  readonly materials: readonly MeshBasicMaterial[];
}

/** One burst alive. */
interface Burst {
  readonly at: Vector3;
  readonly plan: HitPlan;
  readonly puffs: PuffMeshes[];
  readonly star: Mesh[];
  readonly base: number;
  readonly life: number;
  age: number;
  /** The star's nominal radius as last drawn after the frame cap (a test's and the debug view's read). */
  drawn: number;
}

/** What a burst reports (a test's and the debug view's read). */
export interface BurstView {
  readonly age: number;
  readonly points: number;
  readonly puffs: number;
  /** The star's size now as a share of its nominal radius (`starScale`). */
  readonly scale: number;
  /** The nominal radius the plan asked for and the radius drawn after the frame cap, metres. */
  readonly radius: number;
  readonly drawn: number;
}

export class HitFx {
  readonly group = new Group();
  private running: Burst[] = [];
  private counter = 0;
  private readonly stars = new Map<number, ShapeGeometry>();
  private readonly cloud = cloudGeometry(1);
  private readonly cloudLine = cloudGeometry(PUFF_OUTLINE);
  private readonly curl = curlGeometry();
  private readonly starMaterials = { outline: flat(HIT_COLOURS.outline), body: flat(HIT_COLOURS.body), core: flat(HIT_COLOURS.core) };

  constructor() {
    this.group.name = 'ww-hit-fx';
  }

  /** How many bursts are alive now. */
  get active(): number {
    return this.running.length;
  }

  /** The bursts alive now (a test's and the debug view's read). */
  get bursts(): BurstView[] {
    return this.running.map((b) => ({ age: b.age, points: b.plan.points, puffs: b.puffs.length, scale: starScale(b.age), radius: b.plan.radius, drawn: b.drawn }));
  }

  /** How many meshes the effects hold in the scene right now. */
  get meshCount(): number {
    return this.group.children.length;
  }

  private starFor(points: number): ShapeGeometry {
    let g = this.stars.get(points);
    if (!g) this.stars.set(points, (g = starGeometry(points)));
    return g;
  }

  /** The star radius this burst can have under the live camera: its plan's, capped to a share of the frame. */
  private radiusFor(b: Burst, camera: Camera): number {
    const cam = camera as PerspectiveCamera;
    const cap = cam.isPerspectiveCamera ? starCapRadius(cam.position.distanceTo(b.at), cam.fov) : Infinity;
    return (b.drawn = Math.max(0.001, Math.min(b.plan.radius, cap)));
  }

  /** Start a burst at `at` (the world point a blow lands on: a figure's chest) on a figure `height` metres tall. */
  burst(at: Vector3, info: HitInfo, height: number): void {
    const plan = hitPlan(height, info);
    const seed = ++this.counter;
    const base = (seed % 7) * 0.31;
    const puffPlans = puffLayout(plan.puffs, seed);
    const meshes: Mesh[] = [];
    const add = (geometry: BufferGeometry, material: Material, order: number, onBefore: (camera: Camera, mesh: Mesh) => void): Mesh => {
      const m = new Mesh(geometry, material);
      m.frustumCulled = false;
      m.renderOrder = order;
      m.visible = false;
      m.onBeforeRender = (_r, _s, camera): void => onBefore(camera, m);
      meshes.push(m);
      this.group.add(m);
      return m;
    };
    const b: Burst = { at: at.clone(), plan, puffs: [], star: [], base, life: burstLife(puffPlans), age: 0, drawn: plan.radius };
    // The hooks only pose a mesh from the live camera; whether a mesh is shown, and a puff's opacity, are set by `update` (a hidden mesh is never rendered, so its hook would never run to show it).
    for (const layer of ['outline', 'body', 'core'] as const) {
      const m = add(this.starFor(plan.points), this.starMaterials[layer], ORDER[layer], (camera, mesh) => {
        camera.getWorldQuaternion(CAM_Q);
        mesh.quaternion.copy(CAM_Q).multiply(SPIN_Q.setFromAxisAngle(Z, starAngle(base, b.age)));
        mesh.position.copy(b.at);
        mesh.scale.setScalar(this.radiusFor(b, camera) * starScale(b.age) * STAR_LAYERS[layer]);
        mesh.updateMatrixWorld();
      });
      m.visible = true;
      b.star.push(m);
    }
    for (const puff of puffPlans) {
      const mats = [flat(HIT_COLOURS.puffLine), flat(HIT_COLOURS.puff), flat(HIT_COLOURS.puffLine)];
      const place = (curl: boolean) => (camera: Camera, mesh: Mesh): void => {
        const st = puffState(puff, b.age);
        const R = this.radiusFor(b, camera);
        const e = camera.matrixWorld.elements;
        RIGHT.set(e[0]!, e[1]!, e[2]!);
        UP.set(e[4]!, e[5]!, e[6]!);
        camera.getWorldQuaternion(CAM_Q);
        mesh.position.copy(b.at).addScaledVector(RIGHT, st.x * R).addScaledVector(UP, st.y * R);
        mesh.quaternion.copy(CAM_Q).multiply(SPIN_Q.setFromAxisAngle(Z, curl ? st.angle : puff.phase));
        mesh.scale.setScalar(puff.size * R * st.scale);
        mesh.updateMatrixWorld();
      };
      b.puffs.push({
        puff,
        materials: mats,
        meshes: [add(this.cloudLine, mats[0]!, ORDER.puffLine, place(false)), add(this.cloud, mats[1]!, ORDER.puff, place(false)), add(this.curl, mats[2]!, ORDER.curl, place(true))],
      });
    }
    this.running.push(b);
  }

  /** Advance every burst by `dt` seconds; one that has run its course is freed. */
  update(dt: number): void {
    if (this.running.length === 0) return;
    const keep: Burst[] = [];
    for (const b of this.running) {
      b.age += dt;
      if (b.age >= b.life) {
        this.free(b);
        continue;
      }
      const star = starScale(b.age) > 0.001;
      for (const m of b.star) m.visible = star;
      for (const p of b.puffs) {
        const st = puffState(p.puff, b.age);
        const shown = st.live && st.alpha > 0.004;
        for (const m of p.meshes) m.visible = shown;
        for (const mat of p.materials) mat.opacity = st.alpha;
      }
      keep.push(b);
    }
    this.running = keep;
  }

  private free(b: Burst): void {
    for (const m of b.star) m.removeFromParent();
    for (const p of b.puffs) {
      for (const m of p.meshes) m.removeFromParent();
      for (const mat of p.materials) mat.dispose();
    }
  }

  dispose(): void {
    for (const b of this.running) this.free(b);
    this.running = [];
    for (const g of this.stars.values()) g.dispose();
    this.stars.clear();
    this.cloud.dispose();
    this.cloudLine.dispose();
    this.curl.dispose();
    for (const m of Object.values(this.starMaterials)) m.dispose();
    this.group.removeFromParent();
  }
}
