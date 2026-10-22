/**
 * Demo looks, BOLD strength (`?lookstrength=bold`; dev flag only; nothing ships): the per-frame work of the bold pass (`LookBoldShader.ts`). It finds every painted figure in the
 * scene (the way `fx/b/Figures.ts` does: a plane whose actor has a `worldHeight`), reads each one's base width from its painting's alpha (once per painting, a 128 px copy),
 * projects its feet on the floor to the frame, and hands the shader the ellipse under it, its half width and height for the reflection, and the floor pools of this frame's
 * spells. It also loads the room's backdrop depth map (`D:/pyrefly-art-maps`: `backdrops/<room>.depth.png`, served next to the painting) and the homography that takes a
 * frame pixel to the painting's uv, and places the room's lamps for embers. Both games; each room's gloss, fog colour and lamps are `LookBoldConfig.ROOM_BOLD`.
 */
import { Matrix3, Texture, TextureLoader, LinearFilter, NoColorSpace, Vector3, Vector4, type Camera, type Mesh, type Object3D, type PlaneGeometry, type Scene, type ShaderMaterial } from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { artUrl } from '../PaintedArt.ts';
import { artManifest } from '../ArtManifest.ts';
import { depthMapListed } from '../ArtManifestMaps.ts';
import type { Renderer } from '../Renderer.ts';
import { QUALITY_COST, type LookName, type LookQuality } from './LookConfig.ts';
import { BOLD_FX, baseExtents, easeStage, invert3, reflectAmount, roomBold, shadowAmount, squareToQuad, stageEllipse, type Extents } from './LookBoldConfig.ts';
import { LookBoldShader } from './LookBoldShader.ts';
import { lightColour } from './LookMaths.ts';
import { lin, type LookRoom } from './LookRoom.ts';
import type { RelightLights } from './relight/RelightLights.ts';
import { eyeCandy } from '../fx/EyeCandy.ts';
import { LookFlare, type FlareUniforms } from './flare/LookFlare.ts';

const MAX_FIG = 8;
const MAX_POOL = 4;
const MAX_EMB = 6;
const EMBER_PARTS: Record<LookQuality, number> = { high: 7, medium: 4, low: 3 };
const DEFAULT_EXT: Extents = { top: 0.04, bottom: 0.98, left: 0.2, right: 0.8, baseLeft: 0.34, baseRight: 0.66 };

interface Tracked {
  slot: Mesh;
  actor: Object3D;
}

const scratch = { c: new Vector3(), x: new Vector3(), y: new Vector3(), f: new Vector3(), g: new Vector3(), p: new Vector3(), q: new Vector3() };
const actorOf = (o: Object3D): Object3D | null => {
  for (let n: Object3D | null = o; n; n = n.parent) if ('worldHeight' in n) return n;
  return null;
};
const shown = (o: Object3D): boolean => {
  for (let n: Object3D | null = o; n; n = n.parent) if (!n.visible) return false;
  return true;
};

export class LookBold {
  pass: ShaderPass | null = null;
  private readonly tracked = new Map<Mesh, Tracked>();
  private scanLeft = 0;
  private scene: Scene | null = null;
  private roomKey = '';
  private depth: Texture | 'loading' | 'missing' | null = null;
  private readonly ext = new Map<string, Extents | null>();
  private canvas: HTMLCanvasElement | null = null;
  private quality: LookQuality | null = null;
  private readonly homo = new Matrix3();
  private stage: { cx: number; cy: number; rx: number; ry: number } | null = null;
  /** Every visible actor's screen box (x0, y0, x1, y1 in frame uv), padded: the blur keeps them sharp (`LookBlurShader`). */
  readonly boxes: Vector4[] = Array.from({ length: MAX_FIG }, () => new Vector4());
  boxCount = 0;
  /** For the debug API and the captures. */
  /** Release 62 (decision 173b, FFX-2): Mega Flare's flood and white-out, fed from the spell layer's landing taps while this pass is on. */
  readonly flare = new LookFlare();
  readonly stats = { on: false, figures: 0, pools: 0, depth: 'none' as string, gloss: 0, embers: 0, fig: [] as number[][], homo: [] as number[] };

  constructor(private readonly r: Renderer) {}

  private defines(q: LookQuality): Record<string, string | number> {
    const c = QUALITY_COST[q];
    return { MAX_FIG, MAX_POOL, MAX_EMB, EMBER_PARTS: EMBER_PARTS[q], FOG_OCTAVES: Math.max(2, c.fogOctaves), EDGE_TAPS: c.edgeTaps };
  }

  /** Build the pass now (the battle screen's warm-up compiles it before the first frame); `update` finds it there. */
  prepare(q: LookQuality): void {
    this.ensure(q);
  }

  private ensure(q: LookQuality): ShaderPass {
    if (!this.pass) {
      const p = new ShaderPass({ ...LookBoldShader, defines: this.defines(q) } as never);
      const u = p.uniforms;
      u['uFigA']!.value = Array.from({ length: MAX_FIG }, () => new Vector4());
      u['uFigB']!.value = Array.from({ length: MAX_FIG }, () => new Vector4());
      u['uPoolA']!.value = Array.from({ length: MAX_POOL }, () => new Vector4());
      u['uPoolC']!.value = Array.from({ length: MAX_POOL }, () => new Vector4());
      u['uEmber']!.value = Array.from({ length: MAX_EMB }, () => new Vector3());
      p.enabled = false;
      const passes = this.r.composer.passes;
      const gi = passes.indexOf(this.r.gradePass);
      this.r.composer.insertPass(p, gi < 0 ? passes.length : gi);
      this.pass = p;
      this.quality = q;
    } else if (this.quality !== q) {
      this.quality = q;
      this.pass.material.defines = this.defines(q);
      this.pass.material.needsUpdate = true;
    }
    return this.pass;
  }

  // ----------------------------------------------------------------- figures

  private scan(scene: Scene): void {
    const live = new Set<Mesh>();
    scene.traverse((o) => {
      const m = o as Mesh;
      const mat = m.material as ShaderMaterial | undefined;
      if (!m.isMesh || !mat || !(mat as { isShaderMaterial?: boolean }).isShaderMaterial || m.userData['fxb']) return;
      const u = mat.uniforms;
      if (!u || !u['map'] || !u['opacity'] || u['uStrength']) return;
      const actor = actorOf(m);
      if (!actor) return;
      live.add(m);
      if (!this.tracked.has(m)) this.tracked.set(m, { slot: m, actor });
    });
    for (const m of [...this.tracked.keys()]) if (!live.has(m)) this.tracked.delete(m);
  }

  /** A figure's extents from its painting's alpha, cached per texture; null while the image is not there (a placeholder), the default stands in. */
  private extentsOf(tex: Texture | null): Extents {
    const img = tex?.image as (CanvasImageSource & { width: number; height: number }) | undefined;
    if (!tex || !img || !(img.width > 8) || !(img.height > 8)) return DEFAULT_EXT;
    const key = `${tex.uuid}:${img.width}x${img.height}`;
    if (this.ext.has(key)) return this.ext.get(key) ?? DEFAULT_EXT;
    let e: Extents | null = null;
    try {
      const c = (this.canvas ??= document.createElement('canvas'));
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.clearRect(0, 0, 128, 128);
        ctx.drawImage(img, 0, 0, 128, 128);
        const d = ctx.getImageData(0, 0, 128, 128).data;
        const a = new Uint8Array(128 * 128);
        for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3]!;
        e = baseExtents(a, 128, 128);
      }
    } catch {
      e = null;
    }
    if (this.ext.size > 400) this.ext.clear();
    this.ext.set(key, e);
    return e ?? DEFAULT_EXT;
  }

  /** The figures into `uFigA` / `uFigB`; returns how many. */
  private figures(cam: Camera, aspect: number, fx: (typeof BOLD_FX)['hd2d'], gloss: number, A: Vector4[], B: Vector4[]): number {
    const { c, x, y, f, g, p, q } = scratch;
    let n = 0;
    for (const t of this.tracked.values()) {
      if (n >= MAX_FIG) break;
      const mat = t.slot.material as ShaderMaterial;
      const op = (mat.uniforms['opacity']?.value as number | undefined) ?? 1;
      const dis = (mat.uniforms['dissolve']?.value as number | undefined) ?? 0;
      const vis = Math.max(0, Math.min(1, op)) * (1 - Math.max(0, Math.min(1, dis)));
      if (vis < 0.05 || !shown(t.slot)) continue;
      t.slot.updateWorldMatrix(true, false);
      const e = t.slot.matrixWorld.elements;
      c.set(e[12]!, e[13]!, e[14]!);
      x.set(e[0]!, e[1]!, e[2]!);
      y.set(e[4]!, e[5]!, e[6]!);
      const W = x.length();
      const H = y.length();
      if (H < 1e-3 || y.y / H < 0.5) continue; // not standing: a KO tip, a lying body
      t.actor.getWorldPosition(f);
      const foot = Math.min(0.9, Math.max(0, 0.5 + (f.y - c.y) / y.y));
      const ex = this.extentsOf(mat.uniforms['map']!.value as Texture | null);
      const topV = 1 - ex.top;
      const gap = Math.max(0, 1 - ex.bottom - foot);
      const baseC = (ex.baseLeft + ex.baseRight) / 2;
      const hwBase = Math.max(0.1, ((ex.baseRight - ex.baseLeft) / 2) * 1.2 + 0.03) * W;
      const hwFull = ((ex.right - ex.left) / 2) * W;
      // the point on the floor under the figure's base
      g.set(c.x + x.x * (baseC - 0.5) + y.x * (foot - 0.5), 0.014, c.z + x.z * (baseC - 0.5) + y.z * (foot - 0.5));
      p.copy(g).project(cam);
      const gu = p.x * 0.5 + 0.5;
      const gv = p.y * 0.5 + 0.5;
      if (p.z > 1 || gu < -0.3 || gu > 1.3) continue;
      // the base's radii on the screen: along the floor's two axes
      let rx = 0;
      let ry = 0;
      for (const [ox, oz] of [[hwBase, 0], [0, hwBase]] as const) {
        q.set(g.x + ox, g.y, g.z + oz).project(cam);
        rx = Math.max(rx, Math.abs(q.x - p.x) * 0.5 * aspect);
        ry = Math.max(ry, Math.abs(q.y - p.y) * 0.5);
      }
      q.set(g.x + hwFull, g.y, g.z).project(cam);
      const halfW = Math.abs(q.x - p.x) * 0.5 * aspect;
      q.set(c.x + y.x * (topV - 0.5), c.y + y.y * (topV - 0.5), c.z + y.z * (topV - 0.5)).project(cam);
      const heightV = Math.max(0.02, q.y * 0.5 + 0.5 - gv);
      const lift = Math.max(0, f.y);
      // the figure's box on the screen: its opaque painting's four corners, padded a little
      let bx0 = 9;
      let by0 = 9;
      let bx1 = -9;
      let by1 = -9;
      for (const [cu, cv] of [[ex.left, 1 - ex.bottom], [ex.right, 1 - ex.bottom], [ex.right, 1 - ex.top], [ex.left, 1 - ex.top]] as const) {
        q.set(c.x + x.x * (cu - 0.5) + y.x * (cv - 0.5), c.y + x.y * (cu - 0.5) + y.y * (cv - 0.5), c.z + x.z * (cu - 0.5) + y.z * (cv - 0.5)).project(cam);
        bx0 = Math.min(bx0, q.x * 0.5 + 0.5);
        bx1 = Math.max(bx1, q.x * 0.5 + 0.5);
        by0 = Math.min(by0, q.y * 0.5 + 0.5);
        by1 = Math.max(by1, q.y * 0.5 + 0.5);
      }
      const bpx = (bx1 - bx0) * 0.06;
      const bpy = (by1 - by0) * 0.05;
      this.boxes[n]!.set(bx0 - bpx, by0 - bpy, bx1 + bpx, by1 + bpy);
      A[n]!.set(gu, gv, Math.max(rx, 0.01), Math.max(ry, 0.004));
      B[n]!.set(shadowAmount(fx.shadow.strength, vis, lift, gap), gloss > 0 ? reflectAmount(1, vis, lift, gap) : 0, halfW, heightV);
      n++;
    }
    this.boxCount = n;
    for (let i = n; i < MAX_FIG; i++) {
      A[i]!.set(0, 0, 1, 1);
      B[i]!.set(0, 0, 0, 0);
    }
    return n;
  }

  // ----------------------------------------------------------------- the painting: depth map, homography, lamps

  private loadDepth(key: string): void {
    // release 60: the art manifest names the depth maps the build ships; a room with none is not asked for one (no 404). No lightMaps in it: ask, as before.
    if (depthMapListed(artManifest(), key) === false) {
      this.depth = 'missing';
      return;
    }
    this.depth = 'loading';
    const url = artUrl(`art/backdrops/${key}.depth.png`);
    new TextureLoader().load(
      url,
      (t) => {
        if (key !== this.roomKey) return t.dispose();
        t.colorSpace = NoColorSpace;
        t.minFilter = t.magFilter = LinearFilter;
        t.generateMipmaps = false;
        t.needsUpdate = true;
        this.depth = t;
      },
      undefined,
      () => {
        if (key === this.roomKey) this.depth = 'missing';
      },
    );
  }

  /** The painting's corners on the frame, and the map frame -> painting uv (u from the left, v from the bottom) into `homo`; returns the painting's height on the frame. */
  private paintingMap(mesh: Mesh, cam: Camera): number {
    const geo = mesh.geometry as PlaneGeometry;
    const W = geo.parameters?.width ?? 0;
    const H = geo.parameters?.height ?? 0;
    if (!(W > 0)) return 1;
    mesh.updateWorldMatrix(true, false);
    const q: number[] = [];
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
      scratch.p.set((sx * W) / 2, (sy * H) / 2, 0).applyMatrix4(mesh.matrixWorld).project(cam);
      q.push(scratch.p.x * 0.5 + 0.5, scratch.p.y * 0.5 + 0.5);
    }
    const inv = invert3(squareToQuad(q));
    this.homo.set(inv[0]!, inv[1]!, inv[2]!, inv[3]!, inv[4]!, inv[5]!, inv[6]!, inv[7]!, inv[8]!);
    return Math.abs(q[5]! - q[1]!);
  }

  // ----------------------------------------------------------------- per frame

  update(o: { scene: Scene; camera: Camera; name: LookName; room: LookRoom; lights: RelightLights; quality: LookQuality; dt: number; time: number; now?: number; scale: number; W: number; H: number; aspect: number; lightUv: [number, number]; tweak: (k: string, v: number) => number }): void {
    const { scene, camera, room, lights } = o;
    const look = o.name === 'cinematic' ? 'cinematic' : 'hd2d';
    const fx = BOLD_FX[look];
    const rb = roomBold(room.key);
    const pass = this.ensure(o.quality);
    pass.enabled = true;
    if (scene !== this.scene) {
      this.scene = scene;
      this.tracked.clear();
      this.scanLeft = 0;
    }
    if (room.key !== this.roomKey) {
      this.roomKey = room.key;
      this.depth = null;
    }
    if (this.depth === null) this.loadDepth(room.key);
    this.scanLeft -= o.dt;
    if (this.scanLeft <= 0 || this.tracked.size === 0) {
      this.scanLeft = 0.5;
      this.scan(scene);
    }
    camera.updateMatrixWorld();
    const u = pass.uniforms;
    const gloss = rb.gloss * o.tweak('bold.gloss', 1);
    const n = this.figures(camera, o.aspect, { ...fx, shadow: { ...fx.shadow, strength: fx.shadow.strength * o.tweak('bold.shadow', 1) } }, gloss, u['uFigA']!.value as Vector4[], u['uFigB']!.value as Vector4[]);
    // the stage light: an ellipse round the fight, eased so a figure arriving or leaving never makes it jump
    const FA0 = u['uFigA']!.value as Vector4[];
    const goal = stageEllipse(FA0.slice(0, n).map((a) => [a.x, a.y] as const), o.aspect);
    this.stage = this.stage ? easeStage(this.stage, goal, Math.min(1, o.dt * 5)) : goal;
    (u['stage']!.value as Vector4).set(this.stage.cx, this.stage.cy, this.stage.rx, this.stage.ry);
    (u['stageAmt']!.value as { set(x: number, y: number): void }).set(fx.stage.dark * o.tweak('bold.stage', 1), fx.stage.lift * o.tweak('bold.stage', 1));
    (u['resolution']!.value as { set(x: number, y: number): void }).set(1 / Math.max(1, o.W), 1 / Math.max(1, o.H));
    u['time']!.value = o.time;
    u['pxScale']!.value = o.scale;
    u['aspect']!.value = o.aspect;
    (u['uLight']!.value as { set(x: number, y: number): void }).set(o.lightUv[0], o.lightUv[1]);
    (u['lightColor']!.value as Vector3).set(...lin(lightColour(room.light.color)));
    (u['shadowP']!.value as { set(x: number, y: number): void }).set(fx.shadow.core, 0.25);
    (u['shadowColor']!.value as Vector3).set(...(rb.shadow ?? [0.2, 0.22, 0.3]));
    (u['refl']!.value as Vector4).set(fx.reflect.amount * gloss, fx.reflect.length, fx.reflect.blur, fx.reflect.squash);
    // the fog
    const fs = (rb.fogScale ?? 1) * o.tweak('bold.fog', 1);
    (u['depthFog']!.value as { set(x: number, y: number): void }).set(fx.depthFog.density * fs, fx.depthFog.start);
    (u['heightFog']!.value as Vector3).set(fx.heightFog.density * fs, fx.heightFog.height, fx.heightFog.feet);
    (u['fogColor']!.value as Vector3).set(...(rb.fog ? lin(rb.fog) : room.fogRgb));
    const mesh = room.painting;
    let pv = 1;
    if (mesh) pv = this.paintingMap(mesh, camera);
    const tex = this.depth instanceof Texture ? this.depth : null;
    u['uDepth']!.value = tex;
    u['depthOn']!.value = tex && mesh ? 1 : 0;
    (u['uHomo']!.value as Matrix3).copy(this.homo);
    // pools: the same lights as the figures' own, at the targets' feet
    const PA = u['uPoolA']!.value as Vector4[];
    const PC = u['uPoolC']!.value as Vector4[];
    for (let i = 0; i < MAX_POOL; i++) {
      const p = lights.pools[i];
      if (p) {
        PA[i]!.set(p.u, p.v, p.reach, p.reach * 0.36);
        const c = lin(p.c as [number, number, number]);
        PC[i]!.set(c[0], c[1], c[2], p.s);
      } else PC[i]!.w = 0;
    }
    u['poolGain']!.value = fx.pool.gain * o.tweak('bold.pool', 1);
    // rim, in the room's key colour
    (u['bRim']!.value as Vector3).set(fx.rim.gain * o.tweak('bold.rim', 1), fx.rim.width * o.scale, fx.rim.lit);
    (u['rimColor']!.value as Vector3).set(...lin(rb.rim ?? lightColour(room.light.color, 0.05)));
    // embers over the room's lamps (the painting's own uv to the frame)
    const E = u['uEmber']!.value as Vector3[];
    let ne = 0;
    if (mesh && rb.embers.length) {
      const g = mesh.geometry as PlaneGeometry;
      const W = g.parameters?.width ?? 0;
      const H = g.parameters?.height ?? 0;
      for (const [eu, ev] of rb.embers) {
        if (ne >= MAX_EMB) break;
        scratch.q.set((eu - 0.5) * W, (0.5 - ev) * H, 0).applyMatrix4(mesh.matrixWorld).project(camera);
        E[ne]!.set(scratch.q.x * 0.5 + 0.5, scratch.q.y * 0.5 + 0.5, 0.075 * Math.max(0.3, pv));
        ne++;
      }
    }
    u['emberN']!.value = ne;
    this.flare.install(); // release 62 (FFX-2): Mega Flare's flood and white-out; REDUCE FLASHES takes the white-out away and caps the flood (`flare/FlareConfig.ts`)
    this.flare.update(o.now ?? performance.now() / 1000, eyeCandy.reduceFlashes, u as unknown as FlareUniforms, o.tweak('flare', 1));
    (u['ember']!.value as Vector3).set(fx.embers.gain * o.tweak('bold.embers', 1), (fx.embers.size * o.scale) / Math.max(1, o.H), fx.embers.rate);
    this.stats.on = true;
    this.stats.figures = n;
    this.stats.pools = lights.pools.length;
    this.stats.depth = this.depth === null ? 'none' : typeof this.depth === 'string' ? this.depth : 'loaded';
    this.stats.gloss = gloss;
    this.stats.embers = ne;
    const FA = u['uFigA']!.value as Vector4[];
    const FB = u['uFigB']!.value as Vector4[];
    this.stats.fig = FA.slice(0, n).map((a, i) => [a.x, a.y, a.z, a.w, FB[i]!.x, FB[i]!.y, FB[i]!.z, FB[i]!.w].map((v) => Math.round(v * 1000) / 1000));
    this.stats.homo = this.homo.elements.map((v) => Math.round(v * 1000) / 1000);
  }

  off(): void {
    this.flare.off(this.pass ? (this.pass.uniforms as unknown as FlareUniforms) : undefined);
    if (this.pass) this.pass.enabled = false;
    this.stats.on = false;
  }

  dispose(): void {
    if (this.pass) {
      this.r.composer.removePass(this.pass);
      this.pass.dispose();
      this.pass = null;
    }
    if (this.depth instanceof Texture) this.depth.dispose();
    this.depth = null;
    this.tracked.clear();
  }
}
