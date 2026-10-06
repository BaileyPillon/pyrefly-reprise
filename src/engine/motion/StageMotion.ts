/**
 * The field's half of RUN-IN (r38-motion, FFX-2 only; `motion/StageMotionPort.ts`): where each painted shape stands,
 * the camera truck, and the smear. `PaintedStage` owns one and ticks it; the presenter and the FFX-2 motion port
 * (`app/screens/BattleScreenRunIn.ts`) only ever see the port.
 *
 * - **Painted spans.** The world bounds of a figure's tight alpha box (`PaintedActor.contentQuad`, or the anchored
 *   quad of a figure-less part): the same box the HUD's brackets and `projectRect` hug. The stand-off is solved
 *   against it, so a girl never stops inside a boss's painted shape.
 * - **The truck.** A short, eased slide of the whole camera on top of its rig (`BattleCamera.truck`, a vector this
 *   tweens). One at a time; a new call settles and replaces the one in flight.
 * - **The smear.** While a girl runs, a few translucent copies of her own painted plane trail behind her and fade
 *   in about 0.2 s: the painting's pixels, never a new texture, drawn with the actor's own vertex shader and a
 *   plain fragment (no flash, rim or dissolve). It touches neither the figure's shader nor its geometry, so
 *   LIVING PAINTINGS' sway and cast shadow (`fx/b/Figures.ts`) keep working. None at LOW EFFECTS.
 *
 * Presentation only: no engine state, no RNG, no new texture.
 */
import { Mesh, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Vector3, type Object3D, type Scene, type Texture } from 'three';
import type { CombatantId } from '../../battle/common/types.ts';
import type { BattleCamera } from '../BattleCamera.ts';
import { rigPose } from '../FrameFit.ts';
import { paintedVertexShader } from '../shaders/PaintedShader.ts';
import { TweenGroup } from '../Tween.ts';
import type { Profile, Shape } from './Silhouette.ts';
import type { PaintedSpan, Rect, Spot, StageMotionPort } from './StageMotionPort.ts';

type Quad = [Vector3, Vector3, Vector3, Vector3];

export interface StageMotionOptions {
  scene: Scene;
  camera: BattleCamera;
  /** The four world corners of `id`'s painted box into `out`, or null when it is not on the field. With `pose`: of that pose as it would stand (`PaintedActor.poseShape`; the one showing when it cannot say). */
  quadOf(id: CombatantId, out: Quad, pose?: string): Quad | null;
  /** The figure's root, whose visible painted plane the smear copies. */
  figure(id: CombatantId): Object3D | undefined;
  /** The canvas's CSS size, and the part of it the window shows (see `StageMotionPort.view`). */
  view(): { w: number; h: number; l?: number; r?: number; t?: number; b?: number };
  /** The rigs the first hit's camera cut may go to (`StageMotionPort.cutRigs`); absent when the stage cannot say. */
  cutRigs?(runner: CombatantId): readonly string[];
  /** LOW EFFECTS: no smear. */
  lowEffects(): boolean;
  /** Whose painting to warm the smear's program with (see `warm`), or undefined when it is not wanted (not FFX-2, REDUCE MOTION). Read each frame until done. */
  warmFor?(): CombatantId | undefined;
  /** The rig a cut to `asked` really lands on under the camera comfort preset (`PresetCamera.shotRig`: `enemy` -> `enemy~calm`); a name already mapped comes back as it is. Absent: the names are the rigs'. */
  realRig?(asked: string): string;
  /** The rows of `id`'s painting as it is drawn now, or of `pose` as it would stand (`motion/Silhouette.ts`, r391-reach); absent when it cannot be read: `shape` then gives the box alone. */
  profileOf?(id: CombatantId, pose?: string): Profile | undefined;
}

/** A figure whose opacity is under this (or whose dissolve is over its complement) is not on the screen: it is nobody's obstacle or target. */
const SHOWN = 0.05;

const GHOST_FRAG = /* glsl */ `
  uniform sampler2D map;
  uniform float opacity;
  uniform float lift;
  varying vec2 vUv;
  void main() {
    vec4 t = texture2D(map, vUv);
    if (t.a < 0.04) discard;
    gl_FragColor = vec4(min(t.rgb * lift, vec3(1.0)), t.a * opacity);
  }
`;

/** One afterimage: a plane that wears a copy of the figure's transform and its texture for a moment. */
interface Ghost {
  mesh: Mesh;
  mat: ShaderMaterial;
  age: number;
}

/** How long an afterimage lasts, the gap between them, the most alive at once, and how bright they start (effect seconds). */
export const GHOST = { life: 0.22, every: 0.045, max: 5, alpha: 0.6, lift: 1.4 } as const;

interface Trail {
  ghosts: Ghost[];
  left: number;
  sinceSpawn: number;
  peak: number;
  id: CombatantId;
}

export class StageMotion implements StageMotionPort {
  private readonly truckTweens = new TweenGroup();
  private readonly scratch: Quad = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
  private readonly shift = new Vector3();
  private readonly corner = new Vector3();
  private readonly shotCam = new PerspectiveCamera();
  private readonly trails = new Map<CombatantId, Trail>();
  private geometry: PlaneGeometry | null = null;
  /** The program warm-up: one afterimage at no opacity in the scene for a few frames; its material then stays alive (see `warm`). */
  private warming: { mesh: Mesh; frames: number } | null = null;
  private warmMat: ShaderMaterial | null = null;

  constructor(private readonly o: StageMotionOptions) {}

  span(id: CombatantId): PaintedSpan | null {
    const q = this.o.quadOf(id, this.scratch);
    if (!q) return null;
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    let z = 0;
    for (const c of q) {
      if (c.x < x0) x0 = c.x;
      if (c.x > x1) x1 = c.x;
      if (c.y < y0) y0 = c.y;
      if (c.y > y1) y1 = c.y;
      z += c.z / 4;
    }
    return Number.isFinite(x0) && Number.isFinite(y0) ? { x0, x1, y0, y1, z } : null;
  }

  view(): { w: number; h: number; l?: number; r?: number; t?: number; b?: number } {
    return this.o.view();
  }

  cutRigs(runner: CombatantId): readonly string[] {
    return this.o.cutRigs?.(runner) ?? [];
  }

  /**
   * The painted box's four corners as screen points, on the camera's rest pose (the shot it is settling on, with the dolly the shot
   * holds: the action's push, round 21 PR-0364) slid by `o.truck`, and as if the figure's feet stood at `o.at`; the bounds of the
   * four. The same box `projectRect` hugs. With `o.rig`, on that rig pushed in by its `push` instead of the shot the camera is on: the
   * cut an action makes (the foe's rig at the first hit, or the master); the truck stays on through the cut (round 21, PR-0364): `o.truck` when given, else the one the camera is under.
   */
  rect(id: CombatantId, o: { at?: Spot; truck?: Spot; rig?: string; pose?: string } = {}): Rect | null {
    const q = this.o.quadOf(id, this.scratch, o.pose);
    const fig = this.o.figure(id);
    if (!q || !fig) return null;
    const rig = o.rig ? this.o.camera.rigOf(this.o.realRig?.(o.rig) ?? o.rig) : undefined;
    const cam = rig ? rigPose(this.shotCam, this.o.camera.camera, rig, this.o.camera.pushTarget) : this.o.camera.restCamera(true);
    const truck = o.truck ?? (rig ? this.o.camera.truck : undefined); // a cut keeps the truck the run is under (r391-reach: the strike after a run-in reads it as it is now)
    if (truck && (truck.x !== 0 || truck.y !== 0 || truck.z !== 0)) {
      cam.position.add(this.shift.set(truck.x, truck.y, truck.z));
      cam.updateMatrixWorld(true);
    }
    const { w, h } = this.o.view();
    const d = o.at ? this.shift.set(o.at.x - fig.position.x, o.at.y - fig.position.y, o.at.z - fig.position.z) : this.shift.set(0, 0, 0);
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const c of q) {
      this.corner.copy(c).add(d).project(cam);
      const sx = (this.corner.x * 0.5 + 0.5) * w;
      const sy = (-this.corner.y * 0.5 + 0.5) * h;
      if (sx < x0) x0 = sx;
      if (sx > x1) x1 = sx;
      if (sy < y0) y0 = sy;
      if (sy > y1) y1 = sy;
    }
    return Number.isFinite(x0) && Number.isFinite(y0) ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
  }

  /** The painted shape `rect` reads and, where the painting can be read, its rows (r391-reach); null when the figure is not shown. */
  shape(id: CombatantId, o: { at?: Spot; truck?: Spot; rig?: string; pose?: string } = {}): Shape | null {
    const fig = this.o.figure(id) as { visible?: boolean; alpha?: number; dissolveLevel?: number } | undefined;
    if (fig && (fig.visible === false || (fig.alpha ?? 1) < SHOWN || (fig.dissolveLevel ?? 0) > 1 - SHOWN)) return null;
    const rect = this.rect(id, o);
    return rect ? { rect, profile: this.o.profileOf?.(id, o.pose) } : null;
  }

  truck(dx: number, dy: number, dz: number, ms: number): Promise<void> {
    const v = this.o.camera.truck;
    this.truckTweens.killAll();
    const from = v.clone();
    const to = new Vector3(dx, dy, dz);
    if (ms <= 1) {
      v.copy(to);
      return Promise.resolve();
    }
    return this.truckTweens.toAsync(0, 1, { durationMs: ms, easing: 'quadInOut', onUpdate: (k) => void v.lerpVectors(from, to, k) });
  }

  smear(id: CombatantId, ms: number, peak = 0.6): void {
    if (this.o.lowEffects()) return;
    let t = this.trails.get(id);
    if (!t) this.trails.set(id, (t = { ghosts: [], left: 0, sinceSpawn: 1, peak, id }));
    t.left = ms / 1000;
    t.peak = peak;
  }

  /**
   * Build the smear's program before the first run needs it. A program is compiled the first frame something wearing it is
   * drawn, which cost the first run of a session 25 to 40 ms (a hitch measured in 3 of 6 fresh sessions, vsync-free). So during
   * the opening one afterimage is drawn at no opacity for a few frames and taken out again; its material is kept, so the program
   * stays cached for the run. True when it is done or not needed (LOW EFFECTS: no smear), false while the figure's painting is
   * not up yet (ask again next frame).
   */
  warm(id: CombatantId): boolean {
    if (this.warmMat || this.warming) return true;
    if (this.o.lowEffects()) return true;
    const src = this.plane(id);
    if (!src) return false;
    this.geometry ??= new PlaneGeometry(1, 1);
    const mesh = new Mesh(this.geometry, this.ghostMaterial(src.map));
    mesh.matrixAutoUpdate = false;
    mesh.frustumCulled = false;
    src.mesh.updateWorldMatrix(true, false);
    mesh.matrix.copy(src.mesh.matrixWorld);
    mesh.matrixWorldNeedsUpdate = true;
    mesh.renderOrder = src.mesh.renderOrder;
    this.o.scene.add(mesh);
    this.warming = { mesh, frames: 3 };
    return true;
  }

  /** Every frame, `dt` seconds. */
  update(dt: number): void {
    this.truckTweens.update(dt);
    for (const t of this.trails.values()) this.tick(t, dt);
    if (!this.warmMat && !this.warming) {
      const id = this.o.warmFor?.();
      if (id !== undefined) this.warm(id);
    }
    if (this.warming && --this.warming.frames <= 0) {
      this.o.scene.remove(this.warming.mesh);
      this.warmMat = this.warming.mesh.material as ShaderMaterial; // not disposed: a program lives while a material uses it
      this.warming = null;
    }
  }

  private ghostMaterial(map: Texture): ShaderMaterial {
    return new ShaderMaterial({
      uniforms: { map: { value: map }, opacity: { value: 0 }, lift: { value: GHOST.lift } },
      vertexShader: paintedVertexShader,
      fragmentShader: GHOST_FRAG,
      transparent: true,
      depthWrite: false,
    });
  }

  private tick(t: Trail, dt: number): void {
    for (const g of t.ghosts) {
      g.age += dt;
      const u = g.age / GHOST.life;
      g.mesh.visible = u < 1;
      g.mat.uniforms['opacity']!.value = GHOST.alpha * t.peak * Math.max(0, 1 - u) ** 1.3;
    }
    if (t.left > 0) {
      t.left -= dt;
      t.sinceSpawn += dt;
      if (t.sinceSpawn >= GHOST.every) {
        t.sinceSpawn = 0;
        this.spawn(t);
      }
    }
  }

  /** The visible painted plane of a figure: the mesh with a texture on it that is shown right now. */
  private plane(id: CombatantId): { mesh: Mesh; map: Texture } | null {
    const root = this.o.figure(id);
    if (!root) return null;
    let found: { mesh: Mesh; map: Texture } | null = null;
    root.traverse((n) => {
      const m = n as Mesh;
      const mat = m.material as ShaderMaterial | undefined;
      if (found || !m.isMesh || !mat?.isShaderMaterial || !mat.uniforms['map']?.value) return;
      for (let p: Object3D | null = m; p; p = p.parent) if (!p.visible) return;
      found = { mesh: m, map: mat.uniforms['map'].value as Texture };
    });
    return found;
  }

  private spawn(t: Trail): void {
    const src = this.plane(t.id);
    if (!src) return;
    let g = t.ghosts.find((x) => x.age >= GHOST.life);
    if (!g && t.ghosts.length < GHOST.max) {
      this.geometry ??= new PlaneGeometry(1, 1);
      const mat = this.ghostMaterial(src.map);
      const mesh = new Mesh(this.geometry, mat);
      mesh.matrixAutoUpdate = false;
      mesh.frustumCulled = false;
      this.o.scene.add(mesh);
      g = { mesh, mat, age: GHOST.life };
      t.ghosts.push(g);
    }
    if (!g) return;
    src.mesh.updateWorldMatrix(true, false);
    g.mesh.matrix.copy(src.mesh.matrixWorld);
    g.mesh.matrixWorldNeedsUpdate = true;
    g.mesh.renderOrder = src.mesh.renderOrder;
    g.mat.uniforms['map']!.value = src.map;
    g.age = 0;
    g.mesh.visible = true;
  }

  dispose(): void {
    this.truckTweens.killAll();
    if (this.warming) this.o.scene.remove(this.warming.mesh);
    (this.warming?.mesh.material as ShaderMaterial | undefined)?.dispose();
    this.warming = null;
    this.warmMat?.dispose();
    this.warmMat = null;
    for (const t of this.trails.values()) {
      for (const g of t.ghosts) {
        this.o.scene.remove(g.mesh);
        g.mat.dispose();
      }
    }
    this.trails.clear();
    this.geometry?.dispose();
    this.geometry = null;
  }
}
