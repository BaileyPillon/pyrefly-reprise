/**
 * **The three objects that draw Valefor's stand-in effects** (the hidden Wind Waker chapter; FFX-2 only): a beam, a big orb with a ring, and a gust of curly white wind trails (`./moves.ts` decides which move gets which and
 * how long it lives). They are parented to one group the scene adds to the stage; each effect makes its geometry when it starts and frees it when it ends.
 *
 * **Toon, flat, and never above the bloom's threshold** (polish 1; phase 2's were additive colours of 2.4 and 2.6, which the game's bloom, a whole-colour high pass at 1.0, spread over the frame: the Energy Blast whited
 * out the right two thirds of it, stills 62 to 64). Every colour here is under 1.0 in luminance, so none of it blooms:
 *
 * - **The orb** (the Blast, and the Ray's muzzle) is a sphere with a small shader that bands it on N.V into flat discs: a white core, a yellow band, an orange rim, a thin deep-orange outline (`ORB_BANDS`,
 *   `ORB_COLOURS`). It hangs `ORB.ahead` in front of her chest toward the girls so she stays readable, and **its radius is capped every frame by the live camera** (`orbCapRadius`: at most `ORB_MAX_SHARE` of the
 *   frame's area), whatever the rig or the window's shape.
 * - **The beam** is two flat cylinders, a pale core inside a yellow-orange sleeve, not additive.
 * - **The wind** is plain white tubes.
 * - **The ring** of the burst is a flat torus.
 *
 * Needs three.js only. Game case: FFX-2 only.
 */

import {
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type Camera,
  type Material,
  type PerspectiveCamera,
} from 'three';
import { MIN_LEAD, ORB, ORB_BANDS, ORB_COLOURS, curlPoints, movePhase, orbCapRadius, orbRadius, type MoveKind } from './moves.ts';

const Y = new Vector3(0, 1, 0);

/** The effects' flat colours (display hex; three converts them to linear). Each is under 1.0 in luminance. */
const FLAT = { beamCore: '#fff3c8', beamSleeve: '#ffc233', ring: '#ffd23c', wind: '#f4f8ff' } as const;

function flatMaterial(hex: string): MeshBasicMaterial {
  return new MeshBasicMaterial({ color: new Color(hex), transparent: true, depthWrite: false, toneMapped: false, fog: false });
}

const ORB_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
	vec4 mv = modelViewMatrix * vec4( position, 1.0 );
	vN = normalize( normalMatrix * normal );
	vV = normalize( -mv.xyz );
	gl_Position = projectionMatrix * mv;
}`;

const ORB_FRAG = /* glsl */ `
uniform vec3 uCore;
uniform vec3 uMid;
uniform vec3 uRim;
uniform vec3 uLine;
uniform vec3 uBands;   // x core, y mid, z outline: thresholds on N.V
uniform float uOpacity;
varying vec3 vN;
varying vec3 vV;
void main() {
	float nv = clamp( dot( normalize( vN ), normalize( vV ) ), 0.0, 1.0 );
	float w = max( 0.012, fwidth( nv ) );
	vec3 c = uRim;
	c = mix( c, uMid, smoothstep( uBands.y - w, uBands.y + w, nv ) );
	c = mix( c, uCore, smoothstep( uBands.x - w, uBands.x + w, nv ) );
	c = mix( uLine, c, smoothstep( uBands.z - w, uBands.z + w, nv ) );
	gl_FragColor = vec4( c, uOpacity );
}`;

/** The banded orb's material: flat discs of colour, no lighting, drawn over what is behind it (it does not write depth, so a girl stepping through it is not cut). */
export function orbMaterial(): ShaderMaterial {
  const rgb = (hex: string): Vector3 => {
    const c = new Color(hex);
    return new Vector3(c.r, c.g, c.b);
  };
  const m = new ShaderMaterial({
    uniforms: {
      uCore: { value: rgb(ORB_COLOURS.core) },
      uMid: { value: rgb(ORB_COLOURS.mid) },
      uRim: { value: rgb(ORB_COLOURS.rim) },
      uLine: { value: rgb(ORB_COLOURS.line) },
      uBands: { value: new Vector3(ORB_BANDS.core, ORB_BANDS.mid, ORB_BANDS.line) },
      uOpacity: { value: 1 },
    },
    vertexShader: ORB_VERT,
    fragmentShader: ORB_FRAG,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  m.toneMapped = false;
  return m;
}

/** One effect alive: its clock, the objects it made and how to pose them at a given age. */
interface Running {
  readonly kind: MoveKind;
  age: number;
  readonly lead: number;
  readonly objects: Mesh[];
  readonly geometries: BufferGeometry[];
  readonly materials: Material[];
  step: (age: number) => void;
  /** The world points the effect is aimed at (the test's and the debug view's read). */
  readonly targets: readonly Vector3[];
  /** The orb's radius as last asked for and as last drawn after the frame cap (a test's and the debug view's read). */
  orb?: { wanted: number; drawn: number };
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

  /** The radius the blast orb was last asked for and last drawn at (after the frame cap), metres, or null with no blast alive. */
  get orbRadii(): { wanted: number; drawn: number } | null {
    return this.running.find((r) => r.orb)?.orb ?? null;
  }

  /** Start an effect of `kind` from `from` (Valefor's mouth for the ray and the wind, her chest for the blast) toward `targets` (the girls' chests), the blow `lead` seconds on. */
  start(kind: MoveKind, from: Vector3, targets: readonly Vector3[], lead: number): void {
    const r = this.begin(kind, lead, targets);
    if (kind === 'ray') this.ray(r, from, targets);
    else if (kind === 'blast') this.blast(r, from, targets);
    else this.wings(r, from, targets);
    r.step(0);
    this.running.push(r);
  }

  private begin(kind: MoveKind, lead: number, targets: readonly Vector3[]): Running {
    return { kind, age: 0, lead: Math.max(MIN_LEAD, lead), objects: [], geometries: [], materials: [], step: () => undefined, targets };
  }

  private add(r: Running, geometry: BufferGeometry, material: Material, order = 6): Mesh {
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = order;
    r.objects.push(mesh);
    r.geometries.push(geometry);
    r.materials.push(material);
    this.group.add(mesh);
    return mesh;
  }

  /** A banded orb; its radius is `r.orb.wanted`, drawn at the least of that and what the live camera allows (`orbCapRadius`). */
  private orbMesh(r: Running): { mesh: Mesh; material: ShaderMaterial } {
    const material = orbMaterial();
    const mesh = this.add(r, new SphereGeometry(1, 28, 20), material, 7);
    r.orb ??= { wanted: 0.001, drawn: 0.001 };
    const state = r.orb;
    mesh.onBeforeRender = (_renderer, _scene, camera: Camera): void => {
      const cam = camera as PerspectiveCamera;
      let drawn = state.wanted;
      if (cam.isPerspectiveCamera) drawn = Math.min(drawn, orbCapRadius(cam.position.distanceTo(mesh.position), cam.fov, cam.aspect));
      drawn = Math.max(0.001, drawn);
      if (drawn !== state.drawn || mesh.scale.x !== drawn) {
        state.drawn = drawn;
        mesh.scale.setScalar(drawn);
        mesh.updateMatrixWorld(); // read after this hook for the draw
      }
    };
    return { mesh, material };
  }

  // ------------------------------------------------------------------------------------------------------------------ Energy Ray

  private ray(r: Running, from: Vector3, targets: readonly Vector3[]): void {
    const origin = from.clone();
    const { mesh: muzzle, material: muzzleMat } = this.orbMesh(r);
    muzzle.position.copy(origin);
    const beams = targets.map((t) => {
      const sleeve = this.add(r, new CylinderGeometry(1, 1, 1, 14, 1, true), flatMaterial(FLAT.beamSleeve));
      const core = this.add(r, new CylinderGeometry(1, 1, 1, 14, 1, true), flatMaterial(FLAT.beamCore), 7);
      const dir = t.clone().sub(origin);
      const len = dir.length();
      for (const b of [sleeve, core]) {
        b.position.copy(origin).addScaledVector(dir.clone().normalize(), len / 2);
        b.quaternion.setFromUnitVectors(Y, dir.clone().normalize());
      }
      return { sleeve, core, len };
    });
    r.step = (age: number): void => {
      const p = movePhase('ray', age, r.lead);
      r.orb!.wanted = Math.max(0.001, 0.32 * p.charge * (p.fire > 0 ? 1.4 : p.fade));
      muzzle.scale.setScalar(r.orb!.wanted);
      muzzleMat.uniforms['uOpacity']!.value = p.fade;
      for (const { sleeve, core, len } of beams) {
        const open = age >= r.lead ? p.fade : 0;
        const w = age >= r.lead ? 0.2 * (0.9 + 0.1 * Math.sin(age * 40)) : 0.001;
        sleeve.scale.set(Math.max(0.001, w), len, Math.max(0.001, w));
        core.scale.set(Math.max(0.001, w * 0.5), len, Math.max(0.001, w * 0.5));
        for (const b of [sleeve, core]) {
          b.visible = open > 0.001;
          (b.material as MeshBasicMaterial).opacity = open;
        }
      }
    };
  }

  // ------------------------------------------------------------------------------------------------------------------ Energy Blast

  private blast(r: Running, from: Vector3, targets: readonly Vector3[]): void {
    // the orb hangs in front of her chest, toward the girls, so she stays readable behind it
    const centre = from.clone();
    if (targets.length > 0) {
      const mid = targets.reduce((a, t) => a.add(t), new Vector3()).multiplyScalar(1 / targets.length);
      const toward = mid.sub(from).setY(0);
      if (toward.lengthSq() > 1e-6) centre.addScaledVector(toward.normalize(), ORB.ahead);
    }
    const { mesh: orb, material: orbMat } = this.orbMesh(r);
    const ring = this.add(r, new TorusGeometry(1, 0.06, 8, 48), flatMaterial(FLAT.ring));
    orb.position.copy(centre);
    ring.position.copy(centre);
    ring.rotation.x = Math.PI / 2; // a flat ring about the vertical axis
    r.step = (age: number): void => {
      const p = movePhase('blast', age, r.lead);
      r.orb!.wanted = Math.max(0.001, orbRadius(p));
      orb.scale.setScalar(r.orb!.wanted);
      orbMat.uniforms['uOpacity']!.value = p.fade;
      orbMat.uniforms['uBands']!.value.x = ORB_BANDS.core + 0.05 * Math.sin(age * 18); // the core shimmers
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
        const mesh = this.add(r, geo, flatMaterial(FLAT.wind));
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
