/**
 * **The three objects that draw Valefor's stand-in effects** (the hidden Wind Waker chapter; FFX-2 only): a beam, a big orb with a ring, and a gust of curly white wind trails (`./moves.ts` decides which move gets which and
 * how long it lives). Flat colours, no textures: `MeshBasicMaterial`s whose colour is above 1.0, so the scene's bloom (the palette's threshold is 1.0, `./post.ts`) makes them glow and nothing else does. They are
 * parented to one group the scene adds to the stage; each effect makes its geometry when it starts and frees it when it ends.
 *
 * Needs three.js only. Game case: FFX-2 only.
 */

import { AdditiveBlending, CatmullRomCurve3, Color, CylinderGeometry, Group, Mesh, MeshBasicMaterial, SphereGeometry, TorusGeometry, TubeGeometry, Vector3, type BufferGeometry } from 'three';
import { MIN_LEAD, curlPoints, movePhase, orbRadius, type MoveKind } from './moves.ts';

const Y = new Vector3(0, 1, 0);

/** The effects' colours, linear and above 1 where they should bloom: the beam and the muzzle orb a pale gold-white, the blast a golden orb, the wind plain white. */
const GLOW = { beam: [2.4, 2.1, 1.2], orb: [2.6, 1.9, 0.9], ring: [2.0, 1.7, 0.8], wind: [1.5, 1.6, 1.8] } as const;

function glowMaterial(rgb: readonly [number, number, number], additive = true): MeshBasicMaterial {
  const m = new MeshBasicMaterial({ color: new Color(rgb[0], rgb[1], rgb[2]), transparent: true, depthWrite: false, toneMapped: false, fog: false });
  if (additive) m.blending = AdditiveBlending;
  return m;
}

/** One effect alive: its clock, the objects it made and how to pose them at a given age. */
interface Running {
  readonly kind: MoveKind;
  age: number;
  readonly lead: number;
  readonly objects: Mesh[];
  readonly geometries: BufferGeometry[];
  readonly materials: MeshBasicMaterial[];
  step: (age: number) => void;
  /** The world points the effect is aimed at (the test's and the debug view's read). */
  readonly targets: readonly Vector3[];
}

export class MoveFx {
  readonly group = new Group();
  private running: Running[] = [];

  constructor() {
    this.group.name = 'ww-move-fx';
  }

  /** How many effects are alive now. */
  get active(): number {
    return this.running.length;
  }

  /** The kinds alive now (a test's read). */
  get kinds(): MoveKind[] {
    return this.running.map((r) => r.kind);
  }

  /** Start an effect of `kind` from `from` (Valefor's mouth for the ray and the wind, her chest for the blast) toward `targets` (the girls' chests), the blow `lead` seconds on. */
  start(kind: MoveKind, from: Vector3, targets: readonly Vector3[], lead: number): void {
    const r = this.begin(kind, lead, targets);
    if (kind === 'ray') this.ray(r, from, targets);
    else if (kind === 'blast') this.blast(r, from);
    else this.wings(r, from, targets);
    r.step(0);
    this.running.push(r);
  }

  private begin(kind: MoveKind, lead: number, targets: readonly Vector3[]): Running {
    return { kind, age: 0, lead: Math.max(MIN_LEAD, lead), objects: [], geometries: [], materials: [], step: () => undefined, targets };
  }

  private add(r: Running, geometry: BufferGeometry, material: MeshBasicMaterial): Mesh {
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = 6;
    r.objects.push(mesh);
    r.geometries.push(geometry);
    r.materials.push(material);
    this.group.add(mesh);
    return mesh;
  }

  // ------------------------------------------------------------------------------------------------------------------ Energy Ray

  private ray(r: Running, from: Vector3, targets: readonly Vector3[]): void {
    const origin = from.clone();
    const muzzle = this.add(r, new SphereGeometry(1, 16, 12), glowMaterial(GLOW.orb));
    muzzle.position.copy(origin);
    const beams = targets.map((t) => {
      const beam = this.add(r, new CylinderGeometry(1, 1, 1, 14, 1, true), glowMaterial(GLOW.beam));
      const dir = t.clone().sub(origin);
      const len = dir.length();
      beam.position.copy(origin).addScaledVector(dir.normalize(), len / 2);
      beam.quaternion.setFromUnitVectors(Y, dir);
      return { beam, len };
    });
    r.step = (age: number): void => {
      const p = movePhase('ray', age, r.lead);
      muzzle.scale.setScalar(Math.max(0.001, 0.32 * p.charge * (p.fire > 0 ? 1.4 : p.fade)));
      (muzzle.material as MeshBasicMaterial).opacity = p.fade;
      for (const { beam, len } of beams) {
        const open = age >= r.lead ? p.fade : 0;
        const w = age >= r.lead ? 0.2 * (0.9 + 0.1 * Math.sin(age * 40)) : 0.001;
        beam.scale.set(Math.max(0.001, w), len, Math.max(0.001, w));
        beam.visible = open > 0.001;
        (beam.material as MeshBasicMaterial).opacity = open;
      }
    };
  }

  // ------------------------------------------------------------------------------------------------------------------ Energy Blast

  private blast(r: Running, from: Vector3): void {
    const centre = from.clone();
    const orb = this.add(r, new SphereGeometry(1, 24, 16), glowMaterial(GLOW.orb));
    const ring = this.add(r, new TorusGeometry(1, 0.06, 8, 48), glowMaterial(GLOW.ring));
    orb.position.copy(centre);
    ring.position.copy(centre);
    ring.rotation.x = Math.PI / 2; // a flat ring about the vertical axis
    r.step = (age: number): void => {
      const p = movePhase('blast', age, r.lead);
      orb.scale.setScalar(Math.max(0.001, orbRadius(p)));
      (orb.material as MeshBasicMaterial).opacity = p.fade * (0.75 + 0.25 * Math.sin(age * 22));
      const since = Math.max(0, age - r.lead);
      ring.scale.setScalar(Math.max(0.001, 0.4 + since * 6));
      ring.visible = since > 0;
      (ring.material as MeshBasicMaterial).opacity = p.fade;
    };
  }

  // ------------------------------------------------------------------------------------------------------------------ Sonic Wings

  private wings(r: Running, from: Vector3, targets: readonly Vector3[]): void {
    const trails: Array<{ mesh: Mesh; index: number }> = [];
    targets.forEach((t, k) => {
      for (let i = 0; i < 3; i++) {
        const pts = curlPoints([from.x, from.y, from.z], [t.x, t.y, t.z], 2.4 + i * 0.5, 0.45 + i * 0.12, 24, i * 2.1 + k);
        const geo = new TubeGeometry(new CatmullRomCurve3(pts.map((p) => new Vector3(p[0], p[1], p[2]))), 48, 0.045, 5, false);
        const mesh = this.add(r, geo, glowMaterial(GLOW.wind, false));
        trails.push({ mesh, index: geo.index?.count ?? 0 });
      }
    });
    r.step = (age: number): void => {
      const p = movePhase('wings', age, r.lead);
      const reach = Math.min(1, Math.max(0, (age - r.lead * 0.35) / (r.lead * 0.65 + 0.2))); // the gust sets out partway through the windup and arrives just after the blow
      for (const { mesh, index } of trails) {
        mesh.geometry.setDrawRange(0, Math.floor((index * reach) / 3) * 3);
        mesh.visible = reach > 0 && p.fade > 0.001;
        (mesh.material as MeshBasicMaterial).opacity = p.fade * 0.95;
      }
    };
  }

  // ------------------------------------------------------------------------------------------------------------------ frame

  /** Advance every effect by `dt` seconds; one that has run its course is freed. */
  update(dt: number): void {
    const keep: Running[] = [];
    for (const r of this.running) {
      r.age += dt;
      r.step(r.age);
      if (movePhase(r.kind, r.age, r.lead).done) this.free(r);
      else keep.push(r);
    }
    this.running = keep;
  }

  private free(r: Running): void {
    for (const o of r.objects) o.removeFromParent();
    for (const g of r.geometries) g.dispose();
    for (const m of r.materials) m.dispose();
  }

  dispose(): void {
    for (const r of this.running) this.free(r);
    this.running = [];
    this.group.removeFromParent();
  }
}
