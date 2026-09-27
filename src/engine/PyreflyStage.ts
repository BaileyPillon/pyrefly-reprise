/**
 * The stage's pyreflies (presentation plan A-5 and A-6; D-225):
 *
 * - **A-5, the dissolve.** A fiend that is sent (`pyreflyDissolves`) is eaten
 *   from the feet up with a gold burn edge (`PaintedShader`, `dissolveSweep`),
 *   and the eroding band releases pyreflies into one emitter owned by the
 *   stage, not by the figure. Removing the combatant stops the release and
 *   leaves the lights rising; they are still in the air under the results
 *   wipe, and go only when the stage is disposed (the approved tile, "they are
 *   still in the air under the results wipe").
 * - **A-6, the air.** In a location whose canon row is `attested`, a faint
 *   band of seven motes rides just in front of the lens (the tile's "a handful
 *   close enough to the lens to cross the interface itself"); every such scene
 *   already draws its own far and mid bands.
 * - **D-225, held motes.** A scene field named in `HELD_PYREFLIES` starts
 *   hidden and fades in when its combatant leaves the field (Macalania's
 *   Chamber-door motes, released by Seymour's death).
 *
 * At the `low` effects tier (low effects or reduced motion) the erosion still
 * runs but releases nothing, and the lens band is off: "Reduced motion gets a
 * short erosion with no lingering motes".
 *
 * Game case: both (plumbing); each location's row is its own game's.
 */

import { Vector3, type Camera, type Object3D } from 'three';
import { ParticleField, ParticlePresets } from './Particles.ts';
import { PyreflyEmitter } from './PyreflyEmitter.ts';
import { HELD_PYREFLIES, LENS_BAND_COUNT, pyreflyCanonFor, pyreflyDissolves } from './pyreflyCanon.ts';

/** What the stage needs from a dissolving figure (a `PaintedActor`). */
export interface DissolveSource {
  readonly dissolveLevel: number;
  contentQuad(out?: [Vector3, Vector3, Vector3, Vector3]): [Vector3, Vector3, Vector3, Vector3];
  setDissolveStyle(style: 'plain' | 'pyrefly'): void;
}

export type PyreflyTier = 'full' | 'phone' | 'low';

/** Motes a second the eroding band releases at its peak, at full density (~400 over a 620 ms KO). */
export const RELEASE_PER_S = 650;
const TIER_DENSITY: Readonly<Record<PyreflyTier, number>> = { full: 1, phone: 0.6, low: 0 };
/** Seconds a held field takes to come up once released. */
export const HELD_FADE_S = 1.5;

export class PyreflyStage {
  readonly emitter: PyreflyEmitter;
  private readonly tracked = new Map<string, DissolveSource>();
  private readonly quad: [Vector3, Vector3, Vector3, Vector3] = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
  private readonly lens: ParticleField | null;
  private readonly held: Array<{ field: Object3D & { setOpacity?(v: number): void }; releasedBy: string; opacity: number; t: number | null }> = [];
  private carry = 0;
  private rand = 7;

  constructor(
    private readonly root: Object3D,
    private readonly tier: () => PyreflyTier,
    sceneKey?: string,
    private readonly camera?: Camera,
  ) {
    this.emitter = new PyreflyEmitter({ capacity: 900 });
    root.add(this.emitter);
    this.lens = pyreflyCanonFor(sceneKey)?.verdict === 'attested' && camera ? this.makeLens() : null;
    if (this.lens) root.add(this.lens);
    this.collectHeld();
  }

  /** A combatant has been staged: a fiend that is sent gets the pyrefly dissolve. */
  stage(id: string, side: string, actor: DissolveSource): void {
    if (side !== 'enemy' || !pyreflyDissolves(id)) return;
    // A stand-in figure (a test's fake actor) that cannot dissolve is left alone.
    if (typeof actor.setDissolveStyle !== 'function' || typeof actor.contentQuad !== 'function') return;
    actor.setDissolveStyle('pyrefly');
    this.tracked.set(id, actor);
  }

  /** A combatant has left the field: its release stops, its lights stay, and anything it held back comes up. */
  leave(id: string): void {
    this.tracked.delete(id);
    for (const h of this.held) if (h.releasedBy === id && h.t === null) h.t = 0;
  }

  /** Who is tracked (tests, debug). */
  get trackedIds(): string[] {
    return [...this.tracked.keys()];
  }

  /**
   * @param dt seconds
   * @param alive whether a combatant is still standing (the engine's state):
   *   a held field comes up at its combatant's KO, since Seymour's body stays
   *   on the field and never leaves it.
   */
  update(dt: number, alive?: (id: string) => boolean): void {
    if (alive) for (const h of this.held) if (h.t === null && !alive(h.releasedBy)) h.t = 0;
    const dens = TIER_DENSITY[this.tier()] ?? 0;
    for (const actor of this.tracked.values()) {
      const d = actor.dissolveLevel;
      if (d <= 0 || d >= 1 || dens <= 0) continue;
      this.release(actor, d, dens, dt);
    }
    this.emitter.update(dt);
    this.updateLens();
    for (const h of this.held) {
      if (h.t === null) continue;
      h.t = Math.min(HELD_FADE_S, h.t + dt);
      h.field.visible = true;
      h.field.setOpacity?.(h.opacity * (h.t / HELD_FADE_S));
    }
  }

  private next(): number {
    this.rand = (Math.imul(this.rand, 1664525) + 1013904223) >>> 0;
    return this.rand / 4294967296;
  }

  /** Release motes along the band the erosion is eating (the shader's noise*0.56 + height*0.44 = level). */
  private release(actor: DissolveSource, d: number, dens: number, dt: number): void {
    const [bl, br, , tl] = actor.contentQuad(this.quad);
    this.carry += RELEASE_PER_S * dens * (0.25 + 0.75 * Math.sin(Math.PI * d)) * dt;
    const lo = Math.max(0, (d - 0.56) / 0.44);
    const hi = Math.min(1, d / 0.44);
    while (this.carry >= 1) {
      this.carry -= 1;
      const u = 0.2 + this.next() * 0.6;
      const v = lo + this.next() * Math.max(0.02, hi - lo);
      this.emitter.spawn({
        x: bl.x + (br.x - bl.x) * u + (tl.x - bl.x) * v,
        y: bl.y + (br.y - bl.y) * u + (tl.y - bl.y) * v,
        z: bl.z + (br.z - bl.z) * u + (tl.z - bl.z) * v + 0.05,
      });
    }
  }

  /** The lens band: a faint handful, drawn large and soft just in front of the camera. */
  private makeLens(): ParticleField {
    const f = new ParticleField(
      ParticlePresets.pyreflies({
        count: LENS_BAND_COUNT,
        bounds: { x: 1.4, y: 0.8, z: 0.5 },
        colors: [0xfff6d2, 0xffedb8, 0xe9fff4],
        size: 3.2,
        drift: [0.02, 0.08, 0],
        wobble: [0.3, 0.12, 0.1],
        wobbleSpeed: 0.3,
        twinkle: 0.5,
        opacity: 0.16,
      }),
    );
    f.name = 'pyreflies:lens-band';
    return f;
  }

  private readonly fwd = new Vector3();
  private updateLens(): void {
    if (!this.lens || !this.camera) return;
    this.lens.visible = this.tier() !== 'low';
    this.camera.getWorldDirection(this.fwd);
    this.lens.position.copy(this.camera.position).addScaledVector(this.fwd, 2.6);
  }

  /** Find the scene's held fields (`HELD_PYREFLIES`) and hide them until their beat. */
  private collectHeld(): void {
    this.root.traverse((o) => {
      const by = Object.hasOwn(HELD_PYREFLIES, o.name) ? HELD_PYREFLIES[o.name] : undefined;
      if (!by) return;
      const field = o as Object3D & { setOpacity?(v: number): void; material?: { uniforms?: Record<string, { value: unknown }> } };
      const opacity = Number(field.material?.uniforms?.['uOpacity']?.value ?? 1);
      field.visible = false;
      this.held.push({ field, releasedBy: by, opacity, t: null });
    });
  }

  /** For the debug snapshot and the capture script. */
  snapshot(): { motes: number; tracked: string[]; lens: boolean; held: Array<{ name: string; visible: boolean }> } {
    return {
      motes: this.emitter.alive,
      tracked: this.trackedIds,
      lens: !!this.lens?.visible,
      held: this.held.map((h) => ({ name: h.field.name, visible: h.field.visible })),
    };
  }

  setPixelScale(v: number): void {
    this.emitter.setPixelScale(v);
    this.lens?.setPixelScale(v);
  }

  dispose(): void {
    this.tracked.clear();
    this.emitter.dispose();
    this.lens?.dispose();
  }
}
