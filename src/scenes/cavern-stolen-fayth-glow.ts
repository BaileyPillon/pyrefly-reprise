import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { artUrl } from '../engine/PaintedArt.ts';
import { PyreflyEmitter } from '../engine/PyreflyEmitter.ts';
import { GLOW_MOTES, loadUnsentArt, type UnsentArt } from '../engine/fx/unsentGlow.ts';
import { glowPlan, haloLevel, liveGlowSwitches, type GlowSwitches } from '../engine/fx/unsentGlowPlan.ts';
import { eyeCandy } from '../engine/fx/EyeCandy.ts';
import { lcg } from '../engine/fx/unsentOutline.ts';

// ---------------------------------------------------------------------------
// Lady Ginnem's unsent glow (presentation plan A-9; FFX only, Chapter IX)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]: Lady Ginnem is Chapter IX's unsent and no FFX-2
// chapter stands in this chamber.
//
// On whose word: the approved tile "Lady Ginnem, unsent (FFX)" (O-3 B, D-060; Bailey 2026-09-24, "All
// your recommendations"): "a pyrefly glow and motes on her outline - not A (solid) or C (half-formed)",
// "she reads as unsent without losing her face". The plan's wording: "an additive mote shell on Ginnem's
// outline, plus slow alpha breathing. It reuses the A-5 emitter, so there is one pyrefly system."
//
// What it draws, both in the scene's own group (the stage's figures are read, never written):
//   - a halo plate behind her: her silhouette blurred wide and tinted cool white, with the body cut out
//     (`engine/fx/unsentGlow.ts`), laid over the painting through `PaintedActor.contentQuad` so it follows
//     her idle breath; its opacity breathes slowly;
//   - a shell of motes born on the body's edge, drifting out and up for 2.4 to 4.2 s: the A-5 emitter
//     (`PyreflyEmitter`), cool whites, small.
// Her painting already carries a baked rim glow and 140 static motes (the O-3 B pick, `idle.json`); the
// live layer adds the breathing and the sparks on top of it, and is the part the EYE CANDY seam owns
// (`engine/fx/unsentGlowPlan.ts`: LIVING PAINTINGS, REDUCE MOTION, tiers).

/** The duck-typed part of a staged `PaintedActor` the glow reads. */
export interface GlowFigure {
  readonly visible: boolean;
  readonly alpha?: number;
  contentQuad?(out?: [Vector3, Vector3, Vector3, Vector3]): [Vector3, Vector3, Vector3, Vector3];
}

/** Ginnem's idle painting (`public/art/characters/ginnem/idle.png`, 757 x 1164). */
export const GINNEM_ART = 'art/characters/ginnem/idle.png';

/** The halo sits this far behind the painting's plane (world units; the camera looks down -z). */
const HALO_BEHIND = 0.04;
/** The halo's strongest opacity. */
const HALO_PEAK = 0.95;

/**
 * Painting pixel (`px`, `py`; y down, origin top-left) to world space, through the content quad
 * (bottom-left, bottom-right, top-right, top-left, as `PaintedActor.contentQuad` lays them) and the box in
 * painting pixels that quad stands for. Valid for a mirrored figure too: the quad is in the painting's own frame.
 */
export function paintingToWorld(
  px: number,
  py: number,
  quad: readonly [Vector3, Vector3, Vector3, Vector3],
  box: { x0: number; x1: number; y0: number; y1: number },
  out: Vector3 = new Vector3(),
): Vector3 {
  const [bl, br, , tl] = quad;
  const a = (px - box.x0) / Math.max(1e-6, box.x1 - box.x0);
  const b = (box.y1 - py) / Math.max(1e-6, box.y1 - box.y0);
  return out.set(
    bl.x + (br.x - bl.x) * a + (tl.x - bl.x) * b,
    bl.y + (br.y - bl.y) * a + (tl.y - bl.y) * b,
    bl.z + (br.z - bl.z) * a + (tl.z - bl.z) * b,
  );
}

export class GinnemGlow {
  readonly group = new Group();
  readonly emitter: PyreflyEmitter;
  private art: UnsentArt | null = null;
  private loading = false;
  private tex: CanvasTexture | null = null;
  private mat: MeshBasicMaterial | null = null;
  private halo: Mesh | null = null;
  private readonly quad: [Vector3, Vector3, Vector3, Vector3] = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
  private readonly p = new Vector3();
  private readonly q = new Vector3();
  private readonly rand = lcg(31);
  private t = 0;
  private carry = 0;
  private disposed = false;

  constructor(private readonly url: string = artUrl(GINNEM_ART)) {
    this.group.name = 'ginnem-glow';
    this.emitter = new PyreflyEmitter({ capacity: 320, colours: GLOW_MOTES, opacity: 0.95, seed: 31 });
    this.emitter.name = 'ginnem-glow-motes';
    this.group.add(this.emitter);
  }

  /** The render-height scale, as every mote layer takes it. */
  setPixelScale(v: number): void {
    this.emitter.setPixelScale(v);
  }

  /** Is the art in (the plate is built and the outline read)? For the tests and the capture script. */
  get ready(): boolean {
    return this.art !== null;
  }

  private ensureArt(): void {
    if (this.art || this.loading || this.disposed) return;
    this.loading = true;
    void loadUnsentArt(this.url).then((a) => {
      this.loading = false;
      if (!a || this.disposed) return;
      this.art = a;
      this.buildHalo(a);
    });
  }

  private buildHalo(a: UnsentArt): void {
    const tex = new CanvasTexture(a.glow);
    tex.colorSpace = SRGBColorSpace;
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array(12), 3));
    geo.setAttribute('uv', new BufferAttribute(new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]), 2));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    const mat = new MeshBasicMaterial({
      map: tex,
      color: new Color(0.62, 0.68, 0.76), // additive over a dark floor: pushed past 1 so the rim reads at her small size
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: DoubleSide, // the plate may be wound either way once the figure is mirrored
      blending: AdditiveBlending,
      fog: false,
      toneMapped: false,
    });
    const halo = new Mesh(geo, mat);
    halo.frustumCulled = false;
    halo.visible = false;
    halo.name = 'ginnem-glow-halo';
    this.tex = tex;
    this.mat = mat;
    this.halo = halo;
    this.group.add(halo);
  }

  /**
   * One frame. `figure` is Ginnem's staged actor, or null when she is not on this field.
   * @param dt seconds
   */
  update(dt: number, figure: GlowFigure | null, sw: GlowSwitches = liveGlowSwitches()): void {
    if (this.disposed) return;
    if (eyeCandy.frozen) dt = 0;
    this.t += dt;
    const plan = glowPlan(sw);
    this.emitter.visible = plan.halo; // look off: the motes in the air go at once, not after their 4 s
    this.emitter.update(dt);
    const art = this.art;
    const live = !!figure && figure.visible && typeof figure.contentQuad === 'function' && plan.halo;
    if (live) this.ensureArt();
    if (!live || !art || !art.box || !this.halo || !this.mat) {
      if (this.halo) this.halo.visible = false;
      return;
    }
    const quad = figure.contentQuad!(this.quad);
    const alpha = figure.alpha ?? 1;
    this.halo.visible = alpha > 0.01;
    this.mat.opacity = HALO_PEAK * haloLevel(this.t, plan) * alpha;
    this.layHalo(art, quad);
    if (plan.moteRate > 0 && dt > 0 && alpha > 0.5) this.shed(art, quad, plan.moteRate * dt);
  }

  /** Lay the plate over the painting: its four corners, the painting grown by the margin. */
  private layHalo(art: UnsentArt, quad: [Vector3, Vector3, Vector3, Vector3]): void {
    const pos = (this.halo!.geometry.getAttribute('position') as BufferAttribute);
    const m = art.margin;
    const box = art.box!;
    const corners: Array<[number, number]> = [[-m, -m], [art.w + m, -m], [art.w + m, art.h + m], [-m, art.h + m]];
    for (let i = 0; i < 4; i++) {
      paintingToWorld(corners[i]![0], corners[i]![1], quad, box, this.p);
      pos.setXYZ(i, this.p.x, this.p.y, this.p.z - HALO_BEHIND);
    }
    pos.needsUpdate = true;
  }

  /** Release motes on the edge: `n` of them on average this frame. */
  private shed(art: UnsentArt, quad: [Vector3, Vector3, Vector3, Vector3], n: number): void {
    const r = this.rand;
    this.carry += n;
    const box = art.box!;
    while (this.carry >= 1) {
      this.carry -= 1;
      const o = art.outline[Math.floor(r() * art.outline.length)]!;
      const px = o.u * art.w;
      const py = o.v * art.h;
      paintingToWorld(px, py, quad, box, this.p);
      // Outward in the painting's frame (y down) laid onto the quad's axes.
      paintingToWorld(px + o.nx * 40, py + o.ny * 40, quad, box, this.q);
      this.q.sub(this.p).normalize();
      const out = 0.03 + r() * 0.09;
      this.emitter.spawn({
        x: this.p.x + (r() - 0.5) * 0.02,
        y: this.p.y + (r() - 0.5) * 0.02,
        z: this.p.z + 0.03,
        vx: this.q.x * out,
        vy: this.q.y * out + 0.06 + r() * 0.2,
        vz: 0,
        life: 2.4 + r() * 1.8,
        size: 6 + r() * 7,
      });
    }
  }

  /** For the debug snapshot and the capture script. */
  snapshot(): { ready: boolean; halo: boolean; haloOpacity: number; motes: number } {
    return { ready: this.ready, halo: !!this.halo?.visible, haloOpacity: this.mat?.opacity ?? 0, motes: this.emitter.alive };
  }

  dispose(): void {
    this.disposed = true;
    this.emitter.dispose();
    this.halo?.geometry.dispose();
    this.mat?.dispose();
    this.tex?.dispose();
    this.group.removeFromParent();
    this.group.clear();
  }
}
